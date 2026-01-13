# TECHNICAL DECISIONS
## Turbocat - 6 Epic Brownfield Implementation

**Document Version:** 1.0
**Last Updated:** 2026-01-12

---

## D1: Dual Database Architecture Strategy

**Decision:** Use backend (Prisma + Supabase) as single source of truth, frontend (Drizzle + Neon) syncs via API calls.

**Why:**
- Backend already has 14 mature Prisma models with production data
- Frontend Drizzle schema is simpler (6 tables), used primarily for caching
- Consolidating to single DB would require massive data migration (high risk)
- Dual DB is industry-standard pattern (backend DB + frontend cache)

**Alternatives Considered:**
1. **Migrate frontend to use backend Prisma only** - Rejected: Breaks existing frontend code, high risk
2. **Migrate backend to use frontend Drizzle** - Rejected: Lose 14 production models, data loss risk
3. **Keep both DBs independent** - Rejected: Data inconsistency, no single source of truth

**Trade-offs:**
- Complexity: Must maintain sync logic between DBs
- Performance: Extra API call latency for frontend reads
- Consistency: Eventual consistency (not strong consistency)

**Implementation:**
- All writes go through backend API endpoints
- Frontend reads from backend API (not Neon DB directly)
- Backend periodically syncs critical data to frontend DB for offline support
- Sync job runs every 5 minutes (BullMQ)

**Risk Mitigation:**
- Monitor sync lag with metrics (alert if >5 minutes)
- Implement sync verification job (runs daily, checks consistency)
- Feature flag: `ENABLE_DUAL_DB_SYNC` - can disable if issues arise

---

## D2: OAuth Implementation Strategy

**Decision:** Build OAuth from scratch using Passport.js instead of using NextAuth.js or Supabase Auth.

**Why:**
- Existing JWT infrastructure is custom-built (backend/src/utils/jwt.ts)
- NextAuth.js would require replacing entire auth system (high risk)
- Supabase Auth is frontend-focused, doesn't fit backend-first architecture
- Passport.js is battle-tested, flexible, well-documented

**Alternatives Considered:**
1. **NextAuth.js** - Rejected: Opinionated structure, conflicts with existing JWT system, requires major refactor
2. **Supabase Auth** - Rejected: Couples frontend to Supabase, backend already uses JWT
3. **Custom OAuth (no library)** - Rejected: Security risk (easy to get CSRF/PKCE wrong), maintenance burden

**Trade-offs:**
- Passport.js requires manual strategy configuration for each provider
- More boilerplate code than NextAuth.js
- No built-in session management (must implement ourselves)

**Implementation:**
- Install `passport`, `passport-google-oauth20`, `passport-github2`, `passport-microsoft`
- Backend: OAuth routes return JWT tokens (same as existing email/password login)
- Frontend: Store JWT in cookies (same as existing)
- CSRF protection: State parameter (UUID, 10-min expiry, stored in Redis)

**Security Considerations:**
- State parameter prevents CSRF attacks
- Refresh tokens encrypted with AES-256 before storing in DB
- Rate limiting: Max 5 OAuth attempts per IP per minute

---

## D3: Real-Time Preview Technology

**Decision:** Use Expo Snack (hosted) for mobile preview instead of self-hosted bundler.

**Why:**
- Expo Snack is free, maintained by Expo team, handles bundling + rendering
- Self-hosted bundler (Metro, Webpack) requires significant infrastructure:
  - Build servers, container orchestration, artifact storage
  - Estimated cost: $500/month + 2 weeks dev time
- Snack provides QR code for Expo Go testing (free on-device testing)
- 90%+ accuracy based on Expo's metrics

**Alternatives Considered:**
1. **Self-hosted Metro bundler** - Rejected: High cost ($500/mo), complex infrastructure, 2 weeks dev time
2. **CodeSandbox** - Rejected: No mobile preview support, web-only
3. **StackBlitz** - Rejected: No mobile preview support, web-only
4. **Repl.it** - Rejected: Limited mobile support, less accurate

**Trade-offs:**
- Expo Snack has rate limits (unknown exact limits, community tier)
- Preview accuracy: ~90% (some native modules unsupported)
- Dependency on Expo service (downtime risk)

