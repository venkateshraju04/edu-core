#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/educore-backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

backend_pid=""
frontend_pid=""
backend_ready=""

free_port() {
  local port="$1"
  local pids

  pids="$(lsof -ti tcp:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -z "$pids" ]]; then
    return
  fi

  echo "Stopping existing process(es) on port ${port}: ${pids}"
  kill $pids 2>/dev/null || true
  sleep 1

  pids="$(lsof -ti tcp:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "Force-stopping lingering process(es) on port ${port}: ${pids}"
    kill -9 $pids 2>/dev/null || true
  fi
}

cleanup() {
  if [[ -n "${frontend_pid}" ]] && kill -0 "${frontend_pid}" 2>/dev/null; then
    kill "${frontend_pid}" 2>/dev/null || true
  fi

  if [[ -n "${backend_pid}" ]] && kill -0 "${backend_pid}" 2>/dev/null; then
    kill "${backend_pid}" 2>/dev/null || true
  fi
}

wait_for_backend() {
  local attempts=30

  while (( attempts > 0 )); do
    if curl -fsS "http://127.0.0.1:3001/health" >/dev/null 2>&1; then
      backend_ready="yes"
      return 0
    fi

    if ! kill -0 "$backend_pid" 2>/dev/null; then
      wait "$backend_pid"
    fi

    sleep 1
    attempts=$((attempts - 1))
  done

  return 1
}

trap cleanup EXIT INT TERM

free_port 3001
free_port 5173

echo "Starting EduCore backend on http://localhost:3001"
(cd "$BACKEND_DIR" && npm run dev) &
backend_pid=$!

if ! wait_for_backend; then
  echo "Backend did not become healthy on http://localhost:3001/health"
  wait "$backend_pid"
fi

echo "Starting EduCore frontend on http://localhost:5173"
(cd "$FRONTEND_DIR" && VITE_API_BASE_URL=/api npm run dev -- --host 127.0.0.1 --port 5173 --strictPort) &
frontend_pid=$!

sleep 2

if ! kill -0 "$frontend_pid" 2>/dev/null; then
  wait "$frontend_pid"
fi

echo "Both servers are running. Press Ctrl+C to stop them."

while true; do
  if ! kill -0 "$backend_pid" 2>/dev/null; then
    wait "$backend_pid"
    break
  fi

  if ! kill -0 "$frontend_pid" 2>/dev/null; then
    wait "$frontend_pid"
    break
  fi

  sleep 1
done