# Test Plan: Settings & Account Management

**Feature:** SET-001
**Last Updated:** 2026-01-12

---

## Test Cases

### TC-001: Update Profile
```typescript
test('should update user profile', async ({ page }) => {
  await page.goto('/settings');
  await page.fill('[name="name"]', 'Updated Name');
  await page.fill('[name="email"]', 'newemail@example.com');
  await page.click('button:has-text("Save")');
  await expect(page.locator('text=Profile updated')).toBeVisible();
});
```

### TC-002: Change Password
```typescript
test('should change password', async ({ page }) => {
  await page.goto('/settings');
  await page.click('text=Security');
  await page.fill('[name="currentPassword"]', 'oldpass123');
  await page.fill('[name="newPassword"]', 'newpass123');
  await page.fill('[name="confirmPassword"]', 'newpass123');
  await page.click('button:has-text("Change Password")');
  await expect(page.locator('text=Password changed')).toBeVisible();
});
```

### TC-003: Disconnect OAuth Provider
```typescript
test('should disconnect OAuth provider if password exists', async ({ page }) => {
  await page.goto('/settings');
  await page.click('text=Connections');
  await page.click('button:has-text("Disconnect"):first');
  await expect(page.locator('text=Disconnected')).toBeVisible();
});

test('should prevent disconnect if only auth method', async ({ page }) => {
  // User has no password, only OAuth
  await page.goto('/settings');
  await page.click('text=Connections');
  await page.click('button:has-text("Disconnect"):first');
  await expect(page.locator('text=Cannot disconnect')).toBeVisible();
});
```

### TC-004: Delete Account
```typescript
test('should delete account with confirmation', async ({ page }) => {
  await page.goto('/settings');
  await page.click('text=Danger Zone');
  await page.click('button:has-text("Delete Account")');
  await page.fill('[placeholder="Type your email"]', 'user@example.com');
  await page.click('button:has-text("Confirm Deletion")');
  await expect(page).toHaveURL('/');
});
```

---

## Coverage Goals
- Unit: 80%
- E2E: Critical paths

---

**Last Updated:** 2026-01-12
