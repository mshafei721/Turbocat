# Security Specifications

**Version:** 1.0
**Date:** January 5, 2026
**Security Level:** High

---

## Overview

This document defines comprehensive security measures for the Turbocat platform, covering authentication, authorization, data protection, and security best practices.

### Security Principles
1. **Defense in Depth**: Multiple layers of security
2. **Least Privilege**: Minimum required permissions
3. **Secure by Default**: Secure configurations out of the box
4. **Data Protection**: Encryption at rest and in transit
5. **Audit Trail**: Comprehensive logging of security events
6. **Regular Updates**: Keep dependencies up to date

---

## Authentication

### Password Requirements

**Minimum Criteria:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*)
- Cannot be a common password (check against common password list)
- Cannot match email or username

**Password Storage:**
```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

---

### JWT Token Management

**Access Token:**
- **Lifetime**: 15 minutes
- **Algorithm**: HS256 (HMAC-SHA256)
- **Claims**:
  ```json
  {
    "sub": "user-uuid",
    "email": "user@example.com",
    "role": "user",
    "iat": 1641398400,
    "exp": 1641399300,
    "type": "access"
  }
  ```

**Refresh Token:**
- **Lifetime**: 7 days
- **Algorithm**: HS256
- **Claims**:
  ```json
  {
    "sub": "user-uuid",
    "iat": 1641398400,
    "exp": 1642003200,
    "type": "refresh"
  }
  ```

**Token Generation:**
```typescript
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET!;

function generateAccessToken(user: User): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );
}

function generateRefreshToken(user: User): string {
  return jwt.sign(
    {
      sub: user.id,
      type: 'refresh',
    },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
}
```

**Token Verification:**
```typescript
function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(401, 'TOKEN_EXPIRED', 'Token has expired');
    }
    throw new ApiError(401, 'INVALID_TOKEN', 'Invalid token');
  }
}
```

---

### Session Management

**Session Storage:**
- Sessions stored in Redis for fast access
- Session data includes: user ID, role, IP address, user agent
- Sessions invalidated on logout
- Sessions expire after 7 days of inactivity

**Session Security:**
```typescript
interface Session {
  userId: string;
  role: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  expiresAt: Date;
}

async function createSession(user: User, req: Request): Promise<string> {
  const sessionId = generateSecureToken();
  const session: Session = {
    userId: user.id,
    role: user.role,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'] || '',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  };

  await redis.setex(
    `session:${sessionId}`,
    7 * 24 * 60 * 60,
    JSON.stringify(session)
  );

  return sessionId;
}
```

---

## Authorization

### Role-Based Access Control (RBAC)

**Roles:**
1. **Admin**: Full system access
2. **User**: Standard user access
3. **Agent**: Limited API access for automated systems

**Permission Matrix:**

| Resource | Admin | User | Agent |
|----------|-------|------|-------|
| **Users** |
| Read own profile | ✓ | ✓ | ✓ |
| Update own profile | ✓ | ✓ | ✗ |
| Read all users | ✓ | ✗ | ✗ |
| Update any user | ✓ | ✗ | ✗ |
| Delete user | ✓ | ✗ | ✗ |
| **Agents** |
| Create agent | ✓ | ✓ | ✗ |
| Read own agents | ✓ | ✓ | ✓ |
| Update own agents | ✓ | ✓ | ✗ |
| Delete own agents | ✓ | ✓ | ✗ |
| Read all agents | ✓ | ✗ | ✗ |
| **Workflows** |
| Create workflow | ✓ | ✓ | ✗ |
| Execute own workflow | ✓ | ✓ | ✓ |
| Read own workflows | ✓ | ✓ | ✓ |
| Update own workflows | ✓ | ✓ | ✗ |
| Delete own workflows | ✓ | ✓ | ✗ |
| **Deployments** |
| Create deployment | ✓ | ✓ | ✗ |
| Manage own deployments | ✓ | ✓ | ✗ |
| View system health | ✓ | ✗ | ✗ |

**Authorization Middleware:**
```typescript
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!token) {
    throw new ApiError(401, 'AUTHENTICATION_REQUIRED', 'Authentication required');
  }

  const payload = verifyAccessToken(token);
  req.user = payload;
  next();
}

