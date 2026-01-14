# Test Plan: Publishing Flow

**Feature:** PUB-001 - Publishing Flow
**Last Updated:** 2026-01-12
**Test Environment:** Development, Staging, Production

---

## Test Strategy

### Critical Path Testing
Publishing is the most critical feature - users' apps depend on it. Testing strategy:
1. **Manual QA with real accounts** (highest priority)
2. **Integration tests** for API workflows
3. **E2E tests** for UI flows
4. **Security audit** for credential handling

---

## Unit Tests

### Backend Unit Tests

#### AppleService Tests
```typescript
describe('AppleService', () => {
  it('should generate valid JWT', () => {
    const jwt = appleService.generateJWT(keyId, issuerId, privateKey);
    expect(jwt).toBeTruthy();
    expect(jwt.split('.')).toHaveLength(3);
  });

  it('should validate correct credentials', async () => {
    const valid = await appleService.validateCredentials(
      validTeamId,
      validKeyId,
      validIssuerId,
      validPrivateKey
    );
    expect(valid).toBe(true);
  });

  it('should reject invalid credentials', async () => {
    const valid = await appleService.validateCredentials(
      'invalid',
      'invalid',
      'invalid',
      'invalid'
    );
    expect(valid).toBe(false);
  });
});
```

#### ExpoService Tests
```typescript
describe('ExpoService', () => {
  it('should validate correct token', async () => {
    const valid = await expoService.validateToken(validToken);
    expect(valid).toBe(true);
  });

  it('should reject invalid token', async () => {
    const valid = await expoService.validateToken('invalid');
    expect(valid).toBe(false);
  });

  it('should start build and return build ID', async () => {
    const buildId = await expoService.startBuild(projectId, 'ios', token);
    expect(buildId).toBeTruthy();
    expect(typeof buildId).toBe('string');
  });
});
```

#### Encryption Tests
```typescript
describe('Encryption Utils', () => {
  it('should encrypt and decrypt correctly', () => {
    const original = 'sensitive data';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it('should produce different ciphertext for same input', () => {
    const text = 'test';
    const enc1 = encrypt(text);
    const enc2 = encrypt(text);
    expect(enc1).not.toBe(enc2);
  });

  it('should throw on invalid auth tag', () => {
    const encrypted = 'invalid:invalid:invalid';
    expect(() => decrypt(encrypted)).toThrow();
  });
});
```

---

## Integration Tests

### Publishing Flow Integration Tests
```typescript
describe('Publishing Flow', () => {
  it('should initiate publishing with valid data', async () => {
    const res = await request(app)
      .post('/api/v1/publish/initiate')
      .set('Authorization', `Bearer ${token}`)
      .send(validPublishData);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.status).toBe('INITIATED');
  });

  it('should reject invalid Apple credentials', async () => {
    const res = await request(app)
      .post('/api/v1/publish/initiate')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validPublishData, appleKeyId: 'invalid' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid Apple Developer credentials');
  });

  it('should reject invalid Expo token', async () => {
    const res = await request(app)
      .post('/api/v1/publish/initiate')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validPublishData, expoToken: 'invalid' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Invalid Expo token');
  });

  it('should track build status', async () => {
    // Initiate
    const res1 = await request(app)
      .post('/api/v1/publish/initiate')
      .set('Authorization', `Bearer ${token}`)
      .send(validPublishData);

    const publishingId = res1.body.data.id;

    // Poll status
    const res2 = await request(app)
      .get(`/api/v1/publish/${publishingId}/status`)
      .set('Authorization', `Bearer ${token}`);

    expect(res2.status).toBe(200);
    expect(res2.body.data.status).toBeIn(['INITIATED', 'BUILDING']);
  });

  it('should encrypt sensitive credentials', async () => {
    const res = await request(app)
      .post('/api/v1/publish/initiate')
      .set('Authorization', `Bearer ${token}`)
      .send(validPublishData);

    const publishingId = res.body.data.id;

    // Fetch from DB
    const publishing = await prisma.publishing.findUnique({
      where: { id: publishingId },
    });

    expect(publishing.applePrivateKey).not.toBe(validPublishData.applePrivateKey);
    expect(publishing.expoToken).not.toBe(validPublishData.expoToken);
  });
});
```

