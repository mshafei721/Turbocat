# Epic 5 - Task 5.3: Email Verification - Task Breakdown

## Phase 1: Database Schema (Prisma Migration)

### T5.3.1: Update Prisma Schema
**Status**: TODO
**Acceptance Criteria**:
- Add `verificationToken` field (String?, @unique)
- Add `verificationTokenExpiry` field (DateTime?)
- Fields are nullable (not all users will have pending verification)
- Migration file generated

**Commands**:
```bash
cd backend
# After schema update
npx prisma migrate dev --name add_email_verification
```

---

## Phase 2: Service Layer Implementation

### T5.3.2: Create Email Verification Service
**Status**: TODO
**Acceptance Criteria**:
- File: `backend/src/services/email-verification.service.ts`
- Export `generateVerificationToken(userId: string): Promise<string>`
- Export `verifyEmail(token: string): Promise<void>`
- Export `sendVerificationEmail(userId: string, email: string, token: string): Promise<void>`
- All functions have JSDoc comments
- Proper error handling with ApiError
- TypeScript strict mode compliant

**Function Specs**:

1. **generateVerificationToken**
   - Input: userId (string)
   - Output: Promise<string> (the token)
   - Logic:
     - Check database availability
     - Find user by ID
     - Generate token: `crypto.randomBytes(32).toString('hex')`
     - Calculate expiry: `new Date(Date.now() + 24 * 60 * 60 * 1000)`
     - Update user with token and expiry
     - Return token
   - Errors:
     - User not found: ApiError.notFound
     - Database unavailable: ApiError.serviceUnavailable
     - Already verified: ApiError.badRequest (optional, allow re-sending)

2. **verifyEmail**
   - Input: token (string)
   - Output: Promise<void>
   - Logic:
     - Check database availability
     - Find user by verificationToken
     - Check token exists
     - Check token not expired (compare with current time)
     - Update user: set emailVerified=true, emailVerifiedAt=now, verificationToken=null, verificationTokenExpiry=null
   - Errors:
     - Invalid token: ApiError.badRequest
     - Expired token: ApiError.badRequest
     - Database unavailable: ApiError.serviceUnavailable

3. **sendVerificationEmail**
   - Input: userId, email, token
   - Output: Promise<void>
   - Logic (Development):
     - Log to console: `[Email Verification] Verification email for ${email}: ${token}`
     - Log verification URL: `http://localhost:3000/verify-email?token=${token}`
   - Logic (Production - TODO):
     - Call email service (Resend, SendGrid, etc.)
     - Handle email service errors gracefully

---

### T5.3.3: Create Service Unit Tests
**Status**: TODO
**Acceptance Criteria**:
- File: `backend/src/services/__tests__/email-verification.service.test.ts`
- Mock Prisma, crypto (optional), logger
- Test all functions with success and error cases
- At least 12 test cases
- All tests pass

**Test Cases**:
1. generateVerificationToken - success
2. generateVerificationToken - user not found
3. generateVerificationToken - database unavailable
4. generateVerificationToken - token is 64 characters
5. generateVerificationToken - expiry is 24 hours
6. verifyEmail - success
7. verifyEmail - token deleted after verification
8. verifyEmail - invalid token
9. verifyEmail - expired token
10. verifyEmail - database unavailable
11. sendVerificationEmail - logs in development
12. sendVerificationEmail - returns success

---

## Phase 3: API Routes

### T5.3.4: Add Send Verification Endpoint
**Status**: TODO
**Acceptance Criteria**:
- Endpoint: POST `/api/v1/users/:id/send-verification`
- Middleware: `requireAuth`
- Ownership check: `req.user.userId === req.params.id`
- Call `generateVerificationToken(userId)`
- Call `sendVerificationEmail(userId, email, token)`
- Return success response
- OpenAPI documentation added

