# Template validation

Tested on 2026-09-06 using Dokploy on Linux x86-64, Docker Engine 29.1.3, and the exact image tags in this template.

## Checks performed

- Imported the Base64 payload containing `docker-compose.yml` and `template.toml` through Dokploy's `compose.import` API.
- Enabled isolated deployment and deployed through Dokploy.
- Validated Compose interpolation and syntax with `docker-compose config --quiet`.
- Confirmed all three containers became healthy.
- Requested the assigned domain through Traefik and received HTTP 200.
- Confirmed authenticated API access through Traefik returned HTTP 200 and unauthenticated access to the protected API returned HTTP 401.
- Authenticated to `/api/system` with `admin` and the generated password. The server reported `7.1.9+002c047`.
- Created a global GELF UDP input on port 12201 through `/api/system/inputs`.
- Sent a GELF message to that input over the private container network and retrieved it through Graylog's authenticated search API.
- Stopped and started the stack through Dokploy. The message remained searchable, the input remained configured, and Graylog retained its node ID.
- The instance owner tested the web interface and confirmed it works.
- Verified OpenSearch's effective `action.auto_create_index` setting is `false`. Ingested and searched a message, manually rotated the default index set from `graylog_0` to `graylog_1`, then ingested and found a second message in the new write index.

The three containers used approximately 2 GiB of RAM during this small test. This is not a throughput or production sizing benchmark.

Public TCP/UDP port mappings were not tested. The default template publishes no ingestion ports.

## Repeat the ingestion check

1. Deploy the template with isolated deployment enabled.
2. Log in with the credentials described in `instructions.md`.
3. Create a global GELF UDP input bound to `0.0.0.0:12201`.
4. From a sender with access to that input, send a GELF message. For example, using Python and replacing `GRAYLOG_INPUT_HOST` with the reachable input address:

   ```python
   import json
   import socket

   message = {
       "version": "1.1",
       "host": "dokploy-template-test",
       "short_message": "dokploy-graylog-persistence-test",
   }
   with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sender:
       sender.sendto(json.dumps(message).encode(), ("GRAYLOG_INPUT_HOST", 12201))
   ```

5. Search for `message:"dokploy-graylog-persistence-test"` in Graylog.
6. Stop and start the service through Dokploy, then repeat the search and check the input configuration. Keep the search time range wide enough to include the original message.
