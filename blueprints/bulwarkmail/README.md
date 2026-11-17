# Bulwark Webmail

Bulwark is a self-hosted webmail client for **JMAP** mail servers: mail, calendar,
contacts, and files behind one login, with an admin dashboard for configuration,
OAuth, plugins, and settings sync.

## Standalone by design

This template deploys **only the Bulwark client**. Bulwark is not a mail server —
it needs a JMAP-compatible server behind it (for example
[Stalwart Mail Server](https://stalwartlabs.com), which has its own Dokploy
template). Point Bulwark at the server you already run; nothing mail-related is
bundled or configured for you.

## First run — setup token

There are no preset credentials. On first launch against an empty data volume,
Bulwark prints a **one-time setup token** in its container logs, in a block
starting with `SETUP REQUIRED`. To finish setup:

1. Open the app in your browser and enter the setup token from the logs.
2. Create the admin account when the wizard asks.
3. In the admin settings, connect your JMAP mail server — or, before deploying,
   set the `JMAP_SERVER_URL` environment variable to your server's public
   HTTPS address and redeploy.

Note: browsers talk JMAP directly to your mail server, so its address must be a
public HTTPS URL reachable from the browser. If the server lives on a different
origin than Bulwark, it also needs a permissive CORS policy (Stalwart documents
this); sharing one origin avoids the issue.

## Storage

A single volume, `bulwarkmail_data`, mounted at `/app/data`, holds the admin
config, sessions, and per-user settings. Mail itself stays on your mail server.


## Tested on Dokploy

Deployed and verified on a live Dokploy instance (2026-11-17): the app came up healthy, the first-run setup wizard issued its one-time setup token, the admin account was created through the wizard, and the app serves over HTTPS with a Let's Encrypt certificate.
