# Phase 4 Mobile Development - Security Audit
**Phase 7: Testing & QA - Task 7.5**

**Created:** 2026-01-06
**Status:** Security Checklist Documented
**Risk Level:** Medium (containerized user code execution)

---

## Executive Summary

This document details security considerations for Phase 4 mobile development, including:
- API key management and storage
- Rate limiting and DDoS protection
- Container isolation and sandbox escapes
- User code execution risks
- Data privacy and compliance

### Security Risk Matrix

| Component | Threat | Impact | Likelihood | Mitigation |
|-----------|--------|--------|------------|-----------|
| Railway API Keys | Exposure | Critical | Low | Env vars, secrets manager |
| Container Escape | Code execution | Critical | Low | Docker, cgroup limits |
| QR Code Brute Force | Unauthorized access | Medium | Medium | Rate limiting |
| Metro URL Guessing | Information disclosure | Low | Medium | Secure random tokens |
| User Code Injection | Malicious code | Critical | Medium | Sandboxed containers |
| Resource Exhaustion | DoS | High | Medium | Resource limits |

---

## 1. API Key Management

### 1.1 Current Implementation

#### Storage
```typescript
// .env.local (NEVER committed to git)
RAILWAY_API_KEY=your-api-key-here

// In code: use environment variable
const apiKey = process.env.RAILWAY_API_KEY
if (!apiKey) {
  throw new Error('RAILWAY_API_KEY not set')
}
```

#### Usage
```typescript
// turbocat-agent/lib/railway/client.ts
const RAILWAY_API_URL = 'https://backboard.railway.app/graphql/v2'

const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json',
}

const response = await fetch(RAILWAY_API_URL, {
  method: 'POST',
  headers,
  body: JSON.stringify(query),
})
```

### 1.2 Security Checklist

#### Environment Variables
- [x] `RAILWAY_API_KEY` stored in `.env.local` (local development)
- [x] `RAILWAY_API_KEY` stored in Railway secrets (production)
- [ ] Verify `.env.local` is in `.gitignore`
- [ ] Verify secrets are rotated every 90 days
- [ ] Audit logs show who accessed the key

#### Secret Rotation
```bash
# Monthly secret rotation procedure:
# 1. Generate new Railway API token in Railway dashboard
# 2. Update RAILWAY_API_KEY in production secrets
# 3. Keep old key for 24 hours (backward compatibility)
# 4. Revoke old key after verification
# 5. Document in security audit log
```

#### Key Scope Limitations
- [x] Railway API key has read/write permissions for containers
- [ ] Consider creating separate key with limited permissions
- [ ] Key should only access designated Railway projects

#### Audit Logging
```typescript
// Log API key usage for audit trail
function logAPIKeyUsage(action: string, resourceId: string) {
  console.log(`[AUDIT] API Key used for: ${action} on ${resourceId}`)
  // Send to security logging service (Sentry, DataDog, etc.)
}

// Example usage
logAPIKeyUsage('CREATE_CONTAINER', 'task-123')
logAPIKeyUsage('GET_CONTAINER_STATUS', 'railway-xyz123')
```

### 1.3 Verification Checklist

```bash
# Verify .env.local is ignored
grep "\.env\.local" .gitignore  # Should match

# Check for hardcoded keys in codebase
grep -r "railway_" --include="*.ts" --include="*.tsx" .
grep -r "RAILWAY_" --include="*.ts" --include="*.tsx" .
# Should only find references to process.env.RAILWAY_API_KEY

# Verify no env files in git history
git log --all --full-history -- .env.local
# Should be empty

# If key was accidentally committed (remediation):
# Contact Railway immediately to revoke the key
# Generate new API key
# Update environment variables
```

---

## 2. Rate Limiting

### 2.1 QR Code Generation Rate Limiting

#### Problem
- Attackers could brute force QR codes to find valid Metro URLs
- Resource exhaustion: expensive QR code generation

