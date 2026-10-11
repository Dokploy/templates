# Paperclip

Paperclip is an open-source control plane for managing teams of AI agents, goals, budgets, tickets, and recurring work.

This Dokploy template includes:

- Paperclip web/API service using the official GHCR image
- PostgreSQL 17 database with health check
- Generated `BETTER_AUTH_SECRET`
- Generated database password
- Persistent `/paperclip` storage for instance data
- Public URL configured from the Dokploy domain
- Dokploy domain routing to Paperclip on port 3100

After deployment, check the Paperclip container logs for first-run setup or invite information.