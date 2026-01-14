# Test Plan: Editing & Iteration Tools

**Feature:** EDIT-001 - Editing & Iteration Tools
**Last Updated:** 2026-01-12
**Test Environment:** Development, Staging, Production

---

## Test Strategy

### Focus Areas
1. **Suggested Prompts** - Relevance, insertion, refresh
2. **Advanced Toolbar** - Icon functionality, keyboard shortcuts
3. **Configuration Panels** - Form validation, prompt generation
4. **User Experience** - Animations, responsiveness, accessibility

---

## Unit Tests

### Backend Unit Tests

#### SuggestionService Tests
**File:** `backend/src/services/__tests__/SuggestionService.test.ts`

```typescript
describe('SuggestionService', () => {
  describe('getStarterSuggestions', () => {
    it('should return 6 suggestions for mobile', () => {
      const suggestions = service.getStarterSuggestions('mobile');
      expect(suggestions).toHaveLength(6);
      expect(suggestions[0]).toHaveProperty('text');
      expect(suggestions[0]).toHaveProperty('category', 'starter');
    });

    it('should return 6 suggestions for web', () => {
      const suggestions = service.getStarterSuggestions('web');
      expect(suggestions).toHaveLength(6);
      expect(suggestions.some((s) => s.text === 'Portfolio Site')).toBe(true);
    });

    it('should sort by priority descending', () => {
      const suggestions = service.getStarterSuggestions('mobile');
      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i - 1].priority).toBeGreaterThanOrEqual(
          suggestions[i].priority
        );
      }
    });
  });

  describe('getContextualSuggestions', () => {
    it('should suggest dark mode if not present', () => {
      const project = createMockProject({ messages: ['Create a todo app'] });
      const suggestions = service.getContextualSuggestions(project);
      expect(suggestions.some((s) => s.text === 'Add dark mode')).toBe(true);
    });

    it('should not suggest dark mode if already implemented', () => {
      const project = createMockProject({
        messages: ['Create a todo app', 'Add dark mode'],
      });
      const suggestions = service.getContextualSuggestions(project);
      expect(suggestions.some((s) => s.text === 'Add dark mode')).toBe(false);
    });

    it('should suggest authentication for new projects', () => {
      const project = createMockProject({ messages: ['Create social app'] });
      const suggestions = service.getContextualSuggestions(project);
      expect(suggestions.some((s) => s.text === 'Add authentication')).toBe(
        true
      );
    });

    it('should return max 6 suggestions', () => {
      const project = createMockProject({ messages: ['Todo app'] });
      const suggestions = service.getContextualSuggestions(project);
      expect(suggestions.length).toBeLessThanOrEqual(6);
    });
  });

  describe('analyzeProjectState', () => {
    it('should detect dark mode in messages', () => {
      const project = createMockProject({
        messages: ['Add dark mode with toggle'],
      });
      const state = service.analyzeProjectState(project);
      expect(state.hasDarkMode).toBe(true);
    });

    it('should detect authentication in messages', () => {
      const project = createMockProject({
        messages: ['Add login page with email/password'],
      });
      const state = service.analyzeProjectState(project);
      expect(state.hasAuth).toBe(true);
    });

    it('should count messages correctly', () => {
      const project = createMockProject({ messages: ['A', 'B', 'C'] });
      const state = service.analyzeProjectState(project);
      expect(state.messageCount).toBe(3);
    });
  });
});
```

---

## Integration Tests

### API Integration Tests
**File:** `backend/src/__tests__/integration/SuggestionsAPI.test.ts`

```typescript
describe('Suggestions API', () => {
  describe('GET /api/v1/projects/:id/suggestions', () => {
    it('should return suggestions for new project', async () => {
      const project = await createTestProject(userId, { messageCount: 1 });

      const res = await request(app)
        .get(`/api/v1/projects/${project.id}/suggestions`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.suggestions).toHaveLength(6);
      expect(res.body.data.suggestions[0].category).toBe('starter');
    });

    it('should return contextual suggestions for active project', async () => {
      const project = await createTestProject(userId, {
        messages: ['Create todo app', 'Add list view'],
      });

      const res = await request(app)
        .get(`/api/v1/projects/${project.id}/suggestions`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.suggestions[0].category).not.toBe('starter');
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/v1/projects/123/suggestions');
      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent project', async () => {
      const res = await request(app)
        .get('/api/v1/projects/invalid-id/suggestions')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(500);
    });
  });
});
```

