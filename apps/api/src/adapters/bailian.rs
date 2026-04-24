use serde_json::Value;

use super::{ensure_stream_options_include_usage, ProviderAdapter};

/// Alibaba Cloud Bailian (DashScope compatible-mode) adapter.
///
/// Base URL: `https://dashscope.aliyuncs.com/compatible-mode/v1`
///
/// Quirks:
/// - Streaming OpenAI chat/completions requires `stream_options.include_usage: true`
///   for the final `usage` chunk to be emitted; without it we cannot bill.
pub struct BailianProviderAdapter;

impl ProviderAdapter for BailianProviderAdapter {
    fn adapt_openai_request(&self, body: &mut Value, is_stream: bool) {
        if !is_stream {
            return;
        }
        ensure_stream_options_include_usage(body);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::provider::ProviderInfo;
    use crate::utils::chat::UsageStyle;

    fn provider(base_url: &str) -> ProviderInfo {
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
    fn bailian_openai_stream_adds_stream_options_include_usage() {
        let mut body = serde_json::json!({"model": "qwen-plus", "stream": true});

        let adapter = crate::adapters::ProviderAdapterFactory::for_provider(&provider(
            "https://dashscope.aliyuncs.com/compatible-mode/v1",
        ));
        adapter.adapt_request_body(&mut body, UsageStyle::OpenAI, true);

        assert_eq!(
            body.get("stream_options")
                .and_then(|v| v.get("include_usage"))
                .and_then(Value::as_bool),
            Some(true)
        );
    }

    #[test]
    fn bailian_anthropic_entry_keeps_body_unchanged_for_now() {
        let mut body = serde_json::json!({"model": "claude-sonnet-4", "stream": true});

        let adapter = crate::adapters::ProviderAdapterFactory::for_provider(&provider(
            "https://dashscope.aliyuncs.com/compatible-mode/v1",
        ));
        adapter.adapt_request_body(&mut body, UsageStyle::Anthropic, true);

        assert!(body.get("stream_options").is_none());
    }
}
