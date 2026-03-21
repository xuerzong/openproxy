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
