use chrono::Utc;
use rand::Rng;
use rust_decimal::Decimal;
use sqlx::{FromRow, PgPool};
use std::env;

use crate::{
    models::provider::{ApiKeyEntry, ModelAccessResult, ProviderInfo},
    shared::redis::{
        delete_key, get_cached_string, set_add_with_expire, set_cached_string, set_members,
    },
    utils,
};

const ACCESS_ROWS_CACHE_TTL_SECONDS: usize = 30;
const ACCESS_CACHE_INDEX_TTL_SECONDS: usize = 60;
const DECRYPTED_PROVIDER_KEY_CACHE_TTL_SECONDS: usize = 60 * 60;

#[derive(Debug, FromRow, serde::Serialize, serde::Deserialize)]
struct AccessRow {
    api_key_id: String,
    api_key_max_quota: Decimal,
    api_key_max_requests: i32,
    api_key_total_quota: Decimal,
    api_key_total_requests: i32,
    api_key_expires_at: Option<chrono::DateTime<Utc>>,
    team_id: String,
    model_id: String,
    model_name: String,
    model_owned_by: String,
    model_is_public: bool,
    model_pricing: serde_json::Value,
    team_amount: Decimal,
    provider_id: String,
    provider_model_name: String,
    provider_base_url: String,
    provider_api_key_hash: String,
    provider_api_key: String,
    provider_weight: i32,
    provider_api_key_id: String,
}

async fn fetch_access_rows(
    pool: &PgPool,
    hash_api_key: &str,
    model_id: &str,
) -> Result<Vec<AccessRow>, (u16, &'static str, &'static str)> {
    sqlx::query_as::<_, AccessRow>(
        r#"
        WITH api_key_info AS (
            SELECT 
                ak.id as api_key_id, 
                ak.max_quota as api_key_max_quota, 
                ak.max_requests as api_key_max_requests, 
                ak.total_quota as api_key_total_quota, 
                ak.total_requests as api_key_total_requests, 
                ak.expires_at as api_key_expires_at,
                ak.team_id
            FROM api_keys ak
            WHERE ak.api_key_hash = $1
        ),
        model_info AS (
            SELECT 
                m.id as model_id,
                m.name as model_name, 
                m.owned_by as model_owned_by, 
                m.is_public as model_is_public, 
                m.pricing as model_pricing
            FROM models m
            WHERE m.id = $2
        ),
        providers AS (
            SELECT 
                ap.id as provider_id,
                ap.name as provider_name,
                mtap.model as provider_model_name,
                ap.base_url as provider_base_url,
                apk.api_key_hash as provider_api_key_hash,
                apk.api_key as provider_api_key,
                apk.id as provider_api_key_id,
                COALESCE(mtap.weight, 1) as provider_weight
            FROM models_to_ai_providers mtap
            INNER JOIN ai_providers ap ON mtap.ai_provider_id = ap.id
            INNER JOIN ai_provider_api_keys apk ON apk.ai_provider_id = ap.id
                        WHERE mtap.model_id = $2
                            AND mtap.status = 1
        ),
        team_info AS (
            SELECT 
                t.amount as team_amount
            FROM teams t
            INNER JOIN api_key_info aki ON t.id = aki.team_id
        )
        SELECT 
            aki.api_key_id,
            aki.api_key_max_quota,
            aki.api_key_max_requests,
            aki.api_key_total_quota,
            aki.api_key_total_requests,
            aki.api_key_expires_at,
            aki.team_id,
            mi.model_id,
            mi.model_name,
            mi.model_owned_by,
            mi.model_is_public,
            mi.model_pricing,
            COALESCE(ti.team_amount, 0) as team_amount,
            p.provider_id,
            p.provider_model_name,
            p.provider_base_url,
            p.provider_api_key_hash,
            p.provider_api_key,
            p.provider_weight,
            p.provider_api_key_id
        FROM api_key_info aki
        CROSS JOIN model_info mi
        CROSS JOIN providers p
        LEFT JOIN team_info ti ON true
        WHERE EXISTS (
            SELECT 1 FROM api_keys_to_models akm 
            WHERE akm.api_key_id = aki.api_key_id 
            AND akm.model_id = mi.model_id
        )
        "#,
    )
    .bind(hash_api_key)
    .bind(model_id)
    .fetch_all(pool)
    .await
    .map_err(|_| (500, "DB_ERROR", "Database query failed"))
}

