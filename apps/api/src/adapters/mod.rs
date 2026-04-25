use serde_json::{json, Value};

use crate::models::ai_provider::{find_provider_by_host, AIProvider, AI_PROVIDERS};
use crate::models::provider::ProviderInfo;
use crate::utils::chat::UsageStyle;

mod bailian;
mod deepseek;
mod default;
mod kimi;
mod minimax;
mod openai;
mod opencode;
mod openrouter;
mod vercel;
mod zai;

pub use bailian::BailianProviderAdapter;
pub use deepseek::DeepseekProviderAdapter;
pub use default::DefaultProviderAdapter;
pub use kimi::KimiProviderAdapter;
pub use minimax::MinimaxProviderAdapter;
pub use openai::OpenAIProviderAdapter;
pub use opencode::OpencodeProviderAdapter;
pub use openrouter::OpenrouterProviderAdapter;
pub use vercel::VercelProviderAdapter;
pub use zai::ZaiProviderAdapter;

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
static BAILIAN_PROVIDER_ADAPTER: BailianProviderAdapter = BailianProviderAdapter;
static OPENAI_PROVIDER_ADAPTER: OpenAIProviderAdapter = OpenAIProviderAdapter;
static VERCEL_PROVIDER_ADAPTER: VercelProviderAdapter = VercelProviderAdapter;
static KIMI_PROVIDER_ADAPTER: KimiProviderAdapter = KimiProviderAdapter;
static DEEPSEEK_PROVIDER_ADAPTER: DeepseekProviderAdapter = DeepseekProviderAdapter;
static MINIMAX_PROVIDER_ADAPTER: MinimaxProviderAdapter = MinimaxProviderAdapter;
static OPENCODE_PROVIDER_ADAPTER: OpencodeProviderAdapter = OpencodeProviderAdapter;
static OPENROUTER_PROVIDER_ADAPTER: OpenrouterProviderAdapter = OpenrouterProviderAdapter;
static ZAI_PROVIDER_ADAPTER: ZaiProviderAdapter = ZaiProviderAdapter;

pub struct ProviderAdapterFactory;

impl ProviderAdapterFactory {
    /// Pick an adapter for the given provider. Falls back to `DefaultProviderAdapter`
    /// when the provider's base URL doesn't match any entry in the hardcoded registry.
    pub fn for_provider(provider: &ProviderInfo) -> &'static dyn ProviderAdapter {
        Self::for_base_url(&provider.model_base_url)
    }

    pub fn for_provider_id(id: &str) -> &'static dyn ProviderAdapter {
        adapter_for_id(id)
    }

    pub fn for_base_url(base_url: &str) -> &'static dyn ProviderAdapter {
        match find_provider_by_host(base_url) {
            Some(p) => adapter_for_id(&p.id),
            None => &DEFAULT_PROVIDER_ADAPTER,
        }
    }
}

fn adapter_for_id(id: &str) -> &'static dyn ProviderAdapter {
    match id {
        "bailian" => &BAILIAN_PROVIDER_ADAPTER,
        "openai" => &OPENAI_PROVIDER_ADAPTER,
        "vercel" => &VERCEL_PROVIDER_ADAPTER,
        "kimi" => &KIMI_PROVIDER_ADAPTER,
        "deepseek" => &DEEPSEEK_PROVIDER_ADAPTER,
        "minimax" => &MINIMAX_PROVIDER_ADAPTER,
        "opencode" => &OPENCODE_PROVIDER_ADAPTER,
        "openrouter" => &OPENROUTER_PROVIDER_ADAPTER,
        "zai" => &ZAI_PROVIDER_ADAPTER,
        _ => &DEFAULT_PROVIDER_ADAPTER,
    }
}

/// Every id in the registry. Used in tests to guard drift between the registry
/// and adapter dispatch.
pub fn registered_providers() -> impl Iterator<Item = &'static AIProvider> {
    AI_PROVIDERS.iter()
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
    fn anthropic_entry_keeps_body_unchanged_for_anthropic_providers() {
        let mut body = serde_json::json!({
            "model": "claude-sonnet-4",
            "stream": true
        });

        let adapter = ProviderAdapterFactory::for_provider(&provider(
            "Vercel",
            "https://ai-gateway.vercel.sh",
        ));
        adapter.adapt_request_body(&mut body, UsageStyle::Anthropic, true);

        assert!(body.get("stream_options").is_none());
    }

    #[test]
    fn every_registered_provider_is_dispatched() {
        for p in registered_providers() {
            let a = ProviderAdapterFactory::for_provider_id(&p.id);
            let mut body = serde_json::json!({"stream": true});
            a.adapt_openai_request(&mut body, true);
            a.adapt_anthropic_request(&mut body, true);
            a.adapt_responses_request(&mut body, true);
        }
    }

    #[test]
    fn factory_dispatches_by_base_url_host() {
        let a =
            ProviderAdapterFactory::for_base_url("https://api.deepseek.com/v1/chat/completions");
        let mut body = serde_json::json!({"model": "deepseek-chat", "stream": true});
        a.adapt_openai_request(&mut body, true);
        assert_eq!(
            body.get("stream_options")
                .and_then(|v| v.get("include_usage"))
                .and_then(Value::as_bool),
            Some(true)
        );
    }
}
