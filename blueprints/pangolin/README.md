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
   - Handles HTTP/HTTPS routing on ports 80/443
   - Manages SSL certificates via Let's Encrypt
   - Routes to pangolin services internally
   - Communicates with gerbil and pangolin via Docker network

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
4. **SSL Handling**: See "SSL/TLS Certificate Handling" section below for important details

### SSL/TLS Certificate Handling in Proxy Chains

**Important**: SSL certificate handling depends on how Dokploy's Traefik is configured.

#### Scenario: `examplessltest.example.com` → Dokploy → Pangolin → Service

**Current Setup (HTTP Router - Recommended):**

When using an HTTP router in Dokploy's catch-all configuration (as shown above):

1. **Dokploy's Traefik terminates SSL** - It decrypts HTTPS requests for `examplessltest.example.com`
2. **Forwards HTTP to Pangolin** - Pangolin's Traefik receives plain HTTP (not HTTPS)
3. **Pangolin forwards to service** - The final service receives HTTP

**SSL Status:**
- ✅ **SSL works at Dokploy level** - Client to Dokploy is encrypted
- ✅ **Dokploy generates certificate** - Let's Encrypt certificate for `examplessltest.example.com` is managed by Dokploy
- ⚠️ **Pangolin sees HTTP** - Pangolin's Traefik receives HTTP, not HTTPS
- ✅ **Service receives HTTP** - Final service receives HTTP (can be HTTPS if service requires it)

**This setup works and is the simplest approach.** SSL is handled by Dokploy, and Pangolin acts as an HTTP proxy.

#### Alternative: TCP Passthrough (Advanced)

If you need Pangolin's Traefik to handle SSL termination instead:

1. **Use TCP router in Dokploy** with `passthrough: true`
2. **SSL passes through** to Pangolin's Traefik
3. **Pangolin terminates SSL** and can generate its own certificates

**Configuration for TCP Passthrough:**

```yaml
tcp:
  routers:
    pangolin-catchall-tcp:
      rule: "HostSNI(`*`)"  # Matches all domains
      service: pangolin-forward-tcp
      entryPoints:
        - websecure
      tls:
        passthrough: true  # Pass SSL through to Pangolin

  services:
    pangolin-forward-tcp:
      loadBalancer:
        servers:
          - address: "pangolin-gerbil:443"  # Forward to HTTPS port
```

**Important Notes for TCP Passthrough:**
- More complex configuration
- Pangolin's Traefik must handle SSL termination
- Pangolin can generate certificates via Let's Encrypt
- Requires Pangolin's Traefik to be accessible on port 443
- Let's Encrypt HTTP-01 challenge must be able to reach Pangolin on port 80

#### Recommendation

**For most use cases, use the HTTP router approach (current setup):**
- Simpler configuration
- Dokploy handles SSL certificates
- Works reliably with catch-all routing
- Pangolin receives HTTP and forwards to services

**Use TCP passthrough only if:**
- You need Pangolin to manage SSL certificates
- You want end-to-end SSL visibility in Pangolin
- You have specific requirements for certificate management

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

### Network Configuration

- All services communicate via Docker's default bridge network
- Traefik listens on ports 80/443 internally
- Dokploy routes external traffic to traefik service
- Services can communicate using service names (pangolin, gerbil, traefik)

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

## Testing Your Pull Request

Before your PR is merged, you should test the template using the PR preview system. Here's how:

### Step 1: Create and Push Your PR

1. **Create your PR** with the Pangolin template changes
2. **Wait for CI/CD** - GitHub Actions will automatically:
   - Validate `meta.json` structure
   - Build a preview deployment
   - Deploy to Cloudflare Pages
3. **Find the preview URL** - Check the PR description or GitHub Actions logs for the preview deployment link

### Step 2: Access the Preview

1. **Open the preview URL** from your PR (usually in PR description or GitHub Actions)
2. **Search for "pangolin"** in the template search
3. **Click on the Pangolin template card** to view details

### Step 3: Import Template to Dokploy

1. **Copy the Base64 configuration**:
   - In the preview, scroll down on the Pangolin template card
   - Click the "Copy" button next to "Base64 Configuration"
   - This copies the complete template configuration

2. **Import into your Dokploy instance**:
   - Go to your Dokploy instance
   - Create a new **Compose Service**
   - Go to **Advanced** section
   - Scroll down to **Import** section
   - Paste the Base64 value
   - Click **Import**

3. **Verify import**:
   - You should see a modal with all details:
     - Compose File (docker-compose.yml)
     - Environment Variables
     - Mounts (config files)
     - Domains configuration
   - Review the configuration to ensure everything is correct

### Step 4: Deploy and Test

1. **Deploy the service**:
   - Click **Deploy** button
   - Wait for deployment to complete
   - Monitor service status in Dokploy

