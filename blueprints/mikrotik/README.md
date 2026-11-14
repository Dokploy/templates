# MikroTik RouterOS

Runs MikroTik RouterOS (CHR) inside a container using QEMU. The image is built
from MikroTik's official CHR download and is published from
[RamezHany/mikrotik-chr-containerized](https://github.com/RamezHany/mikrotik-chr-containerized),
so the template does not depend on any third-party image.

Tested on Dokploy: WinBox access, API access, SSH and WebFig — spec-verified
(4 CPU / 4 GB RAM / 1 GB disk), with persistence across restarts.

## Published ports

RouterOS services are raw TCP — Traefik cannot route them — so they are
published on the host:

| Host port | RouterOS port | Service |
| --- | --- | --- |
| 8291 | 8291 | WinBox |
| 8728 | 8728 | RouterOS API (WinBox mobile / API clients) |
| 808 | 80 | WebFig — web interface (HTTP) |
| 322 | 22 | SSH (host port moved to 322 so it never clashes with the server's own SSH) |
| 1010 | 443 | SSTP (see below) |

The compose file also contains a commented-out `1000-1999:1000-1999` range.
Uncomment it if you want a block of ports open for extra RouterOS services —
and remove the `1010:443` line if you do, because 1010 is inside that range.

## First login

1. Connect with WinBox to `<your-server>:8291`, user `admin`, blank password.
2. RouterOS asks you to set a password on first login — do it immediately;
   the router is reachable from the internet on the ports above.

This template deploys the plain vanilla image: no accounts are pre-created
beyond the RouterOS factory defaults, and no credentials ship with it. If
you want automated provisioning with your own branding package, see the
project repository linked in the template metadata.

Your configuration and the RouterOS disk persist in the `mikrotik_data`
volume across redeploys.

## SSTP — host port 1010, RouterOS keeps its default 443

This template does **not** reconfigure RouterOS, and it does not set up a
VPN for you. Inside the container, the SSTP server keeps the RouterOS
default port **443**; the compose publishes it on host port **1010**
(`1010:443`) because on a typical Dokploy server the host's 443 is already
owned by Traefik/HTTPS and would collide.

If you want an SSTP VPN, enable it yourself in RouterOS (certificate under
**System → Certificates**, users under **PPP → Secrets**, then enable the
SSTP server under **PPP → Interface** — leave its port on 443). Your
clients then connect to `<your-server>:1010`.

## Licensing note

RouterOS CHR licensing applies to the guest as usual: the free CHR level
limits each interface to 1 Mbps. To lift it, attach your own CHR license in
WinBox under **System → License** (a P1 license removes the speed limit for
most VPN/router uses).
