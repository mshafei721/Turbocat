# Development Tasks: OAuth Authentication

**Feature:** AUTH-001
**Total Estimated Effort:** 5-8 days
**Status:** Not Started

---

## Task Breakdown

### Phase 1: Setup & Configuration (Day 1)

#### Task 1.1: Google OAuth Setup
**Estimated Time:** 2 hours
**Assignee:** TBD
**Status:** TODO

**Steps:**
1. Create Google Cloud Platform project
2. Enable Google OAuth 2.0 API
3. Configure OAuth consent screen
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - http://localhost:3001/auth/google/callback (dev)
   - https://api.turbocat.com/auth/google/callback (prod)
6. Document client ID and secret in password manager
7. Add credentials to `.env.example` template

**Acceptance Criteria:**
- [ ] Google OAuth credentials created
- [ ] OAuth consent screen configured
- [ ] Redirect URIs whitelisted
- [ ] Credentials documented securely

---

#### Task 1.2: Apple Sign In Setup
**Estimated Time:** 3 hours
**Assignee:** TBD
**Status:** TODO

**Steps:**
1. Log into Apple Developer account
2. Create Sign In with Apple Service ID
3. Generate private key for Sign In with Apple
4. Download private key (.p8 file)
5. Configure domain and redirect URLs
6. Verify domain ownership (upload file to /.well-known/)
7. Document Team ID, Key ID, Service ID
8. Store private key securely

**Acceptance Criteria:**
- [ ] Apple Sign In Service ID created
- [ ] Private key generated and stored
- [ ] Domain verified
- [ ] Redirect URLs configured
- [ ] Credentials documented securely

---

#### Task 1.3: Environment Variables Setup
**Estimated Time:** 30 minutes
**Assignee:** TBD
**Status:** TODO

**Steps:**
1. Add OAuth variables to `backend/.env.example`
2. Add OAuth variables to `turbocat-agent/.env.example`
3. Update README with OAuth setup instructions
4. Add variables to staging environment
5. Add variables to production environment (when ready)

**Files Modified:**
- `backend/.env.example`
- `turbocat-agent/.env.example`
- `README.md`

**Acceptance Criteria:**
- [ ] All required OAuth env vars documented
- [ ] Example values provided
- [ ] Setup instructions clear and complete

---

### Phase 2: Database Schema (Day 1)

#### Task 2.1: Update User Model
**Estimated Time:** 1 hour
**Assignee:** TBD
**Status:** TODO

**Steps:**
1. Update `backend/prisma/schema.prisma`
2. Add OAuth fields to User model
3. Add composite unique index for (authProvider, authProviderId)
4. Generate Prisma client: `npx prisma generate`
5. Review generated TypeScript types

**Files Modified:**
- `backend/prisma/schema.prisma`

**Acceptance Criteria:**
- [ ] OAuth fields added to schema
- [ ] Unique index created
- [ ] Prisma client regenerated
- [ ] No TypeScript errors

---

#### Task 2.2: Create Database Migration
**Estimated Time:** 30 minutes
**Assignee:** TBD
**Status:** TODO

**Steps:**
1. Create migration: `npx prisma migrate dev --name add_oauth_fields`
2. Review generated SQL migration
3. Test migration on local database
4. Verify data integrity after migration
5. Document rollback SQL if needed

**Files Created:**
- `backend/prisma/migrations/YYYYMMDD_add_oauth_fields/migration.sql`

**Acceptance Criteria:**
- [ ] Migration created successfully
- [ ] Migration applied to dev database
- [ ] Existing users not affected
- [ ] Rollback SQL documented

---

### Phase 3: Backend Implementation (Days 2-3)

#### Task 3.1: Install Dependencies
**Estimated Time:** 15 minutes
**Assignee:** TBD
**Status:** TODO

**Steps:**
1. Install passport: `npm install passport`
2. Install Google strategy: `npm install passport-google-oauth20`
3. Install Apple strategy: `npm install passport-apple`
4. Install types: `npm install -D @types/passport @types/passport-google-oauth20`
5. Update package-lock.json

**Files Modified:**
- `backend/package.json`
- `backend/package-lock.json`

**Acceptance Criteria:**
- [ ] All dependencies installed
- [ ] No version conflicts
- [ ] TypeScript types available

---

#### Task 3.2: Create OAuth Security Utilities
**Estimated Time:** 2 hours
**Assignee:** TBD
**Status:** TODO

**Steps:**
1. Create `backend/src/lib/oauth-security.ts`
2. Implement `generateRandomState()` function
3. Implement `verifyState()` function with timing-safe comparison
4. Implement `encryptToken()` function using AES-256-GCM
5. Implement `decryptToken()` function
6. Write unit tests for each function

**Files Created:**
- `backend/src/lib/oauth-security.ts`
- `backend/src/lib/__tests__/oauth-security.test.ts`

