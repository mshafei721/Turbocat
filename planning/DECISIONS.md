# Technical Decisions Log

*RLM System Architecture Decisions - 2026-01-10*

---

## Decision 1: Dual Database Architecture

**Status:** Existing (inherited)

**What:** Two separate PostgreSQL databases with different ORMs
- Backend: Supabase PostgreSQL + Prisma ORM
- turbocat-agent: Neon PostgreSQL + Drizzle ORM

**Why:**
- Historical: Backend for workflow orchestration, turbocat-agent for task execution
- Separation of concerns: Different data models serve different purposes

**Alternatives Considered:**
1. Merge into single database → High migration risk, schema conflicts
2. Keep separate with shared types → Lower risk, clear boundaries
3. Event-driven sync between databases → Complexity overhead

**Trade-offs:**
- Pro: Independent scaling, clear boundaries
- Con: Potential data sync issues, duplicate user management

**Recommendation:** Keep separate, but document data flow and create shared types package.

---

## Decision 2: Mixed Package Managers

**Status:** Technical debt

**What:** Root uses npm, turbocat-agent uses pnpm, backend uses npm

**Why:** Evolved organically during development

**Alternatives Considered:**
1. Migrate all to pnpm workspaces → Clean, modern, better hoisting
2. Migrate all to npm workspaces → Wider tooling support
3. Keep as-is → No effort, accumulating debt

**Trade-offs:**
- pnpm: Faster, strict dependencies, good for monorepos
- npm: Universal support, simpler mental model

**Recommendation:** Migrate to pnpm workspaces at root level. Effort: Medium.

---

## Decision 3: Giant Component Architecture

**Status:** Technical debt

**What:** TaskDetails (2639 LOC), FileBrowser (1879 LOC), TaskChat (1258 LOC)

**Why:** Rapid feature development without refactoring cycles

**Alternatives Considered:**
1. Extract sub-components immediately → Clean code, testable
2. Keep as-is with better documentation → Lower risk, unclear ownership
3. Rewrite from scratch → High risk, scope creep

**Trade-offs:**
- Extraction: Cleaner code, easier testing, more files to manage
- As-is: Less churn, harder maintenance

**Recommendation:** Extract incrementally during feature work. Start with TaskDetails.

---

## Decision 4: Authentication Strategy

**Status:** Existing (inherited)

**What:**
- Backend: JWT + API Key authentication
- turbocat-agent: OAuth only (GitHub/Vercel)

**Why:**
- Backend: Programmatic API access for B2B integrations
- turbocat-agent: User-facing, OAuth is simpler UX

**Alternatives Considered:**
1. Unify to OAuth everywhere → Simpler, limits B2B
2. Unify to JWT everywhere → More code, better control
3. Keep dual but share user IDs → Interop without merge

**Trade-offs:**
- OAuth: Better UX, provider dependency
- JWT: More control, more implementation work

**Recommendation:** Keep dual, but create shared auth service to prevent user ID collision.

---

## Decision 5: Rate Limiting Fallback

**Status:** Design decision

**What:** If Redis is unavailable, rate limiting allows requests (graceful degradation)

**Why:** Availability over protection in edge cases

**Alternatives Considered:**
1. Fail closed (reject requests) → Secure but availability impact
2. Fail open (current) → Available but security gap
3. In-memory fallback → Middle ground, state loss risk

**Trade-offs:**
- Fail open: Better availability, DDoS risk if Redis down
- Fail closed: Better security, service disruption

**Recommendation:** Keep fail-open but add Redis availability monitoring and alerts.

---

## Decision 6: Test Framework Split

**Status:** Existing (appropriate)

**What:**
- Backend: Jest + Playwright
- turbocat-agent: Vitest

**Why:**
- Jest: More mature, better Prisma support
- Vitest: Faster, better Vite/Next.js integration

**Alternatives Considered:**
1. All Jest → Consistency, slower frontend tests
2. All Vitest → Faster, less Prisma tooling
3. Keep split (current) → Best tools for each context

**Trade-offs:**
- Split: Best performance, more cognitive load
- Unified: Simpler, sub-optimal performance

**Recommendation:** Keep split. Add shared test utilities for common patterns.

---

## Decision 7: Polling vs WebSocket

**Status:** Existing (review at scale)

**What:** 5-second polling intervals for task status updates

**Why:** Simpler implementation, no WebSocket infrastructure needed

**Alternatives Considered:**
1. WebSocket → Real-time, more complexity
2. Server-Sent Events → Simpler than WS, one-way
3. Keep polling → Works, wasteful at scale

**Trade-offs:**
- Polling: Simple, wasteful connections
- WebSocket: Efficient, connection management complexity

**Recommendation:** Keep polling for now. Review when concurrent users > 1000.

---

## Pending Decisions

1. **Backend deployment target:** Railway, Docker, or Vercel Functions?
2. **Coverage threshold:** 60%, 70%, or 80%?
3. **MCP server lifecycle:** When instantiated, how long persisted?
4. **Mobile POC integration:** Keep separate or merge into monorepo?

---

*Decisions documented by RLM system for architectural traceability*
