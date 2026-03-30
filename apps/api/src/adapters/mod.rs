use serde_json::Value;

use crate::models::provider::ProviderInfo;
use crate::utils::chat::UsageStyle;

mod bailian;
mod default;

pub use bailian::BailianProviderAdapter;
pub use default::DefaultProviderAdapter;

pub trait ProviderAdapter {
    fn adapt_request_body(&self, body: &mut Value, style: UsageStyle, is_stream: bool) {
        match style {
            UsageStyle::OpenAI => self.adapt_openai_request(body, is_stream),
            UsageStyle::Anthropic => self.adapt_anthropic_request(body, is_stream),
        }
    }

    fn adapt_openai_request(&self, _body: &mut Value, _is_stream: bool) {}

    fn adapt_anthropic_request(&self, _body: &mut Value, _is_stream: bool) {}
}

static DEFAULT_PROVIDER_ADAPTER: DefaultProviderAdapter = DefaultProviderAdapter;
static BAILIAN_PROVIDER_ADAPTER: BailianProviderAdapter = BailianProviderAdapter;

pub struct ProviderAdapterFactory;

impl ProviderAdapterFactory {
    pub fn for_provider(provider: &ProviderInfo) -> &'static dyn ProviderAdapter {
        if is_bailian_provider(provider) {
            &BAILIAN_PROVIDER_ADAPTER
        } else {
            &DEFAULT_PROVIDER_ADAPTER
        }
    }
}

fn is_bailian_provider(provider: &ProviderInfo) -> bool {
    let base_url = provider.model_base_url.to_ascii_lowercase();

    base_url.contains("bailian") || base_url.contains("dashscope")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn provider(_name: &str, base_url: &str) -> ProviderInfo {
        ProviderInfo {
            model_model_name: "qwen-plus".to_string(),
            model_base_url: base_url.to_string(),
            ai_provider_id: "provider-id".to_string(),
            api_keys: vec![crate::models::provider::ApiKeyEntry {
                api_key_hash: "hash".to_string(),
                api_key: "key".to_string(),
            }],
        }
    }

    #[test]
    fn anthropic_entry_keeps_body_unchanged_for_now() {
        let mut body = serde_json::json!({
            "model": "claude-sonnet-4",
            "stream": true
        });

        let adapter = ProviderAdapterFactory::for_provider(&provider(
            "Anthropic",
            "https://api.anthropic.com",
        ));
        adapter.adapt_request_body(&mut body, UsageStyle::Anthropic, true);

        assert!(body.get("stream_options").is_none());
    }
}
