# System State - Current Codebase Status

**Last Updated:** 2026-01-12
**Status:** Active Development - UI Redesign Phase

## Executive Summary

Turbocat is a full-stack AI-native app builder with a **Next.js 14 frontend** and **Express/TypeScript backend**. The backend implements a sophisticated workflow orchestration system with multi-agent execution, while the frontend provides a dashboard for project management. **Current focus:** Redesigning UI to match the VibeCode vision with enhanced UX flows.

---

## Technology Stack

### Frontend (`turbocat-agent/`)
- **Framework:** Next.js 14.2.29 (App Router)
- **Language:** TypeScript 5.9.2
- **UI Library:** React 18.3.1
- **Styling:** Tailwind CSS 3.4.18 + AI Native theme
- **State Management:** Jotai 2.10.3
- **Icons:** Phosphor Icons (@phosphor-icons/react 3.0.2)
- **Animations:** Framer Motion 12.1.2
- **Forms:** React Hook Form + Zod validation
- **Auth:** JWT-based (integrated with backend)

### Backend (`backend/`)
- **Framework:** Express 5.2.1 + TypeScript 5.9.2
- **Database:** PostgreSQL via Prisma 7.2.0 (Supabase)
- **Auth:** JWT (jsonwebtoken) + bcrypt
- **Job Queue:** BullMQ 5.66.4 (Redis-backed)
- **Cache/Sessions:** ioredis 5.9.0
- **AI Integration:** @anthropic-ai/claude-agent-sdk 0.2.4
- **Validation:** Zod 4.3.5
- **Logging:** Winston 3.19.0

---

## Architecture Overview

### Frontend Architecture

**Routing Structure (Next.js App Router):**
```
app/
├── (auth)/              - Authentication pages (login, register)
├── (dashboard)/         - Protected dashboard routes
│   ├── layout.tsx      - Dashboard layout with auth check
│   ├── page.tsx        - Projects dashboard
│   ├── new/            - New project creation
│   └── settings/       - User settings
├── (marketing)/        - Public marketing pages
└── api/                - API route handlers
```

**Component Organization:**
```
components/
├── ui/                 - Base UI components (shadcn-style)
├── turbocat/           - Feature components
│   ├── DashboardPage.tsx
│   ├── ProjectCard.tsx
│   ├── PromptInput.tsx
│   └── ThemeToggle.tsx
├── code/               - Code display components
├── skills/             - Skills management UI
└── providers/          - Context providers (Jotai)
```

**Key Libraries:**
- **Styling:** Tailwind with AI Native theme (terracotta, sage, orange, teal)
- **State:** Jotai atoms for global state
- **Data Fetching:** Native fetch with Server Components where possible

### Backend Architecture

**Core Services:**
- **Auth Service:** Registration, login, JWT refresh, password reset
- **Agent Service:** CRUD for AI agents with versioning
- **Workflow Service:** Workflow orchestration with step management
- **Execution Service:** Workflow execution lifecycle tracking
- **Template Service:** Reusable workflow and agent templates

**API Structure:**
```
/api/v1/
├── auth/              - Authentication endpoints
├── users/             - User management
├── agents/            - Agent CRUD
├── workflows/         - Workflow CRUD + execution
├── executions/        - Execution history and logs
├── templates/         - Template library
├── deployments/       - Deployment management
└── analytics/         - Usage analytics
```

**Agent Execution Engine:**
Located in `backend/src/engine/`:
- **WorkflowExecutor.ts** - Orchestrates workflow steps
- **AgentExecutor.ts** - Base execution class
- **CodeAgentExecutor.ts** - Code execution
- **ApiAgentExecutor.ts** - API calls
- **LLMAgentExecutor.ts** - Claude AI agent calls
- **DataAgentExecutor.ts** - Data processing

---

## Database Schema (PostgreSQL)

**Core Models:**
1. **User** - Authentication, profile, preferences
2. **Agent** - AI agents with type (CODE, API, LLM, DATA, WORKFLOW)
3. **Workflow** - Multi-step workflows with scheduling
4. **WorkflowStep** - Individual steps in workflows
5. **Execution** - Workflow execution tracking
6. **ExecutionLog** - Detailed step-level logs
7. **Template** - Reusable templates
8. **Deployment** - Deployment configurations
9. **ApiKey** - API key management
10. **AuditLog** - Audit trail

**Key Features:**
- Soft deletes (deletedAt column)
- Version tracking (parent-child relationships)
- JSONB fields for flexible config storage
- Metrics tracking (executions, success rates, performance)

---

## Current Features

