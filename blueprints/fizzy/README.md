# Fizzy

Fizzy is the Kanban tracking tool for issues and ideas by [37signals](https://37signals.com) - boards of cards that flow through columns, with comments, mentions, assignments and notifications. It is the software behind [fizzy.do](https://fizzy.do/), released under the O'Saasy license, and this template runs the official pre-built image (`ghcr.io/basecamp/fizzy`).

## How this deployment works

- **Single container.** The image runs the whole app (Rails served by Thruster) on port 80; Dokploy terminates HTTPS in front of it, so no `TLS_DOMAIN` is needed.
- **SQLite on a volume.** All data - the database and uploaded files - lives in `/rails/storage`, mounted on the persistent `fizzy_storage` volume. Back up that volume and you have backed up Fizzy.
- **Secret key.** Dokploy generates `SECRET_KEY_BASE` at deploy time. Keep it stable: changing it invalidates every personal access token and connected OAuth app.
- **Base URL.** `BASE_URL` is set to your Dokploy domain automatically, so links in emails and notifications point at the right place.

## First run

1. Open your Dokploy domain and create the first account - that makes you the owner.
2. Sign-in is by email code (there are no passwords): Fizzy emails you a 6-character verification code.
3. **Configure SMTP first (see below)**: the code is only ever sent by email - with no SMTP server configured the delivery fails (a mail delivery error shows in the `fizzy` service logs in Dokploy) and sign-in cannot be completed.
4. By default the instance is single-account: once the first account exists, new account signups are disabled (the account itself can have as many users as you like). Set `MULTI_TENANT=true` in the service environment if you want open account creation.

## Sending email (SMTP)

Fizzy needs email for sign-in codes and summary emails. Add these variables to the `fizzy` service environment in Dokploy and redeploy:

- `MAILER_FROM_ADDRESS` - the "from" address to send from
- `SMTP_ADDRESS` - your SMTP server (Postmark, SendGrid, ...)
- `SMTP_PORT` - defaults to 465 with `SMTP_TLS=true`, otherwise 587
- `SMTP_USERNAME` / `SMTP_PASSWORD` - your SMTP credentials

## Notes

- Upstream publishes the image under the moving `main` tag only (no versioned releases), so this template tracks `main` exactly as the upstream Docker guide does - redeploy to pick up new versions.
- Web Push notifications additionally need a VAPID key pair (`VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`); see the [upstream Docker guide](https://github.com/basecamp/fizzy/blob/main/docs/docker-deployment.md).
