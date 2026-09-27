# Reloop

## Before you deploy

- x86_64 server with 8 GB of RAM and 50 GB of disk. The dashboard and links images are amd64 only, and the images take about 22 GB once unpacked.
- Ports `25`, `465` and `587` must be free on the host, inbound and outbound. Many providers block port `25` by default, so ask yours to open it.

## Domains

The template creates two domains. Replace both before the first deploy, because Reloop writes them into the DNS records it shows for every sending domain:

| Service | Example | Serves |
| --- | --- | --- |
| `proxy` | `reloop.example.com` | Dashboard and API |
| `links` | `link.reloop.example.com` | Click and open tracking, unsubscribe pages |

Then update `BASE_URL`, `HOST_DOMAIN`, `SMTP_HOSTNAME`, `TRACKING_DOMAIN` and `TRACKING_BASE_URL` under **Environment** to match. Keep HTTPS enabled on both domains.

Point these records at the server:

```text
reloop.example.com            A    203.0.113.10
link.reloop.example.com       A    203.0.113.10
inbound.reloop.example.com    A    203.0.113.10
reloop.example.com            TXT  "v=spf1 ip4:203.0.113.10 -all"
```

`inbound.` is the MX target for mail your verified domains receive. Also ask your provider for a PTR record on the server IP that resolves to `reloop.example.com`.

## First sign-in

1. Copy `ADMIN_SETUP_KEY` from **Environment**.
2. Open `https://reloop.example.com/dashboard/setup` and paste it as the setup key.
3. Create the first administrator and organization.

The key works once. Setup signs you in for 7 days; after that Reloop emails a sign-in code, so set `RELOOP_SENDER_DOMAIN` and the `SMTP_*` variables before then.

## Ports

| Port | Service | Protocol |
| --- | --- | --- |
| `25` | `inbound` | SMTP with STARTTLS for received mail |
| `587` | `smtp` | Submission with STARTTLS |
| `465` | `smtp` | Same STARTTLS listener as `587` |

Both mail services use a self-signed certificate.

## Secrets

Do not change the generated secrets after the first deploy. The database password is fixed once Postgres initialises, changing `TRACKING_SECRET` or `PREFERENCES_SECRET` breaks links in mail already sent, and changing `WEBHOOK_ENCRYPTION_KEY` breaks every existing webhook signature.

Full guide: https://reloop.sh/docs/self-host/dokploy
