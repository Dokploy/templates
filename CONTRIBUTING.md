# Contributing to Templates

This is the MasonJames fork of [Dokploy/templates](https://github.com/Dokploy/templates). It serves as the curated template source for our client-portal and dockhand infrastructure.

## Branch Strategy

- **`main`** -- Production branch, consumed by client-portal and dockhand
- **`upstream/canary`** -- Tracking remote for Dokploy upstream
- **`upstream-sync/*`** -- Auto-generated PR branches from daily sync
- **`self-managed/*`** -- Version bump branches (n8n, ghost, etc.)

## How Upstream Sync Works

A daily GitHub Action (`upstream-sync.yml`) fetches from `Dokploy/templates:canary`, compares with our `main`, and creates a PR if there are changes. Blueprints listed in `overrides/manifest.json` are preserved (ours wins on conflict).

## Modifying a Blueprint

1. Edit the blueprint in `blueprints/{id}/`
2. Add an entry to `overrides/manifest.json` with the reason
3. Commit and push to `main`
4. The daily upstream sync will preserve your changes

## Adding a Self-Managed Template

To track version updates for an app independently of upstream:

1. Add the app to `.github/self-managed-watchlist.yml`
2. Add the app to `overrides/manifest.json`
3. The daily `self-managed-updates.yml` workflow will create PRs when new versions are released

## Curated Templates

The top 25 templates by GitHub stars are listed in `curated/top-25.json`. These receive:

- **Gold tier** (top 10): Priority testing, guaranteed deploy support
- **Silver tier** (next 15): Monthly testing, best-effort support

To update the curated list, run the star sync in client-portal which regenerates the rankings.

## Quality Standards (Our Fork)

Our fork goes beyond upstream by:

- **Deduplicating variants** -- One canonical template per app (no `n8n-with-postgres` alongside `n8n`)
- **Swarm-compatible compose** -- Healthchecks, proper restart policies, no `depends_on` conditions
- **Secure defaults** -- Generated passwords, no hardcoded secrets like `example`
- **Tested blueprints** -- Curated templates verified via dockhand test registry

## Template Structure

Each blueprint follows the upstream Dokploy format:

```
blueprints/{id}/
  docker-compose.yml   # Compose definition
  template.toml        # Dokploy config (domains, env, mounts, variables)
  {logo}.png|svg|jpeg  # App logo
  instructions.md      # Optional setup instructions
```

See the upstream [template.toml docs](https://docs.dokploy.com) for helper syntax (`${domain}`, `${password:N}`, etc.).
