# OpenProxy

A self-hosted AI API proxy service. Manage multiple AI provider backends (OpenAI, Anthropic, etc.) behind a unified API interface, with API key management, usage tracking, and a web dashboard.

## Features

- **Unified API** — OpenAI-compatible (`/v1/chat/completions`) and Anthropic-compatible (`/v1/messages`) endpoints
- **Multi-provider failover** — Configure multiple backends per model with weighted random load balancing; automatically falls back to the next provider on failure
- **Multi-key rotation** — Each provider can have multiple API keys. The proxy tracks the last N used `(provider, key)` combinations per user API key (N = min(10, total combinations)) and deprioritises recently-used combinations on the next request, spreading load and reducing rate-limit exposure
- **API key management** — Per-key quota, request limits, expiry, and model access control
- **Usage tracking** — Per-request cost calculation (based on token pricing), response time, and provider attribution
- **Admin panel** — Manage models, AI providers, users, and orders
- **Tenant dashboard** — Usage charts, balance display, and request history
- **Secure key storage** — Provider API keys are stored RSA-encrypted in the database
- **Authentication** — Email/password, magic link, phone OTP, GitHub, Google (via [better-auth](https://better-auth.com))

## Architecture

```
openproxy/
├── apps/
│   ├── api/        # Rust proxy service (axum) — forwards AI requests, tracks usage
│   ├── server/     # Bun/Elysia backend — auth, key management, admin API
│   └── web/        # React frontend (Vite) — tenant dashboard + admin panel
├── packages/
│   └── schema/     # Shared Zod/TypeBox schemas
└── docker-compose.yml
```

### How requests flow

```
Client → apps/api (Rust, port 5060)
           ├── Auth middleware: validates API key via apps/server DB
           ├── Weighted-random provider selection
           ├── Key-rotation: skip recently used (provider, key) combinations
           ├── Forwards request to upstream AI provider (failover on error)
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
git clone https://github.com/your-org/openproxy.git
cd openproxy
bun install
```

### 2. Configure environment

```bash
cp apps/server/.env.example apps/server/.env
```

Edit `apps/server/.env`:

```dotenv
# PostgreSQL connection string
DATABASE_URL=postgres://user:password@localhost:5432/openproxy

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
DATABASE_URL=postgres://user:password@localhost:5432/openproxy
RSA_PRIVATE_KEY=        # Same key as server
PORT=5060
```

### 3. Generate RSA key pair

To generate an RSA key pair for encrypting provider API keys, run:

```bash
bun scripts/generateRSAKey.ts
```

Copy the output (RSA_PRIVATE_KEY and RSA_PUBLIC_KEY) into your .env files for both server and api.

### 4. Run database migrations

```bash
cd apps/server
bun run migrate
```

### 5. Start development services

```bash
# From repo root — starts server dev plus web admin and tenant via Turborepo
bun run dev

# Or individually:
cd apps/api   && cargo run
cd apps/server && bun run dev
cd apps/web   && bun run dev:tenant   # tenant dashboard on :5173
cd apps/web   && bun run dev:admin    # admin panel on :5173
```

## Docker Compose Deployment

It is recommended to use `docker/docker-compose.yml` for one-click deployment, including server, api, web-tenant, web-admin, and postgresql.

### Steps

1. Copy and edit the environment variable file:

```bash
cp docker/.env.example docker/.env
# Edit docker/.env and fill in database, secret keys, etc.
```

2. Start all services:

```bash
cd docker
# Start all services in the background
docker compose up -d
```

3. Domain and port mapping

- web-tenant: 5090
- web-admin: 5091
- server: 3888
- api: 5060

To bind domains, use Nginx as a reverse proxy. For example:

```nginx
server {
    listen 80;
    server_name tenant.example.com;
    location / {
        proxy_pass http://127.0.0.1:5090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name admin.example.com;
    location / {
        proxy_pass http://127.0.0.1:5091;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

For more details, see `docker/docker-compose.yml` and `docker/.env.example`.

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
