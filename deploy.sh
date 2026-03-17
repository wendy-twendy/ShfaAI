#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Load .env (export NGROK_AUTHTOKEN and other vars)
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

if [ -z "$NGROK_AUTHTOKEN" ]; then
  echo "Error: NGROK_AUTHTOKEN not set. Add it to .env or export it."
  exit 1
fi

# Kill stale processes
echo "Killing stale processes on port 8000..."
lsof -ti:8000 | xargs kill -9 2>/dev/null && echo "  Killed." || echo "  None found."

# Cleanup on exit
cleanup() {
  echo ""
  echo "Shutting down..."
  kill "$BACKEND_PID" 2>/dev/null
  wait "$BACKEND_PID" 2>/dev/null
  echo "Done."
  exit 0
}
trap cleanup SIGINT SIGTERM

# Build frontend
echo "Building frontend..."
(cd frontend && npm run build)
echo "Frontend built to frontend/dist/"

# Start backend (serves API + built frontend)
echo "Starting backend on http://localhost:8000 ..."
uv run python main.py &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for backend..."
for i in $(seq 1 30); do
  if curl -s http://localhost:8000/api/settings > /dev/null 2>&1; then
    echo "Backend is ready."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "Error: Backend did not start in time."
    kill "$BACKEND_PID" 2>/dev/null
    exit 1
  fi
  sleep 1
done

# Start ngrok
echo ""
echo "Starting ngrok tunnel..."
echo "Press Ctrl+C to stop."
echo ""
ngrok http 8000
