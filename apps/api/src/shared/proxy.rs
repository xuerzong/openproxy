use axum::{
    Json,
    extract::Request,
    http::HeaderMap,
    response::{IntoResponse, Response},
};
use reqwest::StatusCode;
use serde_json::Value;
use std::sync::Arc;
use tokio_util::bytes;

use crate::{
    models::provider::{ModelAccessResult, ProviderInfo},
    services,
    shared::{ApiResponse, AppState},
};

pub struct ParsedProxyRequest {
    pub original_headers: HeaderMap,
    pub body_json: Value,
}

pub struct PreparedUpstreamRequest {
    pub target_url: String,
    pub body_json: Value,
}

#[derive(Debug)]
pub struct SuccessfulUpstreamResponse {
    pub upstream_res: reqwest::Response,
    pub provider_ctx: services::usage::UsageContext,
}

pub async fn parse_proxy_request(req: Request) -> Result<ParsedProxyRequest, Response> {
    let original_headers = req.headers().clone();
    let body_bytes = axum::body::to_bytes(req.into_body(), 10 * 1024 * 1024)
        .await
        .map_err(|e| {
            ApiResponse::<()>::error(&format!("Invalid Body: {}", e), "BAD_REQUEST")
                .to_res(StatusCode::BAD_REQUEST)
        })?;

    let body_json: Value = serde_json::from_slice(&body_bytes).map_err(|e| {
        ApiResponse::<()>::error(&format!("Invalid Body: {}", e), "BAD_REQUEST")
            .to_res(StatusCode::BAD_REQUEST)
    })?;

    Ok(ParsedProxyRequest {
        original_headers,
        body_json,
    })
}

pub fn build_usage_parts(
    user: &ModelAccessResult,
    is_stream: bool,
) -> (services::usage::ModelInfo, services::usage::UsageContext) {
    let model_info = services::usage::ModelInfo {
        id: user.model_id.clone(),
        name: user.model_name.clone(),
        is_public: user.model_is_public,
        owned_by: user.model_owned_by.clone(),
        pricing: user.model_pricing.clone(),
    };
    let usage_ctx = services::usage::UsageContext {
        team_id: user.team_id.clone(),
        api_key_id: user.api_key_id.clone(),
        response_time: 0,
        completed_time: 0,
        is_stream,
        ai_provider_id: String::new(),
    };

    (model_info, usage_ctx)
}

pub async fn proxy_to_provider<F>(
    state: &Arc<AppState>,
    user: &ModelAccessResult,
    original_headers: &HeaderMap,
    usage_ctx: &services::usage::UsageContext,
    prepare_request: F,
) -> Result<SuccessfulUpstreamResponse, Response>
where
    F: Fn(&ProviderInfo) -> PreparedUpstreamRequest,
{
    // Build a window = min(10, total_combos) for the recent-usage history.
    let total_combos: usize = user.providers.iter().map(|p| p.api_keys.len()).sum();
    let window = total_combos.min(10);

    // Retrieve the combos used in the last `window` requests for this user.
    let recent_set = crate::shared::cache::get_recent_combos(&user.api_key_id);

    // Flatten to (provider, key) pairs; non-recent combos come first so they
    // are preferred, recent ones fall back to the tail.
    let all: Vec<(&ProviderInfo, _)> = user
        .providers
        .iter()
        .flat_map(|p| p.api_keys.iter().map(move |k| (p, k)))
        .collect();

    let mut ordered: Vec<(&ProviderInfo, _)> = Vec::with_capacity(all.len());
    let mut recent_tail: Vec<(&ProviderInfo, _)> = Vec::new();
    for (p, k) in &all {
        if recent_set.contains(&(p.ai_provider_id.clone(), k.api_key_hash.clone())) {
            recent_tail.push((p, k));
        } else {
            ordered.push((p, k));
        }
    }
    ordered.extend(recent_tail);

    let total = ordered.len();
    let mut last_error = None;

    for (i, (provider, api_key_entry)) in ordered.iter().enumerate() {
        let is_last_attempt = i == total.saturating_sub(1);
        let prepared = prepare_request(provider);

        let mut headers = original_headers.clone();
        headers.remove("host");
        headers.remove("origin");
        headers.remove("referer");

        let auth_token = format!("Bearer {}", api_key_entry.api_key);
        headers.insert("Authorization", auth_token.parse().unwrap());

        let next_body_bytes = serde_json::to_vec(&prepared.body_json).unwrap();
        let next_body = bytes::Bytes::from(next_body_bytes);

        headers.remove(axum::http::header::CONTENT_LENGTH);

        match state
            .http_client
            .post(&prepared.target_url)
            .headers(headers)
            .body(next_body)
            .send()
            .await
        {
            Ok(upstream_res) => {
                let status = upstream_res.status();
                if !status.is_success() {
                    if !is_last_attempt {
                        tracing::warn!(
                            combo = i + 1,
                            status = %status,
                            "Provider/key failed, trying next"
                        );
                        last_error =
                            Some((status, "Provider unavailable, retrying...".to_string()));
                        continue;
                    }

                    return Err(forward_upstream_error(upstream_res).await);
                }

                // Record this combo so future requests prefer a different one.
                crate::shared::cache::record_used_combo(
                    &user.api_key_id,
                    &provider.ai_provider_id,
                    &api_key_entry.api_key_hash,
                    window,
                );

                let mut provider_ctx = usage_ctx.clone();
                provider_ctx.ai_provider_id = provider.ai_provider_id.clone();

                return Ok(SuccessfulUpstreamResponse {
                    upstream_res,
                    provider_ctx,
                });
            }
            Err(error) => {
                if !is_last_attempt {
                    tracing::warn!(
                        combo = i + 1,
                        error = %error,
                        "Provider/key connection failed, trying next"
                    );
                    last_error = Some((
                        StatusCode::BAD_GATEWAY,
                        format!("Connection failed: {}", error),
                    ));
                    continue;
                }

                return Err(ApiResponse::<()>::error(
                    &format!("All providers failed. Last error: {}", error),
                    "BAD_GATEWAY",
                )
                .to_res(StatusCode::BAD_GATEWAY));
            }
        }
    }

    Err(ApiResponse::<()>::error(
        &format!("All providers unavailable. Last error: {:?}", last_error),
        "BAD_GATEWAY",
    )
    .to_res(StatusCode::BAD_GATEWAY))
}

