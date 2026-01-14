# Test Plan: Dashboard & Project Management

**Feature:** DASH-001 - Dashboard & Project Management
**Last Updated:** 2026-01-12
**Test Environment:** Development, Staging, Production

---

## Test Strategy

### Test Pyramid
```
        /\
       /E2E\          10% - Critical user journeys
      /------\
     /  API   \       30% - Integration & API tests
    /----------\
   /   Unit     \     60% - Component & service tests
  /--------------\
```

### Test Types
1. **Unit Tests** - Individual functions, components, services
2. **Integration Tests** - API endpoints, database operations
3. **E2E Tests** - Complete user flows (Playwright)
4. **Performance Tests** - Load testing, response time
5. **Security Tests** - Auth, authorization, input validation
6. **Accessibility Tests** - WCAG 2.1 AA compliance

---

## Unit Tests

### Backend Unit Tests

#### ProjectService Tests
**File:** `backend/src/services/__tests__/ProjectService.test.ts`

```typescript
describe('ProjectService', () => {
  describe('listProjects', () => {
    it('should return all projects for a user', async () => {
      const projects = await projectService.listProjects(userId, {
        sortBy: 'updatedAt',
        order: 'desc',
      });
      expect(projects).toHaveLength(5);
      expect(projects[0].userId).toBe(userId);
    });

    it('should filter projects by search query', async () => {
      const projects = await projectService.listProjects(userId, {
        search: 'Todo',
        sortBy: 'updatedAt',
        order: 'desc',
      });
      expect(projects).toHaveLength(1);
      expect(projects[0].projectName).toContain('Todo');
    });

    it('should filter projects by platform', async () => {
      const projects = await projectService.listProjects(userId, {
        platform: 'mobile',
        sortBy: 'updatedAt',
        order: 'desc',
      });
      projects.forEach((p) => expect(p.platform).toBe('mobile'));
    });

    it('should sort projects by updatedAt descending', async () => {
      const projects = await projectService.listProjects(userId, {
        sortBy: 'updatedAt',
        order: 'desc',
      });
      for (let i = 1; i < projects.length; i++) {
        expect(projects[i - 1].updatedAt.getTime())
          .toBeGreaterThanOrEqual(projects[i].updatedAt.getTime());
      }
    });
  });

  describe('createProject', () => {
    it('should create a project with valid data', async () => {
      const project = await projectService.createProject(userId, {
        projectName: 'Test App',
        projectDescription: 'A test application',
        platform: 'mobile',
        selectedModel: 'claude-opus-4.5',
      });
      expect(project.projectName).toBe('Test App');
      expect(project.userId).toBe(userId);
    });

    it('should throw error if project name too short', async () => {
      await expect(
        projectService.createProject(userId, {
          projectName: 'AB',
          projectDescription: 'Valid description',
          platform: 'mobile',
          selectedModel: 'claude-opus-4.5',
        })
      ).rejects.toThrow('Project name must be at least 3 characters');
    });

    it('should throw error if description too short', async () => {
      await expect(
        projectService.createProject(userId, {
          projectName: 'Valid Name',
          projectDescription: 'Short',
          platform: 'mobile',
          selectedModel: 'claude-opus-4.5',
        })
      ).rejects.toThrow('Project description must be at least 10 characters');
    });

    it('should create initial chat message from user', async () => {
      const project = await projectService.createProject(userId, {
        projectName: 'Test App',
        projectDescription: 'Build a todo app',
        platform: 'mobile',
        selectedModel: 'claude-opus-4.5',
      });

      const messages = await prisma.chatMessage.findMany({
        where: { workflowId: project.id },
      });

      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe('user');
      expect(messages[0].content).toBe('Build a todo app');
    });

    it('should queue workflow execution', async () => {
      const project = await projectService.createProject(userId, {
        projectName: 'Test App',
        projectDescription: 'Build a todo app',
        platform: 'mobile',
        selectedModel: 'claude-opus-4.5',
      });

      const job = await executionQueue.getJob(project.id);
      expect(job).toBeDefined();
      expect(job.data.workflowId).toBe(project.id);
    });
  });

  describe('getChatHistory', () => {
    it('should return paginated chat messages', async () => {
      const messages = await projectService.getChatHistory(
        userId,
        projectId,
        10,
        0
      );
      expect(messages).toHaveLength(10);
    });

    it('should return empty array if no messages', async () => {
      const messages = await projectService.getChatHistory(
        userId,
        emptyProjectId,
        10,
        0
      );
      expect(messages).toHaveLength(0);
    });

    it('should throw error if project not found', async () => {
      await expect(
        projectService.getChatHistory(userId, 'invalid-id', 10, 0)
      ).rejects.toThrow('Project not found');
    });

    it('should not return messages from other users', async () => {
      await expect(
        projectService.getChatHistory(otherUserId, projectId, 10, 0)
      ).rejects.toThrow('Project not found');
    });
  });

  describe('sendChatMessage', () => {
    it('should save user message', async () => {
      const result = await projectService.sendChatMessage(
        userId,
        projectId,
        'Make the buttons bigger'
      );

      expect(result.message.content).toBe('Make the buttons bigger');
      expect(result.message.role).toBe('user');
    });

    it('should queue workflow execution', async () => {
      await projectService.sendChatMessage(
        userId,
        projectId,
        'Add dark mode'
      );

      const jobs = await executionQueue.getJobs(['waiting']);
      expect(jobs.length).toBeGreaterThan(0);
    });

    it('should throw error if message empty', async () => {
      await expect(
        projectService.sendChatMessage(userId, projectId, '')
      ).rejects.toThrow('Message cannot be empty');
    });
  });

  describe('getPreview', () => {
    it('should return cached preview if available', async () => {
      const preview = await projectService.getPreview(userId, projectId);
      expect(preview.code).toBeDefined();
    });

    it('should return null if preview not generated', async () => {
      const preview = await projectService.getPreview(userId, newProjectId);
      expect(preview.code).toBeNull();
    });

    it('should return error if preview failed', async () => {
      const preview = await projectService.getPreview(userId, failedProjectId);
      expect(preview.error).toBeDefined();
    });
  });

  describe('getRelativeTime', () => {
    it('should return "Just now" for recent timestamps', () => {
      const now = new Date();
      expect(getRelativeTime(now)).toBe('Just now');
    });

    it('should return minutes for timestamps < 1 hour', () => {
      const date = new Date(Date.now() - 30 * 60 * 1000);
      expect(getRelativeTime(date)).toBe('30m ago');
    });

    it('should return hours for timestamps < 1 day', () => {
      const date = new Date(Date.now() - 5 * 60 * 60 * 1000);
      expect(getRelativeTime(date)).toBe('5h ago');
    });

    it('should return days for timestamps < 1 week', () => {
      const date = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      expect(getRelativeTime(date)).toBe('3d ago');
    });
  });
});
```