---

## E2E Tests (Playwright)

### Publishing Modal E2E Tests
```typescript
test.describe('Publishing Flow', () => {
  test('should complete full publishing flow', async ({ page }) => {
    // Login
    await loginAsTestUser(page);

    // Navigate to project
    await page.goto('/dashboard');
    await page.click('[data-testid="project-card"]:first-child');

    // Click Publish
    await page.click('button:has-text("Publish")');

    // Step 1: Prerequisites
    await expect(page.locator('text=Prerequisites')).toBeVisible();
    await page.check('[id="have-requirements"]');
    await page.click('button:has-text("Next")');

    // Step 2: Apple Credentials
    await page.fill('[name="appleTeamId"]', process.env.TEST_APPLE_TEAM_ID);
    await page.fill('[name="appleKeyId"]', process.env.TEST_APPLE_KEY_ID);
    await page.fill('[name="appleIssuerId"]', process.env.TEST_APPLE_ISSUER_ID);
    await page.setInputFiles('[name="applePrivateKey"]', 'test-key.p8');
    await page.click('button:has-text("Next")');

    // Step 3: Expo Token
    await page.fill('[name="expoToken"]', process.env.TEST_EXPO_TOKEN);
    await page.click('button:has-text("Next")');

    // Step 4: App Details
    await page.fill('[name="appName"]', 'Test App E2E');
    await page.fill('[name="description"]', 'This is a test app for E2E testing');
    await page.selectOption('[name="category"]', 'Utilities');
    await page.selectOption('[name="ageRating"]', '4+');
    await page.click('button:has-text("Submit to App Store")');

    // Confirmation
    await page.click('button:has-text("Confirm")');

    // Building step
    await expect(page.locator('text=Building your app')).toBeVisible({
      timeout: 5000,
    });

    // Wait for completion (long timeout for real build)
    await expect(page.locator('text=Successfully submitted')).toBeVisible({
      timeout: 15 * 60 * 1000, // 15 minutes
    });
  });

  test('should validate required fields', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/project/test-id');
    await page.click('button:has-text("Publish")');

    // Skip prerequisites
    await page.check('[id="have-requirements"]');
    await page.click('button:has-text("Next")');

    // Try to proceed without filling fields
    await page.click('button:has-text("Next")');

    await expect(page.locator('text=Team ID is required')).toBeVisible();
    await expect(page.locator('text=Key ID is required')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/project/test-id');
    await page.click('button:has-text("Publish")');

    // Prerequisites
    await page.check('[id="have-requirements"]');
    await page.click('button:has-text("Next")');

    // Invalid credentials
    await page.fill('[name="appleTeamId"]', 'INVALID');
    await page.fill('[name="appleKeyId"]', 'INVALID');
    await page.fill('[name="appleIssuerId"]', 'INVALID');
    await page.setInputFiles('[name="applePrivateKey"]', 'invalid.p8');
    await page.click('button:has-text("Next")');

    await expect(page.locator('text=Invalid Apple Developer credentials')).toBeVisible();
  });

  test('should allow retry on build failure', async ({ page }) => {
    // Mock build failure
    await page.route('**/api/v1/publish/initiate', (route) =>
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: { id: 'test-id', status: 'FAILED', statusMessage: 'Build failed' },
        }),
      })
    );

    await loginAsTestUser(page);
    await page.goto('/project/test-id');
    await page.click('button:has-text("Publish")');

    // Complete all steps...
    // (abbreviated)

    // Build failure
    await expect(page.locator('text=Build failed')).toBeVisible();
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();

    await page.click('button:has-text("Retry")');
    await expect(page.locator('text=Building your app')).toBeVisible();
  });
});
```

---

## Manual QA Test Cases

### TC-001: Full Publishing Flow (Happy Path)
**Prerequisites:**
- Valid Apple Developer account
- Valid Expo account
- Test app ready for publishing

