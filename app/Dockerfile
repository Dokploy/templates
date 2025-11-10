# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /workspace

# Copy entire repository context (should be run from repository root)
COPY . .

# Navigate to app directory
WORKDIR /workspace/app

# Verify blueprints directory exists (debug)
RUN echo "Checking for blueprints directory..." && \
    ls -la /workspace/ | grep blueprints || echo "ERROR: blueprints not found at /workspace/" && \
    ls -la /workspace/blueprints/ | head -5 || echo "ERROR: Cannot list blueprints directory"

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies (without frozen-lockfile to handle lockfile sync issues)
RUN pnpm install --no-frozen-lockfile

# Build the app
RUN pnpm run build

# Production stage
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /workspace/app/dist /usr/share/nginx/html

# Copy nginx configuration for SPA
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