#### PreviewService Tests
**File:** `backend/src/services/__tests__/PreviewService.test.ts`

```typescript
describe('PreviewService', () => {
  describe('generatePreview', () => {
    it('should bundle mobile code with Metro', async () => {
      const code = `
        import React from 'react';
        import { View, Text } from 'react-native';
        export default () => <View><Text>Hello</Text></View>;
      `;
      const bundled = await previewService.generatePreview(
        workflowId,
        code,
        'mobile'
      );
      expect(bundled.code).toContain('Hello');
    });

    it('should bundle web code with Vite', async () => {
      const code = `
        import React from 'react';
        export default () => <div>Hello</div>;
      `;
      const bundled = await previewService.generatePreview(
        workflowId,
        code,
        'web'
      );
      expect(bundled.code).toContain('Hello');
    });

    it('should cache preview in Redis', async () => {
      await previewService.generatePreview(workflowId, code, 'mobile');
      const cached = await redis.get(`preview:${workflowId}`);
      expect(cached).toBeDefined();
    });

    it('should update workflow with preview code', async () => {
      await previewService.generatePreview(workflowId, code, 'mobile');
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
      });
      expect(workflow.previewCode).toBeDefined();
      expect(workflow.previewUpdatedAt).toBeDefined();
    });

    it('should save error if bundling fails', async () => {
      const invalidCode = 'import invalid syntax;';
      await expect(
        previewService.generatePreview(workflowId, invalidCode, 'mobile')
      ).rejects.toThrow();

      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
      });
      expect(workflow.previewError).toBeDefined();
    });
  });

  describe('getCachedPreview', () => {
    it('should return cached preview if exists', async () => {
      await redis.set(`preview:${workflowId}`, JSON.stringify({ code: 'test' }));
      const cached = await previewService.getCachedPreview(workflowId);
      expect(cached.code).toBe('test');
    });

    it('should return null if no cache', async () => {
      const cached = await previewService.getCachedPreview('no-cache-id');
      expect(cached).toBeNull();
    });
  });
});
```

