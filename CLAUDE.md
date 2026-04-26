@AGENTS.md

## Stack

- Next.js 16 (App Router), TypeScript 5 strict, Tailwind CSS 4, shadcn/ui (New York style)
- React 19, Zod for runtime validation, Jest + ts-jest for unit tests
- TanStack Query v5 (`@tanstack/react-query`) for server-state cache; Devtools auto-included in dev only

## Layout

```
src/
├── app/              # App Router — (auth) public group, (dashboard) protected group
├── components/ui/    # shadcn/ui primitives (auto-generated — do not hand-edit)
├── components/common/# Shared composed components
├── config/           # App constants; env.ts validates env vars via Zod at startup
├── hooks/            # Custom React hooks
├── lib/              # Utilities (cn, formatters, validators)
├── providers/        # React context providers
├── services/         # API client & endpoint functions
└── types/            # Shared TypeScript types/interfaces
```

## Commands

```bash
npm run dev          # Start dev server on http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint (eslint .)
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier write
npm run format:check # Prettier check
npm test             # Jest unit tests
```

## Conventions

- Path aliases: `@/components`, `@/lib`, `@/hooks`, `@/services`, `@/types`, `@/providers`, `@/config`
- `noUncheckedIndexedAccess: true` — array/object access returns `T | undefined`
- Add new shadcn/ui components via `npx shadcn@latest add <component>` — never edit `src/components/ui/` manually
- Copy `.env.example` to `.env.local` before running locally; `src/config/env.ts` throws at startup if vars are missing/invalid
- ESLint uses flat config (`eslint.config.mjs`); `next lint` is removed in Next.js 16 — use `eslint .` directly
- `eslint-plugin-tailwindcss` points to `src/app/globals.css` for Tailwind v4 class ordering; `no-custom-classname` is off (shadcn theme variables)
- Pre-commit hook runs `lint-staged` via Husky; staged `.ts/.tsx` files are auto-fixed then formatted
- **API client** (`services/api-client.ts`): native `fetch` wrapper — no axios. Call `configureAuth(config)` once (e.g. in auth provider) to inject token/tenantId getters. Handles 401 refresh with queuing, 403/5xx/network errors.
- **Auth wiring**: `configureAuth` accepts `{ getToken, getRefreshToken, getTenantId, onTokenRefreshed }`. Auth provider must call this; until then headers are omitted.
- **Query keys**: use factory pattern (see `serviceKeys` in `services/services.ts`) for all resources — enables targeted cache invalidation.
- **Pagination**: `usePaginatedQuery(keyFactory, fetcher, { pageSize })` in `hooks/use-paginated-query.ts` — offset-based only; cursor-based deferred.

## CI Pipeline

GitHub Actions workflow at `.github/workflows/ci.yml` runs on push/PR to `main`:

```
lint → type-check → test → build
```

Jobs run sequentially with `needs:` dependencies; any failure skips downstream jobs. Concurrency group per branch cancels redundant PR runs.

| Command                | Description                 |
| ---------------------- | --------------------------- |
| `npm run lint`         | ESLint                      |
| `npm run format:check` | Prettier check              |
| `npm run type-check`   | TypeScript (`tsc --noEmit`) |
| `npx jest --coverage`  | Tests with coverage         |
| `npm run build`        | Next.js production build    |

See `CONTRIBUTING.md` for local workflow and branch protection recommendations.
