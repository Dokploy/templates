# Dokploy Open Source Templates - Copilot Instructions

## Project Overview

This repository maintains Docker Compose templates for deploying open-source applications via Dokploy, a self-hosted PaaS alternative to Heroku. The core structure revolves around the `blueprints/` directory, where each subdirectory represents a deployable service (e.g., `blueprints/ghost/` for Ghost blogging platform).

Key components:

- **Blueprints**: Self-contained templates with `docker-compose.yml` (service definitions) and `template.toml` (Dokploy-specific configuration for domains, env vars, mounts).
- **meta.json**: Centralized index of all templates, aggregated from blueprint metadata. Entries include `id`, `name`, `version`, `description`, `logo`, `links`, and `tags`.
- **Scripts**: Node.js tools in root and `build-scripts/` for maintaining `meta.json` (deduplication, sorting, validation).

Data flow: New templates added to `blueprints/` → Metadata updated in `meta.json` → Processing scripts ensure consistency → App builds include static blueprints/meta for preview.

The "why": Enables rapid, standardized deployment of 200+ OSS apps on Dokploy without manual config. Structure prioritizes simplicity—each blueprint is independent, no shared state or complex interdependencies.

## Key Files and Directories

- `meta.json`: Array of template objects. Always process after edits using `node dedupe-and-sort-meta.js` to remove duplicates (by `id`) and sort alphabetically.
- `blueprints/<service>/`:
  - `docker-compose.yml`: Standard Docker Compose v3.8. Avoid `ports`, `container_name`, `networks`—Dokploy handles isolation via internal networks.
  - `template.toml`: Defines variables (e.g., `${domain}`), domains (service:port → host), env vars, and mounts. Use helpers like `${password:32}`, `${uuid}`, `${jwt:secret_var}`.
  - `logo.svg/png`: Service icon, referenced in `meta.json`.
- `dedupe-and-sort-meta.js`: Standalone script—reads `meta.json`, removes duplicate `id`s (keeps first), sorts by `id` (case-insensitive), creates timestamped backup.
- `build-scripts/process-meta.js`: Advanced processor with CLI options (`--verbose`, `--no-backup`, `--input`/`--output`), JSON schema validation (required: `id`, `name`, `version`, `description`, `links.github`, `logo`, `tags` array).

Exemplary blueprint: `blueprints/ghost/`—`docker-compose.yml` exposes port 2368; `template.toml` maps domain to Ghost service; meta entry tags as ["blogging", "cms"].

## Development Workflow

1. **Add/Update Template**:

   - **REQUIREMENT**: Service **MUST** be open source. Only add templates for applications with an open-source license (e.g., MIT, Apache, GPL, AGPL). Proprietary or closed-source services are not allowed.
   - **Verify Docker Images**: Before using any Docker image in `docker-compose.yml`, verify it exists using `docker manifest inspect <image:tag>` (e.g., `docker manifest inspect docker.io/bitnami/discourse:3.5.0`). This ensures the image is available and prevents deployment failures.
   - Create `blueprints/<id>/` (e.g., `ghost`).
   - Implement `docker-compose.yml` (single service typical; use volumes for persistence).
   - Configure `template.toml`—reference vars in `[config.domains]`, `[config.env]`, `[config.mounts]`.
   - Add/update `meta.json` entry with exact `id` matching folder.
   - Run `node dedupe-and-sort-meta.js --backup` to validate/sort.
   - Commit; PR triggers Dokploy preview (base64 import for testing).

2. **CI/CD**:
   - `.github/workflows/validate-meta.yml` (if present): Runs validation on push/PR—fails on duplicates, invalid JSON, missing fields.
   - Integrate processing: Add `npm run process-meta` to build steps; use `--no-backup` in CI.

No tests in repo—focus on manual validation via scripts and Dokploy deploys. Debug: Check console output from processing scripts for warnings (e.g., missing `id`).

## Conventions and Patterns

- **Open Source Requirement**: **ALL services MUST be open source**. Only applications with open-source licenses (MIT, Apache, GPL, AGPL, etc.) are allowed. Proprietary or closed-source services are strictly prohibited.
- **Template IDs**: Lowercase, kebab-case (e.g., `active-pieces`); unique across repo—enforced by dedupe script.
- **Docker Compose**: Minimal—omit `ports` (Dokploy proxies), persistent volumes (e.g., `- db-data:/var/lib/postgresql/data`). Services named after folder (e.g., `ghost` service).
- **template.toml**:
  - Variables: `[variables] main_domain = "${domain}"`; use helpers for secrets (`${password:64}`, `${base64:32}`).
  - Domains: `[[config.domains]] serviceName = "<service>" port = 80 host = "${main_domain}"` (path="/" optional).
  - Env: `[[config.env]]` array of "KEY=VALUE" strings, interpolating vars (e.g., "DB_PASSWORD=${db_pass}").
  - **URL Variables**: When environment variables require URLs (e.g., `WEB_URL`, `NEXTAUTH_URL`, `PUBLIC_URL`), **always use HTTP by default** (e.g., `"http://${main_domain}"`). HTTPS should only be used if explicitly required by the application or when using a reverse proxy with SSL termination.
  - Mounts: `[[config.mounts]] filePath = "/etc/config" content = """multi-line\ncontent"""`.
  - JWT helper: `${jwt:secret_var:payload_var}` for auth tokens; payload as JSON string with `exp: ${timestamps:YYYY-MM-DDTHH:mm:ssZ}`.
- **Meta.json**: Entries as JSON objects; tags array of lowercase strings (e.g., ["monitoring", "database"]); links object with `github`, `website`, `docs`.
- **No Networks**: Rely on Dokploy's isolated deployments—avoid explicit `networks:`.
- **Versions**: Pin images to specific versions in `docker-compose.yml` (e.g., `ghost:5.82.0-alpine`); match in `meta.json.version`. **NEVER use `latest` tag**—it can break templates when upstream images change unexpectedly. **Always verify image exists** using `docker manifest inspect <image:tag>` before committing.
- **Logos**: SVG preferred; size ~128x128; file name in `meta.json.logo` (e.g., "ghost.svg").

Cross-component: Templates are independent and ship as static blueprints/meta.

## Integration Points

- **Dokploy**: Templates import via base64 (full compose + config) or URL. Test deploys validate env interpolation, domain proxying.
- **External Deps**: Docker Compose (v3.8+); TOML parsing via `@iarna/toml` in app. No runtime deps beyond Node/pnpm for dev.
- **PR Previews**: Auto-generated on GitHub—use for end-to-end testing without local Dokploy.

When editing, always re-run meta processing and validate blueprint deploy in preview.
