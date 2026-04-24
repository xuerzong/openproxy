use serde_json::Value;

use super::{ensure_stream_options_include_usage, ProviderAdapter};

/// DeepSeek adapter.
///
/// Base URLs:
/// - OpenAI chat/completions: `https://api.deepseek.com/v1`
/// - Anthropic messages: `https://api.deepseek.com/anthropic`
///
/// Quirks:
/// - Enforce `stream_options.include_usage: true` on streaming chat/completions.
/// - Exposes `reasoning_effort` / `thinking` for reasoning-capable models;
///   forwarded as-is.
/// - Anthropic-compat endpoint accepts the standard Anthropic Messages payload;
///   no transformation is required beyond routing.
pub struct DeepseekProviderAdapter;

impl ProviderAdapter for DeepseekProviderAdapter {
    fn adapt_openai_request(&self, body: &mut Value, is_stream: bool) {
        if !is_stream {
            return;
        }
        ensure_stream_options_include_usage(body);
    }
}
