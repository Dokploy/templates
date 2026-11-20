# Kanboard

Runs [Kanboard](https://kanboard.org) — a free and open-source Kanban
project management tool: visual boards with columns and swimlanes, task
automation, subtasks, and a deliberately minimal feature set that stays out
of your way. The template deploys the official `kanboard/kanboard` image
and exposes the web UI on your Dokploy domain (the app listens on port 80
internally).

Tested on Dokploy (2026-11-20): deployed live at kanboard.syn-code.win — sign-in with the default admin account and the dashboard verified.

## First run

1. Open your domain and log in with the default credentials
   **admin / admin**.
2. **Change the admin password immediately** (top-right menu → My profile
   → Password), then create your first project and invite your team.

## Data

Kanboard stores everything in SQLite inside the `data` volume, and any
plugins you install live in `plugins`; both survive redeploys. Back up the
`data` volume — it is your whole board history.

## Security note

The default login is public knowledge. Change it on first run, and create
individual accounts for teammates instead of sharing the admin login.
