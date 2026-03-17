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
    codec::{FramedRead, LinesCodec},
};

use crate::shared::proxy::{
    build_usage_parts, is_event_stream_response, parse_proxy_request, proxy_to_provider,
    PreparedUpstreamRequest,
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

    let parsed = parse_proxy_request(req).await?;
    let body_json = parsed.body_json;

    let is_stream = body_json["stream"].as_bool().unwrap_or(false);

    let pool = state.db.clone();
    let (model_info, usage_ctx) = build_usage_parts(&user, is_stream);
    let upstream = proxy_to_provider(&state, &user, &parsed.original_headers, &usage_ctx, |provider| {
        let mut retry_body_json = body_json.clone();
        retry_body_json["model"] = Value::String(provider.model_model_name.clone());
        ProviderAdapterFactory::for_provider(provider).adapt_request_body(
            &mut retry_body_json,
            target_style,
            is_stream,
        );

        PreparedUpstreamRequest {
            target_url: format!("{}{}", provider.model_base_url, req_path),
            body_json: retry_body_json,
        }
    })
    .await?;

    let resp = if is_stream || is_event_stream_response(&upstream.upstream_res) {
        handle_stream(
            upstream.upstream_res,
            pool,
            model_info,
            upstream.provider_ctx,
            start_time,
            target_style,
        )
        .into_response()
    } else {
        handle_json(
            upstream.upstream_res,
            pool,
            model_info,
            upstream.provider_ctx,
            start_time,
            target_style,
        )
        .await
        .into_response()
    };

    Ok(resp)
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
