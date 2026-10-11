# Langfuse

Self-hosted Langfuse: open-source LLM tracing, prompt management, evaluation and cost/usage analytics, based on the official `docker-compose.yml`.

## Two domains

This template exposes two domains:

- The **main domain** serves the Langfuse web app/API (`langfuse-web`, port 3000).
- The **second domain** exposes MinIO's S3 API (port 9000) directly. Langfuse's web UI generates presigned URLs for media (e.g. images attached to traces) that the *browser* fetches straight from MinIO, so this endpoint has to be publicly reachable — it isn't just an internal implementation detail.

## First boot

`langfuse-web` and `langfuse-worker` wait on Postgres, ClickHouse, Redis and MinIO to report healthy, then run their own migrations on startup. Once `langfuse-web` is up, open its domain and create the first user — they become the owner of the initial organization.

## After enabling HTTPS

By default `NEXTAUTH_URL` and `LANGFUSE_S3_MEDIA_PUBLIC_ENDPOINT` are set to `http://`. If you enable HTTPS on either domain (recommended for production), update the matching environment variable to `https://<domain>` and redeploy, otherwise auth callbacks and media URLs will point at the wrong scheme.

## Licensing

The core of Langfuse (tracing, prompt management, evaluation, playground) is open-source (MIT) and fully usable self-hosted without a license key. Some enterprise-only features (e.g. SSO/SAML, fine-grained RBAC) live under a separate commercial license — see [self-hosting license docs](https://langfuse.com/self-hosting/license-key). This template does not configure a license key.

## Versioning

Images are pinned to the `4` major tag (`langfuse/langfuse:4`, `langfuse/langfuse-worker:4`), matching the upstream compose file. To pin to a specific release instead, replace `4` with a version tag from [Docker Hub](https://hub.docker.com/r/langfuse/langfuse/tags).