**Acceptance Criteria:**
- [ ] All security functions implemented
- [ ] Unit tests written and passing
- [ ] CSRF protection working
- [ ] Token encryption working

---

#### Task 3.3: Configure Passport Strategies
**Estimated Time:** 4 hours
**Assignee:** TBD
**Status:** TODO

**Steps:**
1. Create `backend/src/lib/passport.ts`
2. Configure Google OAuth strategy
3. Implement Google callback handler
4. Implement user creation/linking logic for Google
5. Configure Apple Sign In strategy
6. Implement Apple callback handler
7. Implement user creation/linking logic for Apple
8. Handle edge cases (missing email, duplicate accounts)
9. Add comprehensive error handling

**Files Created:**
- `backend/src/lib/passport.ts`

**Acceptance Criteria:**
- [ ] Google strategy configured
- [ ] Apple strategy configured
- [ ] User creation logic works
- [ ] Account linking works
- [ ] Error handling comprehensive

---

#### Task 3.4: Create OAuth Routes
**Estimated Time:** 3 hours
**Assignee:** TBD
**Status:** TODO

**Steps:**
1. Create `backend/src/routes/oauth.ts`
2. Implement `GET /auth/google` endpoint
3. Implement `GET /auth/google/callback` endpoint
4. Implement `GET /auth/apple` endpoint
5. Implement `POST /auth/apple/callback` endpoint
6. Add CSRF state validation
7. Generate JWT tokens on success
8. Create audit log entries
9. Handle all error scenarios
10. Add comprehensive logging

**Files Created:**
- `backend/src/routes/oauth.ts`

**Files Modified:**
- `backend/src/app.ts` (register OAuth routes)

**Acceptance Criteria:**
- [ ] All OAuth endpoints implemented
- [ ] JWT generation working
- [ ] Session creation working
- [ ] Audit logging working
- [ ] Error handling comprehensive

---

#### Task 3.5: Update Auth Service
**Estimated Time:** 2 hours
**Assignee:** TBD
**Status:** TODO

**Steps:**
1. Update `backend/src/services/auth.service.ts`
2. Add `loginWithOAuth()` function
3. Add `linkOAuthAccount()` function
4. Update `generateJWT()` to handle OAuth users
5. Update session creation for OAuth
6. Add OAuth-specific audit log events

**Files Modified:**
- `backend/src/services/auth.service.ts`

**Acceptance Criteria:**
- [ ] OAuth login function implemented
- [ ] Account linking function implemented
- [ ] JWT generation supports OAuth
- [ ] Audit logging updated

---

### Phase 4: Frontend Implementation (Days 4-5)

#### Task 4.1: Create OAuth Button Component
**Estimated Time:** 2 hours
**Assignee:** TBD
**Status:** TODO

**Steps:**
1. Create `turbocat-agent/components/auth/OAuthButtons.tsx`
2. Add Google button with official branding
3. Add Apple button with official branding
4. Implement loading states
5. Handle button clicks (redirect to backend)
6. Add error toasts
7. Style for dark/light themes
8. Ensure accessibility (ARIA labels, keyboard navigation)

**Files Created:**
- `turbocat-agent/components/auth/OAuthButtons.tsx`

**Acceptance Criteria:**
- [ ] Google button styled correctly
- [ ] Apple button styled correctly
- [ ] Loading states work
- [ ] Redirects to backend OAuth endpoints
- [ ] Accessible

---

#### Task 4.2: Create OAuth Callback Page
**Estimated Time:** 2 hours
**Assignee:** TBD
**Status:** TODO

**Steps:**
1. Create `turbocat-agent/app/auth/callback/page.tsx`
2. Extract tokens from URL parameters
3. Store tokens in localStorage
4. Handle OAuth errors
5. Redirect to dashboard on success
6. Redirect to login on error
7. Show loading spinner during processing
8. Add error toast notifications

**Files Created:**
- `turbocat-agent/app/auth/callback/page.tsx`

**Acceptance Criteria:**
- [ ] Tokens extracted correctly
- [ ] Tokens stored securely
- [ ] Redirects work correctly
- [ ] Error handling comprehensive
- [ ] Loading states shown

---

#### Task 4.3: Update Login Page
**Estimated Time:** 1 hour
**Assignee:** TBD
**Status:** TODO

**Steps:**
1. Update `turbocat-agent/app/(auth)/login/page.tsx`
2. Add OAuth buttons above email/password form
3. Add "OR" divider
4. Maintain split-screen layout
5. Test responsive design
6. Add error message display from URL params

**Files Modified:**
- `turbocat-agent/app/(auth)/login/page.tsx`

**Acceptance Criteria:**
- [ ] OAuth buttons prominently displayed
- [ ] Layout matches design
- [ ] Responsive on mobile
- [ ] Error messages displayed

