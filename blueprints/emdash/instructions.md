# EmDash

This template builds EmDash **1.4.0** from its [release commit](https://github.com/emdash-cms/emdash/tree/10beb8c5a99e41c3a8554b09ac5123c4dddc8d11), using the upstream Dockerfile. It packages the official Blog theme, SQLite, and local media storage in one Node.js service. The scheduler runs inside that service; a separate database or worker is unnecessary.

## First deployment

1. Import the template. In Dokploy, assign your final domain to service `emdash`, port `4321`, and enable HTTPS with a valid certificate.
2. Set `EMDASH_SITE_URL` to that exact public origin, for example `https://blog.example.com`, without a path. The generated value uses the initial Dokploy domain. Update it if you change the domain.
3. Deploy. The first build compiles the upstream monorepo and downloads dependencies and fonts. Allow several minutes and at least 4 GB of build memory, plus memory for Dokploy and other services. Subsequent builds can reuse Docker's cache.
4. Open `https://<your-domain>/_emdash/admin/` promptly, complete the site setup, and register your administrator passkey. The first visitor can claim an unconfigured site; keep access restricted until setup is complete. Use your final HTTPS domain from the start: passkeys are bound to it. No default password or email provider is required.
5. Create and publish a post, then open its public page. Upload a media file and verify its URL before adding real content.

Use Dokploy's isolated deployment option. Only Traefik should reach the app: the template trusts its `X-Forwarded-For` header for client-IP rate limiting. No host port or custom network is needed. Run one replica with these local SQLite and filesystem volumes.

## Optional features

The stock Blog build works without cloud accounts, AI keys, or email credentials. Email delivery, magic links, and email recovery require a provider plugin; no production console email provider exists. Register another passkey and keep recovery access before relying on the site.

Plugins with encrypted secret settings require `EMDASH_ENCRYPTION_KEY`. Generate it with the official command on Node.js 22.23.4 or later:

```sh
npx --yes emdash@1.4.0 secrets generate
```

Copy the complete `emdash_enc_v1_...` value into Dokploy's Environment tab and redeploy. Keep it private and back it up separately. The template leaves it empty because Dokploy's generic password/base64 helpers do not produce this application's required key format.

Adding email or authentication providers, changing the theme, using PostgreSQL/S3, or enabling sandboxed plugins requires a custom Astro project/build. Setting provider credentials alone does not add those integrations to the stock Blog build. Its configuration includes no plugin sandbox runner. See [Node.js deployment](https://docs.emdashcms.com/deployment/nodejs/) and [plugin sandbox](https://docs.emdashcms.com/deployment/plugin-sandbox/).

## Persistence, backups, and upgrades

- `emdash-data` stores `/app/data/data.db`, including content, users, passkeys, settings, and automatically generated preview/IP secrets.
- `emdash-uploads` stores `/app/uploads`, including media and application-generated backup artifacts.
- Node's default filesystem session store is outside these volumes. Container recreation can sign users out; register a passkey so you can sign in again.
- Back up both volumes and any encryption key off-server. For a consistent offline SQLite backup, stop writes and copy the database together with any `-wal` and `-shm` files. Restore into an isolated installation and verify content, login, and media. The app's JSON archives are not a full restorable database backup; see [upstream recovery guidance](https://docs.emdashcms.com/guides/backups/).
- Before upgrading, take a verified recovery point and read the release notes. Change the pinned Git commit and metadata together, then rebuild. Pending core migrations run on the first request; a code rollback alone does not undo them. Keep the matching old build, database, media, and keys for recovery.

The upstream Dockerfile runs as root. Named volumes are writable without a separate ownership initializer; changing the user requires testing permissions for the database, uploads, and session directory. The health check queries setup state through the database, but does not prove media writes, passkey login, scheduled publishing, or optional integrations work. The build has no public origin at build time, so local media is served without Astro image optimization; the runtime origin still configures URLs and authentication.
