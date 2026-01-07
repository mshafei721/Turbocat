# Turbocat Backend - Developer Onboarding Guide

Welcome to the Turbocat backend! This guide will help you get the development environment set up and running in under 30 minutes.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (5 minutes)](#quick-start-5-minutes)
3. [Detailed Setup (15 minutes)](#detailed-setup-15-minutes)
4. [Verify Installation (5 minutes)](#verify-installation-5-minutes)
5. [Development Workflow](#development-workflow)
6. [Common Troubleshooting](#common-troubleshooting)
7. [Documentation Map](#documentation-map)
8. [Getting Help](#getting-help)

---

## Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 20.0.0+ | [nodejs.org](https://nodejs.org/) |
| Git | Latest | [git-scm.com](https://git-scm.com/) |
| VS Code | Latest | [code.visualstudio.com](https://code.visualstudio.com/) (recommended) |

**Verify installations:**
```powershell
node --version  # Should show v20.x.x or higher
npm --version   # Should show 9.x.x or higher
git --version   # Should show git version 2.x.x
```

**External Services Required:**
- **Supabase Account** - Free tier at [supabase.com](https://supabase.com) - for PostgreSQL database
- **Upstash Account** (optional) - Free tier at [upstash.com](https://upstash.com) - for Redis (sessions/cache)

---

## Quick Start (5 minutes)

If you already have Supabase credentials, run these commands:

```powershell
# 1. Navigate to backend directory
cd D:\009_Projects_AI\Personal_Projects\Turbocat\backend

# 2. Install dependencies
npm install

# 3. Copy environment template
Copy-Item .env.example .env

# 4. Edit .env with your Supabase credentials (see Step 3 below)

# 5. Generate Prisma client
npm run db:generate

# 6. Run database migrations
npm run db:migrate

# 7. Start development server
npm run dev
```

The server will start at **http://localhost:3001**. Visit http://localhost:3001/health to verify.

---

## Detailed Setup (15 minutes)

### Step 1: Clone and Install Dependencies

```powershell
# Navigate to the project
cd D:\009_Projects_AI\Personal_Projects\Turbocat\backend

# Install all dependencies
npm install
```

### Step 2: Create Supabase Project

Follow the detailed guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) or:

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Name it `turbocat-dev`, set a strong password, choose nearest region
4. Wait 1-2 minutes for provisioning
5. Go to **Settings > Database** and copy:
   - Connection pooling URL (for `DATABASE_URL`)
   - Direct connection URL (for `DIRECT_URL`)
6. Go to **Settings > API** and copy:
   - Project URL (for `SUPABASE_URL`)
   - anon/public key (for `SUPABASE_ANON_KEY`)
   - service_role key (for `SUPABASE_SERVICE_ROLE_KEY`)

### Step 3: Configure Environment Variables

```powershell
# Copy template
Copy-Item .env.example .env
```

Edit `.env` with your values:

```env
# Database (from Supabase Dashboard > Settings > Database)
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Supabase (from Supabase Dashboard > Settings > API)
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# JWT Secrets (generate using commands below)
JWT_ACCESS_SECRET="<generate-64-byte-hex>"
JWT_REFRESH_SECRET="<generate-64-byte-hex>"

# Encryption Key (generate using command below)
ENCRYPTION_KEY="<generate-32-byte-hex>"
```

**Generate secrets with these commands:**

```powershell
# JWT Access Secret (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# JWT Refresh Secret (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Encryption Key (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Initialize Database

```powershell
# Generate Prisma client
npm run db:generate

# Run migrations to create tables
npm run db:migrate

# (Optional) Seed with sample data
npm run db:seed
```

### Step 5: Start Development Server

```powershell
npm run dev
```

You should see:
```
[INFO] Server listening on http://localhost:3001
[INFO] Environment: development
```

---

## Verify Installation (5 minutes)

### 1. Health Check

```powershell
# Using curl (if available)
curl http://localhost:3001/health

# Or using PowerShell
Invoke-RestMethod -Uri http://localhost:3001/health
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-01-07T...",
    "uptime": 5.123,
    "version": "1.0.0",
    "environment": "development"
  }
}
```

### 2. Test Registration

```powershell
# PowerShell
$body = @{
    email = "test@example.com"
    password = "TestPass123!"
    fullName = "Test User"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3001/api/v1/auth/register -Method Post -Body $body -ContentType "application/json"
```

### 3. Test Login

```powershell
$body = @{
    email = "test@example.com"
    password = "TestPass123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri http://localhost:3001/api/v1/auth/login -Method Post -Body $body -ContentType "application/json"
$token = $response.data.tokens.accessToken
Write-Host "Token: $token"
```

### 4. Access Swagger Docs

Open in browser: **http://localhost:3001/api/v1/docs**

---

## Development Workflow

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start server with hot reload |
| `npm run dev:debug` | Start with debugger on port 9229 |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run start` | Run compiled JavaScript |
| `npm run test` | Run all tests |
| `npm run test:unit` | Run unit tests only |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Check code style |
| `npm run lint:fix` | Fix code style issues |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | TypeScript type checking |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |

### Making Changes

1. **Start the development server:**
   ```powershell
   npm run dev
   ```

2. **Make code changes** - Server auto-restarts on save

3. **Run tests before committing:**
   ```powershell
   npm run test:unit
   npm run lint
   npm run typecheck
   ```

4. **Use Prisma Studio to inspect data:**
   ```powershell
   npm run db:studio
   ```
   Opens at http://localhost:5555

### VS Code Debugging

1. Open VS Code in the backend folder
2. Press `F5` or go to Run > Start Debugging
3. Select "Debug Server" configuration
4. Set breakpoints in TypeScript files
5. Debug with full source map support

---

## Common Troubleshooting

### Database Issues

#### "Cannot connect to database"

**Symptoms:** Connection refused, timeout errors

**Solutions:**
1. Verify `DATABASE_URL` format is correct
2. Check Supabase project is not paused (free tier pauses after inactivity)
   - Visit Supabase dashboard and wake the project
3. Ensure `?pgbouncer=true` is at the end of `DATABASE_URL`
4. URL-encode special characters in password

```powershell
# Test connection
npx prisma db pull
```

#### "Migration failed"

**Symptoms:** `prisma migrate dev` fails

**Solutions:**
1. Ensure `DIRECT_URL` is set (uses port 5432, not 6543)
2. Check migration status:
   ```powershell
   npx prisma migrate status
   ```
3. Reset database (WARNING: destroys data):
   ```powershell
   npm run db:migrate:reset
   ```

### Authentication Issues

#### "JWT secret not configured"

**Symptoms:** Server fails to start with JWT error

**Solutions:**
1. Ensure `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are set in `.env`
2. Secrets must be at least 32 characters
3. Generate new secrets:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

#### "Token expired" errors

**Solutions:**
1. Access tokens expire in 15 minutes by default
2. Use the refresh token to get a new access token
3. For testing, use a longer expiry:
   ```env
   JWT_ACCESS_EXPIRY=1h
   ```

### Redis Issues

#### "Redis connection failed"

**Symptoms:** Session or cache errors

**Solutions:**
1. Redis is optional for development - features work without it
2. To use Redis locally:
   ```powershell
   # With Docker
   docker run -d --name turbocat-redis -p 6379:6379 redis:alpine
   ```
3. Add to `.env`:
   ```env
   REDIS_URL="redis://localhost:6379"
   ```
4. For Upstash, use `rediss://` (with double 's' for TLS)

### Build Issues

#### "TypeScript compilation errors"

```powershell
# See detailed errors
npm run typecheck

# Common fix: regenerate Prisma client
npm run db:generate
```

#### "Module not found" errors

```powershell
# Reinstall dependencies
Remove-Item -Recurse -Force node_modules
npm install
npm run db:generate
```

### Test Issues

#### "Integration tests failing"

Integration tests require database connection. Ensure:
1. `DATABASE_URL` is configured
2. Database is accessible
3. Run migrations first: `npm run db:migrate`

#### "Tests timeout"

```powershell
# Run with increased timeout
npm run test -- --testTimeout=30000
```

---

## Documentation Map

| Document | Location | Purpose |
|----------|----------|---------|
| **Main README** | [README.md](../README.md) | Project overview and quick start |
| **Architecture** | [docs/architecture.md](./architecture.md) | System design and components |
| **API Integration** | [docs/api-integration.md](./api-integration.md) | How to use the API |
| **Authentication** | [docs/authentication.md](./authentication.md) | JWT and API key auth |
| **Database Schema** | [docs/database.md](./database.md) | Database models and relationships |
| **Error Handling** | [docs/error-handling.md](./error-handling.md) | Error codes and troubleshooting |
| **Supabase Setup** | [docs/SUPABASE_SETUP.md](./SUPABASE_SETUP.md) | Database setup guide |
| **Environment Setup** | [docs/environment-setup.md](./environment-setup.md) | Environment configuration |
| **Deployment Guide** | [docs/deployment-guide.md](./deployment-guide.md) | Production deployment |
| **Monitoring** | [docs/monitoring-setup.md](./monitoring-setup.md) | Logging and monitoring |
| **Backup Procedures** | [docs/backup-procedures.md](./backup-procedures.md) | Database backup and recovery |
| **Testing Report** | [docs/TESTING_VERIFICATION_REPORT.md](./TESTING_VERIFICATION_REPORT.md) | Test results and coverage |
| **Prisma Guide** | [prisma/README.md](../prisma/README.md) | Migration workflow |

---

## Getting Help

1. **Check documentation** - Most answers are in the docs above
2. **Search existing code** - Use VS Code search (Ctrl+Shift+F)
3. **Run tests** - Tests demonstrate expected behavior
4. **Check logs** - Server logs show detailed error information
5. **Prisma Studio** - Visual database browser helps debug data issues

### Useful Commands for Debugging

```powershell
# View server logs with debug level
$env:LOG_LEVEL = "debug"
npm run dev

# Check database connection
npx prisma db pull

# View database in browser
npm run db:studio

# Check what Prisma sees
npx prisma migrate status

# Validate Prisma schema
npx prisma validate
```

---

## Next Steps

After completing setup:

1. **Explore the API** - Visit http://localhost:3001/api/v1/docs
2. **Read architecture docs** - Understand the system design
3. **Run the test suite** - Familiarize with testing patterns
4. **Create a feature branch** - Start making changes
5. **Check the handoff document** - Review what was built and known issues

---

**Estimated Setup Time:** 20-30 minutes
**Last Updated:** January 7, 2026
