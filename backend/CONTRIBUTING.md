# Contributing to Turbocat Backend

Thank you for your interest in contributing to Turbocat! This document provides guidelines and instructions for contributing to the backend project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)
- [Project Structure](#project-structure)

---

## Code of Conduct

By participating in this project, you agree to maintain a welcoming and inclusive environment. Please be respectful and constructive in all interactions.

---

## Getting Started

### Prerequisites

- Node.js 20.0.0 or higher
- npm 9.0.0 or higher
- Git
- PostgreSQL (via Supabase) - for integration tests
- Redis (via Upstash) - optional, for session testing

### Setting Up Your Development Environment

1. **Fork the repository**

   Click the "Fork" button on GitHub to create your own copy.

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/turbocat.git
   cd turbocat/backend
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Set up environment variables**

   ```bash
   # Copy the example file
   cp .env.example .env

   # Edit .env with your values
   # See README.md for required variables
   ```

5. **Generate Prisma client**

   ```bash
   npm run db:generate
   ```

6. **Run migrations (if you have database access)**

   ```bash
   npm run db:migrate
   ```

7. **Verify setup**

   ```bash
   npm run typecheck
   npm run lint
   npm run test:unit
   ```

---

## Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
# For features
git checkout -b feature/your-feature-name

# For bug fixes
git checkout -b fix/issue-description

# For documentation
git checkout -b docs/documentation-topic
```

### 2. Make Your Changes

- Write code following the [Code Style](#code-style) guidelines
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run unit tests
npm run test:unit

# Run all tests
npm run test

# Run with coverage
npm run test:coverage
```

### 4. Commit Your Changes

Follow the [Commit Guidelines](#commit-guidelines) for your commit messages.

### 5. Push and Create PR

```bash
git push origin your-branch-name
```

Then create a Pull Request on GitHub.

---

## Code Style

### TypeScript Guidelines

- **Use TypeScript strictly** - Enable all strict mode options
- **Avoid `any`** - Use proper types or `unknown`
- **Use interfaces** for object shapes
- **Use type aliases** for unions and complex types
- **Export types** from the module where they're defined

```typescript
// Good
interface UserInput {
  email: string;
  password: string;
  fullName?: string;
}

// Avoid
const createUser = (data: any) => { ... }
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files | camelCase or kebab-case | `userService.ts`, `error-handler.ts` |
| Classes | PascalCase | `WorkflowExecutor` |
| Interfaces | PascalCase | `AgentConfig` |
| Types | PascalCase | `ExecutionStatus` |
| Functions | camelCase | `createAgent` |
| Variables | camelCase | `userId` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Enums | PascalCase (members UPPER_SNAKE_CASE) | `AgentType.CODE` |

### File Organization

Each file should have a clear structure:

```typescript
/**
 * Module description
 * @module module/name
 */

// 1. Imports (external, then internal, alphabetically)
import express from 'express';
import { z } from 'zod';

import { ApiError } from '../utils/ApiError';
import { logger } from '../lib/logger';

// 2. Types and Interfaces
interface MyInput {
  // ...
}

// 3. Constants
const MAX_ITEMS = 100;

// 4. Helper Functions (private)
const validateInput = (input: MyInput): void => {
  // ...
};

// 5. Main Exports
export const myFunction = async (): Promise<void> => {
  // ...
};

// 6. Default Export (if applicable)
export default myFunction;
```

### Code Formatting

We use Prettier for code formatting. Configuration is in `.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100
}
```

Run formatting:

```bash
npm run format
```

### ESLint Rules

We use ESLint with TypeScript support. Key rules:

- No unused variables
- No explicit `any`
- Consistent return types
- Proper async/await usage

Run linting:

```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

---

## Commit Guidelines

### Commit Message Format

We follow Conventional Commits:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, etc.) |
| `refactor` | Code refactoring |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |
| `perf` | Performance improvements |

### Examples

```bash
# Feature
feat(agents): add agent duplication endpoint

# Bug fix
fix(auth): handle expired refresh tokens correctly

# Documentation
docs(api): update authentication guide

# Tests
test(workflows): add integration tests for execution
```

### Best Practices

- Keep commits atomic (one logical change per commit)
- Write clear, descriptive messages
- Reference issue numbers when applicable: `fix(auth): resolve token refresh (#123)`

---

## Pull Request Process

### Before Submitting

1. **Ensure all tests pass**
   ```bash
   npm run test
   ```

2. **Run type checking**
   ```bash
   npm run typecheck
   ```

3. **Run linting**
   ```bash
   npm run lint
   ```

4. **Update documentation** if you changed APIs or behavior

