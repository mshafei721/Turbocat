# Product Requirements Document (PRD)
## Turbocat - AI-Native App Builder

**Version:** 2.0
**Last Updated:** 2026-01-12
**Status:** Active - UI Redesign Phase
**Owner:** Product Team

---

## 1. Executive Summary

### Problem Statement
Non-technical founders and entrepreneurs have great app ideas but face massive barriers: learning to code takes months, hiring developers costs tens of thousands, and no-code platforms still require understanding complex configurations. This leaves 99% of app ideas unrealized.

### Solution
Turbocat (formerly VibeCode) transforms natural language into production-ready mobile and web applications. Users describe their vision in plain English, and our AI generates, previews, and deploys fully functional apps in minutes, not months.

### Success Metrics
- **Time to First Preview:** < 30 seconds
- **Time to App Store Submission:** < 10 minutes
- **User Retention (D7):** > 60%
- **Apps Published:** > 30% of created apps
- **NPS Score:** > 50

---

## 2. Target Users

### Primary Persona: "Sarah - The Non-Technical Founder"
- **Background:** Marketing professional with a mobile app idea
- **Pain:** Doesn't know how to code, can't afford $50k+ developer
- **Goal:** Launch MVP to validate market fit quickly
- **Success:** Working app in App Store within 2 weeks

### Secondary Persona: "Marcus - The Product Manager"
- **Background:** PM at mid-size company, technical literacy but not a developer
- **Pain:** Prototyping takes weeks, design-to-code handoffs are slow
- **Goal:** Rapid prototyping to test ideas with users
- **Success:** Multiple prototypes tested per quarter

### Tertiary Persona: "Aisha - The Designer"
- **Background:** UI/UX designer who wants functional prototypes
- **Pain:** Static mockups don't convey interactions well
- **Goal:** Interactive prototypes with real functionality
- **Success:** Prototypes that feel like real apps

---

## 3. User Stories (Extracted from UI Vision)

### Epic 1: Authentication & Onboarding

#### US-001: User Registration
**As a** new user
**I want to** sign up with Google or Apple
**So that** I can quickly create an account without remembering another password

**Acceptance Criteria:**
- [ ] "Continue with Google" button triggers Google OAuth flow
- [ ] "Continue with Apple" button triggers Apple Sign In
- [ ] Email/password fallback available with validation
- [ ] Split-screen design: left = auth form, right = hero message
- [ ] Dark theme by default with clean, minimal UI
- [ ] Account created and immediately logged in on success

**Priority:** P0 (Critical)
**Effort:** Medium
**Dependencies:** OAuth provider setup

---

#### US-002: Returning User Login
**As a** returning user
**I want to** see a "Welcome back" message with my previous session
**So that** I can continue where I left off

**Acceptance Criteria:**
- [ ] "Welcome back" greeting on login screen
- [ ] "Continue where you left off" subtitle
- [ ] Last accessed project shown (if applicable)
- [ ] Social login + email/password options
- [ ] "Forgot password?" link functional

**Priority:** P1 (High)
**Effort:** Small

---

### Epic 2: Dashboard & Project Management

#### US-003: View App Library
**As a** logged-in user
**I want to** see all my created apps in a grid view
**So that** I can quickly find and access my projects

**Acceptance Criteria:**
- [ ] Left sidebar with "+ New app" button at top
- [ ] Grid view shows project cards with mobile preview thumbnails
- [ ] Each card displays: name, platform badge (Mobile/Web), last updated time
- [ ] Search bar filters projects by name
- [ ] Grid/List toggle button in top right
- [ ] Empty state shows "Create your first app" with CTA

**Priority:** P0 (Critical)
**Effort:** Medium
**Reference:** vibecode app user dashboard.png

---

#### US-004: Create New Project
**As a** user
**I want to** create a new app by describing what I want
**So that** the AI can generate it for me

**Acceptance Criteria:**
- [ ] Clicking "+ New app" navigates to /new
- [ ] Large prompt input field: "Describe what you want to build..."
- [ ] Platform selector chips (Mobile | Web) inline or near input
- [ ] Claude model selector dropdown (e.g., "Claude Opus 4.5")
- [ ] Optional "Enable Backend" toggle (beta)
- [ ] Submit button or Enter key triggers generation
- [ ] Loading state with "Building your app..." message

