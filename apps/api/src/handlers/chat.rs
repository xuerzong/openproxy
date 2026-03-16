use axum::{
    Extension, Json,
    extract::{Request, State},
    response::{IntoResponse, Response, Sse, sse::Event},
};
use futures_util::{Stream, StreamExt, io};
use reqwest::StatusCode;
use serde_json::Value;
use std::sync::Arc;
use tokio_util::{
    bytes,
    codec::{FramedRead, LinesCodec},
};

use crate::utils::chat::{
    UsageStyle, extract_usage_input_with_tokens, remove_provider_metadata_fields,
    rewrite_usage_field,
};
use crate::utils::provider_adapter::ProviderAdapterFactory;

use crate::{
    models::provider::ModelAccessResult,
    services::{self, usage::find_usage_recursive},
    shared::ApiResponse,
    shared::AppState,
};

pub async fn chat_handler(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<ModelAccessResult>,
    req: Request,
) -> Result<Response, Response> {
    let start_time = std::time::Instant::now();
    let req_path = req.uri().path().to_string();
    let target_style = if req_path.contains("/messages") {
        UsageStyle::Anthropic
    } else {
        UsageStyle::OpenAI
    };

    // Extract headers early because req will be consumed by into_body()
    let original_headers = req.headers().clone();

    let body_bytes = axum::body::to_bytes(req.into_body(), 10 * 1024 * 1024)
        .await
        .map_err(|e| {
            ApiResponse::<()>::error(&format!("Invalid Body: {}", e), "BAD_REQUEST")
                .to_res(StatusCode::BAD_REQUEST)
        })?;

    let body_json: Value = serde_json::from_slice(&body_bytes).map_err(|e| {
        ApiResponse::<()>::error(&format!("Invalid Body: {}", e), "BAD_REQUEST")
            .to_res(StatusCode::BAD_REQUEST)
    })?;

    let is_stream = body_json["stream"].as_bool().unwrap_or(false);

    let pool = state.db.clone();
    let model_info = services::usage::ModelInfo {
        id: user.model_id.clone(),
        name: user.model_name.clone(),
        is_public: user.model_is_public,
        owned_by: user.model_owned_by.clone(),
        pricing: user.model_pricing.clone(),
    };
    let usage_ctx = services::usage::UsageContext {
        team_id: user.team_id.clone(),
        api_key_id: user.api_key_id.clone(),
        response_time: 0,
        completed_time: 0,
        is_stream,
        ai_provider_id: String::new(),
    };

    // Try each provider in order; fall back to the next one on failure
    let mut last_error = None;
    for (idx, provider) in user.providers.iter().enumerate() {
        let mut headers = original_headers.clone();
        headers.remove("host");
        headers.remove("origin");
        headers.remove("referer");

        let auth_token = format!("Bearer {}", provider.model_api_key);
        headers.insert("Authorization", auth_token.parse().unwrap());

        let target_url = format!("{}{}", provider.model_base_url, req_path);

        // Clone body JSON for each retry so we can patch the model field per-provider
        let mut retry_body_json = body_json.clone();
        retry_body_json["model"] = Value::String(provider.model_model_name.clone());
        ProviderAdapterFactory::for_provider(provider).adapt_request_body(
            &mut retry_body_json,
            target_style,
            is_stream,
        );

        let next_body_bytes = serde_json::to_vec(&retry_body_json).unwrap();
        let next_body = bytes::Bytes::from(next_body_bytes);

        headers.remove(axum::http::header::CONTENT_LENGTH);

        match state
            .http_client
            .post(&target_url)
            .headers(headers)
            .body(next_body)
            .send()
            .await
        {
            Ok(upstream_res) => {
                // Non-2xx response: try next provider if one is available
                let status = upstream_res.status();
                if !status.is_success() {
                    if idx < user.providers.len() - 1 {
                        tracing::warn!(
                            provider = idx + 1,
                            status = %status,
                            "Provider failed, trying next"
                        );
                        last_error =
                            Some((status, "Provider unavailable, retrying...".to_string()));
                        continue;
                    } else {
                        // Last provider failed; forward the upstream error body and status directly
                        let error_bytes = upstream_res.bytes().await.unwrap_or_default();
                        let error_resp =
                            if let Ok(v) = serde_json::from_slice::<Value>(&error_bytes) {
                                (status, Json(v)).into_response()
                            } else {
                                let raw_err = String::from_utf8_lossy(&error_bytes);
                                ApiResponse::<()>::error(&raw_err, "UPSTREAM_ERROR").to_res(status)
                            };
                        return Err(error_resp);
                    }
                }

                // Successful response: branch into streaming or buffered JSON handling
                let content_type = upstream_res.headers().get("content-type").cloned();
                let is_event_stream = content_type
                    .is_some_and(|ct| ct.to_str().unwrap_or("").contains("text/event-stream"));

                let mut provider_ctx = usage_ctx.clone();
                provider_ctx.ai_provider_id = provider.ai_provider_id.clone();

                let resp = if is_stream || is_event_stream {
                    handle_stream(
                        upstream_res,
                        pool,
                        model_info,
                        provider_ctx,
                        start_time,
                        target_style,
                    )
                    .into_response()
                } else {
                    handle_json(
                        upstream_res,
                        pool,
                        model_info,
                        provider_ctx,
                        start_time,
                        target_style,
                    )
                    .await
                    .into_response()
                };

                return Ok(resp);
            }
            Err(e) => {
                // Network/connection error: try next provider if available
                if idx < user.providers.len() - 1 {
                    tracing::warn!(
                        provider = idx + 1,
                        error = %e,
                        "Provider connection failed, trying next"
                    );
                    last_error =
                        Some((StatusCode::BAD_GATEWAY, format!("Connection failed: {}", e)));
                    continue;
                } else {
                    // All providers exhausted; return the last connection error
                    return Err(ApiResponse::<()>::error(
                        &format!("All providers failed. Last error: {}", e),
                        "BAD_GATEWAY",
                    )
                    .to_res(StatusCode::BAD_GATEWAY));
                }
            }
        }
    }

    // All providers failed (non-2xx fallthrough)
    Err(ApiResponse::<()>::error(
        &format!("All providers unavailable. Last error: {:?}", last_error),
        "BAD_GATEWAY",
    )
    .to_res(StatusCode::BAD_GATEWAY))
}

