use axum::{extract::Request, response::Response};
use serde_json::Value;
use std::{future::Future, pin::Pin, sync::Arc, time::Instant};

use crate::{
    models::provider::{ModelAccessResult, ProviderInfo},
    services,
    shared::{AppState, proxy::{PreparedUpstreamRequest, build_usage_parts, is_event_stream_response, parse_proxy_request, proxy_to_provider}},
};

pub type ResponseFuture<'a> = Pin<Box<dyn Future<Output = Response> + Send + 'a>>;

pub struct ProxyResponseContext {
    pub pool: sqlx::PgPool,
    pub model: services::usage::ModelInfo,
    pub usage_ctx: services::usage::UsageContext,
    pub start_time: Instant,
}

pub trait ProxyRequestHandler: Sized {
    fn try_new(req_path: String, body_json: Value) -> Result<Self, Response>;

    fn is_stream(&self) -> bool;

    fn prepare_upstream_request(&self, provider: &ProviderInfo) -> PreparedUpstreamRequest;

    fn handle_json<'a>(
        &'a self,
        upstream_res: reqwest::Response,
        ctx: ProxyResponseContext,
    ) -> ResponseFuture<'a>;

    fn handle_stream(&self, upstream_res: reqwest::Response, ctx: ProxyResponseContext) -> Response;
}

pub async fn execute_proxy_request<H>(
    state: Arc<AppState>,
    user: ModelAccessResult,
    req: Request,
) -> Result<Response, Response>
where
    H: ProxyRequestHandler,
{
    let start_time = Instant::now();
    let req_path = req.uri().path().to_string();
    let parsed = parse_proxy_request(req).await?;
    let handler = H::try_new(req_path, parsed.body_json)?;

    let pool = state.db.clone();
    let (model, usage_ctx) = build_usage_parts(&user, handler.is_stream());
    let upstream = proxy_to_provider(
        &state,
        &user,
        &parsed.original_headers,
        &usage_ctx,
        |provider| handler.prepare_upstream_request(provider),
    )
    .await?;

    let ctx = ProxyResponseContext {
        pool,
        model,
        usage_ctx: upstream.provider_ctx,
        start_time,
    };

    if handler.is_stream() || is_event_stream_response(&upstream.upstream_res) {
        Ok(handler.handle_stream(upstream.upstream_res, ctx))
    } else {
        Ok(handler.handle_json(upstream.upstream_res, ctx).await)
    }
}