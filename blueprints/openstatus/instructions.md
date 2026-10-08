# OpenStatus

OpenStatus is deployed here in self-hosted mode following the official Docker
setup (`DOCKER.md` / `docker-compose.github-packages.yaml` upstream), with all
app images pinned to the same upstream commit (`e1a9825`).

## Services

| Service | Purpose |
|---|---|
| dashboard | Admin UI (your first domain) |
| status-page | Public status pages (your second domain, pages served at `/<slug>`) |
| server | API backend (tRPC / public API) |
| workflows | Background jobs / alerting |
| libsql | Local libSQL (Turso) database — no cloud account needed |
| db-migrate | One-shot migration runner (built from the pinned upstream commit, exits after applying) |
| private-location | Ingest server that receives check results from your monitoring probes |

Database migrations run automatically on every deploy (the one-shot
`db-migrate` service is idempotent).

Note: `db-migrate` is built from source (upstream publishes no image for it),
so the first deployment takes a few extra minutes while it builds.

## First login

1. Open the dashboard domain and choose **magic link** login with your e-mail.
2. If you did not configure `RESEND_API_KEY`, the magic link is not e-mailed —
   it is printed to the **dashboard service logs**. Open the dashboard
   container logs in Dokploy and copy the `>>> Magic Link: ...` URL into your
   browser. If the printed link starts with `http://0.0.0.0:3000`, replace that
   host with your dashboard domain before opening it. (Optionally, once HTTPS
   is enabled on your dashboard domain, you can add
   `AUTH_URL=https://<your-dashboard-domain>` to the dashboard service in the
   compose file so links are generated with the right host — do not set it to
   an empty value or a plain-HTTP domain, as that breaks the auth flow.)
3. Create a workspace and a status page with a slug; it becomes available at
   `https://<status-page-domain>/<slug>`.

## Running checks (probes)

Self-hosted OpenStatus runs monitors through **private location probes**
(`ghcr.io/openstatushq/private-location`) that you deploy wherever you want to
monitor from. Point the probe at this stack's ingest server:

- Expose the `private-location` service (port 8080) on a domain in Dokploy, and
- set `OPENSTATUS_INGEST_URL` on the probe to that URL, together with the
  `OPENSTATUS_KEY` you create in the dashboard.

See the upstream guide: https://www.openstatus.dev/docs (Guides → How to
Self-Host openstatus).

## Analytics (optional)

Tinybird analytics are disabled by default (`TINYBIRD_NOOP=true`), so charts
show no data but everything else works. To enable analytics, run a Tinybird
Local container or use Tinybird Cloud, deploy the `packages/tinybird` project
with the `tb` CLI, and set `TINYBIRD_URL` / `TINYBIRD_TOKEN` in the
environment (plus `TINY_BIRD_API_KEY` and remove `TINYBIRD_NOOP`) — see the
upstream self-hosting guide.
