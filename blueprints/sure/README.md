# Sure

[Sure](https://sure.am) is a self-hosted personal finance application. This
blueprint runs Sure 0.6.7 with a Sidekiq worker, PostgreSQL 16 and Valkey 8.

## First steps

1. Open the domain assigned by Dokploy and register your first account.
   The first registered user becomes the instance administrator.
2. Restrict subsequent registrations in **Settings > Self-Hosting > Onboarding**
   if the instance is intended for private use.
3. Enable HTTPS in Dokploy for a public deployment. Once HTTPS is configured,
   set `RAILS_FORCE_SSL=true` and `RAILS_ASSUME_SSL=true` in the Compose service's
   environment if all access is through the HTTPS reverse proxy.
4. If you change the domain in Dokploy, also update `APP_DOMAIN` to the new
   hostname without a scheme or path and redeploy.

## Data and secrets

- `sure-postgresql-data` stores the database.
- `sure-app-storage` stores uploaded files and is shared by the web service and worker.
- `sure-valkey` persists the background job queue and cache.

Back up the volumes and generated environment variables. Keep `SECRET_KEY_BASE`
unchanged across redeployments and restores because Sure derives its default
Active Record encryption keys from it.

See the [upstream self-hosting guide for v0.6.7](https://github.com/we-promise/sure/blob/v0.6.7/docs/hosting/docker.md)
for additional configuration.
