# Turbocat Project Gap Analysis

> Generated: 2026-01-09
> Reference: Vibecode app UI features
> Status: Comprehensive review complete

---

## Executive Summary

Turbocat is a multi-agent AI coding platform with solid foundations but significant gaps compared to the Vibecode reference implementation. The platform has working GitHub OAuth, basic project creation, and file management, but lacks critical features for production readiness.

### Overall Completion: ~55%

| Category | Completion | Priority |
|----------|------------|----------|
| Authentication | 60% | CRITICAL |
| Dashboard/App Library | 85% | HIGH |
| Project Workspace | 70% | HIGH |
| Settings | 40% | MEDIUM |
| Publish Flow | 15% | HIGH |
| Testing | 40% | CRITICAL |
| Routing | 75% | MEDIUM |

---

## 1. CRITICAL SECURITY GAPS

### 1.1 Exposed Credentials (IMMEDIATE ACTION REQUIRED)

**Location:** `turbocat-agent/.env.local`

The `.env.local` file contains actual credentials that should NOT be in the repository:
- PostgreSQL connection URL
- Vercel API tokens
- GitHub OAuth credentials
- API keys (Anthropic, OpenAI, Gemini)
- Encryption keys (JWE_SECRET, ENCRYPTION_KEY)

**Action Required:**
1. Revoke all exposed credentials immediately
2. Regenerate new credentials
3. Remove `.env.local` from repo
4. Add to `.gitignore`
5. Use `.env.example` with placeholder values only

### 1.2 Rate Limiting Not Enabled

- Rate limiting middleware exists but is commented out
- Requires Redis in production
- Risk: API abuse, cost overruns on AI services

---

## 2. ROUTING & NAVIGATION GAPS

### 2.1 Broken/Orphaned Routes (10+ routes)

| Route | Referenced In | Status | Fix |
|-------|---------------|--------|-----|
| `/forgot-password` | AuthPage.tsx:243 | BROKEN | Implement or remove link |
| `/terms` | LandingFooter.tsx:130 | BROKEN | Implement or remove link |
| `/referrals` | LandingFooter.tsx:34 | BROKEN | Implement or remove link |
| `/pricing` | LandingNav.tsx:18, LandingFooter.tsx:48 | BROKEN | Implement or remove link |
| `/blog` | LandingNav.tsx:19, LandingFooter.tsx:26,49 | BROKEN | Implement or remove link |
| `/community` | LandingNav.tsx:20 | BROKEN | Implement or remove link |
| `/faqs` | LandingNav.tsx:21, LandingFooter.tsx:41 | BROKEN | Implement or remove link |
| `/docs` | LandingNav.tsx:22, LandingFooter.tsx:42,49 | BROKEN | Implement or remove link |
| `/project/[id]/settings` | WorkspaceHeader.tsx | BROKEN | Implement or use modal |
| `/skills/[skillSlug]` | skills-page-client.tsx | BROKEN | Implement dynamic route |
| `/skills/[skillSlug]/logs` | skills-page-client.tsx | BROKEN | Implement dynamic route |
| `/skills/new` | skills-page-client.tsx | BROKEN | Implement route |

### 2.2 Working Routes (11 routes)

| Route | Status | Notes |
|-------|--------|-------|
| `/` | OK | Landing page |
| `/login` | OK | GitHub/Vercel OAuth |
| `/signup` | OK | Same as login |
| `/new` | OK | Project creation |
| `/dashboard` | OK | Project list |
| `/profile` | OK | User profile |
| `/settings` | OK | Basic settings |
| `/project/[id]` | OK | Project workspace |
| `/skills` | OK | Skills management |
| `/tasks` | REDIRECT | → /dashboard |
| `/tasks/[taskId]` | REDIRECT | → /project/[taskId] |

---

## 3. AUTHENTICATION GAPS

### 3.1 Current Status

| Feature | Status | Notes |
|---------|--------|-------|
| GitHub OAuth | COMPLETE | Full flow with Arctic, PKCE |
| Vercel OAuth | COMPLETE | Full flow with Arctic, PKCE |
| Google OAuth | MISSING | UI buttons exist, no backend |
| Apple OAuth | MISSING | UI buttons exist, no backend |
| Email/Password Login | MISSING | UI form exists, no backend |
| Email/Password Signup | MISSING | UI form exists, no backend |
| Forgot Password | MISSING | Link exists, no page/flow |
| Email Verification | MISSING | No email service |
| Session Persistence | COMPLETE | JWE-encrypted cookies |
| Protected Routes | COMPLETE | Layout-level auth checks |
| Token Encryption | COMPLETE | AES-256-CBC |
| Account Merging | COMPLETE | GitHub reconnect handling |

### 3.2 Files to Create for Auth Expansion

