# Epic 5 - Task 5.3: Email Verification Implementation Plan

## Goal
Implement secure email verification system with cryptographically secure tokens, time-based expiry, and single-use guarantees.

## Scope
- **Prisma Schema**: Add `verificationToken` and `verificationTokenExpiry` fields to User model
- **Service Layer**: Create `email-verification.service.ts` with token generation, verification, and email sending
- **API Routes**: Add POST `/api/v1/users/:id/send-verification` and POST `/api/v1/users/verify-email` endpoints
- **Testing**: Comprehensive unit tests for service functions and route handlers
- **Documentation**: Technical decisions and learnings

## Non-Goals
- Actual email sending service integration (will log to console in dev)
- Frontend UI components (handled separately)
- Rate limiting for verification endpoint (future enhancement)
- Email template customization (future enhancement)

## Constraints
- Must use `crypto.randomBytes(32)` for cryptographically secure tokens
- Tokens must expire after exactly 24 hours
- Tokens must be single-use (deleted after verification)
- Must follow existing service pattern (function-based exports)
- Must maintain Express 5.x type safety
- Must pass TypeScript strict mode

## Assumptions
- Email field already exists and is unique in User model
- `emailVerified` field already exists in User model (from schema review)
- Users can request new verification tokens if expired
- No email service configured yet (log to console in development)

## Impact
### Affected Files
- **backend/prisma/schema.prisma**: Add `verificationToken`, `verificationTokenExpiry` fields
- **backend/src/services/email-verification.service.ts**: NEW - Core service logic
- **backend/src/services/__tests__/email-verification.service.test.ts**: NEW - Unit tests
- **backend/src/routes/users.ts**: UPDATE - Add verification endpoints
- **backend/.env.example**: UPDATE - Add email service configuration placeholders
- **.sisyphus/notepads/epic5/learnings.md**: APPEND - Technical decisions

### Dependencies
- **crypto** (Node.js built-in): For secure token generation
- **@prisma/client**: Database operations
- **express**: Route handlers
- **zod**: Request validation
- Existing middleware: `requireAuth`, error handling

## Risks
1. **Token collision**: Mitigated by using 32-byte random tokens (2^256 possibilities)
2. **Timing attacks**: Mitigated by constant-time token comparison
3. **Token reuse**: Mitigated by deleting token after verification
4. **Email enumeration**: Send generic success message regardless of email existence
5. **Database unavailability**: Handled by existing Prisma availability checks

## Rollback Strategy
1. Keep Prisma migration in version control
2. Rollback SQL: `ALTER TABLE users DROP COLUMN verification_token, DROP COLUMN verification_token_expiry;`
3. Remove new routes from users.ts
4. Delete service file and tests
5. Revert to previous git commit if needed

## Technical Decisions

### 1. Token Storage Strategy
**Decision**: Store tokens in database (not Redis)
**Rationale**:
- Simpler data consistency (single source of truth)
- No dependency on Redis availability
- Email verification is low-frequency operation
- Tokens tied to user lifecycle
**Alternatives**: Redis with TTL (more complex, adds dependency)

### 2. Token Format
**Decision**: 64-character hex string from 32 random bytes
**Rationale**:
- Cryptographically secure (2^256 possibilities)
- URL-safe (hex encoding)
- Deterministic length for validation
**Alternatives**: UUID v4 (less entropy), Base64 (not URL-safe by default)

### 3. Expiry Implementation
**Decision**: Store expiry timestamp in database, validate on verification
**Rationale**:
- Explicit expiry checking (no silent failures)
- Audit trail (can see when token was created)
- No background cleanup needed (lazy deletion)
**Alternatives**: Redis TTL (requires Redis), cron cleanup job (added complexity)

### 4. Endpoint Authorization
**Decision**:
- Send verification: `requireAuth` + ownership check
- Verify email: No auth required (token-based)
**Rationale**:
- Send: User must own account to request verification
- Verify: Allow verification from email link (no login required)
**Alternatives**: Require auth for both (poor UX for email verification)

### 5. Email Service Abstraction
**Decision**: Console logging in dev, abstracted service interface for production
**Rationale**:
- Test verification flow without email service
- Easy to swap email providers later
- No vendor lock-in
**Alternatives**: Hardcode Resend/SendGrid (premature commitment)

## Test Plan

### Unit Tests (email-verification.service.test.ts)
1. **generateVerificationToken**
   - ✓ Creates token and stores with expiry
   - ✓ Token is 64 hex characters
   - ✓ Expiry is 24 hours from now
   - ✓ Throws error if user not found
   - ✓ Throws error if database unavailable

2. **verifyEmail**
   - ✓ Marks user as verified with valid token
   - ✓ Deletes token after successful verification
   - ✓ Throws error for expired token
   - ✓ Throws error for invalid token
   - ✓ Throws error for already verified user (idempotent)
   - ✓ Throws error if database unavailable

3. **sendVerificationEmail**
   - ✓ Logs to console in development
   - ✓ Returns success message
   - ✓ Handles email service errors gracefully

### Integration Tests (Route Level)
1. **POST /api/v1/users/:id/send-verification**
   - ✓ Returns 200 with success message (own account)
   - ✓ Returns 403 if trying to verify other user's email
   - ✓ Returns 401 if not authenticated
   - ✓ Returns 404 if user not found
   - ✓ Returns 400 if user already verified

2. **POST /api/v1/users/verify-email**
   - ✓ Returns 200 and marks user verified with valid token
   - ✓ Returns 400 for expired token
   - ✓ Returns 400 for invalid token
   - ✓ Returns 400 for missing token
   - ✓ Validation error for malformed request

### Manual Testing Commands
```bash
# Run unit tests
cd backend
npm test -- email-verification.service.test.ts

# Run with coverage
npm test -- --coverage email-verification.service.test.ts

# Type checking
npm run type-check

# Lint
npm run lint
```

## Acceptance Criteria
- [ ] Prisma migration created and applied
- [ ] `email-verification.service.ts` created with all functions
- [ ] Service functions use crypto.randomBytes for token generation
- [ ] Tokens expire after exactly 24 hours
- [ ] Tokens are deleted after successful verification
- [ ] POST `/api/v1/users/:id/send-verification` endpoint functional
- [ ] POST `/api/v1/users/verify-email` endpoint functional
- [ ] Ownership check prevents verifying other users' emails
- [ ] All unit tests pass (12+ test cases)
- [ ] TypeScript compilation passes with no errors
- [ ] No ESLint warnings
- [ ] Documentation updated in learnings.md

## Implementation Steps
See EPIC5_T5.3_EMAIL_VERIFICATION_TASKS.md
