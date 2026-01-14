# EPIC5 T5.1 Tasks

## Implementation Tasks

### T5.1.1: Add PATCH /:id route to users.ts
**Status:** TODO
**Acceptance Criteria:**
- Zod schema supports fullName, email, password, currentPassword, avatarUrl, preferences
- Ownership validation: req.user.userId === :id param
- Password change requires currentPassword field
- Uses validatePassword and hashPassword from auth.service
- Returns user without passwordHash
- Proper error handling and logging

**Technical Details:**
- Import hashPassword, verifyPassword, validatePassword from auth.service
- Schema validation with Zod
- Ownership check throws ApiError.forbidden if userId mismatch
- Password validation via validatePassword
- Current password verification via verifyPassword
- New password hashing via hashPassword
- Exclude passwordHash from response using existing excludePassword helper

### T5.1.2: Create unit tests for PATCH /:id
**Status:** TODO
**Acceptance Criteria:**
- Test: successful profile update (name, avatar, preferences)
- Test: successful password change with valid currentPassword
- Test: ownership validation (403 when trying to update other user)
- Test: password validation (400 for weak password)
- Test: currentPassword required when changing password
- Test: wrong currentPassword returns 401
- Test: excludes passwordHash from response
- Coverage: >80%

**Technical Details:**
- Mock Prisma client
- Mock bcrypt functions
- Test all validation paths
- Test error scenarios

### T5.1.3: Type check and lint
**Status:** TODO
**Acceptance Criteria:**
- npm run type-check passes
- No TypeScript errors
- No linter warnings

### T5.1.4: Update learnings documentation
**Status:** TODO
**Acceptance Criteria:**
- Document PATCH /:id implementation in .sisyphus/notepads/epic5/learnings.md
- Include patterns learned (ownership validation, password change flow)
- Note any deviations or decisions made
