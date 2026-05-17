use serde_json::Value;

use super::{ensure_stream_options_include_usage, ProviderAdapter};

/// Generic adapter for OpenAI-compatible providers that require
/// `stream_options.include_usage: true` on streaming requests so the final
/// usage chunk is emitted for billing.
pub struct StreamUsageProviderAdapter;

impl ProviderAdapter for StreamUsageProviderAdapter {
    fn adapt_openai_request(&self, body: &mut Value, is_stream: bool) {
        if !is_stream {
            return;
        }
        ensure_stream_options_include_usage(body);
    }
}