function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, 'AUTHENTICATION_REQUIRED', 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'FORBIDDEN', 'Insufficient permissions');
    }

    next();
  };
}

function requireOwnership(resourceGetter: (req: Request) => Promise<Resource>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const resource = await resourceGetter(req);

    if (resource.userId !== req.user.sub && req.user.role !== 'admin') {
      throw new ApiError(403, 'FORBIDDEN', 'You do not own this resource');
    }

    next();
  };
}
```

**Usage Example:**
```typescript
// Admin only
router.get('/admin/users', requireAuth, requireRole('admin'), getAllUsers);

// Owner or admin
router.patch('/agents/:id',
  requireAuth,
  requireOwnership(getAgent),
  updateAgent
);

// Authenticated users
router.get('/users/me', requireAuth, getCurrentUser);
```

---

### API Key Authentication

**API Key Format:**
- Prefix: `tk_` (test) or `pk_` (production)
- Environment: `dev_`, `prod_`, etc.
- Random string: 32 characters
- Example: `pk_prod_abc123def456ghi789jkl012mno345`

**API Key Generation:**
```typescript
import crypto from 'crypto';

function generateApiKey(environment: 'dev' | 'prod'): {key: string; hash: string} {
  const prefix = environment === 'prod' ? 'pk_prod_' : 'tk_dev_';
  const randomString = crypto.randomBytes(24).toString('hex');
  const key = `${prefix}${randomString}`;
  const hash = crypto.createHash('sha256').update(key).digest('hex');

  return { key, hash };
}
```

**API Key Middleware:**
```typescript
async function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    throw new ApiError(401, 'API_KEY_REQUIRED', 'API key required');
  }

  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  const apiKeyRecord = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: { user: true },
  });

  if (!apiKeyRecord || !apiKeyRecord.isActive) {
    throw new ApiError(401, 'INVALID_API_KEY', 'Invalid or inactive API key');
  }

  if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
    throw new ApiError(401, 'API_KEY_EXPIRED', 'API key has expired');
  }

  // Rate limiting check
  const rateLimitKey = `ratelimit:apikey:${apiKeyRecord.id}`;
  const currentCount = await redis.incr(rateLimitKey);

  if (currentCount === 1) {
    await redis.expire(rateLimitKey, 60);
  }

  if (currentCount > apiKeyRecord.rateLimitPerMinute) {
    throw new ApiError(429, 'RATE_LIMIT_EXCEEDED', 'Rate limit exceeded');
  }

  // Update usage stats
  await prisma.apiKey.update({
    where: { id: apiKeyRecord.id },
    data: {
      lastUsedAt: new Date(),
      usageCount: { increment: 1 },
    },
  });

  req.user = {
    sub: apiKeyRecord.userId,
    role: apiKeyRecord.user.role,
    apiKeyId: apiKeyRecord.id,
  };

  next();
}
```

---

## Data Protection

### Encryption at Rest

**Database Encryption:**
- PostgreSQL encryption enabled on Supabase
- Sensitive fields encrypted with AES-256
- Encryption keys stored in environment variables

**Sensitive Data Fields:**
```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

**Fields to Encrypt:**
- API keys
- OAuth tokens
- Deployment environment variables
- Sensitive agent configurations

---

### Encryption in Transit

**HTTPS Only:**
- All traffic over HTTPS/TLS 1.3
- HTTP requests redirected to HTTPS
- HSTS header enabled

**Express Configuration:**
```typescript
import helmet from 'helmet';
import express from 'express';

const app = express();

// Security headers
app.use(helmet({
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

---

## Input Validation & Sanitization

### Request Validation with Zod

```typescript
import { z } from 'zod';

