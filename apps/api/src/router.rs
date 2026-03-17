use crate::handlers;
use crate::middleware;
use crate::shared::AppState;
use axum::{
    http::Method,
    middleware::from_fn_with_state,
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

pub fn create_app(state: Arc<AppState>) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers(Any);

    let proxy_routers = Router::new()
        .route("/chat/completions", post(handlers::chat_handler))
        .route("/messages", post(handlers::chat_handler))
        .route("/responses", post(handlers::responses_handler))
        .route("/embeddings", post(handlers::chat_handler))
        .layer(from_fn_with_state(
            state.clone(),
            middleware::auth::auth_middleware,
        ));

    Router::new()
        .route("/health", get(handlers::health_check_handler))
        .route("/v1/models", get(handlers::list_models_handler))
        .nest("/v1", proxy_routers)
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(state)
}
