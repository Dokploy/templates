# Dokploy Prometheus Monitoring Extension

A comprehensive monitoring solution for Dokploy that exposes Prometheus-compatible metrics for external monitoring systems like Grafana Cloud, Datadog, or New Relic.

## Features

- **Server Metrics**: CPU, memory, disk, network usage with detailed labels
- **Container Metrics**: Per-container resource tracking (CPU, memory, network I/O, block I/O)
- **Prometheus Export**: Native `/metrics/prometheus` endpoint for scraping
- **Configurable Thresholds**: Set CPU and memory alerts
- **Automatic Cleanup**: Configurable retention with cron-based cleanup
- **Authentication**: Secure API endpoints with token-based auth (Prometheus endpoint is public for scraping)

## Exported Metrics

### Server Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `dokploy_server_cpu_usage_percent` | gauge | server_type, os, arch | Current CPU usage |
| `dokploy_server_memory_used_percent` | gauge | server_type, os, arch | Memory usage percentage |
| `dokploy_server_memory_used_gb` | gauge | server_type, os, arch | Memory used in GB |
| `dokploy_server_memory_total_gb` | gauge | server_type, os, arch | Total memory in GB |
| `dokploy_server_disk_used_percent` | gauge | server_type, os, arch | Disk usage percentage |
| `dokploy_server_disk_total_gb` | gauge | server_type, os, arch | Total disk space in GB |
| `dokploy_server_network_in_mb` | gauge | server_type, os, arch | Network traffic received |
| `dokploy_server_network_out_mb` | gauge | server_type, os, arch | Network traffic sent |
| `dokploy_server_uptime_seconds` | gauge | server_type, os, arch | System uptime |
| `dokploy_server_cpu_cores` | gauge | server_type, os, arch, cpu_model | Number of CPU cores |
| `dokploy_server_cpu_speed_mhz` | gauge | server_type, os, arch, cpu_model | CPU speed in MHz |

### Container Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `dokploy_container_cpu_usage_percent` | gauge | container_name, container_id | Container CPU usage |
| `dokploy_container_memory_used_mb` | gauge | container_name, container_id | Container memory used |
| `dokploy_container_network_bytes` | gauge | container_name, container_id, direction | Network I/O (in/out) |
| `dokploy_container_blockio_bytes` | gauge | container_name, container_id, operation | Block I/O (read/write) |

## Configuration Variables

The template provides the following configurable variables:

- **main_domain**: Domain for accessing the monitoring UI
- **monitoring_token**: Authentication token (auto-generated 32-char password)
- **callback_url**: URL for threshold alert callbacks
- **server_type**: Label for server identification (default: "Dokploy")
- **refresh_rate**: Metrics collection interval in seconds (default: 30)
- **retention_days**: How long to keep metrics in database (default: 7)
- **cpu_threshold**: CPU usage % to trigger alerts (default: 80, 0 = disabled)
- **memory_threshold**: Memory usage % to trigger alerts (default: 85, 0 = disabled)

> **Note**: Prometheus metrics endpoint (`/metrics/prometheus`) is **always enabled** by default to support monitoring integrations.

## Quick Start

1. Deploy the template from Dokploy
2. Configure your domain and thresholds
3. Access the Prometheus metrics at: `https://your-domain/metrics/prometheus`
4. Configure your monitoring system to scrape the endpoint

## Integration Examples

### Standalone Prometheus

Add to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'dokploy-monitoring'
    scrape_interval: 30s
    static_configs:
      - targets: ['your-domain:3001']
    metrics_path: '/metrics/prometheus'
```

### Grafana Cloud

Use Prometheus remote write or Grafana Agent:

```yaml
remote_write:
  - url: https://prometheus-prod-XX.grafana.net/api/prom/push
    basic_auth:
      username: 'YOUR_INSTANCE_ID'
      password: 'YOUR_API_KEY'
```

### Docker Compose with Prometheus

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
    ports:
      - "9090:9090"
```

## API Endpoints

- `GET /health` - Health check (no auth)
- `GET /metrics/prometheus` - Prometheus metrics (no auth, for scraping)
- `GET /metrics` - JSON metrics (requires auth)
- `GET /metrics/containers` - Container metrics (requires auth)

## Security Notes

> **⚠️ CRITICAL SECURITY WARNING**
>
> The `/metrics/prometheus` endpoint is **unauthenticated** by design to support standard Prometheus scrapers. This means **anyone with network access to this endpoint can view your server and container metrics**.
>
> **YOU MUST implement one of the following security measures:**

The `/metrics/prometheus` endpoint is **unauthenticated** by design to support standard Prometheus scrapers. Secure it using:

1. **Firewall rules**: Restrict access to your Prometheus server IP
2. **Reverse proxy**: Add authentication with Nginx/Caddy
3. **Private network**: Deploy in a VPN or private network
4. **Network policies**: Use Docker/Kubernetes network policies

## Example PromQL Queries

```promql
# Average CPU usage across all servers
avg(dokploy_server_cpu_usage_percent)

# Servers with high memory usage
dokploy_server_memory_used_percent > 80

# Top 5 containers by CPU
topk(5, dokploy_container_cpu_usage_percent)

# Container network traffic rate
rate(dokploy_container_network_bytes{direction="in"}[5m])
```

## Troubleshooting

### Metrics not appearing

```bash
# Check endpoint
curl http://localhost:3001/metrics/prometheus

# Check container logs
docker logs <container-name>
```

### High cardinality

Filter containers in the configuration by editing the METRICS_CONFIG to include/exclude specific containers.

## Learn More

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Cloud](https://grafana.com/docs/grafana-cloud/)
- [PromQL Guide](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Dokploy Monitoring](https://github.com/Dokploy/dokploy)

## License

This monitoring extension is part of the Dokploy project and follows the same license.
