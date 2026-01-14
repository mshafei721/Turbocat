# Test Plan: Referral & Monetization

**Feature:** REF-001
**Last Updated:** 2026-01-12

---

## Test Strategy

**Priority:** High
**Rationale:** Referral program directly impacts revenue and viral growth. Bugs could lead to revenue loss or fraud.

---

## Unit Tests

### ReferralService Tests

```typescript
// backend/src/services/ReferralService.test.ts

describe('ReferralService', () => {
  describe('generateReferralCode', () => {
    test('should generate 8-character code', () => {
      const code = referralService.generateReferralCode();
      expect(code).toHaveLength(8);
      expect(code).toMatch(/^[A-Za-z0-9]+$/);
    });

    test('should generate unique codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(referralService.generateReferralCode());
      }
      expect(codes.size).toBe(100);
    });
  });

  describe('trackClick', () => {
    test('should track valid referral click', async () => {
      const result = await referralService.trackClick(
        validReferralCode,
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(result).toMatchObject({
        referrerId: expect.any(String),
        referralCode: validReferralCode,
      });
    });

    test('should return null for invalid code', async () => {
      const result = await referralService.trackClick(
        'INVALID',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(result).toBeNull();
    });

    test('should deduplicate clicks from same IP within 1 hour', async () => {
      await referralService.trackClick(validCode, '192.168.1.1', 'UA');
      await referralService.trackClick(validCode, '192.168.1.1', 'UA');

      const clicks = await prisma.referralClick.findMany({
        where: { userId: referrerId },
      });

      expect(clicks).toHaveLength(1);
    });
  });

  describe('attributeSignup', () => {
    test('should link referee to referrer', async () => {
      await referralService.attributeSignup(refereeId, referrerId);

      const referee = await prisma.user.findUnique({
        where: { id: refereeId },
      });

      expect(referee.referredById).toBe(referrerId);
    });

    test('should mark referral click as converted', async () => {
      await referralService.attributeSignup(refereeId, referrerId);

      const click = await prisma.referralClick.findFirst({
        where: { userId: referrerId, convertedUserId: refereeId },
      });

      expect(click.converted).toBe(true);
      expect(click.convertedAt).toBeTruthy();
    });

    test('should send email to referrer', async () => {
      await referralService.attributeSignup(refereeId, referrerId);

      expect(emailService.send).toHaveBeenCalledWith({
        to: referrer.email,
        subject: '🎉 Your friend signed up!',
        template: 'referral-signup',
        data: expect.any(Object),
      });
    });
  });

  describe('rewardReferrer', () => {
    test('should increment free months balance', async () => {
      await referralService.rewardReferrer(refereeId);

      const referrer = await prisma.user.findUnique({
        where: { id: referrerId },
      });

      expect(referrer.freeMonthsBalance).toBe(1);
    });

    test('should send reward email', async () => {
      await referralService.rewardReferrer(refereeId);

      expect(emailService.send).toHaveBeenCalledWith({
        to: referrer.email,
        subject: '🎁 You earned a free month!',
        template: 'referral-reward',
        data: expect.any(Object),
      });
    });

    test('should handle referee without referrer', async () => {
      await expect(
        referralService.rewardReferrer(orphanUserId)
      ).resolves.not.toThrow();
    });
  });

  describe('getReferralStats', () => {
    test('should return accurate stats', async () => {
      const stats = await referralService.getReferralStats(referrerId);

      expect(stats).toMatchObject({
        invited: 15,
        signedUp: 8,
        subscribed: 3,
        freeMonthsBalance: 3,
      });
    });
  });

  describe('checkReferralLimit', () => {
    test('should allow under limit', async () => {
      const allowed = await referralService.checkReferralLimit(userId);
      expect(allowed).toBe(true);
    });

    test('should block over limit', async () => {
      // Create 10 clicks today
      for (let i = 0; i < 10; i++) {
        await prisma.referralClick.create({
          data: { userId, ipAddress: `192.168.1.${i}`, userAgent: 'UA' },
        });
      }

      const allowed = await referralService.checkReferralLimit(userId);
      expect(allowed).toBe(false);
    });
  });
});
```

---

## Integration Tests

