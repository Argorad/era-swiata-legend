#!/usr/bin/env bash
set -euo pipefail

: "${TEST_DATABASE_CONNECTION_STRING:?Ustaw TEST_DATABASE_CONNECTION_STRING dla osobnej bazy *_test}"
database="$(printf '%s' "$TEST_DATABASE_CONNECTION_STRING" | tr ';' '\n' | sed -nE 's/^[[:space:]]*(Database|Initial Catalog)[[:space:]]*=[[:space:]]*([^[:space:]]+)[[:space:]]*$/\2/Ip' | tail -1)"
database_lower="${database,,}"
if [[ -z "$database" || "$database_lower" == "eraswiatalegend" || "$database_lower" != *_test ]]; then
  echo "ODMOWA: '$database' nie jest bezpieczną bazą testową zakończoną na _test." >&2
  exit 64
fi

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
api_port="${TEST_API_PORT:-5187}"
frontend_origins="${TEST_FRONTEND_ORIGINS:-http://127.0.0.1:5174;http://localhost:5174}"
bootstrap_login="${TEST_ADMIN_LOGIN:-integration-admin}"
bootstrap_password="${TEST_ADMIN_PASSWORD:-Integration!12345}"
bootstrap_display_name="${TEST_ADMIN_DISPLAY_NAME:-Administrator Integration}"
bootstrap_email="${TEST_ADMIN_EMAIL:-integration-admin@example.invalid}"
storage="$(mktemp -d /tmp/era-swiata-legend-e2e.XXXXXX)"
api_log="$storage/api.log"
api_pid=""
cleanup() {
  if [[ -n "$api_pid" ]]; then kill "$api_pid" 2>/dev/null || true; fi
  rm -rf "$storage"
}
trap cleanup EXIT INT TERM

echo "API testowe: http://127.0.0.1:${api_port}"
echo "Komenda API: dotnet run --no-launch-profile --project $root/backend/EraSwiataLegend.Api/EraSwiataLegend.Api.csproj --urls http://127.0.0.1:${api_port}"
echo "Log API: $api_log"

ASPNETCORE_ENVIRONMENT=Testing \
Authentication__Enabled=true \
BootstrapAdmin__Login="$bootstrap_login" \
BootstrapAdmin__Password="$bootstrap_password" \
BootstrapAdmin__DisplayName="$bootstrap_display_name" \
BootstrapAdmin__Email="$bootstrap_email" \
BootstrapAdmin__MustChangePassword=false \
Frontend__Origins="$frontend_origins" \
ConnectionStrings__DefaultConnection="$TEST_DATABASE_CONNECTION_STRING" \
FileStorage__RootPath="$storage/uploads" \
dotnet run --no-launch-profile --project "$root/backend/EraSwiataLegend.Api/EraSwiataLegend.Api.csproj" --urls "http://127.0.0.1:${api_port}" >"$api_log" 2>&1 &
api_pid=$!

for _ in {1..120}; do
  if curl --fail --silent "http://127.0.0.1:${api_port}/auth/status" >/dev/null; then break; fi
  if ! kill -0 "$api_pid" 2>/dev/null; then cat "$api_log" >&2; exit 1; fi
  sleep 0.5
done

curl --fail --silent "http://127.0.0.1:${api_port}/auth/status" >/dev/null || { cat "$api_log" >&2; exit 1; }
grep -F "Now listening on: http://127.0.0.1:${api_port}" "$api_log" >/dev/null || { cat "$api_log" >&2; exit 1; }
cors_header="$(curl --silent --show-error --dump-header - -o /dev/null -H 'Origin: http://127.0.0.1:5174' "http://127.0.0.1:${api_port}/auth/status" | tr -d '\r' | awk -F': ' 'BEGIN{IGNORECASE=1} /^Access-Control-Allow-Origin:/ {print $2; exit}')"
if [[ "$cors_header" != "http://127.0.0.1:5174" && "$cors_header" != "http://localhost:5174" ]]; then
  cat "$api_log" >&2
  echo "ODMOWA: testowe API nie zwraca poprawnego Access-Control-Allow-Origin dla 127.0.0.1:5174." >&2
  exit 1
fi

wait "$api_pid"
