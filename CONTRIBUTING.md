# Contributing

## Local Development Commands

Run these before pushing to catch issues early:

```bash
# Lint (ESLint + Prettier format check)
npm run lint
npm run format:check

# Type check
npm run type-check

# Tests with coverage
npx jest --coverage

# Production build
npm run build
```

## CI Pipeline

GitHub Actions runs the full pipeline on every push to `main` and on pull requests targeting `main`:

```
lint → type-check → test → build
```

Each job depends on the previous one. If any job fails, downstream jobs are skipped automatically.

**No GitHub secrets are needed for CI.** The pipeline runs entirely with public actions and npm packages.

Future secrets (e.g., `VERCEL_TOKEN`, deployment credentials) will be added when deploy automation is introduced.

## Branch Protection Rules (Recommended)

Configure the following on the `main` branch in GitHub repository settings:

- **Require status checks to pass before merging** — enable all four CI jobs: `Lint`, `Type Check`, `Test`, `Build`
- **Require branches to be up to date before merging**
- **Require pull request reviews before merging** (at least 1 approval)
- **Do not allow bypassing the above settings**
