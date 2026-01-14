# DECISIONS: Error Handling Tests for Epic 4 Publishing Flow

## Decision 1: Error Code Standard Format
**Date:** 2026-01-13
**Status:** APPROVED

**Decision:**
Use prefix-based error codes with numeric suffixes: `PUB_[CATEGORY]_[NUMBER]`

**Categories:**
- VAL: Validation errors (user input)
- AUTH: Authentication/authorization errors
- BUILD: Build process errors
- NET: Network/external API errors
- SYS: System/infrastructure errors

**Examples:**
- PUB_VAL_001: Missing required field
- PUB_VAL_002: Invalid format
- PUB_AUTH_001: Invalid Apple credentials
- PUB_AUTH_002: Invalid Expo token
- PUB_BUILD_001: Build timeout
- PUB_BUILD_002: Build failed
- PUB_NET_001: Network error
- PUB_SYS_001: System error

**Why:**
- Clear categorization for troubleshooting
- Easy to search logs
- Supports future expansion (PUB_VAL_003, etc.)
- Consistent with industry standards (e.g., AWS error codes)

**Alternatives Considered:**
1. HTTP status codes only - Too generic, loses context
2. String descriptions only - Hard to search, not machine-readable
3. Numeric only (ERR_1001) - No semantic meaning

**Trade-offs:**
- Pro: Clear, searchable, semantic
- Con: Requires maintenance of error code registry

---

## Decision 2: Test Mock Strategy
**Date:** 2026-01-13
**Status:** APPROVED

**Decision:**
Use Jest mocks for all external dependencies (Apple API, Expo API, Redis, Prisma) with explicit mock setup per test suite.

**Pattern:**
```typescript
// Mock at top of test file
jest.mock('../../services/apple.service');
jest.mock('../../services/expo.service');
jest.mock('../../lib/redis');
jest.mock('../../lib/prisma');

// Reset in beforeEach
beforeEach(() => {
  jest.clearAllMocks();
  mockAppleService.validateCredentials.mockResolvedValue(true);
});

// Override per test
it('should handle Apple API failure', async () => {
  mockAppleService.validateCredentials.mockRejectedValue(
    new Error('API unavailable')
  );
  // ... test
});
```

**Why:**
- Follows existing pattern from oauth.api.test.ts
- Full control over error scenarios
- No external dependencies during testing
- Fast test execution
- Deterministic results

**Alternatives Considered:**
1. Integration tests against real APIs - Too slow, flaky, costs money
2. Nock for HTTP mocking - Overkill, we already mock at service level
3. Manual DI with test doubles - Too much boilerplate

**Trade-offs:**
- Pro: Fast, deterministic, isolated
- Con: Mocks may drift from real API behavior (mitigated by documentation review)

---

## Decision 3: Error Message Content
**Date:** 2026-01-13
**Status:** APPROVED

**Decision:**
Use two-tier error messages: user-friendly message in response, detailed technical message in logs.

**Format:**
```typescript
// User-facing (API response)
{
  "success": false,
  "error": {
    "code": "PUB_AUTH_001",
    "message": "Invalid Apple Developer credentials. Please check your Team ID, Key ID, and private key.",
    "details": [
      { "field": "appleTeamId", "message": "Team ID must be 10 characters" }
    ]
  }
}

// Technical (logs)
logger.error('[PublishingService] Apple API validation failed', {
  userId: 'user-123',
  appleTeamId: 'ABC123', // OK to log
  appleKeyId: 'KEY123',  // OK to log
  error: 'Unauthorized: invalid_client',
  // NO sensitive data: privateKey, tokens
});
```

**Why:**
- Users get actionable guidance
- Developers get debugging context
- No security risk (no secrets exposed)
- Consistent with OWASP guidelines

**Alternatives Considered:**
1. Same message for user and logs - Exposes too much technical detail to users
2. No user message, only error codes - Poor UX
3. Detailed message to user - Security risk

**Trade-offs:**
- Pro: Security + usability balanced
- Con: Requires maintaining two message formats

---

## Decision 4: Test Execution Order
**Date:** 2026-01-13
**Status:** APPROVED

**Decision:**
Build tests in order of increasing complexity:
1. Helpers → Validation → Business → Network → Infrastructure → Recovery → Frontend → Integration

