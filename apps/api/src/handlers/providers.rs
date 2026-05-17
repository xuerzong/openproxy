use axum::{extract::State, http::StatusCode, response::IntoResponse};
use serde::Serialize;
use std::sync::Arc;

use crate::{
    models::ai_provider::{AIProvider, ProviderStyle, get_all_providers},
    shared::{ApiResponse, AppState},
};

#[derive(Debug, Clone, Serialize)]
struct ProviderBaseUrlDto {
    style: ProviderStyle,
    base_url: String,
}

#[derive(Debug, Clone, Serialize)]
struct ProviderDto {
    id: String,
    name: String,
    base_url: String,
    base_urls: Vec<ProviderBaseUrlDto>,
    supported_styles: Vec<ProviderStyle>,
    docs_url: String,
}

impl From<&AIProvider> for ProviderDto {
    fn from(p: &AIProvider) -> Self {
        Self {
            id: p.id.clone(),
            name: p.name.clone(),
            base_url: p.base_url.clone(),
            base_urls: p
                .base_urls
                .iter()
                .map(|b| ProviderBaseUrlDto {
                    style: b.style,
                    base_url: b.base_url.clone(),
                })
                .collect(),
            supported_styles: p.supported_styles.to_vec(),
            docs_url: p.docs_url.clone(),
        }
    }
}

pub async fn list_providers_handler(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    match get_all_providers(&state.db).await {
        Ok(providers) => {
            let providers: Vec<ProviderDto> = providers.iter().map(ProviderDto::from).collect();
            ApiResponse::success(providers).to_res(StatusCode::OK)
        }
        Err(error) => {
            tracing::error!(error = %error, "Failed to fetch AI providers");
            ApiResponse::<()>::error("Failed to fetch AI providers", "DB_ERROR")
                .to_res(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}
