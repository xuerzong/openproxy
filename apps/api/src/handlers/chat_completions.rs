use axum::{Extension, extract::{Request, State}, response::Response, http::StatusCode};
use std::sync::Arc;

use crate::{
    models::provider::ModelAccessResult,
    shared::{AppState, chat_common::ChatProxyHandler, proxy::{PreparedUpstreamRequest, parse_proxy_request}, proxy_flow::{ProxyRequestHandler, ProxyResponseContext, ResponseFuture, execute_proxy_request}},
    utils::{chat::UsageStyle, tokens::count_input_tokens, balance::{check_balance_and_available_output, apply_balance_check_to_body}},
};

pub async fn chat_completions_handler(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<ModelAccessResult>,
    req: Request,
) -> Result<Response, Response> {
    let req_path = req.uri().path().to_string();
    let parsed = parse_proxy_request(req).await?;
    
    let input_tokens = count_input_tokens(&parsed.body_json, &user.model_name);
    
    let requested_max_tokens = parsed.body_json.get("max_tokens")
        .and_then(|v| v.as_i64())
        .map(|v| v as i32);
    
    match check_balance_and_available_output(&user, input_tokens, requested_max_tokens) {
        Err((status, api_response)) => {
            Err(api_response.to_res(status))
        }
        Ok(balance_check) => {
            let mut body_json = parsed.body_json;
            apply_balance_check_to_body(&mut body_json, &balance_check);
            
            tracing::info!(
                team_id = %user.team_id,
                api_key_id = %user.api_key_id,
                model_name = %user.model_name,
                input_tokens = balance_check.input_tokens,
                available_output_tokens = balance_check.available_output_tokens,
                user_balance = %balance_check.balance,
                "Balance check passed for chat completion"
            );
            
            let body_bytes = serde_json::to_vec(&body_json)
                .map_err(|_| {
                    Response::builder()
                        .status(StatusCode::BAD_REQUEST)
                        .body(axum::body::Body::empty())
                        .unwrap()
                })?;
            
            let mut modified_req = Request::builder()
                .method(axum::http::Method::POST)
                .uri(&req_path);
            
            for (key, value) in &parsed.original_headers {
                if key.as_str() != "content-length" {
                    modified_req = modified_req.header(key.clone(), value.clone());
                }
            }
            
            let modified_request = modified_req
                .body(axum::body::Body::from(body_bytes))
                .map_err(|_| {
                    Response::builder()
                        .status(StatusCode::INTERNAL_SERVER_ERROR)
                        .body(axum::body::Body::empty())
                        .unwrap()
                })?;
            
            execute_proxy_request::<ChatCompletionsRequestHandler>(state, user, modified_request).await
        }
    }
}

struct ChatCompletionsRequestHandler {
    inner: ChatProxyHandler,
}

impl ProxyRequestHandler for ChatCompletionsRequestHandler {
    fn try_new(req_path: String, body_json: serde_json::Value) -> Result<Self, Response> {
        Ok(Self {
            inner: ChatProxyHandler::new(req_path, body_json, UsageStyle::OpenAI),
        })
    }

    fn is_stream(&self) -> bool {
        self.inner.is_stream()
    }

    fn prepare_upstream_request(
        &self,
        provider: &crate::models::provider::ProviderInfo,
    ) -> PreparedUpstreamRequest {
        self.inner.prepare_upstream_request(provider)
    }

    fn handle_json<'a>(
        &'a self,
        upstream_res: reqwest::Response,
        ctx: ProxyResponseContext,
    ) -> ResponseFuture<'a> {
        self.inner.handle_json(upstream_res, ctx)
    }

    fn handle_stream(&self, upstream_res: reqwest::Response, ctx: ProxyResponseContext) -> Response {
        self.inner.handle_stream(upstream_res, ctx)
    }
}