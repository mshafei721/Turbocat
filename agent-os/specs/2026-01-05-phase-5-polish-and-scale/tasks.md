# Task Breakdown: Turbocat Phase 5 - Core Implementation

**Version:** 1.0
**Date:** January 5, 2026
**Total Duration:** 4-6 weeks
**Implementation Phases:** 5.1 through 5.4

---

## Overview

This document provides a comprehensive, strategic task breakdown for implementing Turbocat Phase 5, which establishes the complete backend infrastructure, database layer, API foundation, and core agent execution engine.

### Total Tasks: ~140 tasks organized into 7 major phases

**Key Priorities:**
1. Foundation Setup (Week 1)
2. Database Schema & Models (Week 1-2)
3. Authentication System (Week 2)
4. Core API Endpoints (Week 2-3)
5. Agent Core Engine (Week 3-4)
6. Testing Infrastructure (Week 4)
7. Documentation & Deployment (Week 4)

---

## Phase 5.1: Foundation Setup (Week 1)

### Task Group 1: Project Initialization
**Dependencies:** None
**Effort:** S (2-4 hours)
**Priority:** Critical

- [ ] 1.1 Create backend directory structure
  - Create `backend/` folder in project root
  - Setup folders: `src/`, `prisma/`, `tests/`, `scripts/`
  - Create subdirectories: `src/routes/`, `src/services/`, `src/middleware/`, `src/utils/`, `src/types/`
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\` (new directory structure)
  - **Success:** Directory structure matches Node.js best practices

- [ ] 1.2 Initialize Node.js project with TypeScript
  - Run `npm init -y` in backend directory
  - Install TypeScript: `npm install -D typescript @types/node`
  - Create `tsconfig.json` with strict mode enabled
  - Install core dependencies: `express`, `dotenv`, `cors`, `helmet`
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\package.json`, `tsconfig.json`
  - **Success:** `tsc` compiles without errors

- [ ] 1.3 Configure ESLint and Prettier
  - Install ESLint with Airbnb config: `npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin`
  - Install Prettier: `npm install -D prettier eslint-config-prettier eslint-plugin-prettier`
  - Create `.eslintrc.json` and `.prettierrc`
  - Add lint scripts to package.json
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\.eslintrc.json`, `.prettierrc`
  - **Success:** Linter runs without errors

- [ ] 1.4 Configure Husky for pre-commit hooks
  - Install Husky: `npm install -D husky lint-staged`
  - Run `npx husky install`
  - Create pre-commit hook: `npx husky add .husky/pre-commit "npm run lint-staged"`
  - Configure lint-staged in package.json
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\.husky\pre-commit`
  - **Success:** Pre-commit hook runs linter and formatter

**Acceptance Criteria:**
- Backend project structure exists
- TypeScript compiles successfully
- Linter and formatter configured
- Git hooks working

---

### Task Group 2: Database Setup
**Dependencies:** Task Group 1
**Effort:** M (4-6 hours)
**Priority:** Critical

