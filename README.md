# Dokploy Open Source Templates

This is the official repository for the Dokploy Open Source Templates.

### How to add a new template


1. Fork the repository
2. Create a new branch
3. Add the template to the `blueprints` folder (docker-compose.yml, template.yml)
4. Add the template metadata (name, description, version, logo, links, tags) to the `meta.json` file
5. Add the logo to the template folder
6. Commit and push your changes
7. Create a pull request (PR)
8. Every PR will automatically deploy a preview of the template to Dokploy.
9. if anyone want to test the template before merging it, you can enter to the preview URL in the PR description, and search the template, click on the Template Card, scroll down and then copy the BASE64 value, and paste in the advanced section of your compose service, in the Import section or optional you can use the preview URL and paste in the
BASE URL when creating a template. 

#### Optional

If you want to run the project locally, you can run the project with the following command:

```bash
cd app
pnpm install
pnpm run dev
go to http://localhost:5173/
```

### Example

Let's suppose you want to add the [Grafana](https://grafana.com/) template to the repository.

1. Create a new folder inside the `blueprints` folder named `grafana`
2. Add the `docker-compose.yml` file to the folder

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
3. Add the `template.yml` file to the folder, this is where we specify the domains, mounts and env variables, to understand more the structure of `template.yml` you can read here [Template.yml structure](#templateyml-structure)

```yaml
variables:
  main_domain: ${domain}

config:
  domains:
    - serviceName: grafana
      port: 3000
      host: ${main_domain}
  env: []
  mounts: [] 
```
4. Add the `meta.json` file to the folder

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
  "tags": [
    "monitoring"
  ]
},
```
5. Add the logo to the folder
6. Commit and push your changes
7. Create a pull request

### Template.yml structure

Dokploy use a defined structure for the `template.yml` file, we have 4 sections available:


1. `variables`: This is where we define the variables that will be used in the `domains`, `env` and `mounts` sections.
2. `domains`: This is where we define the configuration for the template.
3. `env`: This is where we define the environment variables for the template.
4. `mounts`: This is where we define the mounts for the template.


- The `variables(Optional)` structure is the following:

```yaml
variables:
  main_domain: ${domain}
  my_domain: https://my-domain.com
  my_password: ${password:32}
  any_helper: ${you-can-use-any-helper}
```

- The `config` structure is the following:

```yaml
config:
  domains: # Optional
    - serviceName: grafana # Required
      port: 3000 # Required
      host: ${main_domain} # Required
      path: / # Optional

  env: # Optional
    - AP_HOST=${main_domain}
    - AP_API_KEY=${api_key}
    - AP_ENCRYPTION_KEY=${encryption_key}
    - AP_JWT_SECRET=${jwt_secret}
    - AP_POSTGRES_PASSWORD=${postgres_password}

  mounts: # Optional or []
    - filePath: /content/file.txt
      content: |
        My content
```

Important: you can reference any variable in the `domains`, `env` and `mounts` sections. just use the `${variable_name}` syntax, in the case you don't want to define a variable, you can use the `domain`, `base64`, `password`, `hash`, `uuid`, `randomPort` or `timestamp` helpers.

### Helpers

We have a few helpers that are very common when creating a template, these are:

- `domain`: This is a helper that will generate a random domain for the template.
- `base64 or base64:length`: This is a helper that will encode a string to base64.
- `password or password:length`: This is a helper that will generate a random password for the template.
- `hash or hash:length`: This is a helper that will generate a hash for the template.
- `uuid`: This is a helper that will generate a uuid for the template.
- `randomPort`: This is a helper that will generate a random port for the template.
- `timestamp`: This is a helper that will generate a timestamp.
- `jwt or jwt:length`: This is a helper that will generate a jwt for the template.






