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
├── db/                 # Database queries (sqlx)
├── handlers/           # Route handlers
├── middleware/          # Auth, logging middleware
├── models/             # Data models / DTOs
├── services/           # Business logic
├── shared/             # Shared state (cache, proxy logic)
└── utils/              # Helpers (encryption, adapter)
```

## Testing

- Run tests: `cargo test`
- Place unit tests in the same file using `#[cfg(test)] mod tests { ... }`.
- Use `tokio::net::TcpListener` + `axum::Router` for integration test servers.
- Prefer self-contained unit tests that generate their own fixtures and keys instead of depending on `.env`.

## Environment

- `.env` file with `DATABASE_URL`, `RSA_PRIVATE_KEY`, `PORT`.
- Load via `dotenvy::dotenv()`.
