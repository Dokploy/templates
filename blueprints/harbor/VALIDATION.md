# Harbor validation record

Date: 2026-10-20. Harbor: 2.15.4. Docker server: Linux, Engine 29.6.2.
Init source: `fc224d78800ffad4cd2a21ecd08f24c6fa122b82`.

## Passed

- All 573 template metadata entries validated with the upstream metadata checker.
- Upstream Compose and template validators accepted the Harbor blueprint.
- YAML and TOML parsing, generated Compose consistency, vendor checksum,
  immutable Git source and local source/commit consistency checks passed.
- The Base64 import payload matches the catalogue's `{ compose, config }` format.
- Docker built the init image and ran all 14 Python unit tests successfully.
- A fresh isolated Compose deployment completed init and reached healthy state
  for all workloads, including Trivy.
- Harbor health, admin login, registry authentication challenge and public token
  URL were verified using the deployment's domain as the HTTP Host header.
- A private Harbor project and signing/encryption keys survived restart and
  forced container recreation.
- Explicit reconfiguration refused running workloads; changing worker count
  with workloads stopped preserved the existing keys and private project.
- The catalogue production build passed on Windows after fixing the handling
  of Git's `public/blueprints` symlink. The HTTP preview served Harbor metadata,
  Compose, TOML, instructions and the official logo successfully.

The catalogue build reports its existing JavaScript chunk-size warning.
Integration tests use a unique random `harbor-ci-*` instance and remove only
their own containers, volumes and default network.

## Remaining deployment acceptance checks

- The new GitHub repository has not been published by this task. Git builds
  require the pinned source commit to be accessible in that public repository.
- Remote Git fetching and actual Dokploy Base64 import have not been exercised.
  Local integration builds the same pinned support files from disk.
- Public DNS, Let's Encrypt certificate issuance and Dokploy's generated
  network/domain configuration require verification on the target server.
- End-to-end Docker login, push/pull over trusted HTTPS and a complete Trivy
  vulnerability scan require the deployed domain and vulnerability DB download.
- No production data migration or Harbor version upgrade was attempted.

See [instructions.md](instructions.md) for deployment acceptance steps and
[../../HARBOR.md](../../HARBOR.md) for local validation commands.