**Steps:**
1. Login to Turbocat
2. Navigate to test project
3. Click "Publish" button
4. Complete Prerequisites checklist
5. Enter Apple Developer credentials
6. Upload .p8 key file
7. Click "Test Credentials" - verify success
8. Enter Expo token
9. Click "Test Token" - verify success
10. Review app details
11. Upload custom app icon (1024x1024px PNG)
12. Edit description if needed
13. Click "Submit to App Store"
14. Confirm submission
15. Wait for build to complete (monitor progress)
16. Verify submission success
17. Check App Store Connect for submission

**Expected Result:**
- App successfully submitted to App Store Connect
- Status shows "SUBMITTED"
- Email notification received (if implemented)
- App appears in App Store Connect

---

### TC-002: Invalid Apple Credentials
**Steps:**
1. Start publishing flow
2. Enter invalid Team ID
3. Enter invalid Key ID
4. Enter invalid Issuer ID
5. Upload valid .p8 file
6. Click "Test Credentials"

**Expected Result:**
- Error message: "Invalid Apple Developer credentials"
- Cannot proceed to next step

---

### TC-003: Build Timeout
**Steps:**
1. Start publishing flow
2. Complete all steps
3. Submit app
4. Wait for build timeout (20+ minutes)

**Expected Result:**
- Status shows "FAILED"
- Error message: "Build timeout after 20 minutes"
- Retry button available

---

### TC-004: Credential Security
**Steps:**
1. Complete publishing flow
2. Check database directly
3. Verify applePrivateKey field is encrypted
4. Verify expoToken field is encrypted
5. Check application logs
6. Verify no credentials in logs

**Expected Result:**
- All sensitive fields encrypted in DB
- No credentials in logs
- .p8 file deleted after use

---

## Performance Tests

### Load Testing (k6)
```javascript
export let options = {
  stages: [
    { duration: '2m', target: 5 },  // 5 concurrent publishes
    { duration: '5m', target: 5 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% under 2s
  },
};

export default function () {
  const res = http.post(
    'http://localhost:3001/api/v1/publish/initiate',
    JSON.stringify(publishData),
    { headers: { Authorization: `Bearer ${token}` } }
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'publishing initiated': (r) => r.json().data.status === 'INITIATED',
  });

  sleep(1);
}
```

---

## Security Tests

### Credential Encryption Test
```typescript
test('credentials should be encrypted at rest', async () => {
  // Publish app
  const res = await publishingService.initiatePublishing(
    userId,
    projectId,
    validPublishData
  );

  // Check database
  const publishing = await prisma.publishing.findUnique({
    where: { id: res.id },
  });

  // Credentials should be encrypted (not plaintext)
  expect(publishing.applePrivateKey).not.toBe(validPublishData.applePrivateKey);
  expect(publishing.applePrivateKey).toContain(':'); // IV:AuthTag:Encrypted format

  // Should be able to decrypt
  const decrypted = await decrypt(publishing.applePrivateKey);
  expect(decrypted).toBe(validPublishData.applePrivateKey);
});
```

### Log Security Test
```typescript
test('credentials should not appear in logs', async () => {
  const logSpy = jest.spyOn(console, 'log');

  await publishingService.initiatePublishing(userId, projectId, validPublishData);

  // Check all log calls
  logSpy.mock.calls.forEach((call) => {
    const logString = JSON.stringify(call);
    expect(logString).not.toContain(validPublishData.applePrivateKey);
    expect(logString).not.toContain(validPublishData.expoToken);
  });
});
```

---

## Test Coverage Goals

| Type | Target |
|------|--------|
| Unit Tests | 85% |
| Integration Tests | 80% |
| E2E Tests | Critical path covered |
| Manual QA | All user flows |

---

## Test Execution

```bash
# Backend tests
cd backend
npm run test:unit
npm run test:integration

# Frontend tests
cd turbocat-agent
npm run test:e2e

# Performance tests
k6 run backend/tests/load/publishing.js

# Security audit
npm audit
npm run test:security
```

---

**Last Updated:** 2026-01-12
**Status:** Ready for Implementation
