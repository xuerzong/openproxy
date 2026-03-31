# apps/web — React Frontend Conventions

## Tech Stack

- React 18+, Vite, TypeScript, TailwindCSS v4, TanStack Query, react-i18next
- UI components from `@openproxy/ui` package
- Auth via `better-auth` client (`@/utils/better-auth.ts`)

## i18n — MANDATORY

**All user-facing text must use i18n translation keys.** No hardcoded strings, no `defaultValue` fallbacks.

When adding or modifying any visible text (labels, tooltips, placeholders, error messages, button text, titles, descriptions):
1. Add the key to **both** locale files:
   - `public/locales/en-US.json` (English)
   - `public/locales/zh-CN.json` (Chinese)
2. Use `t('section.key')` in the component via `useTranslation('common')`.
3. Namespace is `common` (single namespace). Config: `src/i18n/index.ts`.

## Code Style

- Functional components only. Use hooks for state and side effects.
- ESLint policy is layered: keep general cleanliness rules strict in the shared web preset, keep unavoidable React/type compatibility relaxations grouped separately, and prefer file-scoped overrides in `apps/web/eslint.config.js` for generated or upstream code such as `src/utils/qr/codegen.ts`.
- Data fetching: use `@tanstack/react-query` hooks in `src/hooks/queries/`.
- Query-backed tables should pass the corresponding query `isLoading` state into `@openproxy/ui/Table` via the `loading` prop instead of maintaining page-specific table loading UIs.
- KPI cards that combine a headline metric with a right-aligned sparkline should use `src/components/SparklineStatisticCard.tsx` rather than inlining the layout repeatedly.
- Shared 404 and empty-state illustrations should use `src/components/NotFoundIllustration.tsx` instead of linking `/404.svg` directly.
- Historical analytics pages belong in the main workspace navigation, not under settings menus; settings should remain focused on configuration and management flows.
- Styles: TailwindCSS utility classes + CSS modules (`*.module.css`) when needed.
- Path aliases: `@/` → `src/`, `@openproxy/` → workspace packages.
- Sidebar menus in `src/layouts/DashboardLayout.tsx` may include non-clickable `label` and `separator` entries to create grouped navigation sections.

## Project Structure

```
src/
├── apps/               # App-specific pages (admin, tenant)
├── components/         # Shared components
├── constants/          # App constants
├── contexts/           # React contexts (Auth, Api)
├── hooks/              # Custom hooks
│   └── queries/        # TanStack Query hooks
├── i18n/               # i18n config
├── layouts/            # Layout components
├── pages/              # Route pages
├── stores/             # State stores
├── types/              # TypeScript types
└── utils/              # Utility functions
```

## Build

- `bun run dev` — dev server
- `bun run build:tenant` — build tenant app
- `bun run build:admin` — build admin app
