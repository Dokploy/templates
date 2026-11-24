# Nod

Runs [Nod](https://nod.n8n.io) — n8n's open-source personal agent. Nod has its
own computer (a real browser and a workspace) and uses it to take work off your
plate: chasing invoices, prepping your calls, cancelling trials on real
websites — and it asks before it acts. Everything runs on your server, with the
AI provider you choose.

The template builds Nod's official self-host stack from source (upstream
publishes no registry images): the server, PostgreSQL, a guarded Docker-socket
proxy, the agent's browser, its workspace and the workspace's network sidecar.
The web UI is exposed on your Dokploy domain (the server listens on port 4310
internally).

Tested on Dokploy: deployed live and verified on 2026-11-24 — all six services
healthy over HTTPS, the token login completed, and the first-run onboarding was
walked through to the AI-provider picker (OpenAI, Anthropic, Google Gemini,
OpenRouter and more).

## First run

1. **First deployment takes a while** — the images are built from source on
   your server (roughly 30–40 minutes on a small VPS). Later redeploys reuse
   the build cache.
2. Open your domain and enter the **authentication token**: it is the
   `NOD_AUTH_TOKEN` value Dokploy generated for this deployment — find it in
   the stack's environment variables in the Dokploy dashboard.
3. Pick your AI provider in the onboarding (sign in with a supported plan, or
   use your own API key). You can also add a provider key later as an
   environment variable on the stack (for example `OPENAI_API_KEY`) and
   redeploy.

## Good to know

- **One instance per server.** Upstream's runtime proxy locates the agent's
  browser and workspace by fixed container names (`nod-browser-*`,
  `nod-workspace-*`), so a second Nod deployment on the same host would
  collide with the first.
- The agent acts on real websites with the accounts you connect — connect only
  accounts you are comfortable delegating, and review its work like you would
  a new assistant's.

## Your data persists

Chats, files, the encrypted credential vault and the database live in the
`server-data`, `workspace-data` and `postgres-data` volumes, so they survive
redeploys.
