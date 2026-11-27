# Cryptgeon

Cryptgeon is a secure note and file sharing service inspired by PrivNote. You write a note or upload a file, get a one-time link, and the content is deleted from the server as soon as it has been read (or after the expiry time you choose). Everything is encrypted end-to-end in the browser with the key in the link fragment — the server only ever stores ciphertext and cannot read your notes.

## How this deployment works

This template deploys Cryptgeon's **official image** (`cupcakearmy/cryptgeon:2.9.3`) with a small Redis sidecar — Cryptgeon 2.9.3 requires Redis and will not start without it:

- **No database, no persistent volumes.** Notes live in the **RAM-only Redis sidecar**: it runs with persistence disabled (`--save "" --appendonly no`) on a tmpfs, so nothing is ever written to disk. Notes are ephemeral by design — a restart clears all pending notes, which is expected behaviour for this app.
- The app listens on port 8000 internally; the domain is wired in `template.toml`.
- **HTTPS is required.** Browsers only expose the WebCrypto APIs Cryptgeon relies on in secure contexts, so the app will not work over plain HTTP. Dokploy's domain (with its Let's Encrypt certificate) covers this — do not expose the container any other way.

## First run

1. Open your Dokploy domain.
2. Write a note or drop a file, set how long it stays available and whether it should burn after reading, and share the generated link.

There are no accounts and nothing else to configure.

## Notes

- Because all note state lives in the single Redis sidecar, this is a single-instance deployment — do not scale the Cryptgeon service up to multiple replicas, or links will randomly fail depending on which replica holds the note.
- The Redis sidecar is deliberately kept RAM-only: no persistence, no disk writes — it exists only because this Cryptgeon version requires Redis, not as a place where notes accumulate.
- Cryptgeon is MIT-licensed open source.
