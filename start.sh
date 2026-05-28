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

if [ ! -d "$ROOT/node_modules" ]; then
  echo "Dependencies are missing. Run: bun install"
  exit 1
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

if [[ "${1:-}" != "--frontend-only" ]]; then
  start_service "backend (@atlas/backend:start:dev)" bun nx run @atlas/backend:start:dev
fi
start_service "frontend (@atlas/frontend:dev)" bun nx run @atlas/frontend:dev

echo ""
if [[ "${1:-}" == "--frontend-only" ]]; then
  echo "Atlas frontend is starting. Press Ctrl+C to stop."
else
  echo "Atlas dev services are starting. Press Ctrl+C to stop both."
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
