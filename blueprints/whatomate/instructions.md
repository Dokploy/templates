# Whatomate

## Getting started

1. Deploy the template and open the app domain.
2. Log in with the default admin credentials: **admin@admin.com** / **admin**. Change the password right after the first login.
3. Connect your WhatsApp Business account: go to **Settings → WhatsApp Accounts** and add your Meta Cloud API credentials (phone number ID, access token). See the [configuration docs](https://shridarpatil.github.io/whatomate/getting-started/configuration/).
4. Point your Meta webhook to `https://<your-domain>/webhook` and use the `webhook_verify_token` from the generated `config.toml` mount (Dokploy → your service → Advanced → Mounts).

## Notes

- The full application configuration lives in the `config.toml` file mount (JWT secret, encryption key and webhook verify token are auto-generated per deployment). Edit it and redeploy to change settings.
- Uploads are persisted in the `whatomate-uploads` volume; PostgreSQL and Redis data in `whatomate-postgres-data` and `whatomate-redis-data`.
- Voice calling / IVR requires extra WebRTC configuration (UDP ports, public IP or TURN server). See the [calling docs](https://shridarpatil.github.io/whatomate/features/calling/).
