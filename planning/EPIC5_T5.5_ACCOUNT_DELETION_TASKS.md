# T5.5: Account Deletion Flow - Task Breakdown

## Task List

### Backend Tasks (1 hour)

#### Task 1.1: Add DELETE /api/v1/users/:id Route
- [ ] Add DELETE /:id route to `backend/src/routes/users.ts`
- [ ] Add Zod schema for deletion request (optional reason)
- [ ] Add requireAuth middleware
- [ ] Add OpenAPI documentation

**Acceptance Criteria:**
- Route handler defined
- Input validation with Zod
- OpenAPI spec included

---

#### Task 1.2: Implement Soft Delete Logic
- [ ] Extract userId from params and validate UUID
- [ ] Ownership check: req.user.userId === params.id
- [ ] Fetch user from database
- [ ] Check if already deleted (deletedAt !== null)
- [ ] Update user with deletedAt = new Date()
- [ ] Exclude passwordHash from response

**Acceptance Criteria:**
- Soft delete (UPDATE, not DELETE)
- deletedAt timestamp set
- Ownership validated
- Already-deleted check

---

#### Task 1.3: Add Lockout Prevention Check
- [ ] Check if user has passwordHash
- [ ] Check if user has oauthProvider
- [ ] If both null, reject with 400 error
- [ ] Error message: "Cannot delete account. Must have at least one auth method."

**Acceptance Criteria:**
- Prevents deletion if no auth method
- Clear error message
- Logged to audit trail

---

#### Task 1.4: Add Re-authentication Verification
- [ ] Add password field to request body schema (optional)
- [ ] If password provided, verify with verifyPassword()
- [ ] If password wrong, reject with 401
- [ ] If OAuth-only user, accept without password

**Acceptance Criteria:**
- Password verification for password users
- OAuth users skip password check
- Invalid password rejected

---

#### Task 1.5: Add Audit Logging
- [ ] Create audit log entry with action: 'user.delete'
- [ ] Include userId, resourceId, reason (if provided)
- [ ] Include ipAddress and userAgent
- [ ] Log before soft delete

**Acceptance Criteria:**
- Audit log created
- All metadata captured
- Logged before deletion

---

#### Task 1.6: Write Backend Unit Tests
- [ ] Test 1: Success - soft delete with valid password
- [ ] Test 2: Lockout prevention - reject if only auth method
- [ ] Test 3: Ownership - reject if userId ≠ params.id (403)
- [ ] Test 4: Re-auth - reject if password incorrect (401)
- [ ] Test 5: Not found - reject if user not found (404)
- [ ] Test 6: Already deleted - reject if already soft-deleted (404)
- [ ] Test 7: Audit log - verify audit log created

**Acceptance Criteria:**
- All 7 tests pass
- Test coverage >80%
- Mocked dependencies (Prisma, auth.service, logger)

---

### Frontend Tasks (1 hour)

#### Task 2.1: Create AccountDeletionModal Component
- [ ] Create `turbocat-agent/components/settings/account-deletion-modal.tsx`
- [ ] Use Radix Dialog for modal
- [ ] Add multi-step state management (useState for step)
- [ ] Add form state: email, password, reason
- [ ] Add loading state, error state

**Acceptance Criteria:**
- Component scaffold created
- Radix Dialog integrated
- State management in place

---

#### Task 2.2: Implement Step 1 - Warning
- [ ] Show warning text about irreversibility
- [ ] List what will be deleted (projects, settings, data)
- [ ] "Continue" button to proceed
- [ ] "Cancel" button to close modal

**Acceptance Criteria:**
- Clear warning message
- User can proceed or cancel

---

#### Task 2.3: Implement Step 2 - Email Confirmation
- [ ] Show "Type your email to confirm" message
- [ ] Email input field
- [ ] Validate email matches user.email (case-insensitive)
- [ ] "Next" button disabled until match
- [ ] "Back" button to previous step

**Acceptance Criteria:**
- Email input with validation
- Cannot proceed without exact match
- Back navigation works

---