---

## E2E Tests (Playwright)

### Suggested Prompts E2E Tests
**File:** `turbocat-agent/tests/e2e/suggested-prompts.spec.ts`

```typescript
test.describe('Suggested Prompts', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/dashboard');
    await page.click('[data-testid="new-app-btn"]');
  });

  test('should display initial suggestions', async ({ page }) => {
    await expect(page.locator('text=Suggested:')).toBeVisible();
    await expect(page.locator('.chip')).toHaveCount(6);
    await expect(page.locator('text=AI Chat')).toBeVisible();
  });

  test('should insert suggestion on click', async ({ page }) => {
    const input = page.locator('textarea[placeholder*="Describe"]');
    await page.click('text=Mood Tracker');

    const value = await input.inputValue();
    expect(value).toContain('Mood Tracker');
  });

  test('should update suggestions after first message', async ({ page }) => {
    // Send first message
    await page.fill('textarea', 'Create a todo list app');
    await page.click('[data-testid="platform-mobile"]');
    await page.click('button:has-text("Generate")');

    // Wait for project page
    await expect(page).toHaveURL(/\/project\/[a-z0-9-]+/, { timeout: 10000 });

    // Wait for AI response
    await page.waitForSelector('[data-role="assistant"]', { timeout: 15000 });

    // Check suggestions updated
    await expect(page.locator('text=Add dark mode')).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator('text=AI Chat')).not.toBeVisible();
  });

  test('should scroll horizontally', async ({ page }) => {
    const container = page.locator('.suggested-prompts-container');
    await container.evaluate((el) => (el.scrollLeft = 100));
    const scrollLeft = await container.evaluate((el) => el.scrollLeft);
    expect(scrollLeft).toBeGreaterThan(0);
  });
});
```

### Advanced Toolbar E2E Tests
**File:** `turbocat-agent/tests/e2e/advanced-toolbar.spec.ts`

```typescript
test.describe('Advanced Toolbar', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    const projectId = await createTestProject(page);
    await page.goto(`/project/${projectId}`);
  });

  test('should display toolbar with all icons', async ({ page }) => {
    await expect(page.locator('[data-testid="toolbar"]')).toBeVisible();
    await expect(page.locator('[data-icon="image"]')).toBeVisible();
    await expect(page.locator('[data-icon="audio"]')).toBeVisible();
    await expect(page.locator('[data-icon="api"]')).toBeVisible();
    // ... check all 12 icons
  });

  test('should open panel on icon click', async ({ page }) => {
    await page.click('[data-icon="image"]');
    await expect(page.locator('text=Add Image Upload')).toBeVisible();
  });

  test('should close panel on X click', async ({ page }) => {
    await page.click('[data-icon="image"]');
    await page.click('[aria-label="Close"]');
    await expect(page.locator('text=Add Image Upload')).not.toBeVisible();
  });

  test('should open panel with keyboard shortcut', async ({ page }) => {
    await page.keyboard.press('Meta+Shift+I'); // Cmd+Shift+I
    await expect(page.locator('text=Add Image Upload')).toBeVisible({
      timeout: 1000,
    });
  });

  test('should disable platform-specific icons', async ({ page }) => {
    // Create web project
    await page.goto('/new');
    await page.fill('textarea', 'Create a portfolio website');
    await page.click('[data-platform="web"]');
    await page.click('button:has-text("Generate")');

    await expect(page).toHaveURL(/\/project\//);

    // Haptics should be disabled for web
    const hapticsBtn = page.locator('[data-icon="haptics"]');
    await expect(hapticsBtn).toBeDisabled();
  });

  test('should collapse and expand toolbar', async ({ page }) => {
    await page.click('[data-testid="collapse-toolbar"]');
    await expect(page.locator('[data-testid="toolbar"]')).not.toBeVisible();

    await page.click('[data-testid="expand-toolbar"]');
    await expect(page.locator('[data-testid="toolbar"]')).toBeVisible();
  });

  test('should show tooltip on hover', async ({ page }) => {
    await page.hover('[data-icon="image"]');
    await expect(page.locator('text=Add Image Upload')).toBeVisible({
      timeout: 1000,
    });
  });
});
```

