# Feature Specification: OAuth Authentication

**Epic:** Authentication & Onboarding
**Feature ID:** AUTH-001
**Status:** Planned
**Priority:** P0 (Critical)
**Effort:** Large (5-8 days)
**Owner:** TBD

---

## Overview

Implement Google and Apple OAuth authentication to provide users with secure, passwordless login options. This replaces the current email-only authentication system with social login providers, significantly reducing friction in the signup process.

---

## Business Context

### Problem
- Current email/password-only authentication creates friction
- Users have "password fatigue" and prefer social login
- Competitor apps (Bubble, Glide) all offer OAuth
- 70%+ of users expect Google/Apple login on modern apps

### Opportunity
- Increase signup conversion by 30-40% (industry benchmark)
- Reduce support tickets for password resets
- Improve user trust through recognizable OAuth providers
- Enable faster onboarding (< 30 seconds to first project)

### Success Metrics
- **Primary:** Signup conversion rate increases to >60%
- **Secondary:** Time to first project creation < 2 minutes
- **Quality:** < 1% OAuth authentication failures
- **Adoption:** >70% of new users choose OAuth over email/password

---

## User Stories

### US-001: User Registration with OAuth
**As a** new user
**I want to** sign up with Google or Apple
**So that** I can quickly create an account without remembering another password

**Acceptance Criteria:**
- [ ] "Continue with Google" button triggers Google OAuth flow
- [ ] "Continue with Apple" button triggers Apple Sign In
- [ ] Email/password fallback remains available
- [ ] Split-screen design maintained (auth left, hero right)
- [ ] Dark theme styling applied consistently
- [ ] Account created and user immediately logged in on success
- [ ] OAuth errors handled gracefully with user-friendly messages

### US-002: Returning User Login
**As a** returning user
**I want to** see a "Welcome back" message with OAuth options
**So that** I can continue where I left off

**Acceptance Criteria:**
- [ ] "Welcome back" greeting displayed
- [ ] Social login + email/password options available
- [ ] User's previous OAuth provider suggested first
- [ ] Session automatically restored on successful login
- [ ] "Forgot password?" link visible for email/password users

---

## Functional Requirements

### Core Requirements
1. **FR-001:** System MUST support Google OAuth 2.0 authentication
2. **FR-002:** System MUST support Apple Sign In authentication
3. **FR-003:** System MUST handle OAuth callback URLs securely
4. **FR-004:** System MUST validate OAuth tokens with provider APIs
5. **FR-005:** System MUST create user accounts on first OAuth login
6. **FR-006:** System MUST link OAuth accounts to existing users by email
7. **FR-007:** System MUST store OAuth provider and provider user ID
8. **FR-008:** System MUST support multiple OAuth providers per user
9. **FR-009:** System MUST maintain backward compatibility with email/password

### User Experience Requirements
10. **FR-010:** OAuth buttons MUST appear above email/password form
11. **FR-011:** OAuth buttons MUST use official provider branding
12. **FR-012:** System MUST show loading state during OAuth flow
13. **FR-013:** System MUST redirect to dashboard after successful login
14. **FR-014:** System MUST display clear error messages on OAuth failure
15. **FR-015:** System MUST handle OAuth cancellation gracefully

### Security Requirements
16. **FR-016:** System MUST use PKCE flow for Google OAuth
17. **FR-017:** System MUST verify OAuth state parameter to prevent CSRF
18. **FR-018:** System MUST validate OAuth nonce for Apple Sign In
19. **FR-019:** System MUST store OAuth tokens encrypted (AES-256)
20. **FR-020:** System MUST refresh expired OAuth tokens automatically

---

## Non-Functional Requirements

### Performance
- **NFR-001:** OAuth callback processing MUST complete in < 500ms (P95)
- **NFR-002:** OAuth button click to provider page MUST be < 200ms
- **NFR-003:** Total signup time (click to dashboard) MUST be < 10 seconds

### Security
- **NFR-004:** OAuth implementation MUST follow OWASP best practices
- **NFR-005:** OAuth secrets MUST NOT be exposed in client-side code
- **NFR-006:** OAuth tokens MUST expire and be refreshed appropriately

### Reliability
- **NFR-007:** OAuth failure rate MUST be < 1%
- **NFR-008:** System MUST handle provider downtime gracefully
- **NFR-009:** System MUST log all OAuth events for debugging

---

## User Flow

### New User Signup Flow
```
1. User visits /login or /register
2. User sees split-screen: [Auth Form] | [Hero Message]
3. User clicks "Continue with Google" or "Continue with Apple"
4. Browser redirects to provider (Google/Apple)
5. User authenticates with provider
6. Provider redirects back to /auth/callback
7. Backend validates OAuth token
8. Backend creates user account (if first time)
9. Backend creates session and returns JWT
10. Frontend stores JWT and redirects to /dashboard
```

### Returning User Login Flow
```
1. User visits /login
2. User sees "Welcome back" message
3. User clicks OAuth provider button (or enters email/password)
4. OAuth flow completes (steps 4-7 above)
5. Backend finds existing user by provider ID
6. Backend creates new session
7. Frontend redirects to /dashboard
```

### Error Flow
```
1. OAuth fails (provider error, user cancels, etc.)
2. Provider redirects to /auth/callback?error=...
3. Backend logs error details
4. Frontend shows toast: "Sign in failed. Please try again."
5. User remains on /login page
6. User can retry or use email/password
```

