# Issue Fix Tasks

## Phase 1: Investigation & Root Cause Analysis

### Task 1.1: Check Vercel Build Configuration
- [ ] Read `turbocat-agent/package.json` to find vercel-build script
- [ ] Identify what command is running and why it's failing
- [ ] Check for TypeScript errors that would prevent build
- [ ] Verify all dependencies are installed correctly

**Acceptance Criteria:**
- Understand exact command that's failing
- Identify specific build errors
- Document root cause of build failure

### Task 1.2: Check Browser Console Errors
- [ ] Inspect browser console for runtime errors
- [ ] Document all errors with stack traces
- [ ] Identify which components are causing errors
- [ ] Check for module import failures

**Acceptance Criteria:**
- Complete list of console errors
- Understanding of which components are broken
- Clear path to fixing runtime errors

### Task 1.3: Verify Theme System
- [ ] Check if globals.css is being loaded
- [ ] Verify Tailwind is compiling CSS variables
- [ ] Inspect DOM to see if theme classes are applied
- [ ] Check if CSS custom properties exist in :root and .dark

**Acceptance Criteria:**
- Confirm CSS file is loaded in browser
- Verify CSS variables are accessible
- Understand why theme colors aren't showing

### Task 1.4: Identify Duplicate Button Source
- [ ] Inspect `/new` page in browser DevTools
- [ ] Check for duplicate DOM elements
- [ ] Review component mounting logic
- [ ] Check for double React.StrictMode rendering

**Acceptance Criteria:**
- Identify exactly which buttons are duplicated
- Understand why duplicates are rendering
- Clear fix identified

## Phase 2: Critical Fixes (Build & Infrastructure)

### Task 2.1: Fix Vercel Build Failure
- [ ] Fix any TypeScript errors preventing build
- [ ] Update build script if needed
- [ ] Verify build succeeds locally with `npm run build`
- [ ] Test build output works correctly

**Acceptance Criteria:**
- `npm run build` completes successfully
- No TypeScript errors
- Build output loads and runs correctly
- Vercel deployment should succeed

### Task 2.2: Fix Runtime Errors
- [ ] Fix any module import errors
- [ ] Fix any React component errors
- [ ] Fix any hydration mismatches
- [ ] Verify no console errors remain

**Acceptance Criteria:**
- Console is clean (no errors)
- App loads without crashes
- All pages render correctly

## Phase 3: Theme System Fixes

### Task 3.1: Create Theme Toggle Component
- [ ] Create `turbocat-agent/components/theme/ThemeToggle.tsx`
- [ ] Component should use `next-themes` useTheme hook
- [ ] Show Sun icon for light mode, Moon for dark mode
- [ ] Include smooth transition animations
- [ ] Style with AI Native colors

**Acceptance Criteria:**
- Component renders in top right corner
- Clicking toggles between light and dark modes
- Icon changes to match current theme
- Smooth animation on theme change

### Task 3.2: Add Theme Toggle to Layout
- [ ] Import ThemeToggle in `app/layout.tsx` or header component
- [ ] Position in top right corner of header
- [ ] Ensure it's visible on all pages
- [ ] Test toggle works from any page

**Acceptance Criteria:**
- Theme toggle visible on all pages
- Position is consistent across routes
- Does not overlap with other header elements

### Task 3.3: Fix Theme Color Application
- [ ] Verify Tailwind config includes CSS variables
- [ ] Check components are using theme tokens (not hardcoded colors)
- [ ] Replace any hardcoded Tailwind classes with theme equivalents
- [ ] Test theme colors in both light and dark modes