```
app/api/auth/signin/google/route.ts        # Google OAuth initiation
app/api/auth/callback/google/route.ts      # Google OAuth callback
app/api/auth/signin/apple/route.ts         # Apple OAuth initiation
app/api/auth/callback/apple/route.ts       # Apple OAuth callback
app/api/auth/signin/email/route.ts         # Email/password login
app/api/auth/signup/email/route.ts         # Email/password registration
app/api/auth/forgot-password/route.ts      # Password reset request
app/api/auth/reset-password/route.ts       # Password reset completion
app/(auth)/forgot-password/page.tsx        # Password reset page
lib/auth/providers.ts                      # Add Google, Apple providers
```

---

## 4. DASHBOARD/APP LIBRARY GAPS

### 4.1 Architectural Issue: Sidebar Not in Layout

**Problem:** DashboardSidebar is rendered INSIDE DashboardPage component, not at the layout level.

**Impact:**
- Sidebar only appears on `/dashboard`
- `/settings` page has NO sidebar
- `/profile` page has NO sidebar
- Inconsistent navigation experience

**Fix Required:**
```
app/(dashboard)/layout.tsx  # Add DashboardSidebar here
components/turbocat/DashboardPage.tsx  # Remove sidebar from here
```

### 4.2 Feature Comparison

| Feature | Target (Vibecode) | Current | Gap |
|---------|-------------------|---------|-----|
| Sidebar structure | Fixed left | In component | Move to layout |
| New app dropdown | 3 options | 3 options | OK |
| App library search | Real-time | Real-time | OK |
| Platform filter | Yes | Yes | OK |
| Grid/list toggle | Yes | Yes | OK |
| Project cards | With preview | With preview | OK |
| Delete project | Functional | Stub only | Implement API |
| Duplicate project | Functional | Stub only | Implement API |
| Referral section | With tracking | UI only | Implement backend |
| Mobile app link | Yes | Yes | OK |
| User profile menu | Yes | Yes | OK |

### 4.3 Unimplemented Actions

**Delete Project:**
- Location: `DashboardPage.tsx:69-72`
- Status: `console.log()` only
- Need: API endpoint + confirmation dialog

**Duplicate Project:**
- Location: `DashboardPage.tsx:74-77`
- Status: `console.log()` only
- Need: API endpoint + new project creation

---

## 5. PROJECT WORKSPACE GAPS

### 5.1 Feature Comparison

| Component | Target | Current | Coverage |
|-----------|--------|---------|----------|
| Header | Full | Partial | 80% |
| Chat Panel | Full | Partial | 70% |
| Device Preview | Full | Good | 90% |
| Layout | Full | Good | 85% |
| **Model Selector** | **Required** | **MISSING** | **0%** |
| **Feature Icons Bar** | **Required** | **MISSING** | **0%** |
| Attachments | Full | UI only | 30% |
| Suggestions | Contextual | Generic | 50% |
| Credits Display | Dynamic | Hardcoded | 50% |

### 5.2 Critical Missing Components

**1. Model Selector (CRITICAL)**
- Target: Claude Opus 4.5 dropdown in chat
- Current: Not implemented
- Impact: Users cannot choose AI model
- Files needed:
  ```
  components/turbocat/ModelSelector.tsx
  # Update WorkspaceChat.tsx to include
  # Update AI API to accept model parameter
  ```

**2. Feature Icons Toolbar (CRITICAL)**
- Target: Image, Audio, API, Payment, Cloud, Haptics, File, Env Var, Logs, UI, Select, Request
- Current: Only Image/Audio buttons (non-functional)
- Impact: Key differentiator missing
- Files needed:
  ```
  components/turbocat/FeatureToolbar.tsx
  # 12 feature icons with handlers
  ```

**3. Functional Attachments (HIGH)**
- Image button: UI exists, no handler
- Audio button: UI exists, no handler
- Location: `PromptInput.tsx:138-168`

### 5.3 Workspace Files Reference

```
components/turbocat/ProjectWorkspace.tsx    # Main container
components/turbocat/WorkspaceHeader.tsx     # Header (credits hardcoded)
components/turbocat/WorkspaceChat.tsx       # Chat panel (no model selector)
components/turbocat/WorkspacePreview.tsx    # Device preview (90% complete)
components/turbocat/PromptInput.tsx         # Input (attachments non-functional)
components/turbocat/FileExplorer.tsx        # File tree (working)
```

---

## 6. SETTINGS & PUBLISH FLOW GAPS

### 6.1 Settings Page Comparison

| Feature | Target (Vibecode) | Current | Status |
|---------|-------------------|---------|--------|
| Modal with tabs | Yes | Card layout | Different pattern |
| Account info | Full | Basic | Partial |
| Referral history | Yes | No | MISSING |
| Promo code redemption | Yes | No | MISSING |
| Subscription management | Yes | No | MISSING |
| Credits balance | Yes | No | MISSING |
| Auto reload | Yes | No | MISSING |
| Support | Yes | No | MISSING |
| Sign out | Yes | In profile | Relocate |
| Delete account | Yes | Non-functional | Implement |