### Frontend Unit Tests

#### ProjectGrid Tests
**File:** `turbocat-agent/components/turbocat/__tests__/ProjectGrid.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { ProjectGrid } from '../ProjectGrid';

describe('ProjectGrid', () => {
  const mockProjects = [
    {
      id: '1',
      projectName: 'Todo App',
      platform: 'mobile',
      thumbnailUrl: '/thumb1.jpg',
      relativeTime: '2h ago',
    },
    {
      id: '2',
      projectName: 'E-commerce',
      platform: 'web',
      thumbnailUrl: '/thumb2.jpg',
      relativeTime: '1d ago',
    },
  ];

  it('should render grid view by default', () => {
    render(
      <ProjectGrid
        projects={mockProjects}
        viewMode="grid"
        loading={false}
      />
    );
    expect(screen.getByText('Todo App')).toBeInTheDocument();
    expect(screen.getByText('E-commerce')).toBeInTheDocument();
  });

  it('should render list view', () => {
    render(
      <ProjectGrid
        projects={mockProjects}
        viewMode="list"
        loading={false}
      />
    );
    const container = screen.getByText('Todo App').closest('div');
    expect(container).toHaveClass('flex', 'flex-col');
  });

  it('should show loading skeletons', () => {
    render(
      <ProjectGrid
        projects={[]}
        viewMode="grid"
        loading={true}
      />
    );
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons).toHaveLength(8);
  });

  it('should show empty state when no projects', () => {
    render(
      <ProjectGrid
        projects={[]}
        viewMode="grid"
        loading={false}
      />
    );
    expect(screen.getByText('No projects yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first app →')).toBeInTheDocument();
  });
});
```

#### MobilePreview Tests
**File:** `turbocat-agent/components/turbocat/__tests__/MobilePreview.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MobilePreview } from '../MobilePreview';

describe('MobilePreview', () => {
  it('should show loading state initially', () => {
    render(<MobilePreview projectId="123" platform="mobile" />);
    expect(screen.getByText('Building your app...')).toBeInTheDocument();
  });

  it('should display preview iframe when loaded', async () => {
    render(<MobilePreview projectId="123" platform="mobile" />);
    await waitFor(() => {
      expect(screen.getByTitle('App Preview')).toBeInTheDocument();
    });
  });

  it('should show error message on failure', async () => {
    // Mock fetch to return error
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: { error: 'Build failed' } }),
      })
    );

    render(<MobilePreview projectId="123" platform="mobile" />);
    await waitFor(() => {
      expect(screen.getByText('Build failed')).toBeInTheDocument();
    });
  });

  it('should change device on select', async () => {
    render(<MobilePreview projectId="123" platform="mobile" />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'Pixel 7' } });
    expect(select.value).toBe('Pixel 7');
  });

  it('should toggle orientation', () => {
    render(<MobilePreview projectId="123" platform="mobile" />);
    const orientationBtn = screen.getByLabelText('Toggle orientation');
    fireEvent.click(orientationBtn);
    // Assert DeviceFrameset receives landscape prop
  });

  it('should refresh preview on button click', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    render(<MobilePreview projectId="123" platform="mobile" />);

    await waitFor(() => screen.getByTitle('App Preview'));

    const refreshBtn = screen.getByText('Refresh');
    fireEvent.click(refreshBtn);

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
```

