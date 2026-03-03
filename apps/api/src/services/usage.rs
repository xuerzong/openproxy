use chrono::Utc;
use rust_decimal::Decimal;
use serde_json::Value;
use sqlx::PgPool;
use std::error::Error;

use crate::utils;

#[derive(Debug, Clone)]
pub struct UsageInput {
    pub cost: Decimal,
    pub completion_tokens: i32,
    pub prompt_tokens: i32,
}

#[derive(Debug, Clone)]
pub struct ExtractedUsage {
    pub prompt_tokens: i32,
    pub completion_tokens: i32,
}

#[derive(Debug, Clone)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    pub is_public: bool,
    pub owned_by: String,
    pub pricing: serde_json::Value,
}

#[derive(Debug, Clone)]
pub struct UsageContext {
    pub team_id: String,
    pub api_key_id: String,
    /// Time to first token (ms).
    pub response_time: i32,
    /// Total generation time until response complete (ms).
    pub completed_time: i32,
    pub is_stream: bool,
    pub ai_provider_id: String,
    pub ai_provider_name: String,
}

pub async fn add_usage(
    pool: &PgPool,
    input: UsageInput,
    model: ModelInfo,
    ctx: UsageContext,
) -> Result<(), Box<dyn Error + Send + Sync>> {
    let mut tx = pool.begin().await?;

    let id = utils::nanoid::generate_db_id(21);

    tracing::debug!(id = %id, cost = %input.cost, model_id = %model.id, "Recording usage");

    sqlx::query!(
        r#"
        INSERT INTO usages (
            id, cost, tokens_completion, tokens_prompt, response_time,
            completed_time, team_id, api_key_id, model_id, model_name,
            model_owned_by, is_stream, ai_provider_id, ai_provider_name, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        "#,
        id,
        input.cost,
        input.completion_tokens,
        input.prompt_tokens,
        ctx.response_time,
        ctx.completed_time,
        ctx.team_id,
        ctx.api_key_id,
        model.id,
        model.name,
        model.owned_by,
        ctx.is_stream,
        ctx.ai_provider_id,
        ctx.ai_provider_name,
        Utc::now()
    )
    .execute(&mut *tx)
    .await?;

    if model.is_public {
        sqlx::query!(
            r#"
            UPDATE teams
            SET amount = amount - $1
            WHERE id = $2
            "#,
            input.cost,
            ctx.team_id
        )
        .execute(&mut *tx)
        .await?;
    }

    sqlx::query!(
        r#"
        UPDATE api_keys
        SET total_quota = total_quota + $1,
            total_requests = total_requests + 1,
            last_used_at = $2
        WHERE id = $3
        "#,
        input.cost,
        Utc::now(),
        ctx.api_key_id
    )
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    Ok(())
}

pub fn find_usage_recursive(val: &Value) -> Option<ExtractedUsage> {
    match val {
        Value::Object(map) => {
            if let Some(usage_info) = get_usage_from_resp(val) {
                return Some(usage_info);
            }
            for v in map.values() {
                if let Some(found) = find_usage_recursive(v) {
                    return Some(found);
                }
            }
        }
        Value::Array(arr) => {
            for v in arr {
                if let Some(found) = find_usage_recursive(v) {
                    return Some(found);
                }
            }
        }
        _ => {}
    }
    None
}

fn get_usage_from_resp(val: &Value) -> Option<ExtractedUsage> {
    let usage = val.get("usage")?;

    let (p_key, c_key) = if usage.get("input_tokens").is_some() {
        ("input_tokens", "output_tokens")
    } else {
        ("prompt_tokens", "completion_tokens")
    };

    let p = usage.get(p_key).and_then(|v| v.as_i64()).unwrap_or(0) as i32;
    let c = usage.get(c_key).and_then(|v| v.as_i64()).unwrap_or(0) as i32;

    Some(ExtractedUsage {
        prompt_tokens: p,
        completion_tokens: c,
    })
}
