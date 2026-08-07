# Supabase Setup Instructions

## Deploy

1. In Dokploy, create the service from the **Supabase** template (requires Dokploy `>= 0.22.5`).
2. Dokploy automatically generates all secrets for you (`POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `DASHBOARD_PASSWORD`, etc.). You can review them in the **Environment** tab of the service.
3. Deploy and wait for all containers to become healthy. The first deploy can take several minutes while the Postgres database initializes.

## Log in to Supabase Studio

The main domain of the template points to the `kong` API gateway (port `8000`), which protects Supabase Studio with basic authentication:

- **Username**: the value of `DASHBOARD_USERNAME` (default: `supabase`)
- **Password**: the value of `DASHBOARD_PASSWORD`

Both values are in the **Environment** tab of the service in Dokploy.

## API URL and keys

To connect an application (for example with `supabase-js`):

- **API URL**: `https://<your-domain>` (requests are routed through Kong)
- **anon key**: the value of `ANON_KEY` in the Environment tab
- **service_role key**: the value of `SERVICE_ROLE_KEY` in the Environment tab (server-side only, never expose it to browsers)

## Recommended configuration

Review these variables in the **Environment** tab before using Supabase in production:

- `SUPABASE_PUBLIC_URL` and `API_EXTERNAL_URL`: must point to your Supabase domain with the correct `http`/`https` scheme (the template sets them from your domain automatically).
- `SITE_URL` and `ADDITIONAL_REDIRECT_URLS`: must point to the application that uses Supabase for authentication.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_ADMIN_EMAIL`, `SMTP_SENDER_NAME`: required for auth emails (sign-up confirmations, password resets). The template ships with placeholder values, so no real emails are sent until you configure a real SMTP provider.

## Warning: changing POSTGRES_PASSWORD after the first deploy

The Postgres data directory (mounted at `files/volumes/db/data`) is initialized **once**, on the first deploy, using the value of `POSTGRES_PASSWORD` at that moment. The same password is also assigned to the internal Supabase roles (`authenticator`, `pgbouncer`, `supabase_auth_admin`, `supabase_functions_admin`, `supabase_storage_admin`) by an init script that only runs on first boot.

If you later change `POSTGRES_PASSWORD` in the Environment tab and redeploy, the password stored **inside the database does not change**. The other services will start using the new password while the database still expects the old one, and you will see errors such as `invalid_password` or `password authentication failed`.

To actually change the password, use one of these options:

### Option A: change it inside the database (keeps your data)

1. Open a terminal into the `db` container (in Dokploy: your Supabase service, `db` container, **Terminal**) and run `psql -U postgres`.
2. Execute the following, using your new password:

```sql
ALTER USER postgres WITH PASSWORD 'your-new-password';
ALTER USER supabase_admin WITH PASSWORD 'your-new-password';
ALTER USER authenticator WITH PASSWORD 'your-new-password';
ALTER USER pgbouncer WITH PASSWORD 'your-new-password';
ALTER USER supabase_auth_admin WITH PASSWORD 'your-new-password';
ALTER USER supabase_functions_admin WITH PASSWORD 'your-new-password';
ALTER USER supabase_storage_admin WITH PASSWORD 'your-new-password';
```

3. Update `POSTGRES_PASSWORD` in the Environment tab to the same value and redeploy.

### Option B: reinitialize the database (deletes ALL data)

Only if the instance has no data you care about: stop the service, delete the `files/volumes/db/data` directory of the service, set the new `POSTGRES_PASSWORD`, and deploy again. The database will be initialized from scratch with the new password.