---

## Integration Tests

### API Integration Tests
**File:** `backend/src/__tests__/integration/ProjectAPI.test.ts`

```typescript
describe('Project API Integration', () => {
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create test user and get token
    const user = await createTestUser();
    accessToken = generateJWT(user.id);
    userId = user.id;
  });

  describe('GET /api/v1/projects', () => {
    it('should return 200 with projects array', async () => {
      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/v1/projects');
      expect(res.status).toBe(401);
    });

    it('should filter by search query', async () => {
      const res = await request(app)
        .get('/api/v1/projects?search=Todo')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((p) => {
        expect(p.projectName.toLowerCase()).toContain('todo');
      });
    });

    it('should filter by platform', async () => {
      const res = await request(app)
        .get('/api/v1/projects?platform=mobile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      res.body.data.forEach((p) => {
        expect(p.platform).toBe('mobile');
      });
    });
  });

  describe('POST /api/v1/projects', () => {
    it('should create project with valid data', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          projectName: 'Test App',
          projectDescription: 'A test application for integration testing',
          platform: 'mobile',
          selectedModel: 'claude-opus-4.5',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.projectName).toBe('Test App');
    });

    it('should return 400 if name too short', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          projectName: 'Ab',
          projectDescription: 'Valid description here',
          platform: 'mobile',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('at least 3 characters');
    });

    it('should return 400 if description too short', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          projectName: 'Valid Name',
          projectDescription: 'Short',
          platform: 'mobile',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('at least 10 characters');
    });

    it('should return 400 if platform invalid', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          projectName: 'Valid Name',
          projectDescription: 'Valid description here',
          platform: 'invalid',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('must be "mobile" or "web"');
    });
  });

  describe('GET /api/v1/projects/:id/chat', () => {
    let projectId: string;

    beforeEach(async () => {
      const project = await createTestProject(userId);
      projectId = project.id;
      await createTestChatMessages(projectId, 25);
    });

    it('should return chat messages', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectId}/chat`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should paginate results', async () => {
      const res1 = await request(app)
        .get(`/api/v1/projects/${projectId}/chat?limit=10&offset=0`)
        .set('Authorization', `Bearer ${accessToken}`);

      const res2 = await request(app)
        .get(`/api/v1/projects/${projectId}/chat?limit=10&offset=10`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res1.body.data.length).toBe(10);
      expect(res2.body.data.length).toBe(10);
      expect(res1.body.data[0].id).not.toBe(res2.body.data[0].id);
    });
  });

  describe('POST /api/v1/projects/:id/chat', () => {
    let projectId: string;

    beforeEach(async () => {
      const project = await createTestProject(userId);
      projectId = project.id;
    });

    it('should send chat message', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/chat`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ message: 'Add dark mode support' });

      expect(res.status).toBe(200);
      expect(res.body.data.message.content).toBe('Add dark mode support');
    });

    it('should return 400 if message empty', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/chat`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ message: '' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('cannot be empty');
    });
  });
});
```

---

## E2E Tests (Playwright)

### Dashboard E2E Tests
**File:** `turbocat-agent/tests/e2e/dashboard.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should load and display projects', async ({ page }) => {
    await expect(page.locator('text=Projects')).toBeVisible();
    await expect(page.locator('[data-testid="project-card"]')).toHaveCount(5);
  });

  test('should search projects by name', async ({ page }) => {
    await page.fill('[placeholder*="Search"]', 'Todo');
    await page.waitForTimeout(500); // Debounce
    await expect(page.locator('[data-testid="project-card"]')).toHaveCount(1);
    await expect(page.locator('text=Todo App')).toBeVisible();
  });

  test('should toggle between grid and list view', async ({ page }) => {
    const toggleBtn = page.locator('[data-testid="view-toggle-list"]');
    await toggleBtn.click();
    await expect(page.locator('[data-testid="project-grid"]'))
      .toHaveClass(/flex-col/);

    await page.locator('[data-testid="view-toggle-grid"]').click();
    await expect(page.locator('[data-testid="project-grid"]'))
      .toHaveClass(/grid/);
  });

  test('should navigate to project on card click', async ({ page }) => {
    await page.click('[data-testid="project-card"]:first-child');
    await expect(page).toHaveURL(/\/project\/[a-z0-9-]+/);
  });

  test('should show empty state when no projects', async ({ page }) => {
    // Delete all projects
    await page.evaluate(() => localStorage.setItem('projects', '[]'));
    await page.reload();
    await expect(page.locator('text=No projects yet')).toBeVisible();
    await expect(page.locator('text=Create your first app →')).toBeVisible();
  });
});
```

### Project Creation E2E Tests
**File:** `turbocat-agent/tests/e2e/project-creation.spec.ts`

```typescript
test.describe('Project Creation', () => {
  test('should create a new project end-to-end', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Navigate to new project page
    await page.click('text=New app');
    await expect(page).toHaveURL('/new');

    // Fill form
    await page.fill('textarea[placeholder*="Describe"]',
      'Create a simple todo list app with task management');
    await page.click('[data-testid="platform-mobile"]');
    await page.selectOption('[data-testid="model-selector"]', 'claude-opus-4.5');

    // Submit
    await page.click('button:has-text("Generate")');

    // Wait for navigation to project page
    await expect(page).toHaveURL(/\/project\/[a-z0-9-]+/, { timeout: 10000 });

    // Verify chat shows initial message
    await expect(page.locator('text=Create a simple todo list')).toBeVisible();

    // Verify preview loads
    await expect(page.locator('iframe[title="App Preview"]'))
      .toBeVisible({ timeout: 15000 });
  });

  test('should validate prompt length', async ({ page }) => {
    await page.goto('/new');
    await page.fill('textarea', 'Short');
    await page.click('button:has-text("Generate")');
    await expect(page.locator('text=at least 10 characters')).toBeVisible();
  });

  test('should show loading state during creation', async ({ page }) => {
    await page.goto('/new');
    await page.fill('textarea', 'Create a todo list app');
    await page.click('[data-testid="platform-mobile"]');
    await page.click('button:has-text("Generate")');
    await expect(page.locator('text=Building your app...')).toBeVisible();
  });
});
```

### Chat and Preview E2E Tests
**File:** `turbocat-agent/tests/e2e/chat-preview.spec.ts`

```typescript
test.describe('Chat and Preview', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to existing project
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.click('[data-testid="project-card"]:first-child');
  });

  test('should load chat history', async ({ page }) => {
    await expect(page.locator('[data-testid="chat-message"]'))
      .toHaveCount(10, { timeout: 5000 });
  });

  test('should send chat message and receive AI response', async ({ page }) => {
    const messageInput = page.locator('[placeholder*="Type message"]');
    await messageInput.fill('Make the buttons bigger');
    await page.keyboard.press('Enter');

    // User message appears immediately
    await expect(page.locator('text=Make the buttons bigger')).toBeVisible();

    // AI response appears after processing
    await expect(page.locator('[data-role="assistant"]:last-child'))
      .toBeVisible({ timeout: 10000 });
  });

  test('should update preview in real-time', async ({ page }) => {
    // Get initial preview
    const previewFrame = page.frameLocator('iframe[title="App Preview"]');

    // Send message to change UI
    await page.fill('[placeholder*="Type message"]', 'Change button color to red');
    await page.keyboard.press('Enter');

    // Wait for preview to update (check for new timestamp or content)
    await expect(previewFrame.locator('button'))
      .toHaveCSS('background-color', 'rgb(255, 0, 0)', { timeout: 15000 });
  });

  test('should change device frame', async ({ page }) => {
    await page.selectOption('[data-testid="device-selector"]', 'Pixel 7');
    await expect(page.locator('[data-device="Pixel 7"]')).toBeVisible();
  });

  test('should toggle orientation', async ({ page }) => {
    const orientationBtn = page.locator('[data-testid="orientation-toggle"]');
    await orientationBtn.click();
    await expect(page.locator('[data-orientation="landscape"]')).toBeVisible();
  });

  test('should show QR code modal', async ({ page }) => {
    await page.click('text=Open on mobile');
    await expect(page.locator('[data-testid="qr-modal"]')).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible(); // QR code
  });

  test('should refresh preview', async ({ page }) => {
    const refreshBtn = page.locator('button:has-text("Refresh")');
    await refreshBtn.click();
    await expect(page.locator('text=Building your app...')).toBeVisible();
    await expect(page.locator('iframe[title="App Preview"]'))
      .toBeVisible({ timeout: 5000 });
  });
});
```

---

## Performance Tests

### Load Testing
**Tool:** k6

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 10 },  // Ramp up to 10 users
    { duration: '3m', target: 10 },  // Stay at 10 users
    { duration: '1m', target: 50 },  // Ramp up to 50 users
    { duration: '3m', target: 50 },  // Stay at 50 users
    { duration: '1m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests under 1s
    http_req_failed: ['rate<0.05'],    // < 5% failure rate
  },
};

export default function () {
  const token = 'Bearer eyJhbGciOi...'; // Auth token

  // List projects
  let res = http.get('http://localhost:3001/api/v1/projects', {
    headers: { Authorization: token },
  });
  check(res, { 'projects loaded': (r) => r.status === 200 });

  sleep(1);

  // Create project
  res = http.post(
    'http://localhost:3001/api/v1/projects',
    JSON.stringify({
      projectName: 'Load Test App',
      projectDescription: 'Testing load handling',
      platform: 'mobile',
      selectedModel: 'claude-opus-4.5',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
    }
  );
  check(res, { 'project created': (r) => r.status === 201 });

  sleep(2);
}
```

