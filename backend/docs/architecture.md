# Turbocat Backend Architecture

This document provides a comprehensive overview of the Turbocat backend architecture, explaining how components interact and data flows through the system.

## Table of Contents

- [Overview](#overview)
- [Architecture Diagram](#architecture-diagram)
- [Component Layers](#component-layers)
- [Data Flow](#data-flow)
- [Key Components](#key-components)
- [Security Architecture](#security-architecture)
- [Execution Engine](#execution-engine)
- [External Integrations](#external-integrations)

---

## Overview

Turbocat is a multi-agent orchestration platform that allows users to create, manage, and execute AI agents and workflows. The backend is built using a layered architecture pattern with clear separation of concerns.

### Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20+ |
| Framework | Express.js 5 |
| Language | TypeScript 5.9+ |
| Database | PostgreSQL (via Supabase) |
| ORM | Prisma 7 |
| Cache/Sessions | Redis (via Upstash) |
| Job Queue | BullMQ |
| Logging | Winston |
| API Documentation | Swagger/OpenAPI 3.0 |

### Design Principles

1. **Layered Architecture** - Clear separation between routes, services, and data access
2. **Dependency Injection** - Services receive dependencies rather than creating them
3. **Soft Deletes** - Data preservation with `deletedAt` timestamps
4. **Audit Trail** - All significant operations are logged
5. **Request Tracing** - Every request has a unique ID for debugging
6. **Graceful Degradation** - System continues operating when optional services are unavailable

---

## Architecture Diagram

```
                                    +------------------+
                                    |    Frontend      |
                                    |  (Next.js App)   |
                                    +--------+---------+
                                             |
                                             | HTTPS
                                             v
+-----------------------------------------------------------------------------------+
|                                  API Gateway Layer                                 |
|  +-------------+  +-------------+  +-------------+  +-------------+               |
|  |   CORS      |  |   Helmet    |  |  Rate       |  |  Request    |               |
|  |   Config    |  |   Security  |  |  Limiter    |  |  Logger     |               |
|  +-------------+  +-------------+  +-------------+  +-------------+               |
+-----------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------+
|                              Authentication Layer                                  |
|  +-------------------+  +-------------------+  +-------------------+               |
|  |  JWT Verification |  |  Session Validate |  |  API Key Auth    |               |
|  |  (Access Token)   |  |  (Redis Lookup)   |  |  (X-API-Key)     |               |
|  +-------------------+  +-------------------+  +-------------------+               |
+-----------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------+
|                                 Route Layer                                        |
|  /api/v1/                                                                         |
|  +--------+ +--------+ +----------+ +----------+ +------------+ +----------+      |
|  | /auth  | | /users | | /agents  | |/workflows| |/deployments| |/analytics|      |
|  +--------+ +--------+ +----------+ +----------+ +------------+ +----------+      |
|  +----------+ +------------+ +----------+                                         |
|  |/templates| |/executions | | /health  |                                         |
|  +----------+ +------------+ +----------+                                         |
+-----------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------+
|                               Service Layer                                        |
|  +---------------+  +---------------+  +------------------+  +---------------+    |
|  | AuthService   |  | AgentService  |  | WorkflowService  |  | DeployService |    |
|  +---------------+  +---------------+  +------------------+  +---------------+    |
|  +---------------+  +---------------+  +------------------+  +---------------+    |
|  | UserService   |  |TemplateService|  | ExecutionService |  |AnalyticsServ  |    |
|  +---------------+  +---------------+  +------------------+  +---------------+    |
|  +---------------+  +---------------+                                             |
|  |SessionService |  | LoggingService|                                             |
|  +---------------+  +---------------+                                             |
+-----------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------+
|                              Execution Engine                                      |
|  +--------------------+  +--------------------+  +--------------------+            |
|  | WorkflowExecutor   |  | AgentExecutors     |  | Job Processor      |            |
|  | - DAG Validation   |  | - CodeExecutor     |  | - BullMQ Worker    |            |
|  | - Topological Sort |  | - APIExecutor      |  | - Retry Logic      |            |
|  | - Input Resolution |  | - LLMExecutor      |  | - Concurrency      |            |
|  | - Error Handling   |  | - DataExecutor     |  | - Dead Letter Q    |            |
|  +--------------------+  +--------------------+  +--------------------+            |
+-----------------------------------------------------------------------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------+
|                              Data Access Layer                                     |
|  +--------------------+  +--------------------+  +--------------------+            |
|  | Prisma Client      |  | Query Helpers      |  | Database Health    |            |
|  | - Connection Pool  |  | - Pagination       |  | - Connection Test  |            |
|  | - Query Logging    |  | - Filtering        |  | - Response Time    |            |
|  | - Transactions     |  | - Sorting          |  | - Pool Metrics     |            |
|  +--------------------+  +--------------------+  +--------------------+            |
+-----------------------------------------------------------------------------------+
           |                         |                          |
           v                         v                          v
    +-------------+           +-------------+            +-------------+
    | PostgreSQL  |           |    Redis    |            |   External  |
    | (Supabase)  |           |  (Upstash)  |            |    APIs     |
    +-------------+           +-------------+            +-------------+
```

---

## Component Layers

### 1. API Gateway Layer

The gateway layer handles cross-cutting concerns for all incoming requests.

**Location:** `src/middleware/`

| Component | File | Purpose |
|-----------|------|---------|
| CORS | `security.ts` | Cross-origin request handling |
| Helmet | `security.ts` | Security headers (XSS, HSTS, CSP) |
| Request ID | `requestId.ts` | Unique request identification |
| Request Logger | `requestLogger.ts` | Structured request/response logging |
| Error Handler | `errorHandler.ts` | Global error handling and formatting |

### 2. Authentication Layer

Handles all authentication and authorization.

**Location:** `src/middleware/auth.ts`, `src/middleware/apiKey.ts`

| Component | Purpose |
|-----------|---------|
| `requireAuth` | JWT token verification middleware |
| `optionalAuth` | Authentication that allows anonymous access |
| `requireRole` | Role-based access control (ADMIN, USER, AGENT) |
| `requireOwnership` | Resource ownership validation |
| `apiKeyAuth` | API key authentication for service-to-service calls |

### 3. Route Layer

Express routers defining API endpoints.

**Location:** `src/routes/`

| Route | File | Description |
|-------|------|-------------|
| `/health` | `health.ts` | Health checks and monitoring |
| `/api/v1/auth` | `auth.ts` | Authentication (login, register, refresh) |
| `/api/v1/users` | `users.ts` | User profile management |
| `/api/v1/agents` | `agents.ts` | Agent CRUD operations |
| `/api/v1/workflows` | `workflows.ts` | Workflow management |
| `/api/v1/templates` | `templates.ts` | Template browsing |
| `/api/v1/deployments` | `deployments.ts` | Deployment lifecycle |
| `/api/v1/executions` | `executions.ts` | Execution monitoring |
| `/api/v1/analytics` | `analytics.ts` | Metrics and analytics |

### 4. Service Layer

Business logic implementation.

**Location:** `src/services/`

Services encapsulate all business logic and database interactions:

- **AgentService** - Agent CRUD, versioning, duplication
- **WorkflowService** - Workflow CRUD, step management
- **ExecutionService** - Execution creation, monitoring, cancellation
- **TemplateService** - Template browsing, instantiation
- **DeploymentService** - Deployment lifecycle management
- **AnalyticsService** - Metrics aggregation
- **AuthService** - User registration, login, password management
- **SessionService** - Redis session management

### 5. Execution Engine

Workflow and agent execution runtime.

**Location:** `src/engine/`

| Component | File | Purpose |
|-----------|------|---------|
| WorkflowExecutor | `WorkflowExecutor.ts` | Orchestrates workflow execution |
| AgentExecutor | `agents/AgentExecutor.ts` | Base class for agent execution |
| CodeAgentExecutor | `agents/CodeAgentExecutor.ts` | Executes code-based agents |
| APIAgentExecutor | `agents/ApiAgentExecutor.ts` | Executes API-based agents |
| LLMAgentExecutor | `agents/LLMAgentExecutor.ts` | Executes LLM-based agents |
| DataAgentExecutor | `agents/DataAgentExecutor.ts` | Executes data processing agents |

### 6. Data Access Layer

Database interactions and query utilities.

**Location:** `src/lib/`

| Component | File | Purpose |
|-----------|------|---------|
| Prisma Client | `prisma.ts` | Database connection singleton |
| Query Helpers | `queryHelpers.ts` | Pagination, filtering, sorting utilities |
| Redis Client | `redis.ts` | Redis connection for sessions/cache |

---

## Data Flow

### Request Lifecycle

```
1. HTTP Request Arrives
         |
         v
2. Security Middleware (CORS, Helmet, Headers)
         |
         v
3. Request ID Generation
         |
         v
4. Request Logging (Start)
         |
         v
5. Body Parsing (JSON)
         |
         v
6. Authentication (if required)
   - Extract Bearer token or API key
   - Verify JWT signature
   - Validate session in Redis
   - Attach user to request
         |
         v
7. Route Handler
   - Validate request body/params (Zod)
   - Call service layer
         |
         v
8. Service Layer
   - Execute business logic
   - Interact with database
   - Call external services
         |
         v
9. Response Formatting
   - Success: { success: true, data, meta }
   - Error: { success: false, error }
         |
         v
10. Request Logging (End)
         |
         v
11. HTTP Response Sent
```

### Workflow Execution Flow

```
1. Execution Request
   POST /api/v1/workflows/:id/execute
         |
         v
2. Create Execution Record
   - Status: PENDING
   - Store input data
         |
         v
3. Queue Job (BullMQ)
   - Add to workflow queue
   - Return execution ID
         |
         v
4. Worker Picks Up Job
         |
         v
5. WorkflowExecutor.execute()
   |
   +-- Load Workflow from DB
   |
   +-- Validate DAG (cycle detection)
   |
   +-- Topological Sort (execution order)
   |
   +-- For each step in order:
       |
       +-- Check dependencies completed
       |
       +-- Resolve input templates
       |   - {{inputs.data}}
       |   - {{step1.output}}
       |
       +-- Execute step with timeout
       |   - Call AgentExecutor
       |   - Handle retries
       |
       +-- Log step result
       |
       +-- Store output
         |
         v
6. Update Execution Record
   - Status: COMPLETED/FAILED
   - Duration, step counts
   - Output data
         |
         v
7. Update Workflow Metrics
   - Increment execution counts
   - Update success rate
```

---

## Key Components

### ApiError Class

Custom error class for consistent error responses.

**Location:** `src/utils/ApiError.ts`

```typescript
// Usage
throw ApiError.notFound('Agent not found');
throw ApiError.validation('Validation failed', [
  { field: 'email', message: 'Invalid email format' }
]);
throw ApiError.unauthorized('Token expired');
```

**Error Codes:**
- `BAD_REQUEST` - Invalid request format
- `VALIDATION_ERROR` - Request validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource already exists
- `TOO_MANY_REQUESTS` - Rate limit exceeded
- `INTERNAL_ERROR` - Unexpected server error
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable
- `DATABASE_ERROR` - Database operation failed

### JWT Token Management

**Location:** `src/utils/jwt.ts`

| Function | Purpose |
|----------|---------|
| `generateAccessToken` | Creates 15-minute access token |
| `generateRefreshToken` | Creates 7-day refresh token |
| `verifyAccessToken` | Validates access token |
| `verifyRefreshToken` | Validates refresh token |

### Session Management

**Location:** `src/services/session.service.ts`

Sessions are stored in Redis with:
- User ID and role
- IP address and user agent
- Creation and last access timestamps
- 7-day TTL with sliding expiration

---

## Security Architecture

### Authentication Flow

```
                    +----------------+
                    |    Client      |
                    +-------+--------+
                            |
        +-------------------+-------------------+
        |                   |                   |
        v                   v                   v
+-------+-------+   +-------+-------+   +-------+-------+
|    Login      |   |   API Call    |   |   Refresh     |
| POST /auth/   |   |  (Protected)  |   | POST /auth/   |
|    login      |   |               |   |   refresh     |
+-------+-------+   +-------+-------+   +-------+-------+
        |                   |                   |
        v                   v                   v
+---------------+   +---------------+   +---------------+
| Verify        |   | Verify JWT    |   | Verify        |
| Credentials   |   | Signature     |   | Refresh Token |
| (bcrypt)      |   |               |   |               |
+-------+-------+   +-------+-------+   +-------+-------+
        |                   |                   |
        v                   v                   v
+---------------+   +---------------+   +---------------+
| Create        |   | Validate      |   | Issue New     |
| Session       |   | Session       |   | Access Token  |
| (Redis)       |   | (Redis)       |   |               |
+-------+-------+   +-------+-------+   +-------+-------+
        |                   |                   |
        v                   v                   v
+---------------+   +---------------+   +---------------+
| Return        |   | Execute       |   | Return        |
| Token Pair    |   | Request       |   | Access Token  |
+---------------+   +---------------+   +---------------+
```

### Security Headers

Applied via Helmet middleware:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | DENY | Prevent clickjacking |
| `X-Content-Type-Options` | nosniff | Prevent MIME sniffing |
| `Strict-Transport-Security` | max-age=31536000 | Force HTTPS |
| `X-XSS-Protection` | 1; mode=block | XSS filtering |
| `Content-Security-Policy` | default-src 'self' | Content restrictions |

### API Key Authentication

For service-to-service communication:

```
X-API-Key: tk_live_abc123xyz789
           |    |
           |    +-- Unique key suffix
           +------- Prefix (tk_live_ or tk_test_)
```

API keys are:
- Hashed with SHA-256 before storage
- Scoped to specific operations
- Rate-limited per key
- Revocable at any time

---

## Execution Engine

### WorkflowExecutor

The WorkflowExecutor handles the complete workflow execution lifecycle:

1. **DAG Validation**
   - Detects cycles using three-color DFS
   - Validates step dependencies exist
   - Checks agent references

2. **Topological Sort**
   - Kahn's algorithm for ordering
   - Deterministic order for parallel steps
   - Ensures dependencies execute first

3. **Input Resolution**
   - Template variable substitution
   - `{{inputs.field}}` - Workflow inputs
   - `{{stepKey.output}}` - Previous step output
   - Nested path support: `{{step1.output.data.items}}`

4. **Error Handling**
   - `FAIL` - Stop workflow on error
   - `CONTINUE` - Mark failed, continue execution
   - `RETRY` - Retry with exponential backoff

### Agent Executors

Each agent type has a specialized executor:

| Type | Executor | Description |
|------|----------|-------------|
| CODE | CodeAgentExecutor | Executes JavaScript/TypeScript code |
| API | ApiAgentExecutor | Makes HTTP API calls |
| LLM | LLMAgentExecutor | Calls LLM providers (OpenAI, etc.) |
| DATA | DataAgentExecutor | Data transformation operations |
| WORKFLOW | WorkflowExecutor | Nested workflow execution |

---

## External Integrations

### Supabase (PostgreSQL)

- Primary database for all persistent data
- Connection pooling via PgBouncer (port 6543)
- Direct connection for migrations (port 5432)

### Redis (Upstash)

- Session storage with TTL
- Job queue backing store (BullMQ)
- Rate limiting counters
- Cache for frequently accessed data

### Future Integrations

- **OpenAI** - LLM agent execution
- **Anthropic** - Alternative LLM provider
- **Railway** - Container deployment
- **Vercel** - Serverless deployment

---

## Directory Structure

```
backend/
+-- src/
|   +-- app.ts              # Express app configuration
|   +-- server.ts           # Server entry point
|   +-- swagger.ts          # OpenAPI specification
|   +-- lib/
|   |   +-- prisma.ts       # Database client
|   |   +-- redis.ts        # Redis client
|   |   +-- logger.ts       # Winston logger
|   |   +-- queryHelpers.ts # Query utilities
|   +-- middleware/
|   |   +-- auth.ts         # JWT authentication
|   |   +-- apiKey.ts       # API key authentication
|   |   +-- errorHandler.ts # Error handling
|   |   +-- security.ts     # Security headers
|   +-- routes/
|   |   +-- auth.ts         # Auth endpoints
|   |   +-- agents.ts       # Agent endpoints
|   |   +-- workflows.ts    # Workflow endpoints
|   |   +-- ...
|   +-- services/
|   |   +-- agent.service.ts
|   |   +-- workflow.service.ts
|   |   +-- auth.service.ts
|   |   +-- ...
|   +-- engine/
|   |   +-- WorkflowExecutor.ts
|   |   +-- agents/
|   |       +-- AgentExecutor.ts
|   |       +-- CodeAgentExecutor.ts
|   |       +-- ...
|   +-- queue/
|   |   +-- index.ts        # Queue setup
|   |   +-- worker.ts       # Job worker
|   +-- utils/
|       +-- ApiError.ts     # Custom error class
|       +-- jwt.ts          # JWT utilities
+-- prisma/
|   +-- schema.prisma       # Database schema
|   +-- migrations/         # Migration files
|   +-- seed.ts             # Seed data
+-- tests/
|   +-- unit/
|   +-- integration/
|   +-- e2e/
+-- docs/
    +-- architecture.md     # This document
    +-- database.md         # Schema documentation
    +-- api-integration.md  # Integration guide
    +-- error-handling.md   # Error documentation
```

---

## Performance Considerations

### Database Optimization

- Connection pooling (default 10 connections)
- Indexes on frequently queried fields
- Soft deletes to preserve data integrity
- Pagination for large result sets

### Caching Strategy

- Session data in Redis (7-day TTL)
- Rate limit counters (1-minute window)
- Future: Query result caching

### Scalability

- Stateless API servers (horizontal scaling)
- Redis for shared state
- BullMQ for distributed job processing
- Database connection pooling

---

**Last Updated:** January 7, 2026
