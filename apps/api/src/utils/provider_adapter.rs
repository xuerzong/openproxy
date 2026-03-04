use serde_json::{Value, json};

use crate::{models::provider::ProviderInfo, utils::chat::UsageStyle};

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

pub struct DefaultProviderAdapter;

impl ProviderAdapter for DefaultProviderAdapter {}

pub struct BailianProviderAdapter;

impl ProviderAdapter for BailianProviderAdapter {
    fn adapt_openai_request(&self, body: &mut Value, is_stream: bool) {
        if !is_stream {
            return;
        }

        ensure_stream_options_include_usage(body);
    }
}

static DEFAULT_PROVIDER_ADAPTER: DefaultProviderAdapter = DefaultProviderAdapter;
static BAILIAN_PROVIDER_ADAPTER: BailianProviderAdapter = BailianProviderAdapter;

pub fn resolve_provider_adapter(provider: &ProviderInfo) -> &'static dyn ProviderAdapter {
    if is_bailian_provider(provider) {
        &BAILIAN_PROVIDER_ADAPTER
    } else {
        &DEFAULT_PROVIDER_ADAPTER
    }
}

pub fn adapt_request_body(
    body: &mut Value,
    provider: &ProviderInfo,
    style: UsageStyle,
    is_stream: bool,
) {
    let adapter = resolve_provider_adapter(provider);
    adapter.adapt_request_body(body, style, is_stream);
}

fn is_bailian_provider(provider: &ProviderInfo) -> bool {
    let provider_name = provider.ai_provider_name.to_ascii_lowercase();
    let base_url = provider.model_base_url.to_ascii_lowercase();

    provider_name.contains("bailian")
        || base_url.contains("bailian")
        || base_url.contains("dashscope")
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

    fn provider(name: &str, base_url: &str) -> ProviderInfo {
        ProviderInfo {
            model_model_name: "qwen-plus".to_string(),
            model_base_url: base_url.to_string(),
            model_api_key_hash: "hash".to_string(),
            model_api_key: "key".to_string(),
            ai_provider_id: "provider-id".to_string(),
            ai_provider_name: name.to_string(),
        }
    }

    #[test]
    fn bailian_openai_stream_adds_stream_options_include_usage() {
        let mut body = serde_json::json!({
            "model": "qwen-plus",
            "stream": true
        });

        adapt_request_body(
            &mut body,
            &provider("Bailian", "https://dashscope.aliyuncs.com/compatible-mode/v1"),
            UsageStyle::OpenAI,
            true,
        );

        assert_eq!(
            body.get("stream_options")
                .and_then(|v| v.get("include_usage"))
                .and_then(Value::as_bool),
            Some(true)
        );
    }

    #[test]
    fn non_bailian_provider_keeps_body_unchanged() {
        let mut body = serde_json::json!({
            "model": "gpt-4o",
            "stream": true
        });

        adapt_request_body(
            &mut body,
            &provider("OpenAI", "https://api.openai.com/v1"),
            UsageStyle::OpenAI,
            true,
        );

        assert!(body.get("stream_options").is_none());
    }

    #[test]
    fn anthropic_entry_keeps_body_unchanged_for_now() {
        let mut body = serde_json::json!({
            "model": "claude-sonnet-4",
            "stream": true
        });

        adapt_request_body(
            &mut body,
            &provider("Anthropic", "https://api.anthropic.com"),
            UsageStyle::Anthropic,
            true,
        );

        assert!(body.get("stream_options").is_none());
    }

    #[test]
    fn bailian_anthropic_entry_keeps_body_unchanged_for_now() {
        let mut body = serde_json::json!({
            "model": "claude-sonnet-4",
            "stream": true
        });

        adapt_request_body(
            &mut body,
            &provider("Bailian", "https://dashscope.aliyuncs.com/compatible-mode/v1"),
            UsageStyle::Anthropic,
            true,
        );

        assert!(body.get("stream_options").is_none());
    }
}
