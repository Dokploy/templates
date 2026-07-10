# AppBoard

Open-source ASO (App Store Optimization) tool: manage App Store & Google Play
listings, track keyword rankings over time, organize screenshots and publish
metadata — all from one self-hosted panel.

## Services

- **web** — admin panel (Next.js), exposed on port `6600` via the generated domain.
- **backend** — REST API (Elysia/Bun) on port `6680`, reached internally by the panel.
- **postgres** — PostgreSQL 18 database.

## First login (no SMTP required)

A bootstrap admin account is created on first boot from `ADMIN_EMAIL` /
`ADMIN_PASSWORD` (see the template variables). Open the panel and sign in with
those credentials using **"Sign in with a password"**.

## Optional

- `SMTP_*` — enable email OTP login and rank/report emails.
- `OPENROUTER_API_KEY` — enable AI-assisted research.

The `ENCRYPTION_KEY` is generated and persisted automatically on first boot.
