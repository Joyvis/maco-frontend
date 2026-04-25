@AGENTS.md

## Stack

- Next.js 16 (App Router), TypeScript 5 strict, Tailwind CSS 4, shadcn/ui (New York style)
- React 19, Zod for runtime validation, Jest + ts-jest for unit tests

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
npm run dev      # Start dev server on http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint
npm test         # Jest unit tests
```

## Conventions

- Path aliases: `@/components`, `@/lib`, `@/hooks`, `@/services`, `@/types`, `@/providers`, `@/config`
- `noUncheckedIndexedAccess: true` — array/object access returns `T | undefined`
- Add new shadcn/ui components via `npx shadcn@latest add <component>` — never edit `src/components/ui/` manually
- Copy `.env.example` to `.env.local` before running locally; `src/config/env.ts` throws at startup if vars are missing/invalid

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
