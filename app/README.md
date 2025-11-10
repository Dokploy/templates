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

You can deploy this app using Docker. **Important**: The Dockerfile must be built with the **repository root** as the build context to access both the app files and the blueprints/meta.json.

**From the repository root:**

```bash
# Build the image
docker build -f app/Dockerfile -t dokploy-templates-app .

# Run the container
docker run -d -p 8080:80 dokploy-templates-app
```

The app will be available at http://localhost:8080

### Deploying to Dokploy

1. Create a new **Dockerfile** service in Dokploy
2. Use this repository URL
3. Set the **Dockerfile path** to: `app/Dockerfile`
4. Set the **Build context** to: `.` (repository root - this is critical!)
5. Configure the port mapping: `80` (container) → your desired external port
6. Deploy!

**Important Note**: The build context MUST be set to `.` (repository root), not `app`, because the Dockerfile needs to access both the app directory and the blueprints/meta.json files at the repository root level.

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
