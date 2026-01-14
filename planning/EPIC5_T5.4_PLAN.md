# Epic 5 Task 5.4: Settings Page Implementation Plan

## Goal
Create a Settings page with 4 tabs (Profile, Security, OAuth, Danger Zone) that integrates with backend APIs from T5.1-T5.3, reusing existing OAuth UI from Epic 1.

## Scope
- Main settings page with Shadcn Tabs component
- Profile tab: Update fullName, email, avatar upload with preview
- Security tab: Change password form with validation
- OAuth tab: Reuse existing OAuthConnectionSection from Epic 1
- Danger Zone tab: Account deletion warning (UI only, no deletion logic)
- API integration with T5.1-T5.3 backend endpoints
- Form validation, loading states, error handling
- Component tests with Vitest + React Testing Library
- Documentation in learnings.md

## Non-goals
- Account deletion implementation (T5.5)
- New OAuth management UI (reuse existing)
- Email verification logic (backend handles)
- Password reset flow (separate feature)

## Constraints
- Next.js 14+ App Router with 'use client' directive
- TypeScript strict mode
- Tailwind CSS + Shadcn/ui components
- Phosphor Icons library
- Framer Motion for animations
- httpOnly cookie authentication with credentials: 'include'
- Existing patterns from Epic 1/3

## Assumptions
- Backend APIs from T5.1-T5.3 are functional
- OAuthConnectionSection component works correctly
- Session state is managed via httpOnly cookies
- User profile includes avatarUrl, fullName, email, emailVerified
- Avatar upload accepts multipart/form-data

## Risks
1. **Avatar upload complexity**: Multipart/form-data handling, file size limits, preview generation
   - Mitigation: Use FormData API, add file validation, client-side preview
2. **Password validation**: Complex rules, strength indicator
   - Mitigation: Clear validation rules, visual strength meter
3. **Form state management**: Multiple forms with different states
   - Mitigation: Isolated state per tab, clear error boundaries
4. **Session updates**: Profile changes may require session refresh
   - Mitigation: Optimistic UI updates, refetch after save

## Rollback Strategy
- All components are new, no existing code modified
- If issues arise, revert to old SettingsPage.tsx (move tabs to old file)
- Backend APIs remain unchanged
- Git revert commit

## Impact
- Files affected: 7 new files, 2 modified files
- UI: New tabbed settings interface
- API: Integration with 6 backend endpoints
- State: User profile updates, avatar uploads
- Testing: New component test suite

## Test Plan
1. **Unit Tests** (Vitest + React Testing Library):
   - Profile tab form validation
   - Security tab password validation
   - Avatar upload preview
   - API error handling
   - Loading states
2. **Integration Tests**:
   - Mock fetch API calls
   - Test form submission flows
   - Test success/error messages
3. **Manual Tests**:
   - Full tab navigation
   - Profile update flow
   - Password change flow
   - Avatar upload with large file
   - Error scenarios (network errors, validation errors)

## Acceptance Criteria
- [ ] Settings page renders with 4 tabs
- [ ] Profile tab: Update fullName, email, upload avatar
- [ ] Security tab: Change password (currentPassword, newPassword, confirmPassword)
- [ ] OAuth tab: Shows existing OAuthConnectionSection
- [ ] Danger Zone tab: Warning message, disabled delete button
- [ ] All forms have validation
- [ ] All forms have loading states
- [ ] All forms have error handling
- [ ] All forms have success messages
- [ ] TypeScript compiles without errors
- [ ] Component tests pass
- [ ] Documentation updated in learnings.md
