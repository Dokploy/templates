# Traccar

Runs [Traccar](https://www.traccar.org) — an open-source GPS tracking
platform supporting more than 2,000 device models: live map positions,
history, geofences, events, reports and notifications. The template deploys
the official `traccar/traccar` image and exposes the web UI on your Dokploy
domain (the app listens on port 8082 internally).

Tested on Dokploy: deployed live and verified — the web UI loads over
HTTPS on the Dokploy domain, and first login with the default admin
account reached the map and device management UI.

## First run

1. Open your domain and log in with the default credentials
   **admin / admin**.
2. **Change the admin password immediately** (Account settings), then
   register your first device with its unique identifier.

## Device connections

GPS trackers connect to Traccar's protocol ports (5000–5500 range, one per
protocol). Those are **not** published by this template — the web UI works
out of the box, and if you run real trackers you can publish the ports your
devices need on the host and point the devices at your server.

## Data

The embedded H2 database lives in the `data` volume and server logs in
`logs`; both survive redeploys.

## Security note

Location data is deeply personal. Change the default password on first run
and keep the instance behind a domain only you and your users know.