**Acceptance Criteria:**
- AI Native colors visible in both themes
- Light mode: terracotta primary (#D97706), sage accent (#65A30D)
- Dark mode: orange primary (#F97316), teal accent (#14B8A6)
- All components respect theme changes

## Phase 4: UX Flow Improvements

### Task 4.1: Redesign Platform Selection in Prompt Input
- [ ] Modify `PromptInput` component to accept platform selection
- [ ] Add Web/Mobile chips/buttons next to or within input
- [ ] Update state management to handle both prompt and platform
- [ ] Maintain accessibility (keyboard navigation, ARIA)

**Acceptance Criteria:**
- Platform selection integrated into prompt area
- User can type prompt and select platform without scrolling
- Selection is visually clear and intuitive
- Preserves existing functionality

### Task 4.2: Update /new Page Flow
- [ ] Remove separate platform selection cards
- [ ] Update layout to use new integrated PromptInput
- [ ] Adjust spacing and visual hierarchy
- [ ] Update Create button logic to check both prompt and platform

**Acceptance Criteria:**
- Cleaner, more streamlined UI
- All on one screen (no scrolling needed)
- Maintains all existing functionality
- Better mobile responsive design

### Task 4.3: Update Homepage Landing Flow
- [ ] Check if homepage also uses platform selection
- [ ] Apply same integrated design if applicable
- [ ] Ensure consistent UX across entry points

**Acceptance Criteria:**
- Consistent platform selection UX across app
- Homepage and /new page use same pattern

## Phase 5: Bug Fixes

### Task 5.1: Fix Duplicate Buttons
- [ ] Remove duplicate button renders
- [ ] Fix component mounting issues
- [ ] Add proper React keys if needed
- [ ] Verify single button instance in DOM

**Acceptance Criteria:**
- Each button renders exactly once
- No duplicate elements in DOM
- Event handlers work correctly

### Task 5.2: Fix Data Loading Issues
- [ ] Check API route implementations
- [ ] Verify fetch calls have correct URLs
- [ ] Add error handling for failed requests
- [ ] Test with network tab open

**Acceptance Criteria:**
- API calls succeed and return data
- Loading states show correctly
- Error states handled gracefully
- Data populates UI components

### Task 5.3: Fix Click/Interaction Issues
- [ ] Verify event handlers are attached
- [ ] Check for JavaScript errors blocking execution
- [ ] Fix any z-index/overlay issues
- [ ] Test all interactive elements

**Acceptance Criteria:**
- All buttons respond to clicks
- Form submissions work
- Navigation works
- No blocked interactions

## Phase 6: Testing & Validation

### Task 6.1: Local Development Testing
- [ ] Test dev server runs without errors
- [ ] Test all pages load correctly
- [ ] Test theme toggle on all pages
- [ ] Test new platform selection UX
- [ ] Test data loading and interactions
- [ ] Check console for any warnings/errors

**Acceptance Criteria:**
- Dev server starts successfully
- No console errors or warnings
- All functionality works as expected
- Theme switching is smooth

### Task 6.2: Build Testing
- [ ] Run `npm run build` locally
- [ ] Verify build completes without errors
- [ ] Test production build with `npm start`
- [ ] Verify all features work in production mode

**Acceptance Criteria:**
- Build succeeds
- Production build works identically to dev
- No runtime errors in production
- Performance is acceptable

### Task 6.3: Vercel Deployment Testing
- [ ] Deploy to Vercel
- [ ] Verify build succeeds on Vercel
- [ ] Test deployed app functionality
- [ ] Check Vercel logs for any warnings

**Acceptance Criteria:**
- Vercel build succeeds
- Deployed app works correctly
- No errors in Vercel logs
- App is accessible at deployment URL

## Task Breakdown Summary
- **Phase 1 (Investigation):** 4 tasks
- **Phase 2 (Critical Fixes):** 2 tasks
- **Phase 3 (Theme System):** 3 tasks
- **Phase 4 (UX Improvements):** 3 tasks
- **Phase 5 (Bug Fixes):** 3 tasks
- **Phase 6 (Testing):** 3 tasks

**Total: 18 tasks**

## Execution Strategy
1. Start with Phase 1 (Investigation) - must understand issues before fixing
2. Move to Phase 2 (Critical Fixes) - unblock build and runtime
3. Phase 3 (Theme System) - high visibility user-facing feature
4. Phase 4 (UX Improvements) - enhance user experience
5. Phase 5 (Bug Fixes) - clean up remaining issues
6. Phase 6 (Testing) - validate all fixes work together