### ✅ Implemented
1. **User Authentication**
   - Email/password registration and login
   - JWT access + refresh tokens
   - Password reset flow (backend ready, email TODO)
   - Session management with Redis

2. **Project Dashboard**
   - Grid/list view toggle
   - Search and filtering
   - Project cards with thumbnails
   - Platform badges (web/mobile)
   - Status indicators (draft, building, deployed)

3. **Agent Management**
   - CRUD operations
   - Agent versioning
   - Agent types: CODE, API, LLM, DATA, WORKFLOW
   - Agent duplication

4. **Workflow Engine**
   - Multi-step workflows
   - Step types: AGENT, CONDITION, LOOP, PARALLEL, WAIT
   - DAG validation (cycle detection)
   - Error handling strategies
   - Retry logic
   - Scheduled execution (cron)

5. **Job Queue System**
   - BullMQ with Redis
   - Async workflow execution
   - Retry with exponential backoff
   - Job monitoring

6. **Execution Tracking**
   - Real-time status updates
   - Step-level logging
   - Execution history
   - Performance metrics

7. **AI Native Theme**
   - Light/dark mode support
   - Custom color palette
   - Design tokens defined
   - **Theme toggle component created** ✓

### 🚧 Partially Implemented
1. **OAuth Providers** - Backend prepared but not implemented (Google, Apple)
2. **Email Service** - Password reset tokens generated but not sent
3. **Mobile Preview** - Components exist but integration pending
4. **Publishing Flow** - UI designs exist, backend integration needed

### ❌ Not Implemented
1. **Social Login** (Google, Apple OAuth)
2. **Real-time Mobile Preview**
3. **App Store Publishing Integration**
4. **Expo Build Service Integration**
5. **AI Code Generation Engine** (Claude integration partially done)
6. **Chat Persistence** (ExecutionLog exists but not chat-style)

---

## Known Issues (From Previous Planning)

### Critical Issues (P0)
1. ~~**Vercel Build Failure**~~ - ✓ RESOLVED
2. **No OAuth Providers** - Need Google/Apple sign-in implementation

### High Priority Issues (P1)
3. **Theme Toggle Missing** - ✓ RESOLVED (component created)
4. **Theme Colors Not Showing** - Need validation
5. **Duplicate Buttons** - Source unknown, needs investigation
6. **Data Not Loading** - API integration issues
7. **Click/Interactions Failing** - Event handler issues

### Medium Priority Issues (P2)
8. **Platform Selection UX** - Needs redesign (cards → inline chips)

---

## Environment Configuration

### Required Environment Variables

**Backend:**
```env
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Auth
JWT_ACCESS_SECRET=<64-hex-chars>
JWT_REFRESH_SECRET=<64-hex-chars>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Encryption
ENCRYPTION_KEY=<64-hex-chars>

# Redis (optional, fallback to in-memory)
REDIS_URL=redis://localhost:6379

# Supabase
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Application
NODE_ENV=development
PORT=3001
API_VERSION=v1
```

**Frontend:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Development Status

### Git Branch: `main`
**Last Major Commit:** bb585b6 - "Merge feat/ai-native-theme"

**Recent Changes:**
- AI Native design system implementation (66 components)
- Type-safe param extraction for Express 5.x
- Test directories excluded from TypeScript compilation
- CI/CD workflow updated for npm workspaces

**Unstaged Changes:**
- Deleted old anthropic skills
- Added new skill directories (untracked)
- Planning documents for issue fixes
- Settings.local.json

### Active Development Areas:
1. **UI Redesign** - Matching VibeCode vision from screenshots
2. **OAuth Integration** - Adding Google/Apple providers
3. **Mobile Preview** - Real-time preview implementation
4. **Publishing Flow** - Expo + App Store integration

---

## Performance & Scalability

### Current Limitations:
- **Single Server** - No horizontal scaling yet
- **In-Memory Fallback** - Redis optional but recommended
- **Synchronous API Calls** - No rate limiting at API gateway level
- **No CDN** - Static assets served directly

### Optimization Opportunities:
- Add Redis for production (sessions + queue)
- Implement API response caching
- Add CDN for static assets (images, fonts)
- Optimize database queries (add indexes)
- Implement connection pooling

---

## Testing Status

### Test Coverage:
- **Backend:** Partial unit tests exist (`__tests__/` directories)
- **Frontend:** No test files found
- **E2E:** Playwright configured but no tests written

### Testing Commands:
```bash
# Backend
npm test
npm run test:unit
npm run test:integration
npm run test:coverage

# Frontend
# TODO: Add test setup
```

---

## Deployment Status