2. **Verify services start**:
   - Check that all three services (pangolin, gerbil, traefik) are running
   - Verify healthcheck status
   - Check service logs for any errors

3. **Test domain access**:
   - Assign a domain to the service in Dokploy
   - Wait for SSL certificate generation
   - Access the domain via HTTPS
   - Verify dashboard loads

4. **Test functionality**:
   - Complete initial setup in Pangolin dashboard
   - Test API endpoints
   - Verify SSL certificate is valid
   - Test basic functionality

### Step 5: Test Edge Cases

1. **Restart services**:
   - Restart the deployment
   - Verify services come back up correctly
   - Check data persistence (volumes)

2. **Test environment variables**:
   - Verify all variables are set correctly
   - Check that secrets are generated properly

3. **Test volume persistence**:
   - Verify config files persist
   - Check SSL certificates persist
   - Verify database/data persistence

### Step 6: Local Testing (Optional)

You can also test locally before pushing:

```bash
# Install dependencies
cd app
pnpm install

# Run development server
pnpm run dev

# Visit http://localhost:5173/
# Search for your template and test the preview locally
```

### What to Check

- ✅ Template appears in preview search
- ✅ Base64 import works correctly
- ✅ All services deploy successfully
- ✅ Healthchecks pass
- ✅ Domain is accessible
- ✅ SSL certificate generates
- ✅ Dashboard loads
- ✅ No errors in logs
- ✅ Configuration files are mounted correctly
- ✅ Environment variables are set

### Common Issues

**Preview not building:**
- Check GitHub Actions logs
- Verify `meta.json` is valid (run `node dedupe-and-sort-meta.js`)
- Check for syntax errors in YAML/TOML files

**Import fails:**
- Verify Base64 is copied completely
- Check for special characters in config
- Ensure template structure is correct

**Deployment fails:**
- Check service logs
- Verify Docker Compose syntax
- Check for missing dependencies
- Verify network capabilities (NET_ADMIN, SYS_MODULE)

**Services not starting:**
- Check healthcheck configuration
- Verify image tags are correct
- Check resource limits
- Review service dependencies

## Testing Your Deployment

### Step 1: Verify Services Are Running

**Check all services are up:**
```bash
# In Dokploy UI: Check service status
# Or via command line:
docker ps | grep pangolin
docker ps | grep gerbil
docker ps | grep traefik
```

**Expected output:** All three services should show as "Up" with healthy status.

**Check service health:**
```bash
# Check pangolin healthcheck
docker exec <pangolin-container> curl -f http://localhost:3001/api/v1/

# Check service logs
docker logs <pangolin-container>
docker logs <gerbil-container>
docker logs <traefik-container>
```

### Step 2: Verify Domain Accessibility

**Test HTTP access:**
```bash
# Should redirect to HTTPS
curl -I http://your-pangolin-domain.com

# Expected: 301 or 302 redirect to HTTPS
```

**Test HTTPS access:**
```bash
# Test HTTPS connection
curl -I https://your-pangolin-domain.com

# Expected: 200 OK or dashboard content
```

**Test with browser:**
1. Navigate to `https://your-pangolin-domain.com`
2. Check browser shows valid SSL certificate
3. Verify dashboard loads correctly

### Step 3: Verify SSL Certificate

**Check certificate details:**
```bash
# View certificate information
openssl s_client -connect your-pangolin-domain.com:443 -servername your-pangolin-domain.com < /dev/null 2>/dev/null | openssl x509 -noout -text

# Or use online tools:
# - https://www.ssllabs.com/ssltest/
# - https://crt.sh/
```

**Verify Let's Encrypt certificate:**
```bash
# Check certificate in Traefik volume
docker exec <traefik-container> ls -la /letsencrypt/

# Should see acme.json file
```

**Expected:**
- Certificate issued by "Let's Encrypt"
- Valid expiration date (90 days from issue)
- Certificate matches your domain

### Step 4: Test Pangolin Dashboard

**Access dashboard:**
1. Navigate to `https://your-pangolin-domain.com`
2. Complete initial setup (if first time)
3. Verify you can log in

**Test API endpoints:**
```bash
# Test API health endpoint
curl https://your-pangolin-domain.com/api/v1/

# Test with authentication (after login)
curl -H "Authorization: Bearer <token>" https://your-pangolin-domain.com/api/v1/
```

**Expected:**
- Dashboard loads without errors
- API responds with JSON
- No console errors in browser DevTools

### Step 5: Test Catch-All Routing (If Configured)

**Test unknown domain:**
```bash
# Test with a domain not configured in Dokploy
curl -H "Host: test-unknown.example.com" http://your-server-ip

# Or test via DNS (if configured)
curl https://test-unknown.example.com
```

