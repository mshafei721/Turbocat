# Turbocat Implementation Plan

**Project:** Turbocat - VibeCode UI Redesign & Backend Alignment
**Version:** 1.0
**Last Updated:** 2026-01-12
**Status:** Ready for Execution

---

## Executive Summary

This plan orchestrates the complete implementation of 6 major epics to transform Turbocat from its current state to the VibeCode vision: a modern, AI-native app builder with comprehensive features for authentication, project management, editing, publishing, settings, and viral growth.

**Total Duration:** 40-50 days (8-10 weeks)
**Total Effort:** ~220 person-days
**Team Size:** 2-3 developers (1 full-stack lead, 1 frontend, 1 backend/DevOps)

---

## Epic Overview

| Epic | Feature | Priority | Effort | Dependencies | Risk |
|------|---------|----------|--------|--------------|------|
| 1 | Authentication & OAuth | P0 (Critical) | 3-4 days | None | Low |
| 2 | Dashboard & Projects | P1 (High) | 10-15 days | Epic 1 | Medium |
| 3 | Editing & Iteration | P1 (High) | 3-5 days | Epic 2 | Low |
| 4 | Publishing Flow | P2 (Medium) | 12-18 days | Epic 2, 3 | High |
| 5 | Settings & Account | P2 (Medium) | 2-3 days | Epic 1 | Low |
| 6 | Referral Program | P3 (Low) | 4-5 days | Epic 1, 5 | Medium |

---

## Implementation Sequence

### Phase 0: Foundation (Week 0)

**Goal:** Set up project structure, tooling, and development environment

**Tasks:**
1. Environment setup
   - [ ] Configure development database (PostgreSQL)
   - [ ] Set up Redis for BullMQ
   - [ ] Configure Stripe test mode
   - [ ] Set up email service (Resend/SendGrid)
   - [ ] Configure S3/Cloudflare R2 for file storage

2. Codebase preparation
   - [ ] Create feature branch: `feat/vibecoderedesign`
   - [ ] Set up Prisma schema base
   - [ ] Configure ESLint, Prettier, TypeScript strict mode
   - [ ] Set up testing framework (Vitest + Playwright)

3. CI/CD pipeline
   - [ ] GitHub Actions workflow for tests
   - [ ] Preview deployments on Vercel
   - [ ] Database migration automation

**Duration:** 2-3 days
**Owner:** DevOps Lead

---

### Phase 1: Authentication & OAuth (Week 1)

**Epic:** AUTH-001
**Goal:** Implement secure authentication with Google and Apple Sign In

**Critical Path:**
1. Database schema (Session, OAuthAccount models)
2. AuthService implementation (JWT + refresh tokens)
3. OAuth integration (Google, Apple)
4. Frontend auth flows (login, signup, OAuth)
5. Protected route middleware

**Deliverables:**
- [ ] Users can sign up with email/password
- [ ] Users can sign in with Google
- [ ] Users can sign in with Apple
- [ ] JWT + refresh token flow working
- [ ] Protected routes enforce authentication
- [ ] E2E tests passing

**Duration:** 3-4 days
**Owner:** Backend Lead + Frontend Developer
**Risk:** Apple Sign In requires Apple Developer account ($99/year)

**Acceptance Criteria:**
- All test cases in `feature-auth/test-plan.md` pass
- Security audit completed (no OWASP top 10 vulnerabilities)
- Performance: < 200ms login response time

---

### Phase 2: Dashboard & Project Management (Weeks 2-3)

**Epic:** DASH-001
**Goal:** Build project dashboard, creation flow, and mobile preview

**Critical Path:**
1. **Week 2 (Backend Focus):**
   - Workflow/Project model schema
   - ChatMessage model schema
   - ProjectService (CRUD operations)
   - PreviewService (code generation)
   - WebSocket server setup
   - API routes

2. **Week 3 (Frontend Focus):**
   - Dashboard page with project grid
   - New project modal
   - Split-screen editor (chat + preview)
   - Mobile preview iframe
   - WebSocket client integration
   - Chat persistence

