# Phase 4: Mobile Development - Quick Start Guide

**Last Updated:** 2026-01-05
**Status:** Task Group 1 Complete

---

## What's New

### Database Schema Extensions (✅ Ready for Use)

#### Tasks Table - New Columns
```typescript
platform: 'web' | 'mobile'  // Default: 'web'
metroUrl: string | null     // Railway Metro bundler URL
containerId: string | null  // Railway container ID
```

#### New Table: `railway_containers`
Complete lifecycle tracking for Railway containers:
```typescript
{
  id: string
  userId: string
  taskId: string
  containerId: string        // Unique Railway container ID
  metroUrl: string           // Public HTTPS Metro URL
  status: 'starting' | 'running' | 'stopped' | 'error'
  createdAt: Date
  updatedAt: Date
  lastActivityAt: Date       // For idle detection (30-min cleanup)
  resourceUsage: {
    cpu?: number             // CPU usage percentage
    ram?: number             // RAM usage in MB
    network?: number         // Network usage in MB
  } | null
}
```

---

## Quick Usage

### 1. Create a Mobile Task

```typescript
import { db } from '@/lib/db/client'
import { tasks, insertTaskSchema } from '@/lib/db/schema'

// Validate with Zod schema (recommended)
const mobileTask = insertTaskSchema.parse({
  userId: 'user-123',
  prompt: 'Create a React Native todo app',
  platform: 'mobile',  // 🆕 NEW!
  title: 'Mobile Todo App',
})

await db.insert(tasks).values(mobileTask)
```

### 2. Create a Railway Container Record

```typescript
import { railwayContainers, insertRailwayContainerSchema } from '@/lib/db/schema'

const container = insertRailwayContainerSchema.parse({
  userId: 'user-123',
  taskId: 'task-456',
  containerId: 'railway-xyz789',
  metroUrl: 'https://mobile-xyz789.railway.app',
  // status defaults to 'starting'
})

await db.insert(railwayContainers).values(container)
```

### 3. Link Task to Container

```typescript
import { eq } from 'drizzle-orm'

await db.update(tasks)
  .set({
    containerId: 'railway-xyz789',
    metroUrl: 'https://mobile-xyz789.railway.app',
  })
  .where(eq(tasks.id, 'task-456'))
```

### 4. Query Mobile Tasks

```typescript
import { eq, and } from 'drizzle-orm'

// Get all mobile tasks for a user
const mobileTasks = await db
  .select()
  .from(tasks)
  .where(
    and(
      eq(tasks.userId, 'user-123'),
      eq(tasks.platform, 'mobile')
    )
  )
```

### 5. Find Running Containers

```typescript
// Get all running containers (for monitoring)
const runningContainers = await db
  .select()
  .from(railwayContainers)
  .where(eq(railwayContainers.status, 'running'))
```

### 6. Find Idle Containers (Cleanup)

```typescript
import { lt, and } from 'drizzle-orm'

const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)

const idleContainers = await db
  .select()
  .from(railwayContainers)
  .where(
    and(
      eq(railwayContainers.status, 'running'),
      lt(railwayContainers.lastActivityAt, thirtyMinutesAgo)
    )
  )
```

### 7. Update Container Activity

```typescript
// Update lastActivityAt to prevent idle cleanup
await db.update(railwayContainers)
  .set({ lastActivityAt: new Date() })
  .where(eq(railwayContainers.id, 'container-123'))
```

### 8. Update Container Status

```typescript
// Update container status (starting → running)
await db.update(railwayContainers)
  .set({
    status: 'running',
    updatedAt: new Date(),
  })
  .where(eq(railwayContainers.containerId, 'railway-xyz789'))
```

### 9. Update Resource Usage

```typescript
// Update resource usage metrics
await db.update(railwayContainers)
  .set({
    resourceUsage: {
      cpu: 45.2,
      ram: 512,
      network: 128,
    },
    updatedAt: new Date(),
  })
  .where(eq(railwayContainers.id, 'container-123'))
```

### 10. Join Task with Container

