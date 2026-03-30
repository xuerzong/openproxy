use chrono::Utc;
use rust_decimal::Decimal;
use serde_json::Value;
use sqlx::PgPool;
use std::error::Error;
use std::fmt;
use tracing::warn;

use crate::services::access::invalidate_access_cache_for_api_key;
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

#[derive(Debug)]
enum UsageAccountingErrorKind {
    TeamNotFound,
    InsufficientTeamBalance,
    ApiKeyNotFound,
    ApiKeyQuotaExhausted,
    ApiKeyRequestLimitExceeded,
    ApiKeyUsageUpdateRejected,
}

impl UsageAccountingErrorKind {
    fn as_str(&self) -> &'static str {
        match self {
            Self::TeamNotFound => "team_not_found",
            Self::InsufficientTeamBalance => "insufficient_team_balance",
            Self::ApiKeyNotFound => "api_key_not_found",
            Self::ApiKeyQuotaExhausted => "api_key_quota_exhausted",
            Self::ApiKeyRequestLimitExceeded => "api_key_request_limit_exceeded",
            Self::ApiKeyUsageUpdateRejected => "api_key_usage_update_rejected",
        }
    }
}

#[derive(Debug)]
struct UsageAccountingError {
    kind: UsageAccountingErrorKind,
    message: &'static str,
}

impl UsageAccountingError {
    fn new(kind: UsageAccountingErrorKind, message: &'static str) -> Self {
        Self { kind, message }
    }
}

impl fmt::Display for UsageAccountingError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.message)
    }
}

impl Error for UsageAccountingError {}

fn accounting_error(
    kind: UsageAccountingErrorKind,
    message: &'static str,
    team_id: Option<&str>,
    api_key_id: Option<&str>,
    cost: Option<Decimal>,
) -> Box<dyn Error + Send + Sync> {
    warn!(
        error_kind = kind.as_str(),
        team_id = team_id.unwrap_or_default(),
        api_key_id = api_key_id.unwrap_or_default(),
        cost = ?cost,
        message,
        "Usage accounting rejected"
    );

    Box::new(UsageAccountingError::new(kind, message))
}

