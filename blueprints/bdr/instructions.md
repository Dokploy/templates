# BDR Self-Hosted

Open source backup and disaster recovery platform: a control plane with a web
panel, agents for Linux, Windows and macOS, and client-side encrypted backups
powered by Kopia. This template runs the control plane, a Kopia Repository
Server (every agent gets its own repository user and only sees its own
snapshots) and a one-shot job that creates the repository certificate.

## Host requirements

- Two host ports must be free and reachable by the agents: `BDR_AGENT_PORT`
  (default `8443`, strict mTLS agent listener) and `BDR_KOPIA_PORT` (default
  `51515`, repository server). Both are published on the host because they are
  not HTTP that the proxy can terminate. If one is taken, change the variable
  in the Environment tab before deploying.
- Firewall: when the agents are on a private network or VPN, restrict both
  ports to the agents' networks. The product's security model is that the
  repository server is not exposed to the Internet.
- All state lives in the `bdr-data` volume: repository, certificates, internal
  CA and the control plane's state. Back it up.

## Before deploying

1. Enable **HTTPS** on the domain in Dokploy (Domains → edit → HTTPS). The
   admin token and the one-time enrollment tokens travel in these requests.
2. Review the Environment tab:

| Variable | Value |
| --- | --- |
| `BDR_ADMIN_TOKEN` | Generated. Panel login token (and service token for the API). |
| `BDR_SECRET_KEY` | Generated, 32 bytes in base64. Encrypts stored secrets. |
| `BDR_KOPIA_PASSWORD` | Generated. Repository master password. |
| `BDR_KOPIA_CONTROL_PASSWORD` | Generated. Credentials the control plane uses to manage repository users. |
| `BDR_PUBLIC_URL` | Panel/API base URL, as opened in the browser. Defaults to `https://<domain>`. |
| `BDR_PUBLIC_HOST` | Hostname the agents use for the mTLS listener and the repository server. Change it if they reach the server by another name or IP. |
| `BDR_AGENT_PORT` | Host port of the mTLS listener. Default `8443`. |
| `BDR_KOPIA_PORT` | Host port of the repository server. Default `51515`. |

**Back up these values.** `BDR_SECRET_KEY` and `BDR_KOPIA_PASSWORD` are bound
to the data volume: regenerating them on an existing deployment makes the
encrypted secrets and the repository unrecoverable.

Optional: add `BDR_ADMIN_EMAIL` and `BDR_ADMIN_PASSWORD` before the first
deployment to create the first panel user (otherwise log in with the token and
create users in the panel).

## Open the panel

Open the domain and log in with `BDR_ADMIN_TOKEN`. Enable TOTP for the panel
users. The first start creates the Kopia repository and its certificate; the
control plane logs `repositorio Kopia accesible por el plano de control` when
the repository is open.

## Connect agents

Panel → **Equipos → Añadir equipo** → pick the platform and copy the one-liner
on the machine to protect. The agent enrols through the panel URL and then
talks to the mTLS listener on `BDR_AGENT_PORT`; its backups go to the
repository server on `BDR_KOPIA_PORT`, pinned by the server certificate's
fingerprint (a self-signed certificate generated on the first start, valid for
10 years; kopia clients pin it by SHA-256, so no CA distribution is needed).

## Changing BDR_PUBLIC_HOST later

The control plane and the repository server follow the new host (the
repository certificate and its fingerprint do not change), but already
enrolled agents keep pointing at the old mTLS URL and go offline. Reconnect
each one from its panel page (**Reconectar**): it keeps its identity, groups,
plans and history.

## Updating and removing

- Update: edit the image tag in the compose file (e.g. to a newer
  `ghcr.io/juansoler/bdr-control:vX.Y.Z`) and redeploy. Data, agents and
  restore points are kept.
- Remove: deleting the service in Dokploy keeps the volumes unless you choose
  to delete them. `bdr-data` holds the only copy of the backups: export it
  first if you may need the data again.
