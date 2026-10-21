# Falco template validation

Tested on 2026-10-18 with Dokploy `v0.30.8`, Traefik `v3.6.7`, Linux `7.0.0-34-generic`, Docker Engine `29.9.1`, and Docker Compose `5.6.0`, using the exact image tags in this template. Dokploy and the deployment Docker engine ran in a disposable local test environment.

## Checks performed

- Passed `node build-scripts/generate-meta.js --check`, the repository's Compose and TOML validators, and `pnpm build` in `app/`.
- Downloaded the Compose and TOML files from the PR preview and imported their Base64 payload through Dokploy's `compose.import` API. Repeated the import with the corrected template configuration.
- Confirmed that Dokploy generated distinct 64-character hexadecimal UI and Redis passwords and a domain mapped to `falco-ui:2802`. The template uses `${hash:64}` because Dokploy's helper takes a character count; the template repository's local helper has different length semantics.
- Enabled isolated deployments and deployed through Dokploy's `compose.deploy` API. The deployment finished successfully.
- Passed `docker compose config --quiet` with Telegram credentials absent or populated. Empty values for the required monitored hostname and UI and Redis passwords failed with the expected error.
- Started all four services and confirmed Falco opened the syscall source with the modern BPF probe.
- Requested the generated domain through Traefik and received HTTP 200 from the dashboard and health endpoint. The events API returned HTTP 401 without credentials or with an incorrect password, and HTTP 200 with the generated credentials.
- Logged in through Traefik using Chrome and the generated UI credentials, opened the Events tab, and observed a newly triggered container-shell event. No JavaScript errors occurred after authentication.
- Confirmed Redis returned `NOAUTH` without a password and `PONG` with its configured password. Its module list contained exactly RediSearch and RedisJSON; startup no longer logged errors for the unused RedisGears/RedisAI integration.
- Sent synthetic Notice and Informational events to Falcosidekick. Both appeared in the UI; only Notice reached a local mock Telegram API at the default `notice` threshold.
- Confirmed stored events had a seven-day TTL and remained searchable after stopping and starting the stack through Dokploy. The generated credentials and domain routing continued to work.
- Started a disposable container with a terminal shell. Falco detected the real **Terminal shell in container** event, and it reached both the UI and mock Telegram API with the configured hostname.
- Confirmed all four services stayed running with zero automatic restarts, used Dokploy's isolated network, and published no host ports. Falco's host bind mounts remained read-only.
- Checked service logs for unexpected runtime errors. Incorrect-password checks deliberately produced authentication errors in the UI log.

The Dokploy test added a temporary `TELEGRAM_HOST` override to Falcosidekick to reach a local mock Telegram API. This override is not part of the template. The earlier standalone Compose test used temporary localhost port bindings; the Dokploy deployment published no service ports and was accessed through Traefik. No real Telegram credentials or chat were used.

Delivery to the real Telegram API and public HTTPS certificate issuance have not been verified.

In a fresh browser session, the upstream UI probes `/api/v1/auth` before login and receives HTTP 401, which it logs as an Axios error. It also requests a missing `/img/icons/favicon-32x32.png` and receives HTTP 404. These upstream UI behaviors did not prevent login, dashboard rendering, or event display.

## Optional Telegram checks

After making Telegram optional, repeated the following checks directly with Docker Compose and the same pinned images:

| Telegram credentials | Result |
| --- | --- |
| Both variables unset | All four services start; a real container-shell event reaches the UI; no Telegram output or requests. |
| Both values empty | Telegram stays disabled; events reach the UI without errors. |
| Bot token only | Telegram stays disabled; events reach the UI without errors. |
| Chat ID only | Telegram stays disabled; events reach the UI without errors. |
| Both values set | Telegram is enabled; Notice events reach the mock API and Informational events are filtered from Telegram while remaining visible in the UI. |

Removed both credentials after enabling Telegram and confirmed it disabled cleanly. Stopped and started the stack with Telegram absent, then confirmed the real and synthetic events remained visible, Redis was healthy, and all four services were running with zero automatic restarts. Temporary test resources were removed after validation.

## Repeat the deployment checks in Dokploy

1. Import the template from the PR preview, enable isolated deployments, and fill in the required values described in `instructions.md`.
2. Deploy and confirm that all four containers stay running, Redis is healthy, and the Falco logs show the modern BPF probe opening the syscall source.
3. Open the assigned UI domain and log in with the generated credentials.
4. Follow the container-shell check in `instructions.md`. Confirm the event appears in Falco's logs and the dashboard with the configured hostname. Check the Telegram chat if Telegram is configured.
5. Stop and start the Compose service without deleting its volume. Confirm the event remains visible and the generated credentials still work.
6. Optionally configure both Telegram credentials, redeploy, and repeat the event check to verify Telegram delivery.