**Deliverables:**
- [ ] Dashboard displays user's projects
- [ ] Users can create new projects
- [ ] Chat interface for AI interaction
- [ ] Mobile preview renders in real-time
- [ ] Chat history persists across sessions
- [ ] WebSocket updates work reliably

**Duration:** 10-15 days
**Owner:** Full team
**Dependencies:** Epic 1 (auth required)
**Risk:** WebSocket reliability, preview sandboxing

**Acceptance Criteria:**
- Can create 100+ projects without performance degradation
- Preview updates in < 2 seconds
- Chat messages persist and sync across devices
- Mobile preview responsive for iOS/Android

**Parallel Work:**
- Backend team: ProjectService + PreviewService + WebSocket
- Frontend team: Dashboard UI + Chat UI
- Converge: Integration testing

---

### Phase 3: Editing & Iteration Tools (Week 4)

**Epic:** EDIT-001
**Goal:** Implement suggested prompts and advanced toolbar

**Critical Path:**
1. SuggestionService (contextual prompts)
2. Advanced toolbar component (12 icons)
3. Configuration panels (Image, API, Cloud, etc.)
4. Keyboard shortcuts
5. Integration with chat flow

**Deliverables:**
- [ ] Suggested prompts appear below chat
- [ ] Clicking suggestion inserts into chat
- [ ] Advanced toolbar with 12 tools
- [ ] Configuration panels functional
- [ ] Keyboard shortcuts (Cmd+K, etc.)

**Duration:** 3-5 days
**Owner:** Frontend Developer + Backend Support
**Dependencies:** Epic 2 (chat interface)
**Risk:** Low

**Acceptance Criteria:**
- Suggestions are contextually relevant
- All 12 toolbar tools functional
- Keyboard shortcuts work on Mac/Windows
- Configuration panels save state

---

### Phase 4: Publishing Flow (Weeks 5-7)

**Epic:** PUB-001
**Goal:** End-to-end app publishing to Apple App Store via Expo

**Critical Path:**
1. **Week 5 (Backend):**
   - Publishing model schema
   - AppleService (App Store Connect API)
   - ExpoService (Build Services API)
   - Credential encryption (AES-256-GCM)
   - BullMQ worker for builds

2. **Week 6 (Frontend + Integration):**
   - Publishing modal (4-step wizard)
   - Building status component
   - Polling for build status
   - Error handling UI
   - Integration testing

3. **Week 7 (Testing + QA):**
   - Manual QA with real credentials
   - Apple Developer account setup
   - Expo account setup
   - Full publishing flow test
   - Security audit

**Deliverables:**
- [ ] 4-step publishing wizard functional
- [ ] Apple credentials validated securely
- [ ] Expo token validated securely
- [ ] Build job queued to BullMQ
- [ ] Build status updates in real-time
- [ ] App submitted to App Store successfully

**Duration:** 12-18 days
**Owner:** Full team (most complex feature)
**Dependencies:** Epic 2 (projects), Epic 3 (editing)
**Risk:** HIGH - External API dependencies, credential security

**Critical Risks:**
- Apple App Store Connect API changes
- Expo Build Services downtime
- Credential encryption/decryption errors
- Build timeouts (30+ minutes)
- TestFlight review delays

**Mitigation:**
- Extensive error handling and retry logic
- Clear user feedback on failures
- Manual fallback instructions
- Comprehensive logging and monitoring
- Staging environment with test apps

**Acceptance Criteria:**
- Successfully publish at least 3 test apps
- Build completion rate > 95%
- Credential security audit passed
- All error scenarios handled gracefully
- User can track build progress in real-time

---

### Phase 5: Settings & Account Management (Week 8)

**Epic:** SET-001
**Goal:** User settings page for profile, security, and account management

**Critical Path:**
1. Session model schema
2. OAuthAccount model schema
3. UserService updates (profile, password, sessions)
4. Settings page UI (tabbed interface)
5. Avatar upload to S3
6. Account deletion flow

**Deliverables:**
- [ ] Users can update profile (name, email, avatar)
- [ ] Users can change password
- [ ] Users can view active sessions
- [ ] Users can disconnect OAuth providers
- [ ] Users can delete account

