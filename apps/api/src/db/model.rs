use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pricing {
    pub input: Decimal,
    pub output: Decimal,
    pub input_cache_read: Decimal,
}

#[derive(Debug, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Model {
    pub id: String,
    pub is_public: bool,
    pub name: String,
    pub description: String,
    pub model: String,
    pub owned_by: String,
    pub context_window: i32,
    pub max_tokens: i32,
    pub r#type: String,
    pub styles: Vec<String>,
    pub tags: Vec<String>,
    pub pricing: serde_json::Value,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelPublic {
    pub id: String,
    pub is_public: bool,
    pub name: String,
    pub description: String,
    pub owned_by: String,
    pub context_window: i32,
    pub max_tokens: i32,
    pub r#type: String,
    pub styles: Vec<String>,
    pub tags: Vec<String>,
    pub pricing: serde_json::Value,
    pub metadata: serde_json::Value,
}

impl From<Model> for ModelPublic {
    fn from(m: Model) -> Self {
        let pricing_json = if let Some(s) = m.pricing.as_str() {
            serde_json::from_str(s).unwrap_or(m.pricing.clone())
        } else {
            m.pricing.clone()
        };

        let metadata_json = if let Some(s) = m.metadata.as_str() {
            serde_json::from_str(s).unwrap_or(m.metadata.clone())
        } else {
            m.metadata.clone()
        };
        Self {
            id: m.id,
            is_public: m.is_public,
            name: m.name,
            description: m.description,
            owned_by: m.owned_by,
            context_window: m.context_window,
            max_tokens: m.max_tokens,
            r#type: m.r#type,
            styles: m.styles,
            tags: m.tags,
            pricing: pricing_json,
            metadata: metadata_json,
        }
    }
}

// A single API key entry for a provider.
#[derive(Debug, Clone)]
pub struct ApiKeyEntry {
    pub api_key_hash: String,
    pub api_key: String,
}

// Selected AI provider backend information
#[derive(Debug, Clone)]
pub struct ProviderInfo {
    pub model_model_name: String,
    pub model_base_url: String,
    pub ai_provider_id: String,
    pub api_keys: Vec<ApiKeyEntry>,
}

// Full result of validating an API key and selecting providers for a model
#[derive(Debug, Clone)]
pub struct ModelAccessResult {
    pub api_key_id: String,
    pub api_key_max_quota: Decimal,
    pub api_key_max_requests: i32,
    pub api_key_total_quota: Decimal,
    pub api_key_total_requests: i32,
    pub api_key_expires_at: Option<DateTime<Utc>>,
    pub team_id: String,

    pub model_id: String,
    pub model_name: String,
    pub model_owned_by: String,
    pub model_is_public: bool,
    pub model_pricing: serde_json::Value,

    pub user_amount: Option<Decimal>,
    pub user_cost: Option<Decimal>,

    pub monthly_free_allowance: Option<Decimal>,
    pub monthly_free_used: Option<Decimal>,
    pub monthly_free_last_reset_at: Option<DateTime<Utc>>,

    // Weighted-randomly sorted provider list; first entry is the primary, rest are fallbacks
    pub providers: Vec<ProviderInfo>,
}
