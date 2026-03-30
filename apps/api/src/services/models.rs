use crate::models::model::{Model, ModelPublic};
use sqlx::PgPool;

const PUBLIC_MODELS_CACHE_KEY: &str = "openproxy:models:public:v1";
const PUBLIC_MODELS_CACHE_TTL_SECONDS: usize = 60;

pub async fn get_public_models(pool: &PgPool) -> Result<Vec<ModelPublic>, sqlx::Error> {
    if let Some(cached_payload) = crate::shared::redis::get_cached_string(PUBLIC_MODELS_CACHE_KEY)
    {
        if let Ok(cached_models) = serde_json::from_str::<Vec<ModelPublic>>(&cached_payload) {
            return Ok(cached_models);
        }
    }

    let models = sqlx::query_as::<_, Model>(
        "SELECT id, is_public, name, description, model, owned_by, context_window, max_tokens, \
         type, styles, tags, pricing, metadata, created_at, updated_at \
         FROM models WHERE is_public = true ORDER BY created_at DESC",
    )
    .fetch_all(pool)
    .await?;

    let public_models: Vec<ModelPublic> = models.into_iter().map(ModelPublic::from).collect();

    if let Ok(serialized_models) = serde_json::to_string(&public_models) {
        crate::shared::redis::set_cached_string(
            PUBLIC_MODELS_CACHE_KEY,
            &serialized_models,
            PUBLIC_MODELS_CACHE_TTL_SECONDS,
        );
    }

    Ok(public_models)
}
