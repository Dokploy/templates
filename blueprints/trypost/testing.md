# Testing TryPost

Use a disposable Dokploy project, generated test credentials, and local integration endpoints. Do not publish test posts to real accounts without permission.

## Repository validation

From the repository root:

```sh
node build-scripts/generate-meta.js --check
cd build-scripts
pnpm exec tsx validate-docker-compose.ts --file ../blueprints/trypost/docker-compose.yml --verbose
pnpm exec tsx validate-template.ts --dir ../blueprints/trypost --verbose
cd ../app
pnpm install --frozen-lockfile
pnpm run build
```

Use a temporary `.env` with the generated values to run `docker compose config --quiet`. Missing required application, database, Redis, Reverb, or domain values must fail clearly. Optional mail, AI, Telegram, and OAuth credentials must not be needed for the default deployment.

## Dokploy checks

1. Open the PR preview, search for TryPost, copy its Base64, and import into a fresh Docker Compose service. Confirm the generated key decodes to 32 bytes and the domain targets `trypost:80`.
2. Deploy with the generated defaults. Confirm the browser-assets build, migrations, initial-user provisioning, web health, PostgreSQL, and authenticated Redis succeed. Verify Horizon, the scheduler, and Reverb start, with no application host ports published.
3. Sign in using the initial account. Verify that the calendar works without optional integrations and public registration is unavailable. Unauthenticated API calls must receive 401. Create a workspace API token and exercise a saved draft and image upload.
4. Enable a disposable publishing destination using a local API mock. Schedule a post, let the bundled scheduler/Horizon process it, and verify the captured content and saved remote publication ID. Verify browser WebSocket handshake, authenticated channel subscription, and an event delivered through Reverb.
5. Follow the HTTPS setup, rebuild the assets for HTTPS, and check login, secure cookies, media access, and WebSockets through Dokploy's proxy. A local certificate can test TLS routing; public ACME issuance requires a reachable deployment.
6. Stop/start and force container recreation. Check that database records, media bytes, decrypted credentials, `APP_KEY`, RSA key hashes, and the original API token survive. Changing initial-user variables must not create another user or reset the existing password. Removing the bootstrap password after setup must still allow restart.
7. Test an optional runtime variable entered only in Dokploy Environment, then confirm Laravel's cached configuration receives it. Test mail delivery with a local SMTP capture server before using a real provider.
8. Inspect container logs, health, and restart counts. Test restored backups and version-specific migrations separately before upgrading an existing installation.

## Limits

These checks cover the template and selected workflows, not every combination of the upstream application's environment variables. Live OAuth, provider permissions/review, real social delivery, public certificate issuance, external storage/database/queue services, and paid AI providers need separate credentials and infrastructure. A mock success does not verify a real provider's configuration.

## Verified results

Tested on 2026-10-18 on Linux amd64 with Dokploy 0.30.8, Docker Compose 5.6.0, Traefik 3.6.7, PostgreSQL 18.6, and Redis 8.10.2. The official application image was `ghcr.io/trypostit/trypost:2.0.0`, manifest digest `sha256:04c8e9ba48f97091106daa247afeb3be9ec5c395671bbc7ad73adf7f42334155`, source revision `7b9eeec9c68a68f4ae72a63e9eae2726b9fb44d0`.

- Metadata, Compose/TOML validation, required-value guards, and catalog production build passed. The catalog reports its existing JavaScript chunk-size warning. The environment inventory covers all 500 active application variables and the 239 keys in the upstream environment examples.
- The PR-preview catalog exported byte-identical Compose/TOML files. Its Base64 payload imported into a fresh Dokploy service, rebuilt browser assets for the generated domain, initialized the database/account, and became healthy without optional integration credentials.
- The initial user signed in and reached the calendar. Public registration returned 404, and unauthenticated API calls returned 401. Horizon, scheduler, Reverb, Nginx, and PHP-FPM ran successfully. Redis rejected unauthenticated commands.
- An API key created a draft and uploaded an image. A signed Telegram connection code plus authenticated incoming webhook linked a **local mock channel**. The actual scheduler and Horizon published scheduled posts to a **local Telegram API mock**, which captured the expected content; TryPost saved publication IDs/URLs.
- Browser checks confirmed WebSocket handshake, private-channel subscription, and live post events through the Dokploy domain. After an HTTPS asset rebuild, the same checks passed over WSS, along with fresh login, secure cookies, API access, and public media access. TLS used a **local/default certificate**.
- Stop/start and forced container recreation preserved the original user/password, API token, draft, exact media bytes, application key, RSA key hashes, and a decrypted synthetic account token. Changing initial-user variables and removing the bootstrap password did not reset or duplicate the existing user.
- Additional runtime variables entered only through Dokploy Environment reached Laravel's cached configuration. Optional SMTP delivered a password-reset message to a **local capture server** with the correct public HTTPS origin.
- The three application services finished healthy, with zero unexpected restarts, no published host ports, and no application errors in their logs. No JavaScript errors were observed in the verified browser flows.

No messages were sent to real social accounts. Live OAuth/provider delivery, paid AI calls, public ACME issuance, external storage, and other database/queue combinations were not exercised. Existing-version upgrade paths were not tested; this is a fresh-install template.
