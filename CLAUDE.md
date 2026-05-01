@AGENTS.md

## Stack

- Next.js 16 (App Router), TypeScript 5 strict, Tailwind CSS 4, shadcn/ui (New York style)
- React 19, Zod for runtime validation, Jest + ts-jest for unit tests, Playwright for e2e
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

```
e2e/
├── fixtures/         # Shared Playwright fixtures (authedPage etc.)
├── auth/             # Auth-bounded e2e specs
├── tenancy/          # Tenancy-bounded e2e specs
├── global-setup.ts   # No-op stub; T2 replaces with admin bootstrap
├── smoke.spec.ts     # Harness smoke test (/login renders)
├── run-local.sh      # Full orchestrator: postgres + backend + frontend + teardown
└── README.md         # E2E conventions and how-to
```

## Commands

```bash
npm run dev      # Start dev server on http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint
npm test         # Jest unit tests
npm run test:e2e:local   # Full Playwright e2e (Docker + ../maco-backend required)
npm run test:e2e         # Playwright only (servers must already be up)
npx playwright install --with-deps chromium  # first-time browser install
```

## Conventions

- Path aliases: `@/components`, `@/lib`, `@/hooks`, `@/services`, `@/types`, `@/providers`, `@/config`
- `noUncheckedIndexedAccess: true` — array/object access returns `T | undefined`
- Add new shadcn/ui components via `npx shadcn@latest add <component>` — never edit `src/components/ui/` manually
- Copy `.env.example` to `.env.local` before running locally; `src/config/env.ts` throws at startup if vars are missing/invalid
- **API client** (`services/api-client.ts`): native `fetch` wrapper — no axios. Call `configureAuth(config)` once (e.g. in auth provider) to inject token/tenantId getters. Handles 401 refresh with queuing, 403/5xx/network errors.
- **Auth wiring**: `configureAuth` accepts `{ getToken, getRefreshToken, getTenantId, onTokenRefreshed }`. Auth provider must call this; until then headers are omitted.
- **Query keys**: use factory pattern (see `serviceKeys` in `services/services.ts`) for all resources — enables targeted cache invalidation.
- **Pagination**: `usePaginatedQuery(keyFactory, fetcher, { pageSize })` in `hooks/use-paginated-query.ts` — offset-based only; cursor-based deferred.

## App Shell (MACO-58)

- **Dashboard layout**: `src/app/(dashboard)/layout.tsx` — wraps all protected routes with `PermissionsProvider`, `TooltipProvider`, `Sidebar`, and `Topbar`
- **Root layout**: wraps app with `ThemeProvider` (next-themes, `storageKey="maco-theme"`) and `Toaster` (sonner, bottom-right, 5s duration)
- **Navigation config**: `src/config/navigation.ts` exports `NAV_ITEMS` and `SEGMENT_LABELS`; each nav item has an optional `requiredPermission` field
- **Permissions**: `src/providers/permissions-provider.tsx` — mock provider; replace with real auth integration in a future ticket
- **Sidebar collapse**: state persisted in `localStorage` under key `maco-sidebar-state`; initialized via lazy `useState` (not `useEffect`) to avoid ESLint `react-hooks/set-state-in-effect`
- **DataTable** (`src/components/common/data-table.tsx`): built on `@tanstack/react-table` v8 — React Compiler emits a warning for `useReactTable` (known library incompatibility, not a bug)
- **Common components**: `page-header`, `empty-state`, `breadcrumbs`, `data-table`, `confirm-dialog`, `loading-skeleton`, `error-boundary`, `qualification-list`, `qualification-adder` all live in `src/components/common/`
- **Qualifications (MACO-68)**: `QualificationList` + `QualificationAdder` power both the "By Staff" tab in `/equipe/usuarios/[id]` and the "Equipe Qualificada" tab in `/catalogo/servicos/[id]`. Service hooks live in `src/services/qualifications.ts`; types in `src/types/qualification.ts`. Requires permissions: `qualifications:read`, `qualifications:create`, `qualifications:delete`.
- **Vitest setup**: `vitest.setup.ts` includes jsdom polyfills for `hasPointerCapture`, `setPointerCapture`, `releasePointerCapture`, `scrollIntoView` (required by Radix UI Select and other Radix primitives in test environments)

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

## Vercel Deployment (MACO-55)

- **Config**: `vercel.json` at repo root — explicit Next.js framework, build, dev, install commands
- **Production deploy**: Vercel GitHub integration auto-deploys on push to `main`
- **Preview deploys**: every PR gets a unique preview URL posted as a PR comment (via Vercel bot)
- **Env vars**: set per environment in the Vercel dashboard (Preview / Production):
  - `NEXT_PUBLIC_API_URL` — backend API base URL (different per env)
  - `NEXT_PUBLIC_APP_NAME` — `MACO`
- **Domain**: configured in Vercel dashboard; SSL auto-provisioned
- **Gotcha**: `src/config/env.ts` validates env vars at startup via Zod — Vercel build fails fast if vars are missing
