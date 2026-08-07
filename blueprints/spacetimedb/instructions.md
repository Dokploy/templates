# SpacetimeDB

SpacetimeDB is a database and server runtime in one: your clients connect directly to the database and your application logic runs inside it as WebAssembly modules. There is no web UI — the domain assigned to this service exposes the SpacetimeDB HTTP/WebSocket API (so opening `/` in a browser returns a plain 404; that is expected).

## Verify the server is running

```bash
curl -i https://your-domain.com/v1/ping
```

A `200 OK` response means the server is up.

## Connect with the SpacetimeDB CLI

1. Install the CLI on your local machine:

   ```bash
   curl -sSf https://install.spacetimedb.com | sh
   ```

2. Register your Dokploy instance as a server and make it the default:

   ```bash
   spacetime server add --url https://your-domain.com dokploy --default
   ```

3. Log in (or create an anonymous local identity) and publish a module:

   ```bash
   spacetime login
   spacetime publish --server dokploy my-database
   ```

4. Check connectivity at any time:

   ```bash
   spacetime server ping dokploy
   ```

From your game or app, connect with any SpacetimeDB client SDK (Rust, C#, TypeScript) using `https://your-domain.com` as the host URI. See the [getting started guide](https://spacetimedb.com/docs/getting-started) for a full walkthrough.

## Notes

- All server state (databases, logs and the JWT signing keys used for identities) is persisted in the `spacetimedb-data` volume, so identities survive restarts and upgrades.
- Client connections use WebSockets over the same domain; no extra configuration is needed.
