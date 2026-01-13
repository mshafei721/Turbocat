# IMPLEMENTATION PLAN
## Turbocat - 6 Epic Implementation (Brownfield)

**Document Version:** 1.0
**Created:** 2026-01-12
**Project:** Turbocat AI-Native App Builder
**Total Timeline:** 40-50 days, 220 person-days effort
**Budget:** $140,000 total project cost

---

## Goal

Transform Turbocat from a workflow orchestration platform into a complete AI-native app builder with OAuth authentication, real-time preview, publishing capabilities, and monetization - while preserving all existing functionality in this brownfield codebase.

## Scope

### In Scope (All 6 Epics)

1. **Authentication & OAuth (Epic 1)** - Add GitHub, Google, Microsoft OAuth providers to existing JWT auth
2. **Dashboard & Projects (Epic 2)** - Redesign dashboard with real-time mobile preview and persistent chat
3. **Editing & Iteration Tools (Epic 3)** - Add suggested prompts and advanced toolbar for faster iteration
4. **Publishing Flow (Epic 4)** - Integrate Expo Build Services and Apple App Store submission
5. **Settings & Account Management (Epic 5)** - User profile, password change, account deletion
6. **Referral & Monetization (Epic 6)** - Referral program with rewards (20% discount for referee, 1 free month for referrer)

### Out of Scope (Deferred to Phase 2)

- Web platform publishing (App Store only in Phase 1)
- Analytics dashboard (metrics collection only)
- Team collaboration features
- Custom domain mapping
- API rate limiting UI
- Mobile app (web-only in Phase 1)

## Non-Goals

- Rewrite existing workflow engine (preserve as-is)
- Migrate from Prisma to Drizzle (or vice versa)
- Redesign authentication architecture (extend existing JWT system)
- Support React Native CLI (Expo only)
- Support Android publishing (iOS only in Phase 1)

## Constraints

### Technical Constraints

1. **Dual Database Architecture:**
   - Backend: Prisma 7.2.0 + Supabase Postgres (14 models)
   - Frontend: Drizzle ORM + Neon Postgres (6 tables)
   - **Impact:** Must maintain consistency across two separate databases

2. **Express 5.x Alpha:**
   - Backend uses Express 5.2.1 (still in alpha)
   - **Impact:** Potential instability, limited community support

3. **No OAuth Exists:**
   - Current auth is JWT-only (email/password)
   - **Impact:** OAuth must be built from scratch (3-4 days)

4. **Existing Data Integrity:**
   - 14 Prisma models with production data (User, Agent, Workflow, Execution, etc.)
   - **Impact:** All migrations must be backward-compatible, no data loss

### Business Constraints

1. **Timeline:** 40-50 days maximum (220 person-days effort)
2. **Budget:** $140,000 total development cost
3. **Launch Date:** Target Q1 2026 (flexibility ±2 weeks)
4. **Team Size:** 2-3 developers recommended

### External Dependencies

1. **OAuth Providers:** Google Cloud Console, GitHub Apps, Microsoft Azure AD (credentials required)
2. **Apple Developer:** Active account required ($99/year)
3. **Expo Account:** EAS Build quota (free tier sufficient for testing)
4. **Infrastructure:** Redis for sessions + BullMQ (required for production)

## Assumptions

1. **Backend as Source of Truth:** All writes go through backend API, frontend syncs via API calls
2. **Existing Features Work:** Current workflow orchestration, agent execution, and dashboard are functional
3. **User Base:** <1,000 active users currently (can scale to 10,000 with current architecture)
4. **OAuth Credentials Available:** Google/GitHub/Microsoft OAuth apps can be created within 1 week
5. **Apple Developer Account:** Team has access or can create account within 1 week
6. **Expo Snack Sufficient:** Hosted Expo Snack preview meets performance requirements (no need for self-hosted bundler)

## Risks

### High-Priority Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Dual Database Sync Issues** | High | High | Use backend as source of truth, frontend syncs via API. Add sync verification job. Monitor for inconsistencies. |
| **Breaking Existing Workflows** | Medium | High | Comprehensive regression test suite (50+ tests). Feature flags for gradual rollout (10% → 50% → 100%). Rollback plan within 30 minutes. |
| **Epic 4 Timeline Overrun** | High | High | Publishing is longest epic (12-18 days). Allocate buffer time. Defer non-critical polish. Parallelize testing. |
| **OAuth Security Vulnerability** | Low | Critical | Security audit before launch. CSRF protection via state parameter. Rate limiting (5 attempts/min). Encrypt refresh tokens (AES-256). |

