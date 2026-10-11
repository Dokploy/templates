# Open Design

Local-first, open-source design tool with native desktop apps, a large library of
design systems, and an extensible plugin ecosystem.

## Notes

- **Access / security.** This template sets `OD_DISABLE_API_AUTH=1`. The Open Design
  daemon token-gates its API when bound to a non-loopback address, and a browser
  cannot supply that bearer token — so disabling it is required for the web UI to
  load. As a result the instance is **reachable by anyone who has the URL**. If it is
  internet-facing, put an authenticating layer in front (for example Dokploy/Traefik
  basic-auth) and enable an HTTPS certificate on the domain.

- **AI features.** The image intentionally does not bundle an AI agent CLI. To
  generate designs, either **Sign in to Open Design** (cloud) or choose **Bring your
  own key** and provide a provider API key (e.g. `ANTHROPIC_API_KEY`,
  `OPENAI_API_KEY`). A "vela binary not found" notice on the sign-in screen is
  expected and only affects the cloud-agent path.
