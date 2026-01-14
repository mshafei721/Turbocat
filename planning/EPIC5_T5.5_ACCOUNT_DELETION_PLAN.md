# T5.5: Account Deletion Flow - Implementation Plan

## Goal
Implement account deletion with multi-step confirmation modal, soft delete, and lockout prevention.

## Scope

### Backend (DELETE /api/v1/users/:id)
1. Soft delete: Set deletedAt timestamp
2. Lockout prevention: Reject if only auth method
3. Re-authentication: Verify password or OAuth token
4. Ownership validation: User can only delete own account
5. Audit logging: Log deletion with reason

### Frontend (Confirmation Modal)
1. Multi-step modal:
   - Step 1: Warning about irreversibility
   - Step 2: Type email to confirm
   - Step 3: Re-authenticate (password input)
   - Step 4 (optional): Feedback reason
2. Integration with Settings Danger Zone
3. Redirect to logout after deletion
4. Loading and error states

### Testing
1. Backend unit tests (7+ cases)
2. Frontend component tests (8+ cases)
3. Integration test (full deletion flow)

## Non-Goals
- Hard delete (permanent data loss) - MUST use soft delete
- Skip confirmation - MUST have multi-step verification
- Skip re-authentication - MUST verify user identity
- Keep user logged in - MUST logout after deletion

## Constraints
- Must use existing deletedAt field (no migration)
- Must preserve OAuth lockout prevention pattern
- Must follow existing modal patterns (Radix Dialog)
- Must use existing auth service patterns

## Assumptions
- User model has deletedAt field (Prisma schema confirmed)
- AuditLog model exists for logging
- Auth service has verifyPassword function
- OAuth connection check already implemented

## Risks

### High Risk: Lockout
- **Risk:** User deletes account with only auth method
- **Mitigation:** Check passwordHash and oauthProvider before deletion
- **Code:** `if (!user.passwordHash && !user.oauthProvider) reject`

### Medium Risk: Data Loss
- **Risk:** Accidental hard delete
- **Mitigation:** Use soft delete (deletedAt timestamp)
- **Code:** `prisma.user.update({ data: { deletedAt: new Date() } })`

### Medium Risk: Session Persistence
- **Risk:** User stays logged in after deletion
- **Mitigation:** Logout after successful deletion
- **Code:** Call logout API, clear client state, redirect to login

### Low Risk: Audit Trail
- **Risk:** No record of deletion
- **Mitigation:** Log to AuditLog before deletion
- **Code:** `prisma.auditLog.create({ action: 'user.delete' })`

## Rollback Strategy
1. Soft delete allows recovery: `UPDATE users SET deleted_at = NULL WHERE id = ?`
2. Audit logs provide deletion history
3. No breaking changes (uses existing deletedAt field)

## Dependencies
- T5.4 (Settings Page) - Settings UI must be complete
- Epic 1 (OAuth) - Lockout prevention logic
- Existing auth.service.ts - verifyPassword function
- Existing AuditLog model - Audit logging

## Technical Decisions

### Decision 1: Soft Delete vs Hard Delete
**Chosen:** Soft Delete
**Why:**
- Data recovery possible
- Audit trail preserved
- Safer for production
**Trade-offs:**
- Storage not immediately freed
- Queries must filter deletedAt

### Decision 2: Re-authentication Method
**Chosen:** Password input (OAuth providers redirect)
**Why:**
- Simple UX for password users
- OAuth users redirected to provider
- Consistent with password change flow
**Trade-offs:**
- OAuth re-auth more complex

### Decision 3: Confirmation Steps
**Chosen:** 3-step confirmation (warning → email → password)
**Why:**
- Prevents accidental deletion
- Industry standard (GitHub, Gmail)
- Clear user intent verification
**Trade-offs:**
- More friction for legitimate deletions

### Decision 4: Lockout Prevention Check
**Chosen:** Backend check (reject if only auth method)
**Why:**
- Security-critical validation
- Cannot be bypassed by client
- Consistent with OAuth disconnect logic
**Trade-offs:**
- Requires DB query before deletion

