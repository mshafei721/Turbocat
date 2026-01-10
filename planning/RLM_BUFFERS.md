# RLM Subagent Buffers

*Aggregated analysis from recursive subagent decomposition - 2026-01-10*

---

## Buffer 1: Repository Cartography

**Agent ID:** a43f8f0

### Scope
Multi-agent orchestration platform with web frontend, backend API, and skills/standards system

### Packages
| Package | Type | Stack | Database |
|---------|------|-------|----------|
| turbocat-agent | web-frontend | Next.js 16, React 19, Tailwind 4 | Neon PostgreSQL + Drizzle |
| @turbocat/backend | backend-api | Express 5, Prisma 7 | Supabase PostgreSQL |
| agent-os | skills-system | Markdown configs | N/A |
| expo-poc | mobile-poc | React Native Expo | N/A |

### Entry Points
- **Web:** `/turbocat-agent/app/layout.tsx` → `pnpm dev`
- **Backend:** `/backend/src/server.ts` → `npm run dev`
- **API Routes:** `/turbocat-agent/app/api/**`

### Critical Risks
1. Dual database architecture (Supabase vs Neon)
2. No shared models between systems
3. 20+ environment variables required
4. Multiple auth flows (JWT + OAuth)

---

## Buffer 2: Build & CI

**Agent ID:** ab9a3eb

### Build Commands
```bash
# Frontend
cd turbocat-agent && pnpm build  # next build --webpack

# Backend
cd backend && npm run build      # prisma generate && tsc
```

### CI Workflows
| Workflow | Trigger | Jobs |
|----------|---------|------|
| ci.yml | push main/develop, PR | test → deploy-preview → deploy-production |
| test.yml | push backend/, PR | lint → unit-tests → integration-tests → build → coverage |

### Deployment
- **Frontend:** Vercel (automatic via CI)
- **Backend:** Not configured (manual/Railway)

### Critical Gaps
- Backend deployment not automated
- Tests use continue-on-error (don't fail builds)
- Mixed package managers (npm + pnpm)

---

## Buffer 3: Backend Systems

**Agent ID:** a71cf2e

### Prisma Models (14)
User, Agent, Workflow, WorkflowStep, Execution, ExecutionLog, Template, Deployment, ApiKey, AuditLog

### Drizzle Tables (8)
users, tasks, connectors, accounts, keys, taskMessages, settings, railwayContainers

### API Routes
| System | Endpoints | Auth |
|--------|-----------|------|
| Backend (Express) | 30+ routes | JWT + API Key |
| turbocat-agent (Next.js) | 25+ routes | OAuth (GitHub/Vercel) |

### Queue Systems
- **Backend:** BullMQ + Redis (job retry, monitoring)
- **turbocat-agent:** Real-time (Vercel after() wrapper)

### Critical Risks
1. Schema divergence between systems
2. Different auth mechanisms
3. No audit trail in turbocat-agent

---

## Buffer 4: Frontend Systems

**Agent ID:** a53ec03

### Routes
| Path | Purpose |
|------|---------|
| / | Landing page |
| /login, /signup | Auth flows |
| /dashboard | User dashboard |
| /tasks/[taskId] | Task execution |
| /skills | Agent showcase |

### Giant Components (Need Refactoring)
| Component | Lines | Concern |
|-----------|-------|---------|
| task-details.tsx | 2639 | Multiple responsibilities |
| file-browser.tsx | 1879 | Complex state |
| task-chat.tsx | 1258 | Large render tree |
| task-sidebar.tsx | 782 | Many conditions |

### State Management
- **Library:** Jotai (atomWithStorage, atomFamily)
- **Atoms:** task, connector-dialog, file-browser, github-cache

### Design System
- **Framework:** Tailwind CSS 4 + Radix UI (shadcn/ui)
- **Theme:** Dark mode default (orange primary #F97316)
- **Icons:** Lucide React

---

## Buffer 5: Security Analysis

**Agent ID:** aef4174

### Security Posture: EXCELLENT

| Category | Rating |
|----------|--------|
| Authentication | Excellent (JWT + API Key) |
| Authorization | Excellent (RBAC, scopes) |
| Secret Management | Excellent |
| Input Validation | Excellent (Zod) |
| Database Security | Excellent (Prisma ORM) |
| Encryption | Excellent (bcrypt 12-rounds) |
| Error Handling | Excellent |
| Logging | Good |
| Rate Limiting | Good |

### Security Headers (Helmet)
- CSP: self only
- HSTS: 1 year with preload
- X-Frame-Options: deny
- X-Content-Type-Options: nosniff

### Risks
1. Rate limiting allows requests if Redis down
2. Admin bypass for ownership checks
3. Debug logs may capture sensitive fields

---

## Buffer 6: Test Quality

**Agent ID:** ab33501

### Test Frameworks
| Package | Framework | Type |
|---------|-----------|------|
| backend | Jest 30.2 | Unit, Integration |
| backend | Playwright 1.57 | E2E |
| turbocat-agent | Vitest 4.0 | Unit, Component |

### Test Counts
- **Total test files:** 63
- **Total LOC:** ~20,095
- **E2E files:** 4
- **Integration files:** 5

### Flakiness Risks
- 517 timing-sensitive operations (setTimeout, wait)
- 147 non-deterministic patterns (Math.random, Date.now)
- 19 pending (todo) tests

### Coverage
- Backend: Configured but thresholds disabled
- turbocat-agent: v8 provider, reporters configured

---

## Synthesis Summary

### Top 5 Priorities

1. **Enable CI quality gates** - Remove continue-on-error, enable coverage
2. **Extract giant components** - TaskDetails, FileBrowser into sub-components
3. **Unify package management** - Migrate to pnpm workspaces
4. **Add backend deployment** - CI job for Railway/Docker
5. **Document data flow** - Between Drizzle tasks and Prisma executions

### Architecture Recommendations

1. **Consider shared types package** for API contracts
2. **Add audit logging** to turbocat-agent
3. **Implement WebSocket** instead of 5s polling at scale
4. **Create shared auth layer** to prevent user ID collisions
5. **Use mock timers** in tests to reduce flakiness

---

*Buffers generated by RLM recursive analysis system*
