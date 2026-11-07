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

## After enabling HTTPS

`FRONTEND_URL` and `S3_PUBLIC_ENDPOINT` default to `https://`. Enable HTTPS
(Let's Encrypt) on **both** domains in Dokploy before uploading media: the bucket's
CORS rules are derived from `FRONTEND_URL`, and presigned URLs are built from
`S3_PUBLIC_ENDPOINT`, so a scheme or host mismatch makes uploads and playback fail
while the UI itself still loads. If you deploy over plain HTTP instead, change both
variables to `http://<domain>` and redeploy.

## Sizing

Video transcoding is the only heavy operation, and it runs on the CPU here. 2 cores
/ 4 GB is the documented minimum; 4 cores / 8 GB is the recommended starting point.
`TRANSCODING_CONCURRENCY` (default 2) is how many videos are encoded at once, one
core each: lower it on a small box to keep the UI responsive, or set
`TRANSCODER_CPU_LIMIT` (e.g. `200%`) in the environment to cap a single ffmpeg
process.

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
