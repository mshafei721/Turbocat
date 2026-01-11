# Backend Deployment Checklist

## Executive Summary

The backend is **NOT READY** for Railway deployment. Critical configuration files are missing.

## 1. Current State

### What EXISTS

| Component | Status | Details |
|-----------|--------|---------|
| Health Endpoints | OK | `/health`, `/health/live`, `/health/ready` |
| CORS Configuration | OK | Supports FRONTEND_URL + ADDITIONAL_CORS_ORIGINS |
| Environment Docs | OK | Comprehensive .env.example |
| Trust Proxy | OK | `app.set('trust proxy', 1)` configured |
| API Versioning | OK | `/api/v1/*` routes |
| Swagger Docs | OK | `/api/v1/docs` available |
| TypeScript Build | OK | `tsc` outputs to `dist/` |
| Start Command | OK | `node dist/server.js` |

### What is MISSING

| Component | Status | Impact |
|-----------|--------|--------|
| Dockerfile | MISSING | Railway cannot build container |
| railway.json | MISSING | No Railway-specific config |
| Procfile | MISSING | No process manager config |
| Production .env | MISSING | No .env.production.example |
| Build Check | UNKNOWN | Build not verified |

## 2. Required Environment Variables

Based on `.env.example`, these are required for production:

### CRITICAL (Must Configure)

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
SUPABASE_URL="https://..."
SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Security
JWT_ACCESS_SECRET="..."
JWT_REFRESH_SECRET="..."
ENCRYPTION_KEY="..."

# AI
ANTHROPIC_API_KEY="sk-ant-..."

# CORS
FRONTEND_URL="https://your-frontend.vercel.app"
```

### RECOMMENDED

```env
# Redis (for sessions/queues)
REDIS_URL="redis://..."

# Application
NODE_ENV="production"
PORT=3001
HOST="0.0.0.0"
```

## 3. Health Check Endpoints

All ready for Railway health checks:

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `GET /health` | Full health check with DB status | 200 or 503 |
| `GET /health/live` | Liveness probe (is app running?) | 200 always |
| `GET /health/ready` | Readiness probe (is DB connected?) | 200 or 503 |

Railway should use:
- **Health Check Path**: `/health/ready`
- **Health Check Timeout**: 30s
- **Health Check Interval**: 30s

## 4. Required Files to Create

### Dockerfile

```dockerfile
# Multi-stage build for production
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production=false
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

USER expressjs
EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

CMD ["npm", "run", "start:prod"]
```

### railway.json

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/health/ready",
    "healthcheckTimeout": 30
  }
}
```

### Procfile (alternative to Dockerfile)

```
web: npm run start:prod
```

## 5. Pre-Deployment Checklist

### Build Verification

- [ ] `npm run build` succeeds
- [ ] `npm run typecheck` succeeds
- [ ] `npm run lint:fix` succeeds (fix CRLF issues)
- [ ] `npm test` passes (or known failures documented)

### Database

- [ ] Prisma schema is validated (`npm run db:validate`)
- [ ] Migrations are up to date
- [ ] Test connection to production DB

### Security

- [ ] All secrets in environment variables (never hardcoded)
- [ ] JWT secrets are unique per environment
- [ ] Encryption key is set
- [ ] CORS origins are configured

### Monitoring

- [ ] Health endpoints return correct status
- [ ] Logging is structured (JSON)
- [ ] Error handling returns proper status codes

## 6. Railway Deployment Steps

1. Create Railway project
2. Add PostgreSQL service (or use existing Supabase)
3. Add Redis service (optional but recommended)
4. Connect GitHub repository
5. Set root directory to `backend/`
6. Configure environment variables
7. Deploy

## 7. Issues to Fix Before Deploy

| Priority | Issue | Fix |
|----------|-------|-----|
| P0 | No Dockerfile | Create Dockerfile as shown above |
| P0 | No railway.json | Create railway.json as shown above |
| P0 | CRLF line endings | Run `npm run lint:fix` |
| P1 | Failing tests | Fix or document known failures |
| P1 | No production .env example | Create .env.production.example |

## 8. Rollback Strategy

If deployment fails:
1. Railway automatically rolls back to previous version
2. Manual rollback: `railway rollback`
3. Database: Use Prisma migrations down (`npx prisma migrate reset`)

## 9. Summary

| Requirement | Status |
|-------------|--------|
| Health Endpoints | READY |
| Environment Config | READY |
| CORS | READY |
| API Documentation | READY |
| Dockerfile | NOT READY |
| Railway Config | NOT READY |
| Build Verification | PENDING |
| Lint Clean | NOT READY (CRLF) |
