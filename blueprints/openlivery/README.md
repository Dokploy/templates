# OpenLivery on Dokploy

The first registration creates the agency owner and closes public sign-up
Create additional client workspaces from the dashboard

This template uses the official OpenLivery v0.4.0 images for Linux AMD64
Use an x86-64 server, or configure AMD64 emulation on an ARM server

The generated domain initially uses HTTP
Before using real client data, configure a domain and HTTPS in Dokploy, update FRONTEND_URL to that HTTPS origin and set COOKIE_SECURE=true, then redeploy

Add your own AI provider credentials in OpenLivery and configure WhatsApp Cloud API, the QR bridge or the web widget
Provider, WhatsApp and infrastructure costs are separate

Back up PostgreSQL, the backend-storage volume and the generated environment before upgrades
Keep ENCRYPTION_KEY and WHATSAPP_BRIDGE_TOKEN unchanged across restarts and upgrades
Client portals use the main domain by default
Additional client domains require DNS and proxy configuration

[Self-hosting guide](https://www.openlivery.com/docs/self-hosting)
