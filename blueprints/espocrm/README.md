# EspoCRM

Runs [EspoCRM](https://www.espocrm.com) — a free, open-source CRM that
lets you see, enter and evaluate all your company relationships in one
place: contacts, companies, leads, opportunities, cases, projects,
email, meetings and calls, in an easy and highly customizable web
interface.

The template deploys the official Docker image of EspoCRM (10.1.4,
Apache variant) with a MariaDB database and the EspoCRM daemon
service, which runs the background jobs (scheduled workflows, mass
email, notifications). The web app listens on port 80 internally and is
served on your Dokploy domain. On first start, EspoCRM installs itself
automatically using the generated credentials — no web installer to
click through.

## First steps

1. Give the first boot a minute or two (database creation + automatic
   installation), then open your domain.
2. Log in as **admin** with the generated password: in Dokploy, open
   the service's environment variables and copy `ADMIN_PASSWORD`.
   Change it right away under **Preferences**.
3. Set up your team under **Administration → Users**, connect an email
   account under **Preferences → Email**, and start adding contacts,
   leads and opportunities.

## The site URL is set at deploy time

EspoCRM stores `ESPOCRM_SITE_URL` (set from your Dokploy domain) in its
configuration and uses it in links and emails. If you change the domain
later, update `SITE_URL` in the environment and redeploy.

## Data

- `espocrm_db` — the MariaDB database with all CRM records.
- `espocrm_data` — application data and configuration.
- `espocrm_custom` and `espocrm_custom_client` — your customizations
  (entities, fields, layouts), which survive image upgrades.

Back all four volumes up together.
