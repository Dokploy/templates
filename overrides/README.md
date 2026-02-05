# Blueprint Overrides

This directory tracks blueprints that have been locally modified from their upstream Dokploy versions.

## How it works

- `manifest.json` lists every blueprint we've modified locally, along with the reason.
- The daily `upstream-sync` workflow preserves our version for blueprints in this list (ours wins on merge conflicts).
- Client-portal and dockhand fetch overridden blueprints from this fork's raw URL instead of the CDN.

## Adding an override

1. Modify the blueprint in `blueprints/{id}/docker-compose.yml`
2. Add an entry to `manifest.json` with the template `id` and `reason`
3. Commit and push to `main`

## Removing an override

1. Remove the entry from `manifest.json`
2. The next `upstream-sync` PR will include the upstream version of that blueprint
3. Review and merge the PR to restore the upstream version
