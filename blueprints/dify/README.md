# Dify

Open-source LLM application development platform with AI agents, workflow orchestration, and RAG capabilities.

## Overview

Dify is a production-ready platform for developing LLM applications with:

- **AI Agent Builder**: Multi-model AI agents with customizable capabilities
- **Workflow Orchestration**: Visual workflow designer for complex AI pipelines
- **RAG Pipeline**: Retrieval Augmented Generation with vector database support
- **Model Management**: Support for OpenAI, Anthropic, Google, Hugging Face, and more
- **OpenAI-Compatible API**: Drop-in replacement for OpenAI API endpoints
- **Plugin System**: Extensible architecture with secure sandbox execution

## Architecture

This deployment includes 10 services:

### Application Services
- **API**: Core application logic and API endpoints
- **Worker**: Celery-based background job processor
- **Web**: Next.js frontend application
- **Nginx**: Reverse proxy for routing

### Data Layer
- **PostgreSQL**: Primary relational database
- **Redis**: Cache and message broker
- **Weaviate**: Vector database for embeddings and RAG

### Plugin & Execution
- **Sandbox**: Secure code execution environment
- **Plugin Daemon**: Plugin management
- **SSRF Proxy**: Security proxy for sandbox internet access

### Network Architecture
```
User → Traefik → Nginx → [ API / Web ]
                          ↓
                    [ Database / Redis / Weaviate ]
                          ↓
              [ Plugin Daemon → Sandbox → SSRF Proxy ]
```

## Deploying with Dokploy

### Step 1: Create from Template

1. Open your Dokploy dashboard and select your project
2. Click **"Create Service"** → **"Template"**
3. Search for "Dify" or browse the AI/LLM category
4. Select the Dify template (version 1.11.2)

### Step 2: Configure & Deploy

1. **Select Server** (if you have multiple servers)
2. **Set Domain**: Dokploy will auto-generate one, or specify your custom domain
3. **Review Environment Variables**:
   - All secrets are auto-generated
   - Note the `INIT_PASSWORD` - you'll need this for first-time registration
4. **Click "Deploy"**

Deployment takes less than a minute. All services start automatically, including database migrations.

### Step 3: First-Time Registration

1. Navigate to your Dify domain (check the **Domains** tab)
2. You'll be redirected to `/install`
3. Enter the `INIT_PASSWORD` from environment variables
4. Register with your username and new password
5. This becomes your permanent login - the init password is only needed once

### Step 4: Add LLM Providers

1. Go to **Settings → Model Providers**
2. Add your API keys:
   - **OpenAI**
   - **Anthropic**
   - **Google Gemini**
   - Or any OpenAI-compatible endpoint
3. Test connections
4. Start building applications

## Configuration

### Using a Custom Domain

Dokploy handles domain configuration automatically:

1. Go to your Dify service → **Domains** tab
2. Click **"Add Domain"**
3. Enter your domain (e.g., `ai.yourcompany.com`)
4. Point your DNS to the Dokploy server IP
5. Update environment variables with your domain:
   - `DIFY_DOMAIN=ai.yourcompany.com`
   - `CONSOLE_WEB_URL=https://ai.yourcompany.com`
   - `CONSOLE_API_URL=https://ai.yourcompany.com`
   - `SERVICE_API_URL=https://ai.yourcompany.com`
   - `APP_WEB_URL=https://ai.yourcompany.com`
   - `APP_API_URL=https://ai.yourcompany.com`
   - `WEB_API_URL=https://ai.yourcompany.com`
   - `FILES_URL=https://ai.yourcompany.com/files`
   - `WEB_API_CORS_ALLOW_ORIGINS=https://ai.yourcompany.com`
   - `CONSOLE_CORS_ALLOW_ORIGINS=https://ai.yourcompany.com`
6. Redeploy the service

### Email Notifications

Add SMTP settings in the **Environment** tab:

```
MAIL_TYPE=smtp
MAIL_DEFAULT_SEND_FROM=noreply@yourdomain.com
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_USE_TLS=true
```

Then redeploy.

### Plugin Development

Port 5003 is exposed for plugin debugging:
- Access at: `http://your-server-ip:5003`
- See [Dify Plugin Documentation](https://docs.dify.ai/plugins)

## Data Persistence

All data is stored in named volumes:
- `dify-db-data`: PostgreSQL database
- `dify-redis-data`: Redis cache
- `dify-weaviate-data`: Vector embeddings
- `dify-storage`: Application files and uploads
- `dify-plugin-storage`: Plugin data

Configure backups in Dokploy's **Backups** tab:
- Schedule PostgreSQL database dumps
- Backup critical volumes (`dify-storage`, `dify-weaviate-data`)

## Resource Requirements

**Minimum** (from Dify documentation):
- CPU: 2 cores
- RAM: 4GB
- Disk: 20GB

## Managing Your Deployment

### Access Points

- **Web UI**: `https://your-dify-domain` (main application)
- **API**: `https://your-dify-domain/api` (REST API)
- **Console API**: `https://your-dify-domain/console/api` (admin API)
- **OpenAI-Compatible API**: `https://your-dify-domain/v1`
- **Health Check**: `https://your-dify-domain/health`

### Monitoring

Use Dokploy's built-in monitoring:

**Logs**: Click **Logs** tab and select container:
- `nginx` - Request routing and access logs
- `api` - Application logs and database migrations
- `worker` - Background job processing
- `web` - Frontend logs
- `db` - PostgreSQL logs
- `redis` - Cache operations
- `weaviate` - Vector database operations
- `sandbox` - Code execution logs
- `plugin_daemon` - Plugin management
- `ssrf_proxy` - Security proxy logs

**Status**: Check **Monitoring** tab
- All 10 services should show "Running"
- Database and Redis should show "Healthy"

### Common Operations

**Restart Services**:
1. Go to your Dify service
2. Click **Actions** → **Restart**

**Update Environment Variables**:
1. Go to **Environment** tab
2. Modify variables
3. Click **Redeploy** to apply changes

**View Docker Compose**:
- Go to **General** tab to see complete configuration

### Troubleshooting

**Services Won't Start**:
- Check **Logs** tab for errors
- Common: Database migration errors (check `api` logs), Redis connection issues
- Verify sufficient resources in **Monitoring** tab

**Can't Access Web Interface**:
- Check **Domains** tab for configured domain
- Verify DNS points to Dokploy server
- Test: `curl https://your-domain/health`
- Check `nginx` logs for routing errors

**Database Migration Errors**:
- Verify `db` container shows "Healthy" status
- Check database logs for connection errors
- Manual fix: Access API container shell, run `python -m flask db upgrade`

**Application Errors**:
- Check `api` logs for Python exceptions
- Check `worker` logs for background job issues
- Verify `redis` and `weaviate` are running

## Documentation

- [Official Documentation](https://docs.dify.ai)
- [GitHub Repository](https://github.com/langgenius/dify)
- [Community Discussions](https://github.com/langgenius/dify/discussions)
- [Discord Community](https://discord.gg/FngNHpbcY7)
- [API Reference](https://docs.dify.ai/api-reference)
- [Plugin Development](https://docs.dify.ai/plugins)

## License

Dify is open-source software. See the [official repository](https://github.com/langgenius/dify) for license information.

---

**Template Version**: 1.11.2 (based on Dify v1.11.2)
**Last Updated**: January 2026