**Why:**
- Helpers provide foundation
- Validation errors are simplest (no external deps)
- Business logic builds on validation patterns
- Network errors require mock setup
- Infrastructure errors most complex
- Recovery tests combine multiple scenarios
- Frontend tests need backend patterns established
- Integration validates everything together

**Alternatives Considered:**
1. Frontend first (user-facing) - Requires backend patterns first
2. All in parallel - Risk of inconsistent patterns
3. Business logic first - Validation is simpler starting point

**Trade-offs:**
- Pro: Incremental learning, patterns established early
- Con: Can't parallelize as much (but team is small)

---

## Decision 5: Coverage Threshold
**Date:** 2026-01-13
**Status:** APPROVED

**Decision:**
Target >95% coverage for publishing error paths specifically, not overall codebase.

**Scope:**
- publishing.service.ts error handling
- publishing routes error handling
- apple.service.ts error handling
- expo.service.ts error handling

**Why:**
- Publishing is high-risk (external APIs, money involved)
- Error paths are often missed in manual testing
- High coverage gives confidence for production
- Focused on new Epic 4 code, not entire codebase

**Alternatives Considered:**
1. 80% threshold - Too low for critical path
2. 100% threshold - Unrealistic, diminishing returns
3. Overall codebase 95% - Out of scope for this task

**Trade-offs:**
- Pro: High confidence in error handling
- Con: May require testing edge cases that rarely occur

---

## Decision 6: Test Timeout Configuration
**Date:** 2026-01-13
**Status:** APPROVED

**Decision:**
Use 30-second timeout for integration tests (already configured in jest.config.js), with explicit shorter timeouts for fast operations.

**Pattern:**
```typescript
// Use default 30s for tests that mock API calls
it('should handle Apple API timeout', async () => {
  // ... test
});

// Override for tests that should be fast
it('should validate input immediately', async () => {
  // ... test
}, 5000); // 5 second timeout
```

**Why:**
- 30s sufficient for async operations with retries
- Shorter timeouts catch infinite loops
- Consistent with existing test config
- Prevents hanging CI/CD pipelines

**Alternatives Considered:**
1. 10s default - Too short for retry scenarios
2. 60s default - Too long, slows feedback
3. No timeout - Tests can hang forever

**Trade-offs:**
- Pro: Balance between catching hangs and allowing retries
- Con: May need tuning based on actual execution times

---

## Decision 7: Frontend Error Component Strategy
**Date:** 2026-01-13
**Status:** APPROVED

**Decision:**
Create reusable error boundary components for publishing flow, tested with React Testing Library.

**Components:**
- `<PublishingErrorMessage />` - Displays user-friendly error
- `<PublishingRetryButton />` - Triggers retry action
- `<PublishingErrorBoundary />` - Catches React errors

**Why:**
- Reusable across publishing UI
- Testable in isolation
- Consistent error UX
- Follows React best practices

**Alternatives Considered:**
1. Inline error handling - Duplicated code, inconsistent
2. Global error boundary only - Too generic, loses context
3. Toast notifications only - Not persistent enough

**Trade-offs:**
- Pro: Reusable, consistent, testable
- Con: More components to maintain

---

## Decision 8: Documentation Format
**Date:** 2026-01-13
**Status:** APPROVED

**Decision:**
Create single comprehensive error documentation file (publishing-errors.md) with sections for each error category, plus troubleshooting guide.

**Structure:**
```markdown
# Publishing Error Reference

## Error Codes
### Validation Errors (PUB_VAL_*)
### Authentication Errors (PUB_AUTH_*)
### Build Errors (PUB_BUILD_*)
### Network Errors (PUB_NET_*)
### System Errors (PUB_SYS_*)

## Troubleshooting Guide
## FAQ
## Monitoring & Alerting
```

**Why:**
- Single source of truth
- Easy to search (Ctrl+F)
- Can generate from code comments later
- Supports customer support team

**Alternatives Considered:**
1. Separate file per error type - Too fragmented
2. In-code comments only - Not accessible to support team
3. Wiki/Notion - Gets out of sync with code

**Trade-offs:**
- Pro: Comprehensive, searchable, accessible
- Con: Large file (but well-structured)

---

## Open Questions
None currently

---

## Deferred Decisions
1. **Error monitoring service** (Sentry vs DataDog) - Deferred to DevOps
2. **Error rate alerting thresholds** - Deferred to production monitoring phase
3. **User-facing error code display** - Deferred to UX review
