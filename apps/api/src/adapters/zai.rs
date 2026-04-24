use serde_json::Value;

use super::{ensure_stream_options_include_usage, ProviderAdapter};

/// Z.ai / 智谱 BigModel adapter.
///
/// Base URLs:
/// - OpenAI chat/completions: `https://api.z.ai/api/paas/v4`
///   (Chinese mainland alternative: `https://open.bigmodel.cn/api/paas/v4`)
/// - Anthropic messages: `https://api.z.ai/api/anthropic`
/// - Coding-plan dedicated endpoint: `https://api.z.ai/api/coding/paas/v4`
///
/// Quirks:
/// - GLM-4.5/4.6/4.7 models accept a `thinking: { type: "enabled" }` parameter
///   for reasoning mode; forwarded as-is.
/// - Streaming chat/completions requires `stream_options.include_usage: true`
///   to emit a final usage chunk.
/// - Function calling and structured output follow the OpenAI schema.
pub struct ZaiProviderAdapter;

impl ProviderAdapter for ZaiProviderAdapter {
    fn adapt_openai_request(&self, body: &mut Value, is_stream: bool) {
        if !is_stream {
            return;
        }
        ensure_stream_options_include_usage(body);
    }
}
