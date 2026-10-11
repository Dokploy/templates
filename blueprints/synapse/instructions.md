## Instructions

Synapse is deployed with public registration disabled, so you need to create the
first user (your admin account) from the command line.

### Create the first user

Open a terminal on the server running Dokploy (or use the container terminal in
the Dokploy UI) and run the following inside the `synapse` service container:

```bash
docker exec -it $(docker ps -qf "name=synapse" | head -n 1) \
  register_new_matrix_user http://localhost:8008 -c /config/homeserver.yaml
```

The tool prompts for a username and password, and asks whether the user should
be an admin. It authenticates against the server using the
`registration_shared_secret` that was generated for this deployment (stored in
the mounted `homeserver.yaml`), so no registration needs to be enabled.

### Log in

Point any Matrix client (for example Element Web at https://app.element.io) at
your homeserver URL `https://your-domain` and log in with the user you just
created. You can verify the server is up with:

```bash
curl https://your-domain/_matrix/client/versions
```

### Notes

- Data (signing keys, media uploads) is stored in the `synapse-data` volume and
  the database in the `postgres-data` volume.
- Federation with other Matrix servers works through `.well-known` delegation
  over HTTPS (port 443). The dedicated federation port 8448 is not exposed.
- To allow open registration instead, edit `enable_registration` in the mounted
  `homeserver.yaml` (see Synapse docs for the required spam-check options such
  as CAPTCHA or email verification).
