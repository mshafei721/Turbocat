# Turbocat Architecture Diagrams

Visual representations of the Turbocat system architecture for Phase 5.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Next.js 15 Frontend (Port 3000)                              │  │
│  │  - React Server Components                                    │  │
│  │  - shadcn/ui Components                                       │  │
│  │  - 8 Pages: Dashboard, Agents, Workflows, Templates, etc.    │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ HTTPS/REST API
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                      API GATEWAY LAYER                               │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Express.js Server (Port 3001)                                │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐        │  │
│  │  │ Middleware  │  │ Route        │  │ Error        │        │  │
│  │  │ - Auth      │→ │ Handlers     │→ │ Handler      │        │  │
│  │  │ - Validation│  │ - Agents     │  │ - Logging    │        │  │
│  │  │ - CORS      │  │ - Workflows  │  │ - Response   │        │  │
│  │  │ - Rate Limit│  │ - Auth       │  │              │        │  │
│  │  └─────────────┘  └──────────────┘  └──────────────┘        │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐    ┌──────────────────┐   ┌─────────────────┐
│ AUTH SERVICE  │    │ BUSINESS LOGIC   │   │  AGENT ENGINE   │
│               │    │                  │   │                 │
│ Supabase Auth │    │ ┌──────────────┐ │   │ ┌─────────────┐ │
│ - Register    │    │ │ AgentService │ │   │ │ Workflow    │ │
│ - Login       │    │ │ WorkflowSvc  │ │   │ │ Executor    │ │
│ - JWT Verify  │    │ │ TemplateSvc  │ │   │ ├─────────────┤ │
│ - Sessions    │    │ │ DeploySvc    │ │   │ │ DAG Parser  │ │
│               │    │ └──────────────┘ │   │ │ Step Runner │ │
└───────┬───────┘    └────────┬─────────┘   │ │ Job Queue   │ │
        │                     │              │ └─────────────┘ │
        │                     │              └────────┬────────┘
        │                     │                       │
        │                     │              ┌────────▼────────┐
        │                     │              │  JOB QUEUE      │
        │                     │              │  (BullMQ)       │
        │                     │              │                 │
        │                     │              │ Redis (Upstash) │
        │                     │              │ - Agent Jobs    │
        │                     │              │ - Retry Logic   │
        │                     │              │ - Priority      │
        │                     │              └─────────────────┘
        │                     │
        └─────────────────────┼──────────────────────┐
                              │                      │
                     ┌────────▼────────┐             │
                     │  DATA LAYER     │             │
                     │  (Prisma ORM)   │             │
                     │                 │             │
                     │ - Type-safe     │             │
                     │ - Migrations    │             │
                     │ - Queries       │             │
                     └────────┬────────┘             │
                              │                      │
                     ┌────────▼────────┐             │
                     │   DATABASE      │             │
                     │  PostgreSQL 15  │             │
                     │  (Supabase)     │             │
                     │                 │             │
                     │ - Users         │             │
                     │ - Agents        │             │
                     │ - Workflows     │             │
                     │ - Executions    │             │
                     │ - Logs          │             │
                     └─────────────────┘             │
                                                     │
                              ┌──────────────────────┘
                              │
                     ┌────────▼────────┐
                     │  MONITORING     │
                     │                 │
                     │ - Execution     │
                     │   Tracking      │
                     │ - Metrics       │
                     │ - Health Checks │
                     │ - Audit Logs    │
                     └─────────────────┘
```

---

## Database Entity Relationship Diagram

```
┌─────────────┐
│    Users    │
│─────────────│
│ id (PK)     │
│ email       │
│ password    │
│ role        │
│ ...         │
└──────┬──────┘
       │ 1
       │
       │ *
┌──────┴──────┐         ┌───────────────┐
│   Agents    │────────▶│  Templates    │
│─────────────│  uses   │───────────────│
│ id (PK)     │         │ id (PK)       │
│ userId (FK) │         │ name          │
│ name        │         │ type          │
│ type        │         │ templateData  │
│ config      │         │ ...           │
│ status      │         └───────────────┘
│ ...         │
└──────┬──────┘
       │ 1
       │
       │ *
