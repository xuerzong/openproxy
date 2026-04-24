use serde_json::Value;

use super::{ensure_stream_options_include_usage, ProviderAdapter};

/// OpenCode Zen gateway adapter.
///
/// Base URL: `https://opencode.ai/zen/v1`
/// Styles: `chat/completions`, `messages`, `responses`.
///
/// Quirks:
/// - Acts as a gateway over upstream OpenAI/Anthropic models. Curated model
///   list with US-hosted, zero-retention routing.
/// - Enforce `stream_options.include_usage: true` on streaming chat/completions
///   to guarantee usage arrives for billing regardless of upstream provider.
/// - Anthropic messages pass through unchanged.
pub struct OpencodeProviderAdapter;

impl ProviderAdapter for OpencodeProviderAdapter {
    fn adapt_openai_request(&self, body: &mut Value, is_stream: bool) {
        if !is_stream {
            return;
        }
        ensure_stream_options_include_usage(body);
    }
}
