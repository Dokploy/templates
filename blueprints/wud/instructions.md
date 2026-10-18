# WUD (What's Up Docker?)

WUD watches Docker containers, checks their image registries for newer versions, and displays available updates in a web dashboard. This template runs WUD 9.5.0 with persistent SQLite storage and a Docker socket proxy that permits monitoring requests and blocks Docker writes. Notifications are optional; automatic container updates are not configured.

Official documentation: [Quick start](https://getwud.app/docs/quickstart/), [configuration](https://getwud.app/docs/configuration/), [Docker watcher](https://getwud.app/docs/configuration/watchers/), and [source code](https://github.com/getwud/wud).

## Deploy in Dokploy

1. Import the template. Dokploy generates `WUD_AUTH_ADMIN_PASSWORD`; the username defaults to `admin`. Keep the generated password private, or replace it with your own strong value.
2. Enable **Isolated Deployment** for this Compose service before deploying. Dokploy should place WUD and its socket proxy on the stack's private network. Do not add a domain or publish a port for `wud-socket-proxy`.
3. Set your domain to service `wud`, port `3000`, and enable HTTPS with HTTP redirection in Dokploy. Traefik terminates TLS; WUD uses HTTP inside the stack.
4. Deploy and wait for both services to become healthy. Open the domain and sign in using the values from the Environment tab.
5. Inspect the Containers page. The local watcher monitors running containers on the Docker host where this stack is deployed. Registry checks run hourly, with up to 60 seconds of jitter. Use the UI's watch action when you need an immediate scan.

No external database, registry account, notification service, or password-hashing command is required. Public registries work anonymously within their rate limits. Large hosts or frequent scans may need registry credentials.

## Monitoring scope and Docker access

`WUD_WATCHER_DOCKER_LOCAL_WATCHBYDEFAULT=true` discovers running containers automatically. Set it to `false` for opt-in monitoring, then add `wud.watch: "true"` to each monitored service's Docker labels. A `wud.watch: "false"` label excludes a container. These labels belong on the services being monitored, not in WUD's Environment tab.

Stopped containers are excluded by default. Set `WUD_WATCHER_DOCKER_LOCAL_WATCHALL=true` to include them. Optional include/exclude patterns, tag filters, digest tracking, and release links are covered in [environment.md](environment.md) and the [container label guide](https://getwud.app/docs/configuration/watchers/labels/).

Only the proxy mounts `/var/run/docker.sock`. This system socket is the intentional host bind mount; it must already exist on a normal Linux Docker host. WUD connects to `wud-socket-proxy:2375`, with container/image reads and Docker events allowed. `POST=0` blocks write methods, including container start/stop, exec, image pulls, and deletion. A read-only socket mount alone would not block those Docker API operations.

Container inspection can expose host workload metadata and environment values, so keep proxy access within the isolated stack. Do not expose port 2375 or broaden proxy permissions for normal monitoring. This template observes one Docker host; it does not automatically discover remote Dokploy servers or configure a Swarm/Kubernetes watcher.

## Notifications and updates

Add notification variables in Dokploy's Environment tab, then redeploy. WUD loads optional values from `.env`. For example, an optional Ntfy trigger needs:

```dotenv
WUD_TRIGGER_NTFY_ALERTS_URL=https://ntfy.sh
WUD_TRIGGER_NTFY_ALERTS_TOPIC=your-private-topic
```

Use your server's authentication settings where needed. See the official [trigger documentation](https://getwud.app/docs/configuration/triggers/) for supported providers and required credentials. No notification provider is required to install WUD.

Watcher, registry, and trigger settings are configured through the environment; their configuration pages in WUD display the effective settings. User accounts, preferences, and API tokens can be managed in the app.

The template does not configure Docker or Docker Compose update triggers. Keep changes to Dokploy-managed applications in Dokploy so its deployment configuration stays authoritative. Adding an updater would require a separate, deliberate change to the proxy permissions and deployment design. Triggers can run automatically when configured; do not add a Docker updater merely to test notifications.

## Passwords, persistence, and backups

WUD reapplies `WUD_AUTH_ADMIN_USER` and `WUD_AUTH_ADMIN_PASSWORD` on every startup, including an existing account. Rotate this administrator's password in Dokploy's Environment tab and redeploy. Changing only that account's password in WUD will be overwritten on the next restart. Additional users are stored in the database and can be managed in WUD.

The `wud-data` volume stores `/store`, including `wud.sqlite`, its WAL files, users, token hashes, preferences, monitored containers, history, and snoozes. Keep one WUD instance per volume. Back up the complete volume while WUD is stopped, or use a SQLite-aware backup method. Copying only the live `wud.sqlite` file can miss recent writes in the WAL. Keep an off-server copy and protect it as sensitive data.

The official image handles store creation and migrations. It runs as root; this template drops all Linux capabilities and prevents privilege escalation. Do not force a different UID without preparing and checking volume ownership. Back up before changing the pinned image version and review the [release notes](https://github.com/getwud/wud/releases).

### HTTPS and health behavior in 9.5.0

Use HTTPS and HTTP redirection for regular access. WUD 9.5.0 sets an HttpOnly session cookie, but its upstream implementation does not add Secure or SameSite cookie attributes. This template does not modify the published application image. You may need to sign in again after a container recreation or upgrade because WUD derives its session secret from the version and network interface.

GET `/health` is public HTTP liveness. It does not prove that Docker discovery or registry checks succeeded: also check the local watcher, discovered containers, and scan errors. The API and dashboard require authentication.

See [environment.md](environment.md) for settings and [testing.md](testing.md) for verification steps.
