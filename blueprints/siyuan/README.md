# SiYuan

Runs [SiYuan](https://siyuan.io) — a privacy-first, self-hosted personal
knowledge management system. Notes are built from blocks that can be
referenced and linked in both directions, with a graph view, daily
notes, flashcards with spaced repetition, and export to Markdown, PDF
and more. Think of it as your own local-first notebook whose data lives
on your server, not in someone else's cloud.

The template deploys the official SiYuan image (pinned to v3.8.12) as a
single service. The app listens on port 6806 internally and is served on
your Dokploy domain.

## First steps

1. Open your domain. SiYuan asks for an **access authorization code** —
   this is the `ACCESS_AUTH_CODE` value Dokploy generated at deploy
   time: find it in the service's environment variables in Dokploy and
   enter it to unlock your workspace.
2. Create your first notebook and start writing. In **Settings** you
   can set your own authorization code, language and appearance.
3. Optional: install the SiYuan desktop or mobile apps and point them
   at your instance (same domain + authorization code) to work across
   devices.

## Data

Everything lives in the `siyuan_workspace` volume
(`/siyuan/workspace`): your notebooks, documents, assets and SiYuan's
own configuration and index. Back this volume up — it is your entire
knowledge base.

## Notes

- Keep the authorization code private: anyone who has it can open your
  workspace from the web UI.
- SiYuan's built-in sync is a paid feature of the official service; this
  template covers self-hosted web/desktop access to the workspace on
  your server.