┌──────┴──────────┐
│   Workflows     │
│─────────────────│
│ id (PK)         │
│ userId (FK)     │
│ name            │
│ definition      │
│ schedule        │
│ ...             │
└──────┬──────────┘
       │ 1
       │
       │ *
┌──────┴────────────┐
│  WorkflowSteps    │
│───────────────────│
│ id (PK)           │
│ workflowId (FK)   │
│ agentId (FK)      │
│ stepKey           │
│ position          │
│ dependsOn         │
│ ...               │
└───────────────────┘
       │
       │ workflow_id
       │
       ▼
┌───────────────────┐       ┌──────────────────┐
│   Executions      │──────▶│  ExecutionLogs   │
│───────────────────│   1:* │──────────────────│
│ id (PK)           │       │ id (PK)          │
│ workflowId (FK)   │       │ executionId (FK) │
│ userId (FK)       │       │ level            │
│ status            │       │ message          │
│ startedAt         │       │ stepKey          │
│ completedAt       │       │ ...              │
│ ...               │       └──────────────────┘
└───────────────────┘
       │
       │ workflow_id
       │
       ▼
┌───────────────────┐
│   Deployments     │
│───────────────────│
│ id (PK)           │
│ workflowId (FK)   │
│ userId (FK)       │
│ environment       │
│ status            │
│ endpointUrl       │
│ ...               │
└───────────────────┘

Other Tables:
┌───────────────┐    ┌──────────────┐
│   ApiKeys     │    │  AuditLogs   │
│───────────────│    │──────────────│
│ id (PK)       │    │ id (PK)      │
│ userId (FK)   │    │ userId (FK)  │
│ keyHash       │    │ action       │
│ scopes        │    │ resourceType │
│ ...           │    │ ...          │
└───────────────┘    └──────────────┘
```

---

## API Request Flow

```
1. Client Request
   │
   ├─→ POST /api/v1/agents
   │   Content-Type: application/json
   │   Authorization: Bearer eyJhbGci...
   │   {
   │     "name": "My Agent",
   │     "type": "code",
   │     "config": {...}
   │   }
   │
   ▼
2. Express Middleware Chain
   │
   ├─→ CORS Middleware
   │   ├─ Check origin
   │   └─ Set headers
   │
   ├─→ Auth Middleware
   │   ├─ Extract JWT token
   │   ├─ Verify token
   │   ├─ Attach user to req.user
   │   └─ Next()
   │
   ├─→ Validation Middleware
   │   ├─ Parse request body
   │   ├─ Validate with Zod schema
   │   └─ Next() or throw ValidationError
   │
   ▼
3. Route Handler
   │
   ├─→ Call AgentService.create()
   │   │
   │   ├─→ Business logic validation
   │   │
   │   └─→ Prisma database query
   │       │
   │       └─→ INSERT INTO agents...
   │
   ▼
4. Response
   │
   ├─→ Format response
   │   {
   │     "success": true,
   │     "data": {
   │       "id": "uuid",
   │       "name": "My Agent",
   │       ...
   │     },
   │     "meta": {
   │       "timestamp": "2026-01-05T...",
   │       "requestId": "uuid"
   │     }
   │   }
   │
   └─→ Send 201 Created
```

---

## Workflow Execution Flow

```
1. Trigger Workflow
   │
   POST /api/v1/workflows/:id/execute
   │
   ▼
2. Create Execution Record
   │
   ├─→ INSERT INTO executions
   │   - status: 'pending'
   │   - workflowId
   │   - userId
   │   - inputData
   │
   ▼
3. Parse Workflow DAG
   │
   ├─→ Load workflow definition
   ├─→ Validate DAG (no cycles)
   ├─→ Topological sort (execution order)
   │
   ▼