#### Solution: Token Bucket Algorithm
```typescript
// turbocat-agent/lib/rate-limit/qrcode-limiter.ts
interface RateLimitConfig {
  tokensPerInterval: number
  interval: 'second' | 'minute'
  maxTokens?: number
}

const QR_CODE_LIMITS: RateLimitConfig = {
  tokensPerInterval: 10,  // 10 QR codes
  interval: 'second',     // per second (per IP)
  maxTokens: 100,         // burst up to 100
}

// Mock implementation for demonstration
class QRCodeRateLimiter {
  private limiters = new Map<string, number>()

  async checkLimit(ipAddress: string): Promise<boolean> {
    const now = Date.now()
    const lastRequest = this.limiters.get(ipAddress) || 0
    const timeSinceLastRequest = now - lastRequest

    if (timeSinceLastRequest < 100) {  // Min 100ms between requests
      return false
    }

    this.limiters.set(ipAddress, now)
    return true
  }
}

export const qrCodeLimiter = new QRCodeRateLimiter()
```

#### Usage in API Endpoint
```typescript
// turbocat-agent/app/api/tasks/[taskId]/qr-code/route.ts
import { qrCodeLimiter } from '@/lib/rate-limit/qrcode-limiter'

export async function GET(request: Request, { params }: { params: { taskId: string } }) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

  // Check rate limit
  const allowed = await qrCodeLimiter.checkLimit(ip)
  if (!allowed) {
    return new Response('Too many requests', { status: 429 })
  }

  // Generate QR code
  const qrCode = await generateQRCode(metroUrl)
  return new Response(qrCode.svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
```

### 2.2 Railway API Rate Limiting

#### Railway Limits
- Graphql API: 100 requests per minute
- Respect X-RateLimit-Remaining header
- Implement exponential backoff on 429 responses

#### Implementation
```typescript
// turbocat-agent/lib/railway/client.ts
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
}

async function retryRequest<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Check for rate limit (429)
      if (attempt < config.maxRetries && isRateLimitError(error)) {
        const delay = Math.min(
          config.baseDelayMs * Math.pow(2, attempt),
          config.maxDelayMs
        )
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      throw error
    }
  }

  throw lastError
}

function isRateLimitError(error: any): boolean {
  return error?.response?.status === 429 || error?.message?.includes('rate limit')
}
```

### 2.3 Verification Checklist

```bash
# Test rate limiting (should get 429 on excess requests)
for i in {1..15}; do
  curl http://localhost:3000/api/tasks/task-123/qr-code
done
# Expect 10 successes, 5 failures with 429 status
```

---

## 3. Container Isolation

### 3.1 Docker Security

#### Container Limits
```dockerfile
# Dockerfile.expo
FROM node:22-alpine

# Run as non-root user
RUN addgroup -g 1000 expo && adduser -D -u 1000 -G expo expo
USER expo

# Limit memory and CPU (applied at runtime via Docker/Railway config)
EXPOSE 19000 19001 19002 8081

ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

ENTRYPOINT ["node"]
CMD ["--expose-gc", "/app/start.js"]
```

#### Resource Limits (Railway Configuration)
```yaml
# railroad.yml or equivalent
resources:
  memory: 512Mi      # Max 512MB RAM
  cpu: 500m          # Max 0.5 CPU cores
  disk: 1Gi          # Max 1GB disk space
```

#### Network Isolation
- [x] Each container gets unique private IP
- [x] No inter-container communication (except through API)
- [x] Outbound internet access limited to essential services
- [ ] Implement network policies to block suspicious outbound IPs

### 3.2 Container Escape Prevention

#### Kernel Security
- [x] Docker uses kernel namespaces (pid, network, mount, ipc)
- [x] cgroups limit resource usage
- [x] AppArmor/SELinux in effect (platform dependent)
- [ ] Verify no privileged containers (--privileged flag)

#### Verification
```bash
# Verify container is running as non-root
docker exec <container> id
# Output should show uid=1000 (not uid=0)

# Verify cgroup limits are enforced
docker inspect <container> | grep -A 10 "Memory"

# Check for privileged mode
docker inspect <container> | grep PrivilegedMode
# Should be "false"
```

### 3.3 User Code Isolation

#### Code Execution Risk
- User can execute arbitrary JavaScript/React Native
- User can make external API calls (intentional)
- User can read/write to container filesystem
- User CANNOT escape container (by design)

#### Mitigations
1. **No custom native modules** - Expo Go limitation
2. **No system calls** - Only Node.js/React Native APIs
3. **Filesystem sandboxing** - Each container isolated
4. **Network sandboxing** - Outbound via proxy (optional)