**Priority:** P0 (Critical)
**Effort:** Large
**Reference:** vibecode app page 1.png, vibe code app new project screen.png

---

#### US-005: Real-Time Mobile Preview
**As a** user building a mobile app
**I want to** see a live preview of my app as it's being built
**So that** I can verify it matches my expectations

**Acceptance Criteria:**
- [ ] Right side of screen shows iPhone frame with live preview
- [ ] Preview updates in real-time as AI generates code
- [ ] Loading state: "Your app preview will appear here"
- [ ] Tooltip: "Preview may not be fully accurate. Test on a real device."
- [ ] "Open on mobile" button links to Expo Go or similar
- [ ] Preview is interactive (tappable buttons, scrollable content)

**Priority:** P0 (Critical)
**Effort:** XLarge
**Reference:** vibe code app existing project with chat-presistant and preview.png

---

#### US-006: Persistent Chat History
**As a** user iterating on my app
**I want to** see the full conversation history with the AI
**So that** I can understand what changes were made and why

**Acceptance Criteria:**
- [ ] Left panel shows chronological chat history
- [ ] User messages and AI responses clearly differentiated
- [ ] AI responses show: code changes, design decisions, color palettes
- [ ] Expandable sections for long responses
- [ ] Scroll position preserved on page reload
- [ ] Chat persisted to database, loaded on project open

**Priority:** P1 (High)
**Effort:** Medium
**Reference:** vibe code app existing project with chat-presistant and preview.png

---

### Epic 3: Editing & Iteration

#### US-007: Suggested Prompts
**As a** user unsure what to say next
**I want to** see suggested prompts I can tap
**So that** I can quickly iterate on my app

**Acceptance Criteria:**
- [ ] Bottom of screen shows horizontal scrollable chips
- [ ] Examples: "AI Chat", "Mood Tracker", "Social app", "Plant Care", "Workout Timer"
- [ ] Tapping a chip inserts text into prompt input
- [ ] Chips contextual to current project state
- [ ] User can still type custom prompts

**Priority:** P2 (Medium)
**Effort:** Small
**Reference:** vibe code app new project screen.png

---

#### US-008: Advanced Toolbar
**As a** power user
**I want to** access advanced features via a toolbar
**So that** I can add specific functionality quickly

**Acceptance Criteria:**
- [ ] Bottom toolbar with icons: Image, Audio, API, Payment, Cloud, Haptics, File, Env Var, Logs, UI, Select, Request
- [ ] Clicking icon opens relevant configuration panel or inserts template
- [ ] Tooltip on hover explains each icon
- [ ] Icons disabled if feature not applicable to current project
- [ ] Toolbar collapsible to maximize screen space

**Priority:** P2 (Medium)
**Effort:** Large
**Reference:** vibe code app new project screen.png

---

### Epic 4: Publishing Flow

#### US-009: Initiate Publishing
**As a** user with a completed app
**I want to** publish my app to the App Store
**So that** users can download and use it

**Acceptance Criteria:**
- [ ] "Publish" button in top-right header
- [ ] Clicking shows modal: "Let's publish your app to the App Store"
- [ ] Modal displays 4-step process:
  1. Create your app (can update while on App Store)
  2. Set up your app details
  3. Configure build credentials
  4. Track your submission
- [ ] "Get Started" button begins flow
- [ ] Progress bar shows current step

**Priority:** P1 (High)
**Effort:** XLarge
**Reference:** vibe code app publish menu after clicking publish button.png

---

#### US-010: Prerequisites Checklist
**As a** user starting the publishing process
**I want to** verify I meet Apple's requirements
**So that** I don't waste time if I'm not ready

**Acceptance Criteria:**
- [ ] Checklist screen with 3 items:
  - "I have paid for the Apple Developer Program"
  - "I have signed all required agreements in App Store Connect"
  - "I have my Apple Device ready to receive 2FA codes"
