# OpenProxy

A self-hosted AI API proxy service. Manage multiple AI provider backends (OpenAI, Anthropic, etc.) behind a unified API interface, with API key management, usage tracking, and a web dashboard.

[Document](https://openproxy.sh)

## Features

- **Unified API** — OpenAI-compatible (`/v1/chat/completions`) and Anthropic-compatible (`/v1/messages`) endpoints
- **Multi-provider failover** — Configure multiple backends per model with weighted random load balancing; automatically falls back to the next provider on failure
- **Multi-key rotation** — Each provider can have multiple API keys. The proxy tracks the last N used `(provider, key)` combinations per user API key (N = min(10, total combinations)) and deprioritises recently-used combinations on the next request, spreading load and reducing rate-limit exposure
- **API key management** — Per-key quota, request limits, expiry, and model access control
- **Usage tracking** — Per-request cost calculation (based on token pricing), response time, and provider attribution
- **Admin panel** — Manage models, AI providers, users, and orders
- **Tenant dashboard** — Usage charts, balance display, and request history
- **Secure key storage** — Provider API keys are stored RSA-encrypted in the database
- **Authentication** — Email/password, phone OTP, GitHub, Google (via [better-auth](https://better-auth.com))

### Example

```bash
curl http://localhost:5060/v1/chat/completions \
  -H "Authorization: Bearer <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## License

[MIT](./LICENSE)
