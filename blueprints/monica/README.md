# Monica

Runs [Monica](https://www.monicahq.com) — an open-source personal CRM for
organizing your interactions with the people you care about: contacts and
their families, reminders for birthdays and follow-ups, notes, activities,
gifts, debts and a journal. The template deploys the official `monica`
image (Apache variant) with a MariaDB database, and serves it on your
Dokploy domain (the app listens on port 80 internally).

## First steps

1. Wait a couple of minutes after the deploy — the app runs its database
   migrations on first start.
2. Open your domain and **register**: the first account is yours; Monica
   is single-household software, so close registration afterwards in
   **Settings → Users** if the domain is public.
3. Optionally, from a terminal into the `app` container, run the
   production setup once:

   ```sh
   php artisan setup:production
   ```

## Data

- Your uploads and app storage live in the `monica_data` volume.
- The database lives in the `monica_mysql` volume.
  Back both up together — contacts without their photos (or the reverse)
  are only half a backup.

## Reminders (optional)

Monica sends reminder emails and runs scheduled jobs through Laravel's
scheduler. To enable them, add a third service using the same `monica`
image, the same environment and volumes as `app`, with
`command: php artisan schedule:work`, and configure outgoing mail
(`MAIL_*` variables) on both services. Without it, everything in the web
UI still works — reminders just won't be emailed.

Tested on Dokploy (2026-11-15): deployed on a Dokploy server — the app
completed its first-boot migrations against MariaDB and served the
registration page ("Monica – personal relationship manager").
