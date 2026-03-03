use crate::models::model::{Model, ModelPublic};
use crate::shared::{AppState, ApiResponse};
use axum::Json;
use axum::{extract::State, http::StatusCode, response::IntoResponse};
use serde::Serialize;
use std::sync::Arc;

#[derive(Debug, Serialize)]
pub struct ListResponse<T> {
    pub object: String,
    pub data: Vec<T>,
}

impl<T> ListResponse<T> {
    pub fn new(data: Vec<T>) -> Self {
        Self {
            object: "list".to_string(),
            data,
        }
    }
}

pub async fn list_models_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let result = sqlx::query_as::<_, Model>(
        "SELECT id, is_public, name, description, model, owned_by, context_window, max_tokens, \
         type, styles, tags, pricing, metadata, created_at, updated_at \
         FROM models WHERE is_public = true ORDER BY created_at DESC",
    )
    .fetch_all(&state.db)
    .await;

    match result {
        Ok(models) => {
            let public_models: Vec<ModelPublic> =
                models.into_iter().map(ModelPublic::from).collect();
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
