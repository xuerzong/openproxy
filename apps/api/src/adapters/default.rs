use super::ProviderAdapter;

pub struct DefaultProviderAdapter;

impl ProviderAdapter for DefaultProviderAdapter {}

#[cfg(test)]
mod tests {
    use crate::models::provider::ProviderInfo;
    use crate::utils::chat::UsageStyle;

    fn provider(_name: &str, base_url: &str) -> ProviderInfo {
        ProviderInfo {
            model_model_name: "gpt-4o".to_string(),
            model_base_url: base_url.to_string(),
            ai_provider_id: "provider-id".to_string(),
            api_keys: vec![crate::models::provider::ApiKeyEntry {
                api_key_hash: "hash".to_string(),
                api_key: "key".to_string(),
            }],
        }
    }

    #[test]
    fn non_bailian_provider_keeps_body_unchanged() {
        let mut body = serde_json::json!({
            "model": "gpt-4o",
            "stream": true
        });

        let adapter = crate::adapters::ProviderAdapterFactory::for_provider(&provider(
            "OpenAI",
            "https://api.openai.com/v1",
        ));
        adapter.adapt_request_body(&mut body, UsageStyle::OpenAI, true);

        assert!(body.get("stream_options").is_none());
    }
}