---

## UI/UX Specifications

### Login Page Layout
```
┌─────────────────────────────────────────────────────┐
│ ┌──────────────────┐ │ ┌────────────────────────┐ │
│ │                  │ │ │                        │ │
│ │  [Turbocat Logo] │ │ │   Any app in minutes   │ │
│ │                  │ │ │                        │ │
│ │  Welcome back    │ │ │ Just describe what you │ │
│ │  Continue where  │ │ │ want                   │ │
│ │  you left off    │ │ │                        │ │
│ │                  │ │ │  [Mobile Preview Mock] │ │
│ │  ┌──────────────┐│ │ │                        │ │
│ │  │[G] Google    ││ │ │                        │ │
│ │  └──────────────┘│ │ │                        │ │
│ │  ┌──────────────┐│ │ │                        │ │
│ │  │[A] Apple     ││ │ │                        │ │
│ │  └──────────────┘│ │ │                        │ │
│ │                  │ │ │                        │ │
│ │      OR          │ │ │                        │ │
│ │                  │ │ │                        │ │
│ │  [Email Input]   │ │ │                        │ │
│ │  [Password Input]│ │ │                        │ │
│ │  Forgot password?│ │ │                        │ │
│ │                  │ │ │                        │ │
│ │  [Sign in]       │ │ │                        │ │
│ │                  │ │ │                        │ │
│ │  New to Vibecode?│ │ │                        │ │
│ │  Create account  │ │ │                        │ │
│ └──────────────────┘ │ └────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### OAuth Button Specifications
- **Google Button:**
  - Text: "Continue with Google"
  - Icon: Google logo (left-aligned)
  - Colors: White background, dark gray text (light mode), dark background white text (dark mode)
  - Border: 1px solid border
  - Hover: Slight opacity change

- **Apple Button:**
  - Text: "Continue with Apple"
  - Icon: Apple logo (left-aligned)
  - Colors: Black background, white text (light mode), white background black text (dark mode)
  - Border: None
  - Hover: Slight opacity change

---

## Technical Approach

### Frontend Implementation
- **Pages:** Modify `/app/(auth)/login/page.tsx` and `/app/(auth)/register/page.tsx`
- **Components:** Create `<OAuthButtons>` component
- **Library:** Use `next-auth` or native OAuth implementation
- **State Management:** Store OAuth state in React state
- **Routing:** Handle `/auth/callback` route for OAuth redirects

### Backend Implementation
- **Routes:** Add `/auth/google`, `/auth/apple`, `/auth/callback`
- **Library:** Use `passport` with `passport-google-oauth20` and `passport-apple`
- **Database:** Add `authProvider` and `authProviderId` to User model
- **Session:** Create JWT session on successful OAuth
- **Error Handling:** Return structured errors to frontend

---

## Dependencies

### External Services
- **Google Cloud Platform:** OAuth 2.0 credentials
- **Apple Developer:** Sign In with Apple service ID
- **Domain Verification:** Both providers require domain verification

### Internal Dependencies
- **Database Schema:** User model update (authProvider, authProviderId columns)
- **Auth Middleware:** Update to support OAuth session validation
- **Environment Variables:** Add OAuth client IDs and secrets

---

## Rollout Plan

### Phase 1: Development (5 days)
- Backend OAuth routes and validation
- Frontend OAuth buttons and flow
- Testing with test accounts

### Phase 2: Staging (2 days)
- Deploy to staging environment
- Test with real Google/Apple accounts
- QA testing of edge cases

### Phase 3: Production (1 day)
- Enable feature flag
- Monitor OAuth success rates
- Rollback plan ready

---

## Success Criteria

### Launch Criteria (Must Have)
- [ ] Google OAuth working end-to-end
- [ ] Apple OAuth working end-to-end
- [ ] Email/password fallback functional
- [ ] Error handling tested
- [ ] Security audit passed
- [ ] < 1% failure rate in staging

### Post-Launch (Within 1 Week)
- [ ] 50%+ of new signups use OAuth
- [ ] < 1% OAuth failures in production
- [ ] Zero security incidents
- [ ] User feedback positive (NPS >40)

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Google OAuth approval delay | High | Low | Apply early, have staging ready |
| Apple OAuth configuration issues | High | Medium | Follow docs precisely, test thoroughly |
| Email matching conflicts | Medium | Medium | Implement account linking flow |
| OAuth provider downtime | High | Low | Fallback to email/password |
| CSRF/security vulnerabilities | Critical | Low | Security audit, OWASP guidelines |

---

## Open Questions

1. **Account Linking:** If user signs up with Google then tries Apple with same email, auto-link or require confirmation?
   - **Recommendation:** Auto-link if email verified by provider

2. **Profile Photos:** Pull profile photos from OAuth providers?
   - **Recommendation:** Yes, store as avatarUrl

3. **Email Verification:** Trust OAuth provider email verification?
   - **Recommendation:** Yes, mark emailVerified=true for OAuth users

4. **Multiple Providers:** Allow same user to link both Google and Apple?
   - **Recommendation:** Yes, via settings page

---

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [OWASP OAuth Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html)
- UI Reference: `vibecodeapp_ui_features/vibecode app login.png`

---

**Last Updated:** 2026-01-12
**Status:** Ready for Implementation
