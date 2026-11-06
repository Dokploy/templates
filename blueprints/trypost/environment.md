# TryPost 2.0.0 environment reference

Set runtime settings in Dokploy **Environment**, then redeploy to rebuild Laravel’s configuration cache. The optional `.env` is passed into the container. Add only the settings you use: omission and an empty string can have different meanings. Never commit real credentials.

This inventory covers active application configuration in the [pinned 2.0.0 source](https://github.com/trypostit/trypost/tree/v2.0.0/config), the platform enum’s dynamic feature switches, and upstream’s environment examples. It excludes generic PHP/Nginx/vendor-only extensions. Table defaults show template overrides where applicable; otherwise they show upstream env fallbacks/expressions. Driver-specific alternatives are separated with semicolons. `unset` means no explicit env fallback; surrounding application code may derive a value.

## Required and generated

- **Generated and required:** `APP_KEY`, `DB_PASSWORD`, `REDIS_PASSWORD`, `REVERB_APP_ID`, `REVERB_APP_KEY`, and `REVERB_APP_SECRET`. Keep them stable across deployments.
- **Public address:** `TRYPOST_HOST` (hostname only), `APP_URL`, `TRYPOST_PUBLIC_SCHEME` (`http`/`https`), and `TRYPOST_PUBLIC_PORT`. The hostname/scheme/port and public Reverb key are build inputs. Rebuild after changing them. For production HTTPS also set `SESSION_SECURE_COOKIE=true` and enable HTTPS in Dokploy Domains.
- **First-user bootstrap:** `INITIAL_USER_EMAIL` (default `admin@example.com`; change to your address), `INITIAL_USER_PASSWORD` (generated, minimum 16 characters), and optional `INITIAL_USER_NAME` (default `Administrator`). These are used only if the database has no users. They do not reset existing accounts. The bootstrap password can be removed after setup.
- **Automatic:** PostgreSQL, authenticated Redis, migrations, one persistent RSA key pair for API/MCP signing, the initial verified account/workspace, Horizon, scheduler, and Reverb. No PEM values need to be supplied.
- **Conditional only:** mail delivery, social-provider credentials, Telegram, AI providers, object storage, and external integrations. None is required for initial login. Public registration remains disabled by upstream self-hosted mode.

The following Compose settings are fixed: production/non-debug mode, self-hosted mode, bundled database/Redis connections, queue/cache/session/broadcast drivers, internal Reverb endpoint, Passport key file paths, and disabled telemetry/debugging. Variables with “fixed” in their default require editing Compose to change them. External database/queue/SSR alternatives are not provisioned by changing an env value.

## Application runtime variables

### AI providers

Optional AI providers. No key is required to install or use the scheduler. Configure only the provider/capability you select. Model overrides are provider-specific; custom compatible endpoints also need an appropriate model and URL.

| Variable | Default |
| --- | --- |
| `AI_TEXT_PROVIDER` | `openai` |
| `AI_AUDIO_PROVIDER` | `openai` |
| `AI_TRANSCRIPTION_PROVIDER` | `openai` |
| `AI_EMBEDDINGS_PROVIDER` | `openai` |
| `AI_RERANKING_PROVIDER` | `cohere` |
| `CACHE_STORE` | `redis (fixed)` |
| `ANTHROPIC_API_KEY` | `unset` |
| `ANTHROPIC_URL` | `https://api.anthropic.com/v1` |
| `ANTHROPIC_TEXT_MODEL` | `unset` |
| `AZURE_OPENAI_API_KEY` | `unset` |
| `AZURE_OPENAI_URL` | `unset` |
| `AZURE_OPENAI_API_VERSION` | `2025-04-01-preview` |
| `AZURE_OPENAI_DEPLOYMENT` | `gpt-4o` |
| `AZURE_OPENAI_EMBEDDING_DEPLOYMENT` | `text-embedding-3-small` |
| `AZURE_OPENAI_STORE` | `true` |
| `AWS_BEDROCK_REGION` | `us-east-1` |
| `AWS_BEARER_TOKEN_BEDROCK` | `unset` |
| `AWS_ACCESS_KEY_ID` | `unset` |
| `AWS_SECRET_ACCESS_KEY` | `unset` |
| `AWS_SESSION_TOKEN` | `unset` |
| `AWS_USE_DEFAULT_CREDENTIALS` | `true` |
| `AWS_BEDROCK_ASSUME_ROLE_ARN` | `unset` |
| `AWS_BEDROCK_ASSUME_ROLE_SESSION_NAME` | `unset` |
| `AWS_BEDROCK_ASSUME_ROLE_DURATION_SECONDS` | `unset` |
| `AWS_BEDROCK_ASSUME_ROLE_EXTERNAL_ID` | `unset` |
| `AWS_BEDROCK_TEXT_MODEL` | `unset` |
| `AWS_BEDROCK_EMBEDDINGS_MODEL` | `unset` |
| `COHERE_API_KEY` | `unset` |
| `COHERE_EMBEDDINGS_MODEL` | `unset` |
| `COHERE_RERANKING_MODEL` | `unset` |
| `DEEPSEEK_API_KEY` | `unset` |
| `DEEPSEEK_TEXT_MODEL` | `unset` |
| `ELEVENLABS_API_KEY` | `unset` |
| `ELEVENLABS_AUDIO_MODEL` | `unset` |
| `ELEVENLABS_TRANSCRIPTION_MODEL` | `unset` |
| `GEMINI_API_KEY` | `unset` |
| `GEMINI_URL` | `https://generativelanguage.googleapis.com/v1beta/` |
| `GEMINI_TEXT_MODEL` | `unset` |
| `GEMINI_AUDIO_MODEL` | `unset` |
| `GEMINI_TRANSCRIPTION_MODEL` | `unset` |
| `GEMINI_EMBEDDINGS_MODEL` | `unset` |
| `GROQ_API_KEY` | `unset` |
| `GROQ_TEXT_MODEL` | `unset` |
| `JINA_API_KEY` | `unset` |
| `JINA_EMBEDDINGS_MODEL` | `unset` |
| `JINA_RERANKING_MODEL` | `unset` |
| `MISTRAL_API_KEY` | `unset` |
| `MISTRAL_TEXT_MODEL` | `unset` |
| `MISTRAL_TRANSCRIPTION_MODEL` | `unset` |
| `MISTRAL_EMBEDDINGS_MODEL` | `unset` |
| `OLLAMA_API_KEY` | `empty string` |
| `OLLAMA_URL` | `http://localhost:11434` |
| `OLLAMA_TEXT_MODEL` | `unset` |
| `OLLAMA_EMBEDDINGS_MODEL` | `unset` |
| `OPENAI_API_KEY` | `unset` |
| `OPENAI_URL` | `https://api.openai.com/v1` |
| `OPENAI_STORE` | `true` |
| `OPENAI_TEXT_MODEL` | `unset` |
| `OPENAI_AUDIO_MODEL` | `unset` |
| `OPENAI_TRANSCRIPTION_MODEL` | `unset` |
| `OPENAI_EMBEDDINGS_MODEL` | `unset` |
| `OPENAI_COMPATIBLE_URL` | `unset` |
| `OPENAI_COMPATIBLE_API_KEY` | `unset` |
| `OPENAI_COMPATIBLE_TEXT_MODEL` | `unset` |
| `OPENAI_COMPATIBLE_EMBEDDINGS_MODEL` | `unset` |
| `OPENROUTER_API_KEY` | `unset` |
| `OPENROUTER_TEXT_MODEL` | `unset` |
| `OPENROUTER_AUDIO_MODEL` | `unset` |
| `OPENROUTER_TRANSCRIPTION_MODEL` | `unset` |
| `OPENROUTER_EMBEDDINGS_MODEL` | `unset` |
| `VOYAGEAI_API_KEY` | `unset` |
| `VOYAGEAI_EMBEDDINGS_MODEL` | `unset` |
| `VOYAGEAI_RERANKING_MODEL` | `unset` |
| `XAI_API_KEY` | `unset` |
| `XAI_TEXT_MODEL` | `unset` |

### Application

Application identity, locale, maintenance, and encryption. Keep the generated application key. Public URLs must match Dokploy routing. Production/debug mode is fixed by Compose.

| Variable | Default |
| --- | --- |
| `APP_NAME` | `TryPost.it` |
| `APP_ENV` | `production (fixed)` |
| `APP_DEBUG` | `false (fixed)` |
| `APP_URL` | `generated HTTP URL; set public HTTPS URL` |
| `WEBHOOK_URL` | `env('APP_URL', 'https://app.trypost.it')` |
| `APP_LOCALE` | `en` |
| `APP_FALLBACK_LOCALE` | `en` |
| `APP_FAKER_LOCALE` | `en_US` |
| `APP_KEY` | `generated base64: value containing 32 random bytes; required` |
| `APP_PREVIOUS_KEYS` | `empty string` |
| `APP_MAINTENANCE_DRIVER` | `file` |
| `APP_MAINTENANCE_STORE` | `database` |

### Authentication

Advanced authentication overrides; keep the shipped user model/guard. Bootstrap creates the initial user as verified; invitations/password recovery still need delivered email.

| Variable | Default |
| --- | --- |
| `AUTH_GUARD` | `web` |
| `AUTH_PASSWORD_BROKER` | `users` |
| `AUTH_MODEL` | `User::class` |
| `AUTH_PASSWORD_RESET_TOKEN_TABLE` | `password_reset_tokens` |
| `AUTH_PASSWORD_TIMEOUT` | `10800` |

### Development tooling

Development tooling configuration; not an installation requirement for the production image.

| Variable | Default |
| --- | --- |
| `BOOST_ENABLED` | `true` |
| `BOOST_RULES_ENABLED` | `true` |
| `BOOST_RULES_SCOPED_GUIDELINES` | `false` |
| `BOOST_PHP_EXECUTABLE_PATH` | `unset` |
| `BOOST_COMPOSER_EXECUTABLE_PATH` | `unset` |
| `BOOST_NPM_EXECUTABLE_PATH` | `unset` |
| `BOOST_VENDOR_BIN_EXECUTABLE_PATH` | `unset` |
| `BOOST_CURRENT_DIRECTORY_EXECUTABLE_PATH` | `unset` |
| `BOOST_BROWSER_LOGS_WATCHER` | `true` |
| `BOOST_BROWSER_LOG_LEVELS` | `error,warning,info,debug` |

### Broadcasting

Reverb is included. Its public key must match the browser build. Server-side broadcasts use the internal listener; third-party Pusher/Ably settings are unused unless the template is deliberately adapted.

| Variable | Default |
| --- | --- |
| `BROADCAST_CONNECTION` | `reverb (fixed)` |
| `REVERB_APP_KEY` | `generated public browser key; required at build and runtime` |
| `REVERB_APP_SECRET` | `generated secret; required only at runtime` |
| `REVERB_APP_ID` | `generated UUID; required` |
| `REVERB_HOST` | `127.0.0.1 (fixed server-side destination)` |
| `REVERB_PORT` | `8080 (fixed server-side destination)` |
| `REVERB_SCHEME` | `http (fixed internal connection)` |
| `PUSHER_APP_KEY` | `unset` |
| `PUSHER_APP_SECRET` | `unset` |
| `PUSHER_APP_ID` | `unset` |
| `PUSHER_APP_CLUSTER` | `unset; mt1` |
| `PUSHER_HOST` | `unset` |
| `PUSHER_PORT` | `443` |
| `PUSHER_SCHEME` | `https` |
| `ABLY_KEY` | `unset` |

### Cache

Redis is included, authenticated, and persistent. Alternate cache drivers and their connection/table/disk options are advanced overrides that require compatible infrastructure.

| Variable | Default |
| --- | --- |
| `DB_CACHE_CONNECTION` | `unset` |
| `DB_CACHE_TABLE` | `cache` |
| `DB_CACHE_LOCK_CONNECTION` | `unset` |
| `DB_CACHE_LOCK_TABLE` | `unset` |
| `MEMCACHED_PERSISTENT_ID` | `unset` |
| `MEMCACHED_USERNAME` | `unset` |
| `MEMCACHED_PASSWORD` | `unset` |
| `MEMCACHED_HOST` | `127.0.0.1` |
| `MEMCACHED_PORT` | `11211` |
| `REDIS_CACHE_CONNECTION` | `cache` |
| `REDIS_CACHE_LOCK_CONNECTION` | `default` |
| `AWS_DEFAULT_REGION` | `us-east-1` |
| `DYNAMODB_CACHE_TABLE` | `cache` |
| `DYNAMODB_ENDPOINT` | `unset` |
| `CACHE_PREFIX` | `derived from APP_NAME` |

### Cloud billing

Cloud billing settings. They are not required with this template’s fixed SELF_HOSTED=true. Leave Stripe keys, price IDs, and trial/coupon settings omitted for a normal self-hosted installation.

| Variable | Default |
| --- | --- |
| `STRIPE_KEY` | `unset` |
| `STRIPE_SECRET` | `unset` |
| `CASHIER_PATH` | `stripe` |
| `STRIPE_WEBHOOK_SECRET` | `unset` |
| `STRIPE_WEBHOOK_TOLERANCE` | `300` |
| `CASHIER_CURRENCY` | `usd` |
| `CASHIER_CURRENCY_LOCALE` | `en` |
| `CASHIER_PAYMENT_NOTIFICATION` | `unset` |
| `CASHIER_INVOICE_RENDERER` | `DompdfInvoiceRenderer::class` |
| `CASHIER_PAPER` | `letter` |
| `CASHIER_REMOTE_ENABLED` | `false` |
| `CASHIER_LOGGER` | `unset` |
| `CASHIER_TRIAL_DAYS` | `8` |
| `STRIPE_SOCIALS_FIRST_MONTH_COUPON_ID` | `unset` |
| `STRIPE_WORKSPACES_FIRST_MONTH_COUPON_ID` | `unset` |
| `CASHIER_ALLOW_PROMOTION_CODES` | `false` |

### Database and Redis

The template bundles PostgreSQL and Redis. Their service names, database/user names, ports, and drivers are fixed by Compose. Credentials are generated. Other driver/connection options are upstream advanced settings; selecting them does not provision or migrate another database.

| Variable | Default |
| --- | --- |
| `DB_CONNECTION` | `pgsql (fixed)` |
| `DB_URL` | `unset` |
| `DB_DATABASE` | `trypost (fixed)` |
| `DB_FOREIGN_KEYS` | `true` |
| `DB_HOST` | `trypost-postgres (fixed)` |
| `DB_PORT` | `5432 (fixed)` |
| `DB_USERNAME` | `trypost (fixed)` |
| `DB_PASSWORD` | `generated; required by application and PostgreSQL` |
| `DB_SOCKET` | `empty string` |
| `DB_CHARSET` | `utf8mb4; utf8` |
| `DB_COLLATION` | `utf8mb4_unicode_ci` |
| `MYSQL_ATTR_SSL_CA` | `unset` |
| `DB_SSLMODE` | `prefer` |
| `REDIS_CLIENT` | `predis` |
| `REDIS_CLUSTER` | `redis` |
| `REDIS_PREFIX` | `derived from APP_NAME` |
| `REDIS_PERSISTENT` | `false` |
| `REDIS_URL` | `unset` |
| `REDIS_HOST` | `trypost-redis (fixed)` |
| `REDIS_USERNAME` | `unset` |
| `REDIS_PASSWORD` | `generated; required by application and Redis` |
| `REDIS_PORT` | `6379 (fixed)` |
| `REDIS_DB` | `0` |
| `REDIS_MAX_RETRIES` | `3` |
| `REDIS_BACKOFF_ALGORITHM` | `decorrelated_jitter` |
| `REDIS_BACKOFF_BASE` | `100` |
| `REDIS_BACKOFF_CAP` | `1000` |
| `REDIS_CACHE_DB` | `1` |

### Storage

Local public storage persists in the storage volume. S3/R2/Spaces are optional and need their own credentials, bucket, region/endpoint, and publicly reachable media URL. Omit unused nullable settings.

| Variable | Default |
| --- | --- |
| `FILESYSTEM_DISK` | `public` |
| `AWS_BUCKET` | `unset` |
| `AWS_URL` | `unset` |
| `AWS_ENDPOINT` | `unset` |
| `AWS_USE_PATH_STYLE_ENDPOINT` | `false` |
| `SPACES_ACCESS_KEY_ID` | `unset` |
| `SPACES_SECRET_ACCESS_KEY` | `unset` |
| `SPACES_ENDPOINT` | `unset` |
| `SPACES_REGION` | `unset` |
| `SPACES_BUCKET` | `unset` |
| `R2_ACCESS_KEY_ID` | `unset` |
| `R2_SECRET_ACCESS_KEY` | `unset` |
| `R2_REGION` | `auto` |
| `R2_BUCKET` | `unset` |
| `R2_URL` | `unset` |
| `R2_ENDPOINT` | `unset` |

### Workers

Horizon and publishing queues are included. Advanced worker tuning affects memory and concurrency. Keep a single scheduler for this template and monitor failed jobs; some upstream publishing/media jobs have long timeouts.

| Variable | Default |
| --- | --- |
| `HORIZON_NAME` | `unset` |
| `HORIZON_DOMAIN` | `unset` |
| `HORIZON_ALLOWED_EMAILS` | `empty string` |
| `HORIZON_PATH` | `horizon` |
| `HORIZON_PREFIX` | `derived from APP_NAME` |
| `HORIZON_MEDIA_ADOPTION_PROCESSES` | `20` |

### Inertia and SSR

SSR is disabled upstream and this image does not run an SSR server by default. Do not enable it without providing the runtime/service. Other values are advanced UI/protocol settings.

| Variable | Default |
| --- | --- |
| `INERTIA_SSR_ENABLED` | `false` |
| `INERTIA_SSR_RUNTIME` | `node` |
| `INERTIA_SSR_ENSURE_RUNTIME_EXISTS` | `false` |
| `INERTIA_SSR_URL` | `http://127.0.0.1:13714` |
| `INERTIA_SSR_HOT_URL` | `unset` |
| `INERTIA_SSR_TIMEOUT` | `unset` |
| `INERTIA_SSR_ENSURE_BUNDLE_EXISTS` | `true` |
| `INERTIA_SSR_THROW_ON_ERROR` | `false` |
| `INERTIA_ENCRYPT_HISTORY` | `false` |
| `INERTIA_DEVTOOLS_ENABLED` | `false` |
| `INERTIA_DEVTOOLS_TTL_HOURS` | `24` |
| `INERTIA_DEVTOOLS_PRUNE_INTERVAL_SECONDS` | `300` |
| `INERTIA_DEVTOOLS_LIMIT` | `100` |
| `INERTIA_DEVTOOLS_GATE` | `unset` |
| `INERTIA_PRESERVE_BIG_INTEGERS` | `false` |

### Logging

Application logs go to Docker stderr at info level with Docker log rotation. Other channels need their own destinations/credentials and, for file logs, retention management.

| Variable | Default |
| --- | --- |
| `LOG_CHANNEL` | `stderr` |
| `LOG_DEPRECATIONS_CHANNEL` | `null` |
| `LOG_DEPRECATIONS_TRACE` | `false` |
| `LOG_STACK` | `single` |
| `LOG_LEVEL` | `info` |
| `LOG_DAILY_DAYS` | `14` |
| `LOG_SLACK_WEBHOOK_URL` | `unset` |
| `LOG_SLACK_USERNAME` | `Laravel Log` |
| `LOG_SLACK_EMOJI` | `:boom:` |
| `LOG_PAPERTRAIL_HANDLER` | `SyslogUdpHandler::class` |
| `PAPERTRAIL_URL` | `unset` |
| `PAPERTRAIL_PORT` | `unset` |
| `LOG_STDERR_FORMATTER` | `unset` |
| `LOG_SYSLOG_FACILITY` | `LOG_USER` |

### Email

Mail is optional for initial login. MAIL_MAILER=log records messages without delivering them. SMTP normally needs host, port, scheme, sender, and authentication; API transports need their provider keys. Test invitations/password resets with a working delivery transport.

| Variable | Default |
| --- | --- |
| `MAIL_MAILER` | `log` |
| `MAIL_SCHEME` | `unset` |
| `MAIL_URL` | `unset` |
| `MAIL_HOST` | `127.0.0.1` |
| `MAIL_PORT` | `2525` |
| `MAIL_USERNAME` | `unset` |
| `MAIL_PASSWORD` | `unset` |
| `MAIL_EHLO_DOMAIN` | `parse_url((string) env('APP_URL', 'http://localhost'), PHP_URL_HOST)` |
| `MAIL_SENDMAIL_PATH` | `/usr/sbin/sendmail -bs -i` |
| `MAIL_LOG_CHANNEL` | `unset` |
| `MAIL_FROM_ADDRESS` | `no-reply@mail.trypost.it` |
| `MAIL_FROM_NAME` | `TryPost` |

### API signing keys

Signing keys are generated once into persistent storage, and Compose fixes these two paths. Preserve both keys with the database and APP_KEY. Environment PEM injection requires an intentional Compose change; it is not needed for this template.

| Variable | Default |
| --- | --- |
| `PASSPORT_PRIVATE_KEY` | `file:///var/www/html/storage/oauth-private.key (fixed)` |
| `PASSPORT_PUBLIC_KEY` | `file:///var/www/html/storage/oauth-public.key (fixed)` |
| `PASSPORT_CONNECTION` | `unset` |

### Queues

Redis queues are included. Alternative queues require compatible infrastructure. Retry-after values must remain greater than job/worker timeouts to avoid duplicate publishing.

| Variable | Default |
| --- | --- |
| `QUEUE_CONNECTION` | `redis (fixed)` |
| `DB_QUEUE_CONNECTION` | `unset` |
| `DB_QUEUE_TABLE` | `jobs` |
| `DB_QUEUE` | `default` |
| `DB_QUEUE_RETRY_AFTER` | `90` |
| `BEANSTALKD_QUEUE_HOST` | `localhost` |
| `BEANSTALKD_QUEUE` | `default` |
| `BEANSTALKD_QUEUE_RETRY_AFTER` | `90` |
| `SQS_PREFIX` | `https://sqs.us-east-1.amazonaws.com/your-account-id` |
| `SQS_QUEUE` | `default` |
| `SQS_SUFFIX` | `unset` |
| `REDIS_QUEUE_CONNECTION` | `default` |
| `REDIS_QUEUE` | `default` |
| `REDIS_QUEUE_RETRY_AFTER` | `960` |
| `QUEUE_FAILED_DRIVER` | `database-uuids` |

### WebSockets

The bundled WebSocket server listens internally on 8080 and is proxied by Nginx through the main domain. REVERB_HOST/PORT/SCHEME configure server-side broadcasting; browser settings are separate build inputs listed below. Scaling is not enabled by this template.

| Variable | Default |
| --- | --- |
| `REVERB_SERVER` | `reverb` |
| `REVERB_SERVER_HOST` | `0.0.0.0` |
| `REVERB_SERVER_PORT` | `8080` |
| `REVERB_SERVER_PATH` | `empty string` |
| `REVERB_MAX_REQUEST_SIZE` | `10_000` |
| `REVERB_SCALING_ENABLED` | `false` |
| `REVERB_SCALING_CHANNEL` | `reverb` |
| `REDIS_TIMEOUT` | `60` |
| `REVERB_PULSE_INGEST_INTERVAL` | `15` |
| `REVERB_TELESCOPE_INGEST_INTERVAL` | `15` |
| `REVERB_APP_PING_INTERVAL` | `60` |
| `REVERB_APP_ACTIVITY_TIMEOUT` | `30` |
| `REVERB_APP_MAX_CONNECTIONS` | `unset` |
| `REVERB_APP_MAX_MESSAGE_SIZE` | `10_000` |

### Integration credentials

Conditional integration credentials only. OAuth providers need the relevant client ID, secret, and exact redirect URI together. Google/GitHub login is separate from publishing. Email, AI, media services, analytics, Slack, and link shortening each use their own credentials.

| Variable | Default |
| --- | --- |
| `POSTMARK_API_KEY` | `unset` |
| `RESEND_API_KEY` | `unset` |
| `SLACK_BOT_USER_OAUTH_TOKEN` | `unset` |
| `SLACK_BOT_USER_DEFAULT_CHANNEL` | `unset` |
| `LINKEDIN_CLIENT_ID` | `unset` |
| `LINKEDIN_CLIENT_SECRET` | `unset` |
| `LINKEDIN_CLIENT_REDIRECT` | `unset` |
| `X_CLIENT_ID` | `unset` |
| `X_CLIENT_SECRET` | `unset` |
| `X_CLIENT_REDIRECT` | `unset` |
| `TIKTOK_CLIENT_ID` | `unset` |
| `TIKTOK_CLIENT_SECRET` | `unset` |
| `TIKTOK_CLIENT_REDIRECT` | `unset` |
| `GOOGLE_CLIENT_ID` | `unset` |
| `GOOGLE_CLIENT_SECRET` | `unset` |
| `GOOGLE_CLIENT_REDIRECT` | `unset` |
| `GOOGLE_AUTH_CALLBACK` | `unset` |
| `GITHUB_CLIENT_ID` | `unset` |
| `GITHUB_CLIENT_SECRET` | `unset` |
| `GITHUB_AUTH_CALLBACK` | `unset` |
| `FACEBOOK_CLIENT_ID` | `unset` |
| `FACEBOOK_CLIENT_SECRET` | `unset` |
| `FACEBOOK_CLIENT_REDIRECT` | `unset` |
| `INSTAGRAM_CLIENT_ID` | `unset` |
| `INSTAGRAM_CLIENT_SECRET` | `unset` |
| `INSTAGRAM_CLIENT_REDIRECT` | `unset` |
| `THREADS_CLIENT_ID` | `unset` |
| `THREADS_CLIENT_SECRET` | `unset` |
| `THREADS_CLIENT_REDIRECT` | `unset` |
| `PINTEREST_CLIENT_ID` | `unset` |
| `PINTEREST_CLIENT_SECRET` | `unset` |
| `PINTEREST_CLIENT_REDIRECT` | `unset` |
| `DISCORD_CLIENT_ID` | `unset` |
| `DISCORD_CLIENT_SECRET` | `unset` |
| `DISCORD_CLIENT_REDIRECT` | `unset` |
| `GOOGLE_BUSINESS_CLIENT_ID` | `unset` |
| `GOOGLE_BUSINESS_CLIENT_SECRET` | `unset` |
| `GOOGLE_BUSINESS_CLIENT_REDIRECT` | `unset` |
| `GTM_ID` | `unset` |
| `POSTHOG_ENABLED` | `false (fixed)` |
| `POSTHOG_API_KEY` | `unset` |
| `POSTHOG_HOST` | `https://us.i.posthog.com` |
| `UNSPLASH_ACCESS_KEY` | `unset` |
| `UNSPLASH_SECRET_KEY` | `unset` |
| `GOOGLE_MEDIA_CLIENT_ID` | `unset` |
| `GOOGLE_MEDIA_CLIENT_SECRET` | `unset` |
| `GOOGLE_MEDIA_CLIENT_REDIRECT` | `unset` |
| `GOOGLE_MEDIA_API_KEY` | `unset` |
| `GOOGLE_MEDIA_APP_ID` | `unset` |
| `CANVA_CLIENT_ID` | `unset` |
| `CANVA_CLIENT_SECRET` | `unset` |
| `BITLY_CLIENT_ID` | `unset` |
| `BITLY_CLIENT_SECRET` | `unset` |
| `BITLY_CLIENT_REDIRECT` | `unset` |

### Sessions

Persistent database sessions are included. Enable secure cookies for public HTTPS. Omit cookie domain/store/connection to retain upstream defaults; keep HTTP-only and SameSite protection.

| Variable | Default |
| --- | --- |
| `SESSION_DRIVER` | `database (fixed)` |
| `SESSION_LIFETIME` | `120` |
| `SESSION_EXPIRE_ON_CLOSE` | `false` |
| `SESSION_ENCRYPT` | `false` |
| `SESSION_CONNECTION` | `unset` |
| `SESSION_TABLE` | `sessions` |
| `SESSION_STORE` | `unset` |
| `SESSION_COOKIE` | `trypost-session` |
| `SESSION_PATH` | `/` |
| `SESSION_DOMAIN` | `unset` |
| `SESSION_SECURE_COOKIE` | `false; set true for HTTPS` |
| `SESSION_HTTP_ONLY` | `true` |
| `SESSION_SAME_SITE` | `lax` |
| `SESSION_PARTITIONED_COOKIE` | `false` |

### Diagnostics

Development diagnostics are disabled by Compose. These advanced upstream settings are not needed for installation.

| Variable | Default |
| --- | --- |
| `TELESCOPE_ENABLED` | `false (fixed)` |
| `TELESCOPE_DOMAIN` | `unset` |
| `TELESCOPE_PATH` | `debug` |
| `TELESCOPE_DRIVER` | `database` |
| `TELESCOPE_QUEUE_CONNECTION` | `unset` |
| `TELESCOPE_QUEUE` | `unset` |
| `TELESCOPE_QUEUE_DELAY` | `10` |
| `TELESCOPE_BATCH_WATCHER` | `true` |
| `TELESCOPE_CACHE_WATCHER` | `true` |
| `TELESCOPE_CLIENT_REQUEST_WATCHER` | `true` |
| `TELESCOPE_COMMAND_WATCHER` | `true` |
| `TELESCOPE_DUMP_WATCHER` | `true` |
| `TELESCOPE_DUMP_WATCHER_ALWAYS` | `false` |
| `TELESCOPE_EVENT_WATCHER` | `true` |
| `TELESCOPE_EXCEPTION_WATCHER` | `true` |
| `TELESCOPE_GATE_WATCHER` | `true` |
| `TELESCOPE_JOB_WATCHER` | `true` |
| `TELESCOPE_LOG_WATCHER` | `true` |
| `TELESCOPE_MAIL_WATCHER` | `true` |
| `TELESCOPE_MODEL_WATCHER` | `true` |
| `TELESCOPE_NOTIFICATION_WATCHER` | `true` |
| `TELESCOPE_QUERY_WATCHER` | `true` |
| `TELESCOPE_REDIS_WATCHER` | `true` |
| `TELESCOPE_REQUEST_WATCHER` | `true` |
| `TELESCOPE_RESPONSE_SIZE_LIMIT` | `64` |
| `TELESCOPE_SCHEDULE_WATCHER` | `true` |
| `TELESCOPE_VIEW_WATCHER` | `true` |

### TryPost features and platform settings

Optional application features, media limits/retention, platform flags, polling, external API endpoints, and integration controls. Provider settings are only needed for the platforms/features you use. Keep TRYPOST_ALLOW_PRIVATE_NETWORK=false on normal deployments; local integration tests may override it for their mock endpoints.

| Variable | Default |
| --- | --- |
| `SELF_HOSTED` | `true (fixed)` |
| `LEGAL_TERMS_URL` | `https://trypost.it/terms` |
| `LEGAL_PRIVACY_URL` | `https://trypost.it/privacy` |
| `META_PAGE_WALK_SECONDS` | `20` |
| `TRYPOST_ALLOW_PRIVATE_NETWORK` | `false` |
| `REQUIRE_CARD_FOR_TRIAL` | `true` |
| `MEDIA_IMAGE_MAX_SIZE_MB` | `10` |
| `MEDIA_VIDEO_MAX_SIZE_MB` | `1024` |
| `MEDIA_DOCUMENT_MAX_SIZE_MB` | `100` |
| `MEDIA_IMAGE_MAX_PIXELS` | `8192 * 8192` |
| `MEDIA_SIGNED_UPLOAD_URL_TTL_MINUTES` | `unset` |
| `MCP_UPLOAD_URL_TTL_MINUTES` | `15` |
| `MEDIA_SIGNED_UPLOAD_PER_WORKSPACE_PER_MINUTE` | `60` |
| `MEDIA_SIGNED_UPLOAD_PER_IP_PER_MINUTE` | `1200` |
| `MEDIA_UPLOAD_RETENTION_HOURS` | `24` |
| `MEDIA_HEIC_CONVERSION` | `true` |
| `MEDIA_HEIC_MEMORY_LIMIT_MB` | `256` |
| `MEDIA_HEIC_MAP_LIMIT_MB` | `512` |
| `MEDIA_HEIC_DISK_LIMIT_MB` | `1024` |
| `MEDIA_HEIC_AREA_LIMIT_MB` | `1024` |
| `MEDIA_HEIC_WIDTH_LIMIT_PX` | `16384` |
| `MEDIA_HEIC_HEIGHT_LIMIT_PX` | `16384` |
| `UNSPLASH_API_URL` | `https://api.unsplash.com` |
| `UNSPLASH_WEBSITE_URL` | `https://unsplash.com` |
| `UNSPLASH_DOWNLOAD_HOSTS` | `images.unsplash.com` |
| `UNSPLASH_REQUESTS_PER_MINUTE` | `30` |
| `GOOGLE_MEDIA_AUTHORIZE_URL` | `https://accounts.google.com/o/oauth2/v2/auth` |
| `GOOGLE_MEDIA_OAUTH_API` | `https://oauth2.googleapis.com` |
| `GOOGLE_DRIVE_ENABLED` | `true` |
| `GOOGLE_DRIVE_API_URL` | `https://www.googleapis.com/drive/v3` |
| `GOOGLE_PICKER_SDK_URL` | `https://apis.google.com/js/api.js` |
| `GOOGLE_DRIVE_DOWNLOAD_HOSTS` | `www.googleapis.com,*.googleusercontent.com` |
| `GOOGLE_PHOTOS_ENABLED` | `false` |
| `GOOGLE_PHOTOS_PICKER_API_URL` | `https://photospicker.googleapis.com` |
| `GOOGLE_PHOTOS_DOWNLOAD_HOSTS` | `lh3.googleusercontent.com,lh4.googleusercontent.com,lh5.googleusercontent.com,lh6.googleusercontent.com,video-downloads.googleusercontent.com` |
| `GOOGLE_PHOTOS_POLLS_PER_MINUTE` | `60` |
| `GOOGLE_PHOTOS_MAX_ITEMS` | `10` |
| `CANVA_ENABLED` | `true` |
| `CANVA_API_URL` | `https://api.canva.com/rest/v1` |
| `CANVA_AUTHORIZE_URL` | `https://www.canva.com/api/oauth/authorize` |
| `CANVA_CODE_CHALLENGE_METHOD` | `s256` |
| `CANVA_DOWNLOAD_HOSTS` | `*.canva.com` |
| `CANVA_EDITOR_HOSTS` | `*.canva.com` |
| `CANVA_EXPORT_TIMEOUT_SECONDS` | `120` |
| `CANVA_EXPORT_POLL_SECONDS` | `2` |
| `MEDIA_IMPORT_TIMEOUT_SECONDS` | `600` |
| `MEDIA_IMPORTS_PER_MINUTE` | `30` |
| `POST_HISTORY_RETENTION_DAYS` | `730` |
| `EXTERNAL_POSTS_IMPORT_LIMIT` | `50` |
| `X_EXTERNAL_POSTS_IMPORT_DAYS` | `30` |
| `EXTERNAL_POSTS_MATCH_WINDOW_MINUTES` | `120` |
| `EXTERNAL_POSTS_MEDIA_REQUESTS_PER_MINUTE` | `30` |
| `PUBLICATION_DISCOVERY_INTERVAL_HOURS` | `3` |
| `X_PUBLICATION_DISCOVERY_INTERVAL_HOURS` | `24` |
| `PUBLICATION_DISCOVERY_OVERLAP_HOURS` | `6` |
| `TRYPOST_USER_AGENT` | `TryPost.it/1.0 (+https://trypost.it)` |
| `REPURPOSE_POLL_INTERVAL_MINUTES` | `15` |
| `REPURPOSE_BACKOFF_MINUTES` | `60` |
| `FAVICON_API` | `https://icons.duckduckgo.com` |
| `RSS_FEEDS_POLL_INTERVAL_MINUTES` | `480` |
| `RSS_FEEDS_MAX_BACKOFF_MINUTES` | `1440` |
| `RSS_FEEDS_REFRESH_COOLDOWN_MINUTES` | `5` |
| `RSS_FEEDS_MAX_ITEMS_PER_FEED` | `100` |
| `RSS_FEEDS_MAX_PER_WORKSPACE` | `50` |
| `RSS_FEEDS_OG_IMAGE_MAX_ITEMS` | `20` |
| `RSS_FEEDS_OG_IMAGE_MAX_AGE_DAYS` | `14` |
| `RSS_FEEDS_OG_IMAGE_MAX_PAGE_BYTES` | `256 * 1024` |
| `RSS_FEEDS_MAX_RESPONSE_BYTES` | `5 * 1024 * 1024` |
| `RSS_FEEDS_FETCH_BUDGET_SECONDS` | `10` |
| `GOOGLE_AUTH_ENABLED` | `false` |
| `GITHUB_AUTH_ENABLED` | `false` |
| `LINKEDIN_ENABLED` | `true` |
| `LINKEDIN_API` | `https://api.linkedin.com` |
| `LINKEDIN_OAUTH_API` | `https://www.linkedin.com` |
| `LINKEDIN_SCOPES` | `openid,profile,email,w_member_social` |
| `LINKEDIN_PAGE_ENABLED` | `true` |
| `LINKEDIN_PAGE_API` | `https://api.linkedin.com` |
| `LINKEDIN_PAGE_SCOPES` | `openid,profile,email,w_organization_social,r_organization_social,rw_organization_admin,w_member_social` |
| `X_ENABLED` | `true` |
| `X_API` | `https://api.x.com/2` |
| `X_DEFUSE_LINKS` | `false` |
| `TIKTOK_ENABLED` | `true` |
| `TIKTOK_API` | `https://open.tiktokapis.com/v2` |
| `TIKTOK_SCOPES` | `user.info.basic,user.info.profile,user.info.stats,video.publish,video.upload,video.list` |
| `YOUTUBE_ENABLED` | `true` |
| `YOUTUBE_DATA_API` | `https://www.googleapis.com/youtube/v3` |
| `YOUTUBE_ANALYTICS_API` | `https://youtubeanalytics.googleapis.com/v2` |
| `YOUTUBE_OAUTH_API` | `https://oauth2.googleapis.com` |
| `FACEBOOK_ENABLED` | `true` |
| `FACEBOOK_GRAPH_API` | `https://graph.facebook.com/v25.0` |
| `FACEBOOK_RUPLOAD_HOST` | `rupload.facebook.com` |
| `INSTAGRAM_ENABLED` | `true` |
| `INSTAGRAM_GRAPH_API` | `https://graph.instagram.com/v25.0` |
| `INSTAGRAM_AUTH_API` | `https://graph.instagram.com` |
| `INSTAGRAM_OAUTH_URL` | `https://www.instagram.com` |
| `INSTAGRAM_OAUTH_API` | `https://api.instagram.com` |
| `INSTAGRAM_FACEBOOK_ENABLED` | `true` |
| `INSTAGRAM_FACEBOOK_GRAPH_API` | `https://graph.facebook.com/v25.0` |
| `THREADS_ENABLED` | `true` |
| `THREADS_GRAPH_API` | `https://graph.threads.net/v1.0` |
| `THREADS_AUTH_API` | `https://graph.threads.net` |
| `THREADS_OAUTH_URL` | `https://threads.net` |
| `PINTEREST_ENABLED` | `true` |
| `PINTEREST_API` | `https://api.pinterest.com/v5` |
| `BLUESKY_ENABLED` | `true` |
| `BLUESKY_PUBLIC_APPVIEW` | `https://public.api.bsky.app` |
| `BLUESKY_DEFAULT_SERVICE` | `https://bsky.social` |
| `BLUESKY_WEB_APP` | `https://bsky.app` |
| `BLUESKY_VIDEO_SERVICE` | `https://video.bsky.app` |
| `BLUESKY_VIDEO_SERVICE_DID` | `did:web:video.bsky.app` |
| `BLUESKY_VIDEO_POLL_SECONDS` | `2` |
| `BLUESKY_VIDEO_POLL_MAX_SECONDS` | `30` |
| `BLUESKY_VIDEO_MAX_BYTES` | `300_000_000` |
| `BLUESKY_PLC_DIRECTORY` | `https://plc.directory` |
| `MASTODON_ENABLED` | `true` |
| `MASTODON_DEFAULT_INSTANCE` | `https://mastodon.social` |
| `TELEGRAM_ENABLED` | `true` |
| `TELEGRAM_BOT_TOKEN` | `unset` |
| `TELEGRAM_BOT_USERNAME` | `unset` |
| `TELEGRAM_DEEP_LINK` | `https://t.me` |
| `TELEGRAM_API` | `https://api.telegram.org` |
| `TELEGRAM_WEBHOOK_SECRET` | `unset` |
| `DISCORD_ENABLED` | `true` |
| `DISCORD_BOT_TOKEN` | `unset` |
| `DISCORD_API` | `https://discord.com/api/v10` |
| `DISCORD_OAUTH_API` | `https://discord.com/api/oauth2` |
| `DISCORD_PERMISSIONS` | `248832` |
| `DISCORD_SCOPES` | `bot,identify,guilds` |
| `GOOGLE_BUSINESS_ENABLED` | `true` |
| `GOOGLE_BUSINESS_ACCOUNT_MANAGEMENT_API` | `https://mybusinessaccountmanagement.googleapis.com/v1` |
| `GOOGLE_BUSINESS_BUSINESS_INFORMATION_API` | `https://mybusinessbusinessinformation.googleapis.com/v1` |
| `GOOGLE_BUSINESS_LOCAL_POSTS_API` | `https://mybusiness.googleapis.com/v4` |
| `GOOGLE_BUSINESS_OAUTH_API` | `https://oauth2.googleapis.com` |
| `GOOGLE_BUSINESS_DASHBOARD` | `https://business.google.com` |

## Image, build, example, and deployment controls

`TRYPOST_TARGET=production` is fixed by Compose. Keep `TRYPOST_SKIP_BOOTSTRAP` unset so migrations, permission setup, caches, and the bundled services initialize. `TRYPOST_DOCKER_BOOTSTRAP`, `UID`, and `GID` are development controls; this deployment does not mount source code or create a development `.env`.

| Variable | Scope |
| --- | --- |
| `TRYPOST_TARGET` | `production`, fixed |
| `TRYPOST_SKIP_BOOTSTRAP` | upstream default `0`; keep disabled |
| `TRYPOST_DOCKER_BOOTSTRAP` | upstream default `0`; development only |
| `UID`, `GID` | upstream development user mapping, unused here |
| `TRYPOST_HOST` | generated domain; browser build input |
| `TRYPOST_PUBLIC_SCHEME` | `http`; use `https` for TLS and rebuild |
| `TRYPOST_PUBLIC_PORT` | `80`; use `443` for normal HTTPS and rebuild |
| `INITIAL_USER_EMAIL`, `INITIAL_USER_PASSWORD`, `INITIAL_USER_NAME` | first-empty-database bootstrap, described above |
| `VITE_REVERB_HOST`, `VITE_REVERB_PORT`, `VITE_REVERB_SCHEME`, `VITE_REVERB_APP_KEY` | populated as build arguments from the public settings and generated Reverb key; runtime changes alone have no effect |
| `NIGHTWATCH_ENABLED`, `NIGHTWATCH_TOKEN` | vendor telemetry; disabled by Compose |
| `BCRYPT_ROUNDS` | Upstream example/vendor or build setting; optional and not an additional installation requirement. Example: 12 |
| `MAIL_ENCRYPTION` | Legacy example setting; this release uses MAIL_SCHEME in its mail configuration. |
| `STRIPE_WORKSPACE_MONTHLY` | Upstream example/vendor or build setting; optional and not an additional installation requirement. Example:  |
| `STRIPE_WORKSPACE_YEARLY` | Upstream example/vendor or build setting; optional and not an additional installation requirement. Example:  |
| `STRIPE_SOCIALS_MONTHLY` | Upstream example/vendor or build setting; optional and not an additional installation requirement. Example:  |
| `STRIPE_SOCIALS_YEARLY` | Upstream example/vendor or build setting; optional and not an additional installation requirement. Example:  |
| `STRIPE_WORKSPACES_MONTHLY` | Upstream example/vendor or build setting; optional and not an additional installation requirement. Example:  |
| `STRIPE_WORKSPACES_YEARLY` | Upstream example/vendor or build setting; optional and not an additional installation requirement. Example:  |
| `VITE_APP_NAME` | Upstream frontend build input; not forwarded as a build argument by this template. Prebuilt assets are unchanged by runtime env. |
| `VITE_POSTHOG_ENABLED` | Upstream frontend build input; not forwarded as a build argument by this template. Prebuilt assets are unchanged by runtime env. |
| `VITE_POSTHOG_API_KEY` | Upstream frontend build input; not forwarded as a build argument by this template. Prebuilt assets are unchanged by runtime env. |
| `VITE_POSTHOG_HOST` | Upstream frontend build input; not forwarded as a build argument by this template. Prebuilt assets are unchanged by runtime env. |
| `LINKEDIN_PAGE_CLIENT_REDIRECT` | Upstream example/vendor or build setting; optional and not an additional installation requirement. Example: "${APP_URL}/accounts/linkedin-page/callback" |

## Optional integration setup

See [instructions.md](instructions.md) for SMTP configuration, exact OAuth callback paths, Telegram/Discord requirements, storage, HTTPS, and backups. Social permissions and public provider delivery require the provider’s own setup. Keep private endpoint allowances disabled outside deliberate isolated tests. Cloud billing values are not required in self-hosted mode.
