# Issue Fix Plan - Comprehensive App Fixes

## Goal
Fix multiple critical issues preventing the app from working correctly in development and production.

## Issues Identified

### 1. **No Theme Toggle** (HIGH PRIORITY)
- **Current State:** App has light/dark themes defined but no UI to switch between them
- **Expected State:** Theme toggle button in top right corner of app header
- **Solution:** Create ThemeToggle component and add to layout/header

### 2. **Vercel Build Failure** (CRITICAL)
- **Error:** `Command "npm run vercel-build" exited with 1`
- **Investigation Needed:** Check what vercel-build script does and why it's failing
- **Likely Causes:** TypeScript errors, missing dependencies, or build configuration issues

### 3. **Platform Selection UX** (MEDIUM PRIORITY)
- **Current State:** `/new` page has separate cards for Web vs Mobile selection
- **Expected State:** Platform selector integrated into the prompt input area as chips/buttons
- **Solution:** Redesign PromptInput to include platform selection inline

### 4. **Theme Colors Not Showing** (HIGH PRIORITY)
- **Current State:** AI Native theme defined in globals.css but not visible in app
- **Investigation Needed:** Check if Tailwind is compiling CSS correctly, verify CSS variables
- **Possible Causes:**
  - CSS not being loaded
  - Hardcoded colors overriding theme
  - Class names not matching theme tokens

### 5. **Duplicate Buttons** (HIGH PRIORITY)
- **Current State:** User reports seeing duplicate buttons
- **Investigation Needed:** Identify which components are rendering duplicates
- **Possible Causes:**
  - React double-rendering
  - Components mounted multiple times
  - Incorrect key props

### 6. **Data Not Loading** (HIGH PRIORITY)
- **Current State:** API calls failing or data not populating
- **Investigation Needed:** Check API routes, network requests, error handling
- **Possible Causes:**
  - API routes not responding
  - CORS issues
  - Authentication failures

### 7. **Click/Interactions Failing** (HIGH PRIORITY)
- **Current State:** Buttons and interactive elements not responding
- **Investigation Needed:** Check event handlers, console errors
- **Possible Causes:**
  - Event handlers not attached
  - JavaScript errors preventing execution
  - Z-index/overlay issues blocking clicks

## Non-Goals
- Complete redesign of the app
- Adding new features beyond the theme toggle
- Performance optimization (unless it's causing failures)

## Constraints
- Must maintain existing functionality
- Changes should be minimal and focused
- Must pass TypeScript type checking
- Must build successfully on Vercel

## Assumptions
- Dev server is running and accessible at localhost:3000
- Backend API is running and accessible
- Database connection is configured correctly

## Risks
1. **CSS changes might break existing styling** - Mitigation: Test each component after changes
2. **Refactoring prompt input might break form submission** - Mitigation: Preserve existing functionality
3. **Multiple issues might be interconnected** - Mitigation: Fix in order of priority and test iteratively

## Rollback Strategy
- All changes are on `main` branch currently
- Create new feature branch `fix/comprehensive-issues`
- Each fix should be a separate commit
- If a fix causes more issues, revert that specific commit
- Keep old `/new` page flow as backup until new flow is verified

## Success Criteria
- [x] Theme toggle component visible and functional in header
- [x] Vercel build completes successfully
- [x] Platform selection integrated into prompt input
- [x] AI Native theme colors visible in light and dark modes
- [x] No duplicate buttons rendering
- [x] Data loads correctly from API
- [x] All click/interaction handlers work correctly
- [x] Dev server runs without console errors
- [x] Production build succeeds locally

## Investigation Order
1. Check package.json for vercel-build script
2. Check browser console for runtime errors
3. Check Next.js build output for compilation errors
4. Verify Tailwind configuration
5. Check API route implementations
6. Inspect component rendering for duplicates
