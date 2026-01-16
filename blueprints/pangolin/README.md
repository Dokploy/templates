# Pangolin Template for Dokploy

## Overview

Pangolin is an identity-based remote access platform that combines reverse proxy and VPN capabilities built on WireGuard. This template provides a complete deployment configuration for running Pangolin on Dokploy.

**⚠️ Important:** This is a more complex deployment than typical Dokploy templates due to Pangolin's use of Traefik as an internal reverse proxy. Please read this README carefully before deployment.

## Architecture

Pangolin consists of three core services:

1. **pangolin** - Main application (dashboard + API)
   - Dashboard on port 3002
   - API on port 3001
   - Healthcheck: `/api/v1/`

2. **gerbil** - WireGuard VPN service
   - Requires `NET_ADMIN` and `SYS_MODULE` capabilities
   - Exposes ports: 80, 443, 51820/udp, 21820/udp
   - Stores WireGuard keys

3. **traefik** - Internal reverse proxy
   - Uses `network_mode: service:gerbil` to share gerbil's network namespace
   - Handles HTTP/HTTPS routing
   - Manages SSL certificates via Let's Encrypt
   - Routes to pangolin services internally

## Domain Routing Architecture

### Standard Routing

```
dokploy.example.com → Dokploy (Dokploy's own routing)
pangolin.example.com → Dokploy → Traefik → Pangolin Dashboard
myapp.example.com → Dokploy → Your App (standard Dokploy routing)
mylocalapp.example.com → Dokploy → Pangolin → Traefik → Local Resource
```

### How It Works

1. **Dokploy handles initial domain routing** - When you assign a domain to the Pangolin deployment, Dokploy's Traefik routes traffic to the `gerbil` service (port 80)
2. **Pangolin's Traefik handles internal routing** - Traefik inside the deployment receives the request and routes it to the appropriate Pangolin service (dashboard or API)
3. **Pangolin can proxy to other resources** - Once configured, Pangolin can proxy to other Dokploy apps or external resources

## Deployment

### Basic Deployment

1. Deploy the template via Dokploy
2. Assign a domain (e.g., `pangolin.example.com`)
3. Wait for services to start (pangolin healthcheck must pass before gerbil and traefik start)
4. Access the dashboard at your assigned domain
5. Complete the initial setup in the Pangolin dashboard

### Configuration

The template automatically configures:

- **Pangolin config** (`/app/config/config.yml`) - Main application configuration
- **Traefik static config** (`/etc/traefik/traefik_config.yml`) - Traefik entrypoints and certificate resolver
- **Traefik dynamic config** (`/etc/traefik/dynamic_config.yml`) - Routing rules for dashboard and API
- **SSL certificates** - Managed via Let's Encrypt

### Environment Variables

The template uses Dokploy's variable helpers:

- `main_domain` - Your assigned domain (auto-generated)
- `pangolin_secret` - Secret key for Pangolin (auto-generated, 64 chars)
- `letsencrypt_email` - Email for Let's Encrypt certificates (auto-generated)

## Advanced: Catch-All Routing Configuration

### Overview

You can configure Dokploy's Traefik to forward all unknown/unmatched domains to Pangolin. This allows Pangolin to act as a catch-all reverse proxy for domains not explicitly configured in Dokploy.

**Use Case:** When you want Pangolin to handle routing for domains that aren't explicitly set up in Dokploy, such as:
- Dynamic subdomains
- Local development domains
- Temporary domains for testing

### How Catch-All Routing Works

```
Request Flow:
1. Client → unknown-domain.example.com
2. Dokploy Traefik receives request
3. No explicit router matches the domain
4. Catch-all router (lowest priority) matches and forwards to Pangolin
5. Pangolin's Traefik receives the request and handles routing
6. Pangolin routes to configured resource (local, WireGuard, or other)
```

### Configuration Steps

#### Step 1: Deploy Pangolin Template

1. Deploy the Pangolin template via Dokploy
2. Note the service name (typically `{project-name}-gerbil` or similar)
   - You can find this by checking your deployment in Dokploy
   - Or by running: `docker ps | grep gerbil`

#### Step 2: Verify Pangolin Configuration

The template already configures Pangolin with `trust_proxy: 1` in the config file, which allows it to properly handle forwarded requests from Dokploy's Traefik. This is required for catch-all routing.

#### Step 3: Create Catch-All Router in Dokploy's Traefik

**Option A: Via Dokploy API (if available)**

Use Dokploy's API endpoints to create the catch-all configuration:
- Endpoint: `/api/settings/traefik/file`
- Method: `POST` or `PUT`
- Create file: `pangolin-catchall.yml`

