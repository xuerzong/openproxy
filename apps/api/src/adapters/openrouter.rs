use serde_json::Value;

use super::{ensure_stream_options_include_usage, ProviderAdapter};

/// OpenRouter adapter.
///
/// Base URL: `https://openrouter.ai/api/v1`
/// Styles: OpenAI `/chat/completions` (plus OpenRouter extensions).
///
/// Quirks:
/// - Model identifiers MUST be `provider/model` (e.g. `openai/gpt-5.2`,
///   `anthropic/claude-opus-4.6`). Operators must register model names with the
///   prefix already present; this adapter does not add a prefix.
/// - OpenRouter-specific optional fields (`models`, `route`, `provider`,
///   `plugins`, `transforms`) are forwarded untouched.
/// - Streaming requires `stream_options.include_usage: true` to receive the
///   final usage chunk (OpenRouter normalizes this across underlying providers).
/// - Optional attribution headers (`HTTP-Referer`, `X-OpenRouter-Title`) are
///   NOT set here — the trait operates only on the request body. If these are
///   desired they must be set at the HTTP client layer (see shared/proxy.rs).
pub struct OpenrouterProviderAdapter;

impl ProviderAdapter for OpenrouterProviderAdapter {
    fn adapt_openai_request(&self, body: &mut Value, is_stream: bool) {
        if !is_stream {
            return;
        }
        ensure_stream_options_include_usage(body);
    }
}