### Response Time Benchmarks
| Endpoint | P50 | P95 | P99 | Max |
|----------|-----|-----|-----|-----|
| GET /projects | 150ms | 500ms | 800ms | 1s |
| POST /projects | 200ms | 600ms | 1s | 2s |
| GET /projects/:id/chat | 100ms | 300ms | 500ms | 800ms |
| POST /projects/:id/chat | 150ms | 400ms | 700ms | 1s |
| GET /projects/:id/preview | 200ms | 500ms | 900ms | 1.5s |

---

## Security Tests

### Authentication Tests
```typescript
describe('Security: Authentication', () => {
  it('should reject requests without token', async () => {
    const res = await request(app).get('/api/v1/projects');
    expect(res.status).toBe(401);
  });

  it('should reject expired token', async () => {
    const expiredToken = generateExpiredJWT(userId);
    const res = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });

  it('should reject tampered token', async () => {
    const token = generateJWT(userId);
    const tamperedToken = token.slice(0, -10) + 'tampered123';
    const res = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', `Bearer ${tamperedToken}`);
    expect(res.status).toBe(401);
  });
});
```

### Authorization Tests
```typescript
describe('Security: Authorization', () => {
  it('should not allow accessing other users projects', async () => {
    const user1Token = generateJWT(user1Id);
    const user2Token = generateJWT(user2Id);

    // User 2 creates project
    const res1 = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${user2Token}`)
      .send(validProjectData);

    const projectId = res1.body.data.id;

    // User 1 tries to access
    const res2 = await request(app)
      .get(`/api/v1/projects/${projectId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res2.status).toBe(404); // Not found (authorization failure)
  });

  it('should not allow deleting other users projects', async () => {
    const user1Token = generateJWT(user1Id);
    const user2ProjectId = await createProjectForUser(user2Id);

    const res = await request(app)
      .delete(`/api/v1/projects/${user2ProjectId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(404);
  });
});
```

### Input Validation Tests
```typescript
describe('Security: Input Validation', () => {
  it('should sanitize HTML in project names', async () => {
    const res = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        projectName: '<script>alert("xss")</script>',
        projectDescription: 'Valid description',
        platform: 'mobile',
      });

    expect(res.body.data.projectName).not.toContain('<script>');
  });

  it('should prevent SQL injection in search', async () => {
    const res = await request(app)
      .get('/api/v1/projects?search=\' OR 1=1 --')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    // Should return safe results, not all projects
  });

  it('should limit description length', async () => {
    const longDesc = 'A'.repeat(10000);
    const res = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({
        projectName: 'Test',
        projectDescription: longDesc,
        platform: 'mobile',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('too long');
  });
});
```

---

## Accessibility Tests

### WCAG 2.1 AA Compliance
**Tool:** axe-core (Playwright integration)

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('dashboard should have no accessibility violations', async ({ page }) => {
    await page.goto('/dashboard');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('new project page should have no violations', async ({ page }) => {
    await page.goto('/new');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('keyboard navigation should work', async ({ page }) => {
    await page.goto('/dashboard');
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="new-app-btn"]')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/new');
  });

  test('screen reader labels should be present', async ({ page }) => {
    await page.goto('/dashboard');
    const searchInput = page.locator('[placeholder*="Search"]');
    await expect(searchInput).toHaveAttribute('aria-label', 'Search projects');
  });
});
```

