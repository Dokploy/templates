# Mailu

## Getting started

1. Point the domain you assign in Dokploy (for example `mail.example.com`) at your server **before** deploying: an `A` record, plus an `MX` record for your mail domain targeting it.
2. Deploy the template and open the domain: `/webmail` is Roundcube, `/admin` is the admin UI.
3. Log in at `/admin` with `admin@<your domain>` and the auto-generated `INITIAL_ADMIN_PW` (Dokploy → your service → Environment). The account is created only on first boot (`INITIAL_ADMIN_MODE=ifmissing`); change the password from the admin UI afterwards.
4. In the admin UI, open **Mail domains → your domain → Details** and create the DNS records it shows (SPF, DKIM, DMARC). Also set the **PTR/reverse DNS** record of your server IP to your mail hostname — most providers require this to accept your mail.

## Ports

The mail protocol ports are published directly on the host: **25** (SMTP), **465** (SMTPS), **587** (submission) and **993** (IMAPS). The deployment fails to start if another mail server (or a previous Mailu deployment) already binds them on the same machine. Many VPS providers block outbound port 25 by default — ask your provider to unblock it, or configure a relay host in Mailu.

## TLS

- The web UI is served through Traefik like any other Dokploy app. Enable **HTTPS with Let's Encrypt** on the Dokploy domain: the web login cookie requires HTTPS, and Mailu's internal certbot self-check follows Traefik's HTTP→HTTPS redirect and needs a valid certificate there.
- The mail ports get their own Let's Encrypt certificate: the `front` container runs certbot internally and answers the HTTP-01 challenge through Traefik on port 80. This only succeeds once the DNS record of your domain points at the server. If the certificate was obtained *after* the first boot, restart the `front` service once so the TLS mail listeners (465/587/993) come up.

## Notes

- `SUBNET` (default `172.16.0.0/12`) is the network range Mailu trusts for its internal traffic (Postfix relay/XCLIENT, Dovecot proxying, Rspamd). It covers Docker's default address pools; if your Docker daemon uses custom pools, adjust it to match. Note this means other containers on the same Docker host are treated as trusted senders.
- The containers use public DNSSEC-validating resolvers (`1.1.1.1`, `8.8.8.8`) as upstream DNS: the admin container requires DNSSEC validation and Postfix uses it for DANE. Heavy production use benefits from a dedicated local resolver instead, because public resolvers are rate-limited by DNSBLs (see the [Mailu DNS FAQ](https://mailu.io/2024.06/faq.html)).
- Additional mail domains, users, aliases and fetchmail can be managed in the admin UI. ClamAV antivirus is not included in this template to keep memory usage low (it needs >1 GB RAM); see the Mailu docs to add it.