// User registration schema
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[!@#$%^&*]/, 'Password must contain special character'),
  fullName: z.string().max(255).optional(),
});

// Agent creation schema
const createAgentSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(['code', 'api', 'llm', 'data', 'workflow']),
  config: z.object({}).passthrough(),
  capabilities: z.array(z.string()).optional(),
  parameters: z.object({}).passthrough().optional(),
  maxExecutionTime: z.number().int().min(1).max(3600).optional(),
  maxMemoryMb: z.number().int().min(64).max(4096).optional(),
  tags: z.array(z.string()).optional(),
});

// Validation middleware
function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid request data', {
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}

// Usage
router.post('/auth/register', validate(registerSchema), register);
router.post('/agents', requireAuth, validate(createAgentSchema), createAgent);
```

---

### SQL Injection Prevention

**Prisma ORM** automatically prevents SQL injection through parameterized queries:

```typescript
// Safe - Prisma parameterizes automatically
const agents = await prisma.agent.findMany({
  where: {
    name: {
      contains: userInput, // Safe even with malicious input
    },
  },
});

// NEVER do raw queries with user input
// ❌ UNSAFE:
// await prisma.$queryRaw`SELECT * FROM agents WHERE name = ${userInput}`;

// ✅ SAFE (if raw query needed):
await prisma.$queryRaw`SELECT * FROM agents WHERE name = ${Prisma.sql`${userInput}`}`;
```

---

### XSS Prevention

**Input Sanitization:**
```typescript
import DOMPurify from 'isomorphic-dompurify';

function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
  });
}

// Sanitize user-provided HTML
router.patch('/agents/:id', requireAuth, async (req, res) => {
  if (req.body.description) {
    req.body.description = sanitizeHtml(req.body.description);
  }
  // ... update agent
});
```

**Response Headers:**
```typescript
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"], // No inline scripts
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
}));
```

---

## Rate Limiting

### Implementation with express-rate-limit

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from './redis';

// General API rate limit
const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:api:',
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // 1000 requests per hour
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:auth:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts, please try again later.',
    },
  },
});

// Apply rate limiters
app.use('/api/v1', apiLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
```

---

## CORS Configuration

```typescript
import cors from 'cors';

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000', // Development
      'http://localhost:3001', // Development
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));
```

---

## Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.API_URL],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },

  // X-Frame-Options
  frameguard: {
    action: 'deny',
  },

  // X-Content-Type-Options
  noSniff: true,

  // X-XSS-Protection
  xssFilter: true,

  // Referrer-Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // Permissions-Policy
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },
}));
```

---

## Audit Logging

### Security Event Logging

```typescript
enum AuditAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  PASSWORD_RESET_COMPLETED = 'password_reset_completed',
  API_KEY_CREATED = 'api_key_created',
  API_KEY_REVOKED = 'api_key_revoked',
  PERMISSION_DENIED = 'permission_denied',
  AGENT_CREATED = 'agent_created',
  AGENT_UPDATED = 'agent_updated',
  AGENT_DELETED = 'agent_deleted',
  WORKFLOW_EXECUTED = 'workflow_executed',
}

async function logAuditEvent(
  action: AuditAction,
  resourceType: string,
  resourceId: string | null,
  userId: string | null,
  req: Request,
  changes?: any
) {
  await prisma.auditLog.create({
    data: {
      action,
      resourceType,
      resourceId,
      userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] || null,
      changes: changes || {},
      metadata: {
        method: req.method,
        url: req.url,
      },
    },
  });
}

// Usage
router.post('/auth/login', async (req, res) => {
  try {
    const user = await authenticateUser(req.body.email, req.body.password);

    await logAuditEvent(
      AuditAction.LOGIN,
      'user',
      user.id,
      user.id,
      req
    );

    // ... return tokens
  } catch (error) {
    await logAuditEvent(
      AuditAction.LOGIN_FAILED,
      'user',
      null,
      null,
      req,
      { email: req.body.email }
    );

    throw error;
  }
});
```

---

## Secrets Management

### Environment Variables

```bash
# .env.example

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/turbocat

