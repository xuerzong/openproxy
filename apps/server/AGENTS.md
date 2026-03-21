# apps/server — Bun/Elysia Backend Conventions

## Tech Stack

- Bun runtime, Elysia framework, Drizzle ORM, better-auth
- PostgreSQL, Drizzle migrations

## Code Style

- TypeScript strict mode. Use `type` over `interface` for object shapes unless extending.
- Use Elysia's plugin system (`.use()`) for modularity.
- Auth macros: `{ auth: { role: true } }` for authenticated endpoints, `{ auth: { role: 'admin' } }` for admin-only.
- Drizzle schema is in `lib/db/schema.ts`.

## Project Structure

```
├── index.ts            # Entry point
├── constants/          # App-wide constants
├── lib/                # Core libraries (auth, db, email, sms)
├── plugins/            # Elysia plugins (auth, logger, sentry)
├── routers/            # Route definitions
├── schemas/            # Input validation schemas
├── services/           # Business logic
└── scripts/            # CLI scripts (migrate, etc.)
```

## Database

- Migrations: `bun run drizzle` to generate, `bun run migrate` to apply.
- Migration files in `drizzle/` folder.

## Environment

- `.env` with `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `RSA_PRIVATE_KEY`, `RSA_PUBLIC_KEY`.
- OAuth providers enabled by env: `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`.
