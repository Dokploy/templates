# n8n Queue Mode

This template runs n8n in [queue mode](https://docs.n8n.io/hosting/scaling/queue-mode/):

- **n8n** (main): serves the editor UI and receives webhooks/triggers, then publishes executions to the queue.
- **n8n-worker** (x2 by default): pulls executions from the Redis (Bull) queue and runs them.
- **redis**: the message broker for the queue (password protected).
- **postgres**: stores workflows, credentials and execution data.

All n8n containers share the same `N8N_ENCRYPTION_KEY` (generated automatically), which is required for workers to decrypt credentials.

## Scaling workers

Worker replicas are controlled by the `N8N_WORKER_REPLICAS` environment variable (default `2`):

1. Open the compose service in Dokploy and go to the **Environment** tab.
2. Change `N8N_WORKER_REPLICAS` to the number of workers you want.
3. Redeploy. Docker Compose will scale the `n8n-worker` service to the requested number of replicas.

Each worker runs up to 10 concurrent executions by default. You can tune this by adding `N8N_CONCURRENCY_PRODUCTION_LIMIT` to the worker environment.

## Optional: dedicated webhook processors

For very high webhook volumes, n8n supports dedicated webhook processor instances (`command: webhook`). To use them, add another service to the compose file with the same environment as `n8n-worker` but with `command: webhook`, and route the `/webhook/` path of your domain to it. See the [n8n queue mode docs](https://docs.n8n.io/hosting/scaling/queue-mode/#webhook-processors) for details.
