# Verification checklist

Use disposable data and your own final HTTPS domain. Never run development reset endpoints against an existing installation.

1. Run metadata, Compose, and TOML validation and build the template catalog. Confirm that the main service, metadata ID, domain target, and logo agree.
2. Import into a fresh Dokploy Compose service with isolated deployment enabled. Verify the pinned Git build, port `4321`, both named volumes, and the generated public-origin value. Enable HTTPS and update `EMDASH_SITE_URL` if the domain changes.
3. Deploy without optional keys or providers. Wait for a new successful deployment and a healthy container. Check setup status, the version endpoint, logs, and the public site through Traefik.
4. In a fresh browser context, complete setup and register a passkey over HTTPS. Verify the setup nonce cookie is Secure, HttpOnly, and SameSite=Strict. Sign out and sign in again with that passkey. Confirm anonymous access to private API routes is refused and production dev-bypass/reset routes cannot create sessions or reset data.
5. Create a post, save a draft, reload it, publish, and open the public page. Verify draft content remains private. Upload a disposable image, open its media URL, and compare its bytes. Schedule another post and await actual publication without manual intervention.
6. Remove only the application container and redeploy through Dokploy. Sign in again if needed. Verify the administrator/passkey, published and draft content, uploaded media, and settings survived.
7. Verify the health check fails when Node cannot serve requests and recovers afterward. Check database/media operations separately; an HTTP health response alone is insufficient.
8. Copy the Base64 from the PR preview catalog, decode it, and compare raw Compose/TOML to the committed files. Import that exact payload into a second fresh Dokploy service and repeat setup, publish, media, and persistence checks. Ensure its volumes and administrator are independent.
9. Before using plugins, generate a valid encryption key with the official CLI. Verify the integration with its own provider. This stock build includes neither an email provider nor a sandbox runner; do not claim external delivery or sandbox execution from basic CMS tests.

Record the tested platform, checks, screenshots, and untested boundaries in the PR. Keep credentials, passkey private material, session state, and local fixture details out of public evidence.
