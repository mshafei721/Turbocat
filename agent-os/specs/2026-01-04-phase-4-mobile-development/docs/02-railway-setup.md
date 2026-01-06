# Railway.app Setup Guide

Railway.app provides the container infrastructure that runs your mobile development environment. This guide explains how Railway works with Turbocat and how administrators can configure it.

## What is Railway?

Railway is a cloud platform that runs Docker containers. For Turbocat mobile development:

- Each mobile project runs in its own container
- The container includes Node.js, Expo CLI, and Metro bundler
- Railway provides a public URL so your phone can connect

## How It Works

```
+----------------+      +-------------------+      +-------------+
|   Turbocat     | ---> |  Railway Container | ---> |  Your Phone |
|   (Frontend)   |      |  (Metro Bundler)   |      |  (Expo Go)  |
+----------------+      +-------------------+      +-------------+
        |                        |
        |  Creates container     |  Runs your app
        |  Sends code            |  Hot reloading
        +------------------------+
```

### Container Lifecycle

1. **Creation**: When you create a mobile task, Turbocat creates a Railway container
2. **Running**: The container runs Metro bundler and serves your app
3. **Idle Timeout**: After 30 minutes of inactivity, the container stops
4. **Cleanup**: Stopped containers are automatically cleaned up

## For Users

### You Do Not Need to Configure Railway

As a user, Railway is automatically managed for you. Simply:

1. Select "Mobile" platform
2. Describe your app
3. Wait for the QR code

The infrastructure is handled behind the scenes.

### Understanding Container Status

In the mobile preview area, you will see a status indicator:

| Status | Meaning |
|--------|---------|
| Starting | Container is being set up (1-2 minutes) |
| Running | Your app is ready, scan the QR code |
| Stopped | Container was idle, will restart when needed |
| Error | Something went wrong, check the logs |

### Extending Your Session

If you need to work for more than 30 minutes:

- Keep interacting with Turbocat (send messages, make changes)
- The idle timer resets with each interaction
- If your container stops, send a message to restart it

## For Administrators

This section is for system administrators configuring Railway for a Turbocat deployment.

### Environment Variables

Set these environment variables in your Turbocat deployment:

```bash
# Railway API Configuration
RAILWAY_API_TOKEN=your-railway-api-token
RAILWAY_PROJECT_ID=your-project-id

# Optional: Custom Docker image
RAILWAY_DOCKER_IMAGE=turbocat/expo-metro:latest

# Cost Controls
RAILWAY_MAX_CONTAINERS=50
RAILWAY_IDLE_TIMEOUT_MINUTES=30
RAILWAY_MONTHLY_BUDGET_ALERT=200
```

### Getting Your Railway API Token

1. Go to [railway.app](https://railway.app) and sign in
2. Click your profile picture in the top right
3. Go to "Account Settings"
4. Scroll to "API Tokens"
5. Click "Create Token"
6. Give it a name like "Turbocat Production"
7. Copy the token immediately (you will not see it again)

### Creating a Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Empty Project"
4. Note the Project ID from the URL

### Docker Image Configuration

The Turbocat Expo Docker image contains:

```dockerfile
FROM node:20-alpine

# Install Expo CLI and dependencies
RUN npm install -g expo-cli @expo/ngrok

# Configure environment
ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

# Expose ports
EXPOSE 19000 19001 19002 8081

WORKDIR /app

CMD ["npx", "expo", "start", "--tunnel"]
```

### Resource Limits

Recommended container resources:

| Resource | Value | Reason |
|----------|-------|--------|
| Memory | 2GB | Metro bundler needs RAM for bundling |
| CPU | 1 vCPU | Sufficient for development |
| Disk | 10GB | Project files and node_modules |

### Network Configuration

Railway automatically provides:
- HTTPS endpoints for each container
- WebSocket support for hot reloading
- Automatic port exposure

No additional network configuration is needed.

### Cost Optimization

Railway charges based on usage. To optimize costs:

1. **Idle Timeout**: Containers stop after 30 minutes of inactivity
2. **Max Containers**: Limit concurrent containers to control costs
3. **Budget Alerts**: Set alerts at 50%, 75%, and 100% of budget
4. **Cleanup Job**: Automatic cleanup of orphaned containers

### Monitoring Commands

Check container status:

```bash
# List active containers
curl -H "Authorization: Bearer $RAILWAY_API_TOKEN" \
  https://backboard.railway.app/graphql/v2 \
  -d '{"query": "{ project(id: \"$PROJECT_ID\") { services { id name } } }"}'
```

### Security Considerations

1. **API Token Security**: Store the Railway API token in a secure secret manager
2. **Network Isolation**: Each container is isolated
3. **Non-Root User**: Containers run as non-root for security
4. **Code Sandboxing**: User code runs in the container, not on the main server

### Fallback Configuration

If Railway is unavailable, you can configure a fallback:

```bash
# Fallback to self-hosted Docker
FALLBACK_DOCKER_HOST=tcp://docker-host:2376
FALLBACK_DOCKER_TLS_VERIFY=1
FALLBACK_DOCKER_CERT_PATH=/path/to/certs
```

## Troubleshooting Railway Issues

### Container Fails to Start

1. Check Railway dashboard for error logs
2. Verify API token is valid
3. Check if you have reached the container limit
4. Verify the Docker image exists

### Slow Container Start

Container startup takes 1-2 minutes. If longer:

1. Check Railway status page
2. Container may be pulling the Docker image
3. Try again in a few minutes

### Connection Issues

If Expo Go cannot connect:

1. Container may have stopped - trigger a restart
2. Check if the URL is accessible in a browser
3. Verify WebSocket support is enabled

### High Costs

If Railway costs are higher than expected:

1. Check for orphaned containers in the dashboard
2. Reduce the idle timeout
3. Lower the max containers limit
4. Run the cleanup job manually

---

**For more help**: Contact Turbocat support or check the Railway documentation at [docs.railway.app](https://docs.railway.app)
