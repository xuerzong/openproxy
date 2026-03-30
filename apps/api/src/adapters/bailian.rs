use serde_json::{json, Value};

use super::ProviderAdapter;

pub struct BailianProviderAdapter;

impl ProviderAdapter for BailianProviderAdapter {
    fn adapt_openai_request(&self, body: &mut Value, is_stream: bool) {
        if !is_stream {
            return;
        }

        ensure_stream_options_include_usage(body);
    }
}

fn ensure_stream_options_include_usage(body: &mut Value) {
    let Some(obj) = body.as_object_mut() else {
        return;
    };

    let stream_options = obj.entry("stream_options").or_insert_with(|| json!({}));

    if !stream_options.is_object() {
        *stream_options = json!({});
    }

    if let Some(stream_options_obj) = stream_options.as_object_mut() {
        stream_options_obj.insert("include_usage".to_string(), Value::Bool(true));
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::provider::ProviderInfo;

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
    fn bailian_openai_stream_adds_stream_options_include_usage() {
        let mut body = serde_json::json!({
            "model": "qwen-plus",
            "stream": true
        });

        let adapter = crate::adapters::ProviderAdapterFactory::for_provider(&provider(
            "Bailian",
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
        let mut body = serde_json::json!({
            "model": "claude-sonnet-4",
            "stream": true
        });

        let adapter = crate::adapters::ProviderAdapterFactory::for_provider(&provider(
            "Bailian",
            "https://dashscope.aliyuncs.com/compatible-mode/v1",
        ));
        adapter.adapt_request_body(&mut body, UsageStyle::Anthropic, true);

        assert!(body.get("stream_options").is_none());
    }
}