- [ ] All checkboxes must be checked to proceed
- [ ] "Join Apple Developer Program" button (external link)
- [ ] "App Store Connect" button (external link)
- [ ] Back button returns to dashboard
- [ ] "Next" button disabled until all checked

**Priority:** P1 (High)
**Effort:** Small
**Reference:** vibe code app publish checklist.png

---

#### US-011: Apple Developer Sign-In
**As a** user publishing my app
**I want to** securely sign in to my Apple Developer account
**So that** Turbocat can submit on my behalf

**Acceptance Criteria:**
- [ ] Form fields: "Apple ID (Email)", "Password", "Add Apple Team ID (optional)"
- [ ] Password field has show/hide toggle
- [ ] Team ID expandable section with explanation
- [ ] "Sign in" action validates credentials with Apple
- [ ] Error handling for invalid credentials
- [ ] Credentials stored encrypted in backend
- [ ] Back and Next navigation buttons

**Priority:** P1 (High)
**Effort:** Large
**Reference:** vibe code app apple sign in.png

---

#### US-012: Expo Access Token Setup
**As a** user publishing a mobile app
**I want to** provide my Expo access token
**So that** Turbocat can build and deploy my app

**Acceptance Criteria:**
- [ ] Explanation text: "We need an Expo access token to build and deploy your app..."
- [ ] "Get access token from Expo" button (opens Expo dashboard)
- [ ] Password-style input field for token (masked with ••••)
- [ ] Copy, show/hide, and help icons
- [ ] Token validated before proceeding
- [ ] Stored encrypted in backend
- [ ] "Start Build" button triggers build process

**Priority:** P1 (High)
**Effort:** Medium
**Reference:** vibe code app expo access token.png

---

#### US-013: App Icon Confirmation
**As a** user finalizing my app
**I want to** confirm or generate an app icon
**So that** my app looks professional in the App Store

**Acceptance Criteria:**
- [ ] Screen shows current/proposed app icon
- [ ] App name displayed below icon
- [ ] "Upload" button to upload custom icon
- [ ] "Generate" button to AI-generate icon
- [ ] Icon preview meets Apple technical requirements (rounded square)
- [ ] Explanation: "Your app needs an icon to be published..."
- [ ] Back and Next navigation

**Priority:** P2 (Medium)
**Effort:** Medium
**Reference:** vibe code app apple app icon.png

---

#### US-014: App Details Confirmation
**As a** user about to submit
**I want to** confirm app name, version, and settings
**So that** my app is configured correctly

**Acceptance Criteria:**
- [ ] Form fields: "App Name", "Version Number"
- [ ] Toggle: "Support iPad" (on by default)
- [ ] "Advanced Settings (optional)" expandable section
- [ ] Validation: name <= 30 chars, version format X.X.X
- [ ] Preview of how name appears in App Store
- [ ] Back and Next navigation

**Priority:** P2 (Medium)
**Effort:** Small
**Reference:** vibe code app apple additional flow for publishing the app.png

---

### Epic 5: Settings & Account Management

#### US-015: User Profile Settings
**As a** logged-in user
**I want to** view and edit my profile settings
**So that** I can manage my account

**Acceptance Criteria:**
- [ ] Settings sidebar with tabs: Account, Referral history, Redeem promo code, Manage subscription, Credits balance, Auto reload, Support
- [ ] Account tab shows: Name, Email, Password (Google auth message), User ID, Account creation date
- [ ] "Sign out" button logs out and redirects to login
- [ ] "Delete account" button (red) with confirmation modal
- [ ] Save button to persist changes
- [ ] Success/error toasts on actions

**Priority:** P2 (Medium)
**Effort:** Medium
**Reference:** vibe code app menu - user setting.png

---

### Epic 6: Referral & Monetization

#### US-016: Referral Program
**As a** user
**I want to** refer friends and get credits
**So that** I can use the platform for free/longer

**Acceptance Criteria:**
- [ ] "Refer friends" section in dashboard sidebar
- [ ] "Get the mobile app" CTA
- [ ] Message: "If someone signs up with your referral, you both get free credits!"
- [ ] "Copy referral link" button
- [ ] Toast confirmation on copy
- [ ] Referral history page shows: referred users, credits earned