### API Route Tests

```typescript
// backend/src/routes/referral.routes.test.ts

describe('Referral API Routes', () => {
  describe('GET /api/v1/referrals/me', () => {
    test('should return referral info for authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/referrals/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        referralCode: expect.any(String),
        referralLink: expect.stringContaining('?ref='),
        stats: {
          invited: expect.any(Number),
          signedUp: expect.any(Number),
          subscribed: expect.any(Number),
          freeMonthsBalance: expect.any(Number),
        },
      });
    });

    test('should return 401 for unauthenticated request', async () => {
      const res = await request(app).get('/api/v1/referrals/me');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/referrals/track', () => {
    test('should track click and set cookie', async () => {
      const res = await request(app)
        .post('/api/v1/referrals/track')
        .send({ referralCode: validCode });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain('ref=');
    });

    test('should return 404 for invalid code', async () => {
      const res = await request(app)
        .post('/api/v1/referrals/track')
        .send({ referralCode: 'INVALID' });

      expect(res.status).toBe(404);
    });
  });
});
```

---

## E2E Tests

### Full Referral Flow

```typescript
// turbocat-agent/tests/e2e/referral.spec.ts

test('complete referral flow: click → signup → subscribe → reward', async ({ page, context }) => {
  // Step 1: Referrer shares link
  await page.goto('/referral');
  await page.waitForSelector('text=Your Referral Link');

  const referralLink = await page.inputValue('input[value*="?ref="]');
  const referralCode = new URL(referralLink).searchParams.get('ref');

  expect(referralCode).toHaveLength(8);

  // Step 2: Referee clicks link
  const refereePage = await context.newPage();
  await refereePage.goto(referralLink);

  // Verify cookie set
  const cookies = await refereePage.context().cookies();
  const refCookie = cookies.find((c) => c.name === 'ref');
  expect(refCookie?.value).toBe(referralCode);

  // Step 3: Referee signs up
  await refereePage.goto('/signup');
  await refereePage.fill('[name="email"]', 'referee@example.com');
  await refereePage.fill('[name="password"]', 'password123');
  await refereePage.click('button:has-text("Sign up")');
  await refereePage.waitForURL('/dashboard');

  // Step 4: Verify referrer sees signup in stats
  await page.reload();
  await page.waitForSelector('text=Signed Up');
  const signedUpCount = await page.textContent('.stat-signed-up');
  expect(parseInt(signedUpCount)).toBeGreaterThan(0);

  // Step 5: Referee subscribes
  await refereePage.goto('/pricing');
  await refereePage.click('button:has-text("Subscribe")');

  // Verify 20% discount applied
  await refereePage.waitForSelector('text=20% off');

  // Complete checkout (use Stripe test mode)
  await refereePage.fill('[name="cardNumber"]', '4242424242424242');
  await refereePage.fill('[name="expiry"]', '12/25');
  await refereePage.fill('[name="cvc"]', '123');
  await refereePage.click('button:has-text("Pay")');
  await refereePage.waitForURL('/dashboard');

  // Step 6: Verify referrer earned free month
  await page.reload();
  await page.waitForSelector('text=Free Months Earned');
  const freeMonths = await page.textContent('.free-months-balance');
  expect(parseInt(freeMonths)).toBeGreaterThan(0);
});

test('copy referral link', async ({ page }) => {
  await page.goto('/referral');
  await page.click('button:has-text("Copy")');

  // Verify toast notification
  await expect(page.locator('text=Referral link copied!')).toBeVisible();
});

test('share via email', async ({ page }) => {
  await page.goto('/referral');

  // Mock mailto: link
  await page.click('button:has-text("Email")');

  // Verify mailto: link opened
  await page.waitForFunction(() => {
    return window.location.href.startsWith('mailto:');
  });
});

test('stats accuracy', async ({ page }) => {
  await page.goto('/referral');

  const invited = await page.textContent('.stat-invited');
  const signedUp = await page.textContent('.stat-signed-up');
  const subscribed = await page.textContent('.stat-subscribed');

  // Verify signed up <= invited
  expect(parseInt(signedUp)).toBeLessThanOrEqual(parseInt(invited));

  // Verify subscribed <= signed up
  expect(parseInt(subscribed)).toBeLessThanOrEqual(parseInt(signedUp));
});
```

