use crate::services::access::validate_model_access;
use crate::shared::ApiResponse;
use crate::shared::AppState;
use crate::utils;
use axum::{
    Json,
    body::Body,
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use std::sync::Arc;

pub async fn auth_middleware(
    State(state): State<Arc<AppState>>,
    req: Request,
    next: Next,
) -> Result<Response, (StatusCode, Json<ApiResponse<()>>)> {
    let auth_header = req
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .ok_or((
            StatusCode::UNAUTHORIZED,
            Json(ApiResponse::<()>::error("Missing API Key", "UNAUTHORIZED")),
        ))?;

    let hashed_key = utils::hash::hash_api_key(auth_header);

    let (parts, body) = req.into_parts();
    let bytes = axum::body::to_bytes(body, 10 * 1024 * 1024)
        .await
        .map_err(|_| {
            (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<()>::error("Read body error", "BAD_REQUEST")),
            )
        })?;

    let body_json: serde_json::Value = serde_json::from_slice(&bytes).map_err(|_| {
        (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()>::error("Invalid JSON", "INVALID_JSON")),
        )
    })?;

    let model_id = body_json.get("model").and_then(|m| m.as_str()).ok_or((
        StatusCode::BAD_REQUEST,
        Json(ApiResponse::<()>::error(
            "Missing model field",
            "MISSING_MODEL",
        )),
    ))?;

    let auth_result = validate_model_access(&state.db, &hashed_key, model_id)
        .await
        .map_err(|(status, code, msg)| {
            (
                StatusCode::from_u16(status).unwrap_or(StatusCode::PAYMENT_REQUIRED),
                Json(ApiResponse::<()>::error(msg, code)),
            )
        })?;

    let mut req = Request::from_parts(parts, Body::from(bytes));
    req.extensions_mut().insert(auth_result);

    Ok(next.run(req).await)
}
