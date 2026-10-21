# TryPost

Deploys [TryPost](https://github.com/trypostit/trypost) 2.0.0, requested in [#1214](https://github.com/Dokploy/templates/issues/1214), with PostgreSQL, authenticated Redis, persistent media/API keys, Horizon workers, the scheduler, and Reverb WebSockets.

## First deployment

1. Import the template into a Dokploy Docker Compose service. Change `INITIAL_USER_EMAIL` to your address before deploying. The generated `INITIAL_USER_PASSWORD` is the first login password; keep all generated application/database/Redis/Reverb secrets.
2. Point your domain at Dokploy and configure HTTPS in **Domains**, with the `trypost` service on port **80**. Set these environment values before using real accounts:

   ```dotenv
   TRYPOST_HOST=post.example.com
   APP_URL=https://post.example.com
   TRYPOST_PUBLIC_SCHEME=https
   TRYPOST_PUBLIC_PORT=443
   SESSION_SECURE_COOKIE=true
   ```

   `TRYPOST_HOST` contains only the hostname. The generated HTTP domain and port 80 support initial local checks. For a custom public port, include it in `APP_URL` and set `TRYPOST_PUBLIC_PORT` to the same value.
3. Deploy and allow the asset build and database migrations to finish. The template starts from the official versioned image and rebuilds **only its browser assets**, because the published bundle points WebSockets at `localhost:8080`. It leaves the application source and production PHP dependencies intact. A build-capable Docker Compose installation is required. Allow several minutes and sufficient RAM/disk for the first build.
4. Open the domain and sign in using `INITIAL_USER_EMAIL` and the generated password from Dokploy Environment. The template creates this verified user and workspace **only when the database has no users**. Public registration stays disabled in upstream self-hosted mode. Changing these bootstrap variables later does not reset an existing account or password; use the app's account settings/password recovery instead. After the first successful deployment, the initial password variable can be removed.
5. Finish any welcome steps, connect the platforms you use, and create a draft or schedule a test post. Additional users join through invitations. Configure delivered email before relying on invitations or password recovery.

The public hostname, scheme, port, and Reverb public key are browser **build inputs**. After changing any of them, redeploy with a rebuild; changing only runtime `VITE_*` variables cannot alter compiled assets. Both the app and WebSockets use the same domain/port through the bundled Nginx proxy; do not expose Redis, PostgreSQL, or Reverb's internal port 8080.

## Required and optional configuration

Dokploy generates `APP_KEY`, `DB_PASSWORD`, `REDIS_PASSWORD`, `REVERB_APP_ID`, `REVERB_APP_KEY`, `REVERB_APP_SECRET`, and the first-user password. On first startup, RSA signing keys are generated once into the persistent storage volume and loaded through Passport's `file://` settings. A partial/missing key pair after setup must be restored from backup; never replace a valid pair during an upgrade.

**No Telegram, SMTP, AI, Stripe, or social-provider credentials are required to start or log in.** `SELF_HOSTED=true` bypasses cloud billing, and telemetry is disabled. Add only the integrations you need in Dokploy **Environment**; the optional `.env` is passed through to the container. Redeploy after runtime changes so Laravel's configuration cache is rebuilt. See the [environment reference](https://github.com/Dokploy/templates/blob/canary/blueprints/trypost/environment.md) for the full versioned inventory and defaults.

### Optional email

The default `MAIL_MAILER=log` records messages without delivering them. The initial user is provisioned as verified, so a mail server is not needed for first login. For invitations and password resets, configure your SMTP provider and test delivery:

```dotenv
MAIL_MAILER=smtp
MAIL_SCHEME=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=your-user
MAIL_PASSWORD=your-password
MAIL_FROM_ADDRESS=post@example.com
MAIL_FROM_NAME=TryPost
```

Use your provider's TLS settings (`smtps` and port 465 for implicit TLS). API transports can use the supported Postmark, Resend, or SES credentials instead.

### Optional publishing and other services

OAuth publishing integrations need the provider's client ID, client secret, and exact callback URI registered in its developer portal. Use the `*_CLIENT_REDIRECT` variable names for this application:

| Platform | Variable prefix | Callback path on `APP_URL` |
| --- | --- | --- |
| LinkedIn | `LINKEDIN` | `/accounts/linkedin/callback` |
| X | `X` | `/accounts/x/callback` |
| TikTok | `TIKTOK` | `/accounts/tiktok/callback` |
| YouTube | `GOOGLE` | `/accounts/youtube/callback` |
| Facebook | `FACEBOOK` | `/accounts/facebook/callback` |
| Instagram | `INSTAGRAM` | `/accounts/instagram/callback` |
| Threads | `THREADS` | `/accounts/threads/callback` |
| Pinterest | `PINTEREST` | `/accounts/pinterest/callback` |
| Discord | `DISCORD` | `/accounts/discord/callback` |
| Google Business | `GOOGLE_BUSINESS` | `/accounts/google-business/callback` |

Discord additionally needs `DISCORD_BOT_TOKEN`. Telegram publishing uses `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, and `TELEGRAM_WEBHOOK_SECRET`; only configure it if you want Telegram. Follow upstream's webhook setup when enabling it. Bluesky/Mastodon use their connection flows in the UI. Provider app review, scopes, account eligibility, and public HTTPS still apply. Google/GitHub social login is separate from publishing and disabled by default.

AI features need the selected provider's API key; media imports need the selected service's credentials. Local public media storage works without S3/R2. When selecting object storage, provide the matching credentials, bucket, region/endpoint, and public media URL. Social platforms must be able to fetch media from your public HTTPS deployment.

## Operations and backups

Use one application replica with the bundled scheduler. The container runs upstream's Nginx, PHP-FPM, Reverb, Horizon, and scheduler processes; its root supervisor performs initialization and PHP-FPM workers use `www-data`. The web health check covers `/up`, so also monitor Horizon, Redis, database access, failed jobs, and WebSocket connectivity.

Back up PostgreSQL, Redis, the **entire storage volume**, and Dokploy Environment together. Storage includes uploaded media and RSA signing keys; `APP_KEY` is required to decrypt saved credentials. Redis persists queued jobs with AOF. Do not flush it or delete its volume while publishing jobs are pending. Coordinate maintenance around long-running jobs; the container allows a 60-second graceful stop, while some upstream jobs can run longer.

Keep `APP_URL`, domain settings, and browser build inputs in sync. Rebuild after changes to the public connection settings or the pinned upstream version. Back up before upgrades, read upstream's migration notes, and validate an upgrade against a restored copy first. This template targets a **fresh 2.0.0 installation**; it does not migrate an existing deployment from another template or version. Test procedures and verified boundaries are in [testing.md](https://github.com/Dokploy/templates/blob/canary/blueprints/trypost/testing.md).