### Medium-Priority Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Express 5.x Instability** | Medium | High | Pin version to 5.2.1. Extensive testing. Fallback plan to Express 4.x if critical bugs found. |
| **Expo Build Service Downtime** | Low | High | Retry logic (max 3 attempts with exponential backoff). Monitor Expo status page. Fallback to local builds. |
| **Apple API Rate Limits** | Medium | High | Request limit increase proactively. Implement queue with backoff. Cache credentials (30-day refresh). |
| **WebSocket Connection Drops** | Medium | Medium | Polling fallback every 5 seconds. Automatic reconnection with exponential backoff. Show connection status indicator. |
| **Preview Accuracy <90%** | Medium | Medium | Test with 100+ sample apps. Show disclaimer in UI. Encourage real device testing via Expo Go. |

### Low-Priority Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **OAuth Provider Policy Changes** | Low | Medium | Monitor provider announcements. Maintain 3 OAuth options (Google, GitHub, Microsoft). Quick pivot plan (48 hours). |
| **Referral Abuse** | Low | Medium | Rate limiting (10 referrals/day/user). Manual review for outliers (>50 referrals/month). Ban mechanism for fraud. |
| **Team Unavailability** | Low | High | Cross-train developers. Document all decisions in /planning/DECISIONS.md. Maintain unblocked task backlog. |

## Rollback Strategy

### Epic-Level Rollback Plans

**Epic 1 (OAuth):**
- **Trigger:** OAuth login failure rate >10%, security vulnerability discovered
- **Steps:** Disable OAuth routes via feature flag → Remove OAuth buttons from UI → Revert Prisma migrations → Email/password continues working
- **Recovery Time:** <30 minutes
- **Data Loss:** None (User.oauthProvider fields remain NULL)

**Epic 2 (Dashboard):**
- **Trigger:** Dashboard load failure rate >5%, preview accuracy <70%, WebSocket failures >20%
- **Steps:** Revert frontend pages to previous version → Keep backend API (backward compatible) → Old dashboard available at /legacy route
- **Recovery Time:** 1-2 hours
- **Data Loss:** None (ChatMessage records preserved)

**Epic 3 (Editing Tools):**
- **Trigger:** Suggestions cause crashes >5%, toolbar breaks chat input
- **Steps:** Hide components via CSS (display:none) → Chat input reverts to basic version
- **Recovery Time:** <15 minutes (UI-only)
- **Data Loss:** None (UI-only feature)

**Epic 4 (Publishing):**
- **Trigger:** Build failure rate >10%, credential leak detected, Expo integration broken
- **Steps:** Disable "Publish" button via feature flag → Show "Coming Soon" message → Provide manual publishing instructions
- **Recovery Time:** <30 minutes
- **Data Loss:** None (Publishing records preserved for retry)

**Epic 5 (Settings):**
- **Trigger:** Profile update failure rate >10%, account deletions break
- **Steps:** Revert Settings page to previous version → Keep backend API (backward compatible)
- **Recovery Time:** <1 hour
- **Data Loss:** None (API backward compatible)

**Epic 6 (Referral):**
- **Trigger:** Referral abuse detected (>100 fraudulent referrals), reward logic broken
- **Steps:** Disable referral tracking via feature flag → Hide Referral page → Manually review pending rewards
- **Recovery Time:** <30 minutes
- **Data Loss:** None (referralCode fields preserved)

### Database Rollback

**Prisma Migration Rollback:**
```bash
# List migrations
npx prisma migrate status

# Rollback last migration
npx prisma migrate resolve --rolled-back <migration-name>

# Apply down migration manually if needed
psql $DATABASE_URL -f prisma/migrations/<migration>/down.sql
```

**Data Preservation Strategy:**
- All migrations use soft deletes (`deletedAt` column) - no hard deletes
- Keep deprecated columns for 30 days before dropping
- Backup database before each epic deploy (automated via CI)
- Point-in-time recovery enabled (Supabase built-in)

### Feature Flags