**Option B: Manual File Creation (Recommended)**

1. SSH into your Dokploy server
2. Navigate to `/etc/dokploy/traefik/dynamic/` (production) or `.docker/traefik/dynamic/` (development)
3. Create a new file: `pangolin-catchall.yml`
4. Add the following configuration:

```yaml
http:
  routers:
    pangolin-catchall:
      rule: "HostRegexp(`^.+$`)"
      priority: 1  # Lowest priority - only matches when nothing else does
      service: pangolin-forward
      entryPoints:
        - web
        - websecure
      middlewares:
        - pangolin-headers
      tls:
        certResolver: letsencrypt

  middlewares:
    pangolin-headers:
      headers:
        customRequestHeaders:
          X-Forwarded-Proto: "https"
          X-Forwarded-Host: "{host}"

  services:
    pangolin-forward:
      loadBalancer:
        servers:
          - url: "http://pangolin-gerbil:80"  # Replace with your actual service name
        passHostHeader: true
```

**Important Notes:**

- Replace `pangolin-gerbil` with your actual service name
  - Format is typically: `{project-name}-{service-name}`
  - Example: If your project is named "pangolin", service name would be `pangolin-gerbil`
  - Example: If your project is named "my-pangolin", service name would be `my-pangolin-gerbil`
- Use `priority: 1` to ensure this only matches when no other router matches
- `passHostHeader: true` preserves the original Host header for Pangolin
- Traefik will automatically reload when the file is created/modified

#### Step 4: Find Your Service Name

To find the exact service name:

```bash
# Method 1: Check running containers
docker ps | grep gerbil

# Method 2: Check Dokploy project name
# In Dokploy UI, check your project name
# Service name will be: {project-name}-gerbil

# Method 3: Inspect Docker network
docker network inspect dokploy-network | grep -A 5 gerbil
```

#### Step 5: Verify Configuration

1. **Check Traefik logs** to verify the configuration loaded:
   ```bash
   docker logs traefik | grep "Configuration loaded"
   ```

2. **Test with an unknown domain**:
   ```bash
   curl -H "Host: test.example.com" http://your-server
   ```

3. **Check Pangolin dashboard** - Access your Pangolin dashboard and verify it receives forwarded requests

4. **Monitor Traefik logs** for routing:
   ```bash
   docker logs traefik -f
   ```

#### Step 6: Configure Pangolin for Dynamic Routing

1. Access Pangolin dashboard at your assigned domain
2. Configure sites and resources as needed
3. Set up domain routing in Pangolin for the forwarded domains
4. Pangolin's Traefik will handle SSL certificates via Let's Encrypt

### Troubleshooting Catch-All Routing

#### Issue: 404 errors on unknown domains

**Possible causes:**
- Catch-all router priority is not 1 (lowest)
- Service name doesn't match actual deployment
- Traefik hasn't reloaded the configuration

**Solutions:**
1. Verify router priority is `1` (lowest)
2. Check service name matches actual deployment: `docker ps | grep gerbil`
3. Force Traefik reload: `docker exec traefik killall -HUP traefik`
4. Check Traefik logs: `docker logs traefik | grep "pangolin-catchall"`

#### Issue: SSL certificate errors

**Possible causes:**
- Let's Encrypt resolver not configured in catch-all router
- Domain DNS doesn't point to server
- Pangolin's Traefik can't access Let's Encrypt

**Solutions:**
1. Ensure `certResolver: letsencrypt` is in the catch-all router
2. Verify domain DNS points to your server
3. Check Pangolin's Traefik logs for certificate issues
4. Verify Let's Encrypt email is configured

#### Issue: Headers not forwarded correctly

**Possible causes:**
- `trust_proxy: 1` not set in Pangolin config
- Middleware not preserving headers
- Headers being stripped by Dokploy's Traefik

**Solutions:**
1. Verify `trust_proxy: 1` in Pangolin config (already set in template)
2. Check middleware configuration preserves headers
3. Review Traefik logs for header forwarding
4. Test with `curl -v` to see actual headers

#### Issue: Service not found

**Possible causes:**
- Service name incorrect
- Service not running
- Network connectivity issues

**Solutions:**
1. Verify service name: `docker ps | grep gerbil`
2. Check service is running: `docker ps | grep pangolin`
3. Test network connectivity: `docker network inspect dokploy-network`
4. Verify service is on the same network as Traefik

### Alternative: Path-Based Catch-All

If you prefer path-based routing instead of domain-based:

