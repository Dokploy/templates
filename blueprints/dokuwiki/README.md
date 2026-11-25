# DokuWiki

Runs [DokuWiki](https://www.dokuwiki.org) — a lightweight, versatile
open-source wiki that **needs no database**: every page is stored as a
plain text file, which makes backups trivial and keeps the whole wiki
fast. It offers page versioning, access control lists, sections and a
large plugin ecosystem, and is widely used for documentation, knowledge
bases and team notes.

The template deploys the LinuxServer.io DokuWiki image (release
2026-07-14c) as a single service. The app listens on port 80 internally
and is served on your Dokploy domain.

## First steps

1. Open **`https://<your-domain>/install.php`** and complete the
   one-screen installer: set the wiki title and create the
   administrator (superuser) account. Choose a strong password.
2. Log in with that admin account and configure the wiki under
   **Admin** (enable user registration only if you want a public wiki).
3. Delete the installer when prompted: remove `install.php` from the
   web root inside the container (under `/config/www/dokuwiki/` in the
   data volume) so nobody can re-run it.

## Data

Everything lives in the `dokuwiki_config` volume (`/config`): the wiki
pages as text files, uploads, users and configuration. Backing up this
one volume backs up the whole wiki — and because pages are plain text,
you can even read or restore them without DokuWiki itself.

## Notes

- There is no database service to manage, patch or back up separately.
- Hundreds of plugins and templates are available from
  [dokuwiki.org](https://www.dokuwiki.org/plugins).
