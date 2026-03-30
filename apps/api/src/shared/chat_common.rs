use axum::{
    Json,
    response::{IntoResponse, Response, Sse, sse::Event},
};
use futures_util::{StreamExt, io};
use reqwest::StatusCode;
use serde_json::Value;
use tokio_util::codec::{FramedRead, LinesCodec};

use crate::{
    services::{self, usage::find_usage_recursive},
    shared::{
        ApiResponse,
        proxy::PreparedUpstreamRequest,
        proxy_flow::{ProxyResponseContext, ResponseFuture},
    },
    adapters::ProviderAdapterFactory,
    utils::chat::{
            UsageStyle, extract_usage_input_with_tokens, remove_provider_metadata_fields,
            rewrite_usage_field,
    },
};

pub struct ChatProxyHandler {
    req_path: String,
    body_json: Value,
    target_style: UsageStyle,
}

impl ChatProxyHandler {
    pub fn new(req_path: String, body_json: Value, target_style: UsageStyle) -> Self {
        Self {
            req_path,
            body_json,
            target_style,
        }
    }

    pub fn is_stream(&self) -> bool {
        self.body_json["stream"].as_bool().unwrap_or(false)
    }

    pub fn prepare_upstream_request(
        &self,
        provider: &crate::models::provider::ProviderInfo,
    ) -> PreparedUpstreamRequest {
        let mut retry_body_json = self.body_json.clone();
        retry_body_json["model"] = Value::String(provider.model_model_name.clone());
        ProviderAdapterFactory::for_provider(provider).adapt_request_body(
            &mut retry_body_json,
            self.target_style,
            self.is_stream(),
        );

        PreparedUpstreamRequest {
            target_url: format!("{}{}", provider.model_base_url, self.req_path),
            body_json: retry_body_json,
        }
    }

    pub fn handle_json<'a>(
        &'a self,
        res: reqwest::Response,
        ctx: ProxyResponseContext,
    ) -> ResponseFuture<'a> {
        Box::pin(async move {
            let status = res.status();

            let bytes = match res.bytes().await {
                Ok(bytes) => bytes,
                Err(_) => {
                    return ApiResponse::<()>::error(
                        "Failed to read upstream response",
                        "BAD_GATEWAY",
                    )
                    .to_res(StatusCode::BAD_GATEWAY);
                }
            };

            let mut data: Value = match serde_json::from_slice(&bytes) {
                Ok(value) => value,
                Err(_) => {
                    let raw_err = String::from_utf8_lossy(&bytes);
                    return ApiResponse::<()>::error(&raw_err, "UPSTREAM_ERROR").to_res(status);
                }
            };

            let mut usage_ctx = ctx.usage_ctx;
            usage_ctx.response_time = ctx.start_time.elapsed().as_millis() as i32;
            usage_ctx.completed_time = usage_ctx.response_time;

            if let Some(usage_val) = services::usage::find_usage_recursive(&data) {
                let input = extract_usage_input_with_tokens(
                    &usage_val,
                    &ctx.model.pricing,
                    self.target_style,
                );
                rewrite_usage_field(&mut data, &usage_val, self.target_style);
                if let Err(error) =
                    services::usage::add_usage(&ctx.pool, input, ctx.model, usage_ctx).await
                {
                    tracing::error!(error = %error, "Failed to record usage");
                }
            }

            remove_provider_metadata_fields(&mut data);

            (status, Json(data)).into_response()
        })
    }

    pub fn handle_stream(&self, res: reqwest::Response, ctx: ProxyResponseContext) -> Response {
        let body_reader = tokio_util::io::StreamReader::new(
            res.bytes_stream().map(|res| res.map_err(io::Error::other)),
        );

        let mut lines = FramedRead::new(body_reader, LinesCodec::new());
        let mut usage_recorded = false;
        let mut usage_ctx = ctx.usage_ctx;
        let pool = ctx.pool;
        let model = ctx.model;
        let start_time = ctx.start_time;
        let target_style = self.target_style;

        let event_stream = async_stream::stream! {
            while let Some(line_result) = lines.next().await {
                match line_result {
                    Ok(line) => {
                        if let Some(final_data) = handle_stream_line(
                            line,
                            &pool,
                            &model,
                            &mut usage_ctx,
                            &mut usage_recorded,
                            start_time,
                            target_style,
                        ).await {
                            yield Ok(Event::default().data(final_data));
                        }
                    }
                    Err(error) => yield Err(io::Error::other(error)),
                }
            }
        };

        Sse::new(event_stream).into_response()
    }
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
            if let Err(error) =
                services::usage::add_usage(pool, input, model.clone(), ctx.clone()).await
            {
                tracing::error!(error = ?error, "Failed to record stream usage");
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