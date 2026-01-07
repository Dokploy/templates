# AGENTS.md: AI Collaboration Guide

This document provides essential context for AI models interacting with this project. Adhering to these guidelines will ensure consistency and maintain code quality.

## 1. Project Overview & Purpose

- **Primary Goal:** This is the official repository for Dokploy Open Source Templates, maintaining Docker Compose templates for deploying 200+ open-source applications via Dokploy (a self-hosted PaaS alternative to Heroku). The project enables rapid, standardized deployment of OSS applications without manual configuration.
- **Business Domain:** Self-hosted Platform as a Service (PaaS), DevOps tooling, containerized application deployment, and open-source software distribution.

## 2. Core Technologies & Stack

- **Languages:** JavaScript (Node.js), TypeScript (React frontend), YAML (Docker Compose), TOML (template configuration), JSON (metadata), Shell (build scripts).
- **Frameworks & Runtimes:** Node.js runtime, Vite 5.x (for React 19.x frontend), Docker Compose v3.8+, React Router 7.x.
- **Databases:** No direct database usage in core project (templates may include various databases like PostgreSQL, MySQL, Redis, etc.).
- **Key Libraries/Dependencies:**
  - **Core:** `nodemon` for development, custom Node.js scripts for meta processing.
  - **Frontend:** `fuse.js` (fuzzy search), `zustand` (state management), `@iarna/toml` (TOML parsing), `shadcn/ui` components, `@radix-ui` primitives, `@codemirror` (code editor), `react-router-dom`, `tailwindcss`.
  - **Build:** `vite-plugin-static-copy` for copying blueprints to dist.
- **Platforms:** Linux (primary), Docker containers, Dokploy PaaS, Web browsers (for frontend preview), Cloudflare Pages (for PR previews).
- **Package Manager:** npm for root project, pnpm for frontend (`app/` directory).

## 3. Architectural Patterns

- **Overall Architecture:** Template collection and management system with decentralized blueprint architecture. Each blueprint is a self-contained Docker Compose application with Dokploy-specific configuration.
- **Directory Structure Philosophy:**
  - `/blueprints`: Contains all deployable application templates, each as a subdirectory with `docker-compose.yml`, `template.toml`, and logo files. Each blueprint is independent with no shared state.
  - `/app`: Vite + React + TypeScript frontend for local preview and development.
    - `/src/components`: React components (UI components in `/ui` subdirectory using shadcn/ui).
    - `/src/hooks`: Custom React hooks (e.g., `useFuseSearch.ts` for fuzzy search).
    - `/src/store`: Zustand state management store.
    - `/src/lib`: Utility functions and helpers.
  - `/build-scripts`: Advanced meta.json processing tools with CLI options and JSON schema validation.
  - `/.github/workflows`: CI/CD workflows for validation, preview builds, and deployments.
  - Root level: Core processing scripts (`dedupe-and-sort-meta.js`), metadata index (`meta.json`), build configuration (`Makefile`, `package.json`).
- **Module Organization:** Node.js scripts for metadata processing, React components for frontend UI, Docker Compose files for service definitions, TOML files for Dokploy configuration. Frontend uses component-based architecture with hooks for business logic and Zustand for global state.

## 4. Coding Conventions & Style Guide

- **Formatting:** JavaScript follows standard conventions with 2-space indentation. TypeScript in frontend uses ESLint configuration. YAML uses 2-space indentation. TOML files use standard formatting.
- **Naming Conventions:**
  - Variables, functions: camelCase (`myVariable`, `myFunction`)
  - React components: PascalCase (`TemplateGrid`, `SearchBar`)
  - Constants: SCREAMING_SNAKE_CASE (`MAX_BUFFER_SIZE`)
  - Template IDs: lowercase, kebab-case (`activepieces`, `ghost`) - **MUST** be unique across repository
  - Files: snake_case for scripts (`dedupe-and-sort-meta.js`), PascalCase for React components (`TemplateGrid.tsx`), kebab-case for directories (`build-scripts`)
  - Docker services: **MUST** match blueprint folder name exactly (e.g., `ghost` service in `blueprints/ghost/`)
- **API Design:**
  - **Backend:** Procedural scripting approach with CLI interfaces. Template system uses declarative configuration over imperative code.
  - **Frontend:** Component-based React architecture with hooks for logic separation. Zustand for centralized state management. Custom hooks encapsulate complex logic (e.g., `useFuseSearch` for search functionality).
- **Common Patterns & Idioms:**
  - **Metaprogramming:** Minimal use of advanced JavaScript features in scripts, focusing on simple, maintainable code.
  - **Memory Management:** Relies on Node.js garbage collection and React's automatic memory management.
  - **Polymorphism:** Uses JavaScript prototype-based objects and functional programming patterns. React components use composition over inheritance.
  - **Type Safety:**
    - Backend scripts: JavaScript with JSDoc comments for documentation.
    - Frontend: TypeScript with strict type checking enabled.
  - **Concurrency:**
    - Backend: Synchronous processing model for meta.json operations.
    - Frontend: React's concurrent rendering, `useDeferredValue` for debouncing, `useEffect` for async operations.
  - **State Management:** Zustand store pattern with selectors for optimal re-renders. URL params synced with search state via React Router.
- **Error Handling:**
  - Backend: Node.js error-first callback pattern and try-catch blocks. Scripts validate JSON structure and fail fast on errors.
  - Frontend: Error boundaries for React components, try-catch for async operations, user-friendly error messages via toast notifications.

## 5. Key Files & Entrypoints

- **Main Entrypoints:**
  - **Backend:** `dedupe-and-sort-meta.js` - Primary script for processing meta.json file.
  - **Frontend:** `app/src/main.tsx` - React application entry point.
- **Configuration:**
  - `package.json` - Root Node.js project configuration and npm scripts.
  - `app/package.json` - Frontend dependencies and pnpm scripts.
  - `meta.json` - Centralized template registry (200+ entries).
  - `Makefile` - Build automation with targets for processing, validation, and cleanup.
  - `app/vite.config.ts` - Vite build configuration with static copy plugin.
  - `app/tsconfig.json` - TypeScript compiler configuration.
- **CI/CD Pipeline:**
  - `.github/workflows/validate-meta.yml` - Validates meta.json structure, duplicates, and sort order.
  - `.github/workflows/build-preview.yml` - Builds preview deployments for PRs.
  - `.github/workflows/deploy-preview.yml` - Deploys previews to Cloudflare Pages.

## 6. Development & Testing Workflow

- **Local Development Environment:**
  - **Install dependencies**

    ```bash
    # Root project
    npm install

    # Frontend (uses pnpm)
    cd app && pnpm install
    ```

  - **Process meta.json** (CRITICAL: Run after ANY meta.json edits)
    ```bash
    npm run process-meta
    # or
    make process-meta
    # or
    node dedupe-and-sort-meta.js
    ```
  - **Validate without modifying**
    ```bash
    npm run validate-meta
    # or
    make validate
    ```
  - **Quick check for duplicates/sort status**
    ```bash
    make check
    ```
  - **Clean backup files**
    ```bash
    make clean
    ```
- **Task Configuration:**
  - **NPM Scripts:** Run `npm run` to list available scripts. Key scripts:
    - `process-meta`: Remove duplicates and sort meta.json
    - `process-meta-verbose`: Process with detailed output
    - `validate-meta`: Validate structure without changes
  - **Makefile Targets:** Run `make help` to list targets. Key targets:
    - `process-meta`: Process meta.json
    - `validate`: Validate without modifying
    - `check`: Quick duplicate/sort check
    - `build`: Full build process
    - `clean`: Remove backup files
- **Testing:** No formal unit testing framework. Validation occurs through:
  - Script-based validation of meta.json structure and schema
  - Manual testing via Dokploy preview deployments (import base64 from PR preview)
  - JSON schema validation in `build-scripts/process-meta.js`
  - TypeScript compilation errors caught during build
  - ESLint for code quality in frontend
- **CI/CD Process:**
  - **On meta.json changes:** Validates structure, checks for duplicates, verifies sort order, compares processed vs original.
  - **On PR creation:** Builds preview deployment, generates base64 import for testing in Dokploy.
  - **Preview testing:** Use PR description link → Search template → Copy base64 → Import in Dokploy instance.

## 7. Specific Instructions for AI Collaboration

- **Contribution Guidelines:**
  - Follow existing Dokploy template structure strictly. Each blueprint must be independent with no shared state.
  - **CRITICAL:** Always run `node dedupe-and-sort-meta.js` or `npm run process-meta` after ANY meta.json edits.
  - Test templates in Dokploy preview before submitting PRs (use base64 import from PR preview).
  - Add logo file (SVG preferred, ~128x128px) to blueprint folder.
  - Ensure template `id` in meta.json exactly matches blueprint folder name (lowercase kebab-case).
- **Docker Compose Conventions (CRITICAL):**

  - **Version:** MUST be `3.8`
  - **NEVER include:** `ports` (use `expose` only), `container_name`, `networks` (Dokploy handles isolation)
  - **ALWAYS include:** `restart: unless-stopped` or `restart: always`, persistent volumes
  - **Service naming:** MUST match blueprint folder name exactly
  - **Example:**
    ```yaml
    version: "3.8"
    services:
      ghost:
        image: ghost:6-alpine
        restart: always
        volumes:
          - ghost:/var/lib/ghost/content
    volumes:
      ghost:
    ```

- **template.toml Conventions:**

  - **Variables:** Define in `[variables]` section, use helpers for secrets
  - **Domains:** `[[config.domains]]` with `serviceName`, `port`, `host` (path optional)
  - **Env:** Array of strings: `env = ["KEY=VALUE", "DB_PASSWORD=${db_pass}"]`
  - **Available helpers:** `${domain}`, `${password:length}`, `${base64:length}`, `${hash:length}`, `${uuid}`, `${randomPort}`, `${email}`, `${username}`, `${timestamp}`, `${timestamps:datetime}`, `${timestampms:datetime}`, `${jwt:secret_var:payload_var}`
  - **JWT helper example:** `${jwt:mysecret:mypayload}` with payload containing `exp: ${timestamps:2030-01-01T00:00:00Z}`

- **meta.json Requirements:**

  - **Required fields:** `id`, `name`, `version`, `description`, `links` (with `github`), `logo`, `tags` (array)
  - **Tags:** Lowercase strings (e.g., `["monitoring", "database"]`)
  - **Version:** MUST match Docker image version in docker-compose.yml
  - **Logo:** Filename only (e.g., `"ghost.jpeg"`), file must exist in blueprint folder

- **Frontend Development:**

  - Use TypeScript with strict type checking
  - Follow React hooks patterns, avoid class components
  - Use Zustand selectors for state access to optimize re-renders
  - Fuse.js searches across `name`, `description`, `tags`, `id` fields
  - Use shadcn/ui components for consistency
  - Sync URL params with search state via React Router

- **Security:**

  - Be mindful of security when handling template configurations
  - NEVER hardcode secrets in templates - use Dokploy's variable system with helpers
  - Pin Docker images to specific versions to avoid supply chain attacks
  - Validate user input in frontend before processing

- **Dependencies:**

  - When adding new templates, ensure Docker images are pinned to specific versions
  - Update meta.json with exact version matching Docker Compose image version
  - For frontend dependencies: Use `pnpm add <package>` in `app/` directory
  - For root dependencies: Use `npm install <package>` in root directory

- **Commit Messages:** Follow conventional commit patterns (e.g., `feat:`, `fix:`, `docs:`, `chore:`).

- **Common Pitfalls to Avoid:**
  1. Forgetting to process meta.json after editing (CI will fail)
  2. Template ID mismatch between meta.json and folder name
  3. Including `ports`, `container_name`, or `networks` in docker-compose.yml
  4. Using object syntax for env vars in template.toml (must be array of strings)
  5. Logo file missing or filename mismatch in meta.json
  6. Version mismatch between meta.json and docker-compose.yml image tag
