# AzerothCore + Portal setup

## What is created

This template deploys AzerothCore 3.3.5a, MySQL, extracted client data, and the web portal. It automatically:

- imports the AzerothCore databases;
- creates a restricted database user for the portal;
- enables the worldserver's SOAP endpoint on the private Compose network;
- creates separate portal administrator and SOAP service accounts with AzerothCore-compatible SRP6 credentials;
- configures the realm address and HTTPS portal domain.

The SOAP port is not published on the host. Only the portal and worldserver containers can reach it.

## Requirements

AzerothCore's published server images require an `amd64` host. Allow inbound TCP ports `3724` and `8085` through the Dokploy host firewall. These are game protocol ports and do not use the portal's HTTP domain.

The portal image is hosted on GitHub Container Registry. Until the package is public, configure Dokploy registry credentials for `ghcr.io` using a GitHub token with `read:packages`.

## First startup

The initial client-data download and database import can take several minutes. The services ending in `-client-data`, `-db-import`, `-db-init`, `-soap-config`, and `-bootstrap` are one-time initialization jobs and should exit successfully.

When `azerothcore-portal-world`, `azerothcore-portal-auth`, and `azerothcore-portal` are healthy or running, open the generated portal domain. Sign in with the values stored in `PORTAL_ADMIN_USERNAME` and `PORTAL_ADMIN_PASSWORD` in the Dokploy environment.

`PORTALSOAP` is a machine account used only for private SOAP calls. Do not use it as a player account or share its password. AzerothCore requires SOAP accounts to have administrator security level; the portal still restricts operations to its allow-listed commands.

## Connect a 3.3.5a client

Set `Data/<locale>/realmlist.wtf` to:

```text
set realmlist <REALM_ADDRESS>
```

Restart the client and sign in using an account created through the portal. If authentication works but realm selection fails, verify that `REALM_ADDRESS` resolves to the Dokploy host and TCP port `8085` is reachable.

## Security and backups

- Keep MySQL and SOAP private; do not publish ports `3306` or `7878`.
- Store Dokploy environment values as secrets and rotate the generated administrator password after first login.
- Back up the `azerothcore-portal-database`, `azerothcore-portal-config`, and `azerothcore-portal-client-data` volumes.
- Review orders marked `review` before retrying them; SOAP commands cannot carry idempotency keys.