---

## Test Execution

### Running Tests

**Unit Tests:**
```bash
# Backend
cd backend
npm run test:unit

# Frontend
cd turbocat-agent
npm run test
```

**Integration Tests:**
```bash
cd backend
npm run test:integration
```

**E2E Tests:**
```bash
cd turbocat-agent
npm run test:e2e          # Headless
npm run test:e2e:ui       # With UI
```

**Performance Tests:**
```bash
k6 run backend/tests/load/dashboard.js
```

**Security Tests:**
```bash
npm run test:security
npm audit
```

**Accessibility Tests:**
```bash
npm run test:a11y
```

---

## Test Coverage Goals

| Type | Target | Current |
|------|--------|---------|
| Unit Tests | 80% | TBD |
| Integration Tests | 70% | TBD |
| E2E Tests | Critical paths | TBD |

---

## CI/CD Integration

### GitHub Actions Workflow
```yaml
name: Test Dashboard Feature

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../turbocat-agent && npm ci

      - name: Run unit tests
        run: |
          cd backend && npm run test:unit
          cd ../turbocat-agent && npm run test

      - name: Run integration tests
        run: cd backend && npm run test:integration

      - name: Run E2E tests
        run: cd turbocat-agent && npm run test:e2e

      - name: Upload test results
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: |
            backend/coverage
            turbocat-agent/coverage
            turbocat-agent/test-results
```

---

## Bug Reporting Template

```markdown
**Title:** [Component] Brief description

**Severity:** Critical / High / Medium / Low

**Environment:**
- Browser/Node version:
- OS:
- Test environment: Dev / Staging / Prod

**Steps to Reproduce:**
1. Go to /dashboard
2. Click on...
3. Observe...

**Expected Behavior:**


**Actual Behavior:**


**Screenshots/Videos:**


**Console Errors:**


**Additional Context:**

```

---

**Last Updated:** 2026-01-12
**Status:** Ready for Implementation
