# Corsfix

This template deploys the Corsfix dashboard and proxy with MongoDB and Redis.
The dashboard image requires an **x86-64 / amd64 server**.

## Before deploying

1. Dokploy imports template domains without a certificate configuration, so `AUTH_URL` defaults to `http://` followed by the generated dashboard hostname. When enabling **HTTPS** and **Let's Encrypt** in the **Domains** tab, also change `AUTH_URL` in **Environment** to `https://` followed by that hostname and redeploy. This URL must match the public dashboard address, even though Dokploy terminates TLS at the edge. Enable HTTPS for **both** domains before using the playground, which uses HTTPS proxy URLs.
2. If using custom domains, point both DNS records to your server, update the domain entries, and set `APP_DOMAIN` and `PROXY_DOMAIN` in **Environment** to the matching hostnames, without `https://` or a trailing slash. Update `AUTH_URL` to the full public dashboard URL, including its `http://` or `https://` scheme.
3. Deploy, then open the dashboard domain (the `corsfix` service on port `3000`) and create your account with an email address and password. Self-hosted signup does not require an email server.
4. Set `DISABLE_SIGNUP=true` in **Environment** and redeploy after creating the accounts you need.

## Using the proxy

The second domain routes to `corsfix-proxy` on port `80`. Use the dashboard to register your application's origin and permitted target domains, manage secrets, and try requests in the playground.

`RPM` sets the self-hosted rate limit (default: `180` requests per minute). Optional `ALLOWED_ORIGINS` and `ALLOWED_TARGETS` accept comma-separated hostnames for environment-based allowlists; leave them empty to manage applications through the dashboard.

## Persistent data and upgrades

MongoDB stores users, applications, and encrypted secrets in named volumes. Redis uses a named volume with append-only persistence. Preserve these volumes and the generated environment values when upgrading.

Keep a backup of `KEK_VERSION_1`: changing or losing this encryption key makes existing saved secrets unreadable. Do not re-import the template to upgrade an existing installation, because imports generate new credentials and keys. Update the image tags in the existing Compose configuration instead. Changing `MONGODB_PASSWORD` alone does not change the password already stored in MongoDB.

The Corsfix images are pinned to the same upstream commit because the project publishes commit tags rather than numbered releases.

See the [Corsfix self-hosting documentation](https://corsfix.com/docs/open-source/self-hosting) for more information.
