## Instructions

### First setup

- The first boot runs the database migrations, so it can take **2-4 minutes** before the application responds.
- Open your domain: you will be redirected to `/install`, where you create the admin (workspace owner) account.
- After signing in, go to **Settings -> Model Provider** and install a model provider plugin (OpenAI, Anthropic, Ollama, etc.) from the marketplace, then configure your API keys.

### Notes

- **HTTPS is required for the console login**: Dify issues `__Host-`/`Secure` session cookies, so make sure the domain has a certificate (e.g. Let's Encrypt in the domain settings). Over plain HTTP the browser will drop the session cookies and login will not persist.

- The vector store is **pgvector**, running inside the bundled PostgreSQL instance (no separate Weaviate/Qdrant container needed).
- All routing (`/console/api`, `/api`, `/v1`, `/files`, `/e/`, ...) is handled by the bundled internal nginx gateway, mirroring the upstream deployment, so the Dify service API is available at `https://<your-domain>/v1`.
- Code execution runs in the isolated `sandbox` service, and user-triggered outbound HTTP requests go through the `ssrf_proxy` (squid) service, like in the official deployment.