**Priority:** P3 (Low)
**Effort:** Medium
**Reference:** vibecode app user dashboard.png

---

## 4. Functional Requirements

### 4.1 Authentication System
- **FR-001:** System MUST support Google OAuth 2.0
- **FR-002:** System MUST support Apple Sign In
- **FR-003:** System MUST support email/password with validation
- **FR-004:** System MUST enforce password complexity rules
- **FR-005:** System MUST provide "Forgot Password" flow
- **FR-006:** System MUST store passwords hashed with bcrypt

### 4.2 Project Management
- **FR-007:** System MUST persist all projects to database
- **FR-008:** System MUST support project search and filtering
- **FR-009:** System MUST track last updated timestamp
- **FR-010:** System MUST support soft delete (trash, not permanent)
- **FR-011:** System MUST support project duplication

### 4.3 AI Code Generation
- **FR-012:** System MUST stream AI responses in real-time
- **FR-013:** System MUST generate React Native code for mobile apps
- **FR-014:** System MUST generate Next.js code for web apps
- **FR-015:** System MUST persist full chat history per project
- **FR-016:** System MUST support iterative refinement via conversation

### 4.4 Mobile Preview
- **FR-017:** System MUST provide real-time mobile preview
- **FR-018:** System MUST support preview on physical device via Expo Go
- **FR-019:** System MUST display preview loading states
- **FR-020:** System MUST handle preview errors gracefully

### 4.5 Publishing System
- **FR-021:** System MUST integrate with Expo Build API
- **FR-022:** System MUST integrate with Apple App Store Connect API
- **FR-023:** System MUST validate Apple Developer credentials
- **FR-024:** System MUST store credentials encrypted (AES-256)
- **FR-025:** System MUST track build status (pending, building, success, failed)
- **FR-026:** System MUST provide rollback capability

---

## 5. Non-Functional Requirements

### 5.1 Performance
- **NFR-001:** AI response latency MUST be < 2 seconds (P95)
- **NFR-002:** Preview update latency MUST be < 500ms (P95)
- **NFR-003:** Dashboard load time MUST be < 1 second (P95)
- **NFR-004:** System MUST support 10,000 concurrent users

### 5.2 Security
- **NFR-005:** System MUST encrypt credentials at rest (AES-256)
- **NFR-006:** System MUST use HTTPS for all communication
- **NFR-007:** System MUST implement CORS with origin whitelisting
- **NFR-008:** System MUST rate limit API endpoints (60 req/min default)
- **NFR-009:** System MUST log all authentication events for audit

### 5.3 Reliability
- **NFR-010:** System MUST achieve 99.9% uptime (3 nines)
- **NFR-011:** System MUST auto-retry failed builds (max 3 attempts)
- **NFR-012:** System MUST persist chat history (no data loss)
- **NFR-013:** System MUST support graceful degradation (Redis optional)

### 5.4 Usability
- **NFR-014:** UI MUST be accessible (WCAG 2.1 Level AA)
- **NFR-015:** UI MUST support dark mode (default)
- **NFR-016:** UI MUST support light mode (optional toggle)
- **NFR-017:** UI MUST be responsive (mobile, tablet, desktop)
- **NFR-018:** UI MUST have keyboard navigation support

### 5.5 Scalability
- **NFR-019:** System MUST scale horizontally (stateless backend)
- **NFR-020:** System MUST use CDN for static assets
- **NFR-021:** System MUST use database connection pooling
- **NFR-022:** System MUST use Redis for session/queue in production

---

## 6. Out of Scope (This Phase)

### Explicitly NOT Included:
1. Android app support (iOS only)
2. Team collaboration features
3. Version history and rollbacks (per project)
4. Custom domain deployment
5. White-label solutions
6. Marketplace for templates
7. Component library builder
8. Real-time multiplayer editing
9. Video tutorials/onboarding
10. Native app analytics dashboard

---

## 7. Design Requirements

