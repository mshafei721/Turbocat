# Quick Reference Guide - Turbocat Phase 5

**For developers who need quick answers without reading full specs**

---

## Project Overview

**What we're building:** Backend infrastructure for Turbocat multi-agent orchestration platform

**Timeline:** 4-6 weeks

**Tech Stack:** Node.js + TypeScript + Express + PostgreSQL + Prisma + Supabase + BullMQ

---

## Quick Links

| Need to... | Read this... | File |
|-----------|-------------|------|
| Understand overall project | Executive Summary | [spec.md](./spec.md#executive-summary) |
| See system architecture | Architecture diagram | [spec.md](./spec.md#system-architecture) |
| Understand data models | Database tables | [database-schema.md](./database-schema.md#table-definitions) |
| Implement an API endpoint | API examples | [api-specs.md](./api-specs.md) |
| Add authentication | Auth implementation | [security-specs.md](./security-specs.md#authentication) |
| Implement agent execution | Agent executor | [agent-core-specs.md](./agent-core-specs.md#workflow-execution) |
| Write tests | Test examples | [testing-specs.md](./testing-specs.md) |

---

## Database Quick Reference

### Core Tables (10 total)

```
users → agents → workflow_steps
  ↓      ↓            ↓
workflows → executions → execution_logs
  ↓
templates
deployments
api_keys
audit_logs
```

**Most Important Tables:**
1. `users` - User accounts
2. `agents` - AI agent definitions
3. `workflows` - Workflow definitions
4. `workflow_steps` - Steps in workflows
5. `executions` - Workflow runs
6. `execution_logs` - Execution details

---

## API Quick Reference

### Base URL
```
http://localhost:3001/api/v1
```

### Authentication
```bash
# All authenticated requests need header:
Authorization: Bearer <JWT_TOKEN>
```

### Common Endpoints

**Auth:**
```bash
POST /auth/register    # Register
POST /auth/login       # Login
POST /auth/logout      # Logout
```

**Agents:**
```bash
GET    /agents         # List agents
POST   /agents         # Create agent
GET    /agents/:id     # Get agent
PATCH  /agents/:id     # Update agent
DELETE /agents/:id     # Delete agent
```

**Workflows:**
```bash
GET    /workflows              # List workflows
POST   /workflows              # Create workflow
GET    /workflows/:id          # Get workflow
POST   /workflows/:id/execute  # Execute workflow
GET    /workflows/:id/executions # Execution history
```

---

## Common Code Snippets

### Database Query (Prisma)
```typescript
// Get all agents for user
const agents = await prisma.agent.findMany({
  where: {
    userId: userId,
    deletedAt: null,
  },
  orderBy: {
    createdAt: 'desc',
  },
  take: 20,
});
```

### API Route with Auth
```typescript
router.post('/agents',
  requireAuth,
  validate(createAgentSchema),
  async (req, res) => {
    const agent = await agentService.create({
      ...req.body,
      userId: req.user.sub,
    });

    res.status(201).json({
      success: true,
      data: agent,
    });
  }
);
```

### Error Handling
```typescript
try {
  const agent = await prisma.agent.findUniqueOrThrow({
    where: { id: agentId },
  });
  res.json({ success: true, data: agent });
} catch (error) {
  if (error.code === 'P2025') {
    throw new ApiError(404, 'NOT_FOUND', 'Agent not found');
  }
  throw error;
}
```

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/turbocat

# JWT
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-secret-here

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_KEY=your-key

# Redis
REDIS_URL=redis://localhost:6379

# Frontend
FRONTEND_URL=http://localhost:3000
```

---

## Testing Cheatsheet

### Run Tests
```bash
npm test                  # All tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests
npm run test:e2e          # E2E tests
npm run test:coverage     # With coverage report
npm run test:watch        # Watch mode
```

### Write a Unit Test
```typescript
describe('AgentService', () => {
  it('should create agent', async () => {
    const input = {
      name: 'Test',
      type: 'code',
      userId: 'user-123',
    };

    prismaMock.agent.create.mockResolvedValue({
      id: 'agent-123',
      ...input,
    });

    const result = await service.createAgent(input);

    expect(result.id).toBe('agent-123');
    expect(prismaMock.agent.create).toHaveBeenCalled();
  });
});
```

### Write an Integration Test
```typescript
describe('POST /agents', () => {
  it('should create agent', async () => {
    const response = await request(app)
      .post('/api/v1/agents')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Agent',
        type: 'code',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
  });
});
```

---

## Common Issues & Solutions

### Issue: Database connection fails
**Solution:** Check DATABASE_URL in .env and ensure PostgreSQL is running

### Issue: JWT token invalid
**Solution:** Ensure JWT_ACCESS_SECRET is set and token hasn't expired

### Issue: Prisma client not found
**Solution:** Run `npx prisma generate` to generate client

### Issue: Migration fails
**Solution:** Check database connection and run `npx prisma migrate reset`

### Issue: Tests fail with database errors
**Solution:** Ensure TEST_DATABASE_URL is set and test database exists

---

## Development Workflow

1. **Start Development:**
   ```bash
   npm run dev        # Start backend dev server
   npm run db:studio  # Open Prisma Studio (DB GUI)
   npm run test:watch # Run tests in watch mode
   ```

2. **Make Changes:**
   - Update code
   - Write tests
   - Ensure tests pass
   - Check code coverage

3. **Database Changes:**
   ```bash
   # Edit schema.prisma
   npx prisma migrate dev --name description
   npx prisma generate
   ```

4. **Before Committing:**
   ```bash
   npm run lint       # Check code style
   npm run test       # Run all tests
   npm run build      # Ensure it builds
   ```

---

## Directory Structure

```
backend/
├── src/
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   ├── lib/            # Utilities and helpers
│   ├── types/          # TypeScript types
│   ├── __tests__/      # Tests
│   │   ├── unit/
│   │   └── integration/
│   └── server.ts       # Express app entry
├── prisma/
│   ├── schema.prisma   # Database schema
│   ├── migrations/     # Migration files
│   └── seed.ts         # Seed data
├── e2e/                # E2E tests
└── package.json
```

---

## Performance Targets

- API Response: < 200ms (95th percentile)
- Database Queries: < 50ms (simple)
- Agent Execution Setup: < 5s
- System Uptime: 99.5%
- Error Rate: < 0.1%

---

## Security Checklist

- [ ] All passwords hashed with bcrypt
- [ ] JWT tokens properly validated
- [ ] Input validation with Zod on all endpoints
- [ ] Rate limiting enabled
- [ ] CORS configured for frontend domain only
- [ ] Security headers set (Helmet)
- [ ] Sensitive data encrypted
- [ ] Environment variables not committed
- [ ] SQL injection prevented (Prisma)
- [ ] XSS prevention enabled

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Seed data loaded (if needed)
- [ ] Tests passing
- [ ] Build successful
- [ ] Health check endpoint working
- [ ] Monitoring setup
- [ ] Backup configured
- [ ] SSL/HTTPS enabled
- [ ] Firewall rules set

---

## Getting Help

1. Check full specs in this directory
2. Search existing issues
3. Ask in team chat
4. Create new issue with details

---

**Last Updated:** January 5, 2026