---

## Security Tests

### Fraud Prevention

```typescript
test('should prevent self-referral', async () => {
  const user = await createUser();
  const referralCode = user.referralCode;

  // Attempt self-referral
  await request(app)
    .post('/api/v1/referrals/track')
    .send({ referralCode })
    .set('Authorization', `Bearer ${user.token}`);

  // Sign up with own referral code
  const result = await referralService.attributeSignup(user.id, user.id);

  // Should be rejected
  expect(result).toBeNull();
});

test('should enforce rate limit (10/day)', async () => {
  const promises = [];

  for (let i = 0; i < 15; i++) {
    promises.push(
      request(app)
        .post('/api/v1/referrals/track')
        .send({ referralCode: validCode })
        .set('X-Forwarded-For', `192.168.1.${i}`)
    );
  }

  const results = await Promise.all(promises);
  const successes = results.filter((r) => r.status === 200);

  expect(successes.length).toBeLessThanOrEqual(10);
});

test('should not expose referee emails to referrer', async () => {
  const res = await request(app)
    .get('/api/v1/referrals/me')
    .set('Authorization', `Bearer ${referrerToken}`);

  expect(res.body.referrals).not.toBeDefined();
});
```

---

## Manual Test Cases

### Happy Path

1. **Referrer shares link:**
   - [ ] Navigate to /referral page
   - [ ] Verify referral link displays
   - [ ] Click "Copy" button
   - [ ] Verify toast notification
   - [ ] Paste in new browser window
   - [ ] Verify URL contains `?ref=` parameter

2. **Referee clicks link:**
   - [ ] Open referral link in incognito window
   - [ ] Verify landing page loads
   - [ ] Open DevTools → Application → Cookies
   - [ ] Verify `ref` cookie set with 30-day expiry

3. **Referee signs up:**
   - [ ] Click "Sign up" button
   - [ ] Fill email/password
   - [ ] Submit form
   - [ ] Verify redirected to /dashboard
   - [ ] Verify referrer receives email notification

4. **Referee subscribes:**
   - [ ] Navigate to /pricing
   - [ ] Click "Subscribe" button
   - [ ] Verify "20% off" discount applied at checkout
   - [ ] Complete payment with test card
   - [ ] Verify subscription created in Stripe dashboard

5. **Referrer earns reward:**
   - [ ] Return to referrer's /referral page
   - [ ] Refresh page
   - [ ] Verify "Subscribed" count incremented
   - [ ] Verify "Free Months Earned" incremented
   - [ ] Verify referrer receives reward email

### Edge Cases

- [ ] Invalid referral code → 404 error
- [ ] Expired cookie (31 days old) → no attribution
- [ ] Duplicate click from same IP → deduplicated
- [ ] 11th referral in same day → blocked
- [ ] Referee without referrer subscribes → no reward
- [ ] Referee cancels subscription → free month not revoked

---

## Performance Tests

### Load Testing

```typescript
test('handle 1000 concurrent referral clicks', async () => {
  const promises = [];

  for (let i = 0; i < 1000; i++) {
    promises.push(
      request(app)
        .post('/api/v1/referrals/track')
        .send({ referralCode: validCode })
        .set('X-Forwarded-For', `10.0.${Math.floor(i / 256)}.${i % 256}`)
    );
  }

  const start = Date.now();
  await Promise.all(promises);
  const duration = Date.now() - start;

  expect(duration).toBeLessThan(5000); // < 5 seconds
});
```

---

## Coverage Goals

- **Unit Tests:** 90% coverage
- **Integration Tests:** All API routes
- **E2E Tests:** Happy path + critical edge cases
- **Manual QA:** Full flow with real Stripe test mode

---

## Rollout Strategy

1. **Dev Testing:** Full test suite + manual QA
2. **Staging Deploy:** Test with Stripe test mode
3. **Beta Launch:** Enable for 10% of users
4. **Monitor:** Track conversion rates, fraud attempts
5. **Full Launch:** Enable for 100% after 1 week

---

**Last Updated:** 2026-01-12
