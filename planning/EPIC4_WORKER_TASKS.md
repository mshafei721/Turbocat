# Epic 4: BullMQ Worker Tasks

## Phase 1: Core Worker Implementation

### Task 1: Create Publishing Queue Configuration
**File**: `backend/src/lib/publishingQueue.ts`

**Acceptance Criteria**:
- [ ] Export publishingQueue instance
- [ ] Use getBullMQConnection from lib/redis.ts
- [ ] Configure job options: 3 attempts, exponential backoff
- [ ] Set removeOnComplete: 100, removeOnFail: 500
- [ ] Add proper TypeScript types for job data
- [ ] Handle Redis unavailability gracefully

**Implementation**:
```typescript
import { Queue } from 'bullmq';
import { getBullMQConnection } from './redis';
import { logger } from './logger';

export interface PublishingJobData {
  publishingId: string;
  projectId: string;
  userId: string;
}

const connection = getBullMQConnection();

export const publishingQueue = connection
  ? new Queue<PublishingJobData>('publishing-builds', {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    })
  : null;

if (!publishingQueue) {
  logger.warn('[PublishingQueue] Queue not initialized - Redis not available');
}
```

---

### Task 2: Create BullMQ Worker
**File**: `backend/src/workers/publishing.worker.ts`

**Acceptance Criteria**:
- [ ] Worker processes PublishingJobData
- [ ] Calls publishingService.executeBuildAndSubmit
- [ ] Logs job start/completion/failure
- [ ] Uses getBullMQConnection for Redis connection
- [ ] Implements rate limiting (5 jobs per minute)
- [ ] Event handlers: completed, failed, error
- [ ] Exports worker instance for shutdown

**Implementation**:
```typescript
import { Worker, Job } from 'bullmq';
import { getBullMQConnection } from '../lib/redis';
import { getPublishingService } from '../services/publishing.service';
import { logger } from '../lib/logger';
import { PublishingJobData } from '../lib/publishingQueue';

const QUEUE_NAME = 'publishing-builds';
const connection = getBullMQConnection();

export const publishingWorker = connection
  ? new Worker<PublishingJobData>(
      QUEUE_NAME,
      async (job: Job<PublishingJobData>) => {
        const { publishingId, projectId, userId } = job.data;

        logger.info('[PublishingWorker] Processing job', {
          jobId: job.id,
          publishingId,
          projectId,
          userId
        });

        const publishingService = getPublishingService();

        if (!publishingService) {
          throw new Error('PublishingService not available');
        }

        try {
          await publishingService.executeBuildAndSubmit(publishingId);

          logger.info('[PublishingWorker] Job completed successfully', {
            jobId: job.id,
            publishingId
          });

          return { success: true, publishingId };
        } catch (error) {
          logger.error('[PublishingWorker] Job failed', {
            jobId: job.id,
            publishingId,
            error: error instanceof Error ? error.message : String(error)
          });

          throw error;
        }
      },
      {
        connection,
        limiter: {
          max: 5,
          duration: 60000,
        },
      }
    )
  : null;

if (publishingWorker) {
  publishingWorker.on('completed', (job) => {
    logger.info('[PublishingWorker] Job completed', { jobId: job.id });
  });

  publishingWorker.on('failed', (job, error) => {
    logger.error('[PublishingWorker] Job failed', {
      jobId: job?.id,
      error: error.message
    });
  });

  publishingWorker.on('error', (error) => {
    logger.error('[PublishingWorker] Worker error', { error: error.message });
  });
} else {
  logger.warn('[PublishingWorker] Worker not initialized - Redis not available');
}

export default publishingWorker;
```

---

### Task 3: Update PublishingService to Queue Jobs
**File**: `backend/src/services/publishing.service.ts`

**Acceptance Criteria**:
- [ ] Import publishingQueue
- [ ] In initiatePublishing, queue job instead of calling executeBuildAndSubmit
- [ ] Only queue if publishingQueue is available
- [ ] If queue unavailable, log error and throw
- [ ] Pass publishingId, projectId, userId to queue
- [ ] Return publishing record immediately

**Changes**:
```typescript
// Add import
import { publishingQueue } from '../lib/publishingQueue';

// In initiatePublishing method, replace direct execution:
// OLD: await this.executeBuildAndSubmit(publishing.id);

// NEW:
if (!publishingQueue) {
  logger.error('[PublishingService] Cannot queue job - Redis not available');
  throw new ApiError(503, 'Background job service unavailable', ErrorCodes.SERVICE_UNAVAILABLE);
}

await publishingQueue.add('build-and-submit', {
  publishingId: publishing.id,
  projectId,
  userId,
});

logger.info('[PublishingService] Job queued successfully', {
  publishingId: publishing.id
});
```

---

## Phase 2: Application Integration

### Task 4: Integrate Worker into Server Startup
**File**: `backend/src/server.ts`

**Acceptance Criteria**:
- [ ] Import publishingWorker at top of file
- [ ] Worker starts automatically when app starts
- [ ] Update gracefulShutdown to close worker
- [ ] Wait for worker to finish current job (30s timeout)
- [ ] Log worker shutdown status

**Changes**:
```typescript
// Add import
import publishingWorker from './workers/publishing.worker';

// Update gracefulShutdown function
async function gracefulShutdown(signal: string): Promise<void> {
  // ... existing code ...

  try {
    // ... existing HTTP server close ...

    // Close worker
    if (publishingWorker) {
      logger.info('Closing publishing worker...');
      await publishingWorker.close();
      logger.info('Publishing worker closed');
    }

    // ... existing database disconnect ...
  }
}
```

---

## Phase 3: Testing & Validation

### Task 5: Create Worker Unit Tests
**File**: `backend/src/workers/__tests__/publishing.worker.test.ts`

**Test cases**:
- [ ] Worker processes valid job data
- [ ] Worker retries on failure
- [ ] Worker logs errors properly
- [ ] Worker handles missing publishingService

---

### Task 6: Integration Testing
**Manual test plan**:

1. **Start app with Redis**:
   ```bash
   # Ensure Redis is running
   docker run -d -p 6379:6379 redis:alpine

   # Start backend
   cd backend
   npm run dev
   ```
   Expected: No errors, worker initialized

2. **Queue a job via API**:
   ```bash
   # POST to /api/v1/publishing/initiate
   # Verify job is queued
   # Verify worker processes job
   # Check logs for job completion
   ```

3. **Start app without Redis**:
   ```bash
   # Stop Redis
   docker stop <redis-container>

   # Start backend
   cd backend
   npm run dev
   ```
   Expected: Warning logged, app starts without worker

4. **Graceful shutdown**:
   ```bash
   # Start app
   # Queue a job
   # Send SIGTERM
   # Verify worker completes current job
   # Verify clean shutdown
   ```

---

### Task 7: Type Checking & Linting
**Commands**:
```bash
cd backend
npm run typecheck
npm run lint
npm run test
```

**Acceptance Criteria**:
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] All tests pass

---

## Task Status

### Phase 1: Core Implementation
- [ ] Task 1: Create Publishing Queue Configuration
- [ ] Task 2: Create BullMQ Worker
- [ ] Task 3: Update PublishingService

### Phase 2: Integration
- [ ] Task 4: Integrate Worker into Server Startup

### Phase 3: Testing
- [ ] Task 5: Create Worker Unit Tests
- [ ] Task 6: Integration Testing
- [ ] Task 7: Type Checking & Linting

---

## Rollback Procedure

If issues arise:
1. Revert changes to publishing.service.ts
2. Remove worker import from server.ts
3. Restart application
4. Worker files can remain (unused)
