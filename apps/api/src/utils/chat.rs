use rust_decimal::Decimal;
use serde_json::Value;

use crate::models::model::{Pricing, PricingTier};
use crate::services;

#[derive(Debug, Clone, Copy)]
pub enum UsageStyle {
    OpenAI,
    Anthropic,
}

#[derive(Debug, Clone, Copy)]
struct ParsedTier {
    start: i64,
    end: Option<i64>,
    cost: Decimal,
}

fn default_pricing() -> Pricing {
    Pricing {
        input: Decimal::ZERO,
        output: Decimal::ZERO,
        input_cache_read: Decimal::ZERO,
        input_tiers: None,
        output_tiers: None,
        input_cache_read_tiers: None,
    }
}

pub(crate) fn parse_pricing(model_pricing: &Value) -> Pricing {
    if let Some(s) = model_pricing.as_str() {
        serde_json::from_str::<Pricing>(s).unwrap_or_else(|_| default_pricing())
    } else {
        serde_json::from_value::<Pricing>(model_pricing.clone())
            .unwrap_or_else(|_| default_pricing())
    }
}

pub(crate) fn get_price(pricing: &Pricing, field: &str) -> Decimal {
    match field {
        "input" => pricing.input,
        "output" => pricing.output,
        "input_cache_read" => pricing.input_cache_read,
        _ => Decimal::ZERO,
    }
}

fn parse_tiers(tiers: Option<&Vec<PricingTier>>) -> Vec<ParsedTier> {
    let mut parsed = tiers
        .into_iter()
        .flat_map(|items| items.iter())
        .map(|tier| {
            let min = tier.min.unwrap_or(0);
            let max = tier.max;
            let start = if min <= 0 { 1 } else { min };
            ParsedTier {
                start,
                end: max,
                cost: tier.cost,
            }
        })
        .collect::<Vec<_>>();

    parsed.sort_by_key(|tier| tier.start);
    parsed
}

pub(crate) fn calculate_tiered_cost(
    tiers: Option<&Vec<PricingTier>>,
    base_price: Decimal,
    tokens: i32,
) -> Decimal {
    let total_tokens = i64::from(tokens.max(0));
    if total_tokens == 0 {
        return Decimal::ZERO;
    }

    let mut uncovered = vec![(1_i64, total_tokens)];
    let mut total_cost = Decimal::ZERO;

    for tier in parse_tiers(tiers) {
        let tier_end = tier.end.unwrap_or(total_tokens).min(total_tokens);
        if tier_end < tier.start {
            continue;
        }

        let mut next_uncovered = Vec::new();
        for (segment_start, segment_end) in uncovered {
            if segment_end < tier.start || segment_start > tier_end {
                next_uncovered.push((segment_start, segment_end));
                continue;
            }

            let overlap_start = segment_start.max(tier.start);
            let overlap_end = segment_end.min(tier_end);
            if segment_start < overlap_start {
                next_uncovered.push((segment_start, overlap_start - 1));
            }
            if overlap_end < segment_end {
                next_uncovered.push((overlap_end + 1, segment_end));
            }

            let overlap_tokens = overlap_end - overlap_start + 1;
            total_cost += tier.cost * Decimal::from(overlap_tokens);
        }
        uncovered = next_uncovered;
        if uncovered.is_empty() {
            break;
        }
    }

    for (segment_start, segment_end) in uncovered {
        let segment_tokens = segment_end - segment_start + 1;
        total_cost += base_price * Decimal::from(segment_tokens);
    }

    total_cost / Decimal::from(1_000_000)
}

