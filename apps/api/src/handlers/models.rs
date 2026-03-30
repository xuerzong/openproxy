use crate::shared::{ApiResponse, AppState, ListResponse};
use crate::services;
use axum::Json;
use axum::{extract::State, http::StatusCode, response::IntoResponse};
use std::sync::Arc;

pub async fn list_models_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    match services::models::get_public_models(&state.db).await {
        Ok(public_models) => {
            let list_resp = ListResponse::new(public_models);
            (StatusCode::OK, Json(list_resp)).into_response()
        }
        Err(e) => {
            tracing::error!(error = %e, "Failed to fetch models");
            ApiResponse::<()>::error("Failed to fetch models", "DB_ERROR")
                .to_res(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
