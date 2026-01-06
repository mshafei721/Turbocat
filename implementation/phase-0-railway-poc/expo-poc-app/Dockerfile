# Railway.app Optimized Dockerfile for Expo Metro Bundler
# Phase 0 POC - Minimal configuration for testing

FROM node:22-alpine

# Install necessary tools for Expo
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Expose Metro bundler port (Railway will assign PORT dynamically)
EXPOSE 8081

# Environment variables for Expo
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0

# Health check for Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT:-8081}/status', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start Expo with tunnel mode for QR code accessibility
CMD ["npm", "run", "railway"]
