# NetBird

Runs a self-hosted [NetBird](https://netbird.io) management plane — the
open-source, WireGuard-based overlay network that connects your devices,
servers and containers into one private mesh with SSO, access policies and
exit nodes.

The template deploys two services on **one domain**:

- `netbird-server` — the combined management + signal + relay + STUN server
  (`netbirdio/netbird-server`), with its **embedded Dex identity provider**,
  so there is no external IdP to configure. It serves the dashboard API under
  `/api` and `/oauth2`, the relay under `/relay` and `/ws-proxy`, and
  exposes STUN on UDP 3478 (in the expose format Dokploy requires for blueprints; peer connections fall back to the built-in relay over the domain whenever direct NAT traversal is unavailable).
- `dashboard` — the official web dashboard (`netbirdio/dashboard`) on `/`.

A small `config-init` container renders the server `config.yaml` on first
start from the domain and the secrets Dokploy generates for the deployment
(auth secret, session-cookie key, store encryption key — all `${base64:32}`).

**Why the Traefik labels?** NetBird clients talk to the management and signal
services over gRPC (HTTP/2 cleartext, h2c, on the server). Dokploy domains
cannot express the h2c scheme, so the three gRPC paths
(`/management.ManagementService`, `/signalexchange.SignalExchange`,
`/management.ProxyService`) are routed with Traefik labels baked into the
compose; everything else uses regular Dokploy domains.

Tested on Dokploy (2026-11-21): deployed live at netbird.syn-code.win —
admin account created through Instance Setup, peers connected from Windows,
Android and Docker, an internal-only service (no domain, no ports) reached
through the mesh from phone and laptop, and an exit node verified end to end
(the laptop's public egress IP became the server's).

## First run

1. Open your domain — the dashboard shows **Instance Setup**; create the
   admin account.
2. Add your first device from the dashboard (**Peers → Add Peer**) or create
   a reusable setup key (**Settings → Setup Keys**) for servers and
   containers.
3. If your domain sits behind **Cloudflare**, enable **Network → gRPC** in
   the Cloudflare dashboard — otherwise the proxy blocks the clients' gRPC
   management connection and peers never come online.

## Exit nodes

To route a device's traffic through a server, open the dashboard:
**Peers → (the routing peer) → Set Up Exit Node**, and distribute the route
to a **dedicated group of your devices only — never to `All`**. `All`
auto-includes every peer, including routing peers themselves. The companion
**NetBird Client** template runs a hardened routing peer for exactly this
role.

## Data

Everything lives in the `netbird_data` volume (SQLite store in
`/var/lib/netbird`); the generated server config is in the `cfg` volume.
Back up `netbird_data` — it is your whole network state.

## Security notes

- `AUTH_CLIENT_SECRET` for the dashboard must stay **empty**: the embedded
  Dex IdP registers the dashboard as a public client, and any value breaks
  sign-in with `invalid_client`.
- All server secrets are generated per deployment by Dokploy; nothing secret
  is baked into the template.
- The server trusts the reverse proxy headers from Dokploy's Traefik
  (`trustedHTTPProxies`), which is what makes the single-domain path routing
  work.
