# Testing Specifications

**Version:** 1.0
**Date:** January 5, 2026

---

## Overview

This document defines the comprehensive testing strategy for Turbocat Phase 5, covering unit tests, integration tests, end-to-end tests, and testing best practices.

### Testing Goals
1. **Quality Assurance**: Ensure code works as expected
2. **Regression Prevention**: Catch bugs before production
3. **Documentation**: Tests serve as living documentation
4. **Confidence**: Deploy with confidence
5. **Maintainability**: Tests make refactoring safer

### Coverage Targets
- **Overall**: 80% code coverage
- **Services**: 90% coverage
- **API Routes**: 100% coverage
- **Utilities**: 95% coverage
- **Critical Paths**: 100% coverage

---

## Testing Pyramid

```
         ┌─────────┐
         │   E2E   │ 10% - Full user journeys
         │  Tests  │ (Slow, expensive, fragile)
         └─────────┘
        ┌───────────┐
        │Integration│ 30% - API endpoints, DB operations
        │   Tests   │ (Medium speed, moderate cost)
        └───────────┘
       ┌─────────────┐
       │ Unit Tests  │ 60% - Functions, classes, modules
       │             │ (Fast, cheap, reliable)
       └─────────────┘
```

---

## Unit Testing

### Setup

**Framework**: Jest
**Location**: `backend/src/**/__tests__/*.test.ts`

**Configuration** (`jest.config.js`):
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/server.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};
```

---

### Service Layer Tests

**Example: AgentService**

```typescript
// src/services/__tests__/agent.service.test.ts
import { AgentService } from '../agent.service';
import { prismaMock } from '../../__tests__/mocks/prisma';