### 6.2 Publish Flow Comparison

| Step | Target (Vibecode) | Current | Status |
|------|-------------------|---------|--------|
| Prerequisites checklist | Yes | No | MISSING |
| Publish overview | Yes | GitHub only | Partial |
| Apple Developer sign-in | Yes | No | MISSING |
| Expo access token | Yes | No | MISSING |
| App icon management | Yes | No | MISSING |
| App details form | Yes | No | MISSING |
| Multi-step wizard UI | Yes | GitHub modal only | Partial |

### 6.3 Missing Database Schemas

**Credits System:**
```typescript
credits: {
  id, userId, balance, totalEarned, totalSpent, lastUpdatedAt
}
creditTransactions: {
  id, userId, amount, type, description, referralId, createdAt
}
```

**Referral System:**
```typescript
referrals: {
  id, referrerId, refereeId, creditsEarned, status, createdAt, completedAt
}
```

**Promo Codes:**
```typescript
promoCodes: {
  id, code, creditsReward, maxUses, currentUses, expiresAt, createdAt
}
promoCodeRedemptions: {
  id, userId, promoCodeId, redeemedAt
}
```

**Publishing:**
```typescript
appPublishing: {
  id, taskId, userId, publishPlatform, expoProjectSlug, appleTeamId, publishStatus, createdAt, publishedAt
}
publishingCredentials: {
  id, userId, credentialType, encryptedValue, expiresAt, createdAt
}
```

---

## 7. TESTING GAPS

### 7.1 Coverage Summary

| Area | Current | Target | Gap |
|------|---------|--------|-----|
| Backend statements | 40.63% | 70% | -30% |
| Backend branches | 26.51% | 60% | -34% |
| Frontend components | ~20% | 70% | -50% |
| Frontend API routes | 0% | 80% | -80% |
| E2E user flows | 0% | 50% | -50% |

### 7.2 Critical Untested Areas

**Backend (15+ endpoints untested):**
- `/users/*` - All user management endpoints
- `/analytics/*` - All analytics endpoints
- `/deployments/*` - All deployment endpoints
- All middleware (auth, apiKey, errorHandler, security)
- Queue system (worker, monitor, processors)

**Frontend (42+ routes untested):**
- `/api/auth/*` - 11 authentication routes
- `/api/tasks/*` - 15+ task operation routes
- `/api/github/*` - 5 GitHub integration routes
- `/api/repos/*` - Repository operation routes
- `/api/api-keys/*` - API key management
- `/api/connectors/*` - Connector management

**Components (60+ untested):**
- All auth components
- All file operation components
- All MCP status components
- All icon components
- All layout components

### 7.3 Test Files to Create (Priority Order)

**Phase 1: Critical Path**
```
# Backend Services
backend/src/services/__tests__/analytics.service.test.ts
backend/src/services/__tests__/deployment.service.test.ts
backend/src/services/__tests__/session.service.test.ts

# Backend API Routes
backend/src/__tests__/integration/users.api.test.ts
backend/src/__tests__/integration/analytics.api.test.ts
backend/src/__tests__/integration/deployments.api.test.ts

# Backend Middleware
backend/src/__tests__/unit/middleware/auth.middleware.test.ts
backend/src/__tests__/unit/middleware/apiKey.middleware.test.ts

# Frontend API Routes
turbocat-agent/app/api/__tests__/auth.routes.test.ts
turbocat-agent/app/api/__tests__/tasks.routes.test.ts
```

**Phase 2: High Priority**
```
# Frontend Components
turbocat-agent/components/auth/__tests__/session-provider.test.tsx
turbocat-agent/components/auth/__tests__/sign-in.test.tsx
turbocat-agent/components/turbocat/__tests__/DashboardPage.test.tsx
turbocat-agent/components/turbocat/__tests__/ProjectWorkspace.test.tsx

# Backend Queue
backend/queue/__tests__/worker.test.ts
backend/queue/__tests__/agentExecutor.processor.test.ts
```

---

## 8. ARCHITECTURAL CHANGES REQUIRED

### 8.1 Priority Order

| Change | Risk | Impact | Files | Effort |
|--------|------|--------|-------|--------|
| Dashboard layout refactor | Low | High | 4 | 1-2 days |
| Remove broken nav links | Low | Medium | 2 | 1 day |
| Google OAuth | Medium | High | 4 | 2-3 days |
| Apple OAuth | Medium | High | 4 | 2-3 days |
| Email/password auth | Medium | High | 6 | 3-5 days |
| Credits system DB | Medium | High | 3 | 2-3 days |
| Model selector component | Low | High | 2 | 1-2 days |
| Feature toolbar | Low | High | 1 | 2-3 days |
| Publish wizard | High | High | 10 | 2-3 weeks |