fn cache_access_rows(cache_key: &str, rows: &[AccessRow]) {
    if let Ok(serialized_rows) = serde_json::to_string(rows) {
        set_cached_string(cache_key, &serialized_rows, ACCESS_ROWS_CACHE_TTL_SECONDS);

        if let Some(first_row) = rows.first() {
            let index_key = access_cache_index_key(&first_row.api_key_id);
            let _ = set_add_with_expire(&index_key, cache_key, ACCESS_CACHE_INDEX_TTL_SECONDS);
        }
    }
}

fn access_cache_index_key(api_key_id: &str) -> String {
    format!("openproxy:access:index:{api_key_id}")
}

pub fn invalidate_access_cache_for_api_key(api_key_id: &str) {
    let index_key = access_cache_index_key(api_key_id);
    let keys = set_members(&index_key).unwrap_or_default();

    for cache_key in keys {
        delete_key(&cache_key);
    }

    delete_key(&index_key);
}

fn decrypted_provider_key_cache_key(encrypted_key: &str) -> String {
    format!("openproxy:cache:decrypted_provider_key:{encrypted_key}")
}

fn get_cached_decrypted_provider_key(encrypted_key: &str) -> Option<String> {
    get_cached_string(&decrypted_provider_key_cache_key(encrypted_key))
}

fn set_cached_decrypted_provider_key(encrypted_key: &str, decrypted_key: &str) {
    set_cached_string(
        &decrypted_provider_key_cache_key(encrypted_key),
        decrypted_key,
        DECRYPTED_PROVIDER_KEY_CACHE_TTL_SECONDS,
    );
}

