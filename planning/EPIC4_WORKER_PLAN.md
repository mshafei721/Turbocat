# Epic 4: BullMQ Worker Implementation Plan

## Goal
Implement background job processing for publishing builds using BullMQ worker to handle long-running Expo build operations asynchronously.

## Scope
- Create BullMQ worker for publishing builds
- Create queue configuration for job management
- Update PublishingService to queue jobs instead of direct execution
- Integrate worker into application startup
- Implement graceful shutdown for worker
- Add job event handlers for logging and monitoring

## Non-goals
- WebSocket updates (deferred to Phase 4)
- Build status polling (simplified single check for Phase 3)
- Apple upload workflow (Phase 4)
- UI status updates via WebSocket
- Advanced retry strategies beyond BullMQ defaults

## Constraints
- Must use existing BullMQ package (already installed)
- Must use existing Redis connection configuration
- Must maintain existing PublishingService interface
- Must not break existing publishing flow tests
- Must handle Redis unavailability gracefully

## Assumptions
- Redis is available via REDIS_URL environment variable
- BullMQ and ioredis packages are installed
- Publishing service executeBuildAndSubmit method is idempotent
- Logger utility is available and working
- Prisma client is initialized and available

## Risks
1. **Redis unavailable**: Worker will fail to start
   - Mitigation: Log error, document Redis requirement, allow app to start without worker
2. **Job failures**: Build process might fail
   - Mitigation: BullMQ retry with exponential backoff (3 attempts)
3. **Graceful shutdown**: Jobs in progress during shutdown
   - Mitigation: Proper shutdown handler, wait for current job completion
4. **Memory leaks**: Worker running indefinitely
   - Mitigation: BullMQ handles cleanup, proper event handler management

## Impact
**Affected files:**
- NEW: backend/src/workers/publishing.worker.ts (worker implementation)
- NEW: backend/src/lib/publishingQueue.ts (queue configuration)
- MODIFIED: backend/src/services/publishing.service.ts (queue jobs instead of direct execution)
- MODIFIED: backend/src/server.ts (worker initialization and shutdown)

**Dependencies:**
- bullmq: ^5.66.4 (installed)
- ioredis: ^5.9.0 (installed)
- Redis connection via lib/redis.ts
- Logger utility
- PublishingService

## Rollback Strategy
If worker implementation causes issues:
1. Revert changes to publishing.service.ts (restore direct execution)
2. Remove worker initialization from server.ts
3. Deploy previous version
4. Worker files can remain (unused) without causing harm

## Test Plan
1. **Unit tests** (backend/src/workers/__tests__/publishing.worker.test.ts):
   - Worker processes job successfully
   - Worker retries on failure
   - Worker handles invalid job data

2. **Integration tests**:
   - Queue job → worker processes → status updated
   - Multiple jobs queued in sequence
   - Job failure triggers retry

3. **Manual testing**:
   - Start app with Redis available
   - Start app without Redis (should log warning)
   - Queue publishing job via API
   - Verify worker processes job
   - Verify graceful shutdown

4. **Commands**:
   ```bash
   cd backend
   npm run typecheck
   npm run lint
   npm test -- --testPathPattern=publishing.worker
   ```

## Acceptance Criteria
- [ ] BullMQ worker created at backend/src/workers/publishing.worker.ts
- [ ] Queue configuration created at backend/src/lib/publishingQueue.ts
- [ ] PublishingService.initiatePublishing queues job instead of direct execution
- [ ] Worker starts on application startup
- [ ] Worker handles job processing with logging
- [ ] Retry logic configured (3 attempts, exponential backoff)
- [ ] Graceful shutdown implemented
- [ ] Event handlers for completed/failed/error
- [ ] No TypeScript errors
- [ ] Documentation updated if Redis becomes hard requirement
