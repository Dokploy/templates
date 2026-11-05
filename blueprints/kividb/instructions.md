1. KiviDB speaks the Redis protocol (RESP2/RESP3) on port `6380`, not 6379. It has no web interface, so this template has no domain.
2. Inside this compose project, connect to `kividb:6380`, e.g. `redis://:<password>@kividb:6380`. Use any Redis client or `redis-cli -h kividb -p 6380`.
3. The password is the generated `KIVIDB_PASSWORD` in the Dokploy environment settings.
4. Data is kept in the `kividb-data` volume (`/home/kividb`), with append-only persistence turned on (`--aof`).
5. The image has no shell and no `redis-cli`, so there is no container healthcheck and `docker exec` into it will not work; check it from a client instead.
6. Keep port `6380` private unless remote clients need direct access.