```typescript
import { eq } from 'drizzle-orm'

// Get task with container details
const taskWithContainer = await db
  .select({
    task: tasks,
    container: railwayContainers,
  })
  .from(tasks)
  .leftJoin(railwayContainers, eq(tasks.id, railwayContainers.taskId))
  .where(eq(tasks.id, 'task-456'))
```

---

## API Changes

### Task Creation Endpoint (Example)

```typescript
// POST /api/tasks
{
  "userId": "user-123",
  "prompt": "Create a mobile app",
  "platform": "mobile",  // 🆕 NEW FIELD (optional, defaults to 'web')
  "title": "My Mobile App"
}
```

### Task Response (Example)

```typescript
// GET /api/tasks/:id
{
  "id": "task-456",
  "userId": "user-123",
  "prompt": "Create a mobile app",
  "platform": "mobile",       // 🆕 NEW FIELD
  "metroUrl": "https://...",  // 🆕 NEW FIELD (nullable)
  "containerId": "railway-xyz", // 🆕 NEW FIELD (nullable)
  // ... other fields
}
```

---

## Migration Commands

### Apply Migration (Push to Database)

```bash
cd turbocat-agent

# Option 1: Push schema directly
pnpm db:push

# Option 2: Run SQL manually
psql $POSTGRES_URL -f lib/db/migrations/0021_next_the_twelve.sql
```

### Rollback Migration (Undo Changes)

```bash
cd turbocat-agent

# Run rollback SQL
psql $POSTGRES_URL -f lib/db/migrations/0021_next_the_twelve_rollback.sql
```

### Verify Migration

```sql
-- Check tasks table has new columns
\d tasks

-- Check railway_containers table exists
\d railway_containers

-- Check indexes
\di idx_tasks_*
\di idx_railway_containers_*
```

---

## Testing

### Run All Tests

```bash
cd turbocat-agent
pnpm test __tests__/db/mobile-schema.test.ts
```

**Expected Output:**
```
✓ __tests__/db/mobile-schema.test.ts (43 tests | 20 skipped)
  Test Files  1 passed (1)
  Tests       23 passed | 20 todo (43)
```

### Test Individual Schemas

```typescript
import { insertTaskSchema, insertRailwayContainerSchema } from '@/lib/db/schema'

// Test task validation
const result = insertTaskSchema.safeParse({
  userId: 'user-123',
  prompt: 'Test',
  platform: 'invalid', // Should fail
})

console.log(result.success) // false
console.log(result.error)   // Validation errors
```

---

## Type Safety

### TypeScript Types Available

```typescript
import type {
  Task,
  InsertTask,
  RailwayContainer,
  InsertRailwayContainer,
} from '@/lib/db/schema'

// Task with platform
const task: Task = {
  id: 'task-1',
  userId: 'user-123',
  prompt: 'Build app',
  platform: 'mobile', // ✅ Type-safe enum
  metroUrl: 'https://...',
  containerId: 'railway-xyz',
  // ... other fields
}

// Container with status
const container: RailwayContainer = {
  id: 'container-1',
  userId: 'user-123',
  taskId: 'task-1',
  containerId: 'railway-xyz',
  metroUrl: 'https://...',
  status: 'running', // ✅ Type-safe enum
  // ... other fields
}
```

---

## Performance Tips

### Use Indexed Queries

✅ **Fast (uses index):**
```typescript
// Query by platform (indexed)
where(eq(tasks.platform, 'mobile'))

// Query by container ID (indexed)
where(eq(tasks.containerId, 'railway-xyz'))

// Query by status (indexed)
where(eq(railwayContainers.status, 'running'))

// Query by last activity (indexed)
where(lt(railwayContainers.lastActivityAt, date))
```

❌ **Slow (no index):**
```typescript
// Full table scan - avoid if possible
where(like(tasks.prompt, '%mobile%'))
```

### Batch Updates