4. Execute Steps in Order
   │
   For each step:
   │
   ├─→ Wait for dependencies
   │   (Check if all dependsOn steps completed)
   │
   ├─→ Resolve inputs
   │   (Replace {{inputs.data}} with actual values)
   │
   ├─→ Queue job in BullMQ
   │   {
   │     agentId: "uuid",
   │     config: {...},
   │     inputs: {...}
   │   }
   │
   ├─→ Worker picks up job
   │   │
   │   ├─→ Execute agent
   │   │   (Code/API/LLM based on type)
   │   │
   │   ├─→ Store output
   │   │
   │   └─→ Log result
   │       INSERT INTO execution_logs
   │
   ├─→ Update step state
   │   (completed/failed)
   │
   └─→ Continue to next step
   │
   ▼
5. Complete Execution
   │
   ├─→ UPDATE executions
   │   - status: 'completed'
   │   - completedAt: NOW()
   │   - outputData: {...}
   │   - durationMs: ...
   │
   └─→ Return result to client
       {
         "success": true,
         "data": {
           "executionId": "uuid",
           "status": "completed",
           "output": {...}
         }
       }
```

---

## Authentication Flow

```
┌──────────┐                                    ┌──────────┐
│  Client  │                                    │  Server  │
└────┬─────┘                                    └────┬─────┘
     │                                                │
     │ 1. POST /auth/register                         │
     │    { email, password, fullName }               │
     ├───────────────────────────────────────────────▶│
     │                                                │
     │                                    2. Hash password
     │                                    3. Create user in DB
     │                                    4. Generate JWT tokens
     │                                                │
     │ 5. Return tokens                               │
     │◀───────────────────────────────────────────────┤
     │    {                                           │
     │      accessToken: "eyJhbGci...",               │
     │      refreshToken: "eyJhbGci...",              │
     │      expiresIn: 900                            │
     │    }                                           │
     │                                                │
     │ 6. Store tokens                                │
     │    (localStorage/secure cookie)                │
     │                                                │
     │ 7. GET /agents                                 │
     │    Authorization: Bearer <accessToken>         │
     ├───────────────────────────────────────────────▶│
     │                                                │
     │                                    8. Verify JWT
     │                                    9. Extract userId
     │                                    10. Query database
     │                                                │
     │ 11. Return data                                │
     │◀───────────────────────────────────────────────┤
     │                                                │
     │                                                │
     │ ... 15 minutes later ...                       │
     │                                                │
     │ 12. Token expired                              │
     │◀───────────────────────────────────────────────┤
     │    { error: "TOKEN_EXPIRED" }                  │
     │                                                │
     │ 13. POST /auth/refresh                         │
     │    { refreshToken: "..." }                     │
     ├───────────────────────────────────────────────▶│
     │                                                │
     │                                    14. Verify refresh
     │                                    15. Generate new access
     │                                                │
     │ 16. Return new access token                    │
     │◀───────────────────────────────────────────────┤
     │    { accessToken: "..." }                      │
     │                                                │
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        PRODUCTION                            │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Frontend (Vercel)                                  │     │
│  │  - Next.js 15 SSR                                  │     │
│  │  - Static assets on CDN                            │     │
│  │  - Auto-scaling                                    │     │
│  │  https://turbocat.app                              │     │
│  └────────────────┬───────────────────────────────────┘     │
│                   │                                          │
│                   │ HTTPS/REST                               │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────┐     │
│  │  Backend API (Render)                              │     │
│  │  - Express.js server                               │     │
│  │  - Auto-scaling (based on CPU)                     │     │
│  │  - Health checks                                   │     │
│  │  https://api.turbocat.app                          │     │
│  └────┬──────────────────┬─────────────────┬──────────┘     │
│       │                  │                 │                │
│       │                  │                 │                │
│  ┌────▼─────┐   ┌────────▼──────┐   ┌──────▼────────┐      │
│  │ Database │   │  Redis Queue  │   │   Supabase    │      │
│  │          │   │               │   │   Auth        │      │
│  │ Supabase │   │  Upstash      │   │               │      │
│  │ PostgreSQL   │  BullMQ       │   │ JWT + OAuth   │      │
│  │          │   │               │   │               │      │
│  │ - Primary│   │ - Job Queue   │   │ - Sessions    │      │
│  │ - Backups│   │ - Workers     │   │ - Password    │      │
│  │ - Replicas   │ - Retry       │   │   Reset       │      │
│  └──────────┘   └───────────────┘   └───────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Monitoring & Logging                                 │   │
│  │  - Application logs (Winston)                        │   │
│  │  - Error tracking (Sentry)                           │   │
│  │  - Performance monitoring (New Relic/DataDog)        │   │
│  │  - Uptime monitoring (UptimeRobot)                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Development vs Production

