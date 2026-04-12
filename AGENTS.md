# OpenProxy — Global Conventions

## Monorepo Structure

```
apps/api/       → Rust (axum) proxy — forwards AI requests, tracks usage
apps/server/    → Bun/Elysia backend — auth, key management, admin API
apps/web/       → React (Vite) frontend — tenant dashboard + admin panel
packages/       → Shared packages (schema, ui, utils, phone-auth, payment-provider)
```

## General Rules

- Use English for code (variable names, comments). User-facing text follows each app's i18n rules.
- Commits follow Conventional Commits: `feat(scope):`, `fix(scope):`, `chore(scope):`, `docs:`.
- Do not add unnecessary abstractions, comments, or error handling for impossible states.
- Keep changes minimal and focused on the task.
- Shared date and datetime inputs should be implemented in `packages/ui` as a single `DatePicker` built from Radix `Popover` and `react-day-picker`; do not introduce new native `datetime-local` fields when a reusable picker is needed.
- Shared `dayjs` setup and date locale synchronization live in `packages/utils/dayjs`; frontend language changes should update that shared locale state instead of re-initializing `dayjs` inside apps or UI components.
- Shared `DropdownMenu` items in `packages/ui` support a `disabled` state; prefer disabling unavailable actions instead of conditionally hiding them when the user should still see the action exists.
- In `apps/web` and `apps/server`, use arrow functions for regular function definitions; avoid `function` declarations/expressions. Exception: `apps/web/src/utils/qr/codegen.ts` keeps its upstream function style.
- Shared ESLint presets live in `packages/eslint-config`; app-level `eslint.config.js` files should import from this package and only keep local overrides.

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

## CI

- Shared test automation lives in `.github/workflows/test.yml`.
- The test workflow currently runs Bun tests for `apps/server` and Rust tests for `apps/api`.

## Development

- Root `bun run dev` starts `apps/server` `dev` together with `apps/web` `dev:admin` and `dev:tenant`.
- `website` is not included in the root development command.
- `website` is built with the published `stropress` npm package; keep its docs content under `website/docs/` with locale folders like `docs/en/`, and configure navigation/locales in `website/docs/config.json`.
- Root `bun run lint` runs lint for `apps/server` and `apps/web`.

## Dependency Updates

- GitHub Dependabot manages JavaScript dependency version updates for the Bun workspace via `.github/dependabot.yml` using the `npm` ecosystem at the repository root.
- Keep the root `packageManager` field and `bun.lock` current so automated dependency PRs stay compatible with the Bun toolchain used in CI and Docker builds.

## API Billing & Token Management (apps/api)

### Token Counting
- Use `ticktoken-rs` crate for accurate token counting via OpenAI's tokenizer.
- Token counting utilities live in `src/utils/tokens.rs`:
  - `count_input_tokens(body, model)`: Parse request messages and count tokens
  - `count_tokens_for_content(content, model)`: Count single string content
- Support both string messages (`"content": "text"`) and multimodal/vision format (`"content": [{"type": "text", ...}]`)
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
  1. Parse request body
  2. Count input tokens
  3. Check balance → return 402 if insufficient
  4. Cap max_tokens if needed
  5. Forward modified request to handler
- Each endpoint handler repeats this pattern; centralize token counting/balance logic in `src/utils/` modules.
