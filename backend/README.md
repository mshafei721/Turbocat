# Turbocat Backend API

Multi-agent orchestration platform backend built with Express.js and TypeScript.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Scripts Reference](#scripts-reference)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Database](#database)
- [Testing](#testing)
- [Debugging](#debugging)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Overview

Turbocat Backend provides the API layer for the Turbocat multi-agent orchestration platform. It handles:

- User authentication and authorization
- Agent management and execution
- Workflow orchestration
- Template management
- Deployment lifecycle
- Analytics and metrics

### Tech Stack

- **Runtime:** Node.js 20+
- **Framework:** Express.js 5
- **Language:** TypeScript 5.9+
- **Database:** PostgreSQL (via Supabase)
- **ORM:** Prisma 7
- **Logging:** Winston
- **Security:** Helmet, CORS

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20.0.0 or higher ([Download](https://nodejs.org/))
- **npm** 9.0.0 or higher (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

Additionally, you will need:

- **Supabase Account** for database ([Sign up](https://supabase.com))
- **Redis** (optional, for sessions/queue - can use [Upstash](https://upstash.com))

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/turbocat.git
cd turbocat/backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS/Linux
cp .env.example .env
```

Edit `.env` and fill in your values. See [Environment Variables](#environment-variables) for details.

### 4. Generate Prisma Client

```bash
npm run db:generate
```

### 5. Run Database Migrations

```bash
npm run db:migrate
```

### 6. Start the Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3001`.

### 7. Verify Installation

Visit the health check endpoint:

```bash
curl http://localhost:3001/health
```

You should see:

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-01-06T...",
    "uptime": 5.123,
    "version": "1.0.0",
    "environment": "development"
  }
}
```

## Environment Variables

Copy `.env.example` to `.env` and configure the following:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection URL (with pooler) | `postgresql://...` |
| `DIRECT_URL` | PostgreSQL direct connection (for migrations) | `postgresql://...` |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens | 64-char hex string |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | 64-char hex string |
| `ENCRYPTION_KEY` | Key for encrypting sensitive data | 32-char hex string |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3001` |
| `HOST` | Server host | `localhost` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `LOG_LEVEL` | Logging level | `debug` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379` |

### Generating Secrets

**PowerShell:**
```powershell
# Generate JWT secret (64 bytes)
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))

# Generate encryption key (32 bytes)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Development

### Starting the Development Server

```bash
npm run dev
```

This starts the server with hot reload enabled. The server automatically restarts when you modify TypeScript files.

### Development with Debug Mode

```bash
npm run dev:debug
```

This starts the server with the Node.js inspector enabled on port 9229.

### Type Checking

```bash
npm run typecheck
```

Runs TypeScript compiler without emitting files to check for type errors.

### Linting

```bash
# Check for linting issues
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

### Formatting

```bash
# Format all files
npm run format

# Check formatting without fixing
npm run format:check
```

### Pre-commit Check

Run all checks before committing:

```bash
npm run precommit
```

This runs linting, formatting, and type checking.

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run dev:debug` | Start development server with debugger |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run build:clean` | Clean and rebuild |
| `npm run start` | Start production server |
| `npm run start:prod` | Start with NODE_ENV=production |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint and fix issues |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run test` | Run all tests |
| `npm run test:unit` | Run unit tests only |
| `npm run test:integration` | Run integration tests only |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:watch` | Run tests in watch mode |
| `npm run db:migrate` | Run database migrations (dev) |
| `npm run db:migrate:prod` | Run database migrations (production) |
| `npm run db:migrate:reset` | Reset database and run migrations |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema changes without migration |
| `npm run db:validate` | Validate Prisma schema |
| `npm run clean` | Remove dist and coverage directories |
| `npm run precommit` | Run lint, format, and typecheck |

## Project Structure

```
backend/
├── src/
│   ├── app.ts              # Express application configuration
│   ├── server.ts           # Server entry point
│   ├── index.ts            # Module exports
│   ├── lib/                # Core libraries
│   │   ├── logger.ts       # Winston logger configuration
│   │   ├── prisma.ts       # Prisma client singleton
│   │   └── version.ts      # Version information
│   ├── middleware/         # Express middleware
│   │   ├── errorHandler.ts # Global error handler
│   │   ├── requestId.ts    # Request ID generator
│   │   ├── requestLogger.ts# Request logging
│   │   └── security.ts     # Security headers
│   ├── routes/             # API route handlers
│   │   └── health.ts       # Health check endpoints
│   ├── services/           # Business logic layer
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
│       └── ApiError.ts     # Custom error class
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Database migrations
├── tests/                  # Test files
├── docs/                   # Documentation
├── .vscode/
│   └── launch.json         # VS Code debugging configuration
├── nodemon.json            # Nodemon configuration
├── tsconfig.json           # TypeScript configuration
├── eslint.config.mjs       # ESLint configuration
├── .prettierrc             # Prettier configuration
├── .env.example            # Environment variables template
└── package.json            # Project dependencies
```

## API Endpoints

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Full health check with database status |
| GET | `/health/live` | Liveness probe (is server running?) |
| GET | `/health/ready` | Readiness probe (is server ready to accept traffic?) |

### Authentication (Coming Soon)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login user |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout user |

### Resources (Coming Soon)

- `/api/v1/agents` - Agent management
- `/api/v1/workflows` - Workflow management
- `/api/v1/templates` - Template management
- `/api/v1/deployments` - Deployment management
- `/api/v1/executions` - Execution management

## Database

### Prisma Schema

The database schema is defined in `prisma/schema.prisma`. Key models include:

- **User** - User accounts and authentication
- **Agent** - Agent definitions and configurations
- **Workflow** - Workflow definitions with steps
- **WorkflowStep** - Individual steps in a workflow
- **Execution** - Workflow execution records
- **ExecutionLog** - Execution logs and metrics
- **Template** - Reusable agent/workflow templates
- **Deployment** - Deployment configurations
- **ApiKey** - API key management
- **AuditLog** - Security audit trail

### Common Database Commands

```bash
# Create a new migration
npm run db:migrate

# Apply migrations to production
npm run db:migrate:prod

# Reset database (WARNING: destroys data)
npm run db:migrate:reset

# Open Prisma Studio (visual database browser)
npm run db:studio

# Regenerate Prisma client after schema changes
npm run db:generate
```

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Test Structure

```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
└── e2e/            # End-to-end tests
```

## Debugging

### VS Code Debugging

The project includes VS Code debugging configurations in `.vscode/launch.json`:

1. **Debug Server** - Start server with debugger attached
2. **Attach to Node** - Attach to running Node process
3. **Debug Current Test File** - Debug the currently open test file
4. **Debug All Tests** - Debug all tests

To debug:

1. Open VS Code
2. Go to Run and Debug (Ctrl+Shift+D)
3. Select a configuration from the dropdown
4. Press F5 or click the green play button

### Manual Debugging

Start the server with inspector:

```bash
npm run dev:debug
```

Then attach your debugger to `localhost:9229`.

## Deployment

### Building for Production

```bash
# Clean build
npm run build:clean

# Or just build
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### Running in Production

```bash
# Set environment
export NODE_ENV=production

# Run migrations
npm run db:migrate:prod

# Start server
npm run start:prod
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure strong JWT secrets
- [ ] Set up production database
- [ ] Configure Redis for sessions
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Enable HTTPS

## Troubleshooting

### Common Issues

#### "Cannot find module" errors

Regenerate the Prisma client:

```bash
npm run db:generate
```

#### Database connection issues

1. Check `DATABASE_URL` in `.env`
2. Ensure Supabase project is running
3. Verify IP allowlist in Supabase settings

#### TypeScript compilation errors

1. Run `npm run typecheck` to see detailed errors
2. Check for missing type definitions
3. Ensure all imports are correct

#### Hot reload not working

1. Check `nodemon.json` configuration
2. Ensure file is in watched directory (`src/`)
3. Try restarting the dev server

#### Tests failing

1. Ensure test database is configured
2. Run `npm run db:migrate` to apply migrations
3. Check for missing environment variables

### Getting Help

1. Check the [documentation](./docs/)
2. Review existing issues on GitHub
3. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Environment details (OS, Node version)

## License

ISC

---

Built with care by the Turbocat team.
