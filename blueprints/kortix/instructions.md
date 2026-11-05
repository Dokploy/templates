# Kortix Setup Instructions

## Deploy

1. Create the service from the **Kortix** template. Dokploy generates the database password, JWT secret and secret seed, and three domains (app, API, Supabase gateway).
2. In the service's **Environment** tab, replace each `REPLACE_ME`:
   - `PLATINUM_API_KEY`: Platinum API key. Kortix agents run in Platinum cloud sandboxes; get a key at https://platinum.dev.
   - `KORTIX_ADMIN_EMAIL`: Email of the first admin. Sign up with this address right after the deploy finishes.
3. In the **Domains** tab, edit each of the three domains (frontend, api, kong), turn on **HTTPS** and choose **Let's Encrypt**. The template's addresses use `https://`; if you swap in your own domains, update `PUBLIC_URL`, `API_PUBLIC_URL` and `SUPABASE_PUBLIC_URL` to match.
4. Deploy and wait until every container is healthy. The first deploy takes a few minutes while the images download and Postgres initializes.

## After the first deploy

1. Open the Kortix app's address and **sign up with the admin email** right away.
2. Signed in as the admin, open **`/admin/git`** and connect GitHub. Install the GitHub App on an organization so Kortix can create project repos. On a personal account, create each repo on GitHub first, then import it.
3. Add your model key in **Settings → Model**.
4. Create a project and give an agent its first task.
5. To stop others from signing up, set `DISABLE_SIGNUP=true` and redeploy.