**Route Handler Logic**:
```typescript
router.post(
  '/:id/send-verification',
  requireAuth,
  async (req, res, next) => {
    // 1. Get user ID from params
    // 2. Ownership check (user can only verify own email)
    // 3. Get user from database
    // 4. Generate token
    // 5. Send email
    // 6. Return success response
  }
);
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Verification email sent successfully"
  },
  "requestId": "..."
}
```

---

### T5.3.5: Add Verify Email Endpoint
**Status**: TODO
**Acceptance Criteria**:
- Endpoint: POST `/api/v1/users/verify-email`
- No auth required (token-based)
- Validate request body with Zod: `{ token: string }`
- Call `verifyEmail(token)`
- Return success response (no user data exposure)
- OpenAPI documentation added

**Validation Schema**:
```typescript
const verifyEmailSchema = z.object({
  token: z.string().length(64, 'Invalid token format'),
});
```

**Route Handler Logic**:
```typescript
router.post(
  '/verify-email',
  async (req, res, next) => {
    // 1. Validate request body
    // 2. Call verifyEmail(token)
    // 3. Return generic success message (no user data)
  }
);
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Email verified successfully"
  },
  "requestId": "..."
}
```

---

## Phase 4: Testing & Validation

### T5.3.6: Manual Testing
**Status**: TODO
**Acceptance Criteria**:
- Start backend server
- Test send verification with authenticated user
- Test send verification with wrong user (should fail)
- Test verify email with valid token
- Test verify email with expired token
- Test verify email with invalid token
- Verify database state after each operation

**Test Sequence**:
```bash
# 1. Register user
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!","fullName":"Test User"}'

# 2. Login and get token
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'

# 3. Send verification (get token from console logs)
curl -X POST http://localhost:3001/api/v1/users/{userId}/send-verification \
  -H "Authorization: Bearer {access_token}"

# 4. Verify email
curl -X POST http://localhost:3001/api/v1/users/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token":"{token_from_logs}"}'

# 5. Check user profile
curl -X GET http://localhost:3001/api/v1/users/me \
  -H "Authorization: Bearer {access_token}"
```

---

### T5.3.7: Run All Tests
**Status**: TODO
**Acceptance Criteria**:
- All unit tests pass
- TypeScript compilation succeeds
- ESLint passes with no warnings
- Test coverage > 80% for email-verification.service.ts

**Commands**:
```bash
cd backend
npm test -- email-verification.service.test.ts
npm run type-check
npm run lint
npm test -- --coverage
```

---

## Phase 5: Documentation

### T5.3.8: Update Documentation
**Status**: TODO
**Acceptance Criteria**:
- Update `.sisyphus/notepads/epic5/learnings.md` with:
  - Token generation approach
  - Expiry strategy
  - Single-use implementation
  - Email service abstraction
  - Security considerations
  - Future enhancements (email templates, rate limiting)

**Content to Add**:
- Why crypto.randomBytes over UUID
- Why database storage over Redis
- How to integrate email service in production
- Rate limiting recommendations
- Email template customization approach

---

## Summary

**Total Tasks**: 8
**Estimated Effort**: 3-4 hours
**Priority Order**: T5.3.1 → T5.3.2 → T5.3.3 → T5.3.4 → T5.3.5 → T5.3.6 → T5.3.7 → T5.3.8

**Critical Path**:
1. Schema update (T5.3.1)
2. Service implementation (T5.3.2)
3. Route implementation (T5.3.4, T5.3.5)
4. Testing (T5.3.3, T5.3.7)
5. Documentation (T5.3.8)

**Dependencies**:
- T5.3.2 depends on T5.3.1 (schema must exist)
- T5.3.3 depends on T5.3.2 (service must exist to test)
- T5.3.4, T5.3.5 depend on T5.3.2 (routes use service)
- T5.3.6 depends on T5.3.4, T5.3.5 (routes must exist)
- T5.3.7 depends on T5.3.3 (tests must exist)
- T5.3.8 is independent (can be done anytime after completion)
