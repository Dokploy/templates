# Template validation

Tested on 2026-09-06 through Dokploy on Linux x86-64 with Docker Engine 29.1.3, using the image versions pinned in this template.

## Checks performed

- Imported the Compose and TOML files through Dokploy's Base64 import API with isolated deployment enabled.
- Confirmed Dokploy created the ClickHouse configuration file mount and all four services became healthy.
- Created the first account and logged in through the assigned domain and Traefik. HyperDX created Logs, Traces, Metrics, and Sessions sources automatically.
- Sent OTLP JSON logs, traces, and metrics to the collector over its private network, authenticated with the team's ingestion key.
- Confirmed unauthenticated ingestion returned HTTP 401.
- Retrieved the test log and trace through HyperDX's authenticated search API.
- Stopped and started the stack through Dokploy. Login, sources, and log and trace searches still worked. Confirmed the test metric value remained in ClickHouse.
- The instance owner tested the web interface and confirmed it works.
- Sent an OTLP exponential histogram, verified the saved Metrics source maps `exponential histogram` to `otel_metrics_exponential_histogram`, and discovered the metric through HyperDX's authenticated ClickHouse query proxy using that mapping.

The four containers used approximately 0.9 GiB during this small test. This does not replace the upstream recommendation of at least 4 GiB of available memory, and is not a production sizing benchmark.

Session replay ingestion and public OTLP/gRPC exposure have not been tested.

## Repeat the ingestion check

1. Deploy with isolated deployment enabled and create the first account.
2. Copy the team ingestion API key and configure your sender as described in `instructions.md`.
3. Send an OpenTelemetry log with a unique body and a trace with a unique span name. Send a gauge metric with a known value.
4. Find the log and trace in HyperDX, then check the metric.
5. Stop and start the stack through Dokploy. Confirm you can log in again and find the same data. Set a search time range that includes the original events.
