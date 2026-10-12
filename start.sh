#!/bin/sh
set -eu

vision_pid=
llm_pid=
api_pid=

shutdown() {
  for pid in "$api_pid" "$llm_pid" "$vision_pid"; do
    if [ -n "$pid" ]; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  for pid in "$api_pid" "$llm_pid" "$vision_pid"; do
    if [ -n "$pid" ]; then
      wait "$pid" 2>/dev/null || true
    fi
  done
}
trap shutdown EXIT INT TERM

wait_for_health() {
  service_name=$1
  service_url=$2
  service_pid=$3

  attempt=0
  while [ "$attempt" -lt 90 ]; do
    if ! kill -0 "$service_pid" 2>/dev/null; then
      echo "[BoardSnap] $service_name stopped before becoming healthy" >&2
      return 1
    fi
    if python -c "import urllib.request; urllib.request.urlopen('$service_url', timeout=2)" >/dev/null 2>&1; then
      echo "[BoardSnap] $service_name is healthy"
      return 0
    fi
    attempt=$((attempt + 1))
    sleep 2
  done

  echo "[BoardSnap] Timed out waiting for $service_name at $service_url" >&2
  return 1
}

cd /home/user/app/vision
python -m uvicorn main:app --host 127.0.0.1 --port 8000 &
vision_pid=$!
wait_for_health "Vision service" "http://127.0.0.1:8000/health" "$vision_pid"

cd /home/user/app/llm
python -m uvicorn main:app --host 127.0.0.1 --port 8001 &
llm_pid=$!
wait_for_health "LLM service" "http://127.0.0.1:8001/health" "$llm_pid"

cd /home/user/app/backend
node server.js &
api_pid=$!
wait "$api_pid"
