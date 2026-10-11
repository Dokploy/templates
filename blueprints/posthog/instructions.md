# PostHog

Self-hosted PostHog based on the official "hobby" deployment, trimmed to run on a single server.

## Requirements

- **RAM: at least 8 GB free** is strongly recommended (the stack runs Django, a Celery worker, two Node plugin-server processes, ClickHouse, Redpanda/Kafka, Postgres, Redis, MinIO and several small Rust services).
- ~15 GB of free disk for the images and data volumes.

## First boot

The first deployment takes **5-10 minutes**: an init container fetches the ClickHouse configuration and the GeoIP database, and the `web` service runs all Postgres and ClickHouse migrations before it starts serving. Watch the `web` service logs; once you see the Unit server start, open the domain and create the first account.

## After enabling HTTPS

If you serve PostHog over HTTPS (recommended for production), update these environment variables and redeploy:

- `POSTHOG_SITE_URL` to `https://<your-domain>` (otherwise logins/CSRF and SDK snippets point at the wrong scheme)
- `POSTHOG_SECURE_COOKIES` to `true` (marks session/CSRF cookies as Secure; the default `false` is what allows logging in over the initial plain-HTTP domain)

## What is not included

Compared to the full upstream hobby stack, this template omits Temporal + Elasticsearch (data warehouse / batch exports), browserless (dashboard image exports and heatmap screenshots), and the error-tracking/logs/traces ingestion pipelines. Product analytics, feature flags, experiments, surveys, session replay, live events and the CDP destinations pipeline all work.

## Versioning

PostHog no longer publishes tagged releases; images are pinned to a tested master commit via the `POSTHOG_VERSION` and `POSTHOG_NODE_VERSION` environment variables. To upgrade, set `POSTHOG_VERSION` to a newer commit sha of `posthog/posthog` (Docker Hub tag) and redeploy.
