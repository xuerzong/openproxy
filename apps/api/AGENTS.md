# apps/api — Rust Proxy Conventions

## Tech Stack

- Rust 2024 edition, axum 0.7, tokio, reqwest, sqlx (PostgreSQL)
- RSA encryption via `rsa` crate, base64 encoding

## Code Style

- Use `snake_case` for functions and variables, `PascalCase` for types and structs.
- Prefer `impl` blocks over free functions when methods belong to a struct.
- Use `thiserror` or explicit error types; avoid `.unwrap()` in non-test code.
- In tests, use `#[tokio::test]` for async tests.

## Project Structure

```
src/
├── main.rs             # Entry point
├── lib.rs              # Re-exports
├── router.rs           # Axum router setup
├── adapters/           # Provider-specific adapters
│   ├── bailian.rs      # Alibaba Cloud Bailian adapter
│   ├── default.rs      # Fallback adapter (passthrough)
│   ├── deepseek.rs     # DeepSeek adapter
│   ├── kimi.rs         # Moonshot / Kimi adapter
│   ├── minimax.rs      # MiniMax adapter (OpenAI-compat endpoints only)
│   ├── opencode.rs     # OpenCode Zen gateway adapter
│   ├── openai.rs       # OpenAI official adapter
│   ├── openrouter.rs   # OpenRouter adapter
│   ├── vercel.rs       # Vercel AI Gateway adapter
│   ├── zai.rs          # Z.ai / 智谱 BigModel adapter
│   └── mod.rs          # Adapter trait, factory & shared helpers
├── db/                 # Database queries (sqlx)
├── handlers/           # Route handlers
├── middleware/          # Auth, logging middleware
├── models/             # Data models / DTOs
├── services/           # Business logic
├── shared/             # Shared state (cache, proxy logic)
└── utils/              # Helpers
    ├── tokens.rs       # Token counting with tiktoken
    ├── balance.rs      # Balance validation & output limiting
    ├── chat.rs         # Chat-specific utilities
    └── ...             # encryption, hash, etc.
```

## Testing

- Run tests: `cargo test`
- Place unit tests in the same file using `#[cfg(test)] mod tests { ... }`.
- Use `tokio::net::TcpListener` + `axum::Router` for integration test servers.
- Prefer self-contained unit tests that generate their own fixtures and keys instead of depending on `.env`.

## Environment

- `.env` file with `DATABASE_URL`, `RSA_PRIVATE_KEY`, `PORT`.
- Redis-backed cache/rate-limit features use optional `REDIS_URL`.
- Load via `dotenvy::dotenv()`.

## Redis Usage (API only)

- Redis is required for API caching and rate limiting. Configure `REDIS_URL` in runtime environments.
- Shared low-level Redis utilities live in `src/shared/redis.rs`.
- Shared request IP/header parsing utilities live in `src/utils/ip.rs`.
- Keep business-specific cache key wrappers in the owning service/handler (for example, access validation cache logic in `src/services/access.rs`) instead of centralizing all wrappers in shared module.
- Provider sticky combo wrappers (fingerprint -> last successful provider/api-key) are owned by `src/shared/proxy.rs`; `src/shared/redis.rs` only exposes generic Redis primitives.
- Keep keys namespaced with `openproxy:` prefix:
  - `openproxy:cache:decrypted_provider_key:{encrypted_key}`
  - `openproxy:cache:sticky_combo:{api_key_id}:{fingerprint_hash}`
  - `openproxy:access:rows:{hash_api_key}:{model_id}`
  - `openproxy:access:index:{api_key_id}` (set of access cache keys for targeted invalidation)
  - `openproxy:models:public:v1`
  - `openproxy:rate:{hashed_key}:{minute_bucket}`
- Keep TTLs short for auth/model data (tens of seconds to minutes); sticky combo cache currently uses 30 minutes, while decrypted provider keys can stay longer.
- After usage is committed, invalidate access-cache keys by `api_key_id` to ensure balance/quota changes are visible immediately.
- `API_RATE_LIMIT_PER_MINUTE` defaults to `600` when env is not provided.