## Implementation Strategy

### Phase 1: Backend API (1 hour)
1. Add DELETE /:id route to users.ts
2. Implement soft delete logic
3. Add lockout prevention check
4. Add audit logging
5. Write unit tests (7 cases)

### Phase 2: Frontend Modal (1 hour)
1. Create AccountDeletionModal component
2. Implement multi-step flow (Stepper component)
3. Add form validation (email match, password input)
4. Add loading/error states
5. Write component tests (8 cases)

### Phase 3: Integration (30 minutes)
1. Wire modal to Settings Danger Zone button
2. Test full deletion flow
3. Verify logout redirect
4. Update learnings.md

## Acceptance Criteria

### Backend
- [ ] DELETE /api/v1/users/:id endpoint implemented
- [ ] Soft delete: Sets deletedAt, not hard delete
- [ ] Lockout prevention: Rejects if only auth method
- [ ] Re-authentication: Verifies password
- [ ] Ownership check: User can only delete own account
- [ ] Audit log: Records deletion with reason
- [ ] Unit tests pass (7+ cases)
- [ ] TypeScript compilation passes

### Frontend
- [ ] AccountDeletionModal component created
- [ ] Multi-step confirmation: Warning → Email → Password
- [ ] Email typing validation (exact match)
- [ ] Password re-authentication input
- [ ] Lockout warning if only auth method
- [ ] Logout redirect after deletion
- [ ] Loading states during API calls
- [ ] Error handling with user-friendly messages
- [ ] Component tests pass (8+ cases)
- [ ] Accessibility: keyboard navigation, ARIA labels

### Integration
- [ ] Settings Danger Zone button opens modal
- [ ] Full deletion flow works end-to-end
- [ ] User logged out after deletion
- [ ] Deleted user cannot login
- [ ] Integration test passes

### Documentation
- [ ] Learnings.md updated with T5.5 completion
- [ ] Code comments for complex logic
- [ ] OpenAPI documentation for DELETE endpoint

## Test Plan

### Backend Unit Tests (7 cases)
1. **Success:** Soft delete with valid password
2. **Lockout Prevention:** Reject if only auth method
3. **Ownership:** Reject if userId ≠ params.id (403)
4. **Re-auth:** Reject if password incorrect (401)
5. **Not Found:** Reject if user not found (404)
6. **Already Deleted:** Reject if already soft-deleted (404)
7. **Audit Log:** Verify audit log created

### Frontend Component Tests (8 cases)
1. **Modal Opens:** Danger Zone button opens modal
2. **Step 1:** Warning displayed, Continue enabled
3. **Step 2:** Email input, disabled until match
4. **Step 3:** Password input, submit disabled until filled
5. **Lockout Warning:** Shows warning if only auth method
6. **Success:** Modal closes, logout redirect
7. **Error Handling:** API error displays message
8. **Cancel:** Modal closes without deletion

### Integration Test (1 case)
1. **Full Flow:** Open modal → confirm → enter email → enter password → delete → logout

## Files to Create

### Backend
- `backend/src/routes/users.ts` (add DELETE /:id route)
- `backend/src/routes/__tests__/users.test.ts` (add deletion tests)

### Frontend
- `turbocat-agent/components/settings/account-deletion-modal.tsx`
- `turbocat-agent/components/settings/__tests__/account-deletion-modal.test.tsx`
- `turbocat-agent/components/turbocat/SettingsPage.tsx` (update Danger Zone)

### Documentation
- `.sisyphus/notepads/epic5/learnings.md` (update T5.5 section)

## Estimated Duration
- Backend: 1 hour
- Frontend: 1 hour
- Testing: 30 minutes
- **Total: 2.5 hours**

## Success Metrics
- All 16+ tests passing
- TypeScript compilation clean
- No P0 bugs
- Accessibility compliant
- Security audit passed
