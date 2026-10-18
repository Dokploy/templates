# Environment variables

These settings were checked against Dossier **v1.5.0**: [environment validation](https://github.com/AienTech/dossier/blob/v1.5.0/src/lib/env.ts), [example environment](https://github.com/AienTech/dossier/blob/v1.5.0/.env.example), and [production Compose](https://github.com/AienTech/dossier/blob/v1.5.0/compose.production.yml).

Add optional values to Dokploy's Environment tab and redeploy. The app loads that environment through an optional `.env` file. Blank optional values count as unset. Required credentials are checked explicitly by Compose; the app validates their format on startup. App settings saved in the database override AI and job search environment defaults.

## Required and generated values

| Variable | Template value | Purpose |
| --- | --- | --- |
| `DOSSIER_PASSWORD` | Empty; you must set it | Login password **hash** from `docker run --rm -it ghcr.io/aientech/dossier:v1.5.0 hash-password`. Paste the complete `argon2id:...` output, never plaintext or a standard PHC hash. |
| `DOSSIER_SECRET` | Generated random hexadecimal string | At least 32 characters. Signs sessions and encrypts saved provider keys. Preserve across redeployments and backups. |
| `POSTGRES_PASSWORD` | Generated random hexadecimal string | Required by both services. Used in the connection URL; a replacement must be URL-safe. |
| `DATABASE_URL` | Constructed by Compose | `postgresql://dossier:<generated password>@dossier-postgres:5432/dossier`. No manual value is needed. |

`POSTGRES_USER=dossier` and `POSTGRES_DB=dossier` are fixed in Compose and match the app's connection URL. Change both service configurations together if customizing them. `POSTGRES_PORT` from upstream's development example is unused: PostgreSQL is private and has no published port.

## Optional application settings

| Variable | Template / upstream default | Purpose |
| --- | --- | --- |
| `DOSSIER_TELEMETRY` | Template `off`; upstream `on` | `on` or `off`. Controls the daily usage ping, independently of update checks. |
| `DOSSIER_BACKUP_RETENTION_DAYS` | `14` | Whole number, at least 1. Retention of nightly backups. |
| `TZ` | `UTC` | Time zone for the app and its 03:00 backup schedule, for example `Europe/Paris`. |
| `DOSSIER_DATA_DIR` | `/data`, fixed by Compose | Mounted persistent directory. If customizing, change the volume target and this value together in Compose. |

## Optional AI defaults

No AI variables are required for startup, login, the profile, or base resume PDFs. AI features require a reachable provider and a suitable model. You can configure the same settings in the app instead.

| Variable | Default when unset | Purpose |
| --- | --- | --- |
| `DOSSIER_AI_PROVIDER` | No provider configured | `local`, `openai` (also compatible APIs), or `anthropic`. |
| `DOSSIER_AI_URL` | Provider-specific | HTTP(S) endpoint. Local: `http://localhost:11434`; OpenAI: `https://api.openai.com/v1`; Anthropic: `https://api.anthropic.com`. For host Ollama, use `http://host.docker.internal:11434`. |
| `DOSSIER_AI_MODEL` | No default for local/OpenAI; `claude-sonnet-5` for Anthropic | Provider model identifier. |
| `DOSSIER_AI_KEY` | Unset | Provider credential, if needed. Keep private. |
| `DOSSIER_AI_TIMEOUT_SECONDS` | `300` local; `120` hosted | Whole number of seconds, at least 5, per call. |

## Optional job search defaults

| Variable | Default when unset | Purpose |
| --- | --- | --- |
| `DOSSIER_JOBS_SOURCE` | `off` | `jsearch`, `adzuna`, `arbeitsagentur`, or `off`. |
| `DOSSIER_JSEARCH_KEY` | Unset | Required only for JSearch. |
| `DOSSIER_JSEARCH_HOST` | `openwebninja` | `openwebninja` or `rapidapi`, matching the key issuer. |
| `DOSSIER_ADZUNA_APP_ID` | Unset | Required only for Adzuna. |
| `DOSSIER_ADZUNA_KEY` | Unset | Required only for Adzuna. |

Arbeitsagentur needs no credential. Provider availability, quotas, and billing are managed by the provider.

## Image and test controls

The published image already sets `NODE_ENV=production`, `NEXT_TELEMETRY_DISABLED=1`, `PORT=3000`, and `HOSTNAME=0.0.0.0`. Leave them unchanged so routing and the health check agree. This template uses the prebuilt production image; frontend build inputs and development database port settings are not additional installation requirements.

`DOSSIER_JOBS_TEST_BASE_URL` and `DOSSIER_UPDATES_TEST_BASE_URL` are upstream end-to-end test hooks that redirect job search and release requests to mock endpoints. Keep them unset in normal deployments. They are intentionally absent from the generated Environment tab.
