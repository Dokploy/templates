# Testing Dossier

Use disposable data and a fresh Dokploy Compose service. Do not run upstream's database-resetting end-to-end suite against an existing installation.

1. Validate metadata, Compose, and TOML with the repository's build scripts, then build the template catalog.
2. Import the Base64 configuration from the PR preview into Dokploy. Generate the password hash using the pinned image's `hash-password` command. Keep both generated secrets, set the hash, and deploy without AI or job search credentials.
3. Confirm both services become healthy and GET `/api/health` returns HTTP 200 with `status: ok`, `db: ok`, and the pinned version. A blank password hash must fail Compose interpolation; a plaintext value must be rejected by the app without logging the value.
4. Open the generated domain. Check that private pages require login, a wrong password is rejected, and the chosen password works. Save a synthetic profile, reload it, and download a base resume PDF. Verify that the downloaded bytes begin with `%PDF-` and contain the expected profile text.
5. For an optional AI integration test, use a local OpenAI-compatible mock with synthetic responses. Configure it in Settings, create an application from a pasted posting, and check the generated application documents. This verifies request handling without paid API calls; it does not validate a live provider's credentials or model quality.
6. Export data, then exercise import/restore only on the disposable installation. Confirm backups appear under `/data`. Recreate the app container and redeploy through Dokploy; profile, applications, database credentials, and backup files must survive.
7. Enable HTTPS on the Dokploy domain, redeploy, and check login, secure cookies, and PDF generation through Traefik. A local test certificate is sufficient for proxy behavior; public certificate issuance requires a real domain.
8. In the disposable fixture, stop PostgreSQL temporarily: `/api/health` should return 503, then recover after PostgreSQL restarts. Inspect app and database logs for migration, permission, connection, and browser errors.

Record the image versions, Dokploy version, checks, and integration limits in the PR. Capture screenshots using synthetic data only. Remove the test service, its volumes, and test images after collecting evidence.
