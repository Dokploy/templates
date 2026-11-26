# PLANKA

PLANKA is an elegant, Trello-like kanban board for team project tracking: projects, boards, lists and cards with real-time updates, labels, members, due dates, checklists, attachments and comments. The Community edition is free and source-available under the project's Fair Use License; a Pro edition exists for organisations.

## How this deployment works

This template runs two services, following upstream's own Docker Compose example:

- **planka** (`ghcr.io/plankanban/planka:2.3.1`) — the application, listening on port 1337.
- **postgres** (`postgres:16-alpine`) — a private PostgreSQL sidecar that stores all boards and users. It is not exposed publicly.

Dokploy generates three secrets at deploy time (see `template.toml`), so there is nothing to fill in before deploying:

- `SECRET_KEY` — signs every access token. **Never change it after the first deploy**, or all sessions are invalidated.
- `POSTGRES_PASSWORD` — the sidecar database password, wired into both services automatically.
- `DEFAULT_ADMIN_PASSWORD` — the password of the seeded first administrator (below).

Uploads, attachments, avatars and background images live in the `planka_data` volume (`/app/data` in the app container); the database lives in the `pgdata` volume.

## First run

1. Open your Dokploy domain — you will land on PLANKA's login page.
2. Log in as **admin@planka.local** with the password Dokploy generated: open this app → **Environment** → the `DEFAULT_ADMIN_PASSWORD` value.
3. Create your first project and board, then invite your team from the admin area.

Why the seeded account? Since PLANKA 1.13 no administrator is created automatically, so the template seeds one through the `DEFAULT_ADMIN_*` variables upstream provides. (The alternative is running `npm run db:create-admin-user` inside the app container by hand.)

## Notes

- While the `DEFAULT_ADMIN_*` variables stay in place, PLANKA re-applies the seeded password on every start and the account cannot be edited or deleted in the UI. After your first login, remove those lines from the compose file in Dokploy and redeploy to turn it into a normal account — and from then on, change its password from inside PLANKA like any other user.
- `BASE_URL` is wired from the app's domain and must match the address you open PLANKA at exactly, or login breaks. If you change the domain in Dokploy afterwards, redeploy so the variable is regenerated.
- Email notifications are configured inside PLANKA (Administration → SMTP) unless you pin them with the `SMTP_*` environment variables upstream documents.
