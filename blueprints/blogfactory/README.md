# BlogFactory on Dokploy

Dokploy creates independent database, storage, JWT, encryption, and scheduler secrets during import. Only the `web` service receives a public domain; the API, scheduler, PostgreSQL, and MinIO remain private.

## First administrator

1. Open the Compose service's environment settings and copy the generated `ADMIN_EMAILS` value.
2. Open the generated BlogFactory domain and register with that exact email address.
3. Return to the Compose environment settings, change `BLOGFACTORY_ALLOW_SIGNUP` to `false`, and redeploy.
4. Add OpenRouter, CMS, or Google Search Console credentials from BlogFactory only when you need those optional integrations.

BlogFactory sends reviewed content to connected CMS providers as drafts. The template does not grant live-publish or delete authority.
