use axum::http::StatusCode;
use rust_decimal::prelude::ToPrimitive;
use rust_decimal::Decimal;
use serde_json::Value;
use std::str::FromStr;

use crate::models::provider::ModelAccessResult;
use crate::shared::ApiResponse;

#[derive(Debug, Clone)]
pub struct BalanceCheckResult {
    /// Input tokens calculated
    pub input_tokens: i32,
    /// Current user balance in currency
    pub balance: Decimal,
    /// Available output tokens that can be purchased with current balance
    pub available_output_tokens: i32,
    /// Whether balance is sufficient for input tokens
    pub sufficient_for_input: bool,
    /// Adjusted max_tokens to use (if needed)
    pub adjusted_max_tokens: Option<i32>,
}

/// Extract input price from model pricing JSON
fn get_input_price(model_pricing: &Value) -> Decimal {
    if let Some(s) = model_pricing.as_str() {
        if let Ok(pricing) = serde_json::from_str::<Value>(s) {
            return pricing
                .get("input")
                .and_then(|v| v.as_str())
                .and_then(|s| Decimal::from_str(s).ok())
                .unwrap_or(Decimal::ZERO);
        }
    }

    model_pricing
        .get("input")
        .and_then(|v| v.as_str())
        .and_then(|s| Decimal::from_str(s).ok())
        .unwrap_or(Decimal::ZERO)
}

/// Extract output price from model pricing JSON
fn get_output_price(model_pricing: &Value) -> Decimal {
    if let Some(s) = model_pricing.as_str() {
        if let Ok(pricing) = serde_json::from_str::<Value>(s) {
            return pricing
                .get("output")
                .and_then(|v| v.as_str())
                .and_then(|s| Decimal::from_str(s).ok())
                .unwrap_or(Decimal::ZERO);
        }
    }

    model_pricing
        .get("output")
        .and_then(|v| v.as_str())
        .and_then(|s| Decimal::from_str(s).ok())
        .unwrap_or(Decimal::ZERO)
}

/// Check balance and calculate available output tokens.
///
/// Formula:
/// - Input cost: I * input_price / 1_000_000
/// - Available output tokens: (Balance / output_price) * 1_000_000 - I
///
/// Returns:
/// - (402, "Insufficient balance") if balance < input_cost
/// - (200, result) with adjusted max_tokens if needed
pub fn check_balance_and_available_output(
    user: &ModelAccessResult,
    input_tokens: i32,
    requested_max_tokens: Option<i32>,
) -> Result<BalanceCheckResult, (StatusCode, ApiResponse<()>)> {
    let input_price = get_input_price(&user.model_pricing);
    let output_price = get_output_price(&user.model_pricing);

    if !user.model_is_public {
        return Ok(BalanceCheckResult {
            input_tokens,
            balance: user.user_amount.unwrap_or(Decimal::ZERO),
            available_output_tokens: i32::MAX,
            sufficient_for_input: true,
            adjusted_max_tokens: requested_max_tokens,
        });
    }

    let balance = user.user_amount.unwrap_or(Decimal::ZERO);

    let input_cost = Decimal::from(input_tokens) * input_price / Decimal::from(1_000_000);

    if balance < input_cost {
        return Err((
            StatusCode::PAYMENT_REQUIRED,
            ApiResponse::<()>::error(
                "Insufficient balance to cover input tokens",
                "INSUFFICIENT_BALANCE",
            ),
        ));
    }

    let remaining_balance = balance - input_cost;

    let available_output_tokens = if output_price > Decimal::ZERO {
        let available = (remaining_balance / output_price) * Decimal::from(1_000_000);
        available.to_u32().unwrap_or(0).min(i32::MAX as u32) as i32
    } else {
        i32::MAX
    };

    let mut adjusted_max_tokens = None;
    if let Some(requested) = requested_max_tokens {
        if requested > available_output_tokens {
            adjusted_max_tokens = Some(available_output_tokens);
        }
    }

    Ok(BalanceCheckResult {
        input_tokens,
        balance,
        available_output_tokens,
        sufficient_for_input: true,
        adjusted_max_tokens,
    })
}

/// Apply balance check result to the request body.
/// If max_tokens was adjusted, update it in the body.
pub fn apply_balance_check_to_body(body: &mut Value, result: &BalanceCheckResult) {
    if let Some(adjusted) = result.adjusted_max_tokens {
        if let Some(obj) = body.as_object_mut() {
            obj.insert("max_tokens".to_string(), Value::Number(adjusted.into()));

            tracing::info!(
                input_tokens = result.input_tokens,
                available_output_tokens = result.available_output_tokens,
                adjusted_max_tokens = adjusted,
                "Token limit adjusted due to balance"
            );
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rust_decimal::Decimal;
    use serde_json::json;

    fn create_test_user(balance: &str, input_price: &str, output_price: &str) -> ModelAccessResult {
        ModelAccessResult {
            api_key_id: "test-key".to_string(),
            api_key_max_quota: Decimal::ZERO,
            api_key_max_requests: 0,
            api_key_total_quota: Decimal::ZERO,
            api_key_total_requests: 0,
            api_key_expires_at: None,
            team_id: "test-team".to_string(),
            model_id: "test-model".to_string(),
            model_name: "gpt-3.5-turbo".to_string(),
            model_owned_by: "openai".to_string(),
            model_is_public: true,
            model_pricing: json!({
                "input": input_price,
                "output": output_price,
                "input_cache_read": "0.0"
            }),
            user_amount: Some(Decimal::from_str(balance).unwrap()),
            user_cost: Some(Decimal::ZERO),
            monthly_free_allowance: None,
            monthly_free_used: None,
            monthly_free_last_reset_at: None,
            providers: vec![],
        }
    }

    #[test]
    fn test_sufficient_balance() {
        let user = create_test_user("10.00", "0.05", "0.15");
        let result = check_balance_and_available_output(&user, 100, Some(500));

        assert!(result.is_ok());
        let result = result.unwrap();
        assert!(result.sufficient_for_input);
        assert_eq!(result.input_tokens, 100);
    }

    #[test]
    fn test_insufficient_balance() {
        // Balance: $0.000001, Input Price: $0.05/1M, 100 tokens
        // Input Cost: 100 * 0.05 / 1M = $0.000005
        // 0.000001 < 0.000005, so should fail
        let user = create_test_user("0.000001", "0.05", "0.15");
        let result = check_balance_and_available_output(&user, 100, Some(500));

        assert!(result.is_err());
        let (status, _) = result.unwrap_err();
        assert_eq!(status, StatusCode::PAYMENT_REQUIRED);
    }

    #[test]
    fn test_max_tokens_adjustment() {
        let user = create_test_user("5.00", "0.05", "0.15");
        // 5.00 - (100 * 0.05 / 1M) = ~4.9995
        // available_output = (4.9995 / 0.15) * 1M = 33,330,000 (too large)
        // So it should cap at available_output_tokens
        let result = check_balance_and_available_output(&user, 100, Some(50_000_000));

        assert!(result.is_ok());
        let result = result.unwrap();
        assert!(result.adjusted_max_tokens.is_some());
    }

    #[test]
    fn test_private_model_skip_validation() {
        let mut user = create_test_user("0.001", "0.05", "0.15");
        user.model_is_public = false;

        let result = check_balance_and_available_output(&user, 100, Some(500));

        assert!(result.is_ok());
        let result = result.unwrap();
        assert!(result.sufficient_for_input);
        assert_eq!(result.available_output_tokens, i32::MAX);
    }
}