## Token Counting & Balance Management

### Token Counting

- Use `tiktoken-rs` crate for accurate token counting via OpenAI's tokenizer.
- Token counting utilities live in `src/utils/tokens.rs`:
  - `count_input_tokens(body, model)`: Parse request messages and count tokens, including formatting overhead.
  - `count_tokens_for_content(content, model)`: Count tokens for a single string.
- Support both string messages (`"content": "text"`) and multimodal/vision format (`"content": [{"type": "text", ...}]`).
- Add message overhead: ~4 tokens per message + system prompt tokens.
- Fallback gracefully to character-based estimation (1 token ≈ 4 chars) if tiktoken unavailable.

### Balance Validation & Output Token Limiting

- All public model requests must validate user balance **before** forwarding to upstream.
- Balance validation utilities live in `src/utils/balance.rs`:
  - `check_balance_and_available_output(user, input_tokens, requested_max_tokens)`: Validate balance and calculate available output tokens.
  - `apply_balance_check_to_body(body, result)`: Auto-adjust `max_tokens` in request if needed.
- Base formula without tiers: $O_{available} = \left\lfloor \frac{Balance - I_{cost}}{P_{output}} \times 1,000,000 \right\rfloor$, where $I_{cost} = \frac{I \times P_{input}}{1,000,000}$
- If `output_tiers` or `input_cache_read_tiers` are present, bill them **progressively by tier range**, not by picking a single flat tier for the whole token count.
- Balance pre-check must use the same progressive `output_tiers` logic as final usage charging so `max_tokens` capping matches eventual billing.
- Return **402 Payment Required** if balance insufficient for input tokens; do not forward upstream.
- Automatically cap `requested_max_tokens` to available output tokens (transparent to user).
- Skip validation for private models (different billing model).
- Log balance checks at INFO level for audit trail.

### Integration Pattern

- Validation happens in request handlers (e.g., `src/handlers/chat_completions.rs`):
  1. Parse request body using `parse_proxy_request()`
  2. Count input tokens via `count_input_tokens()`
  3. Check balance via `check_balance_and_available_output()` → return 402 if insufficient
  4. Apply adjustments via `apply_balance_check_to_body()`
  5. Forward modified request to upstream handler
- Each endpoint handler repeats this pattern; centralize token counting/balance logic in `src/utils/` modules.
- Do not duplicate validation logic; reuse utilities from `utils::tokens` and `utils::balance`.

## Provider Adapters

### Architecture

- Provider metadata used by the Rust runtime is database-backed. `GET /v1/providers` reads from
  `ai_providers`, and request-time adapter selection uses `ProviderInfo.ai_provider_id` from
  access validation rather than matching hosts against a static registry.
- `packages/config/src/ai-providers.json` and `apps/api/generated/ai-providers.json` remain seed /
  distribution artifacts for provisioning and build workflows, but they are no longer the runtime
  source of truth for provider metadata inside `apps/api`.
- When a new provider is added, update the shared JSON (including `adapterKind` if the provider
  needs anything beyond the default no-op adapter), regenerate `apps/api/generated/ai-providers.json`
  via `bun run sync:api-provider-registry`, and seed the database. The Rust adapter dispatcher
  reads adapter selection from the generated JSON at startup — no Rust code change is required
  unless a brand-new adapter kind is being introduced.
- Most OpenAI-compatible providers share `StreamUsageProviderAdapter`; only providers with
  materially different behavior should keep dedicated adapter files.
- `adapters/` contains provider-specific request/response adapters.
- `ProviderAdapter` trait has three request-style methods (all default to no-op):
  - `adapt_openai_request(body, is_stream)` — OpenAI `/v1/chat/completions` style.
  - `adapt_anthropic_request(body, is_stream)` — Anthropic `/v1/messages` style.
  - `adapt_responses_request(body, is_stream)` — OpenAI `/v1/responses` style (currently
    unused internally; responses are pre-translated to chat/completions, but the hook is
    available for future direct routing).
