# Falco template validation

Tested locally on 2026-10-18 with Linux `7.0.0-34-generic`, Docker Engine `29.9.1`, and Docker Compose `5.6.0`, using the exact image tags in this template.

## Checks performed

- Passed `node build-scripts/generate-meta.js --check`, the repository's Compose and TOML validators, and `pnpm build` in `app/`.
- Confirmed the generated catalog includes Falco, its logo, setup instructions, and a valid Base64 import payload.
- Processed `template.toml` with the repository's variable helpers. The UI and Redis passwords were distinct 64-character hexadecimal strings, and the domain mapped to `falco-ui:2802`.
- Passed `docker compose config --quiet` with populated environment values. Empty values for each required hostname, Telegram credential, and password failed with the expected error.
- Started all four services and confirmed Falco opened the syscall source with the modern BPF probe.
- Received HTTP 200 from the dashboard and health endpoint. The events API returned HTTP 401 without credentials and HTTP 200 with the generated credentials.
- Confirmed Redis returned `NOAUTH` without a password and `PONG` with its configured password.
- Sent synthetic Notice and Informational events to Falcosidekick. Both appeared in the UI; only Notice reached a local mock Telegram API at the default `notice` threshold.
- Confirmed stored events had a seven-day TTL and remained searchable after stopping and starting the stack.
- Started a disposable container with a terminal shell. Falco detected the real **Terminal shell in container** event, and it reached both the UI and mock Telegram API with the configured hostname.
- Removed the test containers, network, and volume after validation.

The local test used temporary ports bound to `127.0.0.1` to inspect the services and overrode `TELEGRAM_HOST` to reach the mock API. These overrides are not part of the template. No real Telegram credentials or chat were used.

Import and deployment through a Dokploy instance, Traefik routing, and delivery to the real Telegram API have not been verified.

## Repeat the deployment checks in Dokploy

1. Import the template from the PR preview, enable isolated deployments, and fill in the required values described in `instructions.md`.
2. Deploy and confirm that all four containers stay running, Redis is healthy, and the Falco logs show the modern BPF probe opening the syscall source.
3. Open the assigned UI domain and log in with the generated credentials.
4. Follow the container-shell check in `instructions.md`. Confirm the event appears in Falco's logs, the dashboard, and your Telegram chat with the configured hostname.
5. Stop and start the Compose service without deleting its volume. Confirm the event remains visible and the generated credentials still work.