**Verify routing:**
1. Check Dokploy Traefik logs for catch-all match
2. Check Pangolin receives the request
3. Verify Pangolin can route to configured resources

**Expected:**
- Request reaches Pangolin
- Pangolin can handle routing
- No 404 errors from Dokploy

### Step 6: Test VPN Functionality (WireGuard)

**Verify gerbil service:**
```bash
# Check gerbil is running
docker ps | grep gerbil

# Check WireGuard keys generated
docker exec <gerbil-container> ls -la /var/config/

# Should see key file
```

**Test WireGuard connection:**
1. In Pangolin dashboard, create a WireGuard site
2. Download WireGuard configuration
3. Import into WireGuard client
4. Connect and verify connectivity

**Expected:**
- Gerbil service running
- Keys generated successfully
- Can connect via WireGuard client

### Step 7: Test Resource Proxying

**Create a test resource in Pangolin:**
1. Access Pangolin dashboard
2. Create a new resource (local, WireGuard, or other)
3. Configure domain routing
4. Test access to the resource

**Test proxying:**
```bash
# Test access to proxied resource
curl https://your-resource-domain.com

# Should reach the target service
```

**Expected:**
- Resource accessible via configured domain
- SSL certificate valid (if applicable)
- Content loads correctly

### Step 8: Monitor Logs

**Watch service logs:**
```bash
# Follow all service logs
docker logs -f <pangolin-container>
docker logs -f <gerbil-container>
docker logs -f <traefik-container>

# Or via Dokploy UI: View logs for each service
```

**Check for errors:**
- Look for error messages
- Check for connection failures
- Verify certificate generation logs
- Monitor healthcheck status

### Step 9: Performance Testing

**Test response times:**
```bash
# Measure response time
time curl -o /dev/null -s -w "%{time_total}\n" https://your-pangolin-domain.com

# Test API response time
time curl -o /dev/null -s https://your-pangolin-domain.com/api/v1/
```

**Expected:**
- Dashboard loads in < 2 seconds
- API responds in < 500ms
- No timeout errors

### Step 10: Security Testing

**Verify SSL/TLS:**
```bash
# Test SSL configuration
nmap --script ssl-enum-ciphers -p 443 your-pangolin-domain.com

# Check for vulnerabilities
testssl.sh your-pangolin-domain.com
```

**Verify headers:**
```bash
# Check security headers
curl -I https://your-pangolin-domain.com

# Should see appropriate headers
```

**Expected:**
- Strong cipher suites
- No known vulnerabilities
- Appropriate security headers

### Quick Test Checklist

- [ ] All three services (pangolin, gerbil, traefik) are running
- [ ] Services show healthy status
- [ ] Domain is accessible via HTTPS
- [ ] SSL certificate is valid and from Let's Encrypt
- [ ] Dashboard loads without errors
- [ ] Can log in to dashboard
- [ ] API endpoints respond correctly
- [ ] Catch-all routing works (if configured)
- [ ] WireGuard VPN can connect (if configured)
- [ ] Resources can be proxied
- [ ] No errors in service logs
- [ ] Performance is acceptable

## Troubleshooting

### Services Not Starting

1. Check logs: `docker logs {service-name}`
2. Verify healthcheck: `docker ps` (check health status)
3. Check resource limits
4. Verify network connectivity

**Common issues:**
- Healthcheck failing: Check if pangolin API is accessible
- Port conflicts: Verify no other services use same ports
- Resource limits: Check if containers have enough memory/CPU

### Dashboard Not Accessible

1. Verify domain is correctly assigned in Dokploy
2. Check Traefik logs for routing issues
3. Verify SSL certificate generation
4. Check firewall rules

**Common issues:**
- DNS not pointing to server: Verify DNS A record
- Certificate not generated: Check Let's Encrypt logs
- Routing misconfiguration: Verify Traefik dynamic config

### VPN Not Working

1. Verify gerbil service is running
2. Check WireGuard key generation
3. Verify network capabilities (`NET_ADMIN`, `SYS_MODULE`)
4. Check firewall rules for UDP ports (51820, 21820)

**Common issues:**
- Capabilities not available: Check Docker/container permissions
- Firewall blocking UDP: Open ports 51820 and 21820
- Key generation failed: Check gerbil logs

### API Errors

1. Check pangolin service logs
2. Verify API endpoint is accessible
3. Check Traefik routing rules
4. Verify CORS configuration if needed

**Common issues:**
- API not responding: Check pangolin healthcheck
- Routing misconfiguration: Verify Traefik dynamic config
- CORS errors: Check browser console for details

## Contributing

If you encounter issues or have suggestions for improving this template, please:

1. Check existing issues in the repository
2. Create a new issue with detailed information
3. Include logs and configuration details
4. Test in a clean environment if possible

## License

This template follows the same license as the Dokploy Templates repository.
