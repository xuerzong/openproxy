use crate::shared::ApiResponse;
use axum::{http::StatusCode, response::IntoResponse};
use serde_json::json;

pub async fn health_check_handler() -> impl IntoResponse {
    let response = ApiResponse::success(json!({
        "status": "up",
        "version": env!("CARGO_PKG_VERSION")
    }));

    response.to_res(StatusCode::OK)
}