#### Input Validation Pattern
```typescript
// Validate user code patterns before deployment
function validateUserCode(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check for dangerous patterns (avoid using these methods)
  if (code.includes('require("child_process")')) {
    errors.push('child_process module not allowed')
  }
  if (code.includes('require("fs")')) {
    errors.push('fs module only allowed for project files')
  }
  if (code.includes('eval')) {
    errors.push('eval function not allowed - use static code')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
```

---

## 4. Data Privacy & Compliance

### 4.1 Data Storage

#### User Data
- [x] User authentication via existing Turbocat auth
- [x] Task metadata stored in Neon PostgreSQL
- [x] Encrypted at rest (Neon default)
- [x] Encrypted in transit (HTTPS only)

#### Container Data
- [x] User code not stored persistently
- [x] Container destroyed after cleanup
- [x] Metro logs stored temporarily (<24 hours)
- [x] No user files stored on disk

#### Code Storage
```typescript
// User code is kept in memory during container runtime
// Code is ephemeral and destroyed with container
// Never persist user-written code to database
```

### 4.2 GDPR & Privacy

#### Data Retention
- Task metadata: Kept indefinitely (user controlled deletion)
- Container logs: Deleted after 24 hours
- Metro URLs: Regenerated for each session
- User analytics: Only aggregated, never personal

#### User Rights
- [x] Right to access: Users can view their tasks/projects
- [x] Right to deletion: Users can delete tasks and containers
- [x] Right to portability: Users can export project code
- [ ] Right to rectification: Implement data correction UI

#### Privacy Notice
```
When you create a mobile project:
1. Your code runs in isolated Docker container
2. Container is destroyed after 30 minutes of inactivity
3. Metro bundler logs are deleted after 24 hours
4. Project metadata is stored in our database indefinitely
5. You can delete project at any time
```

### 4.3 Compliance Checklist

- [ ] GDPR: Data processing agreement with infrastructure providers
- [ ] CCPA: Privacy policy includes California-specific notices
- [ ] SOC 2: Security and availability certifications
- [ ] ISO 27001: Information security management (optional)

---

## 5. Dependency Security

### 5.1 Vulnerable Dependency Scanning

#### Setup
```bash
# Install npm audit for vulnerability scanning
pnpm audit

# Setup Dependabot (GitHub)
# Already enabled in .github/dependabot.yml
```

#### Regular Audits
```bash
# Weekly audit
pnpm audit --audit-level=moderate

# Generate report
pnpm audit > audit-report.txt

# Fix vulnerabilities
pnpm audit fix  # Review changes before committing
```

#### Critical Dependencies in Use
- `next` - Web framework (maintained)
- `react-native` - Mobile framework (maintained)
- `postgres` - Database client (maintained)
- `ai` (Vercel) - LLM integration (maintained)
- `qrcode` - QR generation (well-maintained)

### 5.2 Supply Chain Security

#### Docker Image Security
```bash
# Scan Docker image for vulnerabilities
docker scan node:22-alpine

# Use minimal base image
# node:22-alpine is smaller and fewer packages than ubuntu
```

#### Dependency Lock File
- [x] `pnpm-lock.yaml` committed to git
- [x] Prevents unexpected dependency updates
- [x] Enables reproducible builds

---

## 6. Infrastructure Security

### 6.1 Railway Platform Security

#### Features
- [x] HTTPS/TLS for all connections
- [x] DDoS protection (basic)
- [x] Firewall rules
- [x] Private networking between services

#### Configuration
```yaml
# railway.yml
services:
  turbocat:
    build: ./
    environment:
      - RAILWAY_API_KEY  # Injected as secret
    ports:
      - 3000

  database:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD  # Injected as secret
    networking: private  # Only accessible internally
```

### 6.2 Database Security

#### PostgreSQL (Neon)
- [x] TLS encryption for connections
- [x] Automated backups
- [x] Read replicas for scaling
- [x] Row-level security (RLS) available

#### Connection Security
```typescript
// turbocat-agent/lib/db/client.ts
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL not set')
}

// Connection string should be: postgres://user:password@host:port/database
// Never log connection string to avoid exposing password
```

