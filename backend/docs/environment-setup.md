# Environment Setup Guide

This guide provides detailed instructions for setting up the Turbocat backend in different environments: Development, Staging, and Production.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Overview](#environment-overview)
3. [Development Setup](#development-setup)
4. [Staging Setup](#staging-setup)
5. [Production Setup](#production-setup)
6. [Environment Variable Reference](#environment-variable-reference)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

For developers who want to get started quickly:

```powershell
# 1. Clone and install dependencies
cd backend
npm install

# 2. Copy environment template
Copy-Item .env.example .env

# 3. Fill in required variables (see Development Setup below)

# 4. Generate Prisma client
npm run db:generate

# 5. Run migrations
npm run db:migrate:dev

# 6. Start development server
npm run dev
```

---

## Environment Overview

Turbocat uses three environments:

| Environment | Purpose | Database | Redis | Logging |
|------------|---------|----------|-------|---------|
| Development | Local development | Supabase (dev project) | Local/None | Debug |
| Staging | Pre-production testing | Supabase (staging project) | Upstash | Info |
| Production | Live application | Supabase (prod project) | Upstash/Railway | Info/JSON |

### Environment Files

- `.env.example` - Template with all variables documented
- `.env` - Your local development configuration (never commit!)
- `.env.production.example` - Production template with security recommendations

---

## Development Setup

### Prerequisites

1. **Node.js 20+** - Download from [nodejs.org](https://nodejs.org)
2. **Git** - For version control
3. **Supabase Account** - Free tier at [supabase.com](https://supabase.com)

### Step 1: Create Development Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Configure:
   - **Name**: `turbocat-dev`
   - **Password**: Strong password (save this!)
   - **Region**: Closest to you
   - **Plan**: Free tier

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions.

### Step 2: Create .env File

```powershell
# Copy the template
Copy-Item .env.example .env
```

### Step 3: Configure Required Variables

Edit `.env` with your values:

```env
# Database (from Supabase Dashboard > Settings > Database)
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Supabase (from Supabase Dashboard > Settings > API)
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# JWT Secrets (generate using the commands below)
JWT_ACCESS_SECRET="<generate-64-byte-hex>"
JWT_REFRESH_SECRET="<generate-64-byte-hex>"

# Encryption Key (generate using the commands below)
ENCRYPTION_KEY="<generate-32-byte-hex>"
```

### Step 4: Generate Secrets

Run these commands to generate secure secrets:

```powershell
# Generate JWT Access Secret (64 bytes)
node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT Refresh Secret (64 bytes)
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Generate Encryption Key (32 bytes)
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Optional - Set Up Local Redis

Redis is optional for development but recommended for testing production-like behavior.

**Option 1: Docker (Recommended)**
```powershell
docker run -d --name turbocat-redis -p 6379:6379 redis:alpine
```

**Option 2: WSL + Redis**
```bash
# In WSL terminal
sudo apt update && sudo apt install redis-server
redis-server
```

Then add to `.env`:
```env
REDIS_URL="redis://localhost:6379"
```

### Step 6: Initialize Database

```powershell
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate:dev

# (Optional) Seed with test data
npm run db:seed
```

### Step 7: Start Development Server

```powershell
npm run dev
```

The API will be available at `http://localhost:3001`.

### Development Tips

1. **Hot Reload**: Changes to source files automatically restart the server
2. **Debug Logging**: `LOG_LEVEL=debug` is set by default for development
3. **Test Database**: Set `TEST_DATABASE_URL` for running integration tests
4. **API Docs**: Access Swagger docs at `/api/v1/docs` (if enabled)

---

## Staging Setup

Staging mirrors production but uses separate resources for testing.

### Prerequisites

1. All development prerequisites
2. **Staging Supabase Project** - Separate from development and production
3. **Upstash Redis Account** - For session management
4. **Deployment Platform** - Railway or Render account

### Step 1: Create Staging Supabase Project

1. Create new Supabase project named `turbocat-staging`
2. Use a different region if testing latency
3. Note: Use the same schema as production

### Step 2: Create Staging Redis

1. Go to [Upstash Console](https://console.upstash.com)
2. Create a new Redis database
3. Select same region as your staging deployment
4. Copy the connection URL (rediss://...)

### Step 3: Configure Staging Environment

On your deployment platform (Railway/Render), set these environment variables:

```env
# Environment
NODE_ENV=staging
PORT=3001
HOST=0.0.0.0

# Database (Staging Supabase)
DATABASE_URL="postgresql://postgres.[STAGING-PROJECT]:[PASSWORD]@..."
DIRECT_URL="postgresql://postgres.[STAGING-PROJECT]:[PASSWORD]@..."

# Supabase (Staging)
SUPABASE_URL="https://[STAGING-PROJECT].supabase.co"
SUPABASE_ANON_KEY="staging-anon-key"
SUPABASE_SERVICE_ROLE_KEY="staging-service-role-key"

# JWT (Generate NEW secrets - different from development!)
JWT_ACCESS_SECRET="<new-64-byte-hex>"
JWT_REFRESH_SECRET="<new-64-byte-hex>"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Encryption (Generate NEW key)
ENCRYPTION_KEY="<new-32-byte-hex>"

# Redis (Upstash)
REDIS_URL="rediss://default:[PASSWORD]@[ENDPOINT]:6379"

# CORS (Point to staging frontend)
FRONTEND_URL="https://staging.your-domain.com"
ALLOWED_ORIGINS="https://staging.your-domain.com"

# Logging
LOG_LEVEL="info"
LOG_FORMAT="json"

# Security
TRUST_PROXY=true
SECURE_COOKIES=true
```

### Step 4: Deploy to Staging

**Railway:**
```powershell
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
railway link

# Deploy
railway up
```

**Render:**
- Push to your staging branch
- Render auto-deploys from connected repository

### Step 5: Run Migrations

```powershell
# Railway
railway run npx prisma migrate deploy

# Render
# Use the shell in Render dashboard
```

### Staging Best Practices

1. **Data Seeding**: Use realistic but anonymized data
2. **API Testing**: Run full API test suite against staging
3. **Load Testing**: Test performance with simulated load
4. **Security Testing**: Run security scans before production

---

## Production Setup

Production requires the highest level of security and reliability.

### Prerequisites

1. **Production Supabase Project** - Dedicated production database
2. **Production Redis** - Upstash or Railway Redis with TLS
3. **Deployment Platform** - Railway or Render with production tier
4. **Domain & SSL** - Custom domain with HTTPS
5. **Monitoring** - Sentry, New Relic, or similar (optional but recommended)

### Security Requirements

Before deploying to production:

- [ ] All secrets are unique and cryptographically secure
- [ ] No development credentials in production
- [ ] HTTPS/TLS enabled for all connections
- [ ] Rate limiting configured
- [ ] CORS restricted to production domains only
- [ ] Error tracking configured (Sentry)
- [ ] Database backups enabled

### Step 1: Create Production Resources

**Supabase:**
1. Create new project: `turbocat-production`
2. Enable Point-in-Time Recovery (if on paid plan)
3. Configure database pooling for production load
4. Set up database backups

**Redis (Upstash):**
1. Create production Redis database
2. Enable TLS (use `rediss://` URL)
3. Enable persistence if required

### Step 2: Generate Production Secrets

**CRITICAL: Generate all new secrets for production!**

```powershell
# Generate ALL secrets fresh for production
Write-Host "=== PRODUCTION SECRETS (SAVE SECURELY) ==="
Write-Host ""
node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

Store these securely (password manager, secrets vault).

### Step 3: Configure Production Environment

Set these in your deployment platform (Railway/Render):

```env
# =================================
# PRODUCTION ENVIRONMENT VARIABLES
# =================================

# Application
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
API_VERSION=v1

# Database (Production Supabase)
DATABASE_URL="postgresql://postgres.[PROD-PROJECT]:[PASSWORD]@...?pgbouncer=true&connection_limit=20"
DIRECT_URL="postgresql://postgres.[PROD-PROJECT]:[PASSWORD]@..."

# Supabase (Production)
SUPABASE_URL="https://[PROD-PROJECT].supabase.co"
SUPABASE_ANON_KEY="production-anon-key"
SUPABASE_SERVICE_ROLE_KEY="production-service-role-key"

# JWT (Production - UNIQUE SECRETS)
JWT_ACCESS_SECRET="<production-64-byte-hex>"
JWT_REFRESH_SECRET="<production-64-byte-hex>"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Encryption (Production)
ENCRYPTION_KEY="<production-32-byte-hex>"

# Redis (Production with TLS)
REDIS_URL="rediss://default:[PASSWORD]@[ENDPOINT]:6379"

# CORS (Production domains only)
FRONTEND_URL="https://your-domain.com"
ALLOWED_ORIGINS="https://your-domain.com,https://www.your-domain.com"

# Logging (JSON for log aggregation)
LOG_LEVEL="info"
LOG_FORMAT="json"

# Security
TRUST_PROXY=true
SECURE_COOKIES=true
SESSION_SECRET="<production-32-byte-hex>"

# Rate Limiting (Stricter for production)
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MINUTES=15
USER_RATE_LIMIT_MAX=1000
USER_RATE_LIMIT_WINDOW_MINUTES=60

# Health Checks
HEALTH_CHECK_PATH="/health"
HEALTH_CHECK_INTERVAL=30000

# Error Tracking (Recommended)
# SENTRY_DSN="https://[KEY]@[ORG].ingest.sentry.io/[PROJECT_ID]"
```

### Step 4: Deploy to Production

See [deployment-guide.md](./deployment-guide.md) for detailed deployment instructions.

**Pre-Deployment Checklist:**
- [ ] All tests pass locally
- [ ] Security audit passed (`npm audit`)
- [ ] Environment variables configured
- [ ] Database backup confirmed
- [ ] Rollback plan documented

**Deploy Commands:**

```powershell
# Railway
railway up --environment production

# Or trigger via Git push to main branch
git push origin main
```

### Step 5: Post-Deployment Verification

```powershell
# Health check
curl https://api.your-domain.com/health

# Verify all services
curl https://api.your-domain.com/health/ready
```

See [deployment-checklist.md](./deployment-checklist.md) for complete verification steps.

### Production Monitoring

1. **Health Checks**: Configure uptime monitoring (UptimeRobot, Pingdom)
2. **Error Tracking**: Set up Sentry for error alerts
3. **Log Aggregation**: Use platform logs or external service
4. **Performance**: Monitor response times and database queries

---

## Environment Variable Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection (pooled) | `postgresql://...?pgbouncer=true` |
| `DIRECT_URL` | PostgreSQL direct connection | `postgresql://...` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJ...` |
| `JWT_ACCESS_SECRET` | JWT signing secret (64 bytes) | `a1b2c3...` |
| `JWT_REFRESH_SECRET` | Refresh token secret (64 bytes) | `d4e5f6...` |
| `ENCRYPTION_KEY` | Data encryption key (32 bytes) | `1a2b3c...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3001` |
| `HOST` | Server host | `localhost` |
| `API_VERSION` | API version prefix | `v1` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `ADDITIONAL_CORS_ORIGINS` | Extra CORS origins | - |
| `LOG_LEVEL` | Logging verbosity | `debug` (dev) / `info` (prod) |
| `LOG_TO_FILE` | Write logs to file | `false` |
| `LOG_FORMAT` | Log format | `text` (dev) / `json` (prod) |
| `JWT_ACCESS_EXPIRY` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRY` | Refresh token expiry | `7d` |
| `SESSION_TTL_SECONDS` | Session duration | `86400` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |
| `RATE_LIMIT_WINDOW_MINUTES` | Rate limit window | `15` |
| `TRUST_PROXY` | Trust proxy headers | `false` |
| `SECURE_COOKIES` | Use secure cookies | `false` (dev) / `true` (prod) |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `ANTHROPIC_API_KEY` | Anthropic API key | - |
| `SENTRY_DSN` | Sentry error tracking | - |

### Development-Only Variables

| Variable | Description |
|----------|-------------|
| `TEST_DATABASE_URL` | Test database connection |
| `DEBUG_TESTS` | Enable verbose test output |

---

## Troubleshooting

### Common Issues

#### 1. "Cannot connect to database"

**Symptoms:** Connection refused, timeout errors

**Solutions:**
- Verify `DATABASE_URL` format is correct
- Check Supabase project is not paused (free tier)
- Ensure `?pgbouncer=true` is in the URL for pooled connections
- Verify password has no special characters that need URL encoding

#### 2. "JWT secret not configured"

**Symptoms:** Application fails to start with JWT error

**Solutions:**
- Ensure `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are set
- Secrets must be at least 32 characters
- For hex strings, ensure only valid hex characters (0-9, a-f)

#### 3. "CORS error"

**Symptoms:** Browser blocks API requests

**Solutions:**
- Verify `FRONTEND_URL` matches exactly (protocol, domain, port)
- Check for trailing slashes
- Add all domains to `ALLOWED_ORIGINS` if needed

#### 4. "Redis connection failed"

**Symptoms:** Session or cache errors

**Solutions:**
- Check `REDIS_URL` format
- Use `rediss://` for TLS connections (production)
- Verify Redis server is running
- Check firewall/security group rules

#### 5. "Encryption key invalid"

**Symptoms:** Encryption errors on startup

**Solutions:**
- Key must be exactly 32 bytes (64 hex characters)
- Ensure only valid hex characters
- Generate new key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Getting Help

1. Check the logs: `npm run dev` shows detailed errors
2. Review documentation in `/docs` folder
3. Check platform status pages (Supabase, Railway, Render)
4. Open an issue on GitHub

---

## Related Documentation

- [Supabase Setup](./SUPABASE_SETUP.md) - Detailed Supabase configuration
- [Deployment Guide](./deployment-guide.md) - Platform-specific deployment
- [Deployment Checklist](./deployment-checklist.md) - Pre/post deployment steps
- [Monitoring Setup](./monitoring-setup.md) - Observability configuration
- [Backup Procedures](./backup-procedures.md) - Data backup and recovery
