# EPIC5 T5.1: User Update API with Password Change

## Goal
Implement PATCH /api/v1/users/:id endpoint to allow users to update their own profile, including password changes with proper security validation.

## Scope
- Add PATCH /api/v1/users/:id route to existing users.ts
- Validate ownership (user can only update own profile)
- Support updating: fullName, email, password, avatarUrl, preferences
- Password validation: min 8 chars, with proper strength checks
- Password hashing with bcrypt (12 salt rounds - matches auth.service.ts)
- Return user without passwordHash in response
- Comprehensive unit tests

## Non-goals
- Admin ability to update other users (separate feature)
- Email verification on email change (future epic)
- Two-factor authentication (separate epic)
- Account deletion (separate endpoint)

## Constraints
- Follow existing backend patterns from auth.service.ts and projects.ts
- Use bcrypt with 12 salt rounds (matches BCRYPT_SALT_ROUNDS in auth.service.ts)
- Use Zod for validation
- No breaking changes to existing /me endpoints
- TypeScript strict mode compliance

## Impact
- Files affected: 1 existing file to modify
  - backend/src/routes/users.ts (add PATCH /:id route)
- New files: 1 test file
  - backend/src/routes/__tests__/users.test.ts
- Documentation: 1 file
  - .sisyphus/notepads/epic5/learnings.md

## Assumptions
- User model has passwordHash field (confirmed in schema.prisma)
- bcrypt is already installed and configured
- requireAuth middleware populates req.user correctly
- Current password is required before setting new password

## Risks
1. Authorization bypass if ownership check is incorrect
   - Mitigation: Strict validation that req.user.userId === :id param
2. Password exposure in logs or responses
   - Mitigation: Never log passwords, exclude passwordHash from responses
3. Weak password acceptance
   - Mitigation: Use validatePassword from auth.service.ts
4. Session not invalidated after password change
   - Decision: Keep current session active, user can logout manually

## Rollback Strategy
- Remove PATCH /:id route from users.ts
- Tests are isolated, removal has no side effects
- No database schema changes needed
- Existing /me endpoints remain unchanged

## Security Checklist
- [x] Authorization: req.user.userId === :id param
- [x] Password validation via auth.service.validatePassword
- [x] Password hashing via auth.service.hashPassword
- [x] Current password verification required
- [x] No password logging
- [x] No passwordHash in responses
- [x] Parameterized Prisma queries
