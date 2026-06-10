use serde_json::{Value, json};

use crate::models::provider::ProviderInfo;
use crate::utils::chat::UsageStyle;

mod default;
mod openai;
mod stream_usage;

pub use default::DefaultProviderAdapter;
pub use openai::OpenAIProviderAdapter;
pub use stream_usage::StreamUsageProviderAdapter;

/// Trait implemented by per-provider adapters. Each method receives the outgoing
/// request body (already translated to the target style) and may mutate it to
/// satisfy provider-specific quirks.
///
/// The default implementations are no-ops; adapters only override what they need.
pub trait ProviderAdapter {
    /// Dispatch based on the caller's target style. Used by `ChatProxyHandler`.
    fn adapt_request_body(&self, body: &mut Value, style: UsageStyle, is_stream: bool) {
        match style {
            UsageStyle::OpenAI => self.adapt_openai_request(body, is_stream),
            UsageStyle::Anthropic => self.adapt_anthropic_request(body, is_stream),
        }
    }

    /// Called when the outgoing body uses OpenAI `/v1/chat/completions` style.
    fn adapt_openai_request(&self, _body: &mut Value, _is_stream: bool) {}

    /// Called when the outgoing body uses Anthropic `/v1/messages` style.
    fn adapt_anthropic_request(&self, _body: &mut Value, _is_stream: bool) {}

    /// Called when the outgoing body uses OpenAI `/v1/responses` style.
    /// Currently unused internally (responses are pre-translated to chat/completions),
    /// but provided so adapters can customize future direct routing.
    fn adapt_responses_request(&self, _body: &mut Value, _is_stream: bool) {}
}

static DEFAULT_PROVIDER_ADAPTER: DefaultProviderAdapter = DefaultProviderAdapter;
static OPENAI_PROVIDER_ADAPTER: OpenAIProviderAdapter = OpenAIProviderAdapter;
static STREAM_USAGE_PROVIDER_ADAPTER: StreamUsageProviderAdapter = StreamUsageProviderAdapter;

/// Pick the adapter implementation for a given `adapter_kind` value sourced from
/// `ai_providers.adapter_kind`. Unknown or empty values fall back to the
/// no-op default adapter.
fn resolve_adapter(adapter_kind: &str) -> &'static dyn ProviderAdapter {
    match adapter_kind {
        "openai" => &OPENAI_PROVIDER_ADAPTER,
        "stream_usage" => &STREAM_USAGE_PROVIDER_ADAPTER,
        _ => &DEFAULT_PROVIDER_ADAPTER,
    }
}

pub struct ProviderAdapterFactory;

impl ProviderAdapterFactory {
    /// Pick an adapter for the given provider based on `provider.adapter_kind`,
    /// which is sourced from the `ai_providers` table.
    pub fn for_provider(provider: &ProviderInfo) -> &'static dyn ProviderAdapter {
        resolve_adapter(&provider.adapter_kind)
    }
}

/// Shared helper: ensure `stream_options.include_usage` is true for streaming
/// OpenAI-style requests. Required by several OpenAI-compatible providers to
/// receive the final `usage` object for billing (Bailian, MiniMax, DeepSeek, etc).
pub(crate) fn ensure_stream_options_include_usage(body: &mut Value) {
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
    use crate::models::provider::ApiKeyEntry;

    fn provider(id: &str, adapter_kind: &str) -> ProviderInfo {
        ProviderInfo {
            model_model_name: "model".to_string(),
            model_base_url: "https://example.com".to_string(),
            ai_provider_id: id.to_string(),
            base_urls: std::collections::HashMap::new(),
            adapter_kind: adapter_kind.to_string(),
            api_keys: vec![ApiKeyEntry {
                api_key_hash: "hash".to_string(),
                api_key: "key".to_string(),
            }],
        }
    }

    #[test]
    fn stream_usage_adapter_injects_include_usage_on_streaming_openai() {
        let adapter = ProviderAdapterFactory::for_provider(&provider("some-id", "stream_usage"));
        let mut body = json!({"stream": true});
        adapter.adapt_openai_request(&mut body, true);
        assert_eq!(
            body.pointer("/stream_options/include_usage")
                .and_then(Value::as_bool),
            Some(true)
        );
    }

    #[test]
    fn unknown_adapter_kind_falls_back_to_default() {
        let adapter = ProviderAdapterFactory::for_provider(&provider("some-id", "not-a-real-kind"));
        let mut body = json!({"stream": true});
        adapter.adapt_openai_request(&mut body, true);
        assert!(body.get("stream_options").is_none());
    }

    #[test]
    fn empty_adapter_kind_falls_back_to_default() {
        let adapter = ProviderAdapterFactory::for_provider(&provider("some-id", ""));
        let mut body = json!({"stream": true});
        adapter.adapt_openai_request(&mut body, true);
        assert!(body.get("stream_options").is_none());
    }

    #[test]
    fn anthropic_style_does_not_inject_stream_options_even_for_stream_usage() {
        let mut body = json!({"model": "claude-sonnet-4", "stream": true});

        let adapter = ProviderAdapterFactory::for_provider(&provider("some-id", "stream_usage"));
        adapter.adapt_request_body(&mut body, UsageStyle::Anthropic, true);

        assert!(body.get("stream_options").is_none());
    }
}
