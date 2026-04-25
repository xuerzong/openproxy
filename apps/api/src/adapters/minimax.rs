use serde_json::Value;

use super::{ensure_stream_options_include_usage, ProviderAdapter};

/// MiniMax adapter.
///
/// Base URLs:
/// - OpenAI chat/completions: `https://api.minimaxi.com/v1` (international host).
///   The legacy MiniMax-native endpoint (`/v1/text/chatcompletion_v2`) is NOT
///   OpenAI-compatible; configure models to use the OpenAI-compatible path.
/// - Anthropic messages: `https://api.minimaxi.com/anthropic`
///
/// Quirks:
/// - Streaming chat/completions requires `stream_options.include_usage: true`
///   to emit a final usage chunk; otherwise we cannot bill streaming requests.
/// - The non-OpenAI MiniMax endpoints use a different response shape
///   (`reply`, `base_resp`, `sender_type` USER/BOT) and are not supported by
///   this adapter — use only the OpenAI-compatible base URL above.
pub struct MinimaxProviderAdapter;

impl ProviderAdapter for MinimaxProviderAdapter {
    fn adapt_openai_request(&self, body: &mut Value, is_stream: bool) {
        if !is_stream {
            return;
        }
        ensure_stream_options_include_usage(body);
    }
}
