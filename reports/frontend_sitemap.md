# Frontend Navigation & Routes Audit Report

## Executive Summary

The Turbocat Next.js application has **critical navigation issues** including 2 broken links, 8 dead buttons/menu items, and 3 routes referenced but not implemented.

## 1. Valid Page Routes

| Route | Status | Description |
|-------|--------|-------------|
| `/` | OK | Landing page |
| `/login` | OK | Auth - Login |
| `/signup` | OK | Auth - Signup |
| `/dashboard` | OK | Protected Dashboard |
| `/profile` | OK | User Profile |
| `/settings` | OK | Settings |
| `/project/[id]` | OK | Dynamic Project View |
| `/new` | OK | Create New App |
| `/skills` | OK | Skills List |
| `/skills/new` | OK | New Skill |
| `/skills/[slug]` | OK | Skill Detail |
| `/skills/[slug]/logs` | OK | Skill Logs |
| `/tasks` | OK | Tasks List |
| `/tasks/[taskId]` | OK | Task Detail |
| `/theme-showcase` | OK | Theme Showcase |

## 2. Broken Links (Routes Don't Exist)

### CRITICAL - 404 on Click

| Route | Referenced In | Line | Impact |
|-------|---------------|------|--------|
| `/projects` | Sidebar.tsx | 41 | 404 error |
| `/projects` | TopNav.tsx | 26 | 404 error |
| `/chat` | Sidebar.tsx | 42 | 404 error |

### INTENTIONAL - Commented Out

| Route | Referenced In | Line | Status |
|-------|---------------|------|--------|
| `/forgot-password` | AuthPage.tsx | 248 | Disabled pending email auth |

## 3. Dead Buttons (No Handlers)

| Button | File | Line | Problem |
|--------|------|------|---------|
| "Get mobile app" | DashboardSidebar.tsx | 145 | No onClick handler |
| Search icon | TopNav.tsx | 78 | No onClick handler |
| Notifications bell | TopNav.tsx | 87 | No onClick, shows false indicator dot |
| "New Project" | TopNav.tsx | 98 | No onClick handler |

## 4. Dead Menu Items (No Navigation)

| Item | File | Line | Problem |
|------|------|------|---------|
| Profile | UserMenu.tsx | 79 | No Link wrapper, route exists |
| Settings | UserMenu.tsx | 83 | No Link wrapper, route exists |
| API Keys | UserMenu.tsx | 87 | No handler, route doesn't exist |
| Billing | UserMenu.tsx | 91 | No handler, route doesn't exist |

## 5. Disabled Features (Commented)

Located in `LandingNav.tsx` lines 17-24:
- `/pricing` - Pricing page
- `/blog` - Blog section
- `/community` - Community feature
- `/faqs` - FAQ page
- `/docs` - Documentation

## 6. Recommendations

### Priority 1 - CRITICAL (Fix Immediately)

1. **Fix `/projects` broken link**
   - Either create `/app/projects/page.tsx`
   - Or redirect to `/dashboard`
   - Or remove from Sidebar.tsx (L41) and TopNav.tsx (L26)

2. **Fix `/chat` broken link**
   - Either create `/app/chat/page.tsx`
   - Or remove from Sidebar.tsx (L42)

3. **Add handlers to dead buttons**
   - Search (TopNav.tsx L78) - Add search modal
   - Notifications (TopNav.tsx L87) - Add notification panel or remove indicator dot
   - New Project (TopNav.tsx L98) - Link to `/new`
   - Get mobile app (DashboardSidebar.tsx L145) - Link to app store or remove

4. **Fix UserMenu items**
   - Wrap Profile in Link to `/profile`
   - Wrap Settings in Link to `/settings`
   - Remove API Keys (no route)
   - Remove Billing (no route)

### Priority 2 - MEDIUM

5. **Implement missing routes**
   - `/api-keys` if planned feature
   - `/billing` if planned feature

6. **Fix theme toggle**
   - UserMenu.tsx L36 - Move theme state to global provider

### Priority 3 - LOW

7. **Clean up commented code**
   - LandingNav.tsx L17-24 - Remove or implement nav links
   - AuthPage.tsx L244-254 - Uncomment when email auth ready

## 7. Summary Statistics

| Metric | Count |
|--------|-------|
| Valid Page Routes | 15 |
| Broken Navigation Links | 2 |
| Dead Buttons | 4 |
| Dead Menu Items | 4 |
| Routes Not Implemented | 3 |
| Disabled Features | 5 |