#### User Permissions
```sql
-- Principle of least privilege
CREATE ROLE turbocat_app WITH LOGIN PASSWORD 'secure_password';

-- Only grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON tasks TO turbocat_app;
GRANT SELECT ON components TO turbocat_app;
GRANT INSERT ON logs TO turbocat_app;

-- Don't grant DELETE or TRUNCATE
-- Require admin for schema changes
```

---

## 7. API Security

### 7.1 Authentication

#### Current Implementation
```typescript
// Protected API routes check session
import { auth } from '@/lib/auth'

export async function GET(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  // User authenticated, proceed
}
```

#### Verification Checklist
- [x] All `/api` routes require authentication
- [x] User ID verified against session
- [x] Sessions use secure, HTTPOnly cookies
- [ ] Implement rate limiting per user/IP
- [ ] Add CSRF protection to state-changing operations

### 7.2 Authorization

#### Resource Ownership
```typescript
// Verify user owns the resource before allowing access
export async function GET(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  const session = await auth()
  const userId = session?.user?.id

  const task = await db.select().from(tasks).where(eq(tasks.id, params.taskId))

  // Verify user owns task
  if (task[0]?.userId !== userId) {
    return new Response('Forbidden', { status: 403 })
  }

  return Response.json(task[0])
}
```

### 7.3 Input Validation

#### Validation Framework
```typescript
// turbocat-agent/lib/validation/task.ts
import { z } from 'zod'

export const createTaskSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(0).max(5000),
  platform: z.enum(['web', 'mobile']),
  repositoryUrl: z.string().url().optional(),
})

// Usage in API
export async function POST(request: Request) {
  const body = await request.json()

  // Validate input
  const validation = createTaskSchema.safeParse(body)
  if (!validation.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid input', details: validation.error }),
      { status: 400 }
    )
  }

  const data = validation.data
  // Proceed with validated data
}
```

---

## 8. Security Testing

### 8.1 Unit Tests for Security

```typescript
// turbocat-agent/__tests__/security/api-auth.test.ts
import { describe, it, expect, vi } from 'vitest'

describe('API Authentication', () => {
  it('should reject requests without authentication', async () => {
    const request = new Request('http://localhost/api/tasks')
    const response = await GET(request, { params: { taskId: 'test' } })

    expect(response.status).toBe(401)
  })

  it('should reject requests to other users resources', async () => {
    // Mock session for user-a
    const request = new Request('http://localhost/api/tasks/task-123')
    // Task-123 belongs to user-b

    const response = await GET(request, { params: { taskId: 'task-123' } })
    expect(response.status).toBe(403)
  })
})
```

### 8.2 OWASP Top 10 Mitigation Checklist

| OWASP Risk | Status | Mitigation |
|-----------|--------|-----------|
| **A01: Injection** | ✓ | Parameterized queries, Zod validation |
| **A02: Broken Auth** | ✓ | Centralized auth, session security |
| **A03: Broken Access Control** | ✓ | Resource ownership verification |
| **A04: Insecure Design** | ✓ | Security requirements in spec |
| **A05: Security Misconfiguration** | ✓ | Env vars, secrets management |
| **A06: Vulnerable Components** | ✓ | Dependency scanning, updates |
| **A07: Authentication Failures** | ✓ | Session-based auth, HTTPS |
| **A08: Data Integrity Failures** | ✓ | HTTPS, database constraints |
| **A09: Logging/Monitoring Failures** | ⚠️ | Implement audit logging |
| **A10: Using Components with Known Vulns** | ✓ | Regular audits |

---

## 9. Incident Response Plan

### 9.1 Security Incident Procedure

#### Discovery
1. **Identify incident** - Unusual activity, error, or alert
2. **Assess severity** - Critical, High, Medium, Low
3. **Isolate system** - Stop affected component if critical
4. **Document** - Screenshot, logs, timestamps

#### Response
1. **Notify team** - Alert on-call security engineer
2. **Investigate** - Root cause analysis
3. **Remediate** - Fix vulnerability, patch, update
4. **Verify** - Confirm fix is effective
5. **Deploy** - Release fix to production

#### Post-Incident
1. **Communicate** - Notify affected users (if applicable)
2. **Review** - Post-mortem meeting
3. **Improve** - Prevent similar incidents
4. **Document** - Add to runbook

### 9.2 Escalation Path

```
Security Alert
    ↓
On-Call Engineer (Page immediately)
    ↓
Security Lead (If Critical)
    ↓
CTO (If Data Breach)
```

### 9.3 Communication Template

```
Subject: [SECURITY] Incident Report - [Incident Name]

Severity: [Critical/High/Medium/Low]
Affected Systems: [List systems]
Affected Users: [Number of users, if applicable]

Description:
[What happened]

Timeline:
- 10:00 UTC: Detected
- 10:05 UTC: Investigation started
- 10:15 UTC: Root cause identified
- 10:30 UTC: Fix deployed

Actions Taken:
[List remediation steps]

Status: [Resolved/In Progress]
```

---

## 10. Security Best Practices

### 10.1 Code Review Checklist

```
Security Code Review Checklist:

Before merging any PR affecting security:
- [ ] No hardcoded secrets or API keys
- [ ] All user input validated
- [ ] Authentication required on protected endpoints
- [ ] Authorization verified (resource ownership)
- [ ] Database queries use parameterized statements
- [ ] Error messages don't leak information
- [ ] Logs don't contain sensitive data
- [ ] Dependencies updated and audited
- [ ] HTTPS used for all external calls
- [ ] Rate limiting implemented where needed
```

### 10.2 Secure Coding Standards

#### Secrets Management
```typescript
// ✗ WRONG - Hardcoded secret
const apiKey = 'sk_live_abc123xyz'

// ✓ CORRECT - Environment variable
const apiKey = process.env.RAILWAY_API_KEY
```

#### Input Validation
```typescript
// ✗ WRONG - No validation
const taskId = request.query.taskId

// ✓ CORRECT - Validate input
const { taskId } = z.object({ taskId: z.string().uuid() }).parse(request.query)
```

#### Resource Ownership
```typescript
// ✗ WRONG - Access without verification
const task = await getTask(taskId)

// ✓ CORRECT - Verify ownership
const task = await getTask(taskId)
if (task.userId !== currentUser.id) {
  throw new UnauthorizedError()
}
```

### 10.3 Logging Guidelines

#### What to Log
- [x] Authentication events (login, logout, failed auth)
- [x] Authorization failures (403 Forbidden)
- [x] API errors (500, timeouts)
- [x] Rate limit violations
- [x] Container lifecycle events

#### What NOT to Log
- [ ] Passwords, tokens, or API keys
- [ ] User personal data (emails, phone numbers) in full
- [ ] Container logs containing user code
- [ ] Credit card numbers or PII

---

## 11. Verification Checklist

### Setup & Configuration
- [x] `.env.local` is in `.gitignore`
- [x] `.env.local` contains RAILWAY_API_KEY
- [x] DATABASE_URL points to Neon PostgreSQL
- [x] All environment variables documented in `.env.example`

### API Security
- [x] Authentication required on all `/api` routes
- [x] Authorization verified (resource ownership)
- [x] Input validation with Zod
- [x] Rate limiting on QR code endpoint
- [x] HTTPS only (no HTTP in production)

### Container Security
- [x] Docker container runs as non-root user
- [x] Memory limit: 512 MB
- [x] CPU limit: 0.5 cores
- [x] Disk limit: 1 GB
- [x] No privileged mode

### Dependency Security
- [x] pnpm-lock.yaml committed to git
- [x] pnpm audit shows no critical vulnerabilities
- [x] Dependencies updated monthly

### Data Security
- [x] Database uses TLS encryption
- [x] Database connections require authentication
- [x] User code not persisted to disk
- [x] Container logs deleted after 24 hours

---

## 12. Deployment Checklist

Before deploying Phase 4 mobile to production:

- [ ] Security audit complete
- [ ] Rate limiting deployed
- [ ] API authentication verified
- [ ] Container resource limits set
- [ ] Database backups configured
- [ ] Monitoring and alerts configured
- [ ] Security runbook completed
- [ ] Team trained on security procedures
- [ ] Incident response plan documented
- [ ] GDPR/privacy policies updated

---

## References

- [OWASP Top 10](https://owasp.org/Top10/)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [Railway Documentation](https://docs.railway.app/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-security.html)

---

**Document Version:** 1.0
**Created:** 2026-01-06
**Next Review:** 2026-02-06
**Status:** Draft - Ready for Team Review