---

#### Task 4.4: Update Register Page
**Estimated Time:** 1 hour
**Assignee:** TBD
**Status:** TODO

**Steps:**
1. Update `turbocat-agent/app/(auth)/register/page.tsx`
2. Add OAuth buttons (same component)
3. Update copy for signup context
4. Maintain design consistency
5. Test responsive design

**Files Modified:**
- `turbocat-agent/app/(auth)/register/page.tsx`

**Acceptance Criteria:**
- [ ] OAuth buttons displayed
- [ ] Copy appropriate for signup
- [ ] Design consistent with login
- [ ] Responsive

---

#### Task 4.5: Update Auth Context/Hooks
**Estimated Time:** 2 hours
**Assignee:** TBD
**Status:** TODO

**Steps:**
1. Update auth context to handle OAuth tokens
2. Add OAuth user detection
3. Update `useAuth()` hook
4. Handle token refresh for OAuth users
5. Add logout for OAuth users
6. Test all auth flows

**Files Modified:**
- `turbocat-agent/contexts/AuthContext.tsx` (if exists)
- `turbocat-agent/hooks/useAuth.ts` (if exists)

**Acceptance Criteria:**
- [ ] OAuth users properly authenticated
- [ ] Token refresh works
- [ ] Logout works
- [ ] All auth flows tested

---

### Phase 5: Testing (Day 6)

#### Task 5.1: Backend Unit Tests
**Estimated Time:** 3 hours
**Assignee:** TBD
**Status:** TODO

**Steps:**
1. Write tests for OAuth security utilities
2. Write tests for Passport strategies
3. Write tests for OAuth routes
4. Write tests for user creation/linking
5. Write tests for error scenarios
6. Achieve >80% code coverage

**Files Created:**
- `backend/src/lib/__tests__/oauth-security.test.ts`
- `backend/src/lib/__tests__/passport.test.ts`
- `backend/src/routes/__tests__/oauth.test.ts`

**Acceptance Criteria:**
- [ ] All unit tests written
- [ ] All tests passing
- [ ] Code coverage >80%
- [ ] Edge cases tested

---

#### Task 5.2: Frontend Component Tests
**Estimated Time:** 2 hours
**Assignee:** TBD
**Status:** TODO

**Steps:**
1. Write tests for OAuth buttons component
2. Write tests for callback page
3. Test error handling
4. Test loading states
5. Test accessibility

**Files Created:**
- `turbocat-agent/components/auth/__tests__/OAuthButtons.test.tsx`
- `turbocat-agent/app/auth/callback/__tests__/page.test.tsx`

**Acceptance Criteria:**
- [ ] Component tests written
- [ ] All tests passing
- [ ] Accessibility tested
- [ ] Error states tested

---

#### Task 5.3: Integration Tests
**Estimated Time:** 4 hours
**Assignee:** TBD
**Status:** TODO

**Steps:**
1. Create test Google OAuth account
2. Create test Apple developer account
3. Write E2E test for Google OAuth signup
4. Write E2E test for Google OAuth login
5. Write E2E test for Apple Sign In signup
6. Write E2E test for Apple Sign In login
7. Write test for account linking
8. Write test for error scenarios

**Files Created:**
- `backend/src/__tests__/integration/oauth.test.ts`

**Acceptance Criteria:**
- [ ] E2E tests written
- [ ] All tests passing with test accounts
- [ ] Happy paths tested
- [ ] Error paths tested

---

### Phase 6: Documentation & Deployment (Days 7-8)

#### Task 6.1: Update API Documentation
**Estimated Time:** 1 hour
**Assignee:** TBD
**Status:** TODO

**Steps:**
1. Update OpenAPI/Swagger docs
2. Document OAuth endpoints
3. Add request/response examples
4. Document error codes
5. Publish updated API docs

**Files Modified:**
- `backend/src/docs/openapi.yaml` (if exists)

**Acceptance Criteria:**
- [ ] API docs updated
- [ ] Examples provided
- [ ] Error codes documented
- [ ] Docs published

---

#### Task 6.2: Create User Documentation
**Estimated Time:** 2 hours
**Assignee:** TBD
**Status:** TODO

**Steps:**
1. Write help article: "How to sign in with Google"
2. Write help article: "How to sign in with Apple"
3. Write FAQ: "OAuth data access and privacy"
4. Update privacy policy
5. Publish to help center

**Files Created:**
- `docs/help/oauth-google.md`
- `docs/help/oauth-apple.md`
- `docs/help/oauth-faq.md`

**Acceptance Criteria:**
- [ ] User guides written
- [ ] FAQ comprehensive
- [ ] Privacy policy updated
- [ ] Published to help center

---