pub(crate) fn max_tokens_for_budget(
    tiers: Option<&Vec<PricingTier>>,
    base_price: Decimal,
    budget: Decimal,
) -> i32 {
    if budget <= Decimal::ZERO {
        return 0;
    }

    let mut low = 0_i32;
    let mut high = 1_i32;

    while high < i32::MAX {
        if calculate_tiered_cost(tiers, base_price, high) > budget {
            break;
        }
        low = high;
        let next = high.saturating_mul(2);
        if next == high {
            break;
        }
        high = next;
    }

    if high == i32::MAX && calculate_tiered_cost(tiers, base_price, high) <= budget {
        return i32::MAX;
    }

    let mut left = low;
    let mut right = high;
    while left < right {
        let mid = left + (right - left + 1) / 2;
        if calculate_tiered_cost(tiers, base_price, mid) <= budget {
            left = mid;
        } else {
            right = mid - 1;
        }
    }

    left
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
    let pricing = parse_pricing(model_pricing);

    let input_price = get_price(&pricing, "input");
    let output_price = get_price(&pricing, "output");
    let input_cache_read_price = get_price(&pricing, "input_cache_read");

    let output_tiers = pricing.output_tiers.as_ref();
    let input_tiers = pricing.input_tiers.as_ref();
    let input_cache_read_tiers = pricing.input_cache_read_tiers.as_ref();

    let cache_tokens_i32 = usage.input_cache_read_tokens.max(0);
    let prompt_tokens_without_cache_i32 = match style {
        UsageStyle::OpenAI => (usage.prompt_tokens - cache_tokens_i32).max(0),
        UsageStyle::Anthropic => usage.prompt_tokens.max(0),
    };

    let input_cost =
        calculate_tiered_cost(input_tiers, input_price, prompt_tokens_without_cache_i32);
    let cache_cost = calculate_tiered_cost(
        input_cache_read_tiers,
        input_cache_read_price,
        cache_tokens_i32,
    );
    let output_cost =
        calculate_tiered_cost(output_tiers, output_price, usage.completion_tokens.max(0));

    let total_cost = input_cost + cache_cost + output_cost;

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
    use std::str::FromStr;

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
    fn missing_cache_price_defaults_to_zero_without_zeroing_other_prices() {
        let usage = services::usage::ExtractedUsage {
            prompt_tokens: 5,
            completion_tokens: 107,
            input_cache_read_tokens: 0,
        };
        let pricing = serde_json::json!({
            "input": "2",
            "output": "3"
        });

        let input = extract_usage_input_with_tokens(&usage, &pricing, UsageStyle::OpenAI);
        let expected = (Decimal::from(2) * Decimal::from(5)
            + Decimal::from(3) * Decimal::from(107))
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
    fn output_tiers_are_billed_progressively() {
        let usage = services::usage::ExtractedUsage {
            prompt_tokens: 0,
            completion_tokens: 3000,
            input_cache_read_tokens: 0,
        };
        let pricing = serde_json::json!({
            "input": "0",
            "output": "10",
            "input_cache_read": "0",
            "output_tiers": [
                { "min": 0, "max": 1000, "cost": "8" },
                { "min": 1001, "max": 5000, "cost": "6" }
            ]
        });

        let input = extract_usage_input_with_tokens(&usage, &pricing, UsageStyle::OpenAI);
        let expected = (Decimal::from(1000) * Decimal::from(8)
            + Decimal::from(2000) * Decimal::from(6))
            / Decimal::from(1_000_000);

        assert_eq!(input.cost, expected);
    }

    #[test]
    fn cache_read_tiers_are_billed_progressively() {
        let usage = services::usage::ExtractedUsage {
            prompt_tokens: 2500,
            completion_tokens: 0,
            input_cache_read_tokens: 1500,
        };
        let pricing = serde_json::json!({
            "input": "2",
            "output": "0",
            "input_cache_read": "1",
            "input_cache_read_tiers": [
                { "min": 0, "max": 1000, "cost": "0.5" },
                { "min": 1001, "max": 2000, "cost": "0.25" }
            ]
        });

        let input = extract_usage_input_with_tokens(&usage, &pricing, UsageStyle::OpenAI);
        let expected = (Decimal::from(1000) * Decimal::from(2)
            + Decimal::from(1000) * Decimal::from_str("0.5").unwrap()
            + Decimal::from(500) * Decimal::from_str("0.25").unwrap())
            / Decimal::from(1_000_000);

        assert_eq!(input.cost, expected);
    }

    #[test]
    fn max_tokens_for_budget_uses_progressive_tiers() {
        let tiers = vec![
            PricingTier {
                min: Some(0),
                max: Some(1000),
                cost: Decimal::from(8),
            },
            PricingTier {
                min: Some(1001),
                max: Some(5000),
                cost: Decimal::from(6),
            },
        ];
        let budget = (Decimal::from(1000) * Decimal::from(8)
            + Decimal::from(2000) * Decimal::from(6))
            / Decimal::from(1_000_000);

        assert_eq!(
            max_tokens_for_budget(Some(&tiers), Decimal::from(10), budget),
            3000
        );
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
