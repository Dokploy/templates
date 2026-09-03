# Firecrawl

This template deploys Firecrawl `2.11.230` with authenticated API access, persistent infrastructure, browser rendering, and interactive Swagger documentation.

## First deployment

1. Create the template and keep the generated environment values unchanged.
2. Deploy the Compose service.
3. Wait for `firecrawl-db-seed` to finish and for `gateway` and `firecrawl` to become healthy. The first start can take several minutes.
4. Open `https://<your-domain>/docs/` for the interactive API documentation.

Dokploy generates the client credential in the Environment tab:

```text
FIRECRAWL_API_KEY=fc-...
```

Treat this value as a secret. The template provisions it in Firecrawl's PostgreSQL authentication database automatically.

## Test the API

```bash
curl -X POST "https://<your-domain>/v2/scrape" \
  -H "Authorization: Bearer <FIRECRAWL_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://docs.dokploy.com","formats":[{"type":"markdown"}]}'
```

The OpenAPI document is available at:

```text
https://<your-domain>/openapi.json
```

## Included services

- `gateway`: public same-origin API and documentation gateway.
- `firecrawl`: API plus queue, extract, indexing, NuQ, and reconciliation workers.
- `playwright-service`: browser-rendered scraping.
- `firecrawl-db`: authentication, request, crawl, monitoring, and application data.
- `nuq-postgres`: durable NuQ job storage.
- `redis`: queues, caching, and rate-limit state.
- `rabbitmq`: extract-job transport.
- `swagger-ui`: interactive API documentation.

Only the gateway is assigned a public domain. PostgreSQL, Redis, RabbitMQ, Playwright, and worker ports remain private.

## Capabilities

Scrape, batch scrape, crawl, map, parsing, browser sessions, monitoring, change tracking, and the normal non-AI API paths work without an external model provider.

AI-backed extraction, JSON generation, agent features, and summaries require one of these configurations in the Environment tab:

- `OPENAI_API_KEY`, optionally with `OPENAI_BASE_URL`
- `OPENROUTER_API_KEY`
- `OLLAMA_BASE_URL`

Set `MODEL_NAME` and `MODEL_EMBEDDING_NAME` when the provider requires explicit model names.

Search integrations can be configured with `SEARCHAPI_API_KEY` or `SEARXNG_ENDPOINT`. Proxy variables and LlamaParse are optional.

## MCP clients

The Firecrawl API is not itself an MCP transport. Connect the official Firecrawl MCP adapter to this deployment:

```json
{
  "mcpServers": {
    "firecrawl-selfhost": {
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": {
        "FIRECRAWL_API_URL": "https://<your-domain>",
        "FIRECRAWL_API_KEY": "<FIRECRAWL_API_KEY>"
      }
    }
  }
}
```

## Persistence and backups

The following named volumes contain persistent state:

- `firecrawl-db-data`
- `nuq-postgres-data`
- `redis-data`
- `rabbitmq-data`

Back up both PostgreSQL volumes before upgrading. Redis and RabbitMQ backups are also recommended when queued jobs must survive disaster recovery.

Database initialization scripts run only when `firecrawl-db-data` is empty. A newer Firecrawl image may require schema or RPC changes, so do not replace the pinned image with `latest` without reviewing migrations and testing a restored backup.

## Security notes

- Keep `ALLOW_LOCAL_WEBHOOKS=false` unless private-network webhook access is intentional.
- Keep the generated database, Redis, RabbitMQ, and Bull secrets private.
- Use HTTPS for the public domain.
- The generated API key receives unrestricted self-host rate-limit overrides; protect it like an administrator credential.
- Changing `FIRECRAWL_API_KEY` after deployment provisions another key and does not automatically revoke the old one.