pub async fn validate_model_access(
    pool: &PgPool,
    hash_api_key: &str,
    model_id: &str,
) -> Result<ModelAccessResult, (u16, &'static str, &'static str)> {
    let access_rows_cache_key = format!("openproxy:access:rows:{hash_api_key}:{model_id}");

    let rows = if let Some(cached) = get_cached_string(&access_rows_cache_key) {
        if let Ok(cached_rows) = serde_json::from_str::<Vec<AccessRow>>(&cached) {
            cached_rows
        } else {
            let fetched_rows = fetch_access_rows(pool, hash_api_key, model_id).await?;
            cache_access_rows(&access_rows_cache_key, &fetched_rows);
            fetched_rows
        }
    } else {
        let fetched_rows = fetch_access_rows(pool, hash_api_key, model_id).await?;

        cache_access_rows(&access_rows_cache_key, &fetched_rows);

        fetched_rows
    };

    if rows.is_empty() {
        return Err((401, "INVALID_API_KEY", "Invalid API key"));
    }

    let first_row = &rows[0];

    if let Some(expires_at) = first_row.api_key_expires_at
        && expires_at < Utc::now()
    {
        return Err((402, "API_KEY_EXPIRED", "API key has expired"));
    }

    if first_row.api_key_max_quota != Decimal::ZERO
        && first_row.api_key_total_quota >= first_row.api_key_max_quota
    {
        return Err((403, "TOTAL_QUOTA_EXHAUSTED", "API key quota exhausted"));
    }

    if first_row.api_key_max_requests != 0
        && first_row.api_key_total_requests >= first_row.api_key_max_requests
    {
        return Err((402, "REQUEST_LIMIT_EXCEEDED", "Request limit reached"));
    }

    if first_row.model_is_public && first_row.team_amount <= Decimal::ZERO {
        return Err((402, "INSUFFICIENT_BALANCE", "Insufficient team balance"));
    }

    use std::collections::HashMap;
    let mut provider_map: HashMap<String, ProviderCandidate> = HashMap::new();
    for r in &rows {
        let entry = provider_map.entry(r.provider_id.clone()).or_insert_with(|| {
            ProviderCandidate {
                weight: r.provider_weight,
                id: r.provider_id.clone(),
                model_name: r.provider_model_name.clone(),
                base_url: r.provider_base_url.clone(),
                api_keys: Vec::new(),
            }
        });
        if !entry.api_keys.iter().any(|k| k.id == r.provider_api_key_id) {
            entry.api_keys.push(ProviderApiKeyCandidate {
                id: r.provider_api_key_id.clone(),
                api_key_hash: r.provider_api_key_hash.clone(),
                api_key: r.provider_api_key.clone(),
            });
        }
    }
    let provider_candidates: Vec<_> = provider_map.into_values().collect();

    let mut providers = weighted_random_sort(&provider_candidates);

    let rsa_priv_key = env::var("RSA_PRIVATE_KEY")
        .map_err(|_| (500u16, "SERVER_ERROR", "RSA_PRIVATE_KEY not configured"))?;

    for provider in &mut providers {
        for api_key_entry in &mut provider.api_keys {
            let encrypted_key = api_key_entry.api_key_hash.clone();

            if let Some(cached_key) = get_cached_decrypted_provider_key(&encrypted_key) {
                api_key_entry.api_key = cached_key;
                continue;
            }

            let rsa_priv_key_clone = rsa_priv_key.clone();

            let decrypted_key = tokio::task::spawn_blocking(move || {
                utils::rsa::RsaCrypto::decrypt(&encrypted_key, &rsa_priv_key_clone)
            })
            .await
            .map_err(|_| (500u16, "SERVER_ERROR", "Thread scheduling failed"))?
            .map_err(|_| (500u16, "DECRYPT_ERROR", "Provider key decryption failed"))?;

            api_key_entry.api_key = decrypted_key.clone();
            set_cached_decrypted_provider_key(&api_key_entry.api_key_hash, &decrypted_key);
        }
    }

    if providers.is_empty() {
        return Err((
            500u16,
            "NO_PROVIDER_AVAILABLE",
            "No AI provider available for this model",
        ));
    }

    Ok(ModelAccessResult {
        api_key_id: first_row.api_key_id.clone(),
        api_key_max_quota: first_row.api_key_max_quota,
        api_key_max_requests: first_row.api_key_max_requests,
        api_key_total_quota: first_row.api_key_total_quota,
        api_key_total_requests: first_row.api_key_total_requests,
        api_key_expires_at: first_row.api_key_expires_at,
        team_id: first_row.team_id.clone(),
        model_id: first_row.model_id.clone(),
        model_name: first_row.model_name.clone(),
        model_owned_by: first_row.model_owned_by.clone(),
        model_is_public: first_row.model_is_public,
        model_pricing: first_row.model_pricing.clone(),
        user_amount: Some(first_row.team_amount),
        user_cost: Some(Decimal::ZERO),
        monthly_free_allowance: Some(Decimal::ZERO),
        monthly_free_used: Some(Decimal::ZERO),
        monthly_free_last_reset_at: None,
        providers,
    })
}

#[derive(Debug, Clone)]
struct ProviderApiKeyCandidate {
    id: String,
    api_key_hash: String,
    #[allow(dead_code)]
    api_key: String,
}

#[derive(Debug, Clone)]
struct ProviderCandidate {
    weight: i32,
    id: String,
    model_name: String,
    base_url: String,
    api_keys: Vec<ProviderApiKeyCandidate>,
}

fn weighted_random_sort(candidates: &[ProviderCandidate]) -> Vec<ProviderInfo> {
    if candidates.is_empty() {
        return Vec::new();
    }

    let mut result = Vec::new();
    let mut remaining = candidates.to_vec();

    while !remaining.is_empty() {
        let total_weight: i32 = remaining.iter().map(|p| p.weight).sum();

        let selected_idx = if total_weight <= 0 {
            rand::thread_rng().gen_range(0..remaining.len())
        } else {
            let random_val = rand::thread_rng().gen_range(0..total_weight);
            let mut cumulative = 0;
            let mut idx = 0;
            for (i, candidate) in remaining.iter().enumerate() {
                cumulative += candidate.weight;
                if random_val < cumulative {
                    idx = i;
                    break;
                }
            }
            idx
        };

        let selected = remaining.remove(selected_idx);
        result.push(ProviderInfo {
            model_model_name: selected.model_name,
            model_base_url: selected.base_url,
            ai_provider_id: selected.id,
            api_keys: selected
                .api_keys
                .into_iter()
                .map(|k| ApiKeyEntry {
                    api_key_hash: k.api_key_hash,
                    api_key: k.api_key,
                })
                .collect(),
        });
    }

    result
}
