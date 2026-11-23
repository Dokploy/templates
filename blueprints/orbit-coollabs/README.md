# Orbit by Coolify

A self-hosted workspace for teams: tasks, docs, and chat in one app on your own server. AI clients connect over MCP and get the full context of your workspace without your data leaving your server. Orbit is built by the team behind Coolify and is a single Rust binary with the web app embedded; data lives in SQLite on local volumes.

This template deploys the latest stable release (**0.3.0**). It does **not** include Orbit's inbound mail server: that feature exists only in pre-release builds and is not part of any stable release yet (0.3.0 rejects the `ORBIT_MAIL_*` settings as unknown). Once upstream ships it in a release, a mail variant of this template can follow. Outbound email (invitations, password resets) works in this template by saving your own SMTP server under **Admin → Settings → Email** after setup.

> The template id is `orbit-coollabs` because `orbit` is already taken in this catalog by a different product (Orbit by Noveum).

## First run: create the root account

Orbit has no default login. On first start it prints a **one-time setup URL** to the container log:

1. After deploying, open the service logs in Dokploy and find the line `Initial setup URL: https://<your-domain>/setup?token=...`
2. Open that URL and create the first account — it becomes the **root user** of the instance (the only account that can open Admin at first).
3. Treat the URL as a secret: anyone who opens it first owns the instance.

If the token is lost or expires before you use it, generate a new one with the Orbit CLI: stop the service first (on SQLite the running server owns the database file), run `orbit setup-token rotate` inside the container with the same volumes and environment (for example with `docker run --rm` on the host), then start the service again and use the new URL it prints.

## App key — keep a copy

`ORBIT_APP_KEY` is generated at deploy time (`${base64:32}`, base64 of 32 random bytes). Orbit encrypts saved secrets (SMTP password, sign-in provider keys, 2FA) and its backups with this key. **Keep a copy outside the server**: a database restored without the same key cannot read its saved secrets, and backups cannot be restored.

## Notes

- **HTTPS is required.** Orbit refuses to start in production with a non-HTTPS public origin, so the generated Dokploy domain with a valid certificate is not optional.
- **Trusted proxies.** Orbit reads the client IP and the HTTPS scheme from forwarding headers only for trusted proxies. Behind Dokploy, Traefik can arrive from any private Docker network, so the template trusts the private ranges (`127.0.0.1/32, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16`). It never trusts public addresses. Narrow it if you know your exact proxy subnet.
- **Data.** `orbit-data` holds the SQLite database and attachments; `orbit-backups` holds backups. Back both up before upgrades.

## Tested on Dokploy (2026-11-16)

Deployed from this exact compose on a live Dokploy instance: the container starts cleanly, `/health/ready` returns 200 with all checks green (database, migrations, scheduler, writable storage), the web UI serves on the generated HTTPS domain, and the setup page loads. A redeploy keeps the instance healthy on the same volumes.
