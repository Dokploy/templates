# Harbor 2.15.4 with Trivy

This template installs Harbor on one Linux amd64 Docker host. Start with 4 vCPU,
8 GB RAM and 160 GB SSD for Harbor, plus resources for Dokploy and other apps.
Docker Engine 27+ and Compose 2.35+ are required for named-volume subpaths.
Use Docker Compose mode, not Docker Stack/Swarm mode.

## Before the first deployment

1. Publish this fork, including the init source commit referenced by
   `tools/build-source.json`, to the public repository
   `https://github.com/XnCN/harbor-dokploy-template`. Git builds cannot use
   unpublished files. No image registry or GHCR publication is required.
2. Import Harbor from the template catalogue or paste its Base64 configuration
   into **Compose → Advanced → Import**.
3. Keep the generated `HARBOR_INSTANCE_ID` and both generated passwords.
   The instance ID is the permanent volume prefix; never reuse it for another
   deployment. Re-importing generates new credentials and a new volume prefix.
4. Set the domain to a dedicated FQDN pointing to the Dokploy host. Ensure
   `HARBOR_HOSTNAME` matches the domain exactly, without a scheme, port or path.
   Change both before the first deployment if replacing the generated domain.
5. Confirm domain routing uses service **proxy**, port **8080**, path **/**,
   HTTPS and your Let's Encrypt certificate. Enable HTTP-to-HTTPS redirection
   in Dokploy. Do not add Basic Auth/ForwardAuth in front of Harbor.
6. Deploy. The init service must finish with exit code 0 before workloads start.
   Log in at `https://YOUR_DOMAIN` as **admin**, with `HARBOR_ADMIN_PASSWORD`.

Dokploy supplies network isolation and Traefik routing. Do not add host ports,
container names or a shared `dokploy-network`. Path-based hosting such as
`/harbor` is unsupported. TLS terminates at Dokploy; internal traffic is HTTP.

## Registry and scanning

Create projects and configure quotas, access, scan-on-push and retention in the
Harbor UI. The template does not automatically create projects or apply policies.
Trivy is registered as the default scanner; its initial vulnerability database
download may take time and needs outbound access to GHCR. Set
`TRIVY_GITHUB_TOKEN` if your environment needs an authenticated download.

User self-registration is disabled. Only admins may create projects. Default
quota is 20 GiB per project; set `PROJECT_QUOTA_GIB` before installation to change
it. Advanced resource/configuration defaults are in `docker-compose.yml`.

No automated backup, restore, scheduled maintenance, policy jobs or Docker socket
mounts are included. Arrange an independent backup of all persistent volumes.

## Restart and configuration changes

Regular redeploys preserve data and generated encryption/signing keys. Changing
the domain, init code, Harbor version or generated configuration requires an
explicit reconfiguration. Init fails clearly on unexpected changes.

For a configuration change, use a terminal on the deployment host in the
Dokploy-generated Compose directory, with its existing Compose project name and
Environment values. The commands below assume `docker compose` already resolves
that exact deployment. Keep its volume prefix and volumes unchanged.

1. Back up every persistent volume, then stop the deployment and scheduled redeploys.
2. Save the new Environment values and regenerate the Dokploy Compose file
   without starting the workloads.
3. Stop all services, build the new init image, run init alone, then start Harbor:

```sh
docker compose stop
docker compose build harbor-init
docker compose run --rm --no-deps harbor-init --reconfigure
docker compose up -d --wait --wait-timeout 600
```

Do not use `down --volumes`. `--reconfigure` refuses reachable Harbor services
and preserves existing keys. It is not a database-version migration tool.
Do not change `HARBOR_DB_PASSWORD` for an existing database: changing the env
value does not change the database user's password. Similarly, changing
`HARBOR_ADMIN_PASSWORD` does not rotate the existing admin's password; use the UI.
Follow Harbor's official migration procedure before upgrading a populated install.

Missing persistent keys are a fatal error. Restore the original complete data;
do not delete `render-state.json` or regenerate signing keys to bypass the check.
Prepare errors are captured privately as `prepare-error.log` in the control
volume and must be reviewed for sensitive data before sharing.

## Acceptance checks on your Dokploy instance

- Confirm the init service completed, all workloads are healthy and HTTPS is trusted.
- Log in to Harbor, create a private test project and enable scan-on-push.
- Run `docker login YOUR_DOMAIN`, push a small image and pull it back.
- Run a Trivy scan and confirm a report appears after the vulnerability DB downloads.
- Restart/redeploy and verify the project, image, credentials and signing keys persist.

Local Docker tests do not validate a public domain, certificate issuance, a full
Trivy DB download or your Dokploy version's Compose/domain rewriting.
