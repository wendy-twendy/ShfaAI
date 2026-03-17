#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Kill stale processes on backend/frontend ports
echo "Killing stale processes on ports 8000, 5173, 5174..."
lsof -ti:8000,5173,5174 | xargs kill -9 2>/dev/null && echo "  Killed stale processes." || echo "  No stale processes found."

# Cleanup function to kill child processes on exit
cleanup() {
  echo ""
  echo "Shutting down..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  echo "Done."
  exit 0
}
trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend on http://localhost:8000 ..."
uv run python main.py &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend on http://localhost:5173 ..."
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "Press Ctrl+C to stop both."
echo ""

# Wait for both processes
wait
