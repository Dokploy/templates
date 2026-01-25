### docker-compose.yml
```
version: "3.8"
services:
  feed-requests-redis-cache:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --save 60 1
    volumes:
      - feed-requests-redis-data:/data
    networks:
      - dokploy-network

  rabbitmq-broker:
    image: rabbitmq:3-management-alpine
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
      interval: 5s
      timeout: 5s
      retries: 20
    environment:
      RABBITMQ_SERVER_ADDITIONAL_ERL_ARGS: "-rabbit loopback_users []"
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq
    networks:
      - dokploy-network

  mongo:
    image: mongo:8.0
    restart: unless-stopped
    command: mongod --port 27017
    logging:
      driver: "none"
    volumes:
      - mongodb-data:/data/db
    networks:
      - dokploy-network

  feed-requests-postgres-db:
    image: postgres:17-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    healthcheck:
      test:
        ["CMD", "pg_isready", "-q", "-d", "postgres", "-U", "${POSTGRES_USER}"]
      interval: 10s
      timeout: 45s
      retries: 10
    logging:
      driver: "none"
    volumes:
      - feed-requests-postgres17-data:/var/lib/postgresql/data
    networks:
      - dokploy-network

  init-dbs:
    image: postgres:17-alpine
    restart: "no"
    depends_on:
      feed-requests-postgres-db:
        condition: service_healthy
    environment:
      PGUSER: ${POSTGRES_USER}
      PGPASSWORD: ${POSTGRES_PASSWORD}
    command: >
      sh -c "
      echo 'Waiting for Postgres...';
      until pg_isready -h feed-requests-postgres-db; do sleep 2; done;

      echo 'Checking feedrequests database...';
      psql -h feed-requests-postgres-db -tc \"SELECT 1 FROM pg_database WHERE datname = 'feedrequests'\" | grep -q 1 || psql -h feed-requests-postgres-db -c 'CREATE DATABASE feedrequests';

      echo 'Checking userfeeds database...';
      psql -h feed-requests-postgres-db -tc \"SELECT 1 FROM pg_database WHERE datname = 'userfeeds'\" | grep -q 1 || psql -h feed-requests-postgres-db -c 'CREATE DATABASE userfeeds';

      echo 'Database initialization complete!';
      "
    networks:
      - dokploy-network

  bot-presence-service:
    image: ghcr.io/synzen/monitorss-bot-presence:latest
    restart: unless-stopped
    command: ["node", "dist/main.js"]
    depends_on:
      rabbitmq-broker:
        condition: service_healthy
      mongo:
        condition: service_started
    environment:
      BOT_PRESENCE_DISCORD_BOT_TOKEN: ${BOT_PRESENCE_DISCORD_BOT_TOKEN}
      BOT_PRESENCE_STATUS: ${BOT_PRESENCE_STATUS}
      BOT_PRESENCE_ACTIVITY_TYPE: ${BOT_PRESENCE_ACTIVITY_TYPE}
      BOT_PRESENCE_ACTIVITY_NAME: ${BOT_PRESENCE_ACTIVITY_NAME}
      BOT_PRESENCE_RABBITMQ_URL: ${BOT_PRESENCE_RABBITMQ_URL}
      NODE_ENV: production
    networks:
      - dokploy-network

  discord-rest-listener-service:
    image: ghcr.io/synzen/monitorss-discord-rest-listener:latest
    restart: unless-stopped
    command: ["node", "build/app.js"]
    depends_on:
      rabbitmq-broker:
        condition: service_healthy
      mongo:
        condition: service_started
    environment:
      DISCORD_REST_LISTENER_RABBITMQ_URI: ${DISCORD_REST_LISTENER_RABBITMQ_URI}
      DISCORD_REST_LISTENER_MAX_REQ_PER_SEC: ${DISCORD_REST_LISTENER_MAX_REQ_PER_SEC}
      DISCORD_REST_LISTENER_MONGO_URI: ${DISCORD_REST_LISTENER_MONGO_URI}
      DISCORD_REST_LISTENER_BOT_TOKEN: ${DISCORD_REST_LISTENER_BOT_TOKEN}
      DISCORD_REST_LISTENER_BOT_CLIENT_ID: ${DISCORD_REST_LISTENER_BOT_CLIENT_ID}
      NODE_ENV: production
    networks:
      - dokploy-network

  feed-requests-service:
    image: ghcr.io/synzen/monitorss-feed-requests:latest
    restart: unless-stopped
    command: ["node", "dist/main.js"]
    depends_on:
      feed-requests-postgres-db:
        condition: service_started
      feed-requests-redis-cache:
        condition: service_started
      rabbitmq-broker:
        condition: service_healthy
    environment:
      FEED_REQUESTS_POSTGRES_URI: ${FEED_REQUESTS_POSTGRES_URI}
      FEED_REQUESTS_POSTGRES_SCHEMA: ${FEED_REQUESTS_POSTGRES_SCHEMA}
      FEED_REQUESTS_API_KEY: ${FEED_REQUESTS_API_KEY}
      FEED_REQUESTS_API_PORT: ${FEED_REQUESTS_API_PORT}
      FEED_REQUESTS_RABBITMQ_BROKER_URL: ${FEED_REQUESTS_RABBITMQ_BROKER_URL}
      FEED_REQUESTS_FAILED_REQUEST_DURATION_THRESHOLD_HOURS: ${FEED_REQUESTS_FAILED_REQUEST_DURATION_THRESHOLD_HOURS}
      FEED_REQUESTS_REDIS_URI: ${FEED_REQUESTS_REDIS_URI}
      FEED_REQUESTS_REDIS_DISABLE_CLUSTER: ${FEED_REQUESTS_REDIS_DISABLE_CLUSTER}
      FEED_REQUESTS_FEEDS_MONGODB_URI: ${FEED_REQUESTS_FEEDS_MONGODB_URI}
      FEED_REQUESTS_FEED_REQUEST_DEFAULT_USER_AGENT: ${FEED_REQUESTS_FEED_REQUEST_DEFAULT_USER_AGENT}
      FEED_REQUESTS_HISTORY_PERSISTENCE_MONTHS: ${FEED_REQUESTS_HISTORY_PERSISTENCE_MONTHS}
      FEED_REQUESTS_MAX_FAIL_ATTEMPTS: ${FEED_REQUESTS_MAX_FAIL_ATTEMPTS}
      FEED_REQUESTS_REQUEST_TIMEOUT_MS: ${FEED_REQUESTS_REQUEST_TIMEOUT_MS}
      NODE_ENV: production
    healthcheck:
      test:
        - CMD-SHELL
        - wget --no-verbose --tries=1 --spider http://127.0.0.1:5000/v1/feed-requests/health || exit 1
      interval: 5s
      timeout: 5s
      retries: 3
    networks:
      - dokploy-network

  feed-requests-postgres-migration:
    image: ghcr.io/synzen/monitorss-feed-requests:latest
    restart: unless-stopped
    command: ["sh", "-c", "npm run migration:up && tail -f /dev/null"]
    depends_on:
      feed-requests-postgres-db:
        condition: service_started
      init-dbs:
        condition: service_completed_successfully
    environment:
      FEED_REQUESTS_POSTGRES_URI: ${FEED_REQUESTS_POSTGRES_URI}
      FEED_REQUESTS_POSTGRES_SCHEMA: ${FEED_REQUESTS_POSTGRES_SCHEMA}
      FEED_REQUESTS_API_KEY: ${FEED_REQUESTS_API_KEY}
      FEED_REQUESTS_API_PORT: ${FEED_REQUESTS_API_PORT}
      FEED_REQUESTS_RABBITMQ_BROKER_URL: ${FEED_REQUESTS_RABBITMQ_BROKER_URL}
      FEED_REQUESTS_FAILED_REQUEST_DURATION_THRESHOLD_HOURS: ${FEED_REQUESTS_FAILED_REQUEST_DURATION_THRESHOLD_HOURS}
      FEED_REQUESTS_REDIS_URI: ${FEED_REQUESTS_REDIS_URI}
      FEED_REQUESTS_REDIS_DISABLE_CLUSTER: ${FEED_REQUESTS_REDIS_DISABLE_CLUSTER}
      FEED_REQUESTS_FEEDS_MONGODB_URI: ${FEED_REQUESTS_FEEDS_MONGODB_URI}
      FEED_REQUESTS_FEED_REQUEST_DEFAULT_USER_AGENT: ${FEED_REQUESTS_FEED_REQUEST_DEFAULT_USER_AGENT}
      FEED_REQUESTS_HISTORY_PERSISTENCE_MONTHS: ${FEED_REQUESTS_HISTORY_PERSISTENCE_MONTHS}
      FEED_REQUESTS_MAX_FAIL_ATTEMPTS: ${FEED_REQUESTS_MAX_FAIL_ATTEMPTS}
      FEED_REQUESTS_REQUEST_TIMEOUT_MS: ${FEED_REQUESTS_REQUEST_TIMEOUT_MS}
      NODE_ENV: production
    networks:
      - dokploy-network

  user-feeds-service:
    image: ghcr.io/synzen/monitorss-user-feeds:latest
    restart: unless-stopped
    depends_on:
      feed-requests-postgres-db:
        condition: service_started
      feed-requests-redis-cache:
        condition: service_started
      feed-requests-service:
        condition: service_healthy
      rabbitmq-broker:
        condition: service_healthy
    environment:
      USER_FEEDS_POSTGRES_URI: ${USER_FEEDS_POSTGRES_URI}
      USER_FEEDS_API_PORT: ${USER_FEEDS_API_PORT}
      USER_FEEDS_RABBITMQ_BROKER_URL: ${USER_FEEDS_RABBITMQ_BROKER_URL}
      USER_FEEDS_FEED_REQUESTS_API_URL: ${USER_FEEDS_FEED_REQUESTS_API_URL}
      USER_FEEDS_FEED_REQUESTS_API_KEY: ${USER_FEEDS_FEED_REQUESTS_API_KEY}
      USER_FEEDS_API_KEY: ${USER_FEEDS_API_KEY}
      USER_FEEDS_REDIS_URI: ${USER_FEEDS_REDIS_URI}
      USER_FEEDS_REDIS_DISABLE_CLUSTER: ${USER_FEEDS_REDIS_DISABLE_CLUSTER}
      USER_FEEDS_DISCORD_CLIENT_ID: ${USER_FEEDS_DISCORD_CLIENT_ID}
      USER_FEEDS_DISCORD_API_TOKEN: ${USER_FEEDS_DISCORD_API_TOKEN}
      USER_FEEDS_DELIVERY_RECORD_PERSISTENCE_MONTHS: ${USER_FEEDS_DELIVERY_RECORD_PERSISTENCE_MONTHS}
      USER_FEEDS_ARTICLE_PERSISTENCE_MONTHS: ${USER_FEEDS_ARTICLE_PERSISTENCE_MONTHS}
      NODE_ENV: production
    healthcheck:
      test:
        - CMD-SHELL
        - wget --no-verbose --tries=1 --spider http://127.0.0.1:5000/v1/user-feeds/health || exit 1
      interval: 5s
      timeout: 5s
      retries: 3
    networks:
      - dokploy-network

  user-feeds-postgres-migration:
    image: ghcr.io/synzen/monitorss-user-feeds:latest
    restart: unless-stopped
    command:
      [
        "sh",
        "-c",
        "node ./dist/src/scripts/run-migrations.js && tail -f /dev/null",
      ]
    depends_on:
      feed-requests-postgres-db:
        condition: service_started
    environment:
      USER_FEEDS_POSTGRES_URI: ${USER_FEEDS_POSTGRES_URI}
      USER_FEEDS_DISCORD_CLIENT_ID: ${USER_FEEDS_DISCORD_CLIENT_ID}
      USER_FEEDS_DISCORD_API_TOKEN: ${USER_FEEDS_DISCORD_API_TOKEN}
      USER_FEEDS_DELIVERY_RECORD_PERSISTENCE_MONTHS: ${USER_FEEDS_DELIVERY_RECORD_PERSISTENCE_MONTHS}
      USER_FEEDS_ARTICLE_PERSISTENCE_MONTHS: ${USER_FEEDS_ARTICLE_PERSISTENCE_MONTHS}
      USER_FEEDS_API_KEY: ${USER_FEEDS_API_KEY}
      USER_FEEDS_FEED_REQUESTS_API_KEY: ${USER_FEEDS_FEED_REQUESTS_API_KEY}
      NODE_ENV: production
    networks:
      - dokploy-network

  legacy-feed-bulk-converter-service:
    image: ghcr.io/synzen/monitorss-monolith:main
    restart: unless-stopped
    command: ["node", "dist/scripts/legacy-feed-bulk-converter.js"]
    depends_on:
      mongo:
        condition: service_started
    environment:
      NODE_ENV: production
      BACKEND_API_USER_FEEDS_API_HOST: http://user-feeds-service:5000
      BACKEND_API_USER_FEEDS_API_KEY: ${USER_FEEDS_API_KEY}
      BACKEND_API_FEED_REQUESTS_API_HOST: http://feed-requests-service:5000
      BACKEND_API_FEED_REQUESTS_API_KEY: ${FEED_REQUESTS_API_KEY}
      BACKEND_API_LOGIN_REDIRECT_URI: ${BACKEND_API_LOGIN_REDIRECT_URI}
      BACKEND_API_DISCORD_REDIRECT_URI: ${BACKEND_API_DISCORD_REDIRECT_URI}
      BACKEND_API_DEFAULT_MAX_FEEDS: ${BACKEND_API_DEFAULT_MAX_FEEDS}
      BACKEND_API_DEFAULT_MAX_USER_FEEDS: ${BACKEND_API_DEFAULT_MAX_USER_FEEDS}
      BACKEND_API_MAX_DAILY_ARTICLES_DEFAULT: ${BACKEND_API_MAX_DAILY_ARTICLES_DEFAULT}
      BACKEND_API_FEED_USER_AGENT: ${BACKEND_API_FEED_USER_AGENT}
      BACKEND_API_RABBITMQ_BROKER_URL: ${BACKEND_API_RABBITMQ_BROKER_URL}
      BACKEND_API_MONGODB_URI: ${BACKEND_API_MONGODB_URI}
      LOG_LEVEL: ${LOG_LEVEL}
    networks:
      - dokploy-network

  schedule-emitter-service:
    image: ghcr.io/synzen/monitorss-monolith:main
    restart: unless-stopped
    command: npm run start:schedule-emitter
    depends_on:
      mongo:
        condition: service_started
      rabbitmq-broker:
        condition: service_healthy
    environment:
      BACKEND_API_USER_FEEDS_API_HOST: http://user-feeds-service:5000
      BACKEND_API_USER_FEEDS_API_KEY: ${USER_FEEDS_API_KEY}
      BACKEND_API_FEED_REQUESTS_API_HOST: http://feed-requests-service:5000
      BACKEND_API_FEED_REQUESTS_API_KEY: ${FEED_REQUESTS_API_KEY}
      BACKEND_API_DEFAULT_MAX_FEEDS: ${BACKEND_API_DEFAULT_MAX_FEEDS}
      BACKEND_API_DEFAULT_MAX_USER_FEEDS: ${BACKEND_API_DEFAULT_MAX_USER_FEEDS}
      BACKEND_API_MAX_DAILY_ARTICLES_DEFAULT: ${BACKEND_API_MAX_DAILY_ARTICLES_DEFAULT}
      BACKEND_API_FEED_USER_AGENT: ${BACKEND_API_FEED_USER_AGENT}
      BACKEND_API_RABBITMQ_BROKER_URL: ${BACKEND_API_RABBITMQ_BROKER_URL}
      BACKEND_API_MONGODB_URI: ${BACKEND_API_MONGODB_URI}
      LOG_LEVEL: ${LOG_LEVEL}
      NODE_ENV: production
    networks:
      - dokploy-network

  monolith:
    image: ghcr.io/synzen/monitorss-monolith:main
    restart: unless-stopped
    command: ["node", "dist/main.js"]
    depends_on:
      mongo:
        condition: service_started
      user-feeds-service:
        condition: service_healthy
      feed-requests-service:
        condition: service_healthy
    expose:
      - "8000"
    environment:
      BACKEND_API_NODE_ENV: production
      BACKEND_API_PORT: 8000
      BACKEND_API_DEFAULT_MAX_FEEDS: ${BACKEND_API_DEFAULT_MAX_FEEDS}
      BACKEND_API_DEFAULT_MAX_USER_FEEDS: ${BACKEND_API_DEFAULT_MAX_USER_FEEDS}
      BACKEND_API_MAX_DAILY_ARTICLES_DEFAULT: ${BACKEND_API_MAX_DAILY_ARTICLES_DEFAULT}
      BACKEND_API_USER_FEEDS_API_HOST: http://user-feeds-service:5000
      BACKEND_API_FEED_REQUESTS_API_HOST: http://feed-requests-service:5000
      BACKEND_API_FEED_USER_AGENT: ${BACKEND_API_FEED_USER_AGENT}
      BACKEND_API_RABBITMQ_BROKER_URL: ${BACKEND_API_RABBITMQ_BROKER_URL}
      BACKEND_API_USER_FEEDS_API_KEY: ${USER_FEEDS_API_KEY}
      BACKEND_API_FEED_REQUESTS_API_KEY: ${FEED_REQUESTS_API_KEY}
      BACKEND_API_DISCORD_BOT_TOKEN: ${BACKEND_API_DISCORD_BOT_TOKEN}
      BACKEND_API_DISCORD_CLIENT_ID: ${BACKEND_API_DISCORD_CLIENT_ID}
      BACKEND_API_DISCORD_CLIENT_SECRET: ${BACKEND_API_DISCORD_CLIENT_SECRET}
      BACKEND_API_SESSION_SECRET: ${BACKEND_API_SESSION_SECRET}
      BACKEND_API_SESSION_SALT: ${BACKEND_API_SESSION_SALT}
      BACKEND_API_LOGIN_REDIRECT_URI: ${BACKEND_API_LOGIN_REDIRECT_URI}
      BACKEND_API_DISCORD_REDIRECT_URI: ${BACKEND_API_DISCORD_REDIRECT_URI}
      BACKEND_API_ALLOW_LEGACY_REVERSION: ${BACKEND_API_ALLOW_LEGACY_REVERSION}
      BACKEND_API_MONGODB_URI: ${BACKEND_API_MONGODB_URI}
      BACKEND_API_DEFAULT_REFRESH_RATE_MINUTES: ${BACKEND_API_DEFAULT_REFRESH_RATE_MINUTES}
      LOG_LEVEL: ${LOG_LEVEL}
      NODE_ENV: production
    networks:
      - dokploy-network

volumes:
  mongodb-data:
  rabbitmq-data:
  feed-requests-postgres17-data:
  feed-requests-redis-data:

networks:
  dokploy-network:
    external: true

```

