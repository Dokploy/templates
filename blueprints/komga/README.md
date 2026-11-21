# Komga

Runs [Komga](https://komga.org) — a media server for comics and mangas. It
indexes your CBZ, CBR, EPUB and PDF files and serves them through a fast web
reader, OPDS feeds for reader apps, and smart collections. The template
deploys the official `gotson/komga` image and exposes the web UI on your
Dokploy domain (the app listens on port 25600 internally).

Tested live on Dokploy on 2026-11-21: the container deployed cleanly, the first (admin) account was created from the sign-in page, and the web UI loaded (v1.30.1) with an empty library at `/data`. Screenshots from that trial are attached to the submission PR.

## First run

1. Open your domain and **create the first account — it becomes the
   administrator**.
2. Create a library pointing at `/data` (or a subfolder), and Komga scans
   and indexes your books automatically.

## Your books path

The template maps one host path into the container — set it at deploy time:

- `BOOKS_PATH` → `/data` — the folder holding your comics/manga files.

Komga's own database and thumbnails live in the `config` volume (`/config`),
so they survive redeploys. Your book files are only read, never modified.

## Security note

Create the admin account immediately after deploying, and use Komga's user
accounts instead of sharing one login if others read from your library.
