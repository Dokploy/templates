# Node-RED

Runs [Node-RED](https://nodered.org) — a flow-based programming tool for
wiring together hardware devices, APIs and online services. Drag nodes onto a
canvas, connect them, and deploy automations for your smart home, MQTT
devices and webhooks. The template deploys the official `nodered/node-red`
image and exposes the editor on your Dokploy domain (the service listens on
port 1880 internally).

Tested on Dokploy (2026-11-20): deployed live at nodered.syn-code.win — the flow editor loads and is ready to build and deploy flows. Data persists in the node_red_data volume mounted at /data.

## First run

1. Open your domain — the flow editor loads straight away, no account needed.
2. Drag an **inject** node and a **debug** node onto the canvas, wire them
   together and click **Deploy**. Trigger the inject node and watch the
   message land in the debug panel — your first flow works.
3. Add more nodes from the palette (or install community nodes via
   **Menu → Manage palette**).

## Your flows persist

Flows, credentials and settings live in the `node_red_data` volume (`/data`,
including `flows.json` and `settings.js`), so they survive redeploys. Edit
`settings.js` in the volume if you need to change editor behaviour.

## Security note

Node-RED ships with **no login** by default — anyone who can reach the domain
can edit and deploy flows (which can run code on your server). Set up
`adminAuth` in `settings.js`, or keep the domain private. Do not leave it
open to the internet without a password.