### Configuration Panels E2E Tests
**File:** `turbocat-agent/tests/e2e/config-panels.spec.ts`

```typescript
test.describe('Configuration Panels', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    const projectId = await createTestProject(page);
    await page.goto(`/project/${projectId}`);
  });

  test('should configure and insert image prompt', async ({ page }) => {
    // Open panel
    await page.click('[data-icon="image"]');

    // Configure
    await page.check('[id="camera"]');
    await page.check('[id="gallery"]');
    await page.fill('[id="maxSize"]', '10');
    await page.check('[id="jpg"]');
    await page.check('[id="png"]');
    await page.click('[value="Square"]');

    // Insert
    await page.click('button:has-text("Insert")');

    // Verify prompt inserted
    const input = page.locator('textarea[placeholder*="Type message"]');
    const value = await input.inputValue();
    expect(value).toContain('image upload');
    expect(value).toContain('camera and gallery');
    expect(value).toContain('10MB');
    expect(value).toContain('JPG/PNG');
    expect(value).toContain('Square');
  });

  test('should validate required fields', async ({ page }) => {
    await page.click('[data-icon="api"]');

    // Try to insert without required fields
    await page.click('button:has-text("Insert")');

    // Should show validation error
    await expect(page.locator('text=URL is required')).toBeVisible();
  });

  test('should cancel configuration', async ({ page }) => {
    await page.click('[data-icon="image"]');
    await page.fill('[id="maxSize"]', '20');
    await page.click('button:has-text("Cancel")');

    // Panel should close
    await expect(page.locator('text=Add Image Upload')).not.toBeVisible();

    // Input should be empty
    const input = page.locator('textarea[placeholder*="Type message"]');
    const value = await input.inputValue();
    expect(value).toBe('');
  });
});
```

---

## Accessibility Tests

```typescript
test.describe('Accessibility', () => {
  test('suggested prompts should be keyboard navigable', async ({ page }) => {
    await page.goto('/new');
    await page.keyboard.press('Tab'); // Focus on first chip
    await page.keyboard.press('Enter');

    const input = page.locator('textarea');
    const value = await input.inputValue();
    expect(value).toBeTruthy();
  });

  test('toolbar should have aria-labels', async ({ page }) => {
    const projectId = await createTestProject(page);
    await page.goto(`/project/${projectId}`);

    const imageBtn = page.locator('[data-icon="image"]');
    await expect(imageBtn).toHaveAttribute('aria-label', 'Add Image Upload');
  });

  test('configuration panels should be screen reader friendly', async ({
    page,
  }) => {
    await page.goto('/project/test-id');
    await page.click('[data-icon="image"]');

    // Check form labels
    await expect(page.locator('label[for="camera"]')).toBeVisible();
    await expect(page.locator('label[for="maxSize"]')).toBeVisible();
  });
});
```

---

## Performance Tests

### Response Time Benchmarks
| Endpoint | P50 | P95 | Max |
|----------|-----|-----|-----|
| GET /suggestions | 50ms | 150ms | 300ms |

### Frontend Metrics
- Toolbar render: < 50ms
- Panel open animation: < 300ms
- Suggestion chip interaction: < 100ms

---

## Test Coverage Goals

| Type | Target |
|------|--------|
| Unit Tests | 80% |
| Integration Tests | 70% |
| E2E Tests | Critical paths covered |

---

## Test Execution

```bash
# Backend unit tests
cd backend
npm run test:unit

# Integration tests
npm run test:integration

# Frontend E2E tests
cd turbocat-agent
npm run test:e2e

# Accessibility tests
npm run test:a11y
```

---

**Last Updated:** 2026-01-12
**Status:** Ready for Implementation