**Implementation:**
- Use `@expo/snack-sdk` npm package
- Cache Snack URLs in Redis (1-hour TTL) to reduce API calls
- Show disclaimer: "Preview may differ from final build"
- Provide Expo Go QR code for real device testing

**Fallback Plan:**
- If Snack rate limits become issue, implement self-hosted bundler
- Feature flag: `ENABLE_SELF_HOSTED_PREVIEW`
- Estimated migration time: 1 week (if needed)

---

## D4: WebSocket vs Polling for Real-Time Updates

**Decision:** Use WebSocket (Socket.IO) with polling fallback for real-time updates.

**Why:**
- WebSocket provides true real-time updates (<100ms latency)
- Polling wastes bandwidth (even with long-polling, still polls every 2-5s)
- Socket.IO handles reconnection automatically (exponential backoff)
- Chat + preview updates are core UX - need instant feedback

**Alternatives Considered:**
1. **Polling only** - Rejected: High bandwidth waste, 2-5s latency, poor UX for chat
2. **Server-Sent Events (SSE)** - Rejected: One-way only (server → client), no bidirectional chat
3. **WebRTC Data Channels** - Rejected: Overkill for chat/preview, complex setup

**Trade-offs:**
- WebSocket requires persistent connections (more server resources)
- Socket.IO adds 50KB to frontend bundle
- Must handle reconnection logic carefully

**Implementation:**
- Backend: Socket.IO server on Express (backend/src/server.ts)
- Frontend: Socket.IO client with auto-reconnect
- Events: `chat:message`, `execution:progress`, `preview:update`
- Fallback: If WebSocket fails, poll every 5 seconds

**Performance:**
- Max 1000 concurrent WebSocket connections per server instance
- Horizontal scaling: Use Redis adapter for multi-server support
- Graceful degradation: Polling fallback if WebSocket blocked by firewall

---

## D5: Workflow Model Extension vs New Project Model

**Decision:** Extend existing Workflow model (rename to "Project" via API alias) instead of creating new Project model.

**Why:**
- Workflow model already has:
  - userId relation (ownership)
  - Execution tracking (ExecutionLog, Execution models)
  - Scheduling, metrics, status tracking
- Creating new Project model would duplicate 80% of Workflow fields
- Workflow → Project is semantic rename (same entity, different name)

**Alternatives Considered:**
1. **Create new Project model, migrate data from Workflow** - Rejected: Data migration risk, downtime, complex backfill
2. **Keep Workflow name, don't rename** - Rejected: Confusing for users ("Projects" in UI, "Workflows" in DB)
3. **Create Project model, alias to Workflow** - Rejected: Two models with duplicate data, sync issues

**Trade-offs:**
- Backend code uses "Workflow" terminology, frontend uses "Project" terminology
- API layer must transform Workflow → Project DTO (small performance cost)
- Future confusion if we add true "Workflows" feature (distinct from projects)

**Implementation:**
- Add fields to Workflow model: `projectName`, `platform`, `selectedModel`, `thumbnailUrl`, `previewCode`
- Create API route: `/api/v1/projects` → internally queries Workflow model
- Response transformer: `WorkflowMapper.toProjectDTO(workflow)`
- Frontend never knows about "Workflow" - only sees "Project"

**Migration Path:**
- If we need distinct "Workflows" later, rename current Workflow → Project (breaking change, major version)
- Estimated effort: 2 days (rename model, update all references)

---

## D6: Publishing Flow - Apple First, Android Later

**Decision:** Implement Apple App Store publishing in Phase 1, defer Android Google Play to Phase 2.

**Why:**
- 70% of Turbocat users are on iOS devices (analytics data)
- Apple App Store has higher ARPU ($9.99 vs $4.99 average)
- Apple publishing is more complex (requires Transporter API, JWT auth) - get it working first
- Google Play publishing is simpler (REST API with OAuth2) - easier to add later

**Alternatives Considered:**
1. **Implement both Apple + Android in Phase 1** - Rejected: Doubles effort (24 days → 40 days), delays launch
2. **Android first, Apple later** - Rejected: 70% of users are iOS, lower revenue potential
3. **Web publishing only (no mobile)** - Rejected: Mobile is core value prop, web is easier (less valuable)

**Trade-offs:**
- Android users cannot publish (must wait for Phase 2)
- Incomplete feature (marketing says "Publish to App Store" not "Publish to app stores")
- Potential user churn if Android-only users expect publishing