### 8.2 Dashboard Layout Fix (IMMEDIATE)

**Current Structure:**
```
app/(dashboard)/layout.tsx         # Basic session check
components/DashboardPage.tsx       # Contains sidebar (wrong!)
```

**Target Structure:**
```
app/(dashboard)/layout.tsx         # Contains sidebar (correct!)
components/DashboardPage.tsx       # Content only
```

**Changes Required:**
1. Move `<DashboardSidebar>` from `DashboardPage.tsx` to `(dashboard)/layout.tsx`
2. Update `DashboardPage.tsx` to remove sidebar wrapper
3. Verify settings and profile pages work correctly
4. Test navigation between all dashboard routes

---

## 9. IMPLEMENTATION ROADMAP

### Phase 1: Foundation Fixes (1-2 weeks)
- [ ] Remove exposed credentials
- [ ] Dashboard layout refactor (sidebar in layout)
- [ ] Remove or implement broken navigation links
- [ ] Implement forgot-password route OR remove link

### Phase 2: Authentication Expansion (2-3 weeks)
- [ ] Google OAuth integration
- [ ] Apple OAuth integration
- [ ] Email/password authentication
- [ ] Password reset flow with email service

### Phase 3: Database & Backend (3-4 weeks)
- [ ] Credits system schema and API
- [ ] Referral tracking system
- [ ] Promo code system
- [ ] Publishing credentials storage

### Phase 4: Workspace Enhancement (2-3 weeks)
- [ ] Model selector component
- [ ] Feature icons toolbar
- [ ] Functional attachment buttons
- [ ] Dynamic suggestions

### Phase 5: Publish Flow (4-6 weeks)
- [ ] Multi-step wizard component
- [ ] Apple Developer integration
- [ ] Expo integration
- [ ] App icon management

### Phase 6: Testing (Ongoing)
- [ ] Backend service tests (Phase 1)
- [ ] API route tests (Phase 1)
- [ ] Component tests (Phase 2)
- [ ] E2E user flow tests (Phase 3)

---

## 10. FILE REFERENCE INDEX

### Frontend (turbocat-agent/)
```
app/(auth)/login/page.tsx                    # Login page
app/(auth)/signup/page.tsx                   # Signup page
app/(dashboard)/layout.tsx                   # Dashboard layout (needs sidebar)
app/(dashboard)/dashboard/page.tsx           # Dashboard page
app/(dashboard)/settings/page.tsx            # Settings page
app/(dashboard)/profile/page.tsx             # Profile page
app/(dashboard)/project/[id]/page.tsx        # Project workspace
app/new/page.tsx                             # New project page
components/turbocat/DashboardPage.tsx        # Dashboard content
components/turbocat/DashboardSidebar.tsx     # Sidebar component
components/turbocat/ProjectWorkspace.tsx     # Workspace container
components/turbocat/WorkspaceChat.tsx        # Chat panel
components/turbocat/WorkspacePreview.tsx     # Device preview
components/turbocat/PromptInput.tsx          # Input with suggestions
components/turbocat/AuthPage.tsx             # Auth UI component
components/turbocat/SettingsPage.tsx         # Settings content
components/turbocat/ProfilePage.tsx          # Profile content
lib/auth/providers.ts                        # OAuth provider config
lib/db/schema.ts                             # Database schema
```

### Backend (backend/)
```
src/services/auth.service.ts                 # Auth service (tested)
src/services/agent.service.ts                # Agent service (tested)
src/services/workflow.service.ts             # Workflow service (tested)
src/services/analytics.service.ts            # Analytics (UNTESTED)
src/services/deployment.service.ts           # Deployment (UNTESTED)
src/middleware/auth.ts                       # Auth middleware (UNTESTED)
src/middleware/apiKey.ts                     # API key middleware (UNTESTED)
prisma/schema.prisma                         # Database schema
```

---

## Appendix: Vibecode UI Reference Features

Based on analysis of reference images:

1. **Login Page**: Google + Apple OAuth, Email/password, Forgot password
2. **Landing Page**: Nav with Pricing/Blog/Community/FAQs/Docs, Hero prompt, Model selector, Enable Backend toggle
3. **Dashboard**: Left sidebar with New app dropdown, App library, Settings, Mobile app link, Refer friends, User profile
4. **Project Workspace**: Split view, AI chat with persistent history, Model selector, Feature toolbar, Device preview
5. **Settings Modal**: Tabs (Account, Referral, Promo, Subscription, Credits, Support), Sign out, Delete account
6. **Publish Flow**: Multi-step wizard (Prerequisites, Overview, Apple sign-in, Expo token, App icon, App details)

---

*This document should be updated as gaps are addressed. Mark items complete with [x] when done.*