pub fn is_event_stream_response(res: &reqwest::Response) -> bool {
    res.headers()
        .get("content-type")
        .is_some_and(|ct| ct.to_str().unwrap_or("").contains("text/event-stream"))
}

async fn forward_upstream_error(upstream_res: reqwest::Response) -> Response {
    let status = upstream_res.status();
    let error_bytes = upstream_res.bytes().await.unwrap_or_default();

    if let Ok(value) = serde_json::from_slice::<Value>(&error_bytes) {
        (status, Json(value)).into_response()
    } else {
        let raw_err = String::from_utf8_lossy(&error_bytes);
        ApiResponse::<()>::error(&raw_err, "UPSTREAM_ERROR").to_res(status)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        Json, Router,
        body::Body,
        http::{HeaderValue, Request as HttpRequest, StatusCode as AxumStatusCode},
        routing::post,
    };
    use rust_decimal::Decimal;
    use serde_json::json;
    use sqlx::postgres::PgPoolOptions;
    use std::sync::Arc;
    use tokio::{net::TcpListener, sync::mpsc};

    #[derive(Debug)]
    struct CapturedRequest {
        authorization: Option<String>,
        request_id: Option<String>,
        origin: Option<String>,
        referer: Option<String>,
        body: Value,
    }

    #[tokio::test]
    async fn parse_proxy_request_reads_json_and_preserves_headers() {
        let req = HttpRequest::builder()
            .method("POST")
            .uri("/v1/chat/completions")
            .header("x-request-id", "req_123")
            .body(Body::from(r#"{"stream":true,"model":"demo"}"#))
            .unwrap();

        let parsed = parse_proxy_request(req).await.unwrap();

        assert_eq!(parsed.body_json["stream"], json!(true));
        assert_eq!(parsed.body_json["model"], json!("demo"));
        assert_eq!(
            parsed.original_headers.get("x-request-id").unwrap(),
            &HeaderValue::from_static("req_123")
        );
    }

    #[test]
    fn build_usage_parts_preserves_model_fields_and_stream_flag() {
        let user = sample_user(
            "api-key-build-usage",
            vec![(
                "http://127.0.0.1:1".to_string(),
                "provider_1".to_string(),
                "key-1".to_string(),
                "model-a".to_string(),
            )],
        );

        let (model, ctx) = build_usage_parts(&user, true);

        assert_eq!(model.id, "model-id");
        assert_eq!(model.name, "demo-model");
        assert!(model.is_public);
        assert_eq!(ctx.team_id, "team-id");
        assert_eq!(ctx.api_key_id, "api-key-build-usage");
        assert!(ctx.is_stream);
        assert!(ctx.ai_provider_id.is_empty());
    }

    #[tokio::test]
    async fn proxy_to_provider_retries_and_keeps_request_contract() {
        let fail_app = Router::new().route(
            "/chat/completions",
            post(|| async {
                (
                    AxumStatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error":"temporary"})),
                )
            }),
        );
        let (fail_base_url, fail_server) = spawn_test_server(fail_app).await;

        let (tx, mut rx) = mpsc::unbounded_channel();
        let success_app = Router::new().route(
            "/chat/completions",
            post(move |headers: HeaderMap, Json(body): Json<Value>| {
                let tx = tx.clone();
                async move {
                    tx.send(CapturedRequest {
                        authorization: headers
                            .get("authorization")
                            .and_then(|value| value.to_str().ok())
                            .map(str::to_string),
                        request_id: headers
                            .get("x-request-id")
                            .and_then(|value| value.to_str().ok())
                            .map(str::to_string),
                        origin: headers
                            .get("origin")
                            .and_then(|value| value.to_str().ok())
                            .map(str::to_string),
                        referer: headers
                            .get("referer")
                            .and_then(|value| value.to_str().ok())
                            .map(str::to_string),
                        body,
                    })
                    .unwrap();

                    (AxumStatusCode::OK, Json(json!({"id":"chatcmpl_123"})))
                }
            }),
        );
        let (success_base_url, success_server) = spawn_test_server(success_app).await;

        let user = sample_user(
            "api-key-retry-test",
            vec![
            (
                fail_base_url,
                "provider_fail".to_string(),
                "fail-key".to_string(),
                "fail-model".to_string(),
            ),
            (
                success_base_url,
                "provider_success".to_string(),
                "success-key".to_string(),
                "success-model".to_string(),
            ),
        ]);
        let state = sample_state();
        let (_, usage_ctx) = build_usage_parts(&user, false);

        let mut original_headers = HeaderMap::new();
        original_headers.insert("content-type", HeaderValue::from_static("application/json"));
        original_headers.insert("x-request-id", HeaderValue::from_static("req_456"));
        original_headers.insert("origin", HeaderValue::from_static("https://example.com"));
        original_headers.insert("referer", HeaderValue::from_static("https://example.com/page"));

        let result = proxy_to_provider(
            &state,
            &user,
            &original_headers,
            &usage_ctx,
            |provider| PreparedUpstreamRequest {
                target_url: format!("{}/chat/completions", provider.model_base_url),
                body_json: json!({
                    "model": provider.model_model_name,
                    "stream": false,
                }),
            },
        )
        .await
        .unwrap();

        assert_eq!(result.provider_ctx.ai_provider_id, "provider_success");
        assert_eq!(result.upstream_res.status(), reqwest::StatusCode::OK);

        let captured = rx.recv().await.unwrap();
        assert_eq!(captured.authorization.as_deref(), Some("Bearer success-key"));
        assert_eq!(captured.request_id.as_deref(), Some("req_456"));
        assert_eq!(captured.origin, None);
        assert_eq!(captured.referer, None);
        assert_eq!(captured.body["model"], json!("success-model"));

        fail_server.abort();
        success_server.abort();
    }

    #[tokio::test]
    async fn proxy_to_provider_forwards_last_upstream_json_error() {
        let app = Router::new().route(
            "/chat/completions",
            post(|| async {
                (
                    AxumStatusCode::TOO_MANY_REQUESTS,
                    Json(json!({"error":{"message":"rate limited"}})),
                )
            }),
        );
        let (base_url, server) = spawn_test_server(app).await;

        let user = sample_user(
            "api-key-error-test",
            vec![(
            base_url,
            "provider_error".to_string(),
            "error-key".to_string(),
            "error-model".to_string(),
        )]);
        let state = sample_state();
        let (_, usage_ctx) = build_usage_parts(&user, false);

        let response = proxy_to_provider(
            &state,
            &user,
            &{
                let mut headers = HeaderMap::new();
                headers.insert("content-type", HeaderValue::from_static("application/json"));
                headers
            },
            &usage_ctx,
            |provider| PreparedUpstreamRequest {
                target_url: format!("{}/chat/completions", provider.model_base_url),
                body_json: json!({"model": provider.model_model_name}),
            },
        )
        .await
        .unwrap_err();

        assert_eq!(response.status(), AxumStatusCode::TOO_MANY_REQUESTS);

        let body = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let payload: Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(payload, json!({"error":{"message":"rate limited"}}));

        server.abort();
    }

    /// Verifies that when a provider+key combo is already in the recent-usage
    /// cache the proxy tries the *other* (fresh) combo first.
    ///
    /// Setup: two providers, both return 200. provider_A is pre-marked as
    /// recently used. provider_B is fresh. We assert that provider_B is tried
    /// first (its capture channel gets the request) and the result reports
    /// provider_B's id.
    #[tokio::test]
    async fn proxy_skips_recently_used_combo() {
        use crate::shared::cache::{clear_recent_combos_for, record_used_combo};

        let uid = "api-key-recent-skip-test";
        clear_recent_combos_for(uid);

        // Two spy servers, both always succeed.
        let (tx_a, mut rx_a) = mpsc::unbounded_channel::<String>();
        let server_a_app = Router::new().route(
            "/chat",
            post(move |headers: HeaderMap, Json(_body): Json<Value>| {
                let tx = tx_a.clone();
                async move {
                    let auth = headers
                        .get("authorization")
                        .and_then(|v| v.to_str().ok())
                        .unwrap_or("")
                        .to_string();
                    tx.send(auth).unwrap();
                    (AxumStatusCode::OK, Json(json!({"provider":"a"})))
                }
            }),
        );

        let (tx_b, mut rx_b) = mpsc::unbounded_channel::<String>();
        let server_b_app = Router::new().route(
            "/chat",
            post(move |headers: HeaderMap, Json(_body): Json<Value>| {
                let tx = tx_b.clone();
                async move {
                    let auth = headers
                        .get("authorization")
                        .and_then(|v| v.to_str().ok())
                        .unwrap_or("")
                        .to_string();
                    tx.send(auth).unwrap();
                    (AxumStatusCode::OK, Json(json!({"provider":"b"})))
                }
            }),
        );

        let (url_a, srv_a) = spawn_test_server(server_a_app).await;
        let (url_b, srv_b) = spawn_test_server(server_b_app).await;

        // provider_a is listed first in the providers vec (would normally be tried first)
        let user = sample_user(
            uid,
            vec![
                (url_a, "provider_a".to_string(), "key-a".to_string(), "model-a".to_string()),
                (url_b, "provider_b".to_string(), "key-b".to_string(), "model-b".to_string()),
            ],
        );

        // Mark provider_a's combo as recently used (window=2, same as total combos)
        record_used_combo(uid, "provider_a", "provider_a_hash", 2);

        let state = sample_state();
        let (_, usage_ctx) = build_usage_parts(&user, false);
        let mut headers = HeaderMap::new();
        headers.insert("content-type", HeaderValue::from_static("application/json"));

        let result = proxy_to_provider(
            &state,
            &user,
            &headers,
            &usage_ctx,
            |provider| PreparedUpstreamRequest {
                target_url: format!("{}/chat", provider.model_base_url),
                body_json: json!({"model": provider.model_model_name}),
            },
        )
        .await
        .unwrap();

        // provider_b should have been selected (provider_a was recent → deprioritised)
        assert_eq!(result.provider_ctx.ai_provider_id, "provider_b");

        // server_b received the request, server_a did not
        assert!(rx_b.try_recv().is_ok(), "provider_b should have been called");
        assert!(rx_a.try_recv().is_err(), "provider_a should have been skipped");

        srv_a.abort();
        srv_b.abort();
    }

    async fn spawn_test_server(app: Router) -> (String, tokio::task::JoinHandle<()>) {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();
        let handle = tokio::spawn(async move {
            axum::serve(listener, app).await.unwrap();
        });

        (format!("http://{}", addr), handle)
    }

    fn sample_state() -> Arc<AppState> {
        Arc::new(AppState {
            db: PgPoolOptions::new()
                .connect_lazy("postgres://postgres:postgres@localhost/aiproxy")
                .unwrap(),
            http_client: reqwest::Client::builder().no_proxy().build().unwrap(),
        })
    }

    fn sample_user(
        api_key_id: &str,
        providers: Vec<(String, String, String, String)>,
    ) -> ModelAccessResult {
        ModelAccessResult {
            api_key_id: api_key_id.to_string(),
            api_key_max_quota: Decimal::ZERO,
            api_key_max_requests: 0,
            api_key_total_quota: Decimal::ZERO,
            api_key_total_requests: 0,
            api_key_expires_at: None,
            team_id: "team-id".to_string(),
            model_id: "model-id".to_string(),
            model_name: "demo-model".to_string(),
            model_owned_by: "demo-owner".to_string(),
            model_is_public: true,
            model_pricing: json!({}),
            user_amount: None,
            user_cost: None,
            monthly_free_allowance: None,
            monthly_free_used: None,
            monthly_free_last_reset_at: None,
            providers: providers
                .into_iter()
                .map(|(model_base_url, ai_provider_id, model_api_key, model_model_name)| {
                    ProviderInfo {
                        model_model_name,
                        model_base_url,
                        ai_provider_id: ai_provider_id.clone(),
                        api_keys: vec![crate::models::provider::ApiKeyEntry {
                            api_key_hash: format!("{ai_provider_id}_hash"),
                            api_key: model_api_key,
                        }],
                    }
                })
                .collect(),
        }
    }
}