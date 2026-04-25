## CI Pipeline

GitHub Actions workflow at `.github/workflows/ci.yml` runs on push/PR to `main`:

```
lint → type-check → test → build
```

Jobs run sequentially with `needs:` dependencies; any failure skips downstream jobs. Concurrency group per branch cancels redundant PR runs.

## Commands

| Command | Description |
|---|---|
| `npm run lint` | ESLint |
| `npm run format:check` | Prettier check |
| `npm run type-check` | TypeScript (`tsc --noEmit`) |
| `npx jest --coverage` | Tests with coverage |
| `npm run build` | Next.js production build |

See `CONTRIBUTING.md` for local workflow and branch protection recommendations.
