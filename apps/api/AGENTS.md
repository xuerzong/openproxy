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
│   ├── default.rs      # Default OpenAI-compatible adapter
│   └── mod.rs          # Adapter factory & trait
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
- Keep business-specific cache key wrappers in the owning service/handler (for example, access validation cache logic in `src/services/access.rs`) instead of centralizing all wrappers in shared module.
- Provider recent-combo rotation wrappers are owned by `src/shared/proxy.rs`; `src/shared/redis.rs` only exposes generic Redis primitives.
- Keep keys namespaced with `openproxy:` prefix:
  - `openproxy:cache:decrypted_provider_key:{encrypted_key}`
  - `openproxy:cache:recent_combo:{api_key_id}`
  - `openproxy:access:rows:{hash_api_key}:{model_id}`
  - `openproxy:models:public:v1`
  - `openproxy:rate:{hashed_key}:{minute_bucket}`
- Keep TTLs short for auth/model data (tens of seconds to minutes), longer for decrypted provider keys.

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
- Formula: $O_{available} = \left\lfloor \frac{Balance - I_{cost}}{P_{output}} \times 1,000,000 \right\rfloor$, where $I_{cost} = \frac{I \times P_{input}}{1,000,000}$
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
- `adapters/` directory contains provider-specific request/response adapters.
- Implement `ProviderAdapter` trait to customize request transformation for different AI provider APIs.
- Use `ProviderAdapterFactory::for_provider()` in handlers to get the appropriate adapter.

### Creating a New Adapter
1. Create a new file (e.g., `adapters/my_provider.rs`) with a struct that implements `ProviderAdapter`.
2. Implement required methods:
   - `adapt_openai_request(&self, body: &mut Value, is_stream: bool)`: Transform OpenAI-style request to provider format.
   - `adapt_openai_response(&self, body: &mut Value)`: Transform provider response back to OpenAI format.
3. Add to `ProviderAdapterFactory` in `adapters/mod.rs` to map provider ID → adapter.
4. Ensure tests validate both request and response transformations.

### Existing Adapters
- **Default** (`default.rs`): OpenAI-compatible providers (passthrough).
- **Bailian** (`bailian.rs`): Alibaba Cloud Bailian (ensures `stream_options.include_usage` for streaming).
