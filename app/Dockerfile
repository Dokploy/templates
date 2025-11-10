# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /build

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml ./

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies (without frozen-lockfile to handle lockfile sync issues)
RUN pnpm install --no-frozen-lockfile

# Copy app source code
COPY . ./

# Copy blueprints and meta.json from parent directory
# When build context is app/, use .. to access parent
COPY ../blueprints /blueprints
COPY ../meta.json /meta.json

# Update vite config to point to the new absolute paths
RUN sed -i "s|src: '../blueprints/\*'|src: '/blueprints/*'|g" vite.config.ts && \
    sed -i "s|src: '../meta.json'|src: '/meta.json'|g" vite.config.ts

# Build the app
RUN pnpm run build

# Production stage
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /build/dist /usr/share/nginx/html

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
