# 2FAuth

Runs [2FAuth](https://2fauth.app) — a self-hosted web application to manage
your two-factor authentication (2FA) tokens in one place, instead of having
them scattered across phone apps. The template deploys the official
`2fauth/2fauth` image and exposes the web UI on your Dokploy domain (the
service listens on port 8000 internally).

Tested on Dokploy (2026-11-15): deployed from this exact compose, the login
page serves with HTTP 200. Note the template generates an `APP_KEY` at
deploy time — the current 2FAuth image answers HTTP 500 on every page
without one, so do not remove it.

## First run

1. Open your domain and **register** — the first account created becomes the
   administrator.
2. In **Settings**, turn off open registration once your account exists, so
   nobody else can sign up.
3. Add your 2FA accounts by scanning QR codes or importing them from another
   authenticator app, and set up a passkey/WebAuthn key for passwordless
   sign-in.

## Your data is one volume — back it up

Everything lives in the `2fauth_data` volume (`/2fauth`): an SQLite database
with your accounts and their secret seeds, plus your uploads. Losing it
means losing every token in it. Back the volume up (at minimum the
`database.sqlite` file) before you update or redeploy, and keep the backup
somewhere safe — it is effectively a master key to all your accounts.

## Security note

This application holds the 2FA seeds for everything you put in it. Protect
the domain accordingly: use a strong account password plus a passkey, close
registration after setup, and consider restricting who can reach the domain
at all.
