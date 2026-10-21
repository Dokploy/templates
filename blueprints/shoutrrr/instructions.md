# Shoutrrr

Deploys [Coollabs' Shoutrrr](https://github.com/coollabsio/shoutrrr), the social media scheduler requested in [#1075](https://github.com/Dokploy/templates/issues/1075). This is a different project from the Containrrr notification library with the same name.

The pinned image runs the web server, queue worker, and scheduler together. SQLite stores accounts, drafts, schedules, sessions, and queued jobs. Separate volumes persist the database and storage, including uploads and generated API signing keys. PostgreSQL, Redis, email, and social-provider credentials are **not required to start**. Use one application replica with these SQLite defaults.

## Deploy

1. Import the template into a Docker Compose service in Dokploy. Keep its generated `APP_KEY`; it encrypts saved credentials. The image initializes the database and runs migrations automatically.
2. Before creating accounts or connecting social platforms, point your domain at Dokploy and enable HTTPS with a certificate in **Domains**. Keep the service port at **8080**. Set the following in **Environment**, then redeploy:

   ```dotenv
   APP_URL=https://social.example.com
   OCTANE_HTTPS=true
   SESSION_SECURE_COOKIE=true
   ```

   The generated HTTP address supports initial deployment checks. For local HTTP testing, use the generated defaults instead. `TRUSTED_PROXIES=*` supports Dokploy's TLS termination; the application has no published host port. Restrict it to your proxy IPs/CIDRs if other untrusted containers can reach the application directly.
3. Open the domain and register the first account. It becomes the instance owner even though public registration defaults to disabled. Claim it promptly, or restrict access at your proxy until setup finishes. Later users need an invitation unless the owner enables registration. Instance settings saved in the UI take precedence over the environment defaults.
4. Connect the platforms you use under **Accounts**, then create a draft or schedule a post. Workers and the scheduler must remain enabled for scheduled publishing.

Dokploy passes additional variables from **Environment** through the service's optional `.env` file. Add only settings you need, then redeploy to rebuild Laravel's configuration cache. See the [complete environment reference](https://github.com/Dokploy/templates/blob/canary/blueprints/shoutrrr/environment.md) for required, conditional, advanced, and build-only variables. Empty values and omitted values can behave differently; do not paste the entire upstream example with blank entries.

## Optional integrations

**Email:** `MAIL_MAILER=log` allows local setup without an email server; messages go to application logs and are not delivered. In this mode Shoutrrr does not enforce email verification. Configure a working mail transport before relying on password resets or emailed invitations. Switching to SMTP also enables email verification, so test delivery before inviting users.

```dotenv
MAIL_MAILER=smtp
MAIL_SCHEME=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=your-user
MAIL_PASSWORD=your-password
MAIL_FROM_ADDRESS=social@example.com
MAIL_FROM_NAME=Shoutrrr
```

Use your provider's TLS settings (`smtps`/465 for implicit TLS). Mail API providers can use `postmark`, `resend`, or `ses` with the corresponding credentials listed in the environment reference.

**Publishing accounts:** X, LinkedIn, Facebook/Instagram, and Threads each require the relevant developer application's credentials only when connecting that platform. Set its client ID, client secret, and redirect URI before connecting. Register the same redirect URI with the provider:

| Platform | Variables | Redirect path on `APP_URL` |
| --- | --- | --- |
| X | `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_REDIRECT_URI` | `/accounts/callback/x` |
| LinkedIn | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI` | `/accounts/callback/linkedin` |
| Facebook and Instagram (shared Meta app) | `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `FACEBOOK_REDIRECT_URI` | `/accounts/callback/meta` |
| Threads (separate app) | `THREADS_CLIENT_ID`, `THREADS_CLIENT_SECRET`, `THREADS_REDIRECT_URI` | `/accounts/callback/threads` |

Provider permissions, app review, and account eligibility still apply. Bluesky app passwords and Discord webhooks are entered in the UI and need no deployment credentials. Bluesky OAuth requires publicly reachable HTTPS metadata. Social sign-in is separate from publishing: enable `SOCIALITE_ENABLED=true`, select `SOCIALITE_PROVIDERS`, and configure the matching credentials. Google sign-in uses `/auth/google/callback`.

**Media:** Local public storage works by default. Social platforms must be able to fetch your HTTPS media URLs. To use S3-compatible storage, configure `FILESYSTEM_DISK=s3`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`, and `AWS_BUCKET`; optionally set `AWS_ENDPOINT`, `AWS_URL`, and `AWS_USE_PATH_STYLE_ENDPOINT`. Configure public access for the media you intend to publish. `PUBLIC_IMAGES_DISK` can select a separate public image disk.

## Backups and maintenance

Back up **both volumes** and the original **`APP_KEY`** together. Stop the service while taking a filesystem backup of SQLite to keep the database and any journal/WAL files consistent. Storage holds uploads and Passport signing keys. Never replace `APP_KEY` during an ordinary upgrade or redeployment.

Keep one replica and the bundled worker/scheduler for this deployment. For larger installations, provision an external database/queue and follow upstream's scaling guidance; changing `DB_CONNECTION` alone does not migrate existing SQLite data or add a database service. Keep `DB_DATABASE` at its mounted path with SQLite. The health check covers the web endpoint; also check database access, worker/scheduler status, and failed jobs when diagnosing missed posts.

Upgrade by changing the pinned image version after backing up, then redeploy and check migrations, health, and a scheduled test post. The container runs as upstream's non-root user, and Docker logs rotate at three 10 MB files. See [testing notes](https://github.com/Dokploy/templates/blob/canary/blueprints/shoutrrr/testing.md) for validation steps and their scope.
