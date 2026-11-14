# Evolution API — Almog Cohen fork

Dokploy template for the unofficial [Almog Cohen Evolution API fork](https://github.com/AlmogCohen/evolution-api), pinned to commit [`316448a`](https://github.com/AlmogCohen/evolution-api/commit/316448a3c23f9361e0ac82efadb6113651ea2521) on the `fork/2.3.7` line. Dokploy builds the API image from that public Git commit; no unpublished GHCR image is required. PostgreSQL and Redis are included, and API instances, database data, and Redis data use persistent named volumes.

## Deployment notes

- The API receives the public Dokploy domain on port `8080`; PostgreSQL and Redis remain private to the Compose project.
- The first deployment builds the API from source, so it takes longer than pulling a prebuilt image.
- Dokploy generates the API key and database password at import. Keep the API key private; use it in the `apikey` request header when authenticating API calls.
- This is an unofficial community fork and is not endorsed by Evolution Foundation.

## After deployment

1. Check the `almog-evolution-api` service logs and wait for its database migrations and startup to complete.
2. Open the generated domain and review the API documentation.
3. Use the generated `AUTHENTICATION_API_KEY` from the service environment for authenticated API requests.
4. Configure external integrations only when needed; the template leaves optional integrations disabled by default.

## Persistence

The `instances`, `postgres_data`, and `redis_data` volumes survive container recreation. Back them up before upgrades or migrations.