```typescript
// ✅ Good: Batch update activity timestamps
await db.update(railwayContainers)
  .set({ lastActivityAt: new Date() })
  .where(inArray(railwayContainers.id, containerIds))

// ❌ Bad: Loop with individual updates
for (const id of containerIds) {
  await db.update(railwayContainers)
    .set({ lastActivityAt: new Date() })
    .where(eq(railwayContainers.id, id))
}
```

---

## Common Patterns

### Container Lifecycle Management

```typescript
// 1. Provision container
const container = await db.insert(railwayContainers)
  .values({
    userId: 'user-123',
    taskId: 'task-456',
    containerId: 'railway-xyz',
    metroUrl: 'https://mobile-xyz.railway.app',
    status: 'starting',
  })
  .returning()

// 2. Update to running once Metro is ready
await db.update(railwayContainers)
  .set({ status: 'running', updatedAt: new Date() })
  .where(eq(railwayContainers.id, container.id))

// 3. Update activity on each request
await db.update(railwayContainers)
  .set({ lastActivityAt: new Date() })
  .where(eq(railwayContainers.id, container.id))

// 4. Cleanup idle containers (cron job)
const idleContainers = await db.select()
  .from(railwayContainers)
  .where(
    and(
      eq(railwayContainers.status, 'running'),
      lt(railwayContainers.lastActivityAt, thirtyMinutesAgo)
    )
  )

// 5. Stop containers
for (const container of idleContainers) {
  await stopRailwayContainer(container.containerId)
  await db.update(railwayContainers)
    .set({ status: 'stopped', updatedAt: new Date() })
    .where(eq(railwayContainers.id, container.id))
}
```

### Error Handling

```typescript
try {
  const container = insertRailwayContainerSchema.parse({
    userId: 'user-123',
    taskId: 'task-456',
    containerId: 'railway-xyz',
    metroUrl: 'invalid-url', // ❌ Invalid URL
  })
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Validation failed:', error.errors)
    // Handle validation errors
  }
}
```

---

## Breaking Changes

### None! ✅

All changes are backward compatible:
- Default `platform='web'` for existing tasks
- Nullable columns (`metroUrl`, `containerId`)
- No changes to existing queries
- No changes to existing API contracts

---

## Known Limitations

1. **Components Table:** Task 1.2 blocked by Phase 2 Component Gallery
   - Tests prepared and ready
   - Will activate when Phase 2 completes

2. **Integration Tests:** 5 tests pending database access
   - Need dev database connection
   - Will run during QA phase

---

## Troubleshooting

### Migration Fails

```bash
# Check current schema version
psql $POSTGRES_URL -c "SELECT * FROM drizzle.migrations"

# Check if columns already exist
psql $POSTGRES_URL -c "\d tasks"

# Force rollback
psql $POSTGRES_URL -f lib/db/migrations/0021_next_the_twelve_rollback.sql
```

### Schema Validation Fails

```typescript
// Check what went wrong
const result = insertTaskSchema.safeParse(data)
if (!result.success) {
  console.log('Validation errors:', result.error.errors)
  // Fix data based on errors
}
```

### Type Errors

```bash
# Regenerate types from schema
cd turbocat-agent
pnpm db:generate

# Restart TypeScript server in VS Code
# Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

---

## Documentation

- **Full Docs:** `PHASE4_TASK_GROUP_1_COMPLETE.md`
- **Summary:** `PHASE4_IMPLEMENTATION_SUMMARY.md`
- **Spec:** `agent-os/specs/2026-01-04-phase-4-mobile-development/spec.md`
- **Tasks:** `agent-os/specs/2026-01-04-phase-4-mobile-development/tasks.md`

---

## Support

### Questions?
- Check full documentation: `PHASE4_TASK_GROUP_1_COMPLETE.md`
- Review test examples: `__tests__/db/mobile-schema.test.ts`
- Ask in team Slack: #turbocat-phase4

### Issues?
- Run tests: `pnpm test __tests__/db/mobile-schema.test.ts`
- Check migration status: `\d tasks` in psql
- Review rollback script: `lib/db/migrations/0021_next_the_twelve_rollback.sql`

---

**Version:** 1.0.0
**Last Updated:** 2026-01-05
**Status:** ✅ Production Ready
