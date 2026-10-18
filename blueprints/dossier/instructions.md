# Dossier

Dossier is a single-user job search workspace for your profile, resumes, applications, and cover letters. This template runs Dossier v1.5.0 with PostgreSQL 18 and persistent storage. AI and job search providers are optional.

## Before the first deployment

1. Import the template in Dokploy. Keep the generated `POSTGRES_PASSWORD` and `DOSSIER_SECRET` values.
2. Generate a login password hash on a machine with Docker:

   ```sh
   docker run --rm -it ghcr.io/aientech/dossier:v1.5.0 hash-password
   ```

   Enter your chosen password twice. Copy the printed `argon2id:...` string into `DOSSIER_PASSWORD` in Dokploy's Environment tab. Use Dossier's command: it produces a special dollar-free format, rather than a standard `$argon2id$...` hash. Never put your plaintext password in this variable. The empty template value deliberately prevents deployment until you set the hash.
3. Set your domain in Dokploy and enable HTTPS with a certificate. The domain targets service `dossier`, port `3000`. Dokploy manages routing and networks; neither the app nor PostgreSQL needs a published host port.
4. Deploy, wait for both services to become healthy, and open the domain. Sign in with the password you entered in the hashing command.

Allow at least 1 GB of memory for Dossier, plus memory for PostgreSQL and Dokploy. The app's 1 GB container limit accommodates its bundled Chromium PDF renderer. Larger documents or heavier use may need a higher limit. Run exactly one Dossier instance against this database: backups, the application queue, and the browser process run inside the app.

## Optional integrations

You can save your profile and print a base resume without an AI provider. Configure AI later in **Settings → AI provider**, or add the `DOSSIER_AI_*` defaults listed in [environment.md](environment.md). Settings saved in the app take precedence over environment defaults. Hosted services require their own credentials; no provider key is generated or required by this template.

An Ollama service is not installed automatically. To use Ollama already running on the Docker host, set the local provider URL to `http://host.docker.internal:11434` and choose an installed model. The host gateway mapping is included, but Ollama must listen on an address reachable from the container and the host firewall must permit that connection. `localhost` inside Dossier refers to the Dossier container. Alternatively, add your own Ollama service and persistent model volume, then use its service name as the URL. Model downloads and CPU/GPU memory are additional requirements only for that optional service.

Job search is off until you choose a source in **Settings → Job search**. JSearch needs a key; Adzuna needs an app ID and key; Arbeitsagentur needs no key. None is required to deploy or use the application tracker.

The template sets `DOSSIER_TELEMETRY=off`. Upstream defaults to `on`; enabling it sends an install ID and version once per day the app is used. The release update check is separate and can be disabled in Settings → About.

## Persistence, backups, and upgrades

- `dossier-postgres` stores PostgreSQL data at `/var/lib/postgresql`, the parent directory required by PostgreSQL 18 images.
- `dossier-data` stores `/data`, including nightly backups and downloadable PDF/ZIP artifacts. Backups run at 03:00 in `TZ` and are retained for `DOSSIER_BACKUP_RETENTION_DAYS` days, default 14.
- Back up the database, `/data`, and your deployment secrets to another location. A volume on the same server is not an off-server backup. Dossier's Settings → Your data also provides export/import.
- Preserve `DOSSIER_SECRET`: it signs sessions and encrypts saved provider keys. Replacing it signs everyone out and makes previously encrypted keys unreadable. Changing `DOSSIER_PASSWORD` also invalidates existing sessions.
- Keep the generated database password URL-safe if you replace it: it is interpolated into `DATABASE_URL`. Changing it in Environment alone does not change the password in an initialized database.
- The official image applies database migrations before starting the server. Back up first, review upstream release notes, then update the image and metadata together. Keep PostgreSQL on major version 18 unless you perform a planned database migration.

GET `/api/health` is public and checks database connectivity without returning private data. Behind Dokploy's Traefik proxy, Dossier uses `X-Forwarded-Proto` for secure cookies and `X-Forwarded-For` for login rate limiting. Keep the application reachable through the trusted proxy and use HTTPS for regular access.

See [environment.md](environment.md) for required and optional variables and [testing.md](testing.md) for a repeatable verification checklist.
