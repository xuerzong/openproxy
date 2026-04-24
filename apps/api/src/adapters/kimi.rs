use serde_json::Value;

use super::{ensure_stream_options_include_usage, ProviderAdapter};

/// Moonshot / Kimi adapter.
///
/// Base URL: `https://api.moonshot.cn/v1` (China) — an international endpoint
/// (`api.moonshot.ai`) is available to some accounts but is not the default.
///
/// Styles: OpenAI `/v1/chat/completions` only. No Anthropic-compatible endpoint
/// is documented at the time of writing.
///
/// Quirks:
/// - Enforce `stream_options.include_usage: true` on streaming requests to get
///   the final usage chunk (Kimi mirrors OpenAI's behavior where this toggle is
///   required for streaming billing).
/// - Supports a `thinking` parameter for k2.6+ reasoning mode; forwarded as-is.
/// - Supports `prompt_cache_key` for coding-plan cache routing; forwarded as-is.
pub struct KimiProviderAdapter;

impl ProviderAdapter for KimiProviderAdapter {
    fn adapt_openai_request(&self, body: &mut Value, is_stream: bool) {
        if !is_stream {
            return;
        }
        ensure_stream_options_include_usage(body);
    }
}