pub fn log_usage_recording_failure(
    error: &(dyn Error + 'static),
    model: &ModelInfo,
    ctx: &UsageContext,
    stage: &'static str,
) {
    let error_kind = error
        .downcast_ref::<UsageAccountingError>()
        .map(|err| err.kind.as_str())
        .unwrap_or("usage_recording_unexpected");

    tracing::error!(
        error_kind,
        error = %error,
        stage,
        team_id = %ctx.team_id,
        api_key_id = %ctx.api_key_id,
        model_id = %model.id,
        provider_id = %ctx.ai_provider_id,
        is_stream = ctx.is_stream,
        "Failed to record usage"
    );
}

async fn deduct_team_balance(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    team_id: &str,
    cost: Decimal,
) -> Result<(), Box<dyn Error + Send + Sync>> {
    let updated = sqlx::query_scalar::<_, String>(
        r#"
        UPDATE teams
        SET amount = amount - $1
        WHERE id = $2
          AND amount >= $1
        RETURNING id
        "#,
    )
    .bind(cost)
    .bind(team_id)
    .fetch_optional(&mut **tx)
    .await?;

    if updated.is_some() {
        return Ok(());
    }

    let exists = sqlx::query_scalar::<_, String>("SELECT id FROM teams WHERE id = $1")
        .bind(team_id)
        .fetch_optional(&mut **tx)
        .await?;

    if exists.is_none() {
        return Err(accounting_error(
            UsageAccountingErrorKind::TeamNotFound,
            "Team not found while recording usage",
            Some(team_id),
            None,
            Some(cost),
        ));
    }

    Err(accounting_error(
        UsageAccountingErrorKind::InsufficientTeamBalance,
        "Insufficient team balance while recording usage",
        Some(team_id),
        None,
        Some(cost),
    ))
}

async fn update_api_key_usage(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    api_key_id: &str,
    cost: Decimal,
    used_at: chrono::DateTime<Utc>,
) -> Result<(), Box<dyn Error + Send + Sync>> {
    let updated = sqlx::query_scalar::<_, String>(
        r#"
        UPDATE api_keys
        SET total_quota = total_quota + $1,
            total_requests = total_requests + 1,
            last_used_at = $2
        WHERE id = $3
          AND (max_quota = 0 OR total_quota + $1 <= max_quota)
          AND (max_requests = 0 OR total_requests + 1 <= max_requests)
        RETURNING id
        "#,
    )
    .bind(cost)
    .bind(used_at)
    .bind(api_key_id)
    .fetch_optional(&mut **tx)
    .await?;

    if updated.is_some() {
        return Ok(());
    }

    let current = sqlx::query_as::<_, (Decimal, Decimal, i32, i32)>(
        r#"
        SELECT max_quota, total_quota, max_requests, total_requests
        FROM api_keys
        WHERE id = $1
        "#,
    )
    .bind(api_key_id)
    .fetch_optional(&mut **tx)
    .await?;

    let Some((max_quota, total_quota, max_requests, total_requests)) = current else {
        return Err(accounting_error(
            UsageAccountingErrorKind::ApiKeyNotFound,
            "API key not found while recording usage",
            None,
            Some(api_key_id),
            Some(cost),
        ));
    };

    if max_quota != Decimal::ZERO && total_quota + cost > max_quota {
        return Err(accounting_error(
            UsageAccountingErrorKind::ApiKeyQuotaExhausted,
            "API key quota exhausted while recording usage",
            None,
            Some(api_key_id),
            Some(cost),
        ));
    }

    if max_requests != 0 && total_requests + 1 > max_requests {
        return Err(accounting_error(
            UsageAccountingErrorKind::ApiKeyRequestLimitExceeded,
            "API key request limit exceeded while recording usage",
            None,
            Some(api_key_id),
            Some(cost),
        ));
    }

    Err(accounting_error(
        UsageAccountingErrorKind::ApiKeyUsageUpdateRejected,
        "API key usage update rejected while recording usage",
        None,
        Some(api_key_id),
        Some(cost),
    ))
}

pub async fn add_usage(
    pool: &PgPool,
    input: UsageInput,
    model: ModelInfo,
    ctx: UsageContext,
) -> Result<(), Box<dyn Error + Send + Sync>> {
    let mut tx = pool.begin().await?;
    let used_at = Utc::now();

    let id = utils::nanoid::generate_db_id(21);

    tracing::debug!(id = %id, cost = %input.cost, model_id = %model.id, "Recording usage");

    if model.is_public {
        deduct_team_balance(&mut tx, &ctx.team_id, input.cost).await?;
    }

    update_api_key_usage(&mut tx, &ctx.api_key_id, input.cost, used_at).await?;

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
    .bind(used_at)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    invalidate_access_cache_for_api_key(&ctx.api_key_id);

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
    use dotenvy::dotenv;
    use futures_util::future::join_all;
    use rand::random;
    use rust_decimal::prelude::FromStr;
    use serde_json::json;
    use sqlx::{Executor, Row, postgres::PgPoolOptions};
    use std::sync::Arc;
    use tokio::sync::Barrier;

    struct SharedSchemaTestDb {
        admin_pool: PgPool,
        pool: PgPool,
        schema_name: String,
    }

    impl SharedSchemaTestDb {
        async fn new(max_connections: u32) -> Option<Self> {
            let _ = dotenv();
            let database_url = std::env::var("DATABASE_URL").ok()?;
            let admin_pool = PgPoolOptions::new()
                .max_connections(1)
                .connect(&database_url)
                .await
                .ok()?;

            let schema_name = format!("usage_test_{}", random::<u64>());
            admin_pool
                .execute(format!("CREATE SCHEMA {}", schema_name).as_str())
                .await
                .ok()?;

            let schema_for_pool = schema_name.clone();
            let pool = PgPoolOptions::new()
                .max_connections(max_connections)
                .after_connect(move |conn, _meta| {
                    let schema = schema_for_pool.clone();
                    Box::pin(async move {
                        conn.execute(format!("SET search_path TO {}", schema).as_str())
                            .await?;
                        Ok(())
                    })
                })
                .connect(&database_url)
                .await
                .ok()?;

            sqlx::query(
                r#"
                CREATE TABLE teams (
                    id TEXT PRIMARY KEY,
                    amount NUMERIC NOT NULL
                )
                "#,
            )
            .execute(&pool)
            .await
            .ok()?;

            sqlx::query(
                r#"
                CREATE TABLE api_keys (
                    id TEXT PRIMARY KEY,
                    max_quota NUMERIC NOT NULL,
                    max_requests INTEGER NOT NULL,
                    total_quota NUMERIC NOT NULL,
                    total_requests INTEGER NOT NULL,
                    last_used_at TIMESTAMPTZ NULL
                )
                "#,
            )
            .execute(&pool)
            .await
            .ok()?;

            sqlx::query(
                r#"
                CREATE TABLE usages (
                    id TEXT PRIMARY KEY,
                    cost NUMERIC NOT NULL,
                    tokens_completion INTEGER NOT NULL,
                    tokens_prompt INTEGER NOT NULL,
                    response_time INTEGER NOT NULL,
                    completed_time INTEGER NOT NULL,
                    team_id TEXT NOT NULL,
                    api_key_id TEXT NOT NULL,
                    model_id TEXT NOT NULL,
                    model_name TEXT NOT NULL,
                    model_owned_by TEXT NOT NULL,
                    is_stream BOOLEAN NOT NULL,
                    ai_provider_id TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL
                )
                "#,
            )
            .execute(&pool)
            .await
            .ok()?;

            Some(Self {
                admin_pool,
                pool,
                schema_name,
            })
        }

        async fn cleanup(self) {
            self.pool.close().await;
            let _ = self
                .admin_pool
                .execute(format!("DROP SCHEMA IF EXISTS {} CASCADE", self.schema_name).as_str())
                .await;
            self.admin_pool.close().await;
        }
    }

    async fn setup_usage_test_pool() -> Option<PgPool> {
        let _ = dotenv();
        let database_url = std::env::var("DATABASE_URL").ok()?;
        let pool = PgPoolOptions::new()
            .max_connections(1)
            .connect(&database_url)
            .await
            .ok()?;

        let mut conn = pool.acquire().await.ok()?;

        sqlx::query(
            r#"
            CREATE TEMP TABLE teams (
                id TEXT PRIMARY KEY,
                amount NUMERIC NOT NULL
            )
            "#,
        )
        .execute(&mut *conn)
        .await
        .ok()?;

        sqlx::query(
            r#"
            CREATE TEMP TABLE api_keys (
                id TEXT PRIMARY KEY,
                max_quota NUMERIC NOT NULL,
                max_requests INTEGER NOT NULL,
                total_quota NUMERIC NOT NULL,
                total_requests INTEGER NOT NULL,
                last_used_at TIMESTAMPTZ NULL
            )
            "#,
        )
        .execute(&mut *conn)
        .await
        .ok()?;

        sqlx::query(
            r#"
            CREATE TEMP TABLE usages (
                id TEXT PRIMARY KEY,
                cost NUMERIC NOT NULL,
                tokens_completion INTEGER NOT NULL,
                tokens_prompt INTEGER NOT NULL,
                response_time INTEGER NOT NULL,
                completed_time INTEGER NOT NULL,
                team_id TEXT NOT NULL,
                api_key_id TEXT NOT NULL,
                model_id TEXT NOT NULL,
                model_name TEXT NOT NULL,
                model_owned_by TEXT NOT NULL,
                is_stream BOOLEAN NOT NULL,
                ai_provider_id TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL
            )
            "#,
        )
        .execute(&mut *conn)
        .await
        .ok()?;

        drop(conn);
        Some(pool)
    }

    async fn seed_usage_fixtures(
        pool: &PgPool,
        team_amount: &str,
        max_quota: &str,
        total_quota: &str,
        max_requests: i32,
        total_requests: i32,
    ) {
        sqlx::query("INSERT INTO teams (id, amount) VALUES ($1, $2)")
            .bind("team-test")
            .bind(Decimal::from_str(team_amount).unwrap())
            .execute(pool)
            .await
            .unwrap();

        sqlx::query(
            r#"
            INSERT INTO api_keys (id, max_quota, max_requests, total_quota, total_requests, last_used_at)
            VALUES ($1, $2, $3, $4, $5, NULL)
            "#,
        )
        .bind("api-key-test")
        .bind(Decimal::from_str(max_quota).unwrap())
        .bind(max_requests)
        .bind(Decimal::from_str(total_quota).unwrap())
        .bind(total_requests)
        .execute(pool)
        .await
        .unwrap();
    }

    fn sample_usage_input(cost: &str) -> UsageInput {
        UsageInput {
            cost: Decimal::from_str(cost).unwrap(),
            completion_tokens: 25,
            prompt_tokens: 50,
        }
    }

    fn sample_model(is_public: bool) -> ModelInfo {
        ModelInfo {
            id: "model-test".to_string(),
            name: "demo-model".to_string(),
            is_public,
            owned_by: "openai".to_string(),
            pricing: json!({"input": "0.1", "output": "0.2"}),
        }
    }

    fn sample_context() -> UsageContext {
        UsageContext {
            team_id: "team-test".to_string(),
            api_key_id: "api-key-test".to_string(),
            response_time: 12,
            completed_time: 34,
            is_stream: false,
            ai_provider_id: "provider-test".to_string(),
        }
    }

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

    #[tokio::test]
    async fn add_usage_updates_balances_and_inserts_usage_row() {
        let Some(pool) = setup_usage_test_pool().await else {
            tracing::warn!("Skipping DB integration test because DATABASE_URL is unavailable");
            return;
        };

        seed_usage_fixtures(&pool, "10.0", "100.0", "0", 10, 0).await;

        add_usage(
            &pool,
            sample_usage_input("2.5"),
            sample_model(true),
            sample_context(),
        )
        .await
        .unwrap();

        let team_amount: Decimal = sqlx::query_scalar("SELECT amount FROM teams WHERE id = $1")
            .bind("team-test")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(team_amount, Decimal::from_str("7.5").unwrap());

        let row = sqlx::query(
            "SELECT total_quota, total_requests, last_used_at FROM api_keys WHERE id = $1",
        )
        .bind("api-key-test")
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(
            row.get::<Decimal, _>("total_quota"),
            Decimal::from_str("2.5").unwrap()
        );
        assert_eq!(row.get::<i32, _>("total_requests"), 1);
        assert!(
            row.get::<Option<chrono::DateTime<Utc>>, _>("last_used_at")
                .is_some()
        );

        let usage_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM usages")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(usage_count, 1);
    }

    #[tokio::test]
    async fn add_usage_rolls_back_when_team_balance_is_insufficient() {
        let Some(pool) = setup_usage_test_pool().await else {
            tracing::warn!("Skipping DB integration test because DATABASE_URL is unavailable");
            return;
        };

        seed_usage_fixtures(&pool, "1.0", "100.0", "0", 10, 0).await;

        let error = add_usage(
            &pool,
            sample_usage_input("2.5"),
            sample_model(true),
            sample_context(),
        )
        .await
        .unwrap_err();
        assert!(error.to_string().contains("Insufficient team balance"));

        let team_amount: Decimal = sqlx::query_scalar("SELECT amount FROM teams WHERE id = $1")
            .bind("team-test")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(team_amount, Decimal::from_str("1.0").unwrap());

        let row = sqlx::query("SELECT total_quota, total_requests FROM api_keys WHERE id = $1")
            .bind("api-key-test")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(row.get::<Decimal, _>("total_quota"), Decimal::ZERO);
        assert_eq!(row.get::<i32, _>("total_requests"), 0);

        let usage_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM usages")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(usage_count, 0);
    }

    #[tokio::test]
    async fn add_usage_rolls_back_when_api_key_quota_is_exhausted() {
        let Some(pool) = setup_usage_test_pool().await else {
            tracing::warn!("Skipping DB integration test because DATABASE_URL is unavailable");
            return;
        };

        seed_usage_fixtures(&pool, "10.0", "5.0", "4.0", 10, 0).await;

        let error = add_usage(
            &pool,
            sample_usage_input("2.0"),
            sample_model(true),
            sample_context(),
        )
        .await
        .unwrap_err();
        assert!(error.to_string().contains("API key quota exhausted"));

        let team_amount: Decimal = sqlx::query_scalar("SELECT amount FROM teams WHERE id = $1")
            .bind("team-test")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(team_amount, Decimal::from_str("10.0").unwrap());

        let row = sqlx::query("SELECT total_quota, total_requests FROM api_keys WHERE id = $1")
            .bind("api-key-test")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(
            row.get::<Decimal, _>("total_quota"),
            Decimal::from_str("4.0").unwrap()
        );
        assert_eq!(row.get::<i32, _>("total_requests"), 0);

        let usage_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM usages")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(usage_count, 0);
    }

    #[tokio::test]
    async fn add_usage_rolls_back_when_api_key_request_limit_is_exceeded() {
        let Some(pool) = setup_usage_test_pool().await else {
            tracing::warn!("Skipping DB integration test because DATABASE_URL is unavailable");
            return;
        };

        seed_usage_fixtures(&pool, "10.0", "100.0", "0", 1, 1).await;

        let error = add_usage(
            &pool,
            sample_usage_input("1.0"),
            sample_model(true),
            sample_context(),
        )
        .await
        .unwrap_err();
        assert!(error.to_string().contains("API key request limit exceeded"));

        let team_amount: Decimal = sqlx::query_scalar("SELECT amount FROM teams WHERE id = $1")
            .bind("team-test")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(team_amount, Decimal::from_str("10.0").unwrap());

        let row = sqlx::query("SELECT total_quota, total_requests FROM api_keys WHERE id = $1")
            .bind("api-key-test")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(row.get::<Decimal, _>("total_quota"), Decimal::ZERO);
        assert_eq!(row.get::<i32, _>("total_requests"), 1);

        let usage_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM usages")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(usage_count, 0);
    }

    #[tokio::test]
    async fn add_usage_is_atomic_under_concurrent_requests() {
        let Some(db) = SharedSchemaTestDb::new(4).await else {
            tracing::warn!(
                "Skipping concurrent DB integration test because DATABASE_URL is unavailable"
            );
            return;
        };

        seed_usage_fixtures(&db.pool, "2.0", "2.0", "0", 10, 0).await;

        let barrier = Arc::new(Barrier::new(3));
        let mut handles = Vec::new();

        for _ in 0..2 {
            let pool = db.pool.clone();
            let barrier = Arc::clone(&barrier);
            handles.push(tokio::spawn(async move {
                barrier.wait().await;
                add_usage(
                    &pool,
                    sample_usage_input("2.0"),
                    sample_model(true),
                    sample_context(),
                )
                .await
                .map(|_| ())
                .map_err(|error| error.to_string())
            }));
        }

        barrier.wait().await;

        let results = join_all(handles)
            .await
            .into_iter()
            .map(|result| result.expect("task should join"))
            .collect::<Vec<_>>();

        let success_count = results.iter().filter(|result| result.is_ok()).count();
        let failure_messages = results
            .iter()
            .filter_map(|result| result.as_ref().err())
            .cloned()
            .collect::<Vec<_>>();

        assert_eq!(success_count, 1);
        assert_eq!(failure_messages.len(), 1);
        assert!(failure_messages[0].contains("Insufficient team balance"));

        let team_amount: Decimal = sqlx::query_scalar("SELECT amount FROM teams WHERE id = $1")
            .bind("team-test")
            .fetch_one(&db.pool)
            .await
            .unwrap();
        assert_eq!(team_amount, Decimal::ZERO);

        let row = sqlx::query("SELECT total_quota, total_requests FROM api_keys WHERE id = $1")
            .bind("api-key-test")
            .fetch_one(&db.pool)
            .await
            .unwrap();
        assert_eq!(
            row.get::<Decimal, _>("total_quota"),
            Decimal::from_str("2.0").unwrap()
        );
        assert_eq!(row.get::<i32, _>("total_requests"), 1);

        let usage_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM usages")
            .fetch_one(&db.pool)
            .await
            .unwrap();
        assert_eq!(usage_count, 1);

        db.cleanup().await;
    }
}
