# PLAN: ExpoService Implementation (Task 2.2)

## Goal
Implement ExpoService class to handle Expo Build API interactions for Epic 4 Publishing Flow. Service must validate Expo tokens, initiate iOS builds, and poll build status.

## Scope
- Create `backend/src/services/expo.service.ts` with ExpoService class
- Implement 3 methods: validateToken(), startBuild(), getBuildStatus()
- Define BuildStatus interface with proper TypeScript types
- Create comprehensive unit tests in `backend/src/services/__tests__/expo.service.test.ts`
- Follow existing service patterns from oauth.service.ts
- Achieve 80%+ test coverage

## Non-goals
- NOT implementing downloadBuild() method (listed in dev-tasks.md but not in EXPECTED OUTCOME)
- NOT integrating with database or other services
- NOT creating API routes (separate task)
- NOT implementing encryption (separate task)

## Constraints
- Must follow existing service pattern: class-based, typed interfaces, logger usage
- Must use axios for HTTP requests (consistent with oauth.service.ts)
- Must use existing logger from '../lib/logger'
- Must use ApiError from '../utils/ApiError'
- Must mock axios in tests (no real API calls)
- Must run on Node.js 20+
- Tests must use @jest/globals (consistent with oauth.service.test.ts)

## Assumptions
- Expo Build API endpoints:
  - Base URL: https://api.expo.dev/v2
  - Auth validation: GET /auth/loginAsync (with Bearer token)
  - Start build: POST /builds (with projectId, platform, token)
  - Build status: GET /builds/:buildId (with token)
- Token is passed as Authorization: Bearer header
- BuildStatus has 3 states: 'in-progress', 'finished', 'errored'
- artifactUrl is available when status = 'finished'
- error message is available when status = 'errored'

## Done Criteria
- ExpoService class implemented with 3 methods
- BuildStatus interface defined
- JSDoc documentation complete
- Error handling comprehensive
- Unit tests written (15+ test cases)
- Tests pass with 80%+ coverage
- TypeScript compiles with no errors
- Code follows oauth.service.ts patterns
