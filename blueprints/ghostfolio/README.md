# Ghostfolio

Runs [Ghostfolio](https://ghostfol.io) — an open-source wealth management
software that tracks your portfolio (stocks, ETFs, cryptocurrencies, bank
accounts) and shows performance, allocation and risk analytics in one
dashboard. The template deploys the official `ghostfolio/ghostfolio` image
with its own PostgreSQL and Redis services, and exposes the web UI on your
Dokploy domain (the app listens on port 3333 internally).

Tested on Dokploy: deployed live and verified — the app loads over HTTPS
on the Dokploy domain, and creating the first account (which becomes the
admin) reached the dashboard welcome screen.

## First run

1. Open your domain and create your account — the **first** account created
   becomes the administrator.
2. Add your accounts and holdings, or import transactions from a CSV /
   broker export under **Portfolio → Activities**.

## Secrets & data

The database password and the app's token secrets are generated automatically
at deploy time (see `template.toml`) — you never type or store them yourself.
Portfolio data lives in the `db_data` volume (PostgreSQL) and the cache in
`redis_data`; both survive redeploys.

## Security note

Ghostfolio holds sensitive financial data. Create the admin account
immediately after the first deploy, and consider restricting the domain to
your own network or VPN once your account exists.