### Current Deployment:
- **Frontend:** Likely Vercel (Next.js optimized)
- **Backend:** Not deployed / Local development
- **Database:** Supabase (PostgreSQL)
- **Redis:** Not configured (in-memory fallback active)

### Production Readiness:
- ⚠️ **Not Production Ready**
  - Redis required for sessions
  - Email service needed
  - OAuth providers missing
  - Security audit pending
  - Load testing not performed

---

## Dependencies Health

### Frontend Critical Dependencies:
| Package | Version | Status | Notes |
|---------|---------|--------|-------|
| Next.js | 14.2.29 | ✅ Stable | Latest 14.x |
| React | 18.3.1 | ✅ Stable | Latest 18.x |
| TypeScript | 5.9.2 | ✅ Stable | Latest 5.x |
| Tailwind | 3.4.18 | ✅ Stable | Latest 3.x |
| Jotai | 2.10.3 | ✅ Stable | Latest 2.x |

### Backend Critical Dependencies:
| Package | Version | Status | Notes |
|---------|---------|--------|-------|
| Express | 5.2.1 | ⚠️ Alpha | Express 5 in alpha |
| Prisma | 7.2.0 | ✅ Stable | Latest 7.x |
| BullMQ | 5.66.4 | ✅ Stable | Latest 5.x |
| TypeScript | 5.9.2 | ✅ Stable | Latest 5.x |

**Security Concerns:**
- Express 5.x still in alpha (consider Express 4.x for production)
- No automated dependency updates (Dependabot not configured)

---

## Security Posture

### ✅ Good Practices:
- JWT with separate access/refresh secrets
- bcrypt password hashing (12 rounds)
- Helmet security headers
- CORS with origin whitelisting
- Request ID tracing
- Audit logging
- Soft deletes (data preservation)

### ⚠️ Gaps:
- No OAuth providers (only email/password)
- No 2FA/MFA
- No token blacklisting (revoked tokens valid until expiry)
- No refresh token rotation
- No rate limiting at API gateway level
- Email service not configured (password reset manual)
- User enumeration prevention could be stronger

---

## Integration Points

### External Services:
1. **Supabase** - PostgreSQL database + auth helpers
2. **Claude AI** - Agent SDK for LLM agents
3. **Redis** - Sessions + job queue (optional)
4. **Expo** - Mobile app build/preview (not integrated)
5. **Apple Developer** - App Store publishing (not integrated)

### Missing Integrations:
- Google OAuth
- Apple OAuth
- Email service (SendGrid, Postmark, etc.)
- Expo build API
- Apple App Store Connect API
- Push notifications
- Analytics (Mixpanel, Amplitude, etc.)

---

## Next Steps (Priority Order)

### Immediate (This Week):
1. ✓ Complete UI redesign planning (this document)
2. Extract user stories from UI screenshots
3. Create feature specifications for each flow
4. Fix existing P0/P1 issues from planning files
5. Validate theme system works in all components

### Short Term (Next 2 Weeks):
6. Implement OAuth providers (Google, Apple)
7. Integrate mobile preview functionality
8. Wire up publishing flow with Expo
9. Add email service for password resets
10. Implement chat persistence properly

### Medium Term (Next Month):
11. Add comprehensive test coverage
12. Implement API rate limiting
13. Add Redis in production
14. Performance optimization pass
15. Security audit and fixes

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Express 5.x breaking changes | Medium | High | Pin version, test thoroughly |
| No OAuth = poor conversion | High | High | Prioritize OAuth implementation |
| No tests = regression bugs | High | High | Add test coverage ASAP |
| Redis optional = session loss | Medium | Medium | Make Redis required for prod |
| Email not configured = stuck users | Medium | Medium | Add email service soon |
| No rate limiting = abuse | Low | High | Implement before public launch |

---

## Useful Commands

### Development:
```bash
# Frontend (turbocat-agent/)
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint

# Backend (backend/)
npm run dev              # Start dev server with hot-reload
npm run dev:debug        # Start with Node inspector
npm run build            # Compile TypeScript
npm run start            # Start production server
npm test                 # Run tests
npm run db:migrate       # Run database migrations
npm run db:studio        # Open Prisma Studio
```

### Troubleshooting:
```bash
# Clear Next.js cache
rm -rf .next

# Regenerate Prisma client
npx prisma generate

# Reset database (DEV ONLY)
npm run db:migrate:reset

# Check TypeScript errors
npx tsc --noEmit
```

---

**Document Owner:** Product & Engineering
**Review Frequency:** Weekly during active development
**Status:** Living Document - Updated as system evolves
