# TASKS: Error Handling Tests for Epic 4 Publishing Flow

## Task Breakdown

### Task 1: Create Validation Error Tests
**File:** `backend/src/__tests__/integration/publishing-validation-errors.test.ts`

**Acceptance Criteria:**
- [ ] Test missing required fields (appleTeamId, appleKeyId, appleIssuerId, applePrivateKey, expoToken, appName, description, category, ageRating)
- [ ] Test invalid format validation (Team ID length, Issuer ID UUID format)
- [ ] Test invalid Apple credentials format (malformed private key)
- [ ] Test invalid Expo token format
- [ ] Test app name constraints (max 30 chars)
- [ ] Test description constraints (min 10, max 4000 chars)
- [ ] Test invalid URL formats (supportUrl, iconUrl)
- [ ] Test invalid age rating values (not in ['4+', '9+', '12+', '17+'])
- [ ] Verify 400 status code returned
- [ ] Verify error code is VALIDATION_ERROR
- [ ] Verify detailed validation errors in response
- [ ] Verify no sensitive data leaked in error messages

**Estimated Time:** 3 hours

---

### Task 2: Create Business Logic Error Tests
**File:** `backend/src/__tests__/integration/publishing-business-errors.test.ts`

**Acceptance Criteria:**
- [ ] Test user does not own project (403 Forbidden)
- [ ] Test project not found (404 Not Found)
- [ ] Test project already being published (409 Conflict)
- [ ] Test invalid Apple credentials API validation failure (400)
- [ ] Test invalid Expo token API validation failure (400)
- [ ] Test build timeout scenario (>30 minutes)
- [ ] Test Expo build failure
- [ ] Test Apple submission rejection
- [ ] Test retry on non-FAILED status (400)
- [ ] Verify appropriate status codes and error codes
- [ ] Verify error logging occurs
- [ ] Verify state is not corrupted after errors

**Estimated Time:** 4 hours

---

### Task 3: Create Network & External API Error Tests
**File:** `backend/src/__tests__/integration/publishing-network-errors.test.ts`

**Acceptance Criteria:**
- [ ] Test Apple API timeout (ECONNABORTED)
- [ ] Test Apple API 5xx errors (500, 502, 503)
- [ ] Test Expo API timeout
- [ ] Test Expo API 5xx errors
- [ ] Test network connection lost during build (ECONNREFUSED)
- [ ] Test rate limiting from Apple (429)
- [ ] Test rate limiting from Expo (429)
- [ ] Test webhook delivery failures
- [ ] Verify 502 External Service Error returned
- [ ] Verify retry logic triggered where appropriate
- [ ] Verify error messages indicate external service issue
- [ ] Verify sensitive data not logged

**Estimated Time:** 4 hours

---

### Task 4: Create Infrastructure Error Tests
**File:** `backend/src/__tests__/integration/publishing-infrastructure-errors.test.ts`

**Acceptance Criteria:**
- [ ] Test Redis unavailable (queue failures) - return 503
- [ ] Test database connection lost - return 500
- [ ] Test encryption key missing - return 500
- [ ] Test file storage unavailable (artifact storage) - return 503
- [ ] Test worker process crash during build
- [ ] Test out of memory errors
- [ ] Test Prisma transaction failures
- [ ] Test concurrent publishing attempts (race conditions)
- [ ] Verify appropriate status codes (500 vs 503)
- [ ] Verify graceful degradation
- [ ] Verify cleanup occurs after failures
- [ ] Verify no data corruption

**Estimated Time:** 4 hours

---

### Task 5: Create Frontend Error Handling Tests
**File:** `turbocat-agent/components/publishing/__tests__/error-handling.test.tsx`

