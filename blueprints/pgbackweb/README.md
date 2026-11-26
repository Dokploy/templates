# PG Back Web

PG Back Web is an open-source PostgreSQL backup manager with a user-friendly web interface. It wraps the robust `pg_dump` tool in a dashboard where you register your databases, choose where backups go (local storage or S3), set schedules, and watch every execution's logs — with instant download and restore, health checks, webhooks and optional PGP encryption. It works with PostgreSQL 13 to 18 and is licensed under AGPL v3.

## How this deployment works

This template runs two services from the upstream project's official Docker Compose example:

- **pgbackweb** (`eduardolat/pgbackweb:0.5.2`) — the web interface, listening on port 8085.
- **postgres** (`postgres:18`) — a private PostgreSQL sidecar that stores PG Back Web's own data (users, registered databases, destinations, schedules and execution history). It is not exposed publicly.

Dokploy generates two secrets at deploy time (see `template.toml`), so there is nothing to fill in before deploying:

- `PBW_ENCRYPTION_KEY` — encrypts the sensitive data PG Back Web stores (database credentials, S3 secret keys…). **Never change it after the first deploy**, or the stored data becomes unreadable.
- `POSTGRES_PASSWORD` — the sidecar database password, wired into both services automatically.

Backups written to local destinations are kept in the `backups` volume (`/backups` in the app container). If you only use S3 destinations you can ignore that volume.

## First run

1. Open your Dokploy domain as soon as the deployment is up.
2. PG Back Web detects the empty database and shows a **Create first user** page — the first person to open the page creates the administrator account, so do this step immediately after deploying.
3. Log in, register your first PostgreSQL database and a destination, and schedule a backup.

## Notes

- Forgot the admin password? Run `docker exec -it <pgbackweb-container> sh -c change-password` on the server and follow the prompts.
- The internal sidecar is only for PG Back Web itself — the databases you back up are external and are added from the dashboard with their own connection details.
- To serve the app under a sub-path instead of a subdomain, set the `PBW_PATH_PREFIX` environment variable (e.g. `/pgbackweb`) on the pgbackweb service.
