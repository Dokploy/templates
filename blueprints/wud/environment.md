# Environment variables

This template targets WUD **9.5.0**. Provider settings are read from the environment at startup; add optional values in Dokploy's Environment tab and redeploy. The optional `.env` file forwards additional WUD settings without requiring a Compose edit. Values explicitly set in Compose take precedence over `.env`.

## Required administrator settings

| Variable | Template value | Purpose |
| --- | --- | --- |
| `WUD_AUTH_ADMIN_USER` | `admin` | Local administrator username; editable. |
| `WUD_AUTH_ADMIN_PASSWORD` | Generated random hexadecimal string | Required by this template. Plaintext bootstrap input; WUD stores a bcrypt hash. Reapplied to this account on **every startup**. Rotate it here rather than only in the UI. |

No provider credential or separate session secret is required. Upstream also supports `WUD_AUTH_ADMIN_HASH`, legacy `WUD_AUTH_BASIC_*`, and OIDC; those are alternative authentication designs, not additional installation requirements. Do not set a conflicting admin hash alongside this template's password. See [authentication](https://getwud.app/docs/configuration/authentications/).

## Editable defaults

| Variable | Template value | Purpose |
| --- | --- | --- |
| `WUD_WATCHER_DOCKER_LOCAL_WATCHBYDEFAULT` | `true` | Monitor running containers unless filtered or labeled `wud.watch=false`. Set `false` for explicit opt-in labels. |
| `WUD_WATCHER_DOCKER_LOCAL_WATCHALL` | `false` | Set `true` to include stopped containers. |
| `WUD_WATCHER_DOCKER_LOCAL_CRON` | `0 * * * *` | Hourly scan in `TZ`; upstream adds up to 60 seconds of random jitter. |
| `WUD_LOG_LEVEL` | `info` | `trace`, `debug`, `info`, `warn`, `error`, or `fatal`. |
| `TZ` | `UTC` | Time zone for cron and timestamps, for example `Europe/Paris`. |

## Fixed service settings

These values are set in Compose. Change them there only as part of a coordinated customization.

| Variable | Value | Reason |
| --- | --- | --- |
| `WUD_WATCHER_DOCKER_LOCAL_HOST` | `wud-socket-proxy` | Keeps the Docker socket out of the WUD container. |
| `WUD_WATCHER_DOCKER_LOCAL_PORT` | `2375` | Private proxy port, never published. |
| `WUD_WATCHER_DOCKER_LOCAL_WATCHATSTART` | `true` | Enables startup discovery when the stored container list is empty. For a populated store, use the watch action or scheduled scan. |
| `WUD_SERVER_PORT` | `3000` | Matches the Dokploy domain and health check. |
| `WUD_SERVER_TLS_ENABLED` | `false` | Traefik handles public HTTPS. |
| `WUD_STORE_PATH` | `/store` | Persistent volume target. |
| `WUD_STORE_FILE` | `wud.sqlite` | SQLite database filename. |
| `WUD_LOG_FORMAT` | `json` | Structured logs and direct Node process startup. |

The socket proxy permits `CONTAINERS=1`, `IMAGES=1`, `EVENTS=1`, `PING=1`, and `VERSION=1`. `POST=0` blocks write methods; other API sections retain their denied defaults. These are fixed proxy service settings, not WUD environment variables. See [Docker Socket Proxy](https://github.com/Tecnativa/docker-socket-proxy).

## Optional application and provider settings

WUD's provider names are dynamic. For example, `LOCAL` identifies this template's Docker watcher and `ALERTS` can identify a notification trigger. The following are optional; use the linked official schemas for the fields of the providers you actually enable.

| Variable or family | Default / use | Documentation |
| --- | --- | --- |
| `WUD_WATCHER_DOCKER_LOCAL_INCLUDE`, `WUD_WATCHER_DOCKER_LOCAL_EXCLUDE` | Unset; container-name or `label:` regular expressions. Explicit `wud.watch` labels take precedence. | [Docker watcher](https://getwud.app/docs/configuration/watchers/) |
| `WUD_WATCHER_DOCKER_LOCAL_WATCHEVENTS` | `true`; follows lifecycle events. | [Docker watcher](https://getwud.app/docs/configuration/watchers/) |
| `WUD_WATCHER_DOCKER_LOCAL_JITTER` | `60000` milliseconds; random scan delay. | [Docker watcher](https://getwud.app/docs/configuration/watchers/) |
| `WUD_REGISTRY_{TYPE}_{NAME}_*` | Optional private-registry credentials and registry-specific options. Public images can use anonymous access, subject to rate limits. | [Registries](https://getwud.app/docs/configuration/registries/) |
| `WUD_TRIGGER_{TYPE}_{NAME}_*` | Optional notification provider settings. Required credentials depend on the chosen provider. No triggers are configured by default. | [Triggers](https://getwud.app/docs/configuration/triggers/) |
| `WUD_AUTH_OIDC_{NAME}_*` | Optional SSO provider settings; issuer/client credentials and group mapping depend on the provider. | [OIDC](https://getwud.app/docs/configuration/authentications/oidc/) |
| `WUD_PUBLIC_URL` | Inferred from the request; set to your canonical HTTPS URL if needed for links or SSO. | [Authentication](https://getwud.app/docs/configuration/authentications/) |
| `WUD_SERVER_FEATURE_DELETE` | Upstream `true`; allows deleting a tracked record from WUD, not deleting its Docker container. | [Server](https://getwud.app/docs/configuration/server/) |
| `WUD_SERVER_CORS_ENABLED` | `false`; keep disabled for the normal same-origin dashboard. | [Server](https://getwud.app/docs/configuration/server/) |
| `WUD_SERVER_BASEPATH` | `/`; use a dedicated Dokploy domain with this template. | [Server](https://getwud.app/docs/configuration/server/) |
| `WUD_SERVER_ENABLED` | `true`; leave enabled for the dashboard and health check. | [Server](https://getwud.app/docs/configuration/server/) |
| `WUD_RUN_MODE` | `server`; leave unchanged. `oneshot` is a separate CLI deployment mode. | [Configuration](https://getwud.app/docs/configuration/) |
| `HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY` | Unset; optional outbound proxy. Include `wud-socket-proxy,localhost,127.0.0.1` in `NO_PROXY` when enabling a proxy. | [Proxy settings](https://getwud.app/docs/configuration/#proxy--tls-configuration) |
| `NODE_EXTRA_CA_CERTS` | Optional path to a mounted PEM CA bundle for private registries/proxies. | [Proxy settings](https://getwud.app/docs/configuration/#proxy--tls-configuration) |

WUD supports `WUD_*__FILE` secret references. Mount a readable secret file and point the corresponding variable at its container path; adding a path alone does not create the file. The file value is read and trimmed at startup. This is an advanced alternative to storing a value directly in Dokploy's Environment tab.

Per-container `wud.*` labels are not environment variables. Configure tag inclusion/exclusion and digest tracking on each monitored application; see the [labels guide](https://getwud.app/docs/configuration/watchers/labels/). In Compose, escape a literal dollar sign as `$$` where interpolation would otherwise occur. No `PUID`/`PGID` or database credentials are needed by the official WUD image.
