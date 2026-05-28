#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
if [ -d "$BUN_INSTALL/bin" ]; then
  export PATH="$BUN_INSTALL/bin:$PATH"
fi

if ! command -v bun >/dev/null 2>&1; then
  echo "Bun is required but was not found on PATH."
  echo "Install Bun or add $BUN_INSTALL/bin to PATH, then rerun ./start.sh."
  exit 1
fi

cd "$ROOT"

START_BACKEND=true
if [[ "${1:-}" == "--frontend-only" ]]; then
  START_BACKEND=false
fi

# This script runs multiple Nx tasks as background jobs and owns their output.
# Keep Nx on plain streaming output so it does not try to claim the terminal.
export NX_TUI=false
export NX_DEFAULT_OUTPUT_STYLE=stream
export NX_TASKS_RUNNER_DYNAMIC_OUTPUT=false
export NX_NATIVE_COMMAND_RUNNER=false

if [ ! -d "$ROOT/node_modules" ]; then
  echo "Dependencies are missing. Run: bun install"
  exit 1
fi

load_env_file() {
  local env_file="$1"

  set -a
  # shellcheck disable=SC1090
  . "$env_file"
  set +a
}

load_env_defaults() {
  local env_file="$1"
  local key line value

  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      "" | \#*) continue ;;
    esac

    line="${line#export }"
    key="${line%%=*}"
    value="${line#*=}"
    value="${value%$'\r'}"

    if [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] && [ -z "${!key+x}" ]; then
      if [[ "$value" == \"*\" && "$value" == *\" ]]; then
        value="${value:1:${#value}-2}"
      elif [[ "$value" == \'*\' && "$value" == *\' ]]; then
        value="${value:1:${#value}-2}"
      fi

      export "$key=$value"
    fi
  done < "$env_file"
}

load_backend_env() {
  local backend_env="$ROOT/projects/backend/.env"
  local backend_env_example="$ROOT/projects/backend/.env.example"

  if [ -f "$backend_env" ]; then
    load_env_file "$backend_env"
  elif [ -f "$backend_env_example" ]; then
    load_env_defaults "$backend_env_example"
  fi

  if [ -z "${DATABASE_URL:-}" ]; then
    echo "DATABASE_URL is missing. Create projects/backend/.env or export DATABASE_URL."
    exit 1
  fi
}

start_database() {
  case "${DATABASE_URL:-}" in
    *localhost:5432* | *127.0.0.1:5432*) ;;
    *) return ;;
  esac

  if [[ "${ATLAS_SKIP_DB:-}" == "1" ]]; then
    return
  fi

  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is not available. Start Postgres for $DATABASE_URL, or set ATLAS_SKIP_DB=1."
    exit 1
  fi

  echo "Starting database (atlas-postgres via Docker Compose)..."
  if ! docker compose up -d atlas-postgres; then
    echo "Unable to start atlas-postgres with Docker Compose."
    exit 1
  fi

  for _ in {1..30}; do
    if docker compose exec -T atlas-postgres pg_isready -U atlas -d atlas_imports >/dev/null 2>&1; then
      return
    fi

    sleep 1
  done

  echo "atlas-postgres did not become ready in time."
  exit 1
}

if [[ "$START_BACKEND" == "true" ]]; then
  load_backend_env
  start_database
fi

PIDS=""

cleanup() {
  status=$?
  trap - EXIT INT TERM

  if [ -n "$PIDS" ]; then
    echo ""
    echo "Stopping services..."
    for pid in $PIDS; do
      kill "$pid" 2>/dev/null || true
    done
    wait $PIDS 2>/dev/null || true
  fi

  exit "$status"
}

start_service() {
  name="$1"
  shift

  echo "Starting $name..."
  "$@" &
  PIDS="$PIDS $!"
}

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

if [[ "$START_BACKEND" == "true" ]]; then
  start_service "backend (@atlas/backend:start:dev)" bun nx run @atlas/backend:start:dev --outputStyle=stream
fi
start_service "frontend (@atlas/frontend:dev)" bun nx run @atlas/frontend:dev --outputStyle=stream

echo ""
if [[ "$START_BACKEND" == "false" ]]; then
  echo "Atlas frontend is starting. Press Ctrl+C to stop."
else
  echo "Atlas dev services are starting. Press Ctrl+C to stop backend and frontend."
fi

while :; do
  for pid in $PIDS; do
    if ! kill -0 "$pid" 2>/dev/null; then
      set +e
      wait "$pid"
      status=$?
      set -e
      exit "$status"
    fi
  done
  sleep 1
done