**Implementation:**
- Epic 4 focuses on Apple only
- Phase 2 (post-launch) adds Android publishing (estimated: 8-10 days)
- Show "Android coming soon" message in publishing modal

**Phase 2 Android Scope:**
- Google Play Console API integration (simpler than Apple)
- AAB upload (Android App Bundle)
- Estimated effort: 8-10 days (vs 12-18 for Apple)

---

## D7: Referral System - Cookie-Based vs Database-First

**Decision:** Use cookie-based referral tracking (30-day expiry) with database fallback.

**Why:**
- Cookies survive browser close, work across incognito → signup
- Referral attribution must work even if user doesn't sign up immediately
- Database-first (track IP + user agent) is less reliable (IP changes, VPNs, shared networks)
- Industry standard: Stripe, Dropbox, Airbnb all use cookie-based referrals

**Alternatives Considered:**
1. **Database-first (track IP + user agent)** - Rejected: IP changes frequently (mobile, VPN), high false-positive rate
2. **URL parameter only (no persistence)** - Rejected: User must sign up in same session, low conversion
3. **LocalStorage** - Rejected: Doesn't work across subdomains, cleared more often than cookies

**Trade-offs:**
- Cookies can be deleted by user (lose attribution)
- Cookie blocked if user has strict privacy settings
- Must handle EU cookie consent (GDPR)

**Implementation:**
- Set cookie: `ref={referralCode}` (30-day expiry, HttpOnly, Secure, SameSite=Lax)
- On signup: Read cookie, link user to referrer
- Database fallback: If cookie missing, check IP + user agent (last 7 days)
- Cookie consent: Show banner in EU regions (required by GDPR)

**Abuse Prevention:**
- Max 10 referrals per user per day (prevent bot abuse)
- Manual review: Flag users with >50 referrals in 30 days
- Self-referral check: Reject if referrer email == referee email

---

## D8: Testing Strategy - Unit > Integration > E2E Priority

**Decision:** Prioritize unit tests (80% coverage) over E2E tests, focus E2E on happy paths only.

**Why:**
- Unit tests are fast (run in <5 seconds), catch 80% of bugs
- Integration tests validate API contracts, catch DB/service integration issues
- E2E tests are slow (run in 2-3 minutes), flaky (network issues, timing), expensive to maintain
- ROI: Unit tests (high ROI), Integration tests (medium ROI), E2E tests (low ROI for comprehensive coverage)

**Alternatives Considered:**
1. **E2E-first strategy** - Rejected: Slow feedback loop, flaky tests, high maintenance, expensive CI time
2. **Manual testing only** - Rejected: No regression detection, doesn't scale with team size
3. **Integration tests only** - Rejected: Doesn't catch logic bugs in services, no fast feedback

**Trade-offs:**
- Unit tests don't catch integration issues (API + DB mismatch)
- E2E tests may miss edge cases (only happy paths covered)
- Manual testing still required for visual/UX validation

**Implementation:**
- **Unit Tests (Backend):** Jest, 80%+ coverage target
  - All services, utilities, validation logic
  - Mock external dependencies (Prisma, Redis, Expo API)
- **Integration Tests (Backend):** Supertest, all API routes
  - Real database (test DB), no mocks
  - Validate request/response contracts
- **E2E Tests (Frontend):** Playwright, happy paths only
  - Create project → chat → preview (Epic 2)
  - OAuth login → dashboard (Epic 1)
  - Publish flow → App Store submission (Epic 4)
- **Manual Testing:** QA checklist for each epic
  - Visual validation, UX flow testing, cross-browser testing

**Coverage Goals:**
- Backend unit tests: >80% line coverage
- Backend integration tests: 100% of API routes
- Frontend unit tests: >70% component coverage
- E2E tests: 3-5 happy path scenarios per epic

---

## D9: Feature Flags for Gradual Rollout

**Decision:** Use environment variable-based feature flags for all 6 epics, with gradual rollout (10% → 50% → 100%).

**Why:**
- Feature flags enable safe rollout (rollback within minutes if issues arise)
- Can enable features for internal team first (dogfooding)
- A/B testing: Enable for subset of users, measure metrics
- No code changes required to enable/disable features (just env var change)

