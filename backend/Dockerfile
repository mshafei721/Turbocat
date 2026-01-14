# =============================================================================
# Turbocat Backend Dockerfile
# =============================================================================
#
# Multi-stage build for production deployment with Claude Agent SDK support.
#
# Features:
# - Bundles .claude/ directory with skills for SDK filesystem requirements
# - Optimized for container size with multi-stage build
# - Supports both persistent and ephemeral sandbox modes
# - Includes health checks and graceful shutdown handling
#
# Build:
#   docker build -t turbocat-backend .
#
# Run:
#   docker run -p 3001:3001 \
#     -e ANTHROPIC_API_KEY=your-key \
#     -e DATABASE_URL=your-db-url \
#     -e REDIS_URL=redis://redis:6379 \
#     turbocat-backend
#
# For persistent sandboxes, mount a volume:
#   docker run -p 3001:3001 \
#     -v turbocat-sandboxes:/app/.sandboxes \
#     -e ANTHROPIC_API_KEY=your-key \
#     turbocat-backend
#
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# =============================================================================
# CRITICAL: Bundle .claude/ directory for Agent SDK filesystem requirements
# =============================================================================
# The Claude Agent SDK expects:
# - .claude/skills/ directory for skill definitions
# - Working directory with CLAUDE.md for project configuration
# - Session storage directory for conversation persistence
#
# Note: .claude/ may be in parent directory in monorepo setup
# Copy from both locations to ensure skills are available
COPY .claude/ ./.claude/ 2>/dev/null || true

# Generate Prisma client and build TypeScript
RUN npm run build

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
# These directories support the hybrid sandbox approach:
# - .sandboxes/persistent: For project chats that need resumption
# - .sandboxes/ephemeral: For one-off task/workflow executions
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
CMD ["npm", "run", "start:prod"]
