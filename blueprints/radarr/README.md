# Radarr

Runs [Radarr](https://radarr.video) — a movie collection manager for Usenet
and BitTorrent users. It monitors RSS feeds for new releases of the movies you
want, then grabs, sorts and renames them so your media server (Plex, Jellyfin,
Emby) picks them up. The template deploys the official `linuxserver/radarr`
image and exposes the web UI on your Dokploy domain (the service listens on
port 7878 internally).

Tested live on Dokploy on 2026-11-21: the container deployed cleanly, the sign-in page rendered, and after login the full UI loaded (Movies, Calendar, Activity, Settings). Screenshots from that trial are attached to the submission PR.

## First run

1. Open your domain — on first run Radarr asks you to enable authentication and create the admin account, then sign in.
2. Go to **Settings → Media Management** and confirm the root folder points
   at `/movies`.
3. Add your indexers under **Settings → Indexers** and a download client
   under **Settings → Download Clients**, then add your first movie.

## Your library paths

The template maps two host paths into the container — set them at deploy time:

- `MOVIES_PATH` → `/movies` — where finished movies live (your media library).
  The host folders must be writable by the container user (PUID 1000 by
  default), otherwise Radarr refuses to add `/movies` as a root folder.
- `DOWNLOADS_PATH` → `/downloads` — where your download client puts files.

Radarr's own database and settings live in the `config` volume (`/config`),
so they survive redeploys.

## Security note

On first run Radarr asks you to set up Forms authentication — do not skip
it: anyone who can reach the domain can use an unauthenticated instance.
You can review the setting later under **Settings → General → Security**.