5. **Rebase on main** to ensure clean history
   ```bash
   git fetch origin
   git rebase origin/main
   ```

### PR Title Format

Use the same format as commit messages:

```
feat(scope): description
fix(scope): description
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests passing
```

### Review Process

1. PRs require at least one approval
2. All CI checks must pass
3. Address reviewer feedback
4. Squash commits before merging (if needed)

---

## Testing Requirements

### Test Structure

```
tests/
  unit/              # Unit tests
    services/
    utils/
  integration/       # Integration tests
    api/
  e2e/               # End-to-end tests
```

### Writing Tests

#### Unit Tests

Test individual functions/classes in isolation:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createAgent } from '../services/agent.service';

describe('AgentService', () => {
  describe('createAgent', () => {
    it('should create an agent with valid input', async () => {
      const input = {
        name: 'Test Agent',
        type: 'CODE',
      };

      const result = await createAgent('user-id', input);

      expect(result.name).toBe('Test Agent');
      expect(result.type).toBe('CODE');
      expect(result.status).toBe('DRAFT');
    });

    it('should throw validation error for empty name', async () => {
      const input = { name: '', type: 'CODE' };

      await expect(createAgent('user-id', input))
        .rejects.toThrow('Name is required');
    });
  });
});
```

#### Integration Tests

Test API endpoints with database:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import app from '../app';

describe('POST /api/v1/agents', () => {
  let accessToken: string;

  beforeAll(async () => {
    // Setup: create test user, get token
    accessToken = await getTestToken();
  });

  afterAll(async () => {
    // Cleanup: remove test data
    await cleanupTestData();
  });

  it('should create an agent when authenticated', async () => {
    const response = await supertest(app)
      .post('/api/v1/agents')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Test Agent',
        type: 'CODE',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.agent.name).toBe('Test Agent');
  });
});
```

### Test Commands

```bash
# Run all tests
npm run test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Coverage Requirements

- Aim for 80%+ code coverage
- Critical paths should have 100% coverage
- All error handlers should be tested

---

## Documentation

### Code Documentation

Use JSDoc comments for public APIs:

```typescript
/**
 * Creates a new agent for the specified user.
 *
 * @param userId - The ID of the user creating the agent
 * @param input - Agent creation parameters
 * @returns The created agent
 * @throws {ApiError} If validation fails or database error occurs
 *
 * @example
 * ```typescript
 * const agent = await createAgent('user-123', {
 *   name: 'My Agent',
 *   type: 'CODE',
 * });
 * ```
 */
export const createAgent = async (
  userId: string,
  input: CreateAgentInput,
): Promise<Agent> => {
  // ...
};
```

### API Documentation

Update OpenAPI/Swagger documentation for new endpoints:

```typescript
/**
 * @openapi
 * /agents:
 *   post:
 *     summary: Create a new agent
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAgentRequest'
 *     responses:
 *       201:
 *         description: Agent created successfully
 */
```

### README Updates

Update documentation when:
- Adding new features
- Changing API behavior
- Adding new environment variables
- Changing setup process

---

## Project Structure

```
backend/
+-- src/
|   +-- app.ts              # Express app configuration
|   +-- server.ts           # Server entry point
|   +-- swagger.ts          # API documentation
|   +-- lib/                # Core libraries
|   |   +-- prisma.ts       # Database client
|   |   +-- redis.ts        # Cache client
|   |   +-- logger.ts       # Logging
|   +-- middleware/         # Express middleware
|   |   +-- auth.ts         # Authentication
|   |   +-- errorHandler.ts # Error handling
|   +-- routes/             # API routes
|   |   +-- agents.ts
|   |   +-- workflows.ts
|   +-- services/           # Business logic
|   |   +-- agent.service.ts
|   |   +-- workflow.service.ts
|   +-- engine/             # Execution engine
|   +-- utils/              # Utilities
+-- prisma/
|   +-- schema.prisma       # Database schema
|   +-- migrations/         # Database migrations
+-- tests/
|   +-- unit/
|   +-- integration/
+-- docs/                   # Documentation
```

### Adding New Features

1. **Routes** - Define API endpoints in `src/routes/`
2. **Services** - Implement business logic in `src/services/`
3. **Types** - Add TypeScript types in `src/types/` or inline
4. **Tests** - Add tests in `tests/`
5. **Documentation** - Update docs and OpenAPI spec

---

## Questions?

- Check existing issues and discussions
- Create a new issue for bugs or feature requests
- Ask in discussions for general questions

Thank you for contributing to Turbocat!

---

**Last Updated:** January 7, 2026
