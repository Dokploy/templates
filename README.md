# Dokploy Open Source Templates

This is the official repository for the Dokploy Open Source Templates.

### How to add a new template


1. Fork the repository
2. Create a new branch
3. Add the template to the `blueprints` folder (`docker-compose.yml`, `template.toml`)
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
3. Add the `template.toml` file to the folder, this is where we specify the domains, mounts and env variables, to understand more the structure of `template.toml` you can read here [Template.toml structure](#template.toml-structure)

```toml
[variables]
main_domain = "${domain}"

[config]
[[config.domains]]
serviceName = "grafana"
port = 3000
host = "${main_domain}"


[config.env]

[[config.mounts]]
```
4. Add meta information to the `meta.json` file in the root folder

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

### Template.toml structure

Dokploy use a defined structure for the `template.toml` file, we have 4 sections available:

1. `variables`: This is where we define the variables that will be used in the `domains`, `env` and `mounts` sections.
2. `domains`: This is where we define the configuration for the template.
3. `env`: This is where we define the environment variables for the template.
4. `mounts`: This is where we define the mounts for the template.

- The `variables(Optional)` structure is the following:

```toml
[variables]
main_domain = "${domain}"
my_domain = "https://my-domain.com"
my_password = "${password:32}"
any_helper = "${you-can-use-any-helper}"
```

- The `config` structure is the following:

```toml
[config]
# Optional sections below

[[config.domains]]
serviceName = "grafana" # Required
port = 3000 # Required
host = "${main_domain}" # Required
path = "/" # Optional

env = [
    "AP_HOST=${main_domain}",
    "AP_API_KEY=${api_key}",
    "AP_ENCRYPTION_KEY=${encryption_key}",
    "AP_JWT_SECRET=${jwt_secret}",
    "AP_POSTGRES_PASSWORD=${postgres_password}"
]

[[config.mounts]]
filePath = "/content/file.txt"
content = """
My content
"""
```

Important: you can reference any variable in the `domains`, `env` and `mounts` sections. just use the `${variable_name}` syntax, in the case you don't want to define a variable, you can use the `domain`, `base64`, `password`, `hash`, `uuid`, `randomPort`, `timestamp`, `jwt`, `email`, or `username` helpers.

### Helpers

We have a few helpers that are very common when creating a template, these are:

- `domain`: This is a helper that will generate a random domain for the template.
- `base64 or base64:length`: This is a helper that will encode a string to base64 (lenght is the number of bytes to encode not the encoded string length).
- `password or password:length`: This is a helper that will generate a random password for the template.
- `hash or hash:length`: This is a helper that will generate a hash for the template
- `uuid`: This is a helper that will generate a uuid for the template.
- `randomPort`: This is a helper that will generate a random port for the template.
- `email`: This is a helper that will generate a random email for the template.
- `username`: This is a helper that will generate a random username in lowercase for the template.
- `timestamp`: This is a helper that will generate a timestamp for "now" in milli-second.
  - `timestampms or timestampms:datetime`: This is a helper that will generate a timestamp in milli-seconds.
  - `timestamps or timestamps:datetime`: This is a helper that will generate a timestamp in seconds.
  - `datetime` parameter for `timestamps/timestampms` helpers must be a valid value for javascript new Date() (ie: `timestamps:2030-01-01T00:00:00Z`)
- `jwt`: This is a helper that will generate a jwt for the template.
  - `jwt:length`: will generate a random hex string of bytes length. _This should not be used in newer templates_
  - `jwt:secret_var_name`: will generate a jwt with some default values, secret var name should be the name of the variable holding the secret
  - `jwt:secret_var_name:payload_var_name`: is the same as above but you can pass partial or full payload for the jwt.
    Here's a full example
    ```toml
    [variables]
    main_domain = "${domain}"
    mysecret = "cQsdycq1hDLopQonF6jUTqgQc5WEZTwWLL02J6XJ"
    mypayload = """
    {
      "role": "jwt-tester",
      "iss": "dokploy-templates",
      "exp": ${timestamps:2030-01-01T00:00:00Z}
    }
    """
    jwt = "${jwt:mysecret:mypayload}"
    ```



## General Suggestions when creating a template

- Don't use this way in your docker compose file:

```yaml
services:
  grafana:
    image: grafana/grafana-enterprise:9.5.20
    restart: unless-stopped
    ports:
      - 3000:3000

    # Instead use this way:
    ports:
      - 3000
```

- Don't use this way in your template.toml file, make sure to use the same service name as the one in the docker compose file:

```toml
[config]
[[config.domains]]
serviceName = "MyGrafanaService"
# Instead use this way:
serviceName = "grafana" # Make sure to use the same service name as the one in the docker compose file
```

- Don't use container_name in your docker compose file, make sure to use the same service name as the one in the template.toml file:

```yaml
services:
  grafana:
    container_name: grafana # ❌ Remove this
```

- Don't use dokploy-network in your docker compose file, by default all the templates have this flag enabled https://docs.dokploy.com/docs/core/docker-compose/utilities#isolated-deployments, so by default they have a internal network created, so you don't need to create a new one or use the dokploy-network name.

```yaml
services:
  grafana:
    networks:
      - dokploy-network # ❌ Remove this or any other network defined
```


- Please before submit a PR, make sure to test the template in your instance, so the maintainers don't spend time trying to figure out what's wrong.

1. Everytime you submit a PR, it will display a Preview Link.
2. Enter to the Preview Link and search the template you've submitted.
3. Click on the Template Card, and click the Copy Button in the Base64 Configuration.
4. Go to your instance, create a new Compose Service, go to Advanced Section -> Scroll Down -> Import Section -> Paste the Base64 Value -> Click on the Import Button
5. If everything is correct and set, you should see a modal with all the details (Compose File, Environment Variables, Mounts, Domains, etc)
6. Now you can click on the Deploy Button and wait for the deployment to finish, and try to access to the service, if everything is correct you should access to the service and see the template working.


use the command `node dedupe-and-sort-meta.js` to deduplicate and sort the meta.json file.