describe('AgentService', () => {
  let service: AgentService;

  beforeEach(() => {
    service = new AgentService(prismaMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAgent', () => {
    it('should create a new agent', async () => {
      const input = {
        name: 'Test Agent',
        description: 'Test description',
        type: 'code' as const,
        config: {},
        userId: 'user-123',
      };

      const mockAgent = {
        id: 'agent-123',
        ...input,
        status: 'draft',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.agent.create.mockResolvedValue(mockAgent);

      const result = await service.createAgent(input);

      expect(result).toEqual(mockAgent);
      expect(prismaMock.agent.create).toHaveBeenCalledWith({
        data: input,
      });
    });

    it('should throw error if name is empty', async () => {
      const input = {
        name: '',
        type: 'code' as const,
        config: {},
        userId: 'user-123',
      };

      await expect(service.createAgent(input)).rejects.toThrow(
        'Agent name cannot be empty'
      );
    });
  });

  describe('updateAgent', () => {
    it('should update agent successfully', async () => {
      const agentId = 'agent-123';
      const updates = {
        name: 'Updated Agent',
        description: 'Updated description',
      };

      const mockUpdatedAgent = {
        id: agentId,
        ...updates,
        type: 'code',
        status: 'active',
        userId: 'user-123',
        config: {},
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.agent.update.mockResolvedValue(mockUpdatedAgent);

      const result = await service.updateAgent(agentId, updates);

      expect(result).toEqual(mockUpdatedAgent);
      expect(prismaMock.agent.update).toHaveBeenCalledWith({
        where: { id: agentId },
        data: updates,
      });
    });

    it('should throw error if agent not found', async () => {
      prismaMock.agent.update.mockRejectedValue(
        new Error('Record not found')
      );

      await expect(
        service.updateAgent('nonexistent', { name: 'Test' })
      ).rejects.toThrow();
    });
  });

  describe('deleteAgent', () => {
    it('should soft delete agent', async () => {
      const agentId = 'agent-123';

      prismaMock.agent.update.mockResolvedValue({
        id: agentId,
        deletedAt: new Date(),
      } as any);

      await service.deleteAgent(agentId);

      expect(prismaMock.agent.update).toHaveBeenCalledWith({
        where: { id: agentId },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });

  describe('listAgents', () => {
    it('should return paginated agents', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'Agent 1',
          type: 'code',
          status: 'active',
          userId: 'user-123',
        },
        {
          id: 'agent-2',
          name: 'Agent 2',
          type: 'api',
          status: 'active',
          userId: 'user-123',
        },
      ];

      prismaMock.agent.findMany.mockResolvedValue(mockAgents as any);
      prismaMock.agent.count.mockResolvedValue(2);

      const result = await service.listAgents({
        userId: 'user-123',
        page: 1,
        pageSize: 20,
      });

      expect(result.data).toEqual(mockAgents);
      expect(result.pagination).toEqual({
        page: 1,
        pageSize: 20,
        totalPages: 1,
        totalItems: 2,
        hasNext: false,
        hasPrev: false,
      });
    });

    it('should filter agents by type', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'Agent 1',
          type: 'code',
          status: 'active',
          userId: 'user-123',
        },
      ];

      prismaMock.agent.findMany.mockResolvedValue(mockAgents as any);
      prismaMock.agent.count.mockResolvedValue(1);

      await service.listAgents({
        userId: 'user-123',
        type: 'code',
      });

      expect(prismaMock.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'code',
          }),
        })
      );
    });
  });
});
```

---

### Utility Function Tests

**Example: Input Validation**

```typescript
// src/utils/__tests__/validation.test.ts
import { validateEmail, validatePassword } from '../validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.co.uk',
        'user+tag@example.com',
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid emails', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user @example.com',
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('validatePassword', () => {
    it('should accept strong passwords', () => {
      const validPasswords = [
        'SecurePass123!',
        'MyP@ssw0rd',
        'Str0ng!Pass',
      ];

      validPasswords.forEach(password => {
        expect(validatePassword(password).valid).toBe(true);
      });
    });

    it('should reject weak passwords', () => {
      const testCases = [
        {
          password: 'short',
          error: 'Password must be at least 8 characters',
        },
        {
          password: 'nouppercase1!',
          error: 'Password must contain uppercase letter',
        },
        {
          password: 'NOLOWERCASE1!',
          error: 'Password must contain lowercase letter',
        },
        {
          password: 'NoNumber!',
          error: 'Password must contain number',
        },
        {
          password: 'NoSpecial123',
          error: 'Password must contain special character',
        },
      ];

      testCases.forEach(({ password, error }) => {
        const result = validatePassword(password);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(error);
      });
    });
  });
});
```

---

## Integration Testing

### Setup

**Framework**: Jest + Supertest
**Location**: `backend/src/__tests__/integration/*.test.ts`

**Test Database Setup**:
```typescript
// src/__tests__/setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL,
    },
  },
});

beforeAll(async () => {
  // Run migrations
  await prisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS test`;
  // Apply migrations (using Prisma migrate)
});

afterAll(async () => {
  // Clean up
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean database before each test
  await prisma.auditLog.deleteMany();
  await prisma.executionLog.deleteMany();
  await prisma.execution.deleteMany();
  await prisma.workflowStep.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.user.deleteMany();
});
```

---

### API Endpoint Tests

**Example: Agent API**

```typescript
// src/__tests__/integration/agent.api.test.ts
import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';
import { generateTestToken } from '../helpers/auth';

describe('Agent API', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'USER',
      },
    });

    userId = user.id;
    authToken = generateTestToken(user);
  });

  describe('POST /api/v1/agents', () => {
    it('should create a new agent', async () => {
      const agentData = {
        name: 'Test Agent',
        description: 'Test description',
        type: 'code',
        config: {
          runtime: 'python3.11',
        },
      };

      const response = await request(app)
        .post('/api/v1/agents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(agentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: agentData.name,
        description: agentData.description,
        type: agentData.type,
        status: 'draft',
        version: 1,
      });

      // Verify in database
      const agent = await prisma.agent.findUnique({
        where: { id: response.body.data.id },
      });

      expect(agent).toBeTruthy();
      expect(agent?.userId).toBe(userId);
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        name: '', // Empty name
        type: 'invalid-type',
      };

      const response = await request(app)
        .post('/api/v1/agents')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/v1/agents')
        .send({ name: 'Test' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });
  });

  describe('GET /api/v1/agents', () => {
    beforeEach(async () => {
      // Create test agents
      await prisma.agent.createMany({
        data: [
          {
            name: 'Agent 1',
            type: 'code',
            status: 'active',
            userId,
            config: {},
          },
          {
            name: 'Agent 2',
            type: 'api',
            status: 'active',
            userId,
            config: {},
          },
          {
            name: 'Agent 3',
            type: 'code',
            status: 'inactive',
            userId,
            config: {},
          },
        ],
      });
    });

    it('should list all user agents', async () => {
      const response = await request(app)
        .get('/api/v1/agents')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        pageSize: 20,
        totalItems: 3,
      });
    });

    it('should filter agents by type', async () => {
      const response = await request(app)
        .get('/api/v1/agents?type=code')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((a: any) => a.type === 'code')).toBe(true);
    });

    it('should filter agents by status', async () => {
      const response = await request(app)
        .get('/api/v1/agents?status=active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every((a: any) => a.status === 'active')).toBe(true);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/v1/agents?page=1&pageSize=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.hasNext).toBe(true);
    });
  });

  describe('GET /api/v1/agents/:id', () => {
    let agentId: string;

    beforeEach(async () => {
      const agent = await prisma.agent.create({
        data: {
          name: 'Test Agent',
          type: 'code',
          status: 'active',
          userId,
          config: {},
        },
      });
      agentId = agent.id;
    });

    it('should return agent details', async () => {
      const response = await request(app)
        .get(`/api/v1/agents/${agentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(agentId);
      expect(response.body.data.name).toBe('Test Agent');
    });

    it('should return 404 for nonexistent agent', async () => {
      const response = await request(app)
        .get('/api/v1/agents/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('should return 403 for other user agent', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          fullName: 'Other User',
          role: 'USER',
        },
      });

      const otherAgent = await prisma.agent.create({
        data: {
          name: 'Other Agent',
          type: 'code',
          status: 'active',
          userId: otherUser.id,
          config: {},
        },
      });

      const response = await request(app)
        .get(`/api/v1/agents/${otherAgent.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('PATCH /api/v1/agents/:id', () => {
    let agentId: string;

    beforeEach(async () => {
      const agent = await prisma.agent.create({
        data: {
          name: 'Test Agent',
          type: 'code',
          status: 'draft',
          userId,
          config: {},
        },
      });
      agentId = agent.id;
    });

    it('should update agent', async () => {
      const updates = {
        name: 'Updated Agent',
        status: 'active',
      };

      const response = await request(app)
        .patch(`/api/v1/agents/${agentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.data.name).toBe(updates.name);
      expect(response.body.data.status).toBe(updates.status);

      // Verify in database
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
      });

      expect(agent?.name).toBe(updates.name);
      expect(agent?.status).toBe(updates.status);
    });
  });

  describe('DELETE /api/v1/agents/:id', () => {
    let agentId: string;

    beforeEach(async () => {
      const agent = await prisma.agent.create({
        data: {
          name: 'Test Agent',
          type: 'code',
          status: 'active',
          userId,
          config: {},
        },
      });
      agentId = agent.id;
    });

    it('should soft delete agent', async () => {
      await request(app)
        .delete(`/api/v1/agents/${agentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Verify soft delete
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
      });

      expect(agent?.deletedAt).toBeTruthy();
    });
  });
});
```

---

## End-to-End Testing

### Setup

**Framework**: Playwright
**Location**: `backend/e2e/*.spec.ts`

**Configuration** (`playwright.config.ts`):
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run start:test',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

### E2E Test Examples

**Example: User Registration and Agent Creation Flow**

```typescript
// e2e/agent-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Agent Creation Flow', () => {
  test('should register, login, and create agent', async ({ page }) => {
    // Register
    await page.goto('/auth/register');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="fullName"]', 'Test User');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Navigate to agents page
    await page.click('text=Agents');
    await expect(page).toHaveURL('/agents');

    // Create new agent
    await page.click('text=Create Agent');
    await page.fill('[name="name"]', 'My First Agent');
    await page.fill('[name="description"]', 'Test agent description');
    await page.selectOption('[name="type"]', 'code');

    // Submit form
    await page.click('button:has-text("Create")');

    // Should show success message
    await expect(page.locator('text=Agent created successfully')).toBeVisible();

    // Should see agent in list
    await expect(page.locator('text=My First Agent')).toBeVisible();
  });
});

test.describe('Workflow Execution Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create and execute workflow', async ({ page }) => {
    // Create workflow
    await page.click('text=Workflows');
    await page.click('text=Create Workflow');

    await page.fill('[name="name"]', 'Test Workflow');
    await page.fill('[name="description"]', 'E2E test workflow');

    // Add steps (simplified - actual implementation may vary)
    await page.click('text=Add Step');
    await page.selectOption('[name="agentId"]', { index: 0 });
    await page.click('text=Save Workflow');

    // Execute workflow
    await page.click('text=Execute');

    // Wait for execution to complete
    await expect(page.locator('text=Execution completed')).toBeVisible({
      timeout: 30000,
    });

    // Verify results
    const status = await page.locator('[data-testid="execution-status"]').textContent();
    expect(status).toBe('completed');
  });
});
```

---

## Performance Testing

### Load Testing with Artillery

**Configuration** (`artillery.yml`):
```yaml
config:
  target: "http://localhost:3001"
  phases:
    - duration: 60
      arrivalRate: 10
      name: Warm up
    - duration: 120
      arrivalRate: 50
      name: Ramp up load
    - duration: 60
      arrivalRate: 100
      name: Sustained load

scenarios:
  - name: "Create and list agents"
    flow:
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "test@example.com"
            password: "SecurePass123!"
          capture:
            - json: "$.data.tokens.accessToken"
              as: "authToken"
      - post:
          url: "/api/v1/agents"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            name: "Load Test Agent"
            type: "code"
            config: {}
      - get:
          url: "/api/v1/agents"
          headers:
            Authorization: "Bearer {{ authToken }}"
```

**Run load test:**
```bash
npm install -g artillery
artillery run artillery.yml
```

---

## Test Helpers and Utilities

### Test Data Factories

```typescript
// src/__tests__/factories/user.factory.ts
import { User } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export const createTestUser = async (
  overrides?: Partial<User>
): Promise<User> => {
  return prisma.user.create({
    data: {
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'USER',
      ...overrides,
    },
  });
};

// src/__tests__/factories/agent.factory.ts
export const createTestAgent = async (
  userId: string,
  overrides?: Partial<Agent>
): Promise<Agent> => {
  return prisma.agent.create({
    data: {
      name: 'Test Agent',
      type: 'code',
      status: 'draft',
      config: {},
      userId,
      ...overrides,
    },
  });
};
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: turbocat_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run database migrations
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/turbocat_test
        run: npx prisma migrate deploy

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/turbocat_test
          REDIS_URL: redis://localhost:6379
        run: npm run test:integration

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload E2E test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Test Scripts

**package.json**:
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=__tests__/.*\\.test\\.ts",
    "test:integration": "jest --testPathPattern=integration/.*\\.test\\.ts",
    "test:e2e": "playwright test",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

---

## Best Practices

### DO:
✅ Write tests before or alongside code (TDD)
✅ Test behavior, not implementation
✅ Use descriptive test names
✅ Keep tests independent and isolated
✅ Use factories for test data
✅ Mock external dependencies
✅ Test edge cases and error conditions
✅ Maintain high code coverage
✅ Run tests in CI/CD pipeline

### DON'T:
❌ Test private methods directly
❌ Share state between tests
❌ Write flaky tests
❌ Skip failing tests
❌ Test third-party libraries
❌ Duplicate test logic
❌ Ignore test failures
❌ Write overly complex tests

---

**End of Testing Specifications**
