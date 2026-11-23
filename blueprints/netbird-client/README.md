# NetBird Client

Companion template to [NetBird](../netbird): runs the NetBird agent
(`netbirdio/netbird`) as a **routing peer** on a Docker host — the building
block for NetBird **exit nodes** and site-to-site routing into an existing
self-hosted NetBird network.

The agent runs host-networked and privileged (that is how the official
client container works), with one deliberate hardening on top:

- `NB_DISABLE_CUSTOM_ROUTING=true` — the peer **rejects default routes**
  (0.0.0.0/0 and larger prefixes). It can *serve* as an exit node for other
  devices, but it can never *install* a default route on the host it runs
  on, so a mis-distributed route cannot take the host offline. Do not remove
  this variable.

Tested on Dokploy (2026-11-21): deployed on the same host as the NetBird
server trial (netbird.syn-code.win), registered with a setup key, and
verified as an exit node — a Windows laptop in its distribution group
egressed with the server's public IP.

## Before you deploy

1. In the dashboard of your NetBird server, create a setup key
   (**Peers → Add Peer**, or **Settings → Setup Keys** for a reusable one).
2. Set the template variables:
   - `NB_SETUP_KEY` — the setup key from step 1.
   - `NB_MANAGEMENT_URL` — your NetBird domain, e.g.
     `https://netbird.example.com`.
   - `NB_HOSTNAME` — the name the peer shows in the dashboard.

## Make it an exit node

Deploying this template only joins the peer to your network. To route other
devices through it, open the dashboard: **Peers → (this peer) → Set Up Exit
Node**, and distribute the route to a **dedicated group of your devices
only — never to `All`**, which auto-includes every peer (routing peers
included).

## Data

The agent's identity and state persist in the `client_state` volume. If you
ever need the peer to register as a brand-new device (for example after
changing the management URL), delete the volume and redeploy — a registered
agent remembers its original management URL from its state.
