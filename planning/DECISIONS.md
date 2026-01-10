# Phase 1: Foundation Fixes - Decisions

## Decision 1: Sidebar Placement

**Decision:** Move DashboardSidebar from DashboardPage component to (dashboard)/layout.tsx

**Why:**
- Ensures sidebar appears on ALL dashboard routes consistently
- Current implementation only shows sidebar on /dashboard
- Settings and Profile pages currently have no sidebar
- This matches the Vibecode reference implementation

**Alternatives Considered:**
1. **Keep sidebar in DashboardPage, duplicate in other pages** - Rejected: Code duplication, maintenance burden
2. **Create separate layouts for each page** - Rejected: Over-complicated, inconsistent
3. **Use a shared component imported in each page** - Rejected: Still requires manual import, easy to forget

**Trade-offs:**
- Layout file becomes slightly more complex
- Need to handle client/server component boundaries carefully
- Session check may need adjustment

---

## Decision 2: Broken Navigation Links

**Decision:** Remove broken external links rather than implement placeholder pages

**Why:**
- External pages (Pricing, Blog, Community, FAQs, Docs) require significant content creation
- Better to remove than show 404 pages
- Can re-add when content is ready

**Alternatives Considered:**
1. **Create placeholder pages** - Rejected: Poor UX, looks incomplete
2. **Link to external URLs** - Rejected: No external URLs exist yet
3. **Keep with "Coming Soon" tooltip** - Rejected: Clutters navigation

**Trade-offs:**
- Fewer navigation options in header/footer
- Users may expect these features
- Easy to add back later

---

## Decision 3: Forgot Password Link

**Decision:** Remove the forgot-password link from AuthPage until implemented

**Why:**
- Link currently leads to 404
- No email service configured for password reset
- Better UX to not show non-functional links

**Alternatives Considered:**
1. **Implement full password reset flow** - Rejected: Scope creep, requires email service
2. **Show disabled link with tooltip** - Rejected: Confusing UX
3. **Keep link, show error message** - Rejected: Poor UX

**Trade-offs:**
- Users cannot reset password (but they can re-auth via OAuth)
- Need to implement in Phase 2 with email/password auth
