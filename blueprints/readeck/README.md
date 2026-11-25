# Readeck

Runs [Readeck](https://readeck.org) — a simple, self-hosted
read-it-later application. Save a link and Readeck extracts the readable
content of the page (text and images) and stores it in **your** archive,
so the article stays readable even if the original site changes or
disappears. Bookmarks can be labeled, favorited, archived, highlighted
and grouped into collections; there is full-text search, e-book (EPUB)
export, an OPDS catalog for e-readers, and browser extensions and mobile
apps that sync with your instance.

The template deploys the official Readeck image (pinned to 0.23.6) as a
single service — no database or extra containers; Readeck stores
everything in one data volume. The app listens on port 8000 internally
and is served on your Dokploy domain.

## First steps

1. Open your domain right after the first deploy and **create the
   administrator account** from the first-run screen. Do this
   immediately — until the first account exists, the instance is
   setting itself up.
2. Start saving links: paste a URL in the web UI, or install the
   Readeck browser extension (Firefox / Chrome) and save pages in one
   click.
3. Optional: install a mobile app and connect it to your instance to
   read your archive on your phone.

## Data

Everything lives in the `readeck_data` volume (`/readeck`): the
configuration, the user accounts and the full archive of saved pages
and their images. Back this volume up — it *is* your reading archive.

## Notes

- Readeck is a single binary with an embedded database; it needs very
  little memory and no tuning at this scale.
- Source code and issues live on Codeberg (the `github` link in the
  catalog points there, as with the Forgejo template).
