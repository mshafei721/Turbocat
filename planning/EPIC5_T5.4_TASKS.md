# Epic 5 Task 5.4: Settings Page Tasks

## Task Breakdown

### Phase 1: Setup & Structure
- [ ] T1.1: Create main settings page with Tabs component
  - File: turbocat-agent/app/(dashboard)/settings/page.tsx
  - Use Shadcn Tabs, TabsList, TabsTrigger, TabsContent
  - 4 tabs: Profile, Security, OAuth, Danger Zone
  - Mobile-responsive layout
- [ ] T1.2: Create API client utilities
  - File: turbocat-agent/lib/api/user.ts
  - Functions: updateUserProfile, uploadAvatar, changePassword, sendVerificationEmail
  - TypeScript interfaces for request/response types

### Phase 2: Profile Tab
- [ ] T2.1: Create ProfileTab component
  - File: turbocat-agent/components/settings/profile-tab.tsx
  - Display current user info (fullName, email, avatarUrl)
  - Form with fullName and email inputs
  - Email verification status badge
  - "Send Verification Email" button
- [ ] T2.2: Avatar upload with preview
  - File upload input
  - Client-side preview (FileReader API)
  - File validation (size < 5MB, type: image/*)
  - Upload progress indicator
  - Error handling for upload failures
- [ ] T2.3: Profile form submission
  - API integration with PATCH /api/v1/users/:id
  - Loading states (disabled form during submit)
  - Success message (toast or inline)
  - Error handling (validation errors, network errors)
  - Optimistic UI updates

### Phase 3: Security Tab
- [ ] T3.1: Create SecurityTab component
  - File: turbocat-agent/components/settings/security-tab.tsx
  - Change password form (currentPassword, newPassword, confirmPassword)
  - Password strength indicator
  - Show/hide password toggles
  - OAuth-only user message (if no passwordHash)
- [ ] T3.2: Password validation
  - Client-side validation (min 8 chars, uppercase, lowercase, number)
  - Confirm password match
  - Real-time strength calculation
  - Visual strength meter (weak, medium, strong)
- [ ] T3.3: Password change submission
  - API integration with PATCH /api/v1/users/:id (password field)
  - Loading states
  - Success message
  - Error handling (wrong current password, validation errors)
  - Clear form after success

### Phase 4: OAuth & Danger Zone Tabs
- [ ] T4.1: Create OAuth tab wrapper
  - Import and render existing OAuthConnectionSection
  - Pass user data as prop
  - No custom implementation needed
- [ ] T4.2: Create DangerZoneTab component
  - File: turbocat-agent/components/settings/danger-zone-tab.tsx
  - Warning message about account deletion
  - "Delete Account" button (disabled)
  - Clear red/destructive styling
  - Future hook for T5.5 implementation

### Phase 5: Testing & Documentation
- [ ] T5.1: Component tests for ProfileTab
  - Test form validation
  - Test API integration (mocked)
  - Test avatar upload flow
  - Test error handling
- [ ] T5.2: Component tests for SecurityTab
  - Test password validation
  - Test strength indicator
  - Test API integration (mocked)
  - Test error scenarios
- [ ] T5.3: Component tests for main page
  - Test tab navigation
  - Test tab persistence
  - Test responsive layout
- [ ] T5.4: Update documentation
  - Append to .sisyphus/notepads/epic5/learnings.md
  - Document component structure
  - Document API integration patterns
  - Document testing approach

## Atomic Task Order
Execute in this sequence:
1. T1.1 (main page structure)
2. T1.2 (API client)
3. T2.1 (ProfileTab component)
4. T2.2 (avatar upload)
5. T2.3 (profile submission)
6. T3.1 (SecurityTab component)
7. T3.2 (password validation)
8. T3.3 (password submission)
9. T4.1 (OAuth tab)
10. T4.2 (DangerZoneTab)
11. T5.1-T5.4 (testing & docs)

## Testing Commands
```bash
# Run all tests
cd turbocat-agent && npm test

# Run tests in watch mode
cd turbocat-agent && npm test -- --watch

# Run specific test file
cd turbocat-agent && npm test components/settings/__tests__/profile-tab.test.tsx

# Type check
cd turbocat-agent && npm run type-check

# Lint
cd turbocat-agent && npm run lint
```