**Duration:** 2-3 days
**Owner:** Backend Lead + Frontend Developer
**Dependencies:** Epic 1 (auth system)
**Risk:** Low

**Acceptance Criteria:**
- All profile changes persist
- Password change requires current password
- Cannot disconnect only auth method
- Account deletion soft-deletes and anonymizes data

---

### Phase 6: Referral & Monetization (Week 9)

**Epic:** REF-001
**Goal:** Referral program for viral growth

**Critical Path:**
1. ReferralClick model schema
2. User model updates (referralCode, referredById)
3. ReferralService (tracking, attribution, rewards)
4. Stripe coupon integration (20% off)
5. Referral page UI
6. Email notifications

**Deliverables:**
- [ ] Unique referral code per user
- [ ] Referral tracking via cookies
- [ ] Referee gets 20% discount
- [ ] Referrer gets 1 free month per conversion
- [ ] Referral stats displayed
- [ ] Email notifications sent

**Duration:** 4-5 days
**Owner:** Backend Lead + Frontend Developer
**Dependencies:** Epic 1 (auth), Epic 5 (user settings)
**Risk:** Medium - fraud prevention, Stripe integration

**Acceptance Criteria:**
- Referral link generates and tracks clicks
- Attribution persists for 30 days
- Discount applied correctly at checkout
- Rewards credited to referrer account
- Fraud prevention active (10/day limit)

---

## Sprint Planning

### Sprint 1 (Week 1): Foundation + Auth
- Phase 0: Environment setup
- Phase 1: Authentication & OAuth
- **Goal:** Users can sign up and log in

### Sprint 2 (Weeks 2-3): Dashboard
- Phase 2: Dashboard & Project Management
- **Goal:** Users can create projects and iterate with AI

### Sprint 3 (Week 4): Editing Tools
- Phase 3: Editing & Iteration Tools
- **Goal:** Enhanced editing experience with prompts and toolbar

### Sprint 4-6 (Weeks 5-7): Publishing
- Phase 4: Publishing Flow
- **Goal:** Users can publish apps to App Store

### Sprint 7 (Week 8): Settings
- Phase 5: Settings & Account Management
- **Goal:** Users can manage their accounts

### Sprint 8 (Week 9): Referrals
- Phase 6: Referral & Monetization
- **Goal:** Viral growth mechanism active

### Sprint 9 (Week 10): Polish & Launch
- Bug fixes
- Performance optimization
- Documentation
- Production deployment

---

## Resource Allocation

### Team Structure

**Full-Stack Lead (100% allocation):**
- Architecture decisions
- Database schema design
- Backend service implementation
- Code reviews
- Deployment

**Frontend Developer (100% allocation):**
- UI component development
- State management
- Frontend testing
- Accessibility
- Responsive design

**Backend/DevOps Developer (50-75% allocation):**
- API implementation
- External integrations
- CI/CD pipeline
- Infrastructure
- Monitoring

**Optional: Part-time resources:**
- UI/UX Designer (20% allocation) - design review
- QA Engineer (25% allocation) - manual testing
- Technical Writer (10% allocation) - documentation

---

## Risk Management

### High-Risk Items

1. **Publishing Flow (Epic 4):**
   - **Risk:** External API dependencies, build failures
   - **Mitigation:** Extensive error handling, fallback instructions, staging testing
   - **Contingency:** Manual publishing guide if automated flow fails

2. **WebSocket Reliability (Epic 2):**
   - **Risk:** Connection drops, missed messages
   - **Mitigation:** Automatic reconnection, message queuing, HTTP fallback
   - **Contingency:** Polling-based updates as fallback

3. **Apple Sign In (Epic 1):**
   - **Risk:** Requires Apple Developer account
   - **Mitigation:** Early account setup, test in staging
   - **Contingency:** Launch without Apple Sign In, add later

### Medium-Risk Items

1. **Referral Fraud (Epic 6):**
   - **Risk:** Users gaming the system
   - **Mitigation:** Rate limiting, IP tracking, manual review
   - **Contingency:** Pause program, investigate anomalies

