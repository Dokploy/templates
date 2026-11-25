# Moodle

Runs [Moodle](https://moodle.org) — the open-source learning management
system used by schools, universities and companies worldwide: courses,
quizzes, assignments, grading, forums and certificates. The template
deploys Moodle 5.3 LTS with a PostgreSQL database, served on your
Dokploy domain (the app listens on port 8080 internally).

**About the image:** Moodle HQ publishes only a PHP runtime image (you
bring the code yourself), and Bitnami's free Moodle image was
discontinued in 2025 — so this template uses
[erseco/alpine-moodle](https://github.com/erseco/alpine-moodle), the
actively maintained community image (Alpine + PHP 8.4 + Nginx,
configured entirely through environment variables), pinned to the `5.3`
series tag so patch updates never jump a Moodle series.

Tested on Dokploy: deployed from this compose, Moodle completed its
first-boot database setup and the site answered live on its Dokploy
domain (HTTP 200).

## First steps

1. Give the first boot several minutes — Moodle creates its full
   database schema on first start.
2. Log in as **admin** with the generated password: in Dokploy, open
   the service's environment variables and copy `MOODLE_ADMIN_PASSWORD`.
   Change it immediately under **Preferences → Change password**.
   (If the installer ever rejects the generated password under
   Moodle's password policy, set `MOODLE_ADMIN_PASSWORD` to a value
   mixing upper/lowercase letters, a digit and a symbol, then redeploy
   before first login.)
3. Set the site name, front page and SMTP mail under
   **Site administration**.

## The site URL is baked in

Moodle writes `SITE_URL` into its configuration and stores absolute
links in the database. Pick the final domain before first use —
moving a live Moodle to another domain later requires Moodle's
search-and-replace tool, not just a DNS change.

## Data

- `moodledata` holds uploaded files and course content, `moodlehtml`
  the code (kept in sync with the image on upgrades), `pgdata` the
  database. Back all three up together.
