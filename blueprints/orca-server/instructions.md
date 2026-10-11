# Orca Server

Runs `orca serve`, the headless Orca runtime, following the official
[headless Linux server guide](https://github.com/stablyai/orca/blob/main/docs/reference/headless-linux-server.md).
Orca publishes no container image, so the service is built from the pinned
upstream release AppImage (`v1.4.205`, amd64 or arm64) on the first deploy.
The first deployment therefore takes a few extra minutes.

The domain serves the runtime WebSocket and its web client. Every client,
browser included, connects with a pairing link printed in the logs.

## Pair a client

1. Open the `orca-server` service logs in Dokploy.
2. Copy the `Pairing URL: orca://pair?code=...` line printed after
   `Orca server ready`. The `Web client URL` line next to it opens the same
   runtime in a browser, already paired.
3. In the Orca desktop app, open **Settings > Remote Orca Servers** and paste
   the link. From a CLI:
   `orca environment add --name my-server --pairing-code 'orca://pair?code=...'`.

The pairing link is a credential: share it only with the client you are
pairing. Paired devices are stored in the persistent volume, so clients
reconnect after a redeploy or an upgrade without pairing again.

## Pair the Orca mobile app

The mobile app needs a mobile-scoped link, which the default link is not.
Set `ORCA_SERVE_ARGS=--mobile-pairing` in the environment and redeploy: the
logs then print a mobile pairing QR code and link instead of the desktop one.
Scan it from the app, then clear `ORCA_SERVE_ARGS` and redeploy. Devices
already paired stay paired either way. On a phone, the `Web client URL` also
works in the browser without this step.

## HTTPS

`ORCA_PAIRING_ADDRESS` is the address advertised to clients. It defaults to
`http://<your-domain>` (plain WebSocket through Traefik; the pairing channel
itself is end-to-end encrypted). Once HTTPS is enabled on the domain, set it to
`https://<your-domain>` in the environment and redeploy so clients dial
`wss://`.

## Coding agents

The image ships Orca, git and the Linux libraries it needs, but no coding
agent. Install the agents you use from an Orca terminal on this server; they
land in `/home/orca/.local/bin`, which is on `PATH` and persisted in the
`orca-home` volume together with their credentials, your repositories and
Orca's state (`/home/orca/.config`).

Example for Claude Code: `curl -fsSL https://claude.ai/install.sh | bash`.

## Upgrade

`orca serve` never updates itself. To upgrade, change the `ORCA_VERSION`
build argument in the compose file and redeploy. State lives in the
volume, not in the image, and newer releases migrate it on load.

## Logs and secrets

D-Bus and OS keyring errors at startup are expected in a container and
harmless. Without a keyring, Orca stores its secrets unencrypted in the
`orca-home` volume: treat that volume as sensitive.
