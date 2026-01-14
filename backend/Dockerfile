# =============================================================================
# Turbocat Backend Dockerfile
# =============================================================================
#
# Multi-stage build for production deployment with Claude Agent SDK support.
# Works from monorepo root when deployed via Railway
#
# Features:
# - Bundles .claude/ directory with skills for SDK filesystem requirements
# - Optimized for container size with multi-stage build
# - Supports both persistent and ephemeral sandbox modes
# - Includes health checks and graceful shutdown handling
#
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files from backend directory
COPY backend/package.json backend/pnpm-lock.yaml* ./
COPY backend/prisma ./prisma/

# Install dependencies (including devDependencies for build)
RUN if [ ! -f pnpm-lock.yaml ]; then pnpm install; else pnpm install --frozen-lockfile; fi

# Copy source code from backend directory
COPY backend/ ./

# Generate Prisma client and build TypeScript
RUN pnpm run build

# =============================================================================
# CRITICAL: Bundle .claude/ directory for Agent SDK filesystem requirements
# =============================================================================
RUN mkdir -p ./.claude/skills

# -----------------------------------------------------------------------------
# Stage 2: Production Runner
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 turbocat

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Copy built artifacts and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# =============================================================================
# SDK Filesystem: Bundle .claude/ directory with skills
# =============================================================================
COPY --from=builder /app/.claude ./.claude

# =============================================================================
# SDK Filesystem: Create sandbox storage directories
# =============================================================================
RUN mkdir -p /app/.sandboxes/persistent && \
    mkdir -p /app/.sandboxes/ephemeral && \
    mkdir -p /app/logs

# Set ownership of all directories
RUN chown -R turbocat:nodejs /app

# Switch to non-root user
USER turbocat

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health/live || exit 1

# Start the application
CMD ["node", "dist/server.js"]