**Environment Variables (Backend .env):**
```env
ENABLE_OAUTH_LOGIN=true|false
ENABLE_REAL_TIME_PREVIEW=true|false
ENABLE_SUGGESTED_PROMPTS=true|false
ENABLE_ADVANCED_TOOLBAR=true|false
ENABLE_PUBLISHING_FLOW=true|false
ENABLE_REFERRAL_SYSTEM=true|false
```

**Gradual Rollout Strategy:**
- Deploy to staging with flags OFF
- Enable for internal team (dogfooding)
- Enable for 10% of users (1 week monitoring)
- Enable for 50% of users (1 week monitoring)
- Enable for 100% of users

---

## Success Criteria

### Launch Criteria (All Epics Must Meet)

- [ ] All 6 epics meet their individual success metrics
- [ ] Zero P0 bugs in production
- [ ] <5 P1 bugs in production
- [ ] Performance targets met:
  - Dashboard loads in <1 second (P95)
  - Preview renders in <500ms latency (P95)
  - Publishing completes in <15 minutes (P95)
- [ ] Security audit passed (no critical vulnerabilities)
- [ ] Test coverage >75% overall:
  - Backend >80% (Jest)
  - Frontend >70% (Vitest)
- [ ] Documentation complete:
  - API documentation (OpenAPI spec)
  - User guides (OAuth setup, publishing flow)
  - Developer onboarding guide
- [ ] Support team trained (2-hour training session)

### Post-Launch Metrics (Within 30 Days)

- [ ] User signup rate increases by 50%+ (OAuth impact)
- [ ] Retention (D7) increases from 30% to 50%+ (dashboard + preview impact)
- [ ] Publishing completion rate >70% (Epic 4)
- [ ] Average revenue per user (ARPU) increases by 40%+ (monetization)
- [ ] Net Promoter Score (NPS) >50 (user satisfaction)
- [ ] Support ticket volume <5% of user base (<50 tickets/1000 users)

### Business Impact (Within 90 Days)

- [ ] 100+ apps published to App Store via Turbocat
- [ ] 40%+ of users on paid plan (publishing + referral upgrade incentive)
- [ ] Customer acquisition cost (CAC) reduced by 30% (referral program)
- [ ] Product-market fit score >40% (survey)
- [ ] Viral coefficient k >0.3 (referral-driven growth)

---

## Impact

### Modified Database Models (Prisma - Backend)

**Epic 1: OAuth Fields**
```prisma
model User {
  // Add:
  oauthProvider String?
  oauthId String?
  oauthAccessToken String?
  oauthRefreshToken String?
}
```

**Epic 2: Project/Chat Fields**
```prisma
model Workflow {
  // Add:
  projectName String
  platform String
  selectedModel String
  thumbnailUrl String?
  previewCode String? @db.Text
  previewError String?
  chatMessages ChatMessage[]
}

model ChatMessage {
  // New model
  id String @id @default(uuid())
  workflowId String
  role String
  content String @db.Text
  metadata Json?
  createdAt DateTime @default(now())
}
```

**Epic 4: Publishing Model**
```prisma
model Publishing {
  // New model
  id String @id @default(uuid())
  workflowId String
  status String
  appleTeamId String?
  appName String
  bundleId String
  version String @default("1.0.0")
  expoBuildId String?
  createdAt DateTime @default(now())
}
```

**Epic 6: Referral Fields**
```prisma
model User {
  // Add:
  referralCode String @unique
  freeMonthsBalance Int @default(0)
}
```

### New API Routes

```
/api/v1/auth/oauth/:provider (GET) - Epic 1
/api/v1/auth/oauth/:provider/callback (GET) - Epic 1
/api/v1/projects (GET, POST) - Epic 2
/api/v1/projects/:id/chat (GET, POST) - Epic 2
/api/v1/projects/:id/preview (GET) - Epic 2
/api/v1/projects/:id/suggestions (GET) - Epic 3
/api/v1/publishing (POST) - Epic 4
/api/v1/publishing/:id/status (GET) - Epic 4
/api/v1/users/:id (PATCH) - Epic 5
/api/v1/users/:id/referrals (GET) - Epic 6
```

### New Frontend Pages

```
/app/(auth)/oauth/callback/page.tsx - Epic 1
/app/(dashboard)/project/[id]/page.tsx - Epic 2
/app/(dashboard)/referrals/page.tsx - Epic 6
```

---

**Document Status:** APPROVED
**Next Steps:** Create TASKS.md, STATUS.md, DECISIONS.md → Begin Epic 1 implementation
