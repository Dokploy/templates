#!/usr/bin/env bash
# Run against a disposable deployment that allows public signup.
set -euo pipefail

origin=${RAKAZO_SMOKE_URL:?Set the deployment URL}
email=${RAKAZO_SMOKE_EMAIL:?Set a test email}
password=${RAKAZO_SMOKE_PASSWORD:?Set a test password}
phase=${1:-register}
if [[ "$phase" != register && "$phase" != sign-in ]]; then
  printf 'Usage: %s [register|sign-in]\n' "$0" >&2
  exit 2
fi

request() {
  curl --fail --silent --show-error --max-time 20 "$@"
}

check_account() {
  request --json @- --header "Origin: $origin" "$origin/api/auth/$1/email" |
    jq -e --arg email "$email" '.user.email == $email' >/dev/null
}

request "$origin/" >/dev/null
account=$(jq -n --arg email "$email" --arg password "$password" '{email:$email,password:$password}')
if [[ "$phase" == register ]]; then
  jq '. + {name:"Smoke Test"}' <<<"$account" | check_account sign-up
fi
check_account sign-in <<<"$account"
printf 'Rakazo routed requests and signed in the test account.\n'
