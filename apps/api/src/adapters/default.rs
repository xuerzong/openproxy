use super::ProviderAdapter;

/// Fallback adapter used when a provider's base URL does not match any entry
/// in the hardcoded registry (`apps/api/src/models/ai_provider.rs`).
///
/// Performs no transformations — forwards the request body as-is.
pub struct DefaultProviderAdapter;

impl ProviderAdapter for DefaultProviderAdapter {}

#[cfg(test)]
mod tests {
    use crate::models::provider::ProviderInfo;
    use crate::utils::chat::UsageStyle;
    use serde_json::Value;

    fn provider(base_url: &str) -> ProviderInfo {
        ProviderInfo {
            model_model_name: "some-model".to_string(),
            model_base_url: base_url.to_string(),
            ai_provider_id: "provider-id".to_string(),
            base_urls: std::collections::HashMap::new(),
            adapter_kind: "default".to_string(),
            api_keys: vec![crate::models::provider::ApiKeyEntry {
                api_key_hash: "hash".to_string(),
                api_key: "key".to_string(),
            }],
        }
    }

    #[test]
    fn unknown_provider_base_url_falls_back_and_keeps_body_unchanged() {
        let mut body = serde_json::json!({
            "model": "mystery",
            "stream": true,
        });

        let adapter = crate::adapters::ProviderAdapterFactory::for_provider(&provider(
            "https://unknown-ai.example.com/v1",
        ));
        adapter.adapt_request_body(&mut body, UsageStyle::OpenAI, true);

        assert!(body.get("stream_options").is_none());
    }

    #[test]
    fn openai_official_does_not_inject_stream_options() {
        let mut body = serde_json::json!({
            "model": "gpt-4o",
            "stream": true,
        });

        let adapter = crate::adapters::ProviderAdapterFactory::for_provider(&provider(
            "https://api.openai.com/v1",
        ));
        adapter.adapt_request_body(&mut body, UsageStyle::OpenAI, true);

        assert!(
            body.get("stream_options").is_none(),
            "OpenAI adapter should not inject stream_options"
        );
        let _ = Value::Null;
    }
}
