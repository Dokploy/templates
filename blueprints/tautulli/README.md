# Tautulli

Runs [Tautulli](https://tautulli.com) — the standard monitoring companion
for Plex Media Server: who watched what, when and on which device, with
history graphs, statistics and rich notifications. The template deploys the
official `tautulli/tautulli` image and exposes the web UI on your Dokploy
domain (the app listens on port 8181 internally).

Tested live on Dokploy on 2026-11-21: the container deployed cleanly, the sign-in page rendered, and the setup wizard ran (Welcome and Authentication steps). Completing the wizard requires a reachable Plex Media Server, which the trial did not have. Screenshots from that trial are attached to the submission PR.

## First run

1. Open your domain and complete the setup wizard — it asks for your Plex
   server address and a Plex login to fetch an access token.
2. Set an admin username and password in the wizard, and enable
   authentication for the web interface under **Settings → Web Interface**.

## Data

Tautulli's database and settings live in the `config` volume (`/config`),
so your watch history survives redeploys.

Note: on first run Tautulli may show a red warning that the `/config`
volume mount "was not configured properly". With a named Docker volume
like this template uses, that warning is a known false positive — Tautulli
cannot detect named volume mounts (see the Tautulli FAQ). Your data **is**
persistent; you can ignore the message, or silence it by setting
`check_docker_mount = 0` in `config.ini` inside the volume. Tautulli needs network access to
your Plex server; if Plex runs on another host, that is fine as long as this
container can reach it.

## Security note

Tautulli shows detailed viewing habits. Always set the admin credentials in
the wizard and never leave the UI open on a public domain without them.
