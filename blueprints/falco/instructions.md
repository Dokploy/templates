# Falco

This template runs Falco with the modern eBPF engine and stores events in Redis Stack for Falcosidekick UI. Telegram alerts through Falcosidekick are optional.

## Host requirements

- Use Docker Compose on a Linux server with a kernel that supports modern eBPF (normally Linux 5.8 or later) and kernel BTF at `/sys/kernel/btf/vmlinux`.
- The Docker socket, `/proc`, `/etc`, and `/sys/kernel/tracing` must exist on the deployment server. Falco mounts these host paths read-only to inspect activity. Unlike application data, these paths must refer to the real host directories.
- If tracefs is mounted at `/sys/kernel/debug/tracing`, change only the tracing bind mount's `source` to that path and keep its `target` as `/sys/kernel/tracing`.
- Falco needs `SYS_ADMIN`, `SYS_RESOURCE`, and `SYS_PTRACE`, with an unconfined AppArmor profile. Rootless Docker and hosts that prohibit these capabilities are not supported by this template.
- The service memory limits total 2.5 GiB. Leave additional memory for Dokploy, the operating system, and other applications.

See [Falco's container deployment guide](https://falco.org/docs/setup/container/) for the supported host configuration.

## Before deploying

Set these values in Dokploy's **Environment** tab:

| Variable | Value |
| --- | --- |
| `MONITORED_HOST` | A hostname label for the monitored server, such as `production-01`. This appears in alerts and is not the UI domain. |
| `TELEGRAM_BOT_TOKEN` | Optional. Leave empty to disable Telegram alerts, or set it together with `TELEGRAM_CHAT_ID` to enable them. |
| `TELEGRAM_CHAT_ID` | Optional. The target chat ID, including its leading minus sign for a group chat. Set it together with `TELEGRAM_BOT_TOKEN`. |
| `TELEGRAM_MINIMUM_PRIORITY` | Defaults to `notice`. Filters Telegram alerts when Telegram is configured. |
| `FALCO_UI_USER` | Defaults to `admin`. |
| `FALCO_UI_PASSWORD` | Generated automatically when you import the template. |
| `FALCO_REDIS_PASSWORD` | Generated automatically when you import the template. |

For deployment without Telegram, leave `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` empty. Falco still detects events and sends them to the dashboard. Only the monitored hostname and the UI and Redis passwords are required.

To enable Telegram alerts, provide both credentials, start a conversation with the bot or add it to the target group, and redeploy.

The generated passwords are independent 64-character hexadecimal strings. To replace one, generate a new value with `openssl rand -hex 32`. Keep the Redis password unchanged across redeployments unless you also update all services that use it.

Falco collects events at `notice` or higher. Changing `TELEGRAM_MINIMUM_PRIORITY` only filters Telegram delivery; it does not change Falco's collection threshold or the events sent to the UI.

## Open the dashboard

Deploy with Dokploy's isolated deployments enabled. Open the domain assigned to `falco-ui` on port `2802` and log in with `FALCO_UI_USER` and `FALCO_UI_PASSWORD`. Enable HTTPS for that domain in Dokploy.

Dokploy manages the stack's network and domain routing. No host ports are published. Redis loads the RediSearch and RedisJSON modules required by the UI, requires authentication, and stores data in the `falco-events` volume, with append-only persistence and a seven-day UI event lifetime.

## Verify alerts

On the monitored server, start an interactive shell in a disposable container:

```bash
docker run --rm -it alpine:3.21 sh
```

Exit the shell after it starts. Check the Falco logs and dashboard for the **Terminal shell in container** event. Its hostname should match `MONITORED_HOST`. If Telegram is configured, check the Telegram chat as well.
