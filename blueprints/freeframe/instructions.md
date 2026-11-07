# FreeFrame

FreeFrame is a self-hostable, open-source alternative to Frame.io: collaborative
review, annotation and approval for images, audio and video, with frame-accurate
comments, version comparison, share links and an approval workflow.

## Two domains

- The **main domain** serves the web app (service `freeframe`, port 3000). Its
  `/api` path is routed to the API (service `freeframe-api`, port 8000) with the
  prefix stripped, so both live on one hostname — that is what the web image
  expects, and why the API domain entry has `path = "/api"` and
  `stripPath = true`.
- The **second domain** exposes the bundled object store (service
  `freeframe-silo`, port 9000). FreeFrame has no local-filesystem storage: media
  is uploaded straight to the bucket with presigned URLs that the *browser*
  fetches, so this endpoint has to be publicly reachable. It is not an internal
  detail.

## First start

`freeframe-api` waits for Postgres, Redis and the object store to report healthy,
then runs `alembic upgrade head` and starts. It also creates the bucket and its
CORS rules on startup from `FRONTEND_URL`, so there is nothing to set up by hand.
Open the main domain and complete the setup wizard: **the first account becomes
the super admin**, and it is created with a password, so no mail server is needed
to sign in the first time.

Uploads take a moment before they are reviewable: a background worker transcodes
each video into the review streams. There is no GPU in this template, so encoding
is software x264/x265 on the CPU.

## HTTP by default, HTTPS later

`FRONTEND_URL` and `S3_PUBLIC_ENDPOINT` default to **`http://`**, so the stack works
immediately on a host without a valid certificate (including the `*.traefik.me` names
Dokploy generates when no domain is configured — those can never get a trusted
certificate, so HTTPS there means every upload fails with
`ERR_CERT_AUTHORITY_INVALID` before a single byte is sent).

To serve FreeFrame over HTTPS, with a real domain pointing at the server:

1. Enable HTTPS (Let's Encrypt) on **all three** domains in Dokploy. Do not enable it on
   one and leave another on HTTP: an HTTPS page cannot upload to an HTTP storage endpoint
   (the browser blocks it as mixed content), and an HTTP page cannot use an HTTPS storage
   endpoint without a trusted certificate.
2. Change both variables to `https://` and redeploy:
   ```
   FRONTEND_URL=https://<main domain>
   S3_PUBLIC_ENDPOINT=https://<storage domain>
   ```
3. **Recreate the API** after changing them. The bucket's CORS rules are written from
   `FRONTEND_URL` when the API starts, so a mismatch shows up as uploads stuck at 0% while
   the UI itself still loads.

If uploads stop working after a scheme change, that pair of variables is the first thing
to check, and the second is whether the storage domain redirects HTTP to HTTPS.

## Sizing

Video transcoding is the only heavy operation, and it runs on the CPU here. 2 cores
/ 4 GB is the documented minimum; 4 cores / 8 GB is the recommended starting point.

`template.toml` sets the tuning settings to the values FreeFrame would use anyway,
so they are visible and editable in Dokploy's **Environment** tab after import (TOML
comments are not carried over — only key/value pairs are). `docker-compose.yml` also
defaults each one, so deleting a variable falls back to the same value. They are:

| Setting | Default | What it does |
|---|---|---|
| `TRANSCODING_CONCURRENCY` | `2` | Videos encoded at once. Size it to the cores (1 on 2 cores, 2-3 on 4, 4-6 on 8+). |
| `TRANSCODER_CPU_LIMIT` | *(unbounded)* | Cores one ffmpeg may use: `4` or `40%`. Unbounded takes about 80% of a 10-core host for one three-rung ladder, so set this when the UI must stay responsive while encoding. Machine ceiling is this times `TRANSCODING_CONCURRENCY`. |
| `TRANSCODER_QUALITIES` | `1080p,720p,360p` | Dropping `360p` saves CPU and storage but leaves viewers on slow connections without a lower rendition. |
| `TRANSCODER_SOURCE_COPY` | `false` | Remux a browser-safe H.264 8-bit master instead of re-encoding it, when the ladder resolves to one rendition at the source's own size. |
| `API_WORKERS` | `4` | Gunicorn workers in the API container. |
| `UPLOAD_CONCURRENCY` | `5` | Upload parts in flight per tab; 6 is the useful maximum over HTTP/1.1. |

`max(1, round(cores × share))` rounds a percentage up, and a value at or above the
available core count is treated as unbounded and reported in the worker log.

## Backups

Three volumes hold state: `freeframe-postgres-data` (metadata), `freeframe-silo-data`
(originals and every rendition) and `freeframe-redis-data` (queues). Back up the
database and the bucket together. Housekeeping runs on a schedule and hard-deletes
soft-deleted rows and their objects after `SOFT_DELETE_RETENTION_DAYS` (30 by
default); set it to `0` to switch that off.

## Versioning

Images are pinned to the release this template ships (`1.22.0`). To move to another
release, change the three `ghcr.io/techiebutler/freeframe-*` tags together — the API,
the four Celery containers and the web app are published per release — and run
`alembic upgrade head` again by redeploying.
