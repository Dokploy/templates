# AzerothCore setup

## Before deploying

AzerothCore's published server images currently support `amd64` hosts only.

AzerothCore uses raw TCP connections rather than HTTP. Make sure TCP ports `3724` (authentication) and `8085` (world server) are free on the Dokploy host and allowed through its firewall.

The template generates `REALM_ADDRESS` with Dokploy's domain helper. Verify that this hostname resolves publicly to the Dokploy server. If it does not, replace `REALM_ADDRESS` in the service environment with the server's public IP address or another public DNS name, then redeploy.

## First startup

The first deployment downloads the client data and imports the authentication, character, and world databases. This can take several minutes. The `azerothcore-client-data`, `azerothcore-db-import`, and `azerothcore-realm-config` containers are initialization jobs and should exit successfully after completing their work.

## Create the first game account

After the `azerothcore` world server is running, attach to its console from the Dokploy host:

```bash
docker attach <azerothcore-worldserver-container-id>
```

Create an account and grant it administrator permissions:

```text
account create <username> <password>
account set gmlevel <username> 3 -1
```

Detach without stopping the server by pressing `Ctrl-p`, then `Ctrl-q`.

## Connect a 3.3.5a client

Set the client's `Data/<locale>/realmlist.wtf` file to the same hostname or IP stored in `REALM_ADDRESS`:

```text
set realmlist <REALM_ADDRESS>
```

Restart the client, sign in with the account created above, and select the AzerothCore realm. If authentication works but the realm connection fails, confirm that TCP port `8085` is reachable and that `REALM_ADDRESS` points to the Dokploy host.

For updates, backups, configuration, and troubleshooting, see the [AzerothCore Docker documentation](https://www.azerothcore.org/wiki/install-with-docker).
