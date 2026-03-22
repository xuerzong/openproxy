use rust_decimal::Decimal;
use serde_json::Value;
use std::str::FromStr;

use crate::services;

#[derive(Debug, Clone, Copy)]
pub enum UsageStyle {
    OpenAI,
    Anthropic,
}

/// Given an optional array of tier objects, resolve the effective price for a token count.
/// Each tier: { "cost": "<decimal>", "min": <optional i64>, "max": <optional i64> }
/// If no matching tier is found (or tiers is None), falls back to `base_price`.
fn resolve_tiered_price(tiers: Option<&Vec<Value>>, base_price: Decimal, tokens: i32) -> Decimal {
    let tiers = match tiers {
        Some(t) if !t.is_empty() => t,
        _ => return base_price,
    };
    let tokens_i64 = tokens as i64;
    for tier in tiers {
        let min = tier.get("min").and_then(|v| v.as_i64()).unwrap_or(0);
        let has_max = tier.get("max").is_some_and(|v| !v.is_null());
        let max = tier.get("max").and_then(|v| v.as_i64()).unwrap_or(i64::MAX);
        if tokens_i64 >= min && (tokens_i64 <= max || !has_max) {
            if let Some(cost) = tier
                .get("cost")
                .and_then(|v| v.as_str())
                .and_then(|s| Decimal::from_str(s).ok())
            {
                return cost;
            }
        }
    }
    base_price
}

pub fn remove_provider_metadata_fields(v: &mut Value) {
    if let Some(obj) = v.as_object_mut() {
        obj.remove("provider_metadata");
        obj.remove("providerMetadata");
        for (_, val) in obj.iter_mut() {
            remove_provider_metadata_fields(val);
        }
    } else if let Some(arr) = v.as_array_mut() {
        for val in arr.iter_mut() {
            remove_provider_metadata_fields(val);
        }
    }
}

pub fn extract_usage_input_with_tokens(
    usage: &services::usage::ExtractedUsage,
    model_pricing: &Value,
    style: UsageStyle,
) -> services::usage::UsageInput {
    let pricing_json = if let Some(s) = model_pricing.as_str() {
        serde_json::from_str::<Value>(s).unwrap_or(model_pricing.clone())
    } else {
        model_pricing.clone()
    };

    let input_price = pricing_json
        .get("input")
        .and_then(|v| v.as_str())
        .and_then(|s| Decimal::from_str(s).ok())
        .unwrap_or(Decimal::ZERO);

    let output_price = pricing_json
        .get("output")
        .and_then(|v| v.as_str())
        .and_then(|s| Decimal::from_str(s).ok())
        .unwrap_or(Decimal::ZERO);

    let input_cache_read_price = pricing_json
        .get("input_cache_read")
        .and_then(|v| v.as_str())
        .and_then(|s| Decimal::from_str(s).ok())
        .unwrap_or(Decimal::ZERO);

    let output_tiers = pricing_json.get("output_tiers").and_then(|v| v.as_array());
    let input_cache_read_tiers = pricing_json
        .get("input_cache_read_tiers")
        .and_then(|v| v.as_array());

    let cache_tokens_i32 = usage.input_cache_read_tokens.max(0);
    let prompt_tokens_without_cache_i32 = match style {
        UsageStyle::OpenAI => (usage.prompt_tokens - cache_tokens_i32).max(0),
        UsageStyle::Anthropic => usage.prompt_tokens.max(0),
    };

    let p_tokens = Decimal::from(prompt_tokens_without_cache_i32);
    let cache_tokens = Decimal::from(cache_tokens_i32);
    let c_tokens = Decimal::from(usage.completion_tokens);
    let divisor = Decimal::from(1_000_000);

    let effective_output_price =
        resolve_tiered_price(output_tiers, output_price, usage.completion_tokens);
    let effective_cache_read_price = resolve_tiered_price(
        input_cache_read_tiers,
        input_cache_read_price,
        cache_tokens_i32,
    );

    let total_cost = (input_price * p_tokens
        + effective_cache_read_price * cache_tokens
        + effective_output_price * c_tokens)
        / divisor;

    services::usage::UsageInput {
        cost: total_cost,
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
    }
}

pub fn rewrite_usage_field(
    chunk: &mut Value,
    usage_info: &services::usage::ExtractedUsage,
    style: UsageStyle,
) {
    if let Some(obj) = chunk.as_object_mut() {
        let standardized_usage = match style {
            UsageStyle::OpenAI => {
                serde_json::json!({
                    "prompt_tokens": usage_info.prompt_tokens,
                    "completion_tokens": usage_info.completion_tokens,
                    "total_tokens": usage_info.prompt_tokens + usage_info.completion_tokens
                })
            }
            UsageStyle::Anthropic => {
                serde_json::json!({
                    "input_tokens": usage_info.prompt_tokens,
                    "output_tokens": usage_info.completion_tokens
                })
            }
        };

        obj.insert("usage".to_string(), standardized_usage);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rust_decimal::Decimal;

    fn pricing_json() -> Value {
        serde_json::json!({
            "input": "2",
            "output": "8",
            "input_cache_read": "0.5"
        })
    }

    #[test]
    fn openai_billing_deducts_cached_from_prompt() {
        let usage = services::usage::ExtractedUsage {
            prompt_tokens: 100,
            completion_tokens: 10,
            input_cache_read_tokens: 40,
        };

        let input = extract_usage_input_with_tokens(&usage, &pricing_json(), UsageStyle::OpenAI);
        let expected = (Decimal::from(2) * Decimal::from(60)
            + Decimal::from_str("0.5").unwrap() * Decimal::from(40)
            + Decimal::from(8) * Decimal::from(10))
            / Decimal::from(1_000_000);

        assert_eq!(input.cost, expected);
    }

    #[test]
    fn anthropic_billing_keeps_input_and_cached_separate() {
        let usage = services::usage::ExtractedUsage {
            prompt_tokens: 100,
            completion_tokens: 10,
            input_cache_read_tokens: 40,
        };

        let input = extract_usage_input_with_tokens(&usage, &pricing_json(), UsageStyle::Anthropic);
        let expected = (Decimal::from(2) * Decimal::from(100)
            + Decimal::from_str("0.5").unwrap() * Decimal::from(40)
            + Decimal::from(8) * Decimal::from(10))
            / Decimal::from(1_000_000);

        assert_eq!(input.cost, expected);
    }

    #[test]
    fn remove_provider_metadata_fields_removes_nested_keys() {
        let mut payload = serde_json::json!({
            "provider_metadata": {"a": 1},
            "nested": {
                "providerMetadata": {"b": 2}
            }
        });

        remove_provider_metadata_fields(&mut payload);

        assert!(payload.get("provider_metadata").is_none());
        assert!(payload
            .get("nested")
            .and_then(|n| n.get("providerMetadata"))
            .is_none());
    }
}
