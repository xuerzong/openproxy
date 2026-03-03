# AIProxy

A self-hosted AI API proxy service. Manage multiple AI provider backends (OpenAI, Anthropic, etc.) behind a unified API interface, with API key management, usage tracking, and a web dashboard.

## Features

- **Unified API** — OpenAI-compatible (`/v1/chat/completions`) and Anthropic-compatible (`/v1/messages`) endpoints
- **Multi-provider failover** — Configure multiple backends per model with weighted random load balancing; automatically falls back to the next provider on failure
- **API key management** — Per-key quota, request limits, expiry, and model access control
- **Usage tracking** — Per-request cost calculation (based on token pricing), response time, and provider attribution
- **Admin panel** — Manage models, AI providers, users, and orders
- **Tenant dashboard** — Usage charts, balance display, and request history
- **Secure key storage** — Provider API keys are stored RSA-encrypted in the database
- **Authentication** — Email/password, magic link, phone OTP, GitHub, Google (via [better-auth](https://better-auth.com))

## Architecture

```
aiproxy/
├── apps/
│   ├── api/        # Rust proxy service (axum) — forwards AI requests, tracks usage
│   ├── server/     # Bun/Elysia backend — auth, key management, admin API
│   └── web/        # React frontend (Vite) — tenant dashboard + admin panel
├── packages/
│   ├── auth/       # Shared auth utilities (isAdmin, etc.)
│   └── schema/     # Shared Zod/TypeBox schemas
└── docker-compose.yml
```

### How requests flow

```
Client → apps/api (Rust, port 5060)
           ├── Auth middleware: validates API key via apps/server DB
           ├── Weighted-random provider selection
           ├── Forwards request to upstream AI provider
           └── Records usage (tokens, cost, latency) to DB
```

![request_flow](./assets/workflow.png)

## Tech Stack

| Layer    | Technology                               |
| -------- | ---------------------------------------- |
| Proxy    | Rust, axum, reqwest, tokio               |
| Backend  | Bun, Elysia, Drizzle ORM, better-auth    |
| Frontend | React, Vite, TailwindCSS, TanStack Query |
| Database | PostgreSQL                               |
| Monorepo | Turborepo, Bun workspaces                |

## Quick Start

### Prerequisites

- [Rust](https://rustup.rs/) 1.75+
- [Bun](https://bun.sh/) 1.3+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

### 1. Clone and install dependencies

```bash
git clone https://github.com/your-org/aiproxy.git
cd aiproxy
bun install
```

### 2. Configure environment

```bash
cp apps/server/.env.example apps/server/.env
```

Edit `apps/server/.env`:

```dotenv
# PostgreSQL connection string
DATABASE_URL=postgres://user:password@localhost:5432/aiproxy

# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=your-secret-here

# URL of the server (used for auth callbacks)
BETTER_AUTH_URL=http://localhost:5080/api
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:5173

# RSA key pair for encrypting provider API keys
# Generate with: bun scripts/generateRSAKey.ts
RSA_PRIVATE_KEY=
RSA_PUBLIC_KEY=

# Email (choose one)
RESEND_API_KEY=         # Resend
# or SMTP_HOST / SMTP_USER / SMTP_PASS / SMTP_FROM

# Optional: GitHub / Google OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Create `apps/api/.env`:

```dotenv
DATABASE_URL=postgres://user:password@localhost:5432/aiproxy
RSA_PRIVATE_KEY=        # Same key as server
PORT=5060
```

### 3. Generate RSA key pair

```bash
bun scripts/generateRSAKey.ts
```

Copy the output values into both `.env` files.

### 4. Run database migrations

```bash
cd apps/server
bun run drizzle migrate
```

### 5. Start development services

```bash
# From repo root — starts all services via Turborepo
bun run dev

# Or individually:
cd apps/api   && cargo run
cd apps/server && bun run dev
cd apps/web   && bun run dev:tenant   # tenant dashboard on :5173
cd apps/web   && bun run dev:admin    # admin panel on :5173
```

## Docker Deployment

```bash
# Copy and edit environment variables
cp apps/server/.env.example .env
# Fill in DATABASE_URL, BETTER_AUTH_SECRET, RSA keys, etc.

docker-compose up -d
```

| Service      | Port | Description      |
| ------------ | ---- | ---------------- |
| `server`     | 5080 | Backend API      |
| `web-tenant` | 5090 | Tenant dashboard |
| `web-admin`  | 5091 | Admin panel      |

> The Rust proxy (`apps/api`) is deployed separately. Point `DATABASE_URL` and `RSA_PRIVATE_KEY` to the same database as `server`.

## API Reference

The proxy service (`apps/api`) exposes an OpenAI-compatible API.

**Base URL:** `http://localhost:5060`

**Authentication:** `Authorization: Bearer <api-key>`

| Method | Path                   | Description               |
| ------ | ---------------------- | ------------------------- |
| `GET`  | `/health`              | Health check              |
| `GET`  | `/v1/models`           | List available models     |
| `POST` | `/v1/chat/completions` | OpenAI-compatible chat    |
| `POST` | `/v1/messages`         | Anthropic-compatible chat |
| `POST` | `/v1/embeddings`       | Embeddings                |

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

MIT
