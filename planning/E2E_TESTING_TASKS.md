# Epic 4: Publishing Flow E2E Testing Tasks

## Task Breakdown

### Phase 1: Test Infrastructure Setup (1-2 hours)

#### Task 1.1: Create Test Helpers and Mocks
- [ ] Create `backend/src/__tests__/integration/helpers/publishing-helpers.ts`
  - Mock Apple API responses
  - Mock Expo API responses
  - Factory functions for test data (credentials, publish data, etc.)
  - Utility functions for test database setup/teardown
- [ ] Create `backend/src/__tests__/mocks/publishing-mocks.ts`
  - Mock PublishingService instance
  - Mock AppleService instance
  - Mock ExpoService instance
  - Mock BullMQ queue
- **Acceptance**: Helper functions reusable across all test files

#### Task 1.2: Update Test Configuration
- [ ] Review `backend/src/__tests__/setup.ts` encryption key setup
- [ ] Add publishing-specific test utilities if needed
- [ ] Configure Jest to handle async publishingQueue operations
- **Acceptance**: Tests run without hanging or timing out

### Phase 2: Backend API Integration Tests (3-4 hours)

#### Task 2.1: Create Publishing API Test File
- [ ] Create `backend/src/__tests__/integration/publishing-flow.api.test.ts`
- [ ] Setup test suite with beforeEach/afterEach hooks
- [ ] Mock Prisma client, services, and queue
- [ ] Create test user and auth token
- **Acceptance**: Test file structure matches existing patterns (oauth.api.test.ts)

#### Task 2.2: Test POST /api/v1/publishing/initiate - Happy Path
- [ ] Test valid publishing request succeeds (201)
- [ ] Test response includes publishing ID, status, bundleId
- [ ] Test database record created with INITIATED status
- [ ] Test credentials are encrypted before storage
- [ ] Test Apple and Expo validation called
- **Acceptance**: Happy path test passes consistently

#### Task 2.3: Test POST /api/v1/publishing/initiate - Validation Errors
- [ ] Test missing required fields (400 error)
- [ ] Test invalid UUID format for projectId (400)
- [ ] Test invalid age rating value (400)
- [ ] Test app name too long (>30 chars) (400)
- [ ] Test description too short (<10 chars) (400)
- [ ] Test invalid URL formats (supportUrl, iconUrl) (400)
- **Acceptance**: All validation scenarios return 400 with clear error messages

#### Task 2.4: Test POST /api/v1/publishing/initiate - Business Logic Errors
- [ ] Test invalid Apple credentials rejected (400)
- [ ] Test invalid Expo token rejected (400)
- [ ] Test project not found (404)
- [ ] Test project not owned by user (404)
- [ ] Test publishing service unavailable (503)
- [ ] Test Redis queue unavailable (503)
- **Acceptance**: All business logic errors handled gracefully

#### Task 2.5: Test POST /api/v1/publishing/initiate - Authentication
- [ ] Test missing auth token (401)
- [ ] Test invalid auth token (401)
- [ ] Test expired auth token (401)
- **Acceptance**: Unauthorized requests rejected properly

#### Task 2.6: Test GET /api/v1/publishing/:id/status
- [ ] Test returns publishing status for valid ID (200)
- [ ] Test returns publishing with workflow relation
- [ ] Test returns 404 for non-existent ID
- [ ] Test enforces authentication (401 without token)
- [ ] Test returns correct status values (INITIATED, BUILDING, SUBMITTED, FAILED)
- **Acceptance**: Status endpoint works for all scenarios

#### Task 2.7: Test POST /api/v1/publishing/:id/retry
- [ ] Test retries FAILED publishing (200)
- [ ] Test resets status to INITIATED
- [ ] Test re-queues build job (if Redis available)
- [ ] Test rejects non-FAILED status (400)
- [ ] Test returns 404 for non-existent ID
- [ ] Test enforces authentication (401)
- **Acceptance**: Retry logic works correctly

### Phase 3: Service Integration Tests (3-4 hours)

#### Task 3.1: Create Service Integration Test File
- [ ] Create `backend/src/services/__tests__/publishing-flow.integration.test.ts`
- [ ] Setup test suite with service instances
- [ ] Mock Prisma, Apple, Expo, and encryption
- [ ] Create reusable test data fixtures
- **Acceptance**: Test file structure ready

