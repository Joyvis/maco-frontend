#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$REPO_ROOT/../maco-backend"
DOCKER_COMPOSE_FILE="$BACKEND_DIR/.devcontainer/docker-compose.yml"

if [[ ! -d "$BACKEND_DIR" ]]; then
  echo "ERROR: $BACKEND_DIR not found." >&2
  echo "Please checkout maco-backend as a sibling of maco-frontend (i.e. ../maco-backend)." >&2
  exit 1
fi

FRONTEND_PID=""
REUSE_DB=false

for arg in "$@"; do
  if [[ "$arg" == "--reuse-db" ]]; then
    REUSE_DB=true
  fi
done

cleanup() {
  echo "--- Teardown ---"
  if [[ -n "$FRONTEND_PID" ]]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  docker stop maco-backend-e2e 2>/dev/null || true
  docker rm maco-backend-e2e 2>/dev/null || true
  if [[ "$REUSE_DB" == false ]]; then
    docker compose -f "$DOCKER_COMPOSE_FILE" down -v
  else
    docker compose -f "$DOCKER_COMPOSE_FILE" down
    echo "--- Kept DB volume (--reuse-db) ---"
  fi
}
trap cleanup EXIT INT TERM

# 1. Boot postgres
echo "--- Starting postgres ---"
docker compose -f "$DOCKER_COMPOSE_FILE" up -d db

# 2. Wait for postgres ready (~30s)
echo "--- Waiting for postgres ---"
timeout=30
elapsed=0
until docker compose -f "$DOCKER_COMPOSE_FILE" exec -T db pg_isready -q 2>/dev/null; do
  if [[ $elapsed -ge $timeout ]]; then
    echo "ERROR: Postgres did not become ready in ${timeout}s" >&2
    exit 1
  fi
  sleep 1
  elapsed=$((elapsed + 1))
done
echo "Postgres ready."

# 3. Build backend image
echo "--- Building backend image ---"
docker build -f "$BACKEND_DIR/Dockerfile" --target production -t maco-backend:e2e "$BACKEND_DIR"

# 4. Run migrations — blocked on MACO-12/MACO-14
echo "--- TODO: Run backend migrations (blocked on MACO-12/MACO-14) ---"

# 5. Start backend container
echo "--- Starting backend container ---"
docker run -d \
  --name maco-backend-e2e \
  --network host \
  -e DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/maco}" \
  -e JWT_SECRET="${JWT_SECRET:-e2e-jwt-secret-change-in-prod}" \
  -e JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-e2e-jwt-refresh-secret-change-in-prod}" \
  maco-backend:e2e

# 6. Wait for backend ready (~30s)
echo "--- Waiting for backend ---"
timeout=30
elapsed=0
until curl -sf http://localhost:3000/ >/dev/null 2>&1; do
  if [[ $elapsed -ge $timeout ]]; then
    echo "ERROR: Backend did not become ready in ${timeout}s" >&2
    exit 1
  fi
  sleep 1
  elapsed=$((elapsed + 1))
done
echo "Backend ready."

# 7. Build and start frontend on port 4000
echo "--- Building frontend ---"
cd "$REPO_ROOT"
npm run build

echo "--- Starting frontend on port 4000 ---"
PORT=4000 npm run start &
FRONTEND_PID=$!

# 8. Wait for frontend ready (~60s)
echo "--- Waiting for frontend ---"
timeout=60
elapsed=0
until curl -sf http://localhost:4000/ >/dev/null 2>&1; do
  if [[ $elapsed -ge $timeout ]]; then
    echo "ERROR: Frontend did not become ready in ${timeout}s" >&2
    exit 1
  fi
  sleep 1
  elapsed=$((elapsed + 1))
done
echo "Frontend ready."

# 9. Run Playwright tests (forward all args except --reuse-db)
PLAYWRIGHT_ARGS=()
for arg in "$@"; do
  if [[ "$arg" != "--reuse-db" ]]; then
    PLAYWRIGHT_ARGS+=("$arg")
  fi
done

echo "--- Running Playwright tests ---"
E2E_BASE_URL=http://localhost:4000 npx playwright test "${PLAYWRIGHT_ARGS[@]}"
