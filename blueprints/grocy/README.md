# Grocy

Runs [Grocy](https://grocy.info) — a self-hosted groceries and household
management solution ("ERP beyond your fridge"): stock and expiry tracking
with barcode scanning, meal planning, recipes, shopping lists, chores and
more. The template deploys the official `linuxserver/grocy` image and exposes
the web UI on your Dokploy domain (the app listens on port 80 internally (current linuxserver/grocy images serve the web UI on 80/443; the legacy 9283 port no longer applies)).

Tested on Dokploy (2026-11-20): deployed live at grocy.syn-code.win — sign-in with the default admin account and the stock overview verified. Note: current linuxserver/grocy images serve the web UI on port 80 (the legacy 9283 port is dead), so this template routes port 80.

## First run

1. Open your domain and log in with the default credentials
   **admin / admin**.
2. **Change the admin password immediately** (top-right user menu →
   settings), then set your location, products and quantities.

## Data

Everything — the SQLite database, uploads and settings — lives in the
`config` volume (`/config`), so it survives redeploys. Back that volume up;
it is your whole household database.

## Security note

The default login is public knowledge. Change it on first run before adding
real data, and keep the instance on a domain only your household uses.