```yaml
http:
  routers:
    pangolin-catchall:
      rule: "PathPrefix(`/`)"
      priority: 1
      service: pangolin-forward
```

This forwards all unmatched paths to Pangolin, regardless of domain.

### Security Considerations

1. **Rate Limiting**: Consider adding rate limiting middleware to catch-all router
2. **Access Control**: Pangolin handles authentication, but consider firewall rules
3. **SSL/TLS**: Ensure proper certificate handling for forwarded domains
4. **Logging**: Monitor catch-all router for abuse or misconfiguration
5. **Resource Limits**: Set appropriate resource limits for Pangolin services

## Limitations and Considerations

### Network Mode Dependency

- Traefik uses `network_mode: service:gerbil` which shares gerbil's network namespace
- This is a Docker feature that should work with Dokploy, but may have limitations
- If issues occur, you may need to adjust the network configuration

### Capabilities Required

- Gerbil requires `NET_ADMIN` and `SYS_MODULE` capabilities for WireGuard
- Verify Dokploy supports `cap_add` in docker-compose
- May require special Dokploy configuration or permissions

### Port Handling

- Traefik listens on ports 80/443 inside gerbil's network namespace
- Dokploy routes to the service externally, so internal ports are fine
- No port conflicts should occur as Dokploy handles external routing

### SSL Certificate Management

- SSL certificates are managed by Traefik/Let's Encrypt inside the deployment
- Not managed by Dokploy's certificate system
- Certificates stored in `pangolin-letsencrypt` volume

### Resource Usage

- Pangolin runs three services (pangolin, gerbil, traefik)
- Higher resource usage than typical single-service templates
- Monitor resource usage and adjust limits as needed

## Configuration Files

### Pangolin Config (`/app/config/config.yml`)

Main configuration file for Pangolin. Key settings:

- `app.dashboard_url` - Dashboard URL (auto-configured from domain)
- `server.secret` - Server secret (auto-generated)
- `server.trust_proxy` - Set to `1` for catch-all routing support
- `gerbil.base_endpoint` - Gerbil endpoint (auto-configured from domain)
- `traefik.cert_resolver` - Let's Encrypt resolver

### Traefik Static Config (`/etc/traefik/traefik_config.yml`)

Traefik entrypoints and certificate resolver configuration:

- Entry points: `:80` (web) and `:443` (websecure)
- Let's Encrypt certificate resolver
- File provider for dynamic configuration
- Logging configuration

### Traefik Dynamic Config (`/etc/traefik/dynamic_config.yml`)

Traefik routing rules:

- HTTP to HTTPS redirect middleware
- Dashboard router (Next.js on port 3002)
- API router (`/api/v1` paths on port 3001)
- WebSocket router
- Services pointing to pangolin containers

## Volumes

The template creates the following volumes:

- `pangolin-config` - Pangolin configuration and database
- `pangolin-traefik` - Traefik configuration files
- `pangolin-letsencrypt` - SSL certificates (Let's Encrypt)
- `pangolin-traefik-logs` - Traefik logs

## Health Checks

- **pangolin**: Healthcheck at `/api/v1/` endpoint
  - Interval: 10s
  - Timeout: 10s
  - Retries: 15
  - Start period: 30s

- **gerbil** and **traefik**: Depend on pangolin healthcheck passing

## Support and Resources

- **GitHub**: https://github.com/fosrl/pangolin
- **Website**: https://pangolin.net
- **Documentation**: https://docs.pangolin.net
- **Dokploy Templates**: https://github.com/dokploy/templates

## Troubleshooting

### Services Not Starting

1. Check logs: `docker logs {service-name}`
2. Verify healthcheck: `docker ps` (check health status)
3. Check resource limits
4. Verify network connectivity

### Dashboard Not Accessible

1. Verify domain is correctly assigned in Dokploy
2. Check Traefik logs for routing issues
3. Verify SSL certificate generation
4. Check firewall rules

### VPN Not Working

1. Verify gerbil service is running
2. Check WireGuard key generation
3. Verify network capabilities (`NET_ADMIN`, `SYS_MODULE`)
4. Check firewall rules for UDP ports (51820, 21820)

### API Errors

1. Check pangolin service logs
2. Verify API endpoint is accessible
3. Check Traefik routing rules
4. Verify CORS configuration if needed

## Contributing

If you encounter issues or have suggestions for improving this template, please:

1. Check existing issues in the repository
2. Create a new issue with detailed information
3. Include logs and configuration details
4. Test in a clean environment if possible

## License

This template follows the same license as the Dokploy Templates repository.
