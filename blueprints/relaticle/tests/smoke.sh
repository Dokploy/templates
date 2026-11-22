#!/usr/bin/env bash
# Boots the template with Docker Compose, checks every service is healthy and the app answers, then removes it.
# Usage: bash blueprints/relaticle/tests/smoke.sh (set PORT to change the default 18080)
set -euo pipefail

cd "$(dirname "$0")/.."

port="${PORT:-18080}"
project="relaticle-smoke-$$"
override="$(mktemp)"

APP_KEY="base64:$(openssl rand -base64 32)"
DB_PASSWORD="$(openssl rand -hex 16)"
APP_URL="http://localhost:${port}"
export APP_KEY DB_PASSWORD APP_URL

cat > "$override" <<EOF
services:
  relaticle:
    ports:
      - "127.0.0.1:${port}:8080"
EOF

compose() {
    docker compose -p "$project" -f docker-compose.yml -f "$override" "$@"
}

cleanup() {
    compose down -v --remove-orphans >/dev/null 2>&1 || true
    rm -f "$override"
}
trap cleanup EXIT

fail() {
    echo "FAIL: $1" >&2
    compose ps >&2 || true
    exit 1
}

compose up -d --wait --wait-timeout 600

healthy="$(compose ps --format '{{.Health}}' | grep -c '^healthy$' || true)"
[ "$healthy" -eq 6 ] || fail "expected 6 healthy services, got ${healthy}"
echo "ok: 6 of 6 services healthy"

status="$(curl -s -o /dev/null -w '%{http_code}' "${APP_URL}/up")"
[ "$status" = "200" ] || fail "/up returned ${status}"
echo "ok: /up returned 200"

location="$(curl -s -o /dev/null -w '%{redirect_url}' "${APP_URL}/")"
[ "$location" = "${APP_URL}/app" ] || fail "/ redirected to '${location}', expected ${APP_URL}/app"
echo "ok: / redirects to /app"

status="$(curl -s -o /dev/null -w '%{http_code}' "${APP_URL}/app/login")"
[ "$status" = "200" ] || fail "/app/login returned ${status}"
echo "ok: /app/login returned 200"

echo "PASS"
