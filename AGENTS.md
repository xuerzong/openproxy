# OpenProxy — Global Conventions

## Monorepo Structure

```
apps/api/       → Rust (axum) proxy — forwards AI requests, tracks usage
apps/server/    → Bun/Elysia backend — auth, key management, admin API
apps/web/       → React (Vite) frontend — tenant dashboard + admin panel
packages/       → Shared packages (schema, ui, phone-auth, payment-provider)
```

## General Rules

- Use English for code (variable names, comments). User-facing text follows each app's i18n rules.
- Commits follow Conventional Commits: `feat(scope):`, `fix(scope):`, `chore(scope):`, `docs:`.
- Do not add unnecessary abstractions, comments, or error handling for impossible states.
- Keep changes minimal and focused on the task.

## Convention Maintenance — MANDATORY

When a code change introduces or reveals a reusable pattern, convention, or structural decision, **update the corresponding `AGENTS.md`** in the same commit:

- Pattern applies to one app → update that app's `AGENTS.md` (e.g. `apps/web/AGENTS.md`).
- Pattern applies across apps → update root `AGENTS.md`.

Examples of changes that require an `AGENTS.md` update:

- New shared utility / hook pattern (e.g. "all queries go in `hooks/queries/`")
- New env variable convention (e.g. "OAuth providers are feature-flagged by env")
- New architectural decision (e.g. "use ring-buffer cache for rotation")
- New i18n namespace or locale file added
- New build / test command added
