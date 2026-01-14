# Epic 5 Task 5.6: Comprehensive Testing Tasks

## Phase 1: Verify Existing Tests

### T5.6.1: Run Existing Backend Tests
**Status**: TODO
**Description**: Run all existing backend tests for T5.1 and T5.3
**Commands**:
```bash
cd backend
npm test -- src/routes/__tests__/users.test.ts
npm test -- src/services/__tests__/email-verification.service.test.ts
```

**Acceptance Criteria:**
- [ ] All T5.1 tests pass (18 tests)
- [ ] All T5.3 tests pass (17 tests)
- [ ] No test failures or errors
- [ ] Results documented

### Task 1.2: Generate Initial Coverage Report
**Tasks:**
```bash
cd backend && npm test -- --coverage --coverageReporters=text --coverageReporters=json-summary
```

**Expected:** Baseline coverage metrics for existing tests.

---

## Phase 2: Integration Tests (NEW TESTS)

### Task 2.1: Create Integration Test Helpers
**File**: `backend/src/__tests__/helpers/users-test-helpers.ts`

Create reusable helpers for user-related integration tests:
- Mock user factory
- Mock auth tokens
- Common assertions

### Task 2.2: Profile Update Integration Tests
**File**: `backend/src/__tests__/integration/users-profile.api.test.ts`

Test scenarios:
1. Full profile update flow (fullName + avatarUrl)
2. Email change flow (with uniqueness check)
3. Password change flow (with currentPassword)
4. Multi-field update
5. Authorization failures
6. Validation failures

**Expected**: 8-10 integration tests

### Phase 3: Coverage & Reporting

#### Task 3.1: Email Verification Integration Tests
**File**: `backend/src/__tests__/integration/users-email-verification.api.test.ts`

**Test Cases:**
1. Send verification → verify email (happy path)
2. Send verification when already verified (error)
3. Verify with expired token
4. Verify with invalid token
5. Send verification for another user (ownership check)

**Expected**: 5-8 integration tests

#### Task 3: Generate Coverage Report
Run Jest with coverage and analyze results.

**Commands:**
```bash
cd backend
npm test -- --coverage
```

**Expected Metrics:**
- T5.1 routes/users.ts: >90% coverage
- T5.3 email-verification.service.ts: >85% coverage
- Overall backend: >80% (realistic given limited implemented features)

#### Task 4: Create Test Report
Document all test results in comprehensive report.

**Tasks:**
- Run all tests
- Capture output
- Generate coverage report
- Document results
- Create recommendations

## Test Cases to Implement

### Integration Test 1: Profile Update Flow
**File**: `backend/src/__tests__/integration/users-profile.api.test.ts`

Test scenarios:
1. User updates full name successfully
2. User updates email (with uniqueness check)
3. User updates avatar URL
4. User updates preferences
5. User updates multiple fields at once
6. Validation errors handled properly
7. Authorization enforced (can't update other users)
8. Soft-deleted users can't be updated

### Integration Test 2: Email Verification Flow
**File**: `backend/src/__tests__/integration/users-email-verification.api.test.ts`

**Test Cases:**
1. Send verification email → Generate token → Verify with token
2. Token expiry validation
3. Token single-use enforcement
4. Ownership checks
5. Error handling (invalid tokens, expired tokens)

### Phase 3: Password Change Flow
**File**: `backend/src/__tests__/integration/users-password.api.test.ts`

**Test Cases:**
1. User changes password with valid currentPassword
2. User cannot change password without currentPassword
3. User cannot change password with wrong currentPassword
4. User cannot change to weak password
5. OAuth user cannot change password
6. User can login with new password after change

## Coverage Targets

### Backend Coverage (Target: >80%)
- Routes: >90% (high criticality)
- Services: >85% (core business logic)
- Utils: >80% (helper functions)
- Middleware: >75% (auth tested elsewhere)

### Frontend Coverage (Future)
- Components: >70% (when implemented)
- API clients: >80%
- Forms: >75%

### Overall Coverage
- Backend: >80%
- Frontend: N/A (not implemented)
- Overall: >80% (backend only for now)

## Testing Principles

### Unit Tests
- Test individual functions in isolation
- Mock all external dependencies
- Focus on business logic
- Cover edge cases and error paths

### Integration Tests
- Test full API flows end-to-end
- Use real route handlers with mocked database
- Test authentication and authorization
- Verify HTTP status codes and response shapes

### Coverage Targets
- Services: >90% (business logic)
- Routes: >85% (API endpoints)
- Middleware: >80% (auth, validation)
- Utils: >90% (pure functions)

## Implementation Order

1. **Phase 1: Baseline (30 min)**
   - Run existing tests
   - Generate initial coverage report
   - Document current state

2. **Phase 2: Integration Tests (1-2 hours)**
   - User profile update flow
   - Email verification flow
   - Password change flow

3. **Phase 3: Final Report (30 min)**
   - Generate coverage
   - Create test report
   - Update learnings

## Next Steps
1. Run existing tests
2. Verify all pass
3. Create integration tests
4. Generate coverage report
5. Document results