**Alternatives Considered:**
1. **No feature flags (deploy = enable for everyone)** - Rejected: High risk, no rollback option, all-or-nothing
2. **Code-based flags (if statements in code)** - Rejected: Requires code changes to toggle, slow rollback
3. **Third-party service (LaunchDarkly, Split.io)** - Rejected: Additional cost ($29/mo), external dependency

**Trade-offs:**
- Must remember to remove feature flags after rollout complete (tech debt)
- Environment variables require server restart to change (not instant)
- No per-user targeting (all users in group get same flag)

**Implementation:**
- Backend `.env`:
  ```
  ENABLE_OAUTH_LOGIN=true
  ENABLE_REAL_TIME_PREVIEW=true
  ENABLE_PUBLISHING_FLOW=true
  ENABLE_REFERRAL_SYSTEM=true
  ```
- Frontend checks backend `/api/v1/config/features` endpoint
- Gradual rollout via Redis: `feature:oauth:enabled_users` → store user IDs

**Rollout Plan:**
1. **Week 1 (10%):** Internal team + beta users (~50 users)
2. **Week 2 (50%):** Random 50% of users, monitor metrics
3. **Week 3 (100%):** All users, remove flag after 1 week stability

**Rollback:**
- Set `ENABLE_<FEATURE>=false` in .env
- Restart backend (< 30 seconds downtime)
- Frontend immediately hides feature on next API call

---

## D10: Budget Allocation Across Epics

**Decision:** Allocate 43% of budget ($60K) to Epic 4 (Publishing), 36% ($50K) to Epic 2 (Dashboard), 21% ($30K) to remaining epics.

**Why:**
- Publishing (Epic 4) is highest revenue driver (40% of users expected to upgrade for publishing)
- Dashboard (Epic 2) is core UX (affects 100% of users, highest engagement impact)
- Other epics (1, 3, 5, 6) are supporting features (important but lower revenue impact)

**Alternatives Considered:**
1. **Equal budget across epics** - Rejected: Ignores revenue/impact differences, inefficient allocation
2. **Cut Epic 4 scope (defer publishing)** - Rejected: Publishing is primary monetization vector, delays revenue
3. **Cut Epic 6 scope (defer referral)** - Considered: Referral has lowest priority (P3), but 30% CAC reduction justifies investment

**Trade-offs:**
- Less budget for polish on Epics 1, 3, 5, 6
- Epic 4 may still overrun budget (highest complexity)
- If budget cut needed, Epic 6 (Referral) is first candidate

**Budget Breakdown:**
| Epic | Budget | % | Days | Justification |
|------|--------|---|------|---------------|
| Epic 1 (OAuth) | $12K | 9% | 3-4 | Critical foundation, enables Epic 5 |
| Epic 2 (Dashboard) | $50K | 36% | 10-15 | Core UX, 100% user impact |
| Epic 3 (Editing) | $16K | 11% | 3-5 | Engagement driver, iteration speed |
| Epic 4 (Publishing) | $60K | 43% | 12-18 | Revenue driver, 40% conversion expected |
| Epic 5 (Settings) | $10K | 7% | 2-3 | Retention, user satisfaction |
| Epic 6 (Referral) | $20K | 14% | 4-5 | Growth, 30% CAC reduction |
| Testing/QA | $12K | - | - | Regression prevention, quality assurance |
| **Total** | **$140K** | **100%** | **40-50** | |

**Contingency:**
- If Epic 4 overruns, reduce Epic 3 scope (defer advanced toolbar to Phase 2)
- If major overrun, defer Epic 6 entirely to Phase 2

---

## Decision Log Summary

| ID | Decision | Impact | Risk |
|----|----------|--------|------|
| D1 | Dual DB Strategy | High | Medium |
| D2 | OAuth with Passport.js | High | Low |
| D3 | Expo Snack Preview | High | Low |
| D4 | WebSocket + Fallback | Medium | Low |
| D5 | Extend Workflow Model | Medium | Low |
| D6 | Apple First, Android Later | High | Medium |
| D7 | Cookie-Based Referrals | Low | Low |
| D8 | Unit-First Testing | Medium | Low |
| D9 | Feature Flags | Low | Low |
| D10 | Budget Allocation | High | High |

---

**Document Status:** APPROVED (pending user review)
**Last Updated:** 2026-01-12
