# Invoice Ninja

Runs [Invoice Ninja](https://invoiceninja.com) v5 — open-source
invoicing, payments, expenses and time tracking for freelancers and
small businesses. The template deploys the current official
`invoiceninja-debian` image (the older Alpine image is deprecated by
upstream) with MySQL and Redis, plus a small Nginx service that serves
the app's PHP-FPM — its vhost is written by the service's own start
command, so the blueprint stays a single compose file. The web UI is
served on your Dokploy domain.

## First steps

1. Give the first boot a few minutes — the app runs its migrations and
   seeds your admin account on first start.
2. Log in with the generated admin account: the email is the one
   Dokploy generated for the service (see its environment variables,
   `IN_USER_EMAIL`) and the password is `IN_PASSWORD` in the same
   place. Change the password right away under **Settings → User
   Details**.
3. Complete the company setup wizard: name, logo, currency, and a
   payment gateway (Stripe, PayPal, …) when you're ready to accept
   card payments.
4. Set up outgoing mail under **Settings → Email Settings** — invoices
   can't be emailed to clients until SMTP is configured.

## Data

- `mysql_data` holds every invoice and client, `app_storage` your
  uploads and generated PDFs, `app_public` the public assets.
  Back them up together.

## Notes

- PDF generation uses the bundled headless Chrome (Snappdf). If PDFs
  ever fail on a custom domain, check the upstream note: the app URL
  must resolve from inside the server itself.
- Recurring invoices, reminders and the queue run inside the app
  container — no extra worker service is needed.

## Tested on Dokploy

Deployed and verified on a live Dokploy instance (2026-11-17): all four services (app, nginx, MySQL, Redis) came up running, and the app serves over HTTPS with a Let's Encrypt certificate.
