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

### New API keys (`sb_publishable_…` / `sb_secret_…`)

Dokploy also generates the newer opaque API keys, so you can use either style:

- **publishable key**: the value of `SUPABASE_PUBLISHABLE_KEY` (browser-safe, replaces the anon key)
- **secret key**: the value of `SUPABASE_SECRET_KEY` (server-side only, replaces the service_role key)

Kong exchanges these for the matching JWT before the request reaches Supabase,
so clients never hold a decodable token. Both styles stay valid at the same time
— existing apps on `ANON_KEY` / `SERVICE_ROLE_KEY` keep working.

## Optional: sign tokens with an ES256 key pair

Everything is signed with the symmetric `JWT_SECRET` (HS256) by default. Moving
to an asymmetric key pair needs an EC P-256 key, which Dokploy's variable
helpers cannot generate, so `JWT_KEYS` and `JWT_JWKS` ship empty. To switch:

1. Clone the Supabase repo and go to its `docker/` directory:

   ```bash
   git clone --depth 1 https://github.com/supabase/supabase
   cd supabase/docker
   ```

2. Put **this deployment's** `JWT_SECRET` (from the Environment tab) into a local `.env`:

   ```bash
   echo "JWT_SECRET=<your-JWT_SECRET>" > .env
   ```

3. Generate the keys:

   ```bash
   sh utils/add-new-auth-keys.sh
   ```

4. Replace all six values in the Environment tab with the ones it prints, then
   redeploy: `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
   `ANON_KEY_ASYMMETRIC`, `SERVICE_ROLE_KEY_ASYMMETRIC`, `JWT_KEYS`, `JWT_JWKS`.

Set them **all together**. `JWT_KEYS` makes Auth sign tokens with ES256, while
`JWT_JWKS` is what PostgREST, Realtime, Storage and Edge Functions use to verify
them — filling in one without the other makes every authenticated request fail.

See <https://supabase.com/docs/guides/self-hosting/self-hosted-auth-keys>.

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