```
DEVELOPMENT                          PRODUCTION
─────────────                        ──────────

Frontend: localhost:3000             Frontend: Vercel
Backend:  localhost:3001             Backend:  Render
Database: Local PostgreSQL           Database: Supabase
Redis:    Local Redis                Redis:    Upstash
Auth:     Mock/Supabase Dev          Auth:     Supabase Prod

Hot Reload: Yes                      Hot Reload: No
Source Maps: Yes                     Source Maps: No
Logging:    Debug level              Logging:    Info/Error
Minification: No                     Minification: Yes
SSL:        No                       SSL:        Yes
```

---

## Testing Architecture

```
┌────────────────────────────────────────────────────────┐
│                  TEST PYRAMID                           │
│                                                         │
│                   ┌───────────┐                         │
│                   │    E2E    │  Playwright             │
│                   │  (10%)    │  Full user flows        │
│                   └─────┬─────┘  Slow, expensive        │
│                  ┌──────▼──────┐                        │
│                  │ Integration │  Jest + Supertest      │
│                  │   (30%)     │  API + DB tests        │
│                  └──────┬──────┘  Medium speed          │
│                 ┌───────▼────────┐                      │
│                 │  Unit Tests    │  Jest                │
│                 │    (60%)       │  Fast, isolated      │
│                 └────────────────┘                      │
│                                                         │
│  Test Database (PostgreSQL)                             │
│  - Isolated from dev/prod                               │
│  - Reset before each test                               │
│  - Seeded with test data                                │
│                                                         │
│  Mocks & Stubs                                          │
│  - Prisma Client Mock                                   │
│  - External API Mocks                                   │
│  - Redis Mock                                           │
│                                                         │
│  CI/CD (GitHub Actions)                                 │
│  - Run on every push                                    │
│  - All tests must pass                                  │
│  - Coverage report uploaded                             │
│  - Deploy on success                                    │
└────────────────────────────────────────────────────────┘
```

---

## Data Flow Example: Create Agent

```
┌─────────┐
│ Browser │
└────┬────┘
     │
     │ 1. User clicks "Create Agent"
     │
     ▼
┌─────────────┐
│ Frontend    │
│ (Next.js)   │
└─────┬───────┘
      │
      │ 2. POST /api/v1/agents
      │    {
      │      name: "Web Scraper",
      │      type: "code",
      │      config: {...}
      │    }
      │
      ▼
┌──────────────┐
│ Express      │
│ API Gateway  │
└──────┬───────┘
       │
       │ 3. Middleware Chain
       │    ├─ CORS
       │    ├─ Auth (verify JWT)
       │    └─ Validation (Zod)
       │
       ▼
┌──────────────┐
│ Route Handler│
│ /agents      │
└──────┬───────┘
       │
       │ 4. Call service
       │
       ▼
┌──────────────┐
│ AgentService │
└──────┬───────┘
       │
       │ 5. Business logic
       │    - Validate name unique
       │    - Set default values
       │    - Check user quota
       │
       ▼
┌──────────────┐
│ Prisma ORM   │
└──────┬───────┘
       │
       │ 6. Generate SQL
       │    INSERT INTO agents (...)
       │    VALUES (...)
       │
       ▼
┌──────────────┐
│ PostgreSQL   │
│ (Supabase)   │
└──────┬───────┘
       │
       │ 7. Return created record
       │
       ▼
┌──────────────┐
│ Response     │
│              │
│ {            │
│   success: true,
│   data: {    │
│     id: "...",
│     name: "Web Scraper",
│     ...      │
│   }          │
│ }            │
└──────┬───────┘
       │
       │ 8. Send to client
       │
       ▼
┌──────────────┐
│ Frontend     │
│ - Show success
│ - Add to list
│ - Navigate
└──────────────┘
```

---

**End of Architecture Diagrams**