#### Task 2.4: Implement Step 3 - Re-authentication
- [ ] Show "Enter your password" message
- [ ] Password input field (type="password")
- [ ] If OAuth-only user, show OAuth re-auth button
- [ ] "Delete Account" button disabled until password entered
- [ ] "Back" button to previous step

**Acceptance Criteria:**
- Password input
- OAuth alternative for OAuth users
- Cannot submit without password

---

#### Task 2.5: Implement Step 4 (Optional) - Feedback
- [ ] Show "Why are you leaving?" (optional)
- [ ] Textarea for reason
- [ ] "Skip" button
- [ ] "Submit" button

**Acceptance Criteria:**
- Optional feedback step
- Can skip

---

#### Task 2.6: Add Lockout Warning
- [ ] Check if user has only one auth method
- [ ] Show warning banner if lockout risk
- [ ] Disable "Delete Account" button if lockout
- [ ] Link to "Set Password" in Security tab

**Acceptance Criteria:**
- Lockout warning visible
- Button disabled if lockout
- Link to set password

---

#### Task 2.7: Add API Integration
- [ ] Create deleteAccount API function in lib/api/
- [ ] Call DELETE /api/v1/users/:id with password
- [ ] Handle success: Call logout, redirect to login
- [ ] Handle errors: Display error message
- [ ] Loading state during API call

**Acceptance Criteria:**
- API function implemented
- Success flow: logout + redirect
- Error handling

---

#### Task 2.8: Integrate with Settings Danger Zone
- [ ] Update SettingsPage.tsx Danger Zone section
- [ ] Replace button onClick with modal open
- [ ] Pass user prop to modal
- [ ] Add AccountDeletionModal import

**Acceptance Criteria:**
- Button opens modal
- User data passed correctly

---

#### Task 2.9: Write Frontend Component Tests
- [ ] Test 1: Modal opens on button click
- [ ] Test 2: Step 1 - warning displayed
- [ ] Test 3: Step 2 - email validation
- [ ] Test 4: Step 3 - password input
- [ ] Test 5: Lockout warning shown if only auth method
- [ ] Test 6: Success - logout redirect
- [ ] Test 7: Error - displays error message
- [ ] Test 8: Cancel - closes modal without deletion

**Acceptance Criteria:**
- All 8 tests pass
- Test coverage >70%
- Radix Dialog tested with data-state

---

### Integration Tasks (30 minutes)

#### Task 3.1: End-to-End Test
- [ ] Write integration test for full deletion flow
- [ ] Open Settings → Danger Zone → Delete Account
- [ ] Complete all confirmation steps
- [ ] Verify soft delete in database
- [ ] Verify logout redirect
- [ ] Verify deleted user cannot login

**Acceptance Criteria:**
- Full flow tested
- Database state verified
- Logout confirmed

---

#### Task 3.2: Documentation
- [ ] Update `.sisyphus/notepads/epic5/learnings.md` with T5.5
- [ ] Document implementation patterns
- [ ] Document challenges and solutions
- [ ] Document test results

**Acceptance Criteria:**
- Learnings documented
- Patterns captured
- Metrics recorded

---

## Task Dependencies

```
Backend:
1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6

Frontend:
2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6 → 2.7 → 2.8 → 2.9

Integration:
(1.6 + 2.9) → 3.1 → 3.2
```

## Estimated Duration per Task

### Backend (1 hour)
- 1.1: 10 minutes
- 1.2: 15 minutes
- 1.3: 10 minutes
- 1.4: 10 minutes
- 1.5: 5 minutes
- 1.6: 30 minutes

### Frontend (1 hour)
- 2.1: 10 minutes
- 2.2: 5 minutes
- 2.3: 10 minutes
- 2.4: 10 minutes
- 2.5: 5 minutes
- 2.6: 5 minutes
- 2.7: 10 minutes
- 2.8: 5 minutes
- 2.9: 30 minutes

### Integration (30 minutes)
- 3.1: 20 minutes
- 3.2: 10 minutes

**Total: 2.5 hours**
