# Epic 4: Publishing Flow E2E Test Plan

## Goal
Create comprehensive end-to-end tests for the Epic 4 Publishing Flow to validate the complete pipeline from credential validation to app submission. Tests must cover backend API integration, service orchestration, and error handling.

## Scope

### In Scope
1. **Backend API Integration Tests**
   - Publishing route handlers (/publishing/initiate, /publishing/:id/status, /publishing/:id/retry)
   - Request validation and error handling
   - Authentication and authorization
   - Database state transitions

2. **Service Integration Tests**
   - PublishingService orchestration flow
   - AppleService → ExpoService → PublishingService integration
   - Credential encryption/decryption round-trip
   - BullMQ job queueing (optional, if Redis available)
   - Database state management

3. **Error Path Testing**
   - Invalid Apple credentials
   - Invalid Expo token
   - Missing required fields
   - Non-existent resources (404 errors)
   - Unauthorized access attempts
   - Build failure scenarios
   - Retry mechanism validation

4. **Test Infrastructure**
   - Mock external APIs (Apple App Store Connect, Expo API)
   - Test database setup and teardown
   - Test data factories
   - CI/CD integration

### Out of Scope (Phase 1)
- Frontend E2E tests (Playwright) - deferred pending frontend implementation
- WebSocket status updates testing
- Build polling mechanism (long-running tests)
- Actual Apple/Expo API calls (use mocks only)
- Performance/load testing
- Visual regression testing

## Non-Goals
- Testing actual deployment to Apple App Store
- Testing macOS-specific build tools (xcrun, altool)
- Testing payment/subscription flows
- Testing multi-tenancy scenarios

## Constraints
- Must use existing test infrastructure (Jest, Supertest)
- Must not require Redis for unit/integration tests (graceful degradation)
- Must complete in < 5 minutes total execution time
- Must work on Windows development environment
- Must not require external API keys or credentials

## Assumptions
- Existing test setup in backend/src/__tests__/setup.ts is functional
- Mock strategy matches existing patterns (oauth.api.test.ts as reference)
- Database schema is finalized and migrations are complete
- BullMQ queue is optional and can be mocked
- Encryption utilities are already tested independently

## Risks

### Technical Risks
1. **BullMQ Queue Dependency**: Tests may fail if Redis is not available
   - **Mitigation**: Make queue optional, check `isPublishingQueueAvailable()`
   - **Rollback**: Skip queue-related assertions

2. **Async Job Execution**: Build and submit runs in background
   - **Mitigation**: Mock the executeBuildAndSubmit method, test synchronously
   - **Rollback**: Use Jest fake timers to control async execution

3. **Encryption Key Management**: Tests require valid ENCRYPTION_KEY
   - **Mitigation**: Set test encryption key in setup.ts
   - **Rollback**: Use mock encryption functions

4. **Database State Pollution**: Tests may interfere with each other
   - **Mitigation**: Use transactions and rollback after each test
   - **Rollback**: Add explicit cleanup in afterEach hooks

### Process Risks
1. **Test Flakiness**: External mocks may behave inconsistently
   - **Mitigation**: Use Jest mocks with explicit return values
   - **Rollback**: Add retry logic for flaky tests

2. **Coverage Gaps**: May miss edge cases in complex orchestration
   - **Mitigation**: Use coverage reports to identify gaps
   - **Rollback**: Add tests iteratively based on coverage reports

## Rollback Strategy

### If Tests Fail Consistently
1. Disable failing tests with `it.skip()` and document reason
2. Tag tests with severity (critical, high, medium, low)
3. Run critical tests only in CI pipeline
4. Schedule follow-up to fix skipped tests

### If Performance Issues
1. Split test suites into separate files (unit, integration, e2e)
2. Run integration tests only on pre-commit, not on file save
3. Use `--bail` flag to stop on first failure

### If CI Pipeline Breaks
1. Run tests locally first to validate
2. Use `--detectOpenHandles` to identify async leaks
3. Add explicit timeout values to prevent hanging tests
4. Disable Redis-dependent tests in CI if Redis unavailable

## Impact
- **Files Modified**: 5+ new test files, 2-3 existing files updated
- **Dependencies**: None added (use existing Jest, Supertest)
- **Database**: No schema changes, uses existing Publishing table
- **Infrastructure**: No changes required

## Acceptance Criteria

### Backend API Integration Tests
- [ ] POST /publishing/initiate validates all required fields
- [ ] POST /publishing/initiate rejects invalid Apple credentials
- [ ] POST /publishing/initiate rejects invalid Expo token
- [ ] POST /publishing/initiate encrypts sensitive data before storage
- [ ] GET /publishing/:id/status returns current publishing state
- [ ] GET /publishing/:id/status returns 404 for non-existent ID
- [ ] GET /publishing/:id/status enforces authentication
- [ ] POST /publishing/:id/retry resets FAILED status to INITIATED
- [ ] POST /publishing/:id/retry rejects non-FAILED statuses

### Service Integration Tests
- [ ] PublishingService.initiatePublishing calls AppleService.validateCredentials
- [ ] PublishingService.initiatePublishing calls ExpoService.validateToken
- [ ] PublishingService.initiatePublishing encrypts credentials before DB insert
- [ ] PublishingService.executeBuildAndSubmit decrypts credentials
- [ ] PublishingService.executeBuildAndSubmit starts Expo build
- [ ] PublishingService.executeBuildAndSubmit updates status to BUILDING
- [ ] PublishingService.executeBuildAndSubmit handles build success (SUBMITTED)
- [ ] PublishingService.executeBuildAndSubmit handles build failure (FAILED)
- [ ] PublishingService.retry validates status is FAILED before retrying

### Error Handling Tests
- [ ] Validation errors return 400 with detailed error messages
- [ ] Missing authentication returns 401
- [ ] Non-existent resources return 404
- [ ] Database errors return 500 with safe error messages
- [ ] External service errors are logged and returned as 503

### Test Quality
- [ ] All tests pass consistently (100% success rate)
- [ ] No test flakiness (run 3 times, all pass)
- [ ] Total execution time < 5 minutes
- [ ] Coverage > 85% for publishing service
- [ ] Coverage > 90% for publishing routes
- [ ] No open handles or memory leaks

## Success Metrics
- Backend API coverage: >90%
- Service integration coverage: >85%
- Test execution time: <5 minutes
- Test success rate: 100% (3 consecutive runs)
- No open handles or memory leaks detected
- All critical paths tested (happy path + 5 error paths)
