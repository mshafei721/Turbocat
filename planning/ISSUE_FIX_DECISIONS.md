# Issue Fix Decisions

## Decision 1: Investigation Before Fixes
**Date:** 2026-01-12
**Status:** Approved

**Context:**
User reported multiple issues across the app including build failures, runtime errors, theme issues, duplicate buttons, data loading problems, and interaction failures.

**Decision:**
Start with comprehensive investigation (Phase 1) before attempting fixes.

**Rationale:**
- Multiple interconnected issues require understanding root causes
- Fixing one thing might break another without full picture
- Build failures might be causing cascading issues
- Need to document all errors before addressing them systematically

**Alternatives Considered:**
- Jump directly to fixing obvious issues (theme toggle, UX flow)
- Fix build failure first without investigation

**Trade-offs:**
- Takes longer to start fixing - but fixes will be more effective
- Requires more upfront planning - but prevents rework

---

## Decision 2: Theme Toggle Placement
**Date:** 2026-01-12
**Status:** Approved (User Preference)

**Context:**
App has light/dark themes defined but no UI to toggle between them.

**Decision:**
Place theme toggle in **top right corner of app header**.

**Rationale:**
- Standard convention for theme toggles
- Always visible and accessible
- Doesn't interfere with main content
- User explicitly requested this placement

**Alternatives Considered:**
- Settings menu - less discoverable
- Command palette - requires keyboard shortcut knowledge
- Multiple locations - adds complexity

**Trade-offs:**
- Takes up header space - but improves UX
- Needs responsive design - standard problem to solve

---

## Decision 3: Platform Selection UX
**Date:** 2026-01-12
**Status:** Approved (User Preference)

**Context:**
Current flow has platform selection (Web vs Mobile) as separate cards on `/new` page. User wants it integrated into the prompt input area.

**Decision:**
**Redesign platform selection to be integrated alongside/within the prompt input** rather than separate cards below.

**Rationale:**
- Reduces vertical scrolling
- Streamlines the creation flow
- All project creation inputs visible at once
- User explicitly requested this change

**Alternatives Considered:**
- Keep current card-based selection - user doesn't like it
- Modal dialog for platform selection - adds extra step
- Tabs for platform - still separates the choices

**Trade-offs:**
- More complex PromptInput component - but better UX
- Need to redesign visual hierarchy - but worth it for streamlined flow

**Implementation Options:**
1. Chips/pills next to input (like "Web | Mobile")
2. Buttons above input
3. Segmented control within input border
4. Dropdown/select within input

**Recommended:** Option 1 (Chips) - most compact and intuitive

---

## Decision 4: Fix Order and Priorities
**Date:** 2026-01-12
**Status:** Approved

**Context:**
Multiple issues to fix with limited time and potential dependencies.

**Decision:**
Fix in this order:
1. **Phase 1: Investigation** - understand all issues
2. **Phase 2: Critical Fixes** - build and runtime errors
3. **Phase 3: Theme System** - high visibility feature
4. **Phase 4: UX Improvements** - platform selection flow
5. **Phase 5: Bug Fixes** - duplicates, data, interactions
6. **Phase 6: Testing** - validate everything works

**Rationale:**
- Can't fix what we don't understand (Phase 1 first)
- Build failures block deployment (Phase 2 critical)
- Theme toggle is quick win with high impact (Phase 3)
- UX improvements require more design work (Phase 4)
- Bug fixes depend on understanding runtime state (Phase 5)
- Testing ensures nothing breaks (Phase 6)

**Alternatives Considered:**
- Fix theme toggle first (most visible) - but might not work if build is broken
- Fix UX flow first - user wants it but not critical
- Fix all bugs simultaneously - too chaotic

**Trade-offs:**
- Sequential approach takes longer - but reduces risk of breaking things
- Investigation phase delays visible progress - but ensures better fixes

---

## Decision 5: Git Workflow
**Date:** 2026-01-12
**Status:** Approved

**Context:**
Currently on `main` branch with recent AI Native theme work merged. Need to make many changes.

**Decision:**
Create new feature branch **`fix/comprehensive-issues`** for all fixes.

**Rationale:**
- Keeps main branch stable
- Allows atomic commits per fix
- Easy to revert if something breaks
- Follows git best practices

**Alternatives Considered:**
- Work directly on main - risky for multiple changes
- Separate branch per fix - too many branches to manage

**Trade-offs:**
- Need to merge later - but safer approach
- Branch might get long-lived - but organized by phases

---

## Decision 6: Build System Investigation First
**Date:** 2026-01-12
**Status:** Approved

**Context:**
Vercel build failing with `npm run vercel-build exited with 1`. Generic error needs investigation.

**Decision:**
**Start Phase 1 by checking package.json and identifying the exact build command and failure point.**

**Rationale:**
- Build failures block deployment
- Might be causing runtime issues too
- Need to understand exact error before fixing
- Generic exit code 1 doesn't tell us what's wrong

**Alternatives Considered:**
- Try common fixes (update deps, clear cache) - shooting in dark
- Check Vercel logs directly - user didn't provide access
- Focus on runtime issues first - but build must work too

**Trade-offs:**
- Takes time to investigate - but necessary for proper fix
- Might discover multiple build issues - better to know upfront

---

## Decision 7: Preserve Existing Functionality
**Date:** 2026-01-12
**Status:** Approved

**Context:**
Making significant changes to UX flow and fixing multiple issues. Risk of breaking working features.

**Decision:**
**Preserve all existing functionality - only fix what's broken, only change what user requested.**

**Rationale:**
- Non-regression principle (from CLAUDE.md guidelines)
- Minimize blast radius
- User wants specific changes, not redesign
- Easier to test and validate

**Alternatives Considered:**
- Take opportunity to refactor everything - too risky
- Add new features while fixing - scope creep

**Trade-offs:**
- Might miss optimization opportunities - but safer
- Code might not be perfect - but works

---

## Open Questions

### Q1: What specific console errors is the user seeing?
**Status:** Needs investigation (Task 1.2)
**Impact:** High - determines Phase 2 fixes

### Q2: Why are buttons duplicating?
**Status:** Needs investigation (Task 1.4)
**Impact:** Medium - affects UX but not critical

### Q3: Which API calls are failing?
**Status:** Needs investigation (Task 5.2)
**Impact:** High - affects data loading

### Q4: What exact Vercel build error message?
**Status:** Needs investigation (Task 1.1)
**Impact:** Critical - blocks deployment
