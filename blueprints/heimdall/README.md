# Heimdall

Heimdall is a dashboard and launcher for everything you self-host. Instead of bookmarks and memorised ports, you get one clean start page: add your applications with icons, organise them with tags, search across them, and optionally let Heimdall ping each service to show whether it is up. Many popular apps have "enhanced" integrations that show live stats (queue sizes, counts) right on the dashboard.

## How this deployment works

This template deploys the **official LinuxServer image** (`linuxserver/heimdall:2.8.4`) as a single container:

- **Persistence:** settings, items and uploaded icons live in the `config` volume (`/config`).
- The app listens on port 80 internally; the domain is wired in `template.toml`. (The image also serves HTTPS on 443 with a self-signed certificate — not needed behind Dokploy.)
- `PUID`/`PGID` are the LinuxServer conventions for the user the app runs as; `TZ` sets the timezone. Adjust them in the compose file if your setup differs.

## First run

1. Open your Dokploy domain — the dashboard loads straight away, there is no installer.
2. Use the settings page to set a title, then add your first application tile.

## Notes

- **Heimdall has no built-in user authentication.** Anyone who can open the domain can see and edit your dashboard. Put it behind Dokploy/Traefik-level protection (or keep it on a private network) if that matters to you — the README of upstream says the same.
- Heimdall is MIT-licensed open source, maintained by the LinuxServer team.
