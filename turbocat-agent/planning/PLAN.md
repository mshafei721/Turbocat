# Routing Cleanup Plan

## Goal
Fix Turbocat routing to provide a clean, consistent user flow from landing page through project creation and workspace.

## Scope
- Remove conflicting old Vercel template routes
- Consolidate to new Turbocat UI routing structure
- Add missing pages (Profile, Settings)
- Fix navigation links across all components
- Add logout functionality

## Non-goals
- Changing the old template functionality (just removing routes)
- Redesigning existing new components
- Adding new features beyond routing fixes

## Constraints
- Must maintain backward compatibility for `/tasks/[taskId]` as it's used by API
- Session/auth system must remain unchanged
- Keep existing API routes intact

## Assumptions
- Users will use the new UI flow: Landing → Auth → Dashboard → New/Project
- Old `/[owner]/[repo]` flow is no longer needed
- Profile photo should link to profile page, not dashboard

## Risks
| Risk | Mitigation |
|------|------------|
| Breaking existing task links | Keep `/tasks/[taskId]` route, redirect to new `/project/[id]` |
| User confusion during transition | Clear navigation hierarchy |
| Session issues | Test auth flow thoroughly |

## Rollback
- Git revert to commit `0b67bb6` if issues arise
- Old routes can be restored from git history
