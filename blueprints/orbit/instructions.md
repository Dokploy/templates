# Orbit by Noveum

Deploy, then enable HTTPS with a valid certificate for both generated domains
in Dokploy's Domains tab. Open the Orbit HTTPS domain and create your account
and workspace. Both the app and storage domains require working HTTPS. Database migrations,
bucket creation and the storage CORS allowlist are configured automatically.
PostgreSQL, Redis and MinIO use persistent volumes. Preserve generated secrets
and back up PostgreSQL and MinIO before upgrades. Run one scheduler instance.
Configure Resend and EMAIL_FROM on web to send invitations and password recovery.
Configure ALLOWED_EMAIL_DOMAINS to restrict signup to your team.

Hosted MCP: https://orbit.noveum.ai/mcp
Self-hosted MCP: your Orbit HTTPS domain followed by /mcp.