- `ProviderAdapterFactory::for_provider()` dispatches by `ProviderInfo.ai_provider_id` →
  `adapterKind` (from the registry JSON) → adapter impl. IDs absent from the registry or
  without an `adapterKind` fall back to `DefaultProviderAdapter` (passthrough). Custom
  providers created via the admin UI always behave as `default`.
- Shared helper `ensure_stream_options_include_usage(body)` lives in `adapters/mod.rs`.
  Adapters that need the final `usage` chunk on streaming OpenAI responses should call it
  from `adapt_openai_request`.

### `/v1/providers` Endpoint

- `GET /v1/providers` (public, no auth) returns provider metadata from the `ai_providers` table
  with `id`, `name`, `base_url`, per-style `base_urls`, `supported_styles`, and `docs_url`.
- The server app exposes the same database-backed list at `/providers` for admin UI consumption.

### Adapter Selection

1. Add an entry to `packages/config/src/ai-providers.json`. Set `"adapterKind"` to one of
  `"openai"` | `"stream_usage"` if the provider needs more than the default no-op behavior;
  omit the field for default behavior.
2. Run `bun run sync:api-provider-registry` to copy the registry into
  `apps/api/generated/ai-providers.json` (CI also enforces this is in sync).
3. Only add a new adapter file / `AdapterKind` variant when an entirely new request-mutation
  behavior is required.
4. Document the provider in the **Provider Registry** section below (base URLs, styles, quirks,
  docs URL).
5. Add tests that cover request transformations for any non-default behavior.

### Provider Registry (single source in `packages/config/src/ai-providers.json`)

| id | Display | Styles | Notes |
|----|---------|--------|-------|
| `bailian` | 百炼 / Bailian | OpenAI chat, Embeddings | `stream_options.include_usage` required on streaming. Regional hosts: `dashscope-us.aliyuncs.com`, `dashscope-intl.aliyuncs.com`. |
| `vercel` | Vercel AI Gateway | OpenAI chat, Anthropic messages, Responses, Embeddings | Split base URLs per style. Model IDs must be `provider/model`. Enforce `include_usage` on streaming. |
| `kimi` | Kimi (Moonshot) | OpenAI chat | Enforce `include_usage`. Supports `thinking` (k2.6+) and `prompt_cache_key`. |
| `deepseek` | DeepSeek | OpenAI chat, Anthropic messages | Separate `/anthropic` base. Enforce `include_usage`. Supports `reasoning_effort` / `thinking`. |
| `minimax` | MiniMax | OpenAI chat, Anthropic messages | Use ONLY the OpenAI-compat base — native `/v1/text/chatcompletion*` endpoints are not supported. Enforce `include_usage`. Separate `/anthropic` base. |
| `opencode` | OpenCode Zen | `OpenCode` | OpenAI chat, Anthropic messages, Responses | Curated gateway. Enforce `include_usage`. |
| `openrouter` | OpenRouter | `OpenRouter` | OpenAI chat | Model IDs must be `provider/model`. Enforce `include_usage`. Optional attribution headers (`HTTP-Referer`, `X-OpenRouter-Title`) are NOT added by the adapter — must be set at the HTTP client layer if desired. |
| `openai` | OpenAI | `OpenAI` | OpenAI chat, Responses, Embeddings | Canonical. No quirks. Does NOT inject `stream_options` so client-provided bodies pass through untouched. |
| `zai` | 智谱 BigModel / Z.ai | `Zai` | OpenAI chat, Anthropic messages | Bases: `api.z.ai/api/paas/v4` (OpenAI), `api.z.ai/api/anthropic` (Anthropic), `open.bigmodel.cn/api/paas/v4` (CN mainland alt). GLM-4.5+ accepts `thinking: { type: "enabled" }`. Enforce `include_usage`. |

Keep this table in sync with the provider seed/config and adapter dispatch map. When you update provider docs or
endpoints, refresh this section as part of the same commit.