**Acceptance Criteria:**
- [ ] Test API returns 400 (validation error) → Show inline errors
- [ ] Test API returns 401 (unauthorized) → Redirect to login
- [ ] Test API returns 403 (forbidden) → Show access denied message
- [ ] Test API returns 404 (project not found) → Show error message
- [ ] Test API returns 500 (server error) → Show retry option
- [ ] Test network error during submission → Show connection lost message
- [ ] Test build fails → Show error details with retry button
- [ ] Test timeout during polling → Show timeout message
- [ ] Verify error messages are user-friendly
- [ ] Verify retry button functionality
- [ ] Verify no sensitive data displayed
- [ ] Verify loading states during retries

**Estimated Time:** 5 hours

---

### Task 6: Create Recovery & Retry Logic Tests
**File:** `backend/src/__tests__/integration/publishing-recovery.test.ts`

**Acceptance Criteria:**
- [ ] Test retry after validation error (after fixing input)
- [ ] Test retry after build failure
- [ ] Test retry after network error
- [ ] Test resume polling after connection restored
- [ ] Test cleanup after repeated failures
- [ ] Test prevent infinite retry loops (max 3 retries)
- [ ] Test exponential backoff working correctly
- [ ] Test state transitions during retry
- [ ] Test idempotency of retry operations
- [ ] Verify publishing record state after retry
- [ ] Verify no duplicate builds created
- [ ] Verify logs show retry attempts

**Estimated Time:** 4 hours

---

### Task 7: Create Error Code Documentation
**File:** `docs/errors/publishing-errors.md`

**Acceptance Criteria:**
- [ ] Document all error codes (PUB_VAL_001, PUB_AUTH_001, etc.)
- [ ] Document HTTP status codes for each error
- [ ] Document user-facing error messages
- [ ] Document resolution steps for each error
- [ ] Document when retries are appropriate
- [ ] Document error logging format
- [ ] Document error monitoring and alerting
- [ ] Include examples of error responses
- [ ] Include troubleshooting guide
- [ ] Include FAQ section

**Estimated Time:** 3 hours

---

### Task 8: Create Test Helpers and Mocks
**File:** `backend/src/__tests__/helpers/publishing-test-helpers.ts`

**Acceptance Criteria:**
- [ ] Create mock Apple API responses (success, failure, timeout)
- [ ] Create mock Expo API responses (success, failure, timeout)
- [ ] Create mock Redis client with error scenarios
- [ ] Create mock Prisma client with error scenarios
- [ ] Create helper to setup test publishing data
- [ ] Create helper to mock external API errors
- [ ] Create helper to assert error response format
- [ ] Create helper to verify no sensitive data in errors
- [ ] Document helper usage
- [ ] Ensure helpers are reusable across test suites

**Estimated Time:** 3 hours

---

### Task 9: Integration and Coverage Analysis
**Files:** All test files

**Acceptance Criteria:**
- [ ] All tests pass consistently (run 3 times without failures)
- [ ] Test coverage >95% for publishing routes
- [ ] Test coverage >95% for publishing service
- [ ] Test coverage >90% for Apple service
- [ ] Test coverage >90% for Expo service
- [ ] No flaky tests identified
- [ ] Tests run in < 2 minutes total
- [ ] CI/CD pipeline updated with new tests
- [ ] Coverage report generated
- [ ] Coverage badges updated

**Estimated Time:** 2 hours

---

## Total Estimated Time: 32 hours (4 days)

## Execution Order
1. Task 8 (Helpers & Mocks) - Foundation
2. Task 1 (Validation Errors) - Simplest, establishes patterns
3. Task 2 (Business Logic Errors) - Core logic
4. Task 3 (Network Errors) - External dependencies
5. Task 4 (Infrastructure Errors) - System failures
6. Task 6 (Recovery & Retry) - Complex scenarios
7. Task 5 (Frontend Errors) - UI layer
8. Task 7 (Documentation) - Knowledge capture
9. Task 9 (Integration & Coverage) - Validation

## Dependencies
- Task 1-6 depend on Task 8 (helpers)
- Task 9 depends on all other tasks
- Task 7 can run in parallel with tasks 1-6
