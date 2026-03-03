use chrono::{DateTime, Utc};
use rust_decimal::Decimal;

/// Information about a selected AI provider backend.
#[derive(Debug, Clone)]
pub struct ProviderInfo {
    pub model_model_name: String,
    pub model_base_url: String,
    pub model_api_key_hash: String,
    pub model_api_key: String,
    pub ai_provider_id: String,
    pub ai_provider_name: String,
}

/// Full result of validating an API key and selecting providers for a model.
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

    /// Weighted-randomly sorted list of providers; the first is the primary selection.
    pub providers: Vec<ProviderInfo>,
}
