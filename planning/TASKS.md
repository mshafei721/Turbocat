# Phase 1: Foundation Fixes - Tasks

## Task 1: Security - Credential Rotation (USER ACTION)
- [ ] 1.1 User revokes all exposed credentials
- [ ] 1.2 User generates new credentials
- [ ] 1.3 Verify .env.local is in .gitignore
- [ ] 1.4 Remove .env.local from git tracking if needed

**Acceptance:** No secrets in git history for new commits

---

## Task 2: Dashboard Layout Refactor
- [ ] 2.1 Read current layout.tsx and DashboardPage.tsx
- [ ] 2.2 Create new layout structure with sidebar
- [ ] 2.3 Update DashboardPage to remove inline sidebar
- [ ] 2.4 Verify settings page renders with sidebar
- [ ] 2.5 Verify profile page renders with sidebar
- [ ] 2.6 Verify project/[id] page renders with sidebar

**Acceptance:** Sidebar visible on all dashboard routes

---

## Task 3: Fix Broken Navigation Links
- [ ] 3.1 Read LandingNav.tsx and identify broken links
- [ ] 3.2 Read LandingFooter.tsx and identify broken links
- [ ] 3.3 Remove or comment out broken external links
- [ ] 3.4 Keep only functional internal links

**Acceptance:** No links lead to 404 pages

---

## Task 4: Fix Auth UI Broken Links
- [ ] 4.1 Read AuthPage.tsx
- [ ] 4.2 Remove forgot-password link (or make it no-op)
- [ ] 4.3 Verify login/signup pages render correctly

**Acceptance:** No broken links in auth flow

---

## Task 5: Validation
- [ ] 5.1 Run type-check
- [ ] 5.2 Run lint
- [ ] 5.3 Run tests
- [ ] 5.4 Manual navigation verification

**Acceptance:** All checks pass, no visual regressions
