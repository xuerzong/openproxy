# apps/server — Bun/Elysia Backend Conventions

## Tech Stack

- Bun runtime, Elysia framework, Drizzle ORM, better-auth
- PostgreSQL, Drizzle migrations

## Code Style

- TypeScript strict mode. Use `type` over `interface` for object shapes unless extending.
- Use Elysia's plugin system (`.use()`) for modularity.
- Auth macros: `{ auth: { role: true } }` for authenticated endpoints, `{ auth: { role: 'admin' } }` for admin-only.
- Custom `better-auth` plugin endpoints that require a logged-in user must explicitly add `use: [sessionMiddleware]` before reading `ctx.context.session`.
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

- Generate migrations: `bun run drizzle generate --name=<descriptive-name>` (e.g. `--name=add-api-key-folders`).
- Apply migrations: `bun run drizzle migrate` (or `bun run migrate`).
- Migration files in `drizzle/` folder.
- Always use `--name` flag when generating to keep migration filenames descriptive.
- Every newly created team must get a `Default` API key folder with `isDefault=true` inside the same transaction as team creation.
- Default API key folders are system folders: they cannot be deleted, and delete flows should still promote another folder to default if historical data ends up without one.
- Team monthly usage archives live in `team_monthly_usages`; raw `usages` rows should only be retained for the current month, with prior months archived via the `/cron/archiveMonthlyUsage` endpoint before cleanup.
- Admin bootstrap uses `ADMIN_EMAILS`; if existing users were created before that env was configured, reconcile them with the `/cron/syncAdminRole` endpoint instead of editing roles from the client.

## AI Provider Registry

- The set of supported AI providers is defined once in
  `packages/config/src/ai-providers.json`, but in `apps/server` that file is now a seed input
  rather than a runtime dependency. Seed built-in providers with
  `bun run seed:ai-providers`, then read provider metadata from the `ai_providers` table.
- `GET /api/providers` in `apps/server` is database-backed and returns provider metadata from
  `ai_providers` without API-key fields.
- `GET /api/aiProviders` and related CRUD in `apps/server` are also database-backed. Built-in
  providers are identified by `is_built_in`; runtime code must not reconcile against the JSON
  registry on each request.
- `apps/api` reads provider metadata (including `adapter_kind`) directly from the `ai_providers`
  table at runtime. When provider metadata changes, update `packages/config/src/ai-providers.json`
  and run the server seed script so the new values land in the database; no separate API-side
  registry artifact needs to be regenerated.

## Environment

- `.env` with `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `RSA_PRIVATE_KEY`, `RSA_PUBLIC_KEY`.
- Add `CRON_SECRET` in `.env` and call `/cron/*` endpoints with `Authorization: Bearer <CRON_SECRET>`.
- OAuth providers enabled by env: `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`.
- `IS_OSS=true` enables OSS mode and bypasses hosted plan limits.
- `ADMIN_EMAILS` can be set to a comma-separated email list; matching users are promoted to `admin` immediately after signup, which is the supported self-host bootstrap path for admin access.

## Testing

- Use Bun native tests via `bun test` or `bun run test`.
- Place unit tests next to the module they cover using `*.test.ts`.
- Prefer testing pure utilities in isolation; avoid database and external network dependencies in unit tests.
- CI runs server tests from `.github/workflows/test.yml`.
