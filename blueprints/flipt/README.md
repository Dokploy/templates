# Flipt

Flipt is an open-source feature flag platform. You define flags, segments and rollout rules in the web UI (or over its REST/gRPC APIs and SDKs), and your applications evaluate them at runtime — so you can ship code dark, roll out gradually, and kill a feature without redeploying. In Flipt v2, flag state is stored declaratively as YAML in a Git-backed store, which makes every change reviewable and reversible.

## How this deployment works

This template deploys Flipt's **official image** (`ghcr.io/flipt-io/flipt:v2.14.2`) as a single container:

- **No database to run.** With its default local storage backend, Flipt keeps its Git-backed flag store on the `flipt-data` volume (`/var/opt/flipt`). Postgres/MySQL/SQLite database backends exist upstream but are optional and not wired here.
- The **web UI and HTTP API** listen on port 8080 (wired to the domain in `template.toml`); the **gRPC API** listens on 9000 and is exposed on the internal network for your own services to evaluate flags against.
- Nothing to configure and no generated secrets for a basic deployment.

## First run

1. Open your Dokploy domain — the Flipt UI loads straight away.
2. Create a namespace (or use `default`), then create your first flag and variants.

## Notes

- **Authentication is off by default.** A fresh Flipt does not require login for the UI or API. Before exposing the domain publicly, enable authentication (`FLIPT_AUTHENTICATION_REQUIRED=true` plus one of upstream's auth methods — static tokens or OIDC) or keep the domain on a private network. The evaluation endpoints are usually consumed server-to-server; many users expose only the UI domain and let their apps reach port 9000 inside their own network.
- Flipt is GPL-3.0-licensed open source.
