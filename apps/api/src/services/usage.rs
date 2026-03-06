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
    pub input_cache_read_tokens: i32,
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

    sqlx::query(
        r#"
        INSERT INTO usages (
            id, cost, tokens_completion, tokens_prompt, response_time,
            completed_time, team_id, api_key_id, model_id, model_name,
            model_owned_by, is_stream, ai_provider_id, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        "#,
    )
    .bind(id)
    .bind(input.cost)
    .bind(input.completion_tokens)
    .bind(input.prompt_tokens)
    .bind(ctx.response_time)
    .bind(ctx.completed_time)
    .bind(&ctx.team_id)
    .bind(&ctx.api_key_id)
    .bind(model.id)
    .bind(model.name)
    .bind(model.owned_by)
    .bind(ctx.is_stream)
    .bind(ctx.ai_provider_id)
    .bind(Utc::now())
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
    if usage.is_null() {
        return None;
    }

    let (p_key, c_key) = if usage.get("input_tokens").is_some() {
        ("input_tokens", "output_tokens")
    } else {
        ("prompt_tokens", "completion_tokens")
    };

    let p = usage.get(p_key).and_then(|v| v.as_i64()).unwrap_or(0) as i32;
    let c = usage.get(c_key).and_then(|v| v.as_i64()).unwrap_or(0) as i32;
    let input_cache_read_tokens = usage
        .get("cache_read_input_tokens")
        .and_then(|v| v.as_i64())
        .or_else(|| {
            usage
                .get("prompt_tokens_details")
                .and_then(|v| v.get("cached_tokens"))
                .and_then(|v| v.as_i64())
        })
        .unwrap_or(0) as i32;

    Some(ExtractedUsage {
        prompt_tokens: p,
        completion_tokens: c,
        input_cache_read_tokens,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn get_usage_from_resp_returns_none_when_usage_is_null() {
        let val = json!({
            "usage": null
        });

        let usage = get_usage_from_resp(&val);

        assert!(usage.is_none());
    }

    #[test]
    fn get_usage_from_resp_extracts_usage_when_present() {
        let val = json!({
            "usage": {
                "prompt_tokens": 123,
                "completion_tokens": 45,
                "prompt_tokens_details": {
                    "cached_tokens": 7
                }
            }
        });

        let usage = get_usage_from_resp(&val).expect("usage should be extracted");

        assert_eq!(usage.prompt_tokens, 123);
        assert_eq!(usage.completion_tokens, 45);
        assert_eq!(usage.input_cache_read_tokens, 7);
    }
}
