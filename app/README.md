# Dokploy Templates App

This is a Vite-based React application that provides a web interface for browsing and managing Dokploy templates.

## Development

To run the project locally:

```bash
cd app
pnpm install
pnpm run dev
```

Then visit http://localhost:5173/

## Docker Deployment

### Building and Running with Docker

You can deploy this app using Docker. The Dockerfile is configured to work with the `app` directory as the build context, accessing parent directory files during build.

**From the app directory:**

```bash
cd app
# Build the image
docker build -t dokploy-templates-app .

# Run the container
docker run -d -p 8080:80 dokploy-templates-app
```

**From the repository root (alternative):**

```bash
# Build the image
docker build -f app/Dockerfile -t dokploy-templates-app app

# Run the container
docker run -d -p 8080:80 dokploy-templates-app
```

The app will be available at http://localhost:8080

### Deploying to Dokploy

1. Create a new **Dockerfile** service in Dokploy
2. Use this repository URL
3. Set the **Dockerfile path** to: `app/Dockerfile`
4. Set the **Build context** to: `app` (app directory)
5. Configure the port mapping: `80` (container) → your desired external port
6. Deploy!

**Note**: The Dockerfile uses `COPY ../` to access blueprints and meta.json from the parent directory during build.

## Building

To build the app for production:

```bash
cd app
pnpm install
pnpm run build
```

The built files will be in the `dist` directory.

## Architecture

- **Frontend**: React + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Production Server**: Nginx (in Docker)
- **Data**: Loads templates from `blueprints/` and `meta.json` at build time
