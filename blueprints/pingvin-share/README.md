# Pingvin Share

Runs [Pingvin Share](https://stonith404.github.io/pingvin-share/) — a self-hosted file sharing
platform: upload files and share them through a link, with optional password
protection, expiry dates and download limits. Think WeTransfer, on your own
server. The template deploys the official `stonith404/pingvin-share` image
and exposes the web UI on your Dokploy domain (the app listens on port 3000
internally).

Tested on Dokploy (2026-11-20): deployed live at pingvin.syn-code.win — home page, first-account registration (first user becomes admin), sign-in and the upload flow all verified.

## First run

1. Open your domain and **register the first account — it becomes the
   administrator**.
2. Under **Admin → Configuration**, set your limits (max file size, share
   expiry) and close public registration if the instance is just for you.

## Data

Uploaded files and the SQLite database live in the `data` volume
(`/opt/app/data`), so they survive redeploys. Watch your disk: shared files
add up, and expiry rules keep them in check.

## Security note

Anyone with a share link can download the file. Use passwords and short
expiry times for anything sensitive, and create the admin account
immediately after deploying.
