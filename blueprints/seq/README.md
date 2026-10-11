# Seq

Seq is a self-hosted log search and structured observability server from Datalust.

This Dokploy template includes:

- Seq server using the official Datalust container image
- Generated first-run admin password
- Canonical URL configured from the Dokploy domain
- Persistent `/data` volume
- Dokploy domain routing for the web UI and ingestion API on port 80

The template sets `ACCEPT_EULA=Y`, which is required by the official Seq container image.