# API Service

This document describes runtime billing behavior for the Rust API proxy.

## Billing Rules

Billing is token-based with prices defined per 1,000,000 tokens.

Pricing fields:
- `input`: base input token price
- `output`: base output token price
- `input_cache_read`: base cache-read token price
- `input_tiers`: optional tiered input pricing
- `output_tiers`: optional tiered output pricing
- `input_cache_read_tiers`: optional tiered cache-read pricing

Tier item shape:
- `cost`: price per 1,000,000 tokens
- `min`: optional inclusive lower bound
- `max`: optional inclusive upper bound

If a token range is covered by a tier, tier `cost` is used. Any uncovered range falls back to the corresponding base price.

## Cost Composition

Total request cost is:
- `input_cost + cache_cost + output_cost`

Where:
- `input_cost` uses `input_tiers` with `input` as fallback
- `cache_cost` uses `input_cache_read_tiers` with `input_cache_read` as fallback
- `output_cost` uses `output_tiers` with `output` as fallback

All three parts are computed with the same tiered-cost engine.

## Usage Style Differences

### OpenAI style
- Input billable tokens = `max(prompt_tokens - input_cache_read_tokens, 0)`
- Cache-read tokens are billed separately

### Anthropic style
- Input billable tokens = `prompt_tokens`
- Cache-read tokens are also billed separately

## Balance Validation (Public Models)

For public models, the API validates balance before forwarding upstream:
1. Compute input cost using `input_tiers` + `input`
2. If balance is below input cost, return `402 PAYMENT_REQUIRED`
3. Use remaining balance to compute max affordable output tokens
4. If request `max_tokens` is larger than affordable value, auto-cap it

For private models, this balance validation path is skipped.

## Source of Truth

Implementation files:
- `src/utils/chat.rs`
- `src/utils/balance.rs`
- `src/models/model.rs`
