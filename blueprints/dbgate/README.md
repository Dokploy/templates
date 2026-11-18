# DbGate

Runs [DbGate](https://www.dbgate.io) — a modern, web-based database manager
that works with MySQL, MariaDB, PostgreSQL, SQL Server, Oracle, MongoDB,
Redis, SQLite, ClickHouse and more from a single interface. The template
deploys the official `dbgate/dbgate` image (community edition) and exposes
the web UI on your Dokploy domain (the service listens on port 3000
internally).

Tested on Dokploy (2026-11-15): deployed from this exact compose, the web UI
serves on the domain and the API answers 401 to unauthenticated calls — the
login below is enforced, not optional decoration.

## First login

The template enables DbGate's built-in login so the UI is not open to the
internet: Dokploy generates a username and password at deploy time — open
the service's environment in Dokploy to see them (`LOGIN` / `PASSWORD`).

If you prefer no login (for example on a private network), clear those two
variables and redeploy.

## Your connections persist

Define your database connections in the app — no environment variables
needed. Saved connections, scripts and settings live in the `dbgate_data`
volume (`/root/.dbgate`), so they survive redeploys.

Connections can also be pre-configured with environment variables
(`CONNECTIONS` plus `SERVER_<name>`, `USER_<name>`, `ENGINE_<name>`, …) —
see the [DbGate documentation](https://docs.dbgate.io) if you want that
instead.

## Security note

DbGate stores credentials for every database you connect and can run
arbitrary queries against them. Treat the domain as an admin tool: keep it
behind the login this template sets, and do not share it publicly.
