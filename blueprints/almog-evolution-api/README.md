# Evolution API — Almog Cohen fork

Dokploy template for the unofficial [Almog Cohen Evolution API fork](https://github.com/AlmogCohen/evolution-api), based on the `fork/2.3.7` line. It deploys the API with PostgreSQL and Redis and persists API instances, database data, and Redis data in named volumes.

## Deployment notes

- The API receives the public Dokploy domain on port `8080`; PostgreSQL and Redis are private to the Compose project.
- Dokploy generates the API key and database password at import. Keep the API key private; use it in the `apikey` request header when authenticating API calls.
- The image reference is `ghcr.io/almogcohen/evolution-api:2.3.7`. The upstream fork repository does not publish an image under this name as far as this template verifies. Before deploying, the owner/maintainer must publish the fork image to that registry/tag, or update `docker-compose.yml` to a verified image/build source. Do not silently substitute the official Evolution API image, as that would no longer deploy this fork.
- This is an unofficial fork and is not endorsed by Evolution Foundation.

## After deployment

1. Check the `almogapi` service logs and wait for its database migrations and startup to complete.
2. Open the generated domain and review the API documentation.
3. Use the generated `AUTHENTICATION_API_KEY` from the service environment for authenticated API requests.
4. Configure external integrations only when needed; the template leaves optional integrations disabled by default.

## Persistence

The `instances`, `postgres_data`, and `redis_data` volumes survive container recreation. Back them up before upgrades or migrations.
