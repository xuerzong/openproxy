use chrono::Utc;
use rand::Rng;
use rust_decimal::Decimal;
use sqlx::PgPool;
use std::env;

use crate::{
    models::provider::{ModelAccessResult, ProviderInfo},
    utils,
};

pub async fn validate_model_access(
    pool: &PgPool,
    hash_api_key: &str,
    model_id: &str,
) -> Result<ModelAccessResult, (u16, &'static str, &'static str)> {
    // 1. Query all provider candidates alongside key/model/team info in one shot
    let rows = sqlx::query!(
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
              AND ak.status = 0
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
                ap.api_key_hash as provider_api_key_hash,
                ap.api_key as provider_api_key,
                COALESCE(mtap.weight, 1) as provider_weight
            FROM models_to_ai_providers mtap
            INNER JOIN ai_providers ap ON mtap.ai_provider_id = ap.id
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
            ti.team_amount,
            p.provider_id,
            p.provider_name,
            p.provider_model_name,
            p.provider_base_url,
            p.provider_api_key_hash,
            p.provider_api_key,
            p.provider_weight
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
        hash_api_key,
        model_id
    )
    .fetch_all(pool)
    .await
    .map_err(|_| (500, "DB_ERROR", "Database query failed"))?;

    if rows.is_empty() {
        return Err((401, "INVALID_API_KEY", "Invalid API key"));
    }

    let first_row = &rows[0];

    // 2. Expiry check
    if let Some(expires_at) = first_row.api_key_expires_at
        && expires_at < Utc::now()
    {
        return Err((402, "API_KEY_EXPIRED", "API key has expired"));
    }

    // 3. Quota check
    if first_row.api_key_max_quota != Decimal::ZERO
        && first_row.api_key_total_quota >= first_row.api_key_max_quota
    {
        return Err((403, "TOTAL_QUOTA_EXHAUSTED", "API key quota exhausted"));
    }

    // 4. Request count check
    if first_row.api_key_max_requests != 0
        && first_row.api_key_total_requests >= first_row.api_key_max_requests
    {
        return Err((402, "REQUEST_LIMIT_EXCEEDED", "Request limit reached"));
    }

    // 5. Team balance check (public models only)
    if first_row.model_is_public && first_row.team_amount <= Decimal::ZERO {
        return Err((402, "INSUFFICIENT_BALANCE", "Insufficient team balance"));
    }

    // 6. Build weighted-randomly sorted provider list
    let provider_candidates: Vec<_> = rows
        .iter()
        .map(|r| ProviderCandidate {
            weight: r.provider_weight.unwrap_or(1),
            id: r.provider_id.clone(),
            model_name: r.provider_model_name.clone(),
            base_url: r.provider_base_url.clone(),
            api_key_hash: r.provider_api_key_hash.clone(),
            api_key: r.provider_api_key.clone(),
        })
        .collect();

    let mut providers = weighted_random_sort(&provider_candidates);

    // 7. Decrypt all provider API keys
    let rsa_priv_key = env::var("RSA_PRIVATE_KEY")
        .map_err(|_| (500u16, "SERVER_ERROR", "RSA_PRIVATE_KEY not configured"))?;

    for provider in &mut providers {
        let encrypted_key = provider.model_api_key_hash.clone();
        let rsa_priv_key_clone = rsa_priv_key.clone();

        let decrypted_key = tokio::task::spawn_blocking(move || {
            utils::rsa::RsaCrypto::decrypt(&encrypted_key, &rsa_priv_key_clone)
        })
        .await
        .map_err(|_| (500u16, "SERVER_ERROR", "Thread scheduling failed"))?
        .map_err(|_| (500u16, "DECRYPT_ERROR", "Provider key decryption failed"))?;

        provider.model_api_key = decrypted_key;
    }

    if providers.is_empty() {
        return Err((500u16, "NO_PROVIDER_AVAILABLE", "No AI provider available for this model"));
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
struct ProviderCandidate {
    weight: i32,
    id: String,
    model_name: String,
    base_url: String,
    api_key_hash: String,
    #[allow(dead_code)]
    api_key: String,
}

/// Returns providers in weighted-random order.
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
            model_api_key_hash: selected.api_key_hash,
            model_api_key: selected.api_key,
            ai_provider_id: selected.id,
        });
    }

    result
}
