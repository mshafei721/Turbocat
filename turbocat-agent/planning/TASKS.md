# Routing Cleanup Tasks

## Phase 1: Route Consolidation
- [ ] 1.1 Remove `/[owner]/[repo]` catch-all route (conflicts with everything)
- [ ] 1.2 Remove `/new/[owner]/[repo]` old new project flow
- [ ] 1.3 Keep `/tasks/[taskId]` but redirect to `/project/[taskId]`
- [ ] 1.4 Remove `/repos/*` routes (old template)

## Phase 2: Add Missing Pages
- [ ] 2.1 Create `/profile` page (user settings, avatar, email)
- [ ] 2.2 Create `/settings` page (app preferences)
- [ ] 2.3 Add logout API route `/api/auth/signout`

## Phase 3: Fix Navigation Links
- [ ] 3.1 Update LandingNav - Profile photo → /profile
- [ ] 3.2 Update DashboardSidebar - Add profile/settings/logout links
- [ ] 3.3 Update WorkspaceHeader - Fix user menu links
- [ ] 3.4 Update all "Dashboard" buttons to use consistent routing

## Phase 4: Validation
- [ ] 4.1 Type check passes
- [ ] 4.2 Build succeeds
- [ ] 4.3 Manual test all routes
- [ ] 4.4 Deploy to Vercel

## Target Route Structure
```
/                    → Landing page (public)
/login               → Auth login
/signup              → Auth signup
/dashboard           → Project list (protected)
/new                 → Create new project (protected)
/project/[id]        → Project workspace (protected)
/profile             → User profile (protected)
/settings            → App settings (protected)
/api/auth/signout    → Logout endpoint
```
