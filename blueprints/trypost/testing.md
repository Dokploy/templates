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
