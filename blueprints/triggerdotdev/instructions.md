# Trigger.dev Setup Instructions

## Deploy

1. In Dokploy, create the service from the **Trigger.dev** template.
2. Dokploy generates all required secrets (`MAGIC_LINK_SECRET`, `SESSION_SECRET`, `ENCRYPTION_KEY`, database credentials, etc.) automatically.
3. Deploy and wait until the containers are running. The main domain points to the `webapp` service (port `3000`).

If you serve the app over HTTPS, set `TRIGGER_PROTOCOL=https` in the **Environment** tab (the template defaults to `http`) so that login links use the correct scheme, then redeploy.

## First login (no email server configured)

Trigger.dev logs you in with **magic links** sent by email. The template does not configure an email transport by default, so the email is never actually sent. Instead, **the magic link is printed to the logs of the `webapp` container**:

1. Open `https://<your-domain>` and enter your email address to request a magic link.
2. In Dokploy, go to your Trigger.dev service, open the **Logs** tab, and select the `webapp` container/service.
3. Look for a recent log entry containing a URL like `.../magic?token=...` (search for `magic`).
4. Copy that URL into your browser to complete the login.

## Configure email sending (optional)

To have magic links delivered by email, add these variables in the **Environment** tab and redeploy.

Using SMTP:

```
EMAIL_TRANSPORT=smtp
FROM_EMAIL=trigger@example.com
REPLY_TO_EMAIL=trigger@example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
```

Using [Resend](https://resend.com):

```
EMAIL_TRANSPORT=resend
FROM_EMAIL=trigger@example.com
REPLY_TO_EMAIL=trigger@example.com
RESEND_API_KEY=your-resend-api-key
```

## Restrict who can sign up (recommended)

By default anyone who can reach the webapp can request a magic link. Restrict access with a regex of allowed email addresses:

```
WHITELISTED_EMAILS=you@example\.com|teammate@example\.com
```

You can also grant admin rights by email with `ADMIN_EMAILS` (same regex format).
