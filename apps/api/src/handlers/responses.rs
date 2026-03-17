use axum::{Extension, Json, extract::{Request, State}, response::{IntoResponse, Response, Sse, sse::Event}};
use futures_util::{Stream, StreamExt, io};
use reqwest::StatusCode;
use serde_json::Value;
use std::sync::Arc;
use tokio_util::{
    codec::{FramedRead, LinesCodec},
};

use crate::shared::{
    AppState,
    proxy::PreparedUpstreamRequest,
    proxy_flow::{ProxyRequestHandler, ProxyResponseContext, ResponseFuture, execute_proxy_request},
};
use crate::utils::chat::{UsageStyle, extract_usage_input_with_tokens, remove_provider_metadata_fields};
use crate::utils::openresponses::{
    OpenResponsesStreamTranslator, translate_chat_completions_response,
    translate_responses_request,
};

use crate::{
    models::provider::ModelAccessResult,
    services::{self, usage::find_usage_recursive},
    shared::ApiResponse,
};

pub async fn responses_handler(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<ModelAccessResult>,
    req: Request,
) -> Result<Response, Response> {
    execute_proxy_request::<ResponsesRequestHandler>(state, user, req).await
}

struct ResponsesRequestHandler {
    request: Value,
    translated_request: Value,
}

impl ProxyRequestHandler for ResponsesRequestHandler {
    fn try_new(_req_path: String, body_json: Value) -> Result<Self, Response> {
        let translated_request = translate_responses_request(&body_json).map_err(|e| {
            ApiResponse::<()>::error(&e, "BAD_REQUEST").to_res(StatusCode::BAD_REQUEST)
        })?;

        Ok(Self {
            request: body_json,
            translated_request,
        })
    }

    fn is_stream(&self) -> bool {
        self.translated_request["stream"].as_bool().unwrap_or(false)
    }

    fn prepare_upstream_request(
        &self,
        provider: &crate::models::provider::ProviderInfo,
    ) -> PreparedUpstreamRequest {
        let mut retry_body_json = self.translated_request.clone();
        retry_body_json["model"] = Value::String(provider.model_model_name.clone());

        PreparedUpstreamRequest {
            target_url: format!(
                "{}/chat/completions",
                provider.model_base_url.trim_end_matches('/')
            ),
            body_json: retry_body_json,
        }
    }

    fn handle_json<'a>(
        &'a self,
        upstream_res: reqwest::Response,
        ctx: ProxyResponseContext,
    ) -> ResponseFuture<'a> {
        Box::pin(handle_openresponses_json(
            upstream_res,
            ctx.pool,
            ctx.model,
            ctx.usage_ctx,
            ctx.start_time,
            self.request.clone(),
        ))
    }

    fn handle_stream(&self, upstream_res: reqwest::Response, ctx: ProxyResponseContext) -> Response {
        handle_openresponses_stream(
            upstream_res,
            ctx.pool,
            ctx.model,
            ctx.usage_ctx,
            ctx.start_time,
            self.request.clone(),
        )
        .into_response()
    }
}

async fn handle_openresponses_json(
    res: reqwest::Response,
    pool: sqlx::PgPool,
    model: services::usage::ModelInfo,
    mut ctx: services::usage::UsageContext,
    start_time: std::time::Instant,
    request: Value,
) -> Response {
    let status = res.status();

    let bytes = match res.bytes().await {
        Ok(bytes) => bytes,
        Err(_) => {
            return ApiResponse::<()>::error("Failed to read upstream response", "BAD_GATEWAY")
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

    ctx.response_time = start_time.elapsed().as_millis() as i32;
    ctx.completed_time = ctx.response_time;

    if let Some(usage_val) = services::usage::find_usage_recursive(&data) {
        let input = extract_usage_input_with_tokens(&usage_val, &model.pricing, UsageStyle::OpenAI);
        if let Err(error) = services::usage::add_usage(&pool, input, model, ctx).await {
            tracing::error!(error = %error, "Failed to record usage");
        }
    }

    remove_provider_metadata_fields(&mut data);

    (status, Json(translate_chat_completions_response(&request, &data))).into_response()
}

fn handle_openresponses_stream(
    res: reqwest::Response,
    pool: sqlx::PgPool,
    model: services::usage::ModelInfo,
    mut ctx: services::usage::UsageContext,
    start_time: std::time::Instant,
    request: Value,
) -> Sse<impl Stream<Item = Result<Event, io::Error>>> {
    let body_reader = tokio_util::io::StreamReader::new(
        res.bytes_stream().map(|result| result.map_err(io::Error::other)),
    );

    let mut lines = FramedRead::new(body_reader, LinesCodec::new());
    let mut translator = OpenResponsesStreamTranslator::new(&request);
    let mut usage_recorded = false;

    let event_stream = async_stream::stream! {
        for event in translator.take_initial_events() {
            let event_type = event.get("type").and_then(Value::as_str).unwrap_or("message");
            let payload = serde_json::to_string(&event).unwrap_or_else(|_| "{}".to_string());
            yield Ok(Event::default().event(event_type).data(payload));
        }

        while let Some(line_result) = lines.next().await {
            match line_result {
                Ok(line) => {
                    if !line.starts_with("data: ") {
                        continue;
                    }

                    let data_str = &line[6..];
                    if data_str == "[DONE]" {
                        for event in translator.finish() {
                            let event_type = event.get("type").and_then(Value::as_str).unwrap_or("message");
                            let payload = serde_json::to_string(&event).unwrap_or_else(|_| "{}".to_string());
                            yield Ok(Event::default().event(event_type).data(payload));
                        }
                        yield Ok(Event::default().data("[DONE]"));
                        continue;
                    }

                    let Ok(mut chunk) = serde_json::from_str::<Value>(data_str) else {
                        continue;
                    };

                    if ctx.response_time == 0 {
                        ctx.response_time = start_time.elapsed().as_millis() as i32;
                    }

                    if let Some(usage_val) = find_usage_recursive(&chunk)
                        && !*(&usage_recorded)
                    {
                        ctx.completed_time = start_time.elapsed().as_millis() as i32;
                        let input = extract_usage_input_with_tokens(&usage_val, &model.pricing, UsageStyle::OpenAI);
                        if let Err(error) = services::usage::add_usage(&pool, input, model.clone(), ctx.clone()).await {
                            tracing::error!(error = ?error, "Failed to record stream usage");
                        } else {
                            usage_recorded = true;
                        }
                    }

                    remove_provider_metadata_fields(&mut chunk);
                    translator.capture_usage(&chunk);

                    for event in translator.process_chunk(&chunk) {
                        let event_type = event.get("type").and_then(Value::as_str).unwrap_or("message");
                        let payload = serde_json::to_string(&event).unwrap_or_else(|_| "{}".to_string());
                        yield Ok(Event::default().event(event_type).data(payload));
                    }
                }
                Err(error) => yield Err(io::Error::other(error)),
            }
        }
    };

    Sse::new(event_stream)
}