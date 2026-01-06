# Phase 4 Mobile Development - Performance Benchmarks
**Phase 7: Testing & QA - Task 7.4**

**Created:** 2026-01-06
**Status:** Baseline Performance Targets Documented

---

## Executive Summary

This document defines performance benchmarks for Phase 4 mobile development features, including target metrics, measurement methodology, and optimization strategies.

### Target Metrics at a Glance

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Container Startup | <2 min | Pending | TBD |
| Metro Bundler Ready | <30 sec | Pending | TBD |
| QR Code Generation | <1 sec | Pending | TBD |
| Hot Reload | <5 sec | Pending | TBD |
| Database Query (task by ID) | <100 ms | Pending | TBD |
| API Response (create task) | <500 ms | Pending | TBD |

---

## 1. Container Startup Performance

### Target
- **Primary Goal:** Container starts in <2 minutes
- **Stretch Goal:** Container starts in <1 minute
- **Acceptable:** <3 minutes
- **Unacceptable:** >3 minutes

### Measurement

#### 1.1 Baseline Test Procedure
```typescript
// turbocat-agent/lib/railway/__benchmarks__/container-startup.bench.ts
import { bench, describe } from 'vitest'
import { createRailwayClient } from '../client'
import { createLifecycleService } from '../lifecycle'

describe('Container Startup Benchmark', () => {
  bench('provision container (mocked)', async () => {
    const client = createRailwayClient('test-key')
    const service = createLifecycleService(client)

    await service.provisionContainer('task-123', 'user-789')
  })

  bench('get container status polling', async () => {
    const client = createRailwayClient('test-key')

    for (let i = 0; i < 12; i++) { // Poll for 2 minutes with 10-sec intervals
      await client.getContainerStatus('container-123')
    }
  })
})
```

#### 1.2 Real-World Measurement
When deploying to Railway, measure actual time from:
- **Start:** API call to createService
- **End:** First successful health check response

#### 1.3 Measurement Points
- Container creation API time
- Docker image pull time
- Node.js + dependencies installation
- Expo CLI initialization
- Metro bundler startup
- Health check confirmation

### Factors Affecting Container Startup
1. **Image Size** - Target: <500MB
2. **Dependency Cache** - Railway layer caching
3. **Network Latency** - Geographic proximity
4. **Concurrent Containers** - Resource availability
5. **Railway Infrastructure** - Scheduled maintenance

### Optimization Strategies

#### Strategy 1: Image Layer Caching
- Pre-build Docker image with all dependencies
- Reduce dependencies to essential only
- Use Alpine Linux (not full Ubuntu)

#### Strategy 2: Parallel Initialization
- Start health checks while Metro bundler initializes
- Don't wait for full Metro startup for container "ready" status

#### Strategy 3: Resource Pre-allocation
- Request minimum 512MB RAM, 0.5 CPU upfront
- Avoid memory swapping which slows startup

---

## 2. Metro Bundler Ready Performance

### Target
- **Primary Goal:** Metro bundler ready in <30 seconds after container starts
- **Stretch Goal:** <20 seconds
- **Acceptable:** <60 seconds
- **Unacceptable:** >60 seconds

### Measurement

#### 2.1 Health Check Polling
```typescript
// turbocat-agent/lib/railway/__benchmarks__/metro-ready.bench.ts
import { bench } from 'vitest'
import { createRailwayClient } from '../client'

bench('metro health check response time', async () => {
  const client = createRailwayClient('test-key')

  const startTime = Date.now()
  const status = await client.getContainerStatus('container-123')
  const elapsed = Date.now() - startTime

  // Expect <2 second response
  if (elapsed > 2000) {
    throw new Error(`Health check took ${elapsed}ms (target: <2000ms)`)
  }
})
```

#### 2.2 Time to QR Code Generation
- Measure from container start to QR code generation
- QR code generation should happen once Metro is ready

#### 2.3 Polling Strategy
- Poll every 5 seconds for first 30 seconds
- Poll every 10 seconds after 30 seconds
- Maximum total wait: 2 minutes
- Timeout and fail gracefully after 2 minutes

### Factors Affecting Metro Startup
1. **Project Dependencies** - package.json size
2. **Metro Bundler Compilation** - Code complexity
3. **Asset Processing** - Images, fonts, etc.
4. **WebSocket Initialization** - DevTools setup

### Optimization Strategies

#### Strategy 1: Lightweight Default Template
- Create minimal Expo project template
- Remove unused packages
- Pre-compile common components

#### Strategy 2: Bundler Caching
- Mount Docker volume for Metro cache
- Persist cache between container restarts
- Cache node_modules in Railway

#### Strategy 3: Health Check Optimization
- Return "ready" as soon as bundler can accept connections
- Don't wait for first successful client connection

---

## 3. QR Code Generation Performance

### Target
- **Primary Goal:** QR code generated in <1 second
- **Stretch Goal:** <500 ms
- **Acceptable:** <2 seconds
- **Unacceptable:** >2 seconds

### Measurement

#### 3.1 QR Code Generation Benchmark
```typescript
// turbocat-agent/lib/railway/__benchmarks__/qrcode-generation.bench.ts
import { bench, describe } from 'vitest'
import { generateQRCode } from '../qrcode'

describe('QR Code Generation Benchmark', () => {
  const testUrls = [
    'https://mobile-abc123.up.railway.app',
    'https://mobile-xyz789.up.railway.app',
    'https://mobile-test.up.railway.app',
  ]

  testUrls.forEach((url) => {
    bench(`generate QR code for ${url}`, async () => {
      await generateQRCode(url)
    })
  })
})
```

#### 3.2 Caching Effectiveness
- Measure cache hit ratio
- Target: >80% of QR codes served from cache
- Cache key: SHA256(metroUrl)

#### 3.3 Latency Components
- URL validation: <10 ms
- QR encoding: <100 ms
- SVG/PNG rendering: <50 ms
- Cache operations: <10 ms

### Factors Affecting QR Performance
1. **URL Length** - Longer URLs = larger QR codes
2. **QR Error Correction Level** - M (medium) is default
3. **Output Format** - SVG is faster than PNG
4. **Cache Hit/Miss** - Cache hit is <1ms

### Optimization Strategies

#### Strategy 1: SVG Output
- Use SVG format instead of PNG
- SVG is 10-20% faster to generate
- SVG is smaller for short URLs

#### Strategy 2: Aggressive Caching
- Cache QR codes for 1 hour
- Cache by Metro URL hash
- Implement Redis caching for distributed systems

#### Strategy 3: Pre-generation
- Generate QR code before returning Metro URL to client
- Don't block response waiting for QR generation
- Return QR code in next polling response

---

## 4. Hot Reload Performance

### Target
- **Primary Goal:** Code changes reflected in <5 seconds
- **Stretch Goal:** <3 seconds
- **Acceptable:** <10 seconds
- **Unacceptable:** >10 seconds

### Measurement

#### 4.1 Hot Reload Timing Test
```typescript
// Manual test procedure:
// 1. Deploy container with initial app.tsx
// 2. Open QR code in Expo Go
// 3. Measure time: Code change → App update visible
// 4. Record timestamp differences

// Automated mock test:
import { bench } from 'vitest'
import { createRailwayClient } from '../client'

bench('metro bundler hot reload response', async () => {
  const client = createRailwayClient('test-key')

  // Simulate file change
  const startTime = Date.now()

  // Get logs to verify bundling started
  const logs = await client.getContainerLogs('container-123')

  // Check for "changed" or "bundling" message
  const hasBundleMessage = logs.logs.some(log =>
    log.message.includes('bundling') || log.message.includes('changed')
  )

  const elapsed = Date.now() - startTime
  if (elapsed > 5000) {
    throw new Error(`Hot reload took ${elapsed}ms (target: <5000ms)`)
  }
})
```

#### 4.2 Metro Bundler Watch Performance
- File system watch latency: <100 ms
- Dependency resolution: <500 ms
- Bundling: <2000 ms
- Delivery to Expo Go: <500 ms

### Factors Affecting Hot Reload
1. **Project Size** - Number of files and dependencies
2. **Change Scope** - Entire app vs single component
3. **Metro Bundler Optimization** - Incremental compilation
4. **Network Latency** - Expo Go connection quality

### Optimization Strategies

#### Strategy 1: Incremental Compilation
- Metro only re-bundles changed modules
- Use proper dependency declarations
- Avoid circular dependencies

#### Strategy 2: File Watcher Optimization
- Use Watchman for better file system monitoring
- Configure ignore patterns (node_modules, .next, etc.)
- Batch file changes (debounce)

#### Strategy 3: Network Optimization
- Use WebSocket for real-time updates (vs polling)
- Compress bundle diffs
- Only send changed bundle parts

---

## 5. Database Query Performance

### Target
- **Primary Goal:** Task query by ID in <100 ms
- **Acceptable:** <200 ms
- **Stretch Goal:** <50 ms
- **Unacceptable:** >500 ms

### Measurement

#### 5.1 Query Performance Benchmark
```typescript
// turbocat-agent/__tests__/benchmarks/database.bench.ts
import { bench, describe } from 'vitest'
import { db } from '@/lib/db/client'
import { tasks } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

describe('Database Query Benchmarks', () => {
  bench('query task by ID', async () => {
    await db.select().from(tasks).where(eq(tasks.id, 'task-123'))
  })

  bench('query tasks by user ID', async () => {
    await db.select().from(tasks).where(eq(tasks.userId, 'user-789'))
  })

  bench('query containers by task ID', async () => {
    // Mock railway containers table query
    // await db.select().from(railwayContainers).where(eq(railwayContainers.taskId, 'task-123'))
  })

  bench('update task with container info', async () => {
    // Mock update operation
  })
})
```

#### 5.2 Index Effectiveness
- Verify indexes on: id, userId, platform, containerId
- Measure query time with and without indexes

### Optimization Strategies

#### Strategy 1: Proper Indexing
- Primary key on `id` (automatic)
- Index on `userId` for user task lists
- Index on `platform` for filtering
- Index on `containerId` for container lookups
- Index on `createdAt` for sorting

#### Strategy 2: Connection Pooling
- Use connection pooling in Neon PostgreSQL
- Keep connections warm (avoid cold starts)
- Configure appropriate pool size

#### Strategy 3: Query Optimization
- Use SELECT for specific columns (not *)
- Add LIMIT when listing
- Use EXPLAIN ANALYZE for slow queries

---

## 6. API Response Performance

### Target
- **Primary Goal:** Create task API in <500 ms
- **Acceptable:** <1000 ms
- **Stretch Goal:** <300 ms
- **Unacceptable:** >2000 ms

### Measurement

#### 6.1 API Response Timing
```typescript
// Mock API endpoint test
import { describe, it, expect } from 'vitest'

describe('Task API Performance', () => {
  it('should create mobile task within 500ms', async () => {
    const startTime = Date.now()

    const response = await fetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Task',
        description: 'Test',
        platform: 'mobile',
      }),
    })

    const elapsed = Date.now() - startTime
    expect(elapsed).toBeLessThan(500)
    expect(response.ok).toBe(true)
  })
})
```

### Optimization Strategies

#### Strategy 1: Async Operations
- Don't wait for container to fully start before returning
- Return task with "starting" status immediately
- Provision container in background

#### Strategy 2: Response Caching
- Cache platform list (web, mobile)
- Cache component gallery data
- Use Cache-Control headers

#### Strategy 3: Database Connection Pooling
- Pre-warm database connections
- Use prepared statements for common queries

---

## 7. Measurement Tools & Commands

### Run All Benchmarks
```bash
# Unit test benchmarks (mocked)
pnpm test --reporter=verbose

# Coverage report
pnpm test:coverage

# Performance benchmarks (if vitest bench is configured)
pnpm bench
```

### Real-World Performance Testing

#### Container Startup Test
```bash
# 1. Create a mobile task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"platform":"mobile","title":"Perf Test"}'

# 2. Monitor provisioning time
# Record: API response time + container startup time
```

#### QR Code Generation Test
```bash
# Time QR code endpoint
time curl http://localhost:3000/api/tasks/[taskId]/qr-code

# Expected: <1 second response time
```

#### Database Query Test
```bash
# Use database client or ORM profiling
pnpm db:studio
# Monitor query execution times
```

---

## 8. Performance Optimization Roadmap

### Phase 1 (Current)
- [ ] Establish baseline metrics
- [ ] Document all measurement procedures
- [ ] Create mock benchmarks
- [ ] Set up CI/CD performance tracking

### Phase 2 (Next 2 weeks)
- [ ] Run real-world tests on Railway sandbox
- [ ] Identify bottlenecks
- [ ] Implement Strategy 1 optimizations
- [ ] Re-measure and compare

### Phase 3 (Next 4 weeks)
- [ ] Implement Strategy 2 optimizations
- [ ] Load test with 10+ concurrent containers
- [ ] Optimize database queries
- [ ] Profile memory usage

### Phase 4 (Next 6 weeks)
- [ ] Implement Strategy 3 optimizations
- [ ] Target stretch goals
- [ ] Production load testing
- [ ] Document final benchmarks

---

## 9. Success Criteria

### Minimum Acceptable Performance
- [ ] Container starts in <2 minutes (100% of time)
- [ ] Metro bundler ready in <30 seconds (95%+ of time)
- [ ] QR code generates in <1 second (100% of time)
- [ ] Hot reload in <5 seconds (90%+ of time)
- [ ] Database queries <100 ms (95%+ of time)
- [ ] API responses <500 ms (95%+ of time)

### Target Performance (Excellent)
- [ ] Container starts in <1 minute (95%+ of time)
- [ ] Metro bundler ready in <20 seconds (90%+ of time)
- [ ] QR code generates in <500 ms (95%+ of time)
- [ ] Hot reload in <3 seconds (85%+ of time)
- [ ] Database queries <50 ms (90%+ of time)
- [ ] API responses <300 ms (90%+ of time)

---

## 10. Performance Monitoring in Production

### Metrics to Track
- Container startup time (histogram)
- Metro bundler initialization time
- QR code generation latency (percentiles: p50, p95, p99)
- Hot reload response time
- Database query latency
- API endpoint response times
- Error rates for each operation

### Alerting Thresholds
- Container startup >3 min: CRITICAL
- Metro bundler >60 sec: WARNING
- QR code generation >2 sec: WARNING
- Database queries >500 ms: INFO

### Dashboards
- Container provisioning metrics
- Metro bundler health and performance
- Database performance metrics
- API response time distribution

---

## Appendix: Test Data Sizes

### Small Project (Minimal)
- Files: 5-10
- Dependencies: 10-15
- Size: ~50 MB

### Medium Project (Typical)
- Files: 30-50
- Dependencies: 30-50
- Size: ~150 MB

### Large Project (Complex)
- Files: 100+
- Dependencies: 100+
- Size: ~500 MB

---

**Document Version:** 1.0
**Last Updated:** 2026-01-06
**Next Review:** 2026-01-20