#### Task 6.3: Deploy to Staging
**Estimated Time:** 2 hours
**Assignee:** TBD
**Status:** TODO

**Steps:**
1. Run database migration on staging
2. Deploy backend to staging
3. Deploy frontend to staging
4. Configure OAuth staging URLs
5. Test full OAuth flow on staging
6. Verify error handling
7. Check logging and monitoring

**Acceptance Criteria:**
- [ ] Deployed to staging
- [ ] Database migration successful
- [ ] OAuth flows working
- [ ] No errors in logs
- [ ] Monitoring configured

---

#### Task 6.4: Production Deployment
**Estimated Time:** 2 hours
**Assignee:** TBD
**Status:** TODO

**Steps:**
1. Create deployment plan with rollback
2. Schedule deployment window
3. Run database migration on production
4. Deploy backend to production
5. Deploy frontend to production
6. Enable feature flag gradually (10%, 50%, 100%)
7. Monitor error rates
8. Monitor OAuth adoption
9. Be ready to rollback if needed

**Acceptance Criteria:**
- [ ] Deployed to production
- [ ] Database migration successful
- [ ] Feature flag enabled
- [ ] No errors reported
- [ ] Monitoring shows expected metrics
- [ ] Rollback plan tested

---

#### Task 6.5: Post-Launch Monitoring
**Estimated Time:** Ongoing (first week)
**Assignee:** TBD
**Status:** TODO

**Steps:**
1. Monitor OAuth signup/login rates
2. Track error rates by provider
3. Monitor user feedback
4. Check support tickets
5. Analyze user adoption patterns
6. Create weekly summary report

**Acceptance Criteria:**
- [ ] Metrics dashboard created
- [ ] Alerts configured
- [ ] Weekly reports generated
- [ ] No critical issues

---

## Task Dependencies

```
1.1 (Google Setup) ──┐
1.2 (Apple Setup) ───┼──> 1.3 (Env Vars) ──> 2.1 (DB Schema) ──> 2.2 (Migration)
                     │                                                │
                     └────────────────────────────────────────────────┘
                                                                      │
                                                                      v
3.1 (Dependencies) ──> 3.2 (Security Utils) ──> 3.3 (Passport) ──> 3.4 (Routes) ──> 3.5 (Auth Service)
                                                                      │
                                                                      v
4.1 (OAuth Buttons) ──> 4.2 (Callback Page) ──> 4.3 (Login) ──> 4.4 (Register) ──> 4.5 (Auth Hooks)
                                                                      │
                                                                      v
                                    5.1 (Unit Tests) ──> 5.2 (Component Tests) ──> 5.3 (Integration Tests)
                                                                      │
                                                                      v
                       6.1 (API Docs) ──> 6.2 (User Docs) ──> 6.3 (Staging) ──> 6.4 (Production) ──> 6.5 (Monitoring)
```

---

## Daily Breakdown

### Day 1: Setup & Database
- Morning: Tasks 1.1, 1.2, 1.3 (OAuth provider setup)
- Afternoon: Tasks 2.1, 2.2 (Database changes)

### Day 2: Backend Core
- Morning: Tasks 3.1, 3.2 (Dependencies, security utils)
- Afternoon: Task 3.3 (Passport strategies - partial)

### Day 3: Backend Completion
- Morning: Task 3.3 (Passport strategies - complete)
- Afternoon: Tasks 3.4, 3.5 (Routes, auth service)

### Day 4: Frontend Core
- Morning: Tasks 4.1, 4.2 (OAuth buttons, callback page)
- Afternoon: Tasks 4.3, 4.4 (Update login/register)

### Day 5: Frontend Polish
- Morning: Task 4.5 (Auth hooks/context)
- Afternoon: Manual testing and bug fixes

### Day 6: Testing
- Morning: Tasks 5.1, 5.2 (Unit and component tests)
- Afternoon: Task 5.3 (Integration tests)

### Day 7: Documentation
- Morning: Task 6.1, 6.2 (API and user docs)
- Afternoon: Task 6.3 (Deploy to staging)

### Day 8: Production
- Morning: Final testing and preparation
- Afternoon: Task 6.4 (Production deployment)
- Evening: Task 6.5 (Monitoring setup)

---

## Progress Tracking

**Use this checklist to track overall progress:**

- [ ] Phase 1: Setup & Configuration (3 tasks)
- [ ] Phase 2: Database Schema (2 tasks)
- [ ] Phase 3: Backend Implementation (5 tasks)
- [ ] Phase 4: Frontend Implementation (5 tasks)
- [ ] Phase 5: Testing (3 tasks)
- [ ] Phase 6: Documentation & Deployment (5 tasks)

**Total Tasks:** 23
**Completed:** 0
**In Progress:** 0
**Blocked:** 0

---

**Last Updated:** 2026-01-12
**Next Review:** Daily standup
