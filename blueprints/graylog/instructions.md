# Graylog

This template runs Graylog Open with MongoDB and self-managed OpenSearch. It uses the normal Graylog login without Data Node's preflight setup.

## Before deploying

- Use an x86-64 server with AVX support for MongoDB.
- Allow at least 3 GiB of available RAM for a small installation. Graylog and OpenSearch each start with a 512 MiB Java heap. Increase their heap settings and MongoDB's cache for larger workloads.
- Set `vm.max_map_count` to at least `262144` on the Docker host. For example, run `sudo sysctl -w vm.max_map_count=262144` and persist the setting in `/etc/sysctl.d/99-graylog.conf`.
- Keep Dokploy's isolated deployment enabled. MongoDB and OpenSearch have no authentication and must stay on the private application network. Do not publish their ports.

## Login

Open the domain assigned by Dokploy. Use username `admin` and the generated `GRAYLOG_ADMIN_PASSWORD` from the service's Environment tab. The startup command hashes this password for Graylog.

When enabling HTTPS or changing the domain in Dokploy, update `GRAYLOG_HTTP_EXTERNAL_URI` to the matching URL, including the trailing slash, and redeploy. Enable HTTPS before sending credentials over an untrusted network.

Keep `GRAYLOG_PASSWORD_SECRET` unchanged after deployment. Graylog uses it to encrypt stored credentials.

## Receive logs

Create an input under **System > Inputs**. For GELF, select **GELF UDP** or **GELF TCP**, bind to `0.0.0.0`, and use port `12201`.

The template does not publish host ports. To accept logs from outside the application network, add the required port mapping to the `graylog` service in Dokploy's Compose editor and redeploy. For GELF UDP:

```yaml
ports:
  - "12201:12201/udp"
```

For GELF TCP, use `12201:12201/tcp`. Choose an unused host port and restrict access to trusted log senders in your firewall. Creating an input and publishing its port are both required. HTTP domain routing does not forward TCP or UDP inputs.

## Data and upgrades

Named volumes store MongoDB configuration, indexed logs, Graylog's node ID, and its message journal. Preserve all four volumes when redeploying or upgrading, and back up MongoDB and OpenSearch together with Graylog's configuration.

Check the [Graylog compatibility matrix](https://go2docs.graylog.org/current/downloading_and_installing_graylog/compatibility_matrix.htm) before changing image versions. OpenSearch 3.x is not supported by this Graylog version.