2. **Preview Performance (Epic 2):**
   - **Risk:** Slow code generation, iframe crashes
   - **Mitigation:** Optimization, sandboxing, error boundaries
   - **Contingency:** Simplified preview, external preview link

---

## Testing Strategy

### Unit Tests
- Target: 80% code coverage
- Focus: Services, utilities, business logic
- Run: On every commit (CI)

### Integration Tests
- Target: All API endpoints
- Focus: Database interactions, external APIs
- Run: On every PR

### E2E Tests
- Target: Happy paths for all epics
- Focus: User workflows, critical features
- Run: Before deployment

### Manual QA
- Full feature testing before each phase
- Exploratory testing
- Cross-browser/device testing
- Security testing

---

## Deployment Strategy

### Environments

1. **Development:**
   - Feature branches
   - Local database
   - Test mode for external services

2. **Staging:**
   - Preview deployments on Vercel
   - Staging database (PostgreSQL on Railway)
   - Stripe test mode
   - Apple/Expo test accounts

3. **Production:**
   - Main branch deployments
   - Production database
   - Stripe live mode
   - Real Apple/Expo accounts

### Rollout Plan

**Soft Launch (End of Week 9):**
- Deploy to production
- Enable for internal team (10 users)
- Monitor for 48 hours
- Fix critical bugs

**Beta Launch (Week 10):**
- Enable for 100 beta users
- Collect feedback
- Monitor metrics (uptime, errors, performance)
- Iterate on UX issues

**Public Launch (Week 11):**
- Enable for all users
- Marketing campaign
- Monitor viral growth (referral metrics)
- Scale infrastructure as needed

---

## Success Metrics

### Phase 1: Authentication
- [ ] 0 security vulnerabilities
- [ ] < 200ms login response time
- [ ] 99.9% auth success rate

### Phase 2: Dashboard
- [ ] < 1s dashboard load time
- [ ] < 2s preview update time
- [ ] 0 message loss in chat

### Phase 3: Editing
- [ ] > 50% users click suggested prompts
- [ ] > 30% users use advanced toolbar
- [ ] < 100ms keyboard shortcut response

### Phase 4: Publishing
- [ ] > 95% build success rate
- [ ] < 30min average build time
- [ ] 0 credential leaks
- [ ] > 80% users publish successfully on first try

### Phase 5: Settings
- [ ] < 1% support tickets for account management
- [ ] 100% account deletion requests processed correctly

### Phase 6: Referrals
- [ ] > 30% of users generate at least 1 referral
- [ ] > 25% referral conversion rate (click → signup)
- [ ] Viral coefficient k > 0.3

### Overall Product Metrics
- [ ] 10,000 MAU (Monthly Active Users) by end of Q1
- [ ] 5% free → paid conversion rate
- [ ] < 1% churn rate
- [ ] NPS > 50

---

## Budget & Cost Estimates

### External Services (Monthly)

| Service | Purpose | Cost |
|---------|---------|------|
| Vercel Pro | Frontend hosting | $20/mo |
| Railway | Backend + PostgreSQL | $20/mo |
| Redis Cloud | BullMQ queue | $10/mo |
| Resend/SendGrid | Email notifications | $10/mo |
| Cloudflare R2 | File storage | $5/mo |
| Stripe | Payment processing | 2.9% + $0.30 per transaction |
| Apple Developer | Publishing | $99/year |
| Expo | Build services | $29/mo per developer |
| **Total** | | **~$105/mo + $99/year** |

### Development Costs

Assuming contractors at market rates:
- Full-Stack Lead: $80/hr × 400 hours = $32,000
- Frontend Developer: $70/hr × 400 hours = $28,000
- Backend/DevOps: $75/hr × 200 hours = $15,000
- **Total Development:** ~$75,000 for 10-week project

---

## Milestones & Checkpoints

### Milestone 1: MVP Auth (End of Week 1)
- [ ] Users can sign up, log in, and authenticate
- **Checkpoint:** Demo to stakeholders

### Milestone 2: Core Product (End of Week 3)
- [ ] Users can create projects and iterate with AI
- **Checkpoint:** Internal dogfooding begins

