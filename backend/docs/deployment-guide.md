# Deployment Guide

This guide covers deploying the Turbocat backend to production environments. We provide instructions for Railway (recommended), Render, and general deployment principles.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Railway Deployment](#railway-deployment-recommended)
3. [Render Deployment](#render-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Deployment Checklist](#deployment-checklist)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- [ ] Supabase project created with database URL
- [ ] Redis instance (Upstash recommended for serverless)
- [ ] Generated production secrets (JWT, encryption keys)
- [ ] All tests passing locally
- [ ] Environment variables documented

### Generate Production Secrets

```bash
# Generate JWT secrets (64 bytes each)
node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Generate encryption key (32 bytes)
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate session secret (32 bytes)
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

---

## Railway Deployment (Recommended)

[Railway](https://railway.app) offers simple deployment with generous free tier ($5/month credit).

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (recommended for automatic deployments)
3. Create a new project

### Step 2: Connect Repository

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Select your Turbocat repository
4. Choose the `backend` directory as root

### Step 3: Configure Build Settings

In Railway dashboard, go to your service settings:

**Build Command:**
```
npm ci && npm run db:generate && npm run build
```

**Start Command:**
```
npm run start:prod
```

**Root Directory:**
```
backend
```

### Step 4: Add Environment Variables

In Railway dashboard, go to **Variables** tab and add:

```
NODE_ENV=production
PORT=3001

# Database (from Supabase)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Supabase
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# JWT (generate new secrets!)
JWT_ACCESS_SECRET=<generated-64-byte-hex>
JWT_REFRESH_SECRET=<generated-64-byte-hex>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Encryption
ENCRYPTION_KEY=<generated-32-byte-hex>

# Redis (use Railway Redis or Upstash)
REDIS_URL=redis://...

# CORS
FRONTEND_URL=https://your-frontend-domain.com

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Security
TRUST_PROXY=true
SECURE_COOKIES=true
```

### Step 5: Add Railway Redis (Optional)

1. In your project, click "New"
2. Select "Database" > "Redis"
3. Railway will automatically add `REDIS_URL` to your variables

### Step 6: Deploy

Railway automatically deploys on push to main branch. For manual deploy:
1. Go to your service
2. Click "Deploy" button

### Step 7: Run Migrations

After first deployment, run migrations via Railway CLI:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Connect to project
railway link

# Run migrations
railway run npx prisma migrate deploy
```

Or use the Railway shell:
1. Go to your service
2. Click "Shell" tab
3. Run: `npx prisma migrate deploy`

### Railway Domain

Railway provides a free `.railway.app` domain. For custom domain:
1. Go to Settings > Domains
2. Add your custom domain
3. Configure DNS as instructed

---

## Render Deployment

[Render](https://render.com) is another excellent option with a free tier.

### Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Create Web Service

1. Click "New" > "Web Service"
2. Connect your repository
3. Configure service:

**Name:** `turbocat-backend`

**Root Directory:** `backend`

**Runtime:** Node

**Build Command:**
```
npm ci && npm run db:generate && npm run build
```

**Start Command:**
```
npm run start:prod
```

### Step 3: Environment Variables

Add all environment variables in the "Environment" section (same as Railway).

### Step 4: Configure Auto-Deploy

1. Go to Settings > Auto-Deploy
2. Enable "Auto-Deploy" for main branch
3. Optionally enable for PRs (creates preview environments)

### Step 5: Database Migrations

After deployment, run migrations:

```bash
# Using Render Shell
npm run db:migrate:prod
```

Or configure a pre-deploy command in `render.yaml`:

```yaml
services:
  - type: web
    name: turbocat-backend
    env: node
    rootDir: backend
    buildCommand: npm ci && npm run db:generate && npm run build
    startCommand: npm run start:prod
    preDeployCommand: npx prisma migrate deploy
```

---

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3001` |
| `DATABASE_URL` | PostgreSQL connection (pooled) | `postgresql://...` |
| `DIRECT_URL` | PostgreSQL direct connection | `postgresql://...` |
| `REDIS_URL` | Redis connection | `redis://...` |
| `JWT_ACCESS_SECRET` | JWT signing secret | `<64-byte-hex>` |
| `JWT_REFRESH_SECRET` | Refresh token secret | `<64-byte-hex>` |
| `ENCRYPTION_KEY` | Data encryption key | `<32-byte-hex>` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://...` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | Logging level | `info` |
| `LOG_FORMAT` | Log format | `json` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |
| `TRUST_PROXY` | Trust proxy headers | `true` |
| `SENTRY_DSN` | Sentry error tracking | - |

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests pass (`npm test`)
- [ ] TypeScript compiles (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Environment variables prepared
- [ ] Database migrations ready
- [ ] Backup of current production (if updating)

### Deployment

- [ ] Deploy to staging first (if available)
- [ ] Run database migrations
- [ ] Verify deployment logs
- [ ] Check build completion

### Post-Deployment

- [ ] Health check passes (`/health`)
- [ ] Liveness probe passes (`/health/live`)
- [ ] Readiness probe passes (`/health/ready`)
- [ ] Authentication works (test login)
- [ ] API endpoints respond correctly
- [ ] Database connections working
- [ ] Redis connections working
- [ ] Logs are being captured
- [ ] Error tracking active (Sentry)

### Rollback Criteria

Rollback immediately if:
- Health check fails after 5 minutes
- Error rate exceeds 10%
- Response time exceeds 2 seconds (p95)
- Critical functionality broken

---

## Post-Deployment Verification

### Automated Health Check

```bash
# Using provided script
./scripts/health-check.sh --url https://your-api-domain.com

# Or manually
curl https://your-api-domain.com/health
```

### Expected Response

```json
{
  "status": "healthy",
  "timestamp": "2026-01-07T10:30:00.000Z",
  "uptime": 120,
  "version": "1.0.0",
  "services": {
    "database": { "status": "healthy" },
    "redis": { "status": "healthy" }
  }
}
```

### Manual Verification Steps

1. **Test Authentication**
   ```bash
   # Register a test user
   curl -X POST https://api.your-domain.com/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!","fullName":"Test User"}'
   ```

2. **Test Protected Endpoints**
   ```bash
   # Login and get token
   TOKEN=$(curl -X POST https://api.your-domain.com/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!"}' \
     | jq -r '.data.accessToken')

   # Access protected endpoint
   curl https://api.your-domain.com/api/v1/agents \
     -H "Authorization: Bearer $TOKEN"
   ```

3. **Check Logs**
   - Railway: `railway logs`
   - Render: Dashboard > Logs tab
   - Verify no errors in startup

---

## Troubleshooting

### Common Issues

#### 1. Build Fails

**Symptom:** Build command exits with error

**Solutions:**
- Check Node.js version (requires 20+)
- Verify `package-lock.json` is committed
- Check for TypeScript errors: `npm run typecheck`
- Ensure all dependencies are in `dependencies` (not just `devDependencies`)

#### 2. Database Connection Fails

**Symptom:** `ECONNREFUSED` or connection timeout

**Solutions:**
- Verify `DATABASE_URL` is correct
- Check Supabase project is active
- Ensure connection pooler is enabled (`?pgbouncer=true`)
- Check IP whitelist if applicable

#### 3. Migrations Fail

**Symptom:** `prisma migrate deploy` fails

**Solutions:**
- Ensure `DIRECT_URL` is set (not pooled connection)
- Check for pending migrations: `npx prisma migrate status`
- Verify database user has DDL permissions

#### 4. Redis Connection Fails

**Symptom:** `ECONNREFUSED` to Redis

**Solutions:**
- Verify `REDIS_URL` is correct
- Check Redis instance is running
- For TLS connections, use `rediss://` prefix
- Check firewall/security group settings

#### 5. CORS Errors

**Symptom:** Browser shows CORS errors

**Solutions:**
- Verify `FRONTEND_URL` matches exactly (including protocol)
- Add all frontend domains to `ALLOWED_ORIGINS`
- Check for trailing slashes in URLs

#### 6. JWT Errors

**Symptom:** "Invalid token" or "Token expired"

**Solutions:**
- Verify JWT secrets are set correctly
- Check token expiry times
- Ensure secrets are same across all instances
- Don't share secrets between environments

### Getting Help

1. **Check Logs**
   - Platform logs (Railway/Render dashboard)
   - Application logs (Winston output)
   - Error tracking (Sentry if configured)

2. **Platform Status**
   - Railway: https://status.railway.app
   - Render: https://status.render.com
   - Supabase: https://status.supabase.com

3. **Community Support**
   - Railway Discord: https://discord.gg/railway
   - Render Community: https://community.render.com
   - Supabase Discord: https://discord.supabase.com

---

## Quick Start Commands

```bash
# Build locally
npm run build

# Run production locally
NODE_ENV=production npm start

# Run migrations
npm run db:migrate:prod

# Check health
curl http://localhost:3001/health

# View logs
railway logs  # Railway
render logs   # Render CLI
```

---

## Related Documentation

- [Environment Setup](./environment-setup.md)
- [Monitoring Setup](./monitoring-setup.md)
- [Backup Procedures](./backup-procedures.md)
- [API Documentation](./api-docs.md)
