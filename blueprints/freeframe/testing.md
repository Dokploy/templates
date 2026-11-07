# Testing FreeFrame

Use a disposable Dokploy project and test accounts. Upload only media you own, and do not
send invitation or notification mail to addresses you do not control.

## Repository checks

From the repository root:

```sh
node build-scripts/generate-meta.js --check
cd build-scripts
pnpm exec tsx validate-docker-compose.ts --file ../blueprints/freeframe/docker-compose.yml --verbose
pnpm exec tsx validate-template.ts --dir ../blueprints/freeframe --verbose
cd ../app
pnpm install --frozen-lockfile
pnpm run build
```

Confirm that `meta.json`'s `version` (1.22.0) matches the three `ghcr.io/techiebutler/freeframe-*`
tags. With a temporary `.env` holding the 24 variables `template.toml` generates, run
`docker compose config --quiet` in the blueprint directory: it must pass, and it must fail if
`DATABASE_URL`, `REDIS_URL` or `JWT_SECRET` is removed (the API reads `Settings` at import, so
those three are not optional).

## Dokploy integration

1. Open the PR preview, search for **FreeFrame**, and copy the Base64 import configuration.
   Import it into a new Compose service and deploy with the generated environment. No
   variable needs editing for a first run.
2. **Domains.** Three must exist after import: the main domain on `freeframe:3000`, the same
   main domain with path `/api` and **Strip Path** on `freeframe-api:8000`, and a second
   domain on `freeframe-silo:9000`. Verify `https://<main-domain>/api/health` answers through
   the strip-path router, and that the web app itself loads at `https://<main-domain>/`.
3. **First start.** Wait for `freeframe-postgres`, `freeframe-redis` and `freeframe-silo` to
   report healthy; the API then runs `alembic upgrade head` before gunicorn. Check the deploy
   log for a completed migration and no restart loop, then complete the setup wizard — the
   first account becomes the super admin, with a password, without any mail server.
4. **Storage.** The API creates the bucket and its CORS rules on startup from `FRONTEND_URL`.
   Confirm `https://<storage-domain>` is reachable in a browser (a 404/`AccessDenied` XML is
   fine, a connection error or certificate warning is not). Never expose the console (9001).
5. **A real upload.** Create a project, upload a short 1080p clip. The browser PUTs parts
   straight to the storage domain (presigned, so no proxy limit applies) and the
   `freeframe-worker` transcodes it on the CPU: the deploy log shows the ffmpeg backend as
   `cpu`, and the asset becomes playable at 1080p/720p/360p. Check that the poster, the HLS
   streams and the download rendition appear, and that a second version can be compared with
   the first frame by frame.
6. **Collaboration.** Add a comment at a timecode and a drawing annotation, then create a
   share link and open it in a private window: the reviewer sees the player and comments but
   no admin UI. Verify an approval decision is recorded.
7. **Restart and recreation.** Force a redeploy (recreate the containers). Confirm the super
   admin login, the project, the uploaded media and every rendition survive, and that the
   bucket still holds the objects — `freeframe-postgres-data`, `freeframe-redis-data` and
   `freeframe-silo-data` are the only state.
8. **HTTPS.** With a real domain, enable it on all three domains and change
   `FRONTEND_URL` and `S3_PUBLIC_ENDPOINT` to `https://` in the same redeploy, then recreate
   the API so the bucket CORS is rewritten. Verify uploads and playback still work (a
   scheme mismatch shows up here and nowhere else). Leaving everything on `http://` is the
   supported default and needs nothing. A `*.traefik.me` host cannot serve a trusted
   certificate: over HTTPS there, every part `PUT` fails with
   `ERR_CERT_AUTHORITY_INVALID` and the upload sits at 0%.
9. **Optional settings.** Set `SMTP_*` only in Dokploy's Environment, redeploy, and check
   magic-code login and an invitation email against a local capture server. Uncomment
   `TRANSCODER_CPU_LIMIT = "40%"` (and `TRANSCODING_CONCURRENCY = "2"`) in the imported
   config, redeploy the transcoding worker, and confirm the log reports the budget while a
   second upload waits behind the first instead of both encoding at once.

## Scope

These checks validate the template and core workflows. Real SMTP providers, an external S3
bucket (R2/B2/AWS), HEVC 10-bit and HDR sources, large 4K ladders, Garage or other S3
implementations, and long-running retention sweeps each need their own setup and are not
implied by a healthy container. Intel (VAAPI) transcoding is not part of this template: the
published images ship NVENC only, and there is no GPU here.

## Verified configuration

Fill this in from your own run — do not copy it from a template author's report.

- Tested on: `<date>`, Dokploy `<version>`, Traefik `<version>`, `<host arch>`.
- Images: `ghcr.io/techiebutler/freeframe-api:1.22.0`, `ghcr.io/techiebutler/freeframe-web:1.22.0`.
- Result: `<what passed>`, `<what could not be exercised, and why>`.
