# Routing Decisions

## Decision 1: Remove `/[owner]/[repo]` catch-all
**Why:** This dynamic route at root level catches `/dashboard`, `/new`, `/profile`, etc., causing routing conflicts.
**Alternatives considered:**
- Keep and use route groups to exclude - More complex, error-prone
- Rename to `/repo/[owner]/[repo]` - Would break existing links
**Trade-offs:** Removes old GitHub-repo-based workflow, but new workflow doesn't need it.

## Decision 2: Keep `/tasks/[taskId]` with redirect
**Why:** API and existing links may reference this URL pattern.
**Alternatives considered:**
- Remove completely - Would break existing bookmarks/links
- Keep both routes - Duplication, confusion
**Trade-offs:** Small code overhead for redirect, but maintains compatibility.

## Decision 3: Profile photo links to `/profile`, not `/dashboard`
**Why:** User expectation is that clicking their avatar goes to their profile/settings.
**Alternatives considered:**
- Dropdown menu on click - More complex UX
- Keep linking to dashboard - Not intuitive
**Trade-offs:** Need to create profile page, but better UX.

## Decision 4: Use route groups for protected pages
**Why:** Consistent auth checking via layout.tsx in `(dashboard)` group.
**Alternatives considered:**
- Middleware-based auth - More complex setup
- Per-page auth checks - Repetitive
**Trade-offs:** All protected routes must be in `(dashboard)` group.
