# Harbor Dokploy template

This repository is a fork of Dokploy templates with Harbor added under
[`blueprints/harbor`](blueprints/harbor). The original `harbor-docker` project
has not been modified.

The template includes Harbor 2.15.4, Trivy, PostgreSQL, Valkey and persistent
volumes. Automated backup, restore and custom operations/policy services are
excluded. Dokploy generates the domain, unique instance ID and two separate
passwords.

## Publish and import

`origin` points to `https://github.com/XnCN/harbor-dokploy-template.git`;
`upstream` points to the official Dokploy templates repository.

Create the public GitHub repository, then publish the branch with its full
history. This makes the pinned init source commit accessible to Docker's Git
builder. Do not squash away that commit. No image publication is required.

```sh
git push -u origin feat/harbor-template
```

You can set this branch as the default branch on GitHub. Build and host the
existing `app` application to publish the template catalogue. Inclusion in the
official catalogue requires a separate upstream PR; pushing this fork does not
add Harbor to the official catalogue automatically.

Without hosting a catalogue, run `node blueprints/harbor/tools/check.mjs` and
paste `.harbor-validation/harbor-import.base64.txt` into a Dokploy Compose
service's **Advanced → Import** section. Match your real domain in both the
Domain settings and `HARBOR_HOSTNAME`. Use service **proxy**, port **8080**,
with HTTPS enabled.

Full setup and maintenance: [deployment instructions](blueprints/harbor/instructions.md).

## Local validation

```sh
cd app
pnpm install --frozen-lockfile --ignore-scripts
pnpm run build
cd ..
node build-scripts/generate-meta.js --check
node blueprints/harbor/tools/check.mjs
docker build --target test -t harbor-template-init-test:local blueprints/harbor
node blueprints/harbor/tools/integration.mjs
```

The integration test creates a random `harbor-ci-*` instance and cleans up only
its own containers, volumes and network. It does not stop existing applications
or publish host ports. See [validation results](blueprints/harbor/VALIDATION.md).

When changing init code, the vendor template or the image lock, first commit
those support files. Set `revision` in
`blueprints/harbor/tools/build-source.json` to the new full 40-character commit
SHA, then run `node blueprints/harbor/tools/render-compose.mjs`. Publish the
support commit before deploying the updated template.