- [ ] 2.1 Create Supabase project
  - Sign up/login to Supabase (https://supabase.com)
  - Create new project: "turbocat-dev"
  - Note database URL, anon key, service key
  - Save credentials securely
  - **Success:** Supabase project created and accessible

- [ ] 2.2 Initialize Prisma with PostgreSQL
  - Install Prisma: `npm install -D prisma` and `npm install @prisma/client`
  - Run `npx prisma init`
  - Update `DATABASE_URL` in `.env` with Supabase connection string
  - Configure Prisma schema for PostgreSQL provider
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\prisma\schema.prisma`, `.env`
  - **Success:** Can connect to database with `npx prisma db pull`

- [ ] 2.3 Create environment variable files
  - Create `.env.example` with placeholder values
  - Create `.env` with actual development values (gitignored)
  - Add all required env vars: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`, `REDIS_URL`, `FRONTEND_URL`
  - Generate secrets: `openssl rand -hex 64` for JWT, `openssl rand -hex 32` for encryption
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\.env.example`, `.env`
  - **Success:** All environment variables documented and set

- [ ] 2.4 Setup Prisma client singleton
  - Create `src/lib/prisma.ts` with Prisma client singleton pattern
  - Add connection pooling configuration
  - Enable logging in development mode
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\lib\prisma.ts`
  - **Success:** Prisma client can be imported and used

**Acceptance Criteria:**
- Supabase project created
- Prisma initialized and connected to database
- Environment variables configured
- Prisma client singleton working

---

### Task Group 3: Express Server Bootstrap
**Dependencies:** Task Group 1, 2
**Effort:** M (4-6 hours)
**Priority:** Critical

- [ ] 3.1 Create basic Express server
  - Create `src/server.ts` with Express app initialization
  - Create `src/app.ts` for app configuration (separate from server)
  - Setup basic middleware: `express.json()`, `cors()`, `helmet()`
  - Add request logging middleware (morgan or winston)
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\server.ts`, `src\app.ts`
  - **Success:** Server starts and listens on port 3001

- [ ] 3.2 Configure security middleware
  - Install helmet: `npm install helmet`
  - Configure HTTPS redirect for production
  - Setup HSTS headers
  - Configure Content Security Policy
  - Add XSS protection headers
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\middleware\security.ts`
  - **Success:** Security headers present in all responses

- [ ] 3.3 Setup error handling middleware
  - Create custom `ApiError` class
  - Create global error handler middleware
  - Add 404 handler
  - Format error responses consistently (success: false, error object)
  - Add request ID to all responses
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\middleware\errorHandler.ts`, `src\utils\ApiError.ts`
  - **Success:** Errors return consistent JSON format

- [ ] 3.4 Configure logging (winston/pino)
  - Install winston: `npm install winston`
  - Create logger configuration with different log levels
  - Setup file and console transports
  - Add structured logging with timestamps
  - Create request logging middleware
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\lib\logger.ts`
  - **Success:** Logs written to console and file

- [ ] 3.5 Create health check endpoint
  - Create `GET /health` endpoint
  - Check database connection
  - Return service status, uptime, timestamp
  - Add version info from package.json
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\health.ts`
  - **Success:** `/health` returns 200 with status info

**Acceptance Criteria:**
- Express server runs without errors
- Security middleware configured
- Error handling works correctly
- Logging operational
- Health check endpoint working

---

### Task Group 4: Development Tooling
**Dependencies:** Task Group 3
**Effort:** S (2-3 hours)
**Priority:** Medium

- [ ] 4.1 Setup nodemon/ts-node-dev for hot reload
  - Install ts-node-dev: `npm install -D ts-node-dev`
  - Add dev script: `"dev": "ts-node-dev --respawn src/server.ts"`
  - Configure nodemon.json for file watching
  - Ignore node_modules and test files
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\nodemon.json`, `package.json`
  - **Success:** Server reloads on file changes

- [ ] 4.2 Configure npm scripts for development
  - Add scripts: `"build"`, `"start"`, `"dev"`, `"lint"`, `"format"`, `"typecheck"`
  - Add `"db:migrate"`, `"db:seed"`, `"db:studio"` for Prisma
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\package.json`
  - **Success:** All npm scripts execute correctly

- [ ] 4.3 Setup VS Code debugging configuration
  - Create `.vscode/launch.json` for debugging
  - Add "Attach to Node" configuration
  - Configure source maps for TypeScript
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\.vscode\launch.json`
  - **Success:** Can debug TypeScript code in VS Code

- [ ] 4.4 Create initial README.md for backend
  - Document setup instructions
  - List required environment variables
  - Add development workflow commands
  - Include architecture overview
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\README.md`
  - **Success:** Another developer can setup project using README

**Acceptance Criteria:**
- Hot reload working
- All npm scripts functional
- VS Code debugging configured
- README documentation complete

---

## Phase 5.2: Database Schema & Models (Week 1-2)

### Task Group 5: Prisma Schema Design
**Dependencies:** Phase 5.1 complete
**Effort:** L (8-12 hours)
**Priority:** Critical

- [ ] 5.1 Define User model
  - Add User model to `schema.prisma` with all fields from database-schema.md
  - Define UserRole enum (ADMIN, USER, AGENT)
  - Add indexes on email, role, createdAt
  - Configure soft deletes (deletedAt field)
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\prisma\schema.prisma`
  - **Success:** User model matches specification

- [ ] 5.2 Define Agent model
  - Add Agent model with all fields
  - Define AgentType enum (CODE, API, LLM, DATA, WORKFLOW)
  - Define AgentStatus enum (DRAFT, ACTIVE, INACTIVE, ARCHIVED)
  - Add relationships: user, parent (for versioning), versions
  - Add indexes on userId, type, status, isPublic, tags, createdAt
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\prisma\schema.prisma`
  - **Success:** Agent model with proper relationships

- [ ] 5.3 Define Workflow model
  - Add Workflow model with all fields
  - Define WorkflowStatus enum
  - Add relationships: user, parent, versions, steps, executions, deployments
  - Add indexes on userId, status, scheduleEnabled, tags, createdAt
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\prisma\schema.prisma`
  - **Success:** Workflow model complete

- [ ] 5.4 Define WorkflowStep model
  - Add WorkflowStep model
  - Define WorkflowStepType enum (AGENT, CONDITION, LOOP, PARALLEL, WAIT)
  - Define ErrorHandling enum (FAIL, CONTINUE, RETRY)
  - Add relationships: workflow, agent, executionLogs
  - Add unique constraint on (workflowId, stepKey)
  - Add indexes on workflowId, agentId, position
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\prisma\schema.prisma`
  - **Success:** WorkflowStep model with constraints

- [ ] 5.5 Define Execution model
  - Add Execution model
  - Define ExecutionStatus enum (PENDING, RUNNING, COMPLETED, FAILED, CANCELLED, TIMEOUT)
  - Define TriggerType enum (MANUAL, SCHEDULED, API, WEBHOOK, EVENT)
  - Add relationships: workflow, user, logs
  - Add indexes on workflowId, userId, status, createdAt, completedAt
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\prisma\schema.prisma`
  - **Success:** Execution model complete

- [ ] 5.6 Define ExecutionLog model
  - Add ExecutionLog model
  - Define LogLevel enum (DEBUG, INFO, WARN, ERROR, FATAL)
  - Define StepStatus enum (PENDING, RUNNING, COMPLETED, FAILED, SKIPPED)
  - Add relationships: execution, workflowStep
  - Add indexes on executionId+createdAt, level, createdAt
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\prisma\schema.prisma`
  - **Success:** ExecutionLog model complete

- [ ] 5.7 Define Template model
  - Add Template model
  - Define TemplateType enum (AGENT, WORKFLOW, STEP)
  - Add relationship: user
  - Add indexes on category, type, isOfficial, isPublic, tags, usageCount
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\prisma\schema.prisma`
  - **Success:** Template model complete

- [ ] 5.8 Define Deployment model
  - Add Deployment model
  - Define Environment enum (DEVELOPMENT, STAGING, PRODUCTION)
  - Define DeploymentStatus enum (STOPPED, STARTING, RUNNING, STOPPING, FAILED, MAINTENANCE)
  - Define HealthStatus enum (UNKNOWN, HEALTHY, UNHEALTHY, DEGRADED)
  - Add relationships: user, workflow, agent
  - Add check constraint: either workflowId or agentId must be set (not both)
  - Add indexes on userId, workflowId, agentId, status, environment
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\prisma\schema.prisma`
  - **Success:** Deployment model with constraints

- [ ] 5.9 Define ApiKey model
  - Add ApiKey model
  - Add relationship: user
  - Add indexes on userId, keyHash, keyPrefix, expiresAt
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\prisma\schema.prisma`
  - **Success:** ApiKey model complete

- [ ] 5.10 Define AuditLog model
  - Add AuditLog model
  - Add relationship: user (optional)
  - Add indexes on userId, resourceType+resourceId, action, createdAt
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\prisma\schema.prisma`
  - **Success:** AuditLog model complete

**Acceptance Criteria:**
- All 10 models defined in Prisma schema
- All enums created
- All relationships configured
- All indexes specified
- Schema validates with `npx prisma validate`

---

### Task Group 6: Database Migrations
**Dependencies:** Task Group 5
**Effort:** M (4-6 hours)
**Priority:** Critical

- [ ] 6.1 Create initial migration
  - Run `npx prisma migrate dev --name init`
  - Verify migration SQL in `prisma/migrations/`
  - Check all tables created in Supabase
  - Verify indexes created
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\prisma\migrations\*_init\migration.sql`
  - **Success:** Migration applies successfully to database

- [ ] 6.2 Test migration rollback
  - Run `npx prisma migrate reset` (WARNING: destroys data)
  - Verify all tables dropped
  - Re-apply migration
  - **Success:** Can rollback and re-apply migrations

- [ ] 6.3 Generate Prisma Client
  - Run `npx prisma generate`
  - Verify types generated in `node_modules/@prisma/client`
  - Test importing Prisma Client in code
  - **Files:** Generated files in `node_modules/@prisma/client/`
  - **Success:** Can import and use Prisma Client

- [ ] 6.4 Create seed data script
  - Create `prisma/seed.ts`
  - Add seed script to package.json: `"prisma": { "seed": "ts-node prisma/seed.ts" }`
  - Create admin user (email: admin@turbocat.dev)
  - Create 3-5 official templates (Web Scraper, Data Transformer, etc.)
  - Create sample agents and workflows for testing
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\prisma\seed.ts`
  - **Success:** `npx prisma db seed` populates database

- [ ] 6.5 Document migration procedures
  - Create `prisma/README.md` with migration workflow
  - Document how to create migrations
  - Document rollback procedures
  - Add troubleshooting section
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\prisma\README.md`
  - **Success:** Clear migration documentation exists

**Acceptance Criteria:**
- Initial migration created and applied
- Migration rollback tested
- Prisma Client generated
- Seed data script working
- Migration procedures documented

---

### Task Group 7: Data Access Layer
**Dependencies:** Task Group 6
**Effort:** S (2-4 hours)
**Priority:** Medium

- [ ] 7.1 Create query helper utilities
  - Create `src/lib/queryHelpers.ts`
  - Add pagination helper function
  - Add filtering helper function
  - Add sorting helper function
  - Add soft delete filtering helper
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\lib\queryHelpers.ts`
  - **Success:** Helpers simplify Prisma queries

- [ ] 7.2 Setup connection pooling configuration
  - Configure Prisma connection pool size
  - Set connection timeout
  - Configure statement timeout
  - Add pool monitoring
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\lib\prisma.ts`
  - **Success:** Connection pool configured optimally

- [ ] 7.3 Create database health check utility
  - Create `src/utils/dbHealthCheck.ts`
  - Test connection with simple query
  - Measure query response time
  - Return connection pool status
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\utils\dbHealthCheck.ts`
  - **Success:** Can check database health programmatically

**Acceptance Criteria:**
- Query helpers created
- Connection pooling configured
- Database health check working

---

## Phase 5.3: Authentication System (Week 2)

### Task Group 8: Supabase Auth Integration
**Dependencies:** Phase 5.2 complete
**Effort:** M (6-8 hours)
**Priority:** Critical

- [ ] 8.1 Install and configure Supabase Auth client
  - Install Supabase SDK: `npm install @supabase/supabase-js`
  - Create `src/lib/supabase.ts` with Supabase client
  - Configure with SUPABASE_URL and SUPABASE_ANON_KEY
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\lib\supabase.ts`
  - **Success:** Can initialize Supabase client

- [ ] 8.2 Implement JWT verification middleware
  - Install jsonwebtoken: `npm install jsonwebtoken` and `npm install -D @types/jsonwebtoken`
  - Create `src/middleware/auth.ts`
  - Implement `verifyAccessToken()` function
  - Extract token from Authorization header
  - Validate JWT signature and expiration
  - Attach user payload to req.user
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\middleware\auth.ts`
  - **Success:** Can verify valid JWT tokens

- [ ] 8.3 Create JWT token generation utilities
  - Create `src/utils/jwt.ts`
  - Implement `generateAccessToken()` (15min expiry)
  - Implement `generateRefreshToken()` (7 day expiry)
  - Use different secrets for access and refresh tokens
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\utils\jwt.ts`
  - **Success:** Can generate valid JWT tokens

- [ ] 8.4 Implement session management with Redis
  - Install Redis client: `npm install ioredis` and `npm install -D @types/ioredis`
  - Create `src/lib/redis.ts` with Redis connection
  - Implement `createSession()` function
  - Implement `getSession()` function
  - Implement `invalidateSession()` function
  - Store session data: userId, role, ipAddress, userAgent
  - Set 7-day expiry on sessions
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\lib\redis.ts`, `src\services\session.service.ts`
  - **Success:** Can create and retrieve sessions from Redis

**Acceptance Criteria:**
- Supabase Auth configured
- JWT middleware validates tokens
- Token generation working
- Session management with Redis operational

---

### Task Group 9: Authentication Endpoints
**Dependencies:** Task Group 8
**Effort:** L (8-10 hours)
**Priority:** Critical

- [ ] 9.1 Implement POST /auth/register endpoint
  - Create `src/routes/auth.ts`
  - Create `src/services/auth.service.ts`
  - Validate input with Zod schema (email, password, fullName)
  - Enforce password requirements (min 8 chars, uppercase, lowercase, number, special char)
  - Hash password with bcrypt (12 salt rounds)
  - Create user in database
  - Generate access and refresh tokens
  - Return user and tokens
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\auth.ts`, `src\services\auth.service.ts`
  - **Success:** Can register new users

- [ ] 9.2 Implement POST /auth/login endpoint
  - Validate email and password
  - Find user by email
  - Verify password with bcrypt
  - Update lastLoginAt timestamp
  - Generate access and refresh tokens
  - Create session
  - Log login event to audit log
  - Return user and tokens
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\auth.ts`, `src\services\auth.service.ts`
  - **Success:** Can authenticate users

- [ ] 9.3 Implement POST /auth/refresh endpoint
  - Validate refresh token
  - Check if token is not expired
  - Generate new access token
  - Return new access token with expiry
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\auth.ts`
  - **Success:** Can refresh access tokens

- [ ] 9.4 Implement POST /auth/logout endpoint
  - Require authentication
  - Invalidate current session
  - (Optional) Revoke refresh token
  - Log logout event to audit log
  - Return 204 No Content
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\auth.ts`
  - **Success:** Sessions invalidated on logout

- [ ] 9.5 Implement POST /auth/forgot-password endpoint
  - Validate email
  - Find user by email (don't reveal if user exists for security)
  - Generate password reset token (expires in 1 hour)
  - Store reset token in database or Redis
  - Send password reset email (use Resend or similar)
  - Return success message
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\auth.ts`, `src\services\email.service.ts`
  - **Success:** Password reset email sent

- [ ] 9.6 Implement POST /auth/reset-password endpoint
  - Validate reset token and new password
  - Verify token is not expired
  - Hash new password
  - Update user password
  - Invalidate reset token
  - Invalidate all existing sessions
  - Log password reset to audit log
  - Return success message
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\auth.ts`
  - **Success:** Can reset password with token

**Acceptance Criteria:**
- All 6 auth endpoints implemented
- Password hashing with bcrypt working
- JWT tokens generated and validated
- Sessions created and managed
- Audit logging for security events

---

### Task Group 10: Authorization Middleware
**Dependencies:** Task Group 9
**Effort:** M (4-6 hours)
**Priority:** Critical

- [ ] 10.1 Create authentication middleware
  - Implement `requireAuth` middleware
  - Extract and verify JWT token
  - Attach user to request object
  - Return 401 if not authenticated
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\middleware\auth.ts`
  - **Success:** Protected routes require valid token

- [ ] 10.2 Implement role-based access control
  - Create `requireRole(...roles)` middleware factory
  - Check if authenticated user has required role
  - Return 403 if insufficient permissions
  - Support multiple roles (e.g., requireRole('admin', 'user'))
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\middleware\auth.ts`
  - **Success:** Can restrict endpoints by role

- [ ] 10.3 Create ownership validation middleware
  - Implement `requireOwnership(resourceGetter)` middleware factory
  - Load resource from database
  - Check if resource.userId matches authenticated user
  - Allow admins to bypass ownership check
  - Return 403 if not owner and not admin
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\middleware\auth.ts`
  - **Success:** Users can only access their own resources

- [ ] 10.4 Implement API key authentication
  - Create `requireApiKey` middleware
  - Extract API key from `X-API-Key` header
  - Hash key and lookup in database
  - Verify key is active and not expired
  - Implement rate limiting per API key
  - Update lastUsedAt and usageCount
  - Attach user to request object
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\middleware\apiKey.ts`
  - **Success:** Can authenticate with API keys

**Acceptance Criteria:**
- Authentication middleware working
- Role-based access control implemented
- Ownership validation working
- API key authentication functional

---

### Task Group 11: User Management Endpoints
**Dependencies:** Task Group 10
**Effort:** S (3-4 hours)
**Priority:** Medium

- [ ] 11.1 Implement GET /users/me endpoint
  - Require authentication
  - Return current user profile (exclude password)
  - Include preferences
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\users.ts`
  - **Success:** Returns authenticated user profile

- [ ] 11.2 Implement PATCH /users/me endpoint
  - Require authentication
  - Validate input with Zod (fullName, avatarUrl, preferences)
  - Update user in database
  - Return updated user profile
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\users.ts`
  - **Success:** Can update user profile

- [ ] 11.3 Implement GET /users/:id endpoint (admin only)
  - Require admin role
  - Return user by ID (exclude password)
  - Return 404 if not found
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\users.ts`
  - **Success:** Admins can view any user

**Acceptance Criteria:**
- Current user profile endpoints working
- Admin can view any user
- Proper authorization checks

---

## Phase 5.4: Core API Endpoints (Week 2-3)

### Task Group 12: Agents API
**Dependencies:** Phase 5.3 complete
**Effort:** XL (12-16 hours)
**Priority:** Critical

- [ ] 12.1 Implement GET /agents endpoint
  - Require authentication
  - Create `src/services/agent.service.ts`
  - Support pagination (page, pageSize)
  - Support filtering (type, status, search, tags)
  - Support sorting (sortBy, sortOrder)
  - Filter by authenticated user (userId)
  - Exclude soft-deleted agents
  - Return paginated response with metadata
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\agents.ts`, `src\services\agent.service.ts`
  - **Success:** Returns paginated, filtered agent list

- [ ] 12.2 Implement GET /agents/:id endpoint
  - Require authentication
  - Require ownership (or admin)
  - Load agent with all fields
  - Return 404 if not found or soft-deleted
  - Return 403 if not owner
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\agents.ts`
  - **Success:** Returns single agent details

- [ ] 12.3 Implement POST /agents endpoint
  - Require authentication
  - Validate input with Zod (name, type, config, etc.)
  - Set default values (status: draft, version: 1)
  - Set userId to authenticated user
  - Create agent in database
  - Return created agent (201 Created)
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\agents.ts`
  - **Success:** Can create new agents

- [ ] 12.4 Implement PATCH /agents/:id endpoint
  - Require authentication and ownership
  - Validate input (partial update)
  - Update agent in database
  - Update updatedAt timestamp
  - Return updated agent
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\agents.ts`
  - **Success:** Can update agents

- [ ] 12.5 Implement DELETE /agents/:id endpoint
  - Require authentication and ownership
  - Soft delete agent (set deletedAt)
  - Don't actually delete from database
  - Return 204 No Content
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\agents.ts`
  - **Success:** Agents soft-deleted

- [ ] 12.6 Implement POST /agents/:id/duplicate endpoint
  - Require authentication and ownership
  - Load source agent
  - Create new agent with same config
  - Set parentId to source agent
  - Increment version
  - Allow custom name in request
  - Return created agent (201 Created)
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\agents.ts`
  - **Success:** Can duplicate agents

- [ ] 12.7 Implement GET /agents/:id/versions endpoint
  - Require authentication and ownership
  - Load all versions (agent with same parentId tree)
  - Order by version descending
  - Return version history
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\agents.ts`
  - **Success:** Returns version history

**Acceptance Criteria:**
- All 7 agent endpoints implemented
- Pagination, filtering, sorting working
- Ownership validation enforced
- Soft deletes working
- Version history functional

---

### Task Group 13: Workflows API
**Dependencies:** Task Group 12
**Effort:** XL (14-18 hours)
**Priority:** Critical

- [ ] 13.1 Implement GET /workflows endpoint
  - Same pattern as agents (pagination, filtering, sorting)
  - Filter by userId, status, tags
  - Include basic workflow info (no steps)
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\workflows.ts`, `src\services\workflow.service.ts`
  - **Success:** Returns paginated workflows

- [ ] 13.2 Implement GET /workflows/:id endpoint
  - Load workflow with steps (include relation)
  - Load steps with agent info
  - Return full workflow definition
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\workflows.ts`
  - **Success:** Returns workflow with steps

- [ ] 13.3 Implement POST /workflows endpoint
  - Validate workflow data and steps
  - Create workflow and steps in transaction
  - Validate DAG structure (no cycles)
  - Validate step dependencies
  - Return created workflow (201 Created)
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\workflows.ts`
  - **Success:** Can create workflows with steps

- [ ] 13.4 Implement PATCH /workflows/:id endpoint
  - Update workflow metadata
  - Handle step updates (create, update, delete)
  - Use transaction for consistency
  - Re-validate DAG if steps changed
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\workflows.ts`
  - **Success:** Can update workflows

- [ ] 13.5 Implement DELETE /workflows/:id endpoint
  - Soft delete workflow
  - Cascade soft delete to steps (or handle in Prisma)
  - Return 204 No Content
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\workflows.ts`
  - **Success:** Workflows soft-deleted

- [ ] 13.6 Implement POST /workflows/:id/execute endpoint
  - Validate workflow is active
  - Create execution record
  - Queue workflow for execution (BullMQ)
  - Return execution ID and status (201 Created)
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\workflows.ts`
  - **Success:** Workflow execution queued

- [ ] 13.7 Implement GET /workflows/:id/executions endpoint
  - Load execution history for workflow
  - Support pagination
  - Filter by status
  - Order by createdAt descending
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\workflows.ts`
  - **Success:** Returns execution history

**Acceptance Criteria:**
- All 7 workflow endpoints implemented
- Workflow+steps created in transactions
- DAG validation working
- Execution triggering functional

---

### Task Group 14: Templates API
**Dependencies:** Task Group 12
**Effort:** M (6-8 hours)
**Priority:** Medium

- [ ] 14.1 Implement GET /templates endpoint
  - Allow unauthenticated access for public templates
  - Filter by category, type, isOfficial, isPublic
  - Support search and tags
  - Support pagination and sorting
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\templates.ts`, `src\services\template.service.ts`
  - **Success:** Returns public templates

- [ ] 14.2 Implement GET /templates/:id endpoint
  - Allow unauthenticated access for public templates
  - Return full template data
  - Return 404 if not public and not owner
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\templates.ts`
  - **Success:** Returns template details

- [ ] 14.3 Implement POST /templates/:id/instantiate endpoint
  - Require authentication
  - Load template
  - Create agent or workflow from template
  - Apply customizations from request body
  - Increment template usageCount
  - Return created resource (201 Created)
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\templates.ts`
  - **Success:** Can instantiate templates

**Acceptance Criteria:**
- Public templates accessible without auth
- Template search and filtering working
- Template instantiation functional

---

### Task Group 15: Deployments API
**Dependencies:** Task Group 13
**Effort:** L (10-12 hours)
**Priority:** Medium

- [ ] 15.1 Implement GET /deployments endpoint
  - Filter by environment, status
  - Include related workflow/agent info
  - Support pagination
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\deployments.ts`, `src\services\deployment.service.ts`
  - **Success:** Returns deployments

- [ ] 15.2 Implement GET /deployments/:id endpoint
  - Return full deployment details
  - Mask sensitive environment variables
  - Include health status
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\deployments.ts`
  - **Success:** Returns deployment details

- [ ] 15.3 Implement POST /deployments endpoint
  - Validate deployment configuration
  - Create deployment record
  - Encrypt environment variables
  - Set initial status to STOPPED
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\deployments.ts`
  - **Success:** Can create deployments

- [ ] 15.4 Implement PATCH /deployments/:id endpoint
  - Update deployment configuration
  - Re-encrypt environment variables if changed
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\deployments.ts`
  - **Success:** Can update deployments

- [ ] 15.5 Implement DELETE /deployments/:id endpoint
  - Stop deployment if running
  - Soft delete deployment
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\deployments.ts`
  - **Success:** Deployments deleted

- [ ] 15.6 Implement POST /deployments/:id/start endpoint
  - Validate deployment exists and is stopped
  - Update status to STARTING
  - (Future: actually start the deployment)
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\deployments.ts`
  - **Success:** Can start deployments

- [ ] 15.7 Implement POST /deployments/:id/stop endpoint
  - Validate deployment is running
  - Update status to STOPPING
  - (Future: actually stop the deployment)
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\deployments.ts`
  - **Success:** Can stop deployments

- [ ] 15.8 Implement GET /deployments/:id/logs endpoint
  - Query logs from database or log storage
  - Support filtering by level, since timestamp
  - Support tail (last N lines)
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\deployments.ts`
  - **Success:** Returns deployment logs

**Acceptance Criteria:**
- All 8 deployment endpoints implemented
- Environment variable encryption working
- Deployment lifecycle management functional
- Logs accessible

---

### Task Group 16: Analytics API
**Dependencies:** Task Group 13
**Effort:** M (8-10 hours)
**Priority:** Low

- [ ] 16.1 Implement GET /analytics/overview endpoint
  - Require authentication
  - Calculate aggregate metrics (total agents, workflows, executions)
  - Calculate success/failure rates
  - Calculate average execution time
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\analytics.ts`, `src\services\analytics.service.ts`
  - **Success:** Returns overview metrics

- [ ] 16.2 Implement GET /analytics/agents/:id/metrics endpoint
  - Load agent execution metrics
  - Calculate performance percentiles (p50, p95, p99)
  - Calculate reliability metrics (success rate, failure rate)
  - Group by time period (hour/day/week/month)
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\analytics.ts`
  - **Success:** Returns agent metrics

- [ ] 16.3 Implement GET /analytics/workflows/:id/metrics endpoint
  - Similar to agent metrics
  - Include step-level metrics
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\analytics.ts`
  - **Success:** Returns workflow metrics

- [ ] 16.4 Implement GET /analytics/system-health endpoint
  - Require admin role
  - Check database health
  - Check Redis health
  - Check queue health
  - Return API metrics (requests/min, avg response time, error rate)
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\analytics.ts`
  - **Success:** Returns system health

**Acceptance Criteria:**
- Analytics endpoints return meaningful metrics
- Performance calculations correct
- Admin-only endpoints protected

---

### Task Group 17: Execution Endpoints
**Dependencies:** Task Group 13
**Effort:** M (6-8 hours)
**Priority:** High

- [ ] 17.1 Implement GET /executions/:id endpoint
  - Load execution with workflow info
  - Include input/output data
  - Include step completion counts
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\executions.ts`, `src\services\execution.service.ts`
  - **Success:** Returns execution details

- [ ] 17.2 Implement GET /executions/:id/logs endpoint
  - Load execution logs
  - Filter by level, stepKey
  - Order by createdAt
  - Support pagination
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\executions.ts`
  - **Success:** Returns execution logs

- [ ] 17.3 Implement POST /executions/:id/cancel endpoint
  - Validate execution is running
  - Update status to CANCELLED
  - (Future: actually cancel running execution)
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\executions.ts`
  - **Success:** Can cancel executions

**Acceptance Criteria:**
- Can view execution details
- Can view execution logs
- Can cancel running executions

---

## Phase 5.5: Agent Core Engine (Week 3-4)

### Task Group 18: Job Queue Setup
**Dependencies:** Phase 5.4 complete
**Effort:** L (10-12 hours)
**Priority:** Critical

- [ ] 18.1 Setup Redis for BullMQ
  - Configure Redis connection for queue
  - Use Upstash Redis (free tier) or local Redis
  - Set REDIS_URL environment variable
  - Test Redis connection
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\lib\redis.ts`
  - **Success:** Can connect to Redis

- [ ] 18.2 Install and configure BullMQ
  - Install BullMQ: `npm install bullmq`
  - Create `src/queue/index.ts` with queue configuration
  - Create queue: `agent-execution`
  - Configure retry policy (3 attempts, exponential backoff)
  - Configure job retention (completed: 24h, failed: 7 days)
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\queue\index.ts`
  - **Success:** BullMQ queue created

- [ ] 18.3 Create job processors
  - Create `src/queue/processors/agentExecutor.ts`
  - Implement job processor function
  - Add error handling and retries
  - Log job progress
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\queue\processors\agentExecutor.ts`
  - **Success:** Job processor can execute jobs

- [ ] 18.4 Create worker for job processing
  - Create `src/queue/worker.ts`
  - Initialize BullMQ worker
  - Configure concurrency (10 concurrent jobs)
  - Configure rate limiting (100 jobs/min)
  - Add event handlers (completed, failed, progress)
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\queue\worker.ts`
  - **Success:** Worker processes queued jobs

- [ ] 18.5 Create queue monitoring utilities
  - Create `src/queue/monitor.ts`
  - Get queue metrics (active, completed, failed counts)
  - Get job status
  - Get worker status
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\queue\monitor.ts`
  - **Success:** Can monitor queue health

**Acceptance Criteria:**
- BullMQ configured with Redis
- Job queue operational
- Worker processing jobs
- Queue monitoring working

---

### Task Group 19: Workflow Execution Engine
**Dependencies:** Task Group 18
**Effort:** XL (16-20 hours)
**Priority:** Critical

- [ ] 19.1 Create WorkflowExecutor class
  - Create `src/engine/WorkflowExecutor.ts`
  - Initialize with workflow, execution, and context
  - Store step state in memory during execution
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\engine\WorkflowExecutor.ts`
  - **Success:** WorkflowExecutor class structure complete

- [ ] 19.2 Implement DAG validation
  - Create `validateDAG()` method
  - Detect cycles using DFS
  - Validate all step dependencies exist
  - Validate agent references
  - Throw error if validation fails
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\engine\WorkflowExecutor.ts`
  - **Success:** Cycles and invalid workflows detected

- [ ] 19.3 Implement topological sort
  - Create `topologicalSort()` method
  - Use Kahn's algorithm
  - Return execution order as array of step IDs
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\engine\WorkflowExecutor.ts`
  - **Success:** Steps ordered correctly for execution

- [ ] 19.4 Implement input resolution
  - Create `resolveInputs()` method
  - Replace template variables like `{{inputs.data}}` and `{{step1.output}}`
  - Support nested object paths
  - Handle missing references gracefully
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\engine\WorkflowExecutor.ts`
  - **Success:** Template variables resolved

- [ ] 19.5 Implement step executor
  - Create `executeStep()` method
  - Log step start
  - Resolve step inputs
  - Execute based on step type (agent, condition, loop, parallel, wait)
  - Handle errors and retries
  - Log step completion
  - Store step output
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\engine\WorkflowExecutor.ts`
  - **Success:** Steps execute successfully

- [ ] 19.6 Implement main execution flow
  - Create `execute()` method
  - Load workflow from database
  - Validate DAG
  - Create execution record
  - Update status to RUNNING
  - Execute steps in topological order
  - Handle dependencies (wait for dependent steps)
  - Update execution status to COMPLETED or FAILED
  - Calculate execution duration
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\engine\WorkflowExecutor.ts`
  - **Success:** Complete workflows execute

- [ ] 19.7 Implement error handling and recovery
  - Create `handleExecutionError()` method
  - Create `handleStepError()` method
  - Implement retry logic based on step configuration
  - Implement error strategies: fail, continue, retry
  - Log errors to execution logs
  - Update execution status appropriately
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\engine\WorkflowExecutor.ts`
  - **Success:** Errors handled gracefully

**Acceptance Criteria:**
- WorkflowExecutor can execute complete workflows
- DAG validation working
- Step dependencies resolved
- Error handling functional
- Execution state persisted

---

### Task Group 20: Agent Execution Implementation
**Dependencies:** Task Group 19
**Effort:** XL (14-18 hours)
**Priority:** Critical

- [ ] 20.1 Create AgentExecutor base class
  - Create `src/engine/agents/AgentExecutor.ts`
  - Define interface for all agent executors
  - Implement common execution logic (timeout, resource limits)
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\engine\agents\AgentExecutor.ts`
  - **Success:** Base executor class defined

- [ ] 20.2 Implement CodeAgent executor
  - Create `src/engine/agents/CodeAgentExecutor.ts`
  - Support Python and Node.js runtimes
  - Execute code in Docker container (or sandbox)
  - Set memory and CPU limits
  - Set execution timeout
  - Capture stdout and stderr
  - Return execution result
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\engine\agents\CodeAgentExecutor.ts`
  - **Success:** Can execute code agents

- [ ] 20.3 Implement ApiAgent executor
  - Create `src/engine/agents/ApiAgentExecutor.ts`
  - Make HTTP requests using axios or fetch
  - Support all HTTP methods (GET, POST, PUT, PATCH, DELETE)
  - Support authentication (bearer, basic, api key)
  - Implement retry logic
  - Handle timeouts
  - Return response data
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\engine\agents\ApiAgentExecutor.ts`
  - **Success:** Can execute API agents

- [ ] 20.4 Implement LLMAgent executor
  - Create `src/engine/agents/LLMAgentExecutor.ts`
  - Support OpenAI integration
  - Support Anthropic integration (optional)
  - Send prompt to LLM
  - Handle streaming responses (optional)
  - Parse and return response
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\engine\agents\LLMAgentExecutor.ts`
  - **Success:** Can execute LLM agents

- [ ] 20.5 Implement DataAgent executor
  - Create `src/engine/agents/DataAgentExecutor.ts`
  - Support operations: filter, map, reduce, sort, group
  - Execute data transformations in JavaScript
  - Validate output format
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\engine\agents\DataAgentExecutor.ts`
  - **Success:** Can execute data agents

- [ ] 20.6 Create agent executor factory
  - Create `src/engine/agents/index.ts`
  - Implement factory function to select executor by agent type
  - Return appropriate executor instance
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\engine\agents\index.ts`
  - **Success:** Factory returns correct executor

**Acceptance Criteria:**
- All 5 agent types can execute
- Resource limits enforced
- Timeouts working
- Errors handled properly

---

### Task Group 21: Execution Monitoring
**Dependencies:** Task Group 19, 20
**Effort:** M (6-8 hours)
**Priority:** Medium

- [ ] 21.1 Implement execution logging
  - Create `logExecutionEvent()` utility
  - Log to execution_logs table
  - Include level, message, metadata
  - Include step information if applicable
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\services\logging.service.ts`
  - **Success:** Execution events logged

- [ ] 21.2 Implement execution metrics collection
  - Create `collectExecutionMetrics()` utility
  - Calculate step durations
  - Calculate execution percentiles (p50, p95, p99)
  - Track success/failure counts
  - Update workflow metrics
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\services\metrics.service.ts`
  - **Success:** Metrics collected and stored

- [ ] 21.3 Create real-time execution status tracking
  - Update execution record throughout workflow execution
  - Update step completion counts
  - Store intermediate results (optional)
  - **Files:** Updated in WorkflowExecutor
  - **Success:** Execution status reflects current state

**Acceptance Criteria:**
- Execution logs captured
- Metrics calculated
- Real-time status updates

---

## Phase 5.6: Testing Infrastructure (Week 4)

### Task Group 22: Unit Test Setup
**Dependencies:** All implementation complete
**Effort:** M (6-8 hours)
**Priority:** High

- [ ] 22.1 Configure Jest for unit testing
  - Create `jest.config.js` for unit tests
  - Configure TypeScript support with ts-jest
  - Set coverage thresholds (80% overall)
  - Configure test environment (node)
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\jest.config.js`
  - **Success:** Jest runs unit tests

- [ ] 22.2 Create test setup file
  - Create `src/__tests__/setup.ts`
  - Setup global test utilities
  - Configure test database
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\__tests__\setup.ts`
  - **Success:** Test setup runs before tests

- [ ] 22.3 Create Prisma mock for unit tests
  - Create `src/__tests__/mocks/prisma.ts`
  - Mock Prisma client with jest-mock-extended
  - Export mock for use in tests
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\__tests__\mocks\prisma.ts`
  - **Success:** Can mock Prisma in tests

**Acceptance Criteria:**
- Jest configured
- Test setup working
- Mocks available

---

### Task Group 23: Service Layer Tests (Write 2-8 focused tests)
**Dependencies:** Task Group 22
**Effort:** M (8-10 hours)
**Priority:** High

- [ ] 23.1 Write AgentService tests (2-8 tests)
  - Test `createAgent()` - successful creation
  - Test `createAgent()` - validation error
  - Test `updateAgent()` - successful update
  - Test `deleteAgent()` - soft delete
  - Test `listAgents()` - pagination and filtering
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\services\__tests__\agent.service.test.ts`
  - **Success:** AgentService tests pass

- [ ] 23.2 Write WorkflowService tests (2-8 tests)
  - Test `createWorkflow()` - with steps
  - Test `validateDAG()` - cycle detection
  - Test `updateWorkflow()` - step updates
  - Test `executeWorkflow()` - queues execution
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\services\__tests__\workflow.service.test.ts`
  - **Success:** WorkflowService tests pass

- [ ] 23.3 Write AuthService tests (2-8 tests)
  - Test `register()` - new user
  - Test `login()` - valid credentials
  - Test `login()` - invalid credentials
  - Test `refreshToken()` - valid token
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\services\__tests__\auth.service.test.ts`
  - **Success:** AuthService tests pass

- [ ] 23.4 Write utility function tests (2-8 tests)
  - Test password validation
  - Test email validation
  - Test input sanitization
  - Test JWT generation and verification
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\utils\__tests__\*.test.ts`
  - **Success:** Utility tests pass

- [ ] 23.5 Run service layer tests and verify coverage
  - Run `npm run test:unit`
  - Verify service layer coverage > 90%
  - Fix any failing tests
  - **Success:** All service tests pass, coverage meets target

**Acceptance Criteria:**
- 6-32 total service layer tests written (2-8 per service)
- All tests pass
- Service layer coverage > 90%

---

### Task Group 24: Integration Test Setup
**Dependencies:** Task Group 23
**Effort:** M (6-8 hours)
**Priority:** High

- [ ] 24.1 Configure test database
  - Create separate test database on Supabase or use local PostgreSQL
  - Set TEST_DATABASE_URL environment variable
  - Create test database setup/teardown scripts
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\__tests__\integration\setup.ts`
  - **Success:** Test database isolated from dev database

- [ ] 24.2 Create database cleanup utilities
  - Create function to clear all tables
  - Create function to reset sequences
  - Run cleanup before each test
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\__tests__\integration\helpers\dbCleanup.ts`
  - **Success:** Database cleaned between tests

- [ ] 24.3 Create test data factories
  - Create user factory
  - Create agent factory
  - Create workflow factory
  - Create execution factory
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\__tests__\factories\*.ts`
  - **Success:** Can easily create test data

- [ ] 24.4 Create authentication helpers
  - Create `generateTestToken()` helper
  - Create `authenticatedRequest()` helper
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\__tests__\integration\helpers\auth.ts`
  - **Success:** Can easily authenticate in tests

**Acceptance Criteria:**
- Test database configured
- Database cleanup working
- Test factories created
- Auth helpers available

---

### Task Group 25: API Integration Tests (Write 2-8 focused tests per API)
**Dependencies:** Task Group 24
**Effort:** XL (14-18 hours)
**Priority:** High

- [ ] 25.1 Write Auth API tests (2-8 tests)
  - Test POST /auth/register - successful registration
  - Test POST /auth/login - successful login
  - Test POST /auth/login - invalid credentials (401)
  - Test POST /auth/refresh - token refresh
  - Test POST /auth/logout - session invalidation
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\__tests__\integration\auth.api.test.ts`
  - **Success:** Auth API tests pass

- [ ] 25.2 Write Agents API tests (2-8 tests)
  - Test POST /agents - create agent (201)
  - Test POST /agents - validation error (400)
  - Test POST /agents - unauthorized (401)
  - Test GET /agents - list agents with pagination
  - Test GET /agents - filter by type
  - Test GET /agents/:id - get agent details
  - Test PATCH /agents/:id - update agent
  - Test DELETE /agents/:id - soft delete
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\__tests__\integration\agents.api.test.ts`
  - **Success:** Agents API tests pass

- [ ] 25.3 Write Workflows API tests (2-8 tests)
  - Test POST /workflows - create workflow with steps
  - Test GET /workflows/:id - get workflow with steps
  - Test PATCH /workflows/:id - update workflow
  - Test POST /workflows/:id/execute - trigger execution
  - Test GET /workflows/:id/executions - execution history
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\__tests__\integration\workflows.api.test.ts`
  - **Success:** Workflows API tests pass

- [ ] 25.4 Write Templates API tests (2-8 tests)
  - Test GET /templates - list public templates (no auth)
  - Test GET /templates/:id - get template details
  - Test POST /templates/:id/instantiate - create from template
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\__tests__\integration\templates.api.test.ts`
  - **Success:** Templates API tests pass

- [ ] 25.5 Write Executions API tests (2-8 tests)
  - Test GET /executions/:id - execution details
  - Test GET /executions/:id/logs - execution logs
  - Test POST /executions/:id/cancel - cancel execution
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\__tests__\integration\executions.api.test.ts`
  - **Success:** Executions API tests pass

- [ ] 25.6 Run integration tests and verify coverage
  - Run `npm run test:integration`
  - Verify API route coverage = 100%
  - Fix any failing tests
  - **Success:** All API tests pass, 100% route coverage

**Acceptance Criteria:**
- 10-40 total API tests written (2-8 per API group)
- All tests pass
- API routes have 100% coverage

---

### Task Group 26: E2E Test Setup
**Dependencies:** Task Group 25
**Effort:** M (6-8 hours)
**Priority:** Medium

- [ ] 26.1 Install and configure Playwright
  - Install Playwright: `npm install -D @playwright/test`
  - Run `npx playwright install`
  - Create `playwright.config.ts`
  - Configure base URL, timeout, retries
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\playwright.config.ts`
  - **Success:** Playwright installed

- [ ] 26.2 Create E2E test helpers
  - Create login helper
  - Create navigation helpers
  - Create assertion helpers
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\e2e\helpers\*.ts`
  - **Success:** E2E helpers available

**Acceptance Criteria:**
- Playwright configured
- E2E helpers created

---

### Task Group 27: E2E Tests (Write 2-8 critical flow tests)
**Dependencies:** Task Group 26
**Effort:** L (10-12 hours)
**Priority:** Medium

- [ ] 27.1 Write user registration and login flow test
  - Test complete flow: register -> login -> view dashboard
  - Verify user can access protected pages
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\e2e\auth.spec.ts`
  - **Success:** Auth flow test passes

- [ ] 27.2 Write agent creation flow test
  - Test: login -> create agent -> view agent list -> view agent details
  - Verify agent appears in list
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\e2e\agent-workflow.spec.ts`
  - **Success:** Agent creation test passes

- [ ] 27.3 Write workflow execution flow test
  - Test: login -> create workflow -> execute workflow -> view results
  - Verify workflow executes successfully
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\e2e\workflow-execution.spec.ts`
  - **Success:** Workflow execution test passes

- [ ] 27.4 Run E2E tests
  - Run `npm run test:e2e`
  - Fix any failing tests
  - **Success:** All E2E tests pass

**Acceptance Criteria:**
- 2-8 E2E tests covering critical user journeys
- All tests pass
- E2E tests catch integration issues

---

### Task Group 28: Test Review & Gap Analysis
**Dependencies:** Task Groups 23, 25, 27
**Effort:** M (6-8 hours)
**Priority:** High

- [ ] 28.1 Review all existing tests
  - Review ~6-32 service tests from Task Group 23
  - Review ~10-40 API tests from Task Group 25
  - Review ~2-8 E2E tests from Task Group 27
  - Total existing: approximately 18-80 tests
  - **Success:** All test groups reviewed

- [ ] 28.2 Analyze test coverage gaps for Phase 5 features
  - Identify critical workflows lacking coverage
  - Focus ONLY on Phase 5 feature requirements
  - Prioritize end-to-end workflows over unit test gaps
  - **Success:** Coverage gaps identified

- [ ] 28.3 Write up to 10 additional strategic tests maximum
  - Fill critical gaps in test coverage
  - Focus on integration points and workflows
  - Do NOT write comprehensive coverage
  - Skip edge cases unless business-critical
  - **Files:** Various test files
  - **Success:** Critical gaps filled (max 10 tests added)

- [ ] 28.4 Run complete test suite for Phase 5 features
  - Run all unit, integration, and E2E tests
  - Expected total: approximately 28-90 tests
  - Verify critical workflows covered
  - **Success:** All feature tests pass

**Acceptance Criteria:**
- All Phase 5 tests pass (approximately 28-90 tests total)
- Critical workflows covered
- No more than 10 additional tests written
- Overall coverage > 80%

---

## Phase 5.7: Documentation & Deployment (Week 4)

### Task Group 29: API Documentation
**Dependencies:** All API endpoints complete
**Effort:** M (8-10 hours)
**Priority:** High

- [ ] 29.1 Install and configure Swagger/OpenAPI
  - Install swagger-jsdoc and swagger-ui-express
  - Create OpenAPI specification
  - Configure Swagger UI endpoint
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\swagger.ts`
  - **Success:** Swagger UI accessible

- [ ] 29.2 Document all auth endpoints
  - Add JSDoc comments to auth routes
  - Document request/response schemas
  - Add authentication requirements
  - Include example requests
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\src\routes\auth.ts`
  - **Success:** Auth endpoints documented in Swagger

- [ ] 29.3 Document all resource endpoints
  - Document agents, workflows, templates, deployments, executions endpoints
  - Add request/response schemas
  - Document query parameters
  - Add error responses
  - **Files:** Various route files
  - **Success:** All endpoints documented

- [ ] 29.4 Create authentication guide
  - Document JWT token flow
  - Document API key usage
  - Provide code examples
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\docs\authentication.md`
  - **Success:** Authentication clearly explained

- [ ] 29.5 Host interactive API docs
  - Serve Swagger UI at `/api/v1/docs`
  - Serve OpenAPI JSON at `/api/v1/openapi.json`
  - Make publicly accessible
  - **Success:** Interactive docs accessible

**Acceptance Criteria:**
- All endpoints documented in OpenAPI
- Swagger UI accessible
- Request/response schemas complete
- Authentication guide written

---

### Task Group 30: Developer Documentation
**Dependencies:** Phase 5.6 complete
**Effort:** M (6-8 hours)
**Priority:** High

- [ ] 30.1 Create backend architecture overview
  - Document system architecture
  - Explain component interactions
  - Diagram data flow
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\docs\architecture.md`
  - **Success:** Architecture clearly documented

- [ ] 30.2 Document database schema
  - Generate schema diagram from Prisma
  - Explain entity relationships
  - Document indexes and constraints
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\docs\database.md`
  - **Success:** Database schema explained

- [ ] 30.3 Create API integration guide
  - Show how to integrate with backend APIs
  - Provide code examples in JavaScript/TypeScript
  - Document common patterns
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\docs\api-integration.md`
  - **Success:** Integration guide complete

- [ ] 30.4 Document error handling
  - List all error codes
  - Explain error response format
  - Provide troubleshooting tips
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\docs\error-handling.md`
  - **Success:** Error handling documented

- [ ] 30.5 Create contributing guidelines
  - Document development workflow
  - Explain code style
  - Detail PR process
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\CONTRIBUTING.md`
  - **Success:** Contributing guide complete

**Acceptance Criteria:**
- Architecture documented
- Database schema explained
- API integration guide complete
- Error handling documented
- Contributing guidelines written

---

### Task Group 31: Deployment Setup
**Dependencies:** All implementation and testing complete
**Effort:** L (10-12 hours)
**Priority:** Critical

- [ ] 31.1 Configure production environment
  - Create production environment variables
  - Use strong JWT secrets
  - Configure production database
  - Setup production Redis
  - **Files:** `.env.production.example`
  - **Success:** Production env configured

- [ ] 31.2 Create CI/CD pipeline
  - Create `.github/workflows/test.yml`
  - Run tests on push and PR
  - Setup PostgreSQL and Redis services
  - Run migrations
  - Upload coverage reports
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\.github\workflows\test.yml`
  - **Success:** CI/CD pipeline runs tests

- [ ] 31.3 Create deployment scripts
  - Create build script
  - Create database migration script
  - Create health check script
  - Create rollback script
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\scripts\*.sh`
  - **Success:** Deployment scripts ready

- [ ] 31.4 Configure monitoring and logging
  - Setup error tracking (Sentry or similar)
  - Configure log aggregation
  - Setup performance monitoring
  - Create alerting rules
  - **Success:** Monitoring operational

- [ ] 31.5 Setup backup procedures
  - Configure automated database backups (Supabase handles this)
  - Document backup restoration process
  - Test backup restoration
  - **Success:** Backups configured and tested

- [ ] 31.6 Deploy to staging environment
  - Deploy backend to staging (Render, Railway, or similar)
  - Verify all endpoints working
  - Run smoke tests
  - **Success:** Staging deployment successful

**Acceptance Criteria:**
- Production environment configured
- CI/CD pipeline operational
- Deployment scripts created
- Monitoring setup
- Backups configured
- Staging deployment successful

---

### Task Group 32: Environment Configuration Documentation
**Dependencies:** Task Group 31
**Effort:** S (2-3 hours)
**Priority:** High

- [ ] 32.1 Document all environment variables
  - Create comprehensive .env.example
  - Explain each variable's purpose
  - Provide example values
  - Note which are required vs optional
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\.env.example`
  - **Success:** All env vars documented

- [ ] 32.2 Create environment-specific configurations
  - Document development setup
  - Document staging setup
  - Document production setup
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\docs\environment-setup.md`
  - **Success:** Environment setups documented

- [ ] 32.3 Create deployment checklist
  - List all pre-deployment steps
  - List all post-deployment verification steps
  - Include rollback procedures
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\docs\deployment-checklist.md`
  - **Success:** Deployment checklist complete

**Acceptance Criteria:**
- Environment variables documented
- Environment setups documented
- Deployment checklist created

---

## Final Verification & Handoff

### Task Group 33: Final Testing & Verification
**Dependencies:** All previous task groups
**Effort:** M (6-8 hours)
**Priority:** Critical

- [ ] 33.1 Run complete test suite
  - Run all unit tests: `npm run test:unit`
  - Run all integration tests: `npm run test:integration`
  - Run all E2E tests: `npm run test:e2e`
  - Verify coverage > 80%
  - **Success:** All tests pass, coverage meets target

- [ ] 33.2 Verify all API endpoints
  - Test each endpoint manually in Postman or similar
  - Verify response formats
  - Test error cases
  - Test authentication and authorization
  - **Success:** All endpoints working correctly

- [ ] 33.3 Load testing
  - Run load tests with Artillery or similar
  - Verify performance under load (95th percentile < 200ms)
  - Identify bottlenecks
  - **Success:** Performance targets met

- [ ] 33.4 Security audit
  - Run npm audit and fix vulnerabilities
  - Review security headers
  - Test authentication flows
  - Verify input validation
  - Check for exposed secrets
  - **Success:** No critical vulnerabilities

- [ ] 33.5 Code review
  - Review all code for quality
  - Check for code smells
  - Verify error handling
  - Check for proper logging
  - Ensure consistent style
  - **Success:** Code meets quality standards

**Acceptance Criteria:**
- All tests pass
- All endpoints verified
- Performance targets met
- No critical security issues
- Code review complete

---

### Task Group 34: Documentation Review & Handoff
**Dependencies:** Task Group 33
**Effort:** S (3-4 hours)
**Priority:** High

- [ ] 34.1 Review all documentation
  - Verify README is accurate
  - Check API docs are complete
  - Verify architecture docs are current
  - Test setup instructions with fresh environment
  - **Success:** Documentation is accurate and complete

- [ ] 34.2 Create onboarding guide for new developers
  - Write step-by-step setup guide
  - Include common troubleshooting
  - Provide links to all relevant docs
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\docs\onboarding.md`
  - **Success:** New developer can setup in <30 minutes

- [ ] 34.3 Create handoff document
  - Document what was built
  - List known issues or limitations
  - Provide recommendations for next phase
  - **Files:** `D:\009_Projects_AI\Personal_Projects\Turbocat\backend\HANDOFF.md`
  - **Success:** Handoff document complete

**Acceptance Criteria:**
- All documentation reviewed and accurate
- Onboarding guide complete
- Handoff document created

---

## Summary

### Total Task Count by Phase:
- **Phase 5.1**: Foundation Setup - 17 tasks
- **Phase 5.2**: Database Schema & Models - 21 tasks
- **Phase 5.3**: Authentication System - 18 tasks
- **Phase 5.4**: Core API Endpoints - 40 tasks
- **Phase 5.5**: Agent Core Engine - 26 tasks
- **Phase 5.6**: Testing Infrastructure - 23 tasks
- **Phase 5.7**: Documentation & Deployment - 18 tasks
- **Final Verification**: 8 tasks

**Total: ~171 tasks** (many are grouped sub-tasks)

### Critical Path:
1. Foundation Setup (Week 1)
2. Database Schema (Week 1-2)
3. Authentication (Week 2)
4. Core APIs (Week 2-3)
5. Agent Engine (Week 3-4)
6. Testing (Week 4)
7. Documentation & Deployment (Week 4)

### Success Metrics:
- All database migrations run successfully
- All API endpoints implemented and documented
- Authentication working end-to-end
- Agent execution engine can run simple workflows
- Frontend connects to backend successfully
- Test coverage >80%
- CI/CD pipeline operational
- Deployed to staging environment
- Complete and accurate documentation

### Key Deliverables:
- Functional backend API
- Complete database schema
- Authentication system
- Agent execution engine
- Comprehensive test suite
- API documentation
- Deployment pipeline
- Developer documentation

---

**End of Task Breakdown**

This task list provides a comprehensive roadmap for implementing Turbocat Phase 5. Tasks are organized by dependencies and effort, ensuring a logical implementation flow while maintaining quality through testing and documentation at each stage.
