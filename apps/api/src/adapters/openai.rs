use super::ProviderAdapter;

/// OpenAI official API adapter.
///
/// Base URL: `https://api.openai.com/v1`
/// Styles: `chat/completions`, `responses`, `embeddings`.
///
/// Quirks: none — this is the canonical OpenAI API that other providers target.
/// The default OpenAI SDK already returns `usage` for both streaming and
/// non-streaming chat completions when `stream_options.include_usage` is
/// omitted, so we intentionally do NOT inject it (avoids altering canonical
/// client-provided requests).
pub struct OpenAIProviderAdapter;

impl ProviderAdapter for OpenAIProviderAdapter {}
