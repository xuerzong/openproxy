use axum::{Extension, extract::{Request, State}, response::Response};
use std::sync::Arc;

use crate::{
    models::provider::ModelAccessResult,
    shared::{AppState, chat_common::ChatProxyHandler, proxy::PreparedUpstreamRequest, proxy_flow::{ProxyRequestHandler, ProxyResponseContext, ResponseFuture, execute_proxy_request}},
    utils::chat::UsageStyle,
};

pub async fn chat_completions_handler(
    State(state): State<Arc<AppState>>,
    Extension(user): Extension<ModelAccessResult>,
    req: Request,
) -> Result<Response, Response> {
    execute_proxy_request::<ChatCompletionsRequestHandler>(state, user, req).await
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