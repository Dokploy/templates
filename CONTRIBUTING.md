# Contributing to Dokploy Open Source Templates

Thank you for your interest in contributing to the Dokploy Open Source Templates repository! This project maintains a collection of Docker Compose templates for easy deployment via Dokploy. Contributions help expand and improve the available templates for the community.

We welcome contributions in the form of new templates, improvements to existing ones, bug fixes, documentation updates, and more. Please follow the guidelines below to ensure a smooth review and integration process.

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code. Reports of unacceptable behavior can be directed to the project maintainers.

## How to Contribute

1. **Fork the Repository**: Start by forking this repository to your GitHub account.
2. **Create a New Branch**: From your fork, create a feature branch named descriptively (e.g., `add-grafana-template`).
3. **Make Your Changes**: Follow the specific guidelines for the type of contribution (e.g., adding a template).
4. **Commit and Push**: Commit your changes with clear, concise messages. Push the branch to your fork.
5. **Open a Pull Request (PR)**: Create a PR from your branch to the main repository. Reference any related issues in the PR description.
6. **Automated Preview**: Every PR automatically deploys a preview of your template to Dokploy. You can test it before merging (see "Testing Your Contribution" below).
7. **Review and Merge**: Respond to feedback from maintainers. Once approved, your changes will be merged.

For larger changes or questions, open an issue first to discuss your ideas.

## Adding a New Template

To add a new template, follow these steps:

1. **Create a Folder in `blueprints/`**: Name it after the template (e.g., `grafana`). Use lowercase with hyphens for multi-word names.
2. **Add `docker-compose.yml`**: Define the services, volumes, and other Compose configurations. Key guidelines:

   - Use `version: "3.8"` or later.
   - Avoid exposing ports explicitly (e.g., no `ports: - "3000:3000"`; just `- 3000` if needed for internal reference).
   - Do not use `container_name`.
   - Avoid custom networks like `dokploy-network`; Dokploy handles isolation automatically.
   - Example for Grafana:
     ```yaml
     version: "3.8"
     services:
       grafana:
         image: grafana/grafana-enterprise:9.5.20
         restart: unless-stopped
         volumes:
           - grafana-storage:/var/lib/grafana
     volumes:
       grafana-storage: {}
     ```

3. **Add `template.toml`**: Configure domains, environment variables, mounts, and variables. This file is crucial for Dokploy integration.

   - Sections: `[variables]` (optional), `[config]` with `[[config.domains]]`, `[[config.env]]`, `[[config.mounts]]`.
   - Use `${variable}` syntax to reference variables or helpers (e.g., `${domain}`, `${password:32}`).
   - Match `serviceName` in domains to the service name in `docker-compose.yml`.
   - Example for Grafana:

     ```toml
     [variables]
     main_domain = "${domain}"

     [config]
     [[config.domains]]
     serviceName = "grafana"
     port = 3000
     host = "${main_domain}"

     [[config.mounts]]
     filePath = "/content/file.txt"
     content = """
     My content
     """
     ```

4. **Update `meta.json`**: Add an entry for your template in the root `meta.json`. Include:

   - `id`: Folder name (e.g., "grafana").
   - `name`: Display name.
   - `version`: Image/tag version.
   - `description`: Brief overview.
   - `logo`: Filename of the logo (e.g., "grafana.svg").
   - `links`: Object with `github`, `website`, `docs` (URLs).
   - `tags`: Array of categories (e.g., ["monitoring"]).
   - Example:
     ```json
     {
       "id": "grafana",
       "name": "Grafana",
       "version": "9.5.20",
       "description": "Grafana is an open source platform for data visualization and monitoring.",
       "logo": "grafana.svg",
       "links": {
         "github": "https://github.com/grafana/grafana",
         "website": "https://grafana.com/",
         "docs": "https://grafana.com/docs/"
       },
       "tags": ["monitoring"]
     }
     ```

5. **Add a Logo**: Place an SVG or PNG logo (e.g., `grafana.svg`) in the template folder. Keep it simple and representative (ideally 512x512 or similar).

6. **Run Validation**: Before pushing, run `node dedupe-and-sort-meta.js` (if available) or manually check for syntax errors in YAML/TOML/JSON.

7. **Commit and PR**: Push your branch and open a PR. Include:
   - A description of the template.
   - The preview URL (auto-generated).
   - Any testing notes.

## Template.toml Structure

- **[variables]**: Define reusable values or use helpers.
  Example:

  ```toml
  [variables]
  main_domain = "${domain}"
  my_password = "${password:32}"
  ```

- **[config.domains]**: Map services to domains/ports.

  - Required: `serviceName`, `port`, `host`.
  - Optional: `path`.

- **[config.env]**: Array of environment variables (strings).
  Example: `env = ["GF_SECURITY_ADMIN_PASSWORD=${password:32}"]`

- **[config.mounts]**: Inline files or configs.
  - `filePath`: Destination in container.
  - `content`: Multi-line string.

### Helpers

Use these in `${}` for dynamic values:

- `${domain}`: Random subdomain.
- `${password:length}`: Random password (default 32 chars).
- `${base64:length}`: Base64-encoded random string.
- `${hash:length}`: Random hash.
- `${uuid}`: UUID.
- `${randomPort}`: Random port.
- `${email}`: Random email.
- `${username}`: Random lowercase username.
- `${timestamp}`: Current timestamp (ms).
- `${timestamps:datetime}` or `${timestampms:datetime}`: Timestamp at specific date (e.g., `${timestamps:2030-01-01T00:00:00Z}`).
- `${jwt:secret_var:payload_var}`: JWT token (advanced; see README for details).

## Best Practices and Suggestions

- **Docker Compose**:

  - Omit explicit ports; let Dokploy handle exposure.
  - Use persistent volumes for data (e.g., databases).
  - Set `restart: unless-stopped` for services.

- **Template.toml**:

  - Keep service names consistent across files.
  - Use variables/helpers for secrets (e.g., passwords, API keys).
  - Minimize env vars; only include essentials.

- **General**:

  - Templates should be self-contained and deployable out-of-the-box.
  - Use official/latest stable images.
  - Avoid hardcoding domains, networks, or secrets.
  - Ensure compatibility with Dokploy's isolated deployments.

- **Logo and Metadata**:
  - Logos should be vector (SVG preferred) or high-res PNG.
  - Descriptions: 1-2 sentences, SEO-friendly.
  - Tags: Relevant categories (e.g., "database", "web", "monitoring").

## Testing Your Contribution

Before submitting a PR:

1. Run the project locally:
   ```bash
   cd app
   pnpm install
   pnpm run dev
   # Visit http://localhost:5173/
   ```
2. Use the PR preview:
   - After pushing, check the PR for the auto-generated preview URL.
   - Search for your template, copy the Base64 config.
   - In your Dokploy instance: Create a Compose service > Advanced > Import > Paste Base64 > Deploy.
   - Verify the service starts and is accessible (e.g., via assigned domain).
3. Test edge cases: Restart, volume persistence, env vars.

If issues arise, debug locally or in the preview. Fix and update your PR.

## Updating Existing Templates

- Follow the same structure as adding new ones.
- Bump `version` in `meta.json` and update `docker-compose.yml` image tags.
- Test thoroughly, as changes may affect users.

## Reporting Bugs or Requesting Features

- Open an issue with:
  - Clear title and description.
  - Steps to reproduce (for bugs).
  - Template details (for feature requests).
- Use the issue templates in `.github/ISSUE_TEMPLATE/`.

## Questions?

If you're unsure about anything, open a discussion or issue. We're here to help!

Happy contributing! 🚀