#### Task 3.2: Test PublishingService.initiatePublishing Integration
- [ ] Test full credential validation flow
- [ ] Test encryption round-trip (encrypt then decrypt)
- [ ] Test database transaction rollback on error
- [ ] Test Apple → Expo → DB orchestration
- [ ] Test bundle ID generation
- [ ] Test queue job creation (if Redis available)
- **Acceptance**: Service orchestration tested end-to-end

#### Task 3.3: Test PublishingService.executeBuildAndSubmit Integration
- [ ] Test INITIATED → BUILDING transition
- [ ] Test Expo build start with decrypted token
- [ ] Test build ID storage in database
- [ ] Test BUILDING → SUBMITTED on success
- [ ] Test BUILDING → FAILED on error
- [ ] Test error messages propagated correctly
- **Acceptance**: Build execution flow tested

#### Task 3.4: Test Error Recovery and Retry
- [ ] Test retry after Apple validation failure
- [ ] Test retry after Expo build failure
- [ ] Test retry after database error
- [ ] Test retry limits (avoid infinite loops)
- [ ] Test error state cleanup
- **Acceptance**: Error recovery works reliably

#### Task 3.5: Test Encryption/Decryption Integration
- [ ] Test credentials encrypted before DB insert
- [ ] Test credentials decrypted before API calls
- [ ] Test encryption key from environment
- [ ] Test invalid encryption key handling
- [ ] Test corrupted encrypted data handling
- **Acceptance**: Security measures validated

### Phase 4: Test Documentation and CI Integration (1-2 hours)

#### Task 4.1: Create Test Documentation
- [ ] Create `docs/testing/publishing-flow-tests.md`
- [ ] Document test structure and organization
- [ ] Document how to run tests locally
- [ ] Document how to run tests in CI
- [ ] Document mock strategy and assumptions
- [ ] Document coverage expectations
- **Acceptance**: New developers can understand and run tests

#### Task 4.2: Update CI Configuration
- [ ] Update `.github/workflows/test.yml` (if exists)
- [ ] Add publishing test job
- [ ] Configure test database for CI
- [ ] Add coverage reporting
- [ ] Add test result artifacts
- **Acceptance**: Tests run automatically on PR

#### Task 4.3: Add Test Scripts to package.json
- [ ] Add `test:publishing` script for publishing tests only
- [ ] Add `test:publishing:watch` for dev mode
- [ ] Add `test:publishing:coverage` for coverage report
- [ ] Update main `test` script to include publishing tests
- **Acceptance**: Convenient test execution commands available

### Phase 5: Test Quality and Cleanup (1-2 hours)

#### Task 5.1: Verify Test Coverage
- [ ] Run coverage report: `npm run test:coverage`
- [ ] Verify publishing routes >90% coverage
- [ ] Verify publishing service >85% coverage
- [ ] Add tests for uncovered edge cases
- [ ] Document coverage gaps if any
- **Acceptance**: Coverage targets met

#### Task 5.2: Test Stability Verification
- [ ] Run full test suite 3 times consecutively
- [ ] Fix any flaky tests (non-deterministic failures)
- [ ] Check for open handles: `npm test -- --detectOpenHandles`
- [ ] Check for memory leaks: `npm test -- --logHeapUsage`
- [ ] Optimize slow tests (>1 second per test)
- **Acceptance**: 100% pass rate across 3 runs, no open handles

#### Task 5.3: Code Review and Refactoring
- [ ] Review test code for clarity and maintainability
- [ ] Extract common patterns into helper functions
- [ ] Add comments for complex test scenarios
- [ ] Ensure consistent naming conventions
- [ ] Remove duplicate test logic
- **Acceptance**: Test code follows best practices

#### Task 5.4: Update Planning Status
- [ ] Mark all tasks as DONE in E2E_TESTING_STATUS.md
- [ ] Document any deviations from plan
- [ ] Record lessons learned
- [ ] Update coverage metrics
- [ ] Close out testing epic
- **Acceptance**: Planning documents reflect completion

## Estimated Timeline
- Phase 1 (Infrastructure): 1-2 hours
- Phase 2 (API Tests): 3-4 hours
- Phase 3 (Service Tests): 3-4 hours
- Phase 4 (Documentation/CI): 1-2 hours
- Phase 5 (Quality/Cleanup): 1-2 hours

**Total**: 9-14 hours (1-2 days)

## Dependencies
- Existing test infrastructure (Jest, Supertest)
- Publishing service implementation complete
- Database schema finalized
- Encryption utilities implemented

## Success Criteria
- All 57+ test cases passing
- Coverage >85% for services, >90% for routes
- No flaky tests
- Execution time <5 minutes
- CI integration complete
- Documentation complete
