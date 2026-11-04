# HyperDX

This template deploys HyperDX with MongoDB, ClickHouse, and the ClickStack OpenTelemetry collector. It uses HyperDX's authenticated application image. Logs, traces, metrics, and session replay sources are configured automatically when you create the first account.

## Before deploying

Use an x86-64 server with AVX support for MongoDB, at least 2 CPU cores, and 4 GiB of available RAM for testing. Reserve more memory and disk space for production workloads.

Keep Dokploy's isolated deployment enabled. MongoDB has no authentication and must remain on the private application network. ClickHouse uses a generated password. Neither database needs a public port.

The ClickHouse configuration starts with a 2 GiB server memory budget and small caches. Adjust `clickhouse-config.xml` in Dokploy's file mounts for your workload and available memory. This setting is ClickHouse's accounting limit, not a hard container RAM limit.

## First login

Open the assigned domain and create the first account. HyperDX allows one initial team; invite additional users from that team after setup. Complete this step before sharing the domain.

When enabling HTTPS or changing the domain in Dokploy, set `HYPERDX_URL` to the matching origin, such as `https://hyperdx.example.com`, and redeploy. Use HTTPS before sending credentials over an untrusted network. The web interface proxies API requests internally, so you do not need to publish API port 8000.

Keep `SESSION_SECRET` stable across redeployments. If you change `CLICKHOUSE_PASSWORD` after creating your account, also update the saved ClickHouse connection in HyperDX.

## Send telemetry

Copy the ingestion API key from HyperDX's team settings. This key is different from the personal API key used to query HyperDX's API.

For senders on the private application network:

```text
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
OTEL_EXPORTER_OTLP_HEADERS=authorization=<ingestion-api-key>
```

For external senders, add a domain in Dokploy for service `otel-collector`, port `4318`, enable HTTPS, and use that URL as the OTLP endpoint. HTTP/protobuf telemetry uses `/v1/logs`, `/v1/traces`, and `/v1/metrics` beneath that endpoint. The collector requires the ingestion API key after the first team is created.

For OTLP gRPC, publish an unused host port to collector port `4317` in Dokploy's Compose editor and restrict access to trusted senders. Ordinary HTTP domain routing does not configure gRPC ingestion automatically. The template publishes no host ports by default.

## Persistence

MongoDB volumes store accounts, connections, dashboards, and saved searches. ClickHouse volumes store telemetry and server logs. The collector volume retains its supervisor state. Preserve these volumes during redeployments and back up MongoDB and ClickHouse before upgrading.

Usage reporting and Next.js telemetry are disabled by default. Configure retention in ClickHouse for the volume of telemetry you expect.