### Milestone 3: Enhanced Editing (End of Week 4)
- [ ] Suggested prompts and advanced toolbar live
- **Checkpoint:** User testing with 5 beta users

### Milestone 4: Publishing Ready (End of Week 7)
- [ ] End-to-end publishing flow functional
- **Checkpoint:** Publish 3 test apps successfully

### Milestone 5: Full Feature Set (End of Week 9)
- [ ] All 6 epics complete
- **Checkpoint:** Soft launch to internal team

### Milestone 6: Public Launch (Week 11)
- [ ] Beta feedback incorporated
- [ ] All metrics green
- **Checkpoint:** Public launch announcement

---

## Communication & Reporting

### Daily Standups (15 min)
- What did you complete yesterday?
- What are you working on today?
- Any blockers?

### Weekly Sprint Reviews (Friday, 1 hour)
- Demo completed features
- Review metrics
- Identify risks
- Plan next week

### Bi-weekly Retrospectives (Every other Friday, 30 min)
- What went well?
- What could be improved?
- Action items for next sprint

### Status Reports (Weekly)
- Publish to Slack/Email
- Include: progress %, completed tasks, upcoming work, blockers
- Metrics dashboard link

---

## Appendix A: Database Migration Plan

### Migration Sequence

1. **Migration 001:** User + Session + OAuthAccount (Epic 1)
2. **Migration 002:** Workflow + ChatMessage (Epic 2)
3. **Migration 003:** Publishing (Epic 4)
4. **Migration 004:** ReferralClick + User referral fields (Epic 6)

### Rollback Strategy

Each migration includes `down()` method to reverse changes:
```bash
# Rollback last migration
npx prisma migrate rollback

# Rollback to specific migration
npx prisma migrate resolve --rolled-back <migration-name>
```

### Data Migration

For existing users:
- Generate referral codes for all users
- Backfill `createdAt` timestamps
- Soft delete test accounts

---

## Appendix B: External Account Setup Checklist

### Required Accounts

- [ ] **Apple Developer Account** ($99/year)
  - Enable App Store Connect API
  - Create API key (Team ID, Key ID, Issuer ID, Private Key)
  - Add team members

- [ ] **Expo Account** (Free tier OK for testing)
  - Create organization
  - Generate access token
  - Configure build settings

- [ ] **Stripe Account** (Free)
  - Enable test mode
  - Configure webhooks
  - Create products/prices
  - Generate API keys

- [ ] **Email Service** (Resend or SendGrid)
  - Verify domain
  - Create API key
  - Set up email templates

- [ ] **Storage Provider** (Cloudflare R2 or AWS S3)
  - Create bucket
  - Configure CORS
  - Generate access keys

---

## Appendix C: Monitoring & Observability

### Metrics to Track

**Performance:**
- API response times (p50, p95, p99)
- Database query times
- Frontend bundle size
- Lighthouse scores

**Reliability:**
- Uptime %
- Error rate
- WebSocket connection stability
- Build success rate

**Business:**
- Daily active users (DAU)
- Project creation rate
- Publishing success rate
- Referral conversion rate

### Tools

- **Frontend:** Vercel Analytics, Web Vitals
- **Backend:** New Relic or Datadog
- **Errors:** Sentry
- **Logs:** Papertrail or LogDNA
- **Business Metrics:** Mixpanel or Posthog

---

## Appendix D: Post-Launch Roadmap

### Q1 2026 (Months 1-3)
- Fix bugs from initial launch
- Optimize performance bottlenecks
- Add missing features from user feedback
- Scale infrastructure for growth

### Q2 2026 (Months 4-6)
- Web app publishing (not just mobile)
- Advanced code editing (syntax highlighting, autocomplete)
- Team collaboration features
- API integrations (third-party services)

### Q3 2026 (Months 7-9)
- Multi-language support (i18n)
- White-label solution for enterprises
- On-premise deployment option
- Advanced analytics dashboard

---

**Last Updated:** 2026-01-12
**Status:** Ready for Execution
**Approved By:** TBD
**Start Date:** TBD
