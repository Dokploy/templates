# GatherGate

Runs [GatherGate](https://gathergate.app), a self-hosted, open-source client document collection portal and encrypted intake vault built on Node.js 24 (`node:sqlite` WAL + `node:crypto`), Hono, and React 19 with zero telemetry.

This template deploys the official multi-arch `ghcr.io/faas19/gathergate` image (`linux/amd64`, `linux/arm64`) behind your Dokploy HTTPS domain on internal port `3080`, automatically generating a 64-character hex `MASTER_KEY` for per-record HKDF AES-256-GCM encryption.

## First run

1. Open your assigned HTTPS domain to complete first-run workspace setup and branding.
2. Back up the generated `MASTER_KEY` environment variable in your secret manager so encrypted uploads and SQLite backups remain recoverable across server migrations.
3. Configure outbound SMTP or Resend delivery under **Settings > Email** (or test locally using the built-in Local Email Outbox).

## Your data persists

SQLite WAL state (`gathergate.sqlite`) and AES-256-GCM encrypted uploads (`blobs/`) live in the `gathergate_data` volume mounted at `/data`. Keep replicas set to `1` for SQLite WAL and the built-in reminder, webhook retry, and retention auto-purge scheduler.
