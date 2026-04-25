use axum::{http::StatusCode, response::IntoResponse};
use serde::Serialize;

use crate::{
    models::ai_provider::{AIProvider, AI_PROVIDERS, ProviderStyle},
    shared::ApiResponse,
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

pub async fn list_providers_handler() -> impl IntoResponse {
    let providers: Vec<ProviderDto> = AI_PROVIDERS.iter().map(ProviderDto::from).collect();
    ApiResponse::success(providers).to_res(StatusCode::OK)
}
