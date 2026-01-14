# Plan: Publishing API Routes Implementation (Epic 4)

## Goal
Create REST API endpoints for Epic 4 publishing flow, enabling users to initiate app publishing, check publishing status, and retry failed publishing attempts.

## Scope
- Create `backend/src/routes/publishing.ts` with 3 endpoints
- Add missing methods to PublishingService (getStatus, retry)
- Register routes in main Express app
- Implement request validation with Zod
- Apply authentication middleware
- Follow existing route patterns from projects.ts

## Non-Goals
- WebSocket real-time status updates (Phase 4)
- Full polling implementation (Phase 4)
- Apple upload implementation (Phase 4)
- Frontend integration
- E2E tests (unit tests cover routes)

## Constraints
- Must follow existing Express + Zod + TypeScript patterns
- Must use requireAuth middleware for all endpoints
- Must use existing error handling patterns (ApiError)
- Must use existing parameter extraction utilities
- Must maintain backward compatibility with PublishingService

## Assumptions
- PublishingService.initiatePublishing() already exists and works
- PublishingService.updateStatus() already exists
- PublishingService.executeBuildAndSubmit() already exists
- Prisma schema includes Publishing table with required fields
- Authentication middleware (requireAuth) is functional
- User ownership validation happens in service layer

## Risks
1. Missing service methods (getStatus, retry) - MITIGATION: Add them first
2. Route registration conflicts - MITIGATION: Check existing routes in app.ts
3. Validation schema mismatch with service - MITIGATION: Match initiatePublishing signature
4. Ownership validation gaps - MITIGATION: Ensure service checks user ownership

## Rollback Strategy
- Routes file is new - can be deleted
- Service method additions are non-breaking - can be removed
- Route registration can be commented out
- No database migrations required
- No breaking changes to existing code

## Impact
- New file: backend/src/routes/publishing.ts
- Modified: backend/src/services/publishing.service.ts (2 new methods)
- Modified: backend/src/app.ts (1 new route registration)
- No changes to database schema
- No changes to frontend
- No changes to other services
