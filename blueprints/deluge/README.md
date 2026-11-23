# Deluge

Runs [Deluge](https://deluge-torrent.org) — a lightweight, full-featured
BitTorrent client built around a daemon + web UI architecture with a rich
plugin system. The template deploys the official `linuxserver/deluge` image
and exposes the web UI on your Dokploy domain (the app listens on port 8112
internally).

Tested on Dokploy: deployed live and verified — the web UI (Deluge WebUI
2.2.0) loads over HTTPS on the Dokploy domain, and first login with the
default password was completed.

## First run

1. Open your domain and log in with the default web UI password
   **`deluge`**.
2. **Change that password immediately** (Preferences → Interface), then set
   your download folders under `/downloads`.

## Your downloads path

The template maps one host path into the container — set it at deploy time:

- `DOWNLOADS_PATH` → `/downloads` — where completed files are written.
  Point your media apps (Sonarr, Radarr…) at the same folder.

Deluge's own state lives in the `config` volume (`/config`), so your
torrent list survives redeploys.

## A note on torrent ports

Peer connections use port 6881 (TCP/UDP) by default. This template routes
only the web UI through your domain; for full peer connectivity you can
publish 6881 on the host as well — Deluge works without it, just with fewer
peers on some swarms.

## Security note

The default password is public knowledge — change it on first run, and
download only content you have the right to download.
