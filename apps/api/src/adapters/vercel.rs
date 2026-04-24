use serde_json::Value;

use super::{ensure_stream_options_include_usage, ProviderAdapter};

/// Vercel AI Gateway adapter.
///
/// Base URLs:
/// - OpenAI chat/completions, responses, embeddings: `https://ai-gateway.vercel.sh/v1`
/// - Anthropic messages: `https://ai-gateway.vercel.sh`
///
/// Quirks:
/// - Model identifiers must be prefixed with the provider namespace
///   (e.g. `openai/gpt-5.4`, `anthropic/claude-opus-4.6`). We do NOT enforce
///   that here — the admin-configured `model_model_name` is forwarded as-is,
///   so operators must register models with the prefix already present.
/// - On streaming OpenAI chat/completions we enforce
///   `stream_options.include_usage: true` so that downstream billing receives
///   the final usage chunk regardless of which underlying provider is routed to.
/// - Anthropic messages are proxied 1:1 to the upstream Anthropic format.
pub struct VercelProviderAdapter;

impl ProviderAdapter for VercelProviderAdapter {
    fn adapt_openai_request(&self, body: &mut Value, is_stream: bool) {
        if !is_stream {
            return;
        }
        ensure_stream_options_include_usage(body);
    }
}
