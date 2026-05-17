use serde::{Deserialize, Serialize};
use sqlx::{FromRow, PgPool, types::Json};

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

#[derive(Debug, FromRow)]
struct AIProviderRow {
    id: String,
    name: String,
    base_url: String,
    base_urls: Json<Vec<ProviderBaseUrl>>,
    supported_styles: Json<Vec<ProviderStyle>>,
    docs_url: String,
}

impl From<AIProviderRow> for AIProvider {
    fn from(row: AIProviderRow) -> Self {
        Self {
            id: row.id,
            name: row.name,
            base_url: row.base_url,
            base_urls: row.base_urls.0,
            supported_styles: row.supported_styles.0,
            docs_url: row.docs_url,
        }
    }
}

pub async fn get_all_providers(pool: &PgPool) -> Result<Vec<AIProvider>, sqlx::Error> {
    let rows = sqlx::query_as::<_, AIProviderRow>(
        r#"
        SELECT id, name, base_url, base_urls, supported_styles, docs_url
        FROM ai_providers
        ORDER BY name ASC
        "#,
    )
    .fetch_all(pool)
    .await?;

    Ok(rows.into_iter().map(AIProvider::from).collect())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn base_url_for_uses_override_when_present() {
        let provider = AIProvider {
            id: "vercel".to_string(),
            name: "Vercel".to_string(),
            base_url: "https://ai-gateway.vercel.sh/v1".to_string(),
            base_urls: vec![ProviderBaseUrl {
                style: ProviderStyle::AnthropicMessages,
                base_url: "https://ai-gateway.vercel.sh".to_string(),
            }],
            supported_styles: vec![ProviderStyle::OpenAIChat],
            docs_url: "https://vercel.com/docs/ai-gateway".to_string(),
        };

        assert_eq!(
            provider.base_url_for(ProviderStyle::AnthropicMessages),
            "https://ai-gateway.vercel.sh"
        );
        assert_eq!(
            provider.base_url_for(ProviderStyle::OpenAIChat),
            "https://ai-gateway.vercel.sh/v1"
        );
    }
}
