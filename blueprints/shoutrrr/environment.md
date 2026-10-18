# Shoutrrr 1.5.4 environment reference

Set variables in Dokploy **Environment** and redeploy. Its `.env` file is passed to the container, matching upstream’s production Compose approach. Only the core settings appear initially; every runtime variable below can be added without editing Compose. Omit unused optional keys rather than setting them to empty strings. Never commit credentials.

This inventory covers the application’s runtime configuration in [the pinned v1.5.4 source](https://github.com/coollabsio/shoutrrr/tree/v1.5.4/config), its documented environment example, and Shoutrrr-specific image controls. It does not enumerate generic PHP/base-image environment extensions. Defaults below are effective template values where overridden; otherwise they show upstream fallback values or expressions. `unset` means no explicit fallback. Database-driver-specific alternatives are separated with semicolons.

## Required and automatic settings

- **Required, generated:** `APP_KEY` (32 random bytes encoded as `base64:…`) and `APP_URL` (the generated domain). No credentials need to be supplied to boot.
- **Required for public production use:** enable HTTPS in Dokploy and set `APP_URL=https://…`, `OCTANE_HTTPS=true`, and `SESSION_SECURE_COOKIE=true` before using real accounts.
- **Automatic defaults:** self-hosted mode, SQLite, database cache/queue/sessions, public local media, one worker, scheduler, non-debug production mode, and closed registration after the first owner.
- **Conditional:** mail delivery credentials for delivered email; provider OAuth credentials for the relevant platforms; object-storage or external database/queue credentials only when choosing those services.
- **Fixed by Compose:** `APP_ENV=production`, `APP_DEBUG=false`, `SELF_HOSTED=true`, and `OCTANE_SERVER=frankenphp`. Other mapped variables can be overridden in Environment.

## Runtime variables

### Application and proxy

`APP_KEY` and `APP_URL` are required and generated at import. Preserve the key across upgrades. Locale and maintenance settings are optional. `APP_ENV`, `APP_DEBUG`, and self-hosted mode are fixed by Compose for this template.

| Variable | Default |
| --- | --- |
| `APP_NAME` | `Shoutrrr` |
| `APP_VERSION` | `1.5.4 (baked into image)` |
| `APP_ENV` | `production (fixed)` |
| `APP_DEBUG` | `false (fixed)` |
| `APP_URL` | `generated HTTP URL; required; change to public HTTPS URL` |
| `TRUSTED_PROXIES` | `*` |
| `APP_LOCALE` | `en` |
| `APP_FALLBACK_LOCALE` | `en` |
| `APP_FAKER_LOCALE` | `en_US` |
| `APP_KEY` | `generated: base64 + 32 random bytes; required` |
| `APP_PREVIOUS_KEYS` | `empty string` |
| `APP_MAINTENANCE_DRIVER` | `file` |
| `APP_MAINTENANCE_STORE` | `database` |

### Authentication

Advanced overrides; keep the supplied authentication guard/model. Email verification is automatically disabled with the `log` or `array` mailer and enabled with a delivery transport. Signed-URL exceptions accommodate mail click tracking.

| Variable | Default |
| --- | --- |
| `AUTH_GUARD` | `web` |
| `AUTH_PASSWORD_BROKER` | `users` |
| `MAIL_MAILER` | `log` |
| `SIGNED_URL_IGNORED_PARAMETERS` | `utm_source,utm_medium,utm_campaign,utm_term,utm_content,bento_uuid` |
| `AUTH_MODEL` | `User::class` |
| `AUTH_PASSWORD_RESET_TOKEN_TABLE` | `password_reset_tokens` |
| `AUTH_PASSWORD_TIMEOUT` | `10800` |

### Cache backends

Optional tuning. Database cache needs no extra service. Memcached, Redis, DynamoDB, or other backends require their own infrastructure and credentials; this template does not provision them. Omit nullable connection/lock settings to inherit the primary connection.

| Variable | Default |
| --- | --- |
| `CACHE_STORE` | `database` |
| `DB_CACHE_CONNECTION` | `unset` |
| `DB_CACHE_TABLE` | `cache` |
| `DB_CACHE_LOCK_CONNECTION` | `unset` |
| `DB_CACHE_LOCK_TABLE` | `unset` |
| `CACHE_STORAGE_DISK` | `unset` |
| `CACHE_STORAGE_PATH` | `framework/cache/data` |
| `MEMCACHED_PERSISTENT_ID` | `unset` |
| `MEMCACHED_USERNAME` | `unset` |
| `MEMCACHED_PASSWORD` | `unset` |
| `MEMCACHED_HOST` | `127.0.0.1` |
| `MEMCACHED_PORT` | `11211` |
| `REDIS_CACHE_CONNECTION` | `cache` |
| `REDIS_CACHE_LOCK_CONNECTION` | `default` |
| `AWS_ACCESS_KEY_ID` | `unset` |
| `AWS_SECRET_ACCESS_KEY` | `unset` |
| `AWS_DEFAULT_REGION` | `us-east-1` |
| `DYNAMODB_CACHE_TABLE` | `cache` |
| `DYNAMODB_ENDPOINT` | `unset` |
| `CACHE_PREFIX` | `derived from APP_NAME` |

### Database and Redis

SQLite requires no database credentials. Keep its database file in the mounted directory. External databases require an appropriate connection, reachable host, database name, username, and password (or `DB_URL`). Ports, charset, collation, and SSL options depend on the selected driver. Redis settings are used only if a Redis-backed driver is selected; Redis is not included.

| Variable | Default |
| --- | --- |
| `DB_CONNECTION` | `sqlite` |
| `DB_URL` | `unset` |
| `DB_DATABASE` | `/var/www/html/database/sqlite/database.sqlite` |
| `DB_FOREIGN_KEYS` | `true` |
| `DB_HOST` | `127.0.0.1; localhost` |
| `DB_PORT` | `3306; 5432; 1433` |
| `DB_USERNAME` | `root` |
| `DB_PASSWORD` | `empty string` |
| `DB_SOCKET` | `empty string` |
| `DB_CHARSET` | `utf8mb4; utf8` |
| `DB_COLLATION` | `utf8mb4_unicode_ci` |
| `MYSQL_ATTR_SSL_CA` | `unset` |
| `DB_SSLMODE` | `prefer` |
| `REDIS_CLIENT` | `phpredis` |
| `REDIS_CLUSTER` | `redis` |
| `REDIS_PREFIX` | `derived from APP_NAME` |
| `REDIS_PERSISTENT` | `false` |
| `REDIS_URL` | `unset` |
| `REDIS_HOST` | `127.0.0.1` |
| `REDIS_USERNAME` | `unset` |
| `REDIS_PASSWORD` | `unset` |
| `REDIS_PORT` | `6379` |
| `REDIS_DB` | `0` |
| `REDIS_MAX_RETRIES` | `3` |
| `REDIS_BACKOFF_ALGORITHM` | `decorrelated_jitter` |
| `REDIS_BACKOFF_BASE` | `100` |
| `REDIS_BACKOFF_CAP` | `1000` |
| `REDIS_CACHE_DB` | `1` |

### Engagement polling

Optional polling/backoff tuning. Values with `MINUTES` or `DAYS` use the named units; rate limits are per minute. Instance UI settings may override feature/polling defaults.

| Variable | Default |
| --- | --- |
| `ENGAGEMENT_ENABLED` | `true` |
| `ENGAGEMENT_WINDOW_DAYS` | `7` |
| `ENGAGEMENT_STEADY_INTERVAL_MINUTES` | `1440` |
| `ENGAGEMENT_MAX_EMPTY_BACKOFF` | `8` |
| `ENGAGEMENT_FETCH_RATE_PER_MINUTE` | `12` |
| `ENGAGEMENT_DEFAULT_RATE_LIMIT_BACKOFF` | `900` |
| `ENGAGEMENT_MAX_SEARCH_PAGES` | `5` |

### Feedback delivery

Optional. Enable the feedback widget only with a delivery webhook. This webhook sends application feedback and is separate from a publishing account configured in the UI.

| Variable | Default |
| --- | --- |
| `FEEDBACK_ENABLED` | `false` |
| `FEEDBACK_DISCORD_WEBHOOK_URL` | `unset` |

### Media and object storage

The template uses local public storage. S3 requires credentials, region, bucket, and an accessible public media URL. Endpoint/path-style settings support S3-compatible providers. A separate public-images disk/bucket is optional.

| Variable | Default |
| --- | --- |
| `FILESYSTEM_DISK` | `public` |
| `PUBLIC_IMAGES_DISK` | `unset` |
| `AWS_BUCKET` | `unset` |
| `AWS_URL` | `unset` |
| `AWS_ENDPOINT` | `unset` |
| `AWS_USE_PATH_STYLE_ENDPOINT` | `false` |
| `PUBLIC_IMAGES_BUCKET` | `env('AWS_BUCKET')` |
| `PUBLIC_IMAGES_URL` | `env('AWS_URL')` |

### Passkeys

Optional stable secret for passkey user handles. Leave omitted to use upstream behavior; do not replace it casually after enrolling passkeys.

| Variable | Default |
| --- | --- |
| `PASSKEYS_USER_HANDLE_SECRET` | `config('app.key')` |

### Image processing

Optional image-processing driver override; keep the image-compatible default.

| Variable | Default |
| --- | --- |
| `IMAGE_DRIVER` | `gd` |

### Server-side rendering

Optional SSR. The container includes the SSR bundle/runtime and starts its SSR process when enabled; it is disabled by default.

| Variable | Default |
| --- | --- |
| `INERTIA_SSR_ENABLED` | `false` |
| `INERTIA_SSR_URL` | `http://127.0.0.1:13714` |

### Instance defaults

`SELF_HOSTED=true` is fixed to disable cloud billing requirements. Instance feature settings seed database defaults; owner changes in the UI take precedence. Public registration is off after the first owner is created.

| Variable | Default |
| --- | --- |
| `SELF_HOSTED` | `true (fixed)` |
| `SHOUTRRR_GITHUB_REPO` | `coollabsio/shoutrrr` |
| `SHOUTRRR_SPONSOR_URL` | `https://github.com/sponsors/coollabsio` |
| `INSTANCE_REGISTRATIONS_ENABLED` | `false` |
| `INSTANCE_WORKSPACE_CREATION_ENABLED` | `env('WORKSPACES_CAN_CREATE_WORKSPACE', true)` |
| `WORKSPACES_CAN_CREATE_WORKSPACE` | `true` |
| `INSTANCE_USAGE_TRACKING_ENABLED` | `false` |
| `INSTANCE_QUOTE_TWEETS_ENABLED` | `false` |
| `INSTANCE_LINKEDIN_COMMUNITY_MANAGEMENT_ENABLED` | `false` |

### Workspaces and social sign-in

Optional workspace behavior and social sign-in. Social sign-in also needs credentials for each enabled provider in the integration table; it is independent of publishing-account connections.

| Variable | Default |
| --- | --- |
| `WORKSPACES_ENABLED` | `true` |
| `WORKSPACE_INVITATION_TTL_DAYS` | `7` |
| `SOCIALITE_ENABLED` | `false` |
| `SOCIALITE_PROVIDERS` | `google` |

### Logging

Docker receives application logs through `stderr` at `info` level by default and rotates them. Other channels require their destination credentials. File channels write into persistent storage and need their own retention policy.

| Variable | Default |
| --- | --- |
| `LOG_CHANNEL` | `stderr` |
| `LOG_DEPRECATIONS_CHANNEL` | `null` |
| `LOG_DEPRECATIONS_TRACE` | `false` |
| `LOG_STACK` | `single` |
| `LOG_LEVEL` | `info` |
| `LOG_DAILY_DAYS` | `14` |
| `LOG_SLACK_WEBHOOK_URL` | `unset` |
| `LOG_SLACK_USERNAME` | `env('APP_NAME', 'Shoutrrr')` |
| `LOG_SLACK_EMOJI` | `:boom:` |
| `LOG_PAPERTRAIL_HANDLER` | `SyslogUdpHandler::class` |
| `PAPERTRAIL_URL` | `unset` |
| `PAPERTRAIL_PORT` | `unset` |
| `LOG_STDERR_FORMATTER` | `unset` |
| `LOG_SYSLOG_FACILITY` | `LOG_USER` |

### Email

Optional for initial setup. A delivery transport is needed for emailed invitations, verification, and password resets. SMTP needs a host/port and usually username/password, scheme, and a valid sender. API transports use the corresponding integration credentials. `MAIL_URL` can supply transport settings. The log mailer records messages without sending them.

| Variable | Default |
| --- | --- |
| `MAIL_SCHEME` | `unset` |
| `MAIL_URL` | `unset` |
| `MAIL_HOST` | `127.0.0.1` |
| `MAIL_PORT` | `2525` |
| `MAIL_USERNAME` | `unset` |
| `MAIL_PASSWORD` | `unset` |
| `MAIL_EHLO_DOMAIN` | `parse_url((string) env('APP_URL', 'http://localhost'), PHP_URL_HOST)` |
| `MAIL_SENDMAIL_PATH` | `/usr/sbin/sendmail -bs -i` |
| `MAIL_LOG_CHANNEL` | `unset` |
| `MAIL_FROM_ADDRESS` | `hello@example.com` |
| `MAIL_FROM_NAME` | `env('APP_NAME', 'Shoutrrr')` |
| `MAIL_MARKDOWN_THEME` | `default` |

### Media limits

Optional positive pixel limit for image decode memory protection; the image default is 16,000,000 pixels. PHP upload/request limits are listed under container controls.

| Variable | Default |
| --- | --- |
| `MEDIA_MAX_IMAGE_PIXELS` | `unset` |

### Direct messages

Optional inbox/DM polling controls. Poll intervals and rate-limit backoff use minutes; fetch rates are per minute. Platform permissions and instance UI settings also control availability.

| Variable | Default |
| --- | --- |
| `MESSAGES_ENABLED` | `true` |
| `DIRECT_MESSAGES_ENABLED` | `true` |
| `MESSAGES_POLL_INTERVAL_X` | `30` |
| `MESSAGES_POLL_INTERVAL_BLUESKY` | `10` |
| `MESSAGES_POLL_INTERVAL_INSTAGRAM` | `15` |
| `MESSAGES_POLL_INTERVAL_FACEBOOK` | `15` |
| `MESSAGES_DEFAULT_RATE_LIMIT_BACKOFF` | `900` |
| `MESSAGES_FETCH_RATE_PER_MINUTE` | `12` |

### Metrics

Optional metrics polling and unchanged-result backoff.

| Variable | Default |
| --- | --- |
| `METRICS_ENABLED` | `true` |
| `METRICS_MAX_UNCHANGED_BACKOFF` | `8` |

### Web server

The image serves HTTP on internal port 8080. Dokploy terminates TLS. Set `OCTANE_HTTPS=true` together with a public HTTPS `APP_URL` and secure cookies.

| Variable | Default |
| --- | --- |
| `OCTANE_SERVER` | `frankenphp (fixed)` |
| `OCTANE_HTTPS` | `false; set true for HTTPS` |

### API signing keys

Optional external RSA PEM keys for API/MCP token signing. Otherwise keys are generated on first API-key creation and persisted under storage. Supply both keys together or retain the storage volume. Omit `PASSPORT_CONNECTION` to use the application database; an empty connection string is not a replacement for omission.

| Variable | Default |
| --- | --- |
| `PASSPORT_PRIVATE_KEY` | `unset` |
| `PASSPORT_PUBLIC_KEY` | `unset` |
| `PASSPORT_AUTO_GENERATE_KEYS` | `true` |
| `PASSPORT_CONNECTION` | `unset` |

### Missed posts

Optional threshold in minutes before an overdue post is marked missed.

| Variable | Default |
| --- | --- |
| `POSTS_MISSED_AFTER_MINUTES` | `2880` |

### Queue backends

The bundled worker consumes the database queue by default. External queue backends need their own services/credentials. Retry-after values must exceed the publishing job timeout (900 seconds); upstream uses 1200 seconds. Disabling the worker prevents queued jobs from running unless a replacement worker exists.

| Variable | Default |
| --- | --- |
| `QUEUE_CONNECTION` | `database` |
| `DB_QUEUE_CONNECTION` | `unset` |
| `DB_QUEUE_TABLE` | `jobs` |
| `DB_QUEUE` | `default` |
| `DB_QUEUE_RETRY_AFTER` | `1200` |
| `BEANSTALKD_QUEUE_HOST` | `localhost` |
| `BEANSTALKD_QUEUE` | `default` |
| `BEANSTALKD_QUEUE_RETRY_AFTER` | `1200` |
| `SQS_PREFIX` | `https://sqs.us-east-1.amazonaws.com/your-account-id` |
| `SQS_QUEUE` | `default` |
| `SQS_SUFFIX` | `unset` |
| `REDIS_QUEUE_CONNECTION` | `default` |
| `REDIS_QUEUE` | `default` |
| `REDIS_QUEUE_RETRY_AFTER` | `1200` |
| `QUEUE_FAILED_DRIVER` | `database-uuids` |

### Automatic reposting

Optional repost feature and defaults; individual account settings may override them. Delays/backfill windows use the named hours/days units.

| Variable | Default |
| --- | --- |
| `REPOST_ENABLED` | `true` |
| `REPOST_MAX_BACKFILL_DAYS` | `30` |
| `REPOST_MIN_DELAY_HOURS` | `24` |
| `REPOST_MAX_DELAY_HOURS` | `168` |
| `REPOST_PLATEAU_STREAK` | `2` |
| `REPOST_MIN_PERCENTILE` | `0.5` |
| `REPOST_BASELINE_WINDOW_DAYS` | `90` |
| `REPOST_BASELINE_MIN_SAMPLES` | `5` |

### API documentation

Optional version label for API documentation.

| Variable | Default |
| --- | --- |
| `API_VERSION` | `1.0.0` |

### Browser error reporting

Optional browser telemetry. Omit the frontend DSN to disable it. Browser DSNs are intentionally public; do not put private API credentials here.

| Variable | Default |
| --- | --- |
| `SENTRY_RELEASE` | `unset` |
| `SENTRY_FRONTEND_DSN` | `unset` |
| `SENTRY_ENVIRONMENT` | `unset` |
| `SENTRY_FRONTEND_TRACES_SAMPLE_RATE` | `unset` |

### Server error reporting

Optional server telemetry and sampling. Omit the DSN to disable delivery. The following are advanced SDK overrides, including optional PII collection and trace/breadcrumb controls; they are not installation requirements.

| Variable | Default |
| --- | --- |
| `SENTRY_LARAVEL_DSN` | `env('SENTRY_DSN')` |
| `SENTRY_DSN` | `unset` |
| `SENTRY_ORG_ID` | `unset` |
| `SENTRY_SAMPLE_RATE` | `unset` |
| `SENTRY_TRACES_SAMPLE_RATE` | `unset` |
| `SENTRY_PROFILES_SAMPLE_RATE` | `unset` |
| `SENTRY_STRICT_TRACE_CONTINUATION` | `false` |
| `SENTRY_ENABLE_LOGS` | `false` |
| `SENTRY_LOG_FLUSH_THRESHOLD` | `unset` |
| `SENTRY_LOG_LEVEL` | `env('SENTRY_LOGS_LEVEL', env('LOG_LEVEL', 'debug'))` |
| `SENTRY_LOGS_LEVEL` | `env('LOG_LEVEL', 'debug')` |
| `SENTRY_SEND_DEFAULT_PII` | `false` |
| `SENTRY_BREADCRUMBS_LOGS_ENABLED` | `true` |
| `SENTRY_BREADCRUMBS_CACHE_ENABLED` | `true` |
| `SENTRY_BREADCRUMBS_LIVEWIRE_ENABLED` | `true` |
| `SENTRY_BREADCRUMBS_SQL_QUERIES_ENABLED` | `true` |
| `SENTRY_BREADCRUMBS_SQL_BINDINGS_ENABLED` | `false` |
| `SENTRY_BREADCRUMBS_QUEUE_INFO_ENABLED` | `true` |
| `SENTRY_BREADCRUMBS_COMMAND_JOBS_ENABLED` | `true` |
| `SENTRY_BREADCRUMBS_HTTP_CLIENT_REQUESTS_ENABLED` | `true` |
| `SENTRY_BREADCRUMBS_NOTIFICATIONS_ENABLED` | `true` |
| `SENTRY_TRACE_QUEUE_ENABLED` | `true` |
| `SENTRY_TRACE_QUEUE_JOBS_ENABLED` | `true` |
| `SENTRY_TRACE_SQL_QUERIES_ENABLED` | `true` |
| `SENTRY_TRACE_SQL_BINDINGS_ENABLED` | `false` |
| `SENTRY_TRACE_SQL_ORIGIN_ENABLED` | `true` |
| `SENTRY_TRACE_SQL_ORIGIN_THRESHOLD_MS` | `100` |
| `SENTRY_TRACE_VIEWS_ENABLED` | `true` |
| `SENTRY_TRACE_LIVEWIRE_ENABLED` | `true` |
| `SENTRY_TRACE_HTTP_CLIENT_REQUESTS_ENABLED` | `true` |
| `SENTRY_TRACE_CACHE_ENABLED` | `true` |
| `SENTRY_TRACE_REDIS_COMMANDS` | `false` |
| `SENTRY_TRACE_REDIS_ORIGIN_ENABLED` | `true` |
| `SENTRY_TRACE_NOTIFICATIONS_ENABLED` | `true` |
| `SENTRY_TRACE_MISSING_ROUTES_ENABLED` | `false` |
| `SENTRY_TRACE_CONTINUE_AFTER_RESPONSE` | `true` |
| `SENTRY_TRACE_DEFAULT_INTEGRATIONS_ENABLED` | `true` |

### Integration credentials

Conditional credentials: only configure integrations you use. Mail providers, Slack notifications, Google sign-in, social publishing, and KLIPY are independent. For OAuth configure a client ID, client secret, and redirect URI together; see the callback table in instructions.md. AWS values are listed under cache and storage.

| Variable | Default |
| --- | --- |
| `POSTMARK_API_KEY` | `unset` |
| `RESEND_API_KEY` | `unset` |
| `SLACK_BOT_USER_OAUTH_TOKEN` | `unset` |
| `SLACK_BOT_USER_DEFAULT_CHANNEL` | `unset` |
| `GOOGLE_CLIENT_ID` | `unset` |
| `GOOGLE_CLIENT_SECRET` | `unset` |
| `GOOGLE_REDIRECT_URI` | `unset` |
| `X_CLIENT_ID` | `unset` |
| `X_CLIENT_SECRET` | `unset` |
| `X_REDIRECT_URI` | `unset` |
| `X_BEARER_TOKEN` | `unset` |
| `LINKEDIN_CLIENT_ID` | `unset` |
| `LINKEDIN_CLIENT_SECRET` | `unset` |
| `LINKEDIN_REDIRECT_URI` | `unset` |
| `LINKEDIN_API_VERSION` | `202605` |
| `FACEBOOK_CLIENT_ID` | `unset` |
| `FACEBOOK_CLIENT_SECRET` | `unset` |
| `FACEBOOK_REDIRECT_URI` | `unset` |
| `FACEBOOK_GRAPH_VERSION` | `v25.0` |
| `THREADS_CLIENT_ID` | `unset` |
| `THREADS_CLIENT_SECRET` | `unset` |
| `THREADS_REDIRECT_URI` | `unset` |
| `KLIPY_API_KEY` | `unset` |
| `KLIPY_SHARE_TRIGGER` | `true` |
| `KLIPY_RATING` | `pg-13` |

### Sessions and cookies

Database sessions are persistent by default. Secure cookies must be enabled for public HTTPS deployments. Omit domain/connection/store to inherit upstream defaults. Keep HTTP-only cookies and SameSite protection enabled.

| Variable | Default |
| --- | --- |
| `SESSION_DRIVER` | `database` |
| `SESSION_LIFETIME` | `10080` |
| `SESSION_EXPIRE_ON_CLOSE` | `false` |
| `SESSION_ENCRYPT` | `false` |
| `SESSION_CONNECTION` | `unset` |
| `SESSION_TABLE` | `sessions` |
| `SESSION_STORE` | `unset` |
| `SESSION_COOKIE` | `derived from APP_NAME` |
| `SESSION_PATH` | `/` |
| `SESSION_DOMAIN` | `unset` |
| `SESSION_SECURE_COOKIE` | `false; set true for HTTPS` |
| `SESSION_HTTP_ONLY` | `true` |
| `SESSION_SAME_SITE` | `lax` |
| `SESSION_PARTITIONED_COOKIE` | `false` |

### Cloud subscription settings

Unused in this template because `SELF_HOSTED=true`. These upstream cloud billing/quota settings are listed for completeness; do not switch self-hosted mode off to install the application.

| Variable | Default |
| --- | --- |
| `STRIPE_SUBSCRIPTION_PRICE_ID` | `price_shoutrrr_monthly_test` |
| `SHOUTRRR_SUBSCRIPTION_MONTHLY_CENTS` | `1000` |
| `SHOUTRRR_X_MONTHLY_BUDGET_CENTS` | `500` |
| `SUBSCRIPTIONS_MAX_SYNC_PIPELINES` | `3` |
| `SUBSCRIPTIONS_MAX_NATIVE_TRACKED` | `3` |

### Account synchronization

Optional connected-account sync controls; lookback uses minutes.

| Variable | Default |
| --- | --- |
| `SYNC_ENABLED` | `true` |
| `SYNC_RECONCILE_LOOKBACK_MINUTES` | `60` |

### Usage retention

Optional retention in days for usage records.

| Variable | Default |
| --- | --- |
| `USAGE_RETENTION_DAYS` | `180` |

## Container controls

These are read by the image/supervisor scripts rather than Laravel configuration. The bundled worker and scheduler must remain enabled for normal single-container operation. Do not change the application directory, internal port, or HTTP-only listener behind Dokploy. A graceful stop allows 60 seconds; avoid interrupting active publishing jobs when maintaining the service. These controls are optional unless marked fixed.

| Variable | Image/template default and purpose |
| --- | --- |
| `QUEUE_WORKER_ENABLED` | `true`; start the bundled queue worker |
| `QUEUE_WORKER_COUNT` | `1`; positive integer, retain one with SQLite |
| `QUEUE_WORKER_MEMORY_MB` | derived from PHP memory limit; optional positive MB override (minimum 64) |
| `SCHEDULER_ENABLED` | `true`; run the bundled scheduler |
| `PHP_MEMORY_LIMIT` | `512M`; PHP process memory limit |
| `PHP_POST_MAX_SIZE` | `1100M`; request body size limit |
| `PHP_UPLOAD_MAX_FILE_SIZE` | `1100M`; individual upload size limit |
| `PHP_OPCACHE_ENABLE` | `1`; production opcode cache |
| `SSL_MODE` | `off`; TLS terminates at Dokploy |
| `AUTORUN_ENABLED` | `true`; image initialization and migrations |
| `AUTORUN_LARAVEL_CONFIG_CACHE` | `true`; cache environment configuration at startup |
| `AUTORUN_LARAVEL_EVENT_CACHE` | `true`; cache event discovery |
| `AUTORUN_LARAVEL_ROUTE_CACHE` | `true`; cache routes |
| `AUTORUN_LARAVEL_VIEW_CACHE` | `true`; cache views |
| `AUTORUN_LARAVEL_STORAGE_LINK` | `true`; create public media symlink |
| `APP_BASE_DIR` | `/var/www/html`; keep the image layout |
| `HEALTHCHECK_PATH` | `/up`; image default; this template checks `/up` explicitly |

## Example-only, build, and development variables

These appear in upstream’s full example or development tooling. They are not required deployment inputs and do not reconfigure the prebuilt frontend or add services to this template.

| Variable | Scope |
| --- | --- |
| `APP_PORT` | Upstream local Compose host port; Dokploy uses service port 8080 instead |
| `ASSET_URL` | Laravel/vendor asset helper override; leave omitted to serve bundled assets from the application |
| `VITE_APP_NAME` | Frontend build input; assets are already compiled |
| `VITE_HMR_HOST`, `VITE_PORT` | Development asset server/HMR |
| `SKIP_WAYFINDER_GENERATE` | Frontend development/build route generation |
| `POSTGRES_VERSION` | Upstream Docker build argument; does not install a database server |
| `POSTGRES_DB` | Initialization variable for upstream’s optional PostgreSQL service; no such service is included here |
| `POSTMARK_MESSAGE_STREAM_ID` | Upstream example; the corresponding mail option is commented out in this release |
| `DB_ENCRYPT`, `DB_TRUST_SERVER_CERTIFICATE` | Present in upstream example but commented out in the shipped SQL Server configuration |

For deployment steps, HTTPS, SMTP examples, OAuth callbacks, and backup requirements, see [instructions.md](instructions.md). Full defaults remain version-specific; review this reference when upgrading the pinned image.
