# Testing WUD

Use a disposable Dokploy instance and synthetic workloads. Do not apply update triggers to production containers during template verification.

1. Run the repository's metadata, Compose, and TOML validators and build the catalog. Confirm that only the new blueprint files changed.
2. Import the Base64 configuration from the PR preview into a fresh Dokploy Compose service. Enable isolated deployment, retain the generated credentials, and deploy without registry or notification credentials.
3. Check both service health states. Anonymous GET `/health` should return 200, while `/api/containers` must return 401 and the dashboard must require login. Verify wrong-password rejection and successful login.
4. Inspect the effective local watcher: host `wud-socket-proxy`, port `2375`. Trigger a scan and confirm that a known disposable container appears with the correct image, status, and registry result. Health alone does not verify scanning. Confirm that no update triggers are registered.
5. From inside the isolated stack, check the proxy: GET `/_ping`, `/containers/json`, and `/images/json` should work. Requests to disabled groups such as `/volumes` and Docker write requests should return 403. Use a disposable nonexistent container ID for a stop request, then verify real containers are unchanged. The WUD container must have no Docker socket mount.
6. Change a preference, create a read-only test user, issue a read-scoped API token, and snooze a discovered container. Recreate WUD through Dokploy while preserving its volume. Sign in again if necessary and verify the user, preference, token, snooze, and stored container records survive.
7. In the disposable installation, change the bootstrap administrator's password only in WUD, restart, and verify that the Environment value is reapplied. Then rotate it through Dokploy and confirm the new value works. Additional users must remain intact.
8. Exercise opt-in monitoring with `WATCHBYDEFAULT=false` and a `wud.watch=true` workload. If testing notifications, use a local mock endpoint and assert its received payload rather than sending real messages. Keep Docker write access blocked throughout.
9. Enable HTTPS in Dokploy and verify login, API access, dashboard assets, and live events through Traefik. Check browser errors and server logs. Record the upstream cookie behavior described in [instructions.md](instructions.md); do not claim Secure/SameSite flags that the application does not set.

Record image tags, Dokploy version, registry results, tested optional providers, and any limits in the PR. Use synthetic data in screenshots. Public certificate issuance and every external notification/registry provider require separate checks. Remove only the disposable test resources after collecting evidence.
