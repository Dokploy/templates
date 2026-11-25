# Logseq

Logseq is a privacy-first, open-source knowledge base and outliner that works on top of local Markdown and Org-mode files. It is built around daily journals and blocks: every bullet is a block you can reference, embed and query, with backlinks, tasks, flashcards and a graph view on top. It is the open-source alternative to Roam Research and Obsidian.

## How this deployment works

This template deploys Logseq's **official web app image** (`ghcr.io/logseq/logseq-webapp`). The app runs entirely in your browser — the container only serves the app itself, and **no notes are stored on the server**:

- Open your domain in a Chromium-based browser (Chrome, Edge, Brave…).
- Choose **Open a local folder** to keep your graph as plain Markdown files on your own device (the File System Access API needs the HTTPS connection Dokploy provides), or start with the built-in demo graph stored in the browser.
- The same folder can also be opened by the Logseq desktop app — your files stay yours either way.

## First run

1. Open your Dokploy domain — Logseq loads with a demo graph so you can look around.
2. Click the graph name (top left) → **Add a graph** / **Open a local folder** and pick an empty folder on your device.
3. Start writing in today's journal page; pages and files are created inside that folder as you go.

## Notes

- There are no accounts, passwords or server-side settings for this template — access control is your Dokploy domain itself, so keep the domain private if your graph is.
- Because data lives in the browser/device, there is nothing to back up on the server; back up your graph folder (it is just Markdown files, and works well with Git).