### 7.1 Visual Design
- **Primary Colors:** Orange (#F97316), Teal (#14B8A6) - Dark Mode
- **Primary Colors:** Terracotta (#D97706), Sage (#65A30D) - Light Mode
- **Typography:** Modern sans-serif (system font stack)
- **Layout:** Split-screen (chat + preview), card-based
- **Motion:** Smooth, purposeful animations (Framer Motion)

### 7.2 Component Library
- **Base:** shadcn/ui style components
- **Icons:** Phosphor Icons (consistent weight and style)
- **Forms:** React Hook Form + Zod validation
- **Feedback:** Toast notifications for actions

---

## 8. Success Criteria (Launch)

### Must Have (P0):
- [ ] Google and Apple OAuth working
- [ ] Project dashboard with grid view
- [ ] New project creation with prompt input
- [ ] Real-time AI code generation
- [ ] Mobile preview (even if basic)
- [ ] Chat history persistence
- [ ] User settings page
- [ ] Theme toggle (light/dark)

### Should Have (P1):
- [ ] Publishing flow (Expo + App Store)
- [ ] Suggested prompts
- [ ] Search and filtering
- [ ] Email password reset
- [ ] Referral system

### Nice to Have (P2):
- [ ] Advanced toolbar
- [ ] Grid/List toggle
- [ ] Project duplication
- [ ] App icon generator
- [ ] Referral history page

---

## 9. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Apple rejects AI-generated apps | High | Medium | Follow HIG strictly, manual review layer |
| AI generates broken code | High | Medium | Add validation layer, auto-testing |
| OAuth providers delay launch | High | Low | Email/password fallback, prioritize Google |
| Preview performance poor | Medium | Medium | Optimize bundle size, lazy loading |
| Expo build service unreliable | Medium | Low | Cache builds, retry logic, status monitoring |

---

## 10. Launch Plan

### Phase 1: Private Beta (Week 1-2)
- 50 invited users
- Focus: Core flow (create → preview → iterate)
- Metrics: Time to first preview, iteration count

### Phase 2: Limited Public Beta (Week 3-4)
- 500 users (waitlist)
- Add: Publishing flow, referral program
- Metrics: Apps published, referral conversion

### Phase 3: Public Launch (Week 5+)
- Open registration
- Marketing push (Product Hunt, social)
- Metrics: DAU, retention, NPS

---

## 11. Dependencies

### External:
1. **Google OAuth** - API credentials and app review
2. **Apple OAuth** - Developer account and app review
3. **Expo** - Build service API access
4. **Apple App Store Connect** - API access and credentials
5. **Supabase** - Database and auth helpers
6. **Anthropic Claude** - LLM API access

### Internal:
1. Backend OAuth integration complete
2. Frontend auth flow implementation
3. Mobile preview infrastructure
4. Publishing flow backend services
5. Email service setup (SendGrid/Postmark)

---

## 12. Open Questions

1. **Pricing Model:** Free tier limits? Pay-per-app or subscription?
2. **App Approval:** Manual review before publishing or trust AI?
3. **Code Ownership:** Who owns generated code? Open source?
4. **Monetization:** Commission on published apps?
5. **Support Model:** Self-service only or live chat for paid users?

---

## Appendix: Reference Screenshots

1. `vibecode app login.png` - Split-screen auth with hero message
2. `vibecode app page 1.png` - Landing page with prompt input
3. `vibecode app user dashboard.png` - App library grid view
4. `vibe code app new project screen.png` - Project creation with preview
5. `vibe code app existing project with chat-presistant and preview.png` - Chat + preview
6. `vibe code app publish menu after clicking publish button.png` - Publishing modal
7. `vibe code app publish checklist.png` - Prerequisites checklist
8. `vibe code app apple sign in.png` - Apple credentials form
9. `vibe code app expo access token.png` - Expo token setup
10. `vibe code app apple app icon.png` - Icon confirmation
11. `vibe code app apple additional flow for publishing the app.png` - App details
12. `vibe code app menu - user setting.png` - Settings sidebar

---

**Document Status:** Living Document
**Review Cadence:** Weekly during active development
**Stakeholders:** Product, Engineering, Design, Marketing