### template.toml
```
[variables]
main_domain = "${domain}"
postgres_user = "postgres"
postgres_password = "${password:24}"
feed_requests_api_key = "${password:32}"
user_feeds_api_key = "${password:32}"
session_secret = "${password:64}"
session_salt = "${password:16}"
discord_bot_token = ""
discord_client_id = ""
discord_client_secret = ""
bot_presence_status = "online"
bot_presence_activity_type = ""
bot_presence_activity_name = ""
log_level = "info"
feed_requests_user_agent = "MonitoRSS [Self-Hosted]/1.0"
mongo_database = "rss"
feed_requests_postgres_db = "feedrequests"
user_feeds_postgres_db = "userfeeds"
discord_redirect_path = "/api/v1/discord/callback-v2"
mongo_uri = "mongodb://mongo:27017/${mongo_database}"
rabbitmq_uri = "amqp://guest:guest@rabbitmq-broker:5672/"
feed_requests_postgres_uri = "postgres://${postgres_user}:${postgres_password}@feed-requests-postgres-db:5432/${feed_requests_postgres_db}"
user_feeds_postgres_uri = "postgres://${postgres_user}:${postgres_password}@feed-requests-postgres-db:5432/${user_feeds_postgres_db}"

[config]
env = [
  "POSTGRES_USER=postgres",
  "POSTGRES_PASSWORD=${postgres_password}",
  "BOT_PRESENCE_DISCORD_BOT_TOKEN=${discord_bot_token}",
  "BOT_PRESENCE_STATUS=${bot_presence_status}",
  "BOT_PRESENCE_ACTIVITY_TYPE=${bot_presence_activity_type}",
  "BOT_PRESENCE_ACTIVITY_NAME=${bot_presence_activity_name}",
  "BOT_PRESENCE_RABBITMQ_URL=${rabbitmq_uri}",
  "DISCORD_REST_LISTENER_RABBITMQ_URI=${rabbitmq_uri}",
  "DISCORD_REST_LISTENER_MAX_REQ_PER_SEC=40",
  "DISCORD_REST_LISTENER_MONGO_URI=${mongo_uri}",
  "DISCORD_REST_LISTENER_BOT_TOKEN=${discord_bot_token}",
  "DISCORD_REST_LISTENER_BOT_CLIENT_ID=${discord_client_id}",
  "FEED_REQUESTS_POSTGRES_URI=${feed_requests_postgres_uri}",
  "FEED_REQUESTS_POSTGRES_SCHEMA=${feed_requests_postgres_db}",
  "FEED_REQUESTS_API_KEY=${feed_requests_api_key}",
  "FEED_REQUESTS_API_PORT=5000",
  "FEED_REQUESTS_RABBITMQ_BROKER_URL=${rabbitmq_uri}",
  "FEED_REQUESTS_FAILED_REQUEST_DURATION_THRESHOLD_HOURS=48",
  "FEED_REQUESTS_REDIS_URI=redis://feed-requests-redis-cache:6379",
  "FEED_REQUESTS_REDIS_DISABLE_CLUSTER=true",
  "FEED_REQUESTS_FEEDS_MONGODB_URI=${mongo_uri}",
  "FEED_REQUESTS_FEED_REQUEST_DEFAULT_USER_AGENT=${feed_requests_user_agent}",
  "FEED_REQUESTS_HISTORY_PERSISTENCE_MONTHS=1",
  "FEED_REQUESTS_MAX_FAIL_ATTEMPTS=11",
  "FEED_REQUESTS_REQUEST_TIMEOUT_MS=15000",
  "USER_FEEDS_POSTGRES_URI=${user_feeds_postgres_uri}",
  "USER_FEEDS_API_PORT=5000",
  "USER_FEEDS_RABBITMQ_BROKER_URL=${rabbitmq_uri}",
  "USER_FEEDS_FEED_REQUESTS_API_URL=http://feed-requests-service:5000/v1/feed-requests",
  "USER_FEEDS_FEED_REQUESTS_API_KEY=${feed_requests_api_key}",
  "USER_FEEDS_API_KEY=${user_feeds_api_key}",
  "USER_FEEDS_REDIS_URI=redis://feed-requests-redis-cache:6379",
  "USER_FEEDS_REDIS_DISABLE_CLUSTER=true",
  "USER_FEEDS_DISCORD_CLIENT_ID=${discord_client_id}",
  "USER_FEEDS_DISCORD_API_TOKEN=${discord_bot_token}",
  "USER_FEEDS_DELIVERY_RECORD_PERSISTENCE_MONTHS=1",
  "USER_FEEDS_ARTICLE_PERSISTENCE_MONTHS=12",
  "BACKEND_API_DEFAULT_MAX_FEEDS=999999",
  "BACKEND_API_DEFAULT_MAX_USER_FEEDS=10000",
  "BACKEND_API_MAX_DAILY_ARTICLES_DEFAULT=100000",
  "BACKEND_API_FEED_USER_AGENT=${feed_requests_user_agent}",
  "BACKEND_API_RABBITMQ_BROKER_URL=${rabbitmq_uri}",
  "BACKEND_API_MONGODB_URI=${mongo_uri}",
  "BACKEND_API_LOGIN_REDIRECT_URI=https://${main_domain}",
  "BACKEND_API_DISCORD_REDIRECT_URI=https://${main_domain}${discord_redirect_path}",
  "BACKEND_API_DISCORD_BOT_TOKEN=${discord_bot_token}",
  "BACKEND_API_DISCORD_CLIENT_ID=${discord_client_id}",
  "BACKEND_API_DISCORD_CLIENT_SECRET=${discord_client_secret}",
  "BACKEND_API_SESSION_SECRET=${session_secret}",
  "BACKEND_API_SESSION_SALT=${session_salt}",
  "BACKEND_API_ALLOW_LEGACY_REVERSION=true",
  "BACKEND_API_DEFAULT_REFRESH_RATE_MINUTES=10",
  "BACKEND_API_USER_FEEDS_API_KEY=${user_feeds_api_key}",
  "BACKEND_API_FEED_REQUESTS_API_KEY=${feed_requests_api_key}",
  "LOG_LEVEL=${log_level}",
  "# Fill the Discord bot credentials above before deploying",
]
mounts = []

[[config.domains]]
serviceName = "monolith"
port = 8_000
host = "${main_domain}"

```

## 📝 Processing Summary

- 📁 Directories processed (after blacklist): 0
- 📄 Files processed (after blacklist): 4

### 📁 List of Directories


### 📄 List of Files

- monitorss\docker-compose.yml
- monitorss\extract-files-content.ps1
- monitorss\logo.svg
- monitorss\template.toml
