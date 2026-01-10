# Phase 1: Foundation Fixes Plan

## Goal
Address critical foundation issues to achieve consistent UX and remove broken navigation before adding new features.

## Scope
1. **Security:** Guide user to revoke exposed credentials (user action)
2. **Architecture:** Move DashboardSidebar from DashboardPage component to (dashboard)/layout.tsx
3. **Navigation:** Fix or remove 10+ broken navigation links
4. **Auth UI:** Remove non-functional forgot-password link until implemented

## Non-Goals
- Implementing new OAuth providers (Phase 2)
- Adding email/password auth (Phase 2)
- Credits/billing system (Phase 3)
- Publish flow improvements (Phase 5)

## Constraints
- Must maintain backward compatibility with existing routes
- Cannot break current dashboard, settings, or profile functionality
- Follow existing code patterns and styling

## Assumptions
- User will handle credential rotation manually
- Sidebar should appear on all dashboard routes (dashboard, settings, profile, project)
- Broken external links should be removed rather than implemented (external pages)

## Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Layout break dashboard | Medium | High | Test all routes after change |
| Sidebar state issues | Low | Medium | Use consistent client component |
| Navigation regression | Low | Medium | Visual verification |

## Rollback Strategy
All changes are reversible via git:
```bash
git checkout HEAD~1 -- turbocat-agent/app/(dashboard)/layout.tsx
git checkout HEAD~1 -- turbocat-agent/components/turbocat/DashboardPage.tsx
```

## Impact
**Files to be modified:** 6 files
- `turbocat-agent/app/(dashboard)/layout.tsx` - Add sidebar
- `turbocat-agent/components/turbocat/DashboardPage.tsx` - Remove sidebar
- `turbocat-agent/components/turbocat/LandingNav.tsx` - Remove broken links
- `turbocat-agent/components/turbocat/LandingFooter.tsx` - Remove broken links
- `turbocat-agent/components/turbocat/AuthPage.tsx` - Remove forgot password link
- `turbocat-agent/.gitignore` - Ensure .env.local is ignored

## Acceptance Criteria
1. DashboardSidebar visible on /dashboard, /settings, /profile, /project/[id]
2. No broken navigation links (all links either work or removed)
3. No TypeScript errors
4. No visual regressions on dashboard pages
5. .env.local not tracked by git

## Test Plan
```bash
cd turbocat-agent
pnpm type-check
pnpm lint
pnpm test
```

Manual verification:
- Navigate to /dashboard - sidebar visible
- Navigate to /settings - sidebar visible
- Navigate to /profile - sidebar visible
- Click all navigation links - none lead to 404
