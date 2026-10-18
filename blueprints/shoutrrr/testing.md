# Testing Shoutrrr

Use a disposable Dokploy project and test accounts. Never publish test posts to real destinations without permission.

## Repository checks

From the repository root:

```sh
node build-scripts/generate-meta.js --check
cd build-scripts
pnpm exec tsx validate-docker-compose.ts --file ../blueprints/shoutrrr/docker-compose.yml --verbose
pnpm exec tsx validate-template.ts --dir ../blueprints/shoutrrr --verbose
cd ../app
pnpm install --frozen-lockfile
pnpm run build
```

Confirm that metadata and the pinned image both identify version 1.5.4. With a temporary `.env` containing `APP_KEY` and `APP_URL`, run `docker compose config --quiet` in the blueprint directory. Removing either required value must fail. No social credentials, SMTP settings, database passwords, or Redis settings should be needed for the default deployment.

## Dokploy integration

1. Open the PR preview, search for **Shoutrrr**, and copy the Base64 import configuration. Import it into a new Compose service. Confirm that `APP_KEY` is a `base64:` value decoding to 32 bytes and that the generated domain routes to `shoutrrr:8080`.
2. Deploy with the default environment. Wait for `/up` and the Docker health check to succeed. Check the deployment log for completed migrations, then confirm the web server, worker, and scheduler are running. There should be no host port bindings on the application container.
3. Open the domain in a browser, register the first owner, and reach the dashboard without configuring email or social credentials. In a fresh session, confirm further public registration is unavailable and unauthenticated API requests receive 401.
4. Generate a workspace API key. Create a draft, upload an image, and verify that both are saved. Connect a disposable publishing destination, schedule a post, and let the bundled scheduler and queue worker publish it. Verify the saved remote ID and the destination's received content. A local mock can exercise this flow without sending real messages.
5. Stop/start the service and force a container recreation through Dokploy. Confirm that the original owner, API token, draft, connected-account credentials, uploads, and original `APP_KEY` still work. Check that the container is healthy with no unexpected restarts or application errors.
6. Follow the HTTPS instructions. Verify HTTPS redirects, asset loading, secure session cookies, login, and API access through Dokploy's proxy. A local certificate tests TLS termination; public DNS and certificate issuance require a reachable deployment.
7. To test an optional variable, add it only in Dokploy Environment and redeploy. Confirm it reaches the container and Laravel's cached configuration. Test optional SMTP with a local capture server before using a real provider; verify password-reset mail delivery and the change in email-verification behavior.

## Scope

These checks validate the deployment template and selected application workflows. Live OAuth permissions, provider app review, public certificate issuance, real social-platform delivery, external databases/queues, S3 permissions, and all advanced upstream feature combinations need their own credentials and infrastructure. They are not implied by a healthy container or a successful mock response.
