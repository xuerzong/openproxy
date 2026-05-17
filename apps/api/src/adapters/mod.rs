use std::collections::HashMap;
use std::sync::OnceLock;

use serde::Deserialize;
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

/// Adapter selection kinds — kept in sync with `ProviderAdapterKind` in
/// `packages/config/src/ai-providers.ts`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "snake_case")]
enum AdapterKind {
    Default,
    Openai,
    StreamUsage,
}

impl AdapterKind {
    fn resolve(self) -> &'static dyn ProviderAdapter {
        match self {
            AdapterKind::Default => &DEFAULT_PROVIDER_ADAPTER,
            AdapterKind::Openai => &OPENAI_PROVIDER_ADAPTER,
            AdapterKind::StreamUsage => &STREAM_USAGE_PROVIDER_ADAPTER,
        }
    }
}

/// Minimal registry entry — only fields we need for adapter dispatch.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RegistryEntry {
    id: String,
    #[serde(default)]
    adapter_kind: Option<AdapterKind>,
}

/// Built-in provider id → adapter kind, parsed from
/// `apps/api/generated/ai-providers.json` (kept in sync with
/// `packages/config/src/ai-providers.json` via `bun run sync:api-provider-registry`).
/// Custom providers created via the admin UI are absent from this map and fall
/// back to `AdapterKind::Default`.
fn adapter_kind_map() -> &'static HashMap<String, AdapterKind> {
    static MAP: OnceLock<HashMap<String, AdapterKind>> = OnceLock::new();
    MAP.get_or_init(|| {
        const REGISTRY_JSON: &str = include_str!("../../generated/ai-providers.json");
        let entries: Vec<RegistryEntry> = serde_json::from_str(REGISTRY_JSON)
            .expect("apps/api/generated/ai-providers.json is malformed");
        entries
            .into_iter()
            .filter_map(|entry| entry.adapter_kind.map(|kind| (entry.id, kind)))
            .collect()
    })
}

pub struct ProviderAdapterFactory;

impl ProviderAdapterFactory {
    /// Pick an adapter for the given provider. Falls back to `DefaultProviderAdapter`
    /// when the provider id is not in the built-in registry or has no `adapterKind`.
    pub fn for_provider(provider: &ProviderInfo) -> &'static dyn ProviderAdapter {
        Self::for_provider_id(&provider.ai_provider_id)
    }

    pub fn for_provider_id(id: &str) -> &'static dyn ProviderAdapter {
        adapter_kind_map()
            .get(id)
            .copied()
            .unwrap_or(AdapterKind::Default)
            .resolve()
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

    fn provider(id: &str) -> ProviderInfo {
        ProviderInfo {
            model_model_name: "model".to_string(),
            model_base_url: "https://example.com".to_string(),
            ai_provider_id: id.to_string(),
            api_keys: vec![ApiKeyEntry {
                api_key_hash: "hash".to_string(),
                api_key: "key".to_string(),
            }],
        }
    }

    #[test]
    fn stream_usage_providers_inject_include_usage_on_streaming() {
        let kinds = adapter_kind_map();
        let stream_usage_ids: Vec<&String> = kinds
            .iter()
            .filter_map(|(id, kind)| (*kind == AdapterKind::StreamUsage).then_some(id))
            .collect();
        assert!(
            !stream_usage_ids.is_empty(),
            "registry should include at least one stream_usage provider"
        );

        for id in stream_usage_ids {
            let adapter = ProviderAdapterFactory::for_provider(&provider(id));
            let mut body = json!({"stream": true});
            adapter.adapt_openai_request(&mut body, true);
            assert_eq!(
                body.pointer("/stream_options/include_usage")
                    .and_then(Value::as_bool),
                Some(true),
                "provider `{id}` should inject stream_options.include_usage"
            );
        }
    }

    #[test]
    fn unknown_provider_falls_back_to_default_adapter() {
        let adapter = ProviderAdapterFactory::for_provider_id("not-a-real-provider");
        let mut body = json!({"stream": true});
        adapter.adapt_openai_request(&mut body, true);
        assert!(body.get("stream_options").is_none());
    }

    #[test]
    fn anthropic_entry_keeps_body_unchanged_for_anthropic_providers() {
        let mut body = json!({"model": "claude-sonnet-4", "stream": true});

        let adapter = ProviderAdapterFactory::for_provider(&provider("vercel"));
        adapter.adapt_request_body(&mut body, UsageStyle::Anthropic, true);

        assert!(body.get("stream_options").is_none());
    }
}
