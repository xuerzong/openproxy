use std::sync::LazyLock;

use serde::{Deserialize, Serialize};

/// API style supported by a provider endpoint.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProviderStyle {
    /// OpenAI `/v1/chat/completions` style.
    #[serde(rename = "openai_chat")]
    OpenAIChat,
    /// Anthropic `/v1/messages` style.
    #[serde(rename = "anthropic_messages")]
    AnthropicMessages,
    /// OpenAI `/v1/responses` style.
    #[serde(rename = "openai_responses")]
    OpenAIResponses,
    /// OpenAI `/v1/embeddings` style.
    #[serde(rename = "embeddings")]
    Embeddings,
}

/// Base URL override for a specific API style.
/// Most providers use a single base URL for all styles; a few (e.g. Vercel AI Gateway)
/// use different base URLs for OpenAI-style and Anthropic-style endpoints.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderBaseUrl {
    pub style: ProviderStyle,
    pub base_url: String,
}

/// A hardcoded AI provider definition. The list of supported providers is compiled
/// into the binary; administrators pick from this registry instead of defining
/// providers freeform.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AIProvider {
    /// Stable slug used as primary key (e.g. `bailian`, `openai`).
    pub id: String,
    /// Display name (English or primary brand name).
    pub name: String,
    /// Default base URL used when a per-style override is not provided.
    pub base_url: String,
    /// Per-style base URL overrides (used when a provider exposes different hosts per style).
    pub base_urls: Vec<ProviderBaseUrl>,
    /// API styles this provider officially supports.
    pub supported_styles: Vec<ProviderStyle>,
    /// Official docs URL.
    pub docs_url: String,
}

impl AIProvider {
    pub fn base_url_for(&self, style: ProviderStyle) -> &str {
        self.base_urls
            .iter()
            .find(|entry| entry.style == style)
            .map(|entry| entry.base_url.as_str())
            .unwrap_or(self.base_url.as_str())
    }
}

/// Shared AI provider registry loaded from the single source of truth JSON file.
///
/// Generated source file: `apps/api/generated/ai-providers.json`
pub static AI_PROVIDERS: LazyLock<Vec<AIProvider>> = LazyLock::new(load_ai_providers);

fn load_ai_providers() -> Vec<AIProvider> {
    serde_json::from_str(include_str!("../../generated/ai-providers.json"))
        .expect("apps/api/generated/ai-providers.json must contain valid AI provider JSON")
}

/// Look up a provider by id.
pub fn find_provider_by_id(id: &str) -> Option<&'static AIProvider> {
    AI_PROVIDERS.iter().find(|p| p.id == id)
}

/// Find a provider whose base URL matches the given URL (any registered style).
/// Matching is by case-insensitive substring; the first match wins.
pub fn find_provider_by_base_url(url: &str) -> Option<&'static AIProvider> {
    let lower = url.to_ascii_lowercase();
    AI_PROVIDERS.iter().find(|p| {
        if lower.contains(&p.base_url.to_ascii_lowercase()) {
            return true;
        }
        p.base_urls
            .iter()
            .any(|b| lower.contains(&b.base_url.to_ascii_lowercase()))
    })
}

/// Find a provider whose base URL's host matches the given URL.
/// Useful when model base URLs contain different path suffixes than the registry.
pub fn find_provider_by_host(url: &str) -> Option<&'static AIProvider> {
    let host = extract_host(url)?;
    AI_PROVIDERS.iter().find(|p| {
        if extract_host(&p.base_url).as_deref() == Some(host) {
            return true;
        }
        p.base_urls
            .iter()
            .any(|b| extract_host(&b.base_url).as_deref() == Some(host))
    })
}

fn extract_host(url: &str) -> Option<&str> {
    let without_scheme = url.split_once("://").map(|(_, rest)| rest).unwrap_or(url);
    let host = without_scheme.split('/').next()?;
    Some(host)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_provider_has_nonempty_slug_and_name() {
        for p in AI_PROVIDERS.iter() {
            assert!(!p.id.is_empty());
            assert!(!p.name.is_empty());
            assert!(!p.base_url.is_empty());
            assert!(!p.supported_styles.is_empty());
        }
    }

    #[test]
    fn find_provider_by_id_works() {
        assert_eq!(
            find_provider_by_id("bailian").map(|p| p.id.as_str()),
            Some("bailian")
        );
        assert!(find_provider_by_id("nope").is_none());
    }

    #[test]
    fn find_provider_by_host_matches_bailian() {
        let p = find_provider_by_host(
            "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        );
        assert_eq!(p.map(|p| p.id.as_str()), Some("bailian"));
    }

    #[test]
    fn find_provider_by_host_matches_vercel_anthropic() {
        let p = find_provider_by_host("https://ai-gateway.vercel.sh/v1/messages");
        assert_eq!(p.map(|p| p.id.as_str()), Some("vercel"));
    }
}
