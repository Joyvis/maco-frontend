# E2E Testing

## How to run

```bash
npm run test:e2e:local
```

**Prerequisites:** Docker installed and running; `maco-backend` checked out as a sibling directory of `maco-frontend` (i.e. `../maco-backend` must exist).

The orchestrator script (`e2e/run-local.sh`):

1. Boots Postgres via Docker Compose
2. Builds the backend image and starts the container
3. Builds the frontend in production mode and starts it on port 4000
4. Runs the Playwright suite
5. Tears everything down — including the Postgres volume — on exit

Use the `--reuse-db` flag to skip the volume teardown for faster iteration:

```bash
npm run test:e2e:local -- --reuse-db
```

> Specs are only expected to be idempotent in `--reuse-db` mode. A clean run always drops the DB volume so sign-up bootstrap succeeds every time (required for T2+).

## Where to put a new spec

```
e2e/<bounded-context>/<action>.spec.ts
```

Examples:

- `e2e/auth/login.spec.ts`
- `e2e/tenancy/create-tenant.spec.ts`

## Selectors

Target elements via `getByTestId`. Every interactive element must carry a `data-testid` attribute:

```
data-testid="<feature>-<element>"
```

Examples: `login-email-input`, `signup-submit-button`.

Add the `data-testid` when you add the feature, not after.

## Auth bootstrap

`globalSetup` will (after T2) use the sign-up flow to create a known tenant + admin once per run, saving cookies to `e2e/.auth/admin.json`. Specs that need an authenticated page import and use the `authedPage` fixture from `e2e/fixtures`:

```ts
import { test, expect } from '../fixtures';

test('protected page', async ({ authedPage }) => { ... });
```

Specs that test auth itself (signup, login) use the default `page` fixture and skip the auth bootstrap.

## When to add a spec

- Every new tenancy-action ticket gets a sibling e2e ticket.
- Bug-fix PRs add a regression spec covering the broken behavior.

## Browser support

Chromium only. Cross-browser testing is deferred.

## Sibling-path assumption

`e2e/run-local.sh` assumes `../maco-backend` exists relative to the repo root. If the path differs on your machine, export `BACKEND_DIR` before running. CI integration is a separate follow-up.