async fn handle_json(
    res: reqwest::Response,
    pool: sqlx::PgPool,
    model: services::usage::ModelInfo,
    mut ctx: services::usage::UsageContext,
    start_time: std::time::Instant,
    style: UsageStyle,
) -> Response {
    let status = res.status();

    let bytes = match res.bytes().await {
        Ok(b) => b,
        Err(_) => {
            return ApiResponse::<()>::error("Failed to read upstream response", "BAD_GATEWAY")
                .to_res(StatusCode::BAD_GATEWAY);
        }
    };

    let mut data: Value = match serde_json::from_slice(&bytes) {
        Ok(v) => v,
        Err(_) => {
            let raw_err = String::from_utf8_lossy(&bytes);
            return ApiResponse::<()>::error(&raw_err, "UPSTREAM_ERROR").to_res(status);
        }
    };

    ctx.response_time = start_time.elapsed().as_millis() as i32;
    ctx.completed_time = ctx.response_time;
    if let Some(usage_val) = services::usage::find_usage_recursive(&data) {
        let input = extract_usage_input_with_tokens(&usage_val, &model.pricing, style);
        rewrite_usage_field(&mut data, &usage_val, style);
        if let Err(e) = services::usage::add_usage(&pool, input, model, ctx).await {
            tracing::error!(error = %e, "Failed to record usage");
        }
    }

    remove_provider_metadata_fields(&mut data);

    (status, Json(data)).into_response()
}

fn handle_stream(
    res: reqwest::Response,
    pool: sqlx::PgPool,
    model: services::usage::ModelInfo,
    mut ctx: services::usage::UsageContext,
    start_time: std::time::Instant,
    style: UsageStyle,
) -> Sse<impl Stream<Item = Result<Event, io::Error>>> {
    let body_reader = tokio_util::io::StreamReader::new(
        res.bytes_stream().map(|res| res.map_err(io::Error::other)),
    );

    let mut lines = FramedRead::new(body_reader, LinesCodec::new());
    let mut usage_recorded = false;

    let event_stream = async_stream::stream! {
        while let Some(line_result) = lines.next().await {
            match line_result {
                Ok(line) => {
                    if let Some(final_data) = handle_stream_line(
                        line,
                        &pool,
                        &model,
                        &mut ctx,
                        &mut usage_recorded,
                        start_time,
                        style
                    ).await {
                        yield Ok(Event::default().data(final_data));
                    }
                }
                Err(e) => yield Err(io::Error::other(e)),
            }
        }
    };

    Sse::new(event_stream)
}

async fn handle_stream_line(
    line: String,
    pool: &sqlx::PgPool,
    model: &services::usage::ModelInfo,
    ctx: &mut services::usage::UsageContext,
    usage_recorded: &mut bool,
    start_time: std::time::Instant,
    style: UsageStyle,
) -> Option<String> {
    if !line.starts_with("data: ") {
        return None;
    }

    let data_str = &line[6..];
    if data_str == "[DONE]" || data_str.is_empty() {
        return Some(data_str.to_string());
    }

    let is_usage_chunk = line.contains("\"usage\"");
    let is_provider_metadata_chunk = line.contains("\"provider_metadata\"");

    // Track time to first token
    if ctx.response_time == 0 {
        ctx.response_time = start_time.elapsed().as_millis() as i32;
    }

    if (is_usage_chunk || is_provider_metadata_chunk)
        && let Ok(mut chunk) = serde_json::from_str::<serde_json::Value>(data_str)
    {
        let is_not_start = chunk["type"].as_str() != Some("message_start");
        if is_not_start
            && !*usage_recorded
            && let Some(usage_val) = find_usage_recursive(&chunk)
        {
            ctx.completed_time = start_time.elapsed().as_millis() as i32;
            let input = extract_usage_input_with_tokens(&usage_val, &model.pricing, style);
            if is_usage_chunk {
                rewrite_usage_field(&mut chunk, &usage_val, style);
            }
            if let Err(e) =
                services::usage::add_usage(pool, input, model.clone(), ctx.clone()).await
            {
                tracing::error!(error = ?e, "Failed to record stream usage");
            } else {
                *usage_recorded = true;
            }
        }

        if is_provider_metadata_chunk {
            remove_provider_metadata_fields(&mut chunk);
        }

        return serde_json::to_string(&chunk).ok();
    }
    Some(data_str.to_string())
}
