#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$root"
frontend_port="${TEST_FRONTEND_PORT:-5174}"
api_base_url="${TEST_API_BASE_URL:-http://127.0.0.1:5187}"
storage="$(mktemp -d /tmp/era-swiata-legend-frontend.XXXXXX)"
frontend_log="$storage/frontend.log"
cleanup() {
  rm -rf "$storage"
}
trap cleanup EXIT

echo "Frontend testowy: http://127.0.0.1:${frontend_port}"
echo "API dla frontendu: ${api_base_url}"
echo "Komenda frontend: npm run dev -- --host 127.0.0.1 --port ${frontend_port} --strictPort"
echo "Log frontend: $frontend_log"

VITE_API_BASE_URL="$api_base_url" \
npm run dev -- --host 127.0.0.1 --port "$frontend_port" --strictPort 2>&1 | tee "$frontend_log"