# JWT Secrets (generate with: openssl rand -hex 64)
JWT_ACCESS_SECRET=your-access-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Encryption Key (generate with: openssl rand -hex 32)
ENCRYPTION_KEY=your-encryption-key-here

# API Keys
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Redis
REDIS_URL=redis://localhost:6379

# Frontend
FRONTEND_URL=http://localhost:3000

# Email (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Never commit:**
- `.env` files
- Private keys
- API secrets
- Database credentials

**Use `.env.example`** with placeholder values for documentation.

---

## Dependency Security

### Regular Updates

```bash
# Check for vulnerabilities
npm audit

# Fix automatically where possible
npm audit fix

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

### Automated Security Scanning

**GitHub Dependabot Configuration** (`.github/dependabot.yml`):
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/backend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "security-team"
    labels:
      - "dependencies"
      - "security"
```

---

## Incident Response

### Security Incident Procedure

1. **Detection**: Monitor logs for suspicious activity
2. **Containment**: Immediately revoke compromised credentials
3. **Investigation**: Analyze audit logs and access patterns
4. **Remediation**: Patch vulnerabilities, update systems
5. **Recovery**: Restore normal operations
6. **Post-Mortem**: Document incident and improvements

### Monitoring Alerts

```typescript
// Alert on suspicious activity
async function detectSuspiciousActivity(userId: string) {
  // Multiple failed login attempts
  const failedLogins = await prisma.auditLog.count({
    where: {
      userId,
      action: 'login_failed',
      createdAt: {
        gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
      },
    },
  });

  if (failedLogins >= 5) {
    await alertSecurityTeam({
      type: 'BRUTE_FORCE_ATTEMPT',
      userId,
      count: failedLogins,
    });

    // Temporarily lock account
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }

  // Unusual access patterns
  const recentLogins = await prisma.auditLog.findMany({
    where: {
      userId,
      action: 'login',
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
    select: { ipAddress: true },
  });

  const uniqueIPs = new Set(recentLogins.map(log => log.ipAddress));

  if (uniqueIPs.size > 5) {
    await alertSecurityTeam({
      type: 'UNUSUAL_ACCESS_PATTERN',
      userId,
      ipCount: uniqueIPs.size,
    });
  }
}
```

---

## Security Checklist

### Development
- [ ] Use HTTPS in all environments
- [ ] Validate all user inputs with Zod
- [ ] Sanitize HTML content
- [ ] Use parameterized queries (Prisma)
- [ ] Implement rate limiting
- [ ] Enable CORS with specific origins
- [ ] Add security headers (Helmet)
- [ ] Hash passwords with bcrypt
- [ ] Store secrets in environment variables
- [ ] Never log sensitive data

### Deployment
- [ ] Use strong JWT secrets
- [ ] Enable database encryption
- [ ] Configure firewall rules
- [ ] Setup monitoring and alerting
- [ ] Enable automated backups
- [ ] Implement audit logging
- [ ] Use separate keys for dev/prod
- [ ] Enable two-factor authentication (future)
- [ ] Regular security audits
- [ ] Penetration testing

### Maintenance
- [ ] Regular dependency updates
- [ ] Monitor security advisories
- [ ] Review audit logs weekly
- [ ] Rotate API keys quarterly
- [ ] Update SSL certificates
- [ ] Review access controls monthly
- [ ] Test backup restoration
- [ ] Security training for team

---

## Compliance

### GDPR Considerations
- **Right to Access**: Users can export their data
- **Right to Erasure**: Users can request account deletion
- **Data Minimization**: Only collect necessary data
- **Consent**: Clear consent for data processing
- **Data Portability**: Export in machine-readable format

### Data Retention
- Active user data: Retained while account is active
- Deleted accounts: Hard deleted after 90 days
- Audit logs: Retained for 1 year
- Execution logs: Retained for 30 days (configurable)
- Backups: Retained for 30 days

---

**End of Security Specifications**
