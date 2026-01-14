# Development Tasks: Referral & Monetization

**Feature:** REF-001
**Total Effort:** 4-5 days

---

## Tasks

### Phase 1: Database & Backend (Day 1)

1. **Database Migration** (1h)
   - Add `referralCode`, `referredById`, `freeMonthsBalance` to User model
   - Create ReferralClick model
   - Add indexes for performance
   - Test migration on dev database

2. **ReferralService Implementation** (3h)
   - `generateReferralCode()` - nanoid(8)
   - `trackClick()` - track clicks with IP/UA deduplication
   - `attributeSignup()` - link referee to referrer
   - `rewardReferrer()` - increment free months balance
   - `getReferralStats()` - calculate invited/signed/subscribed counts
   - `checkReferralLimit()` - fraud prevention (10/day)

3. **API Routes** (2h)
   - GET `/api/v1/referrals/me` - get referral code and stats
   - GET `/api/v1/referrals/stats` - get stats only
   - POST `/api/v1/referrals/track` - track click (public)
   - Add authentication middleware
   - Add rate limiting

### Phase 2: Stripe Integration (Day 2)

4. **Referee Discount** (2h)
   - Create Stripe coupon "REF20" (20% off, once)
   - Update checkout session creation to apply coupon
   - Test coupon application in Stripe dashboard

5. **Referrer Reward** (2h)
   - Add webhook handler for `customer.subscription.created`
   - Call `rewardReferrer()` on subscription creation
   - Update user's `freeMonthsBalance`
   - Test webhook with Stripe CLI

6. **Free Month Application** (2h)
   - Logic to apply free months to next billing cycle
   - Update subscription renewal webhook
   - Decrement `freeMonthsBalance`, increment `freeMonthsUsed`

### Phase 3: Frontend (Day 3)

7. **Referral Page** (3h)
   - Create `/referral` route
   - Implement ReferralPage component
   - Referral link display with copy button
   - Share buttons (Email, Twitter, LinkedIn, WhatsApp)
   - Stats cards (Invited, Signed Up, Subscribed)
   - Rewards balance display

8. **Cookie Tracking** (1h)
   - Implement `trackReferralClick()` client utility
   - Add URL param detection on landing page
   - Set 30-day cookie on click
   - Test cookie persistence

9. **Signup Flow Integration** (2h)
   - Read referral cookie during signup
   - Pass to backend AuthService
   - Attribute signup to referrer
   - Show "You'll get 20% off" message

### Phase 4: Email Notifications (Day 4)

10. **Email Templates** (2h)
    - `referral-signup.html` - "Your friend signed up!"
    - `referral-reward.html` - "You earned a free month!"
    - Add Resend/SendGrid templates
    - Test email rendering

11. **Email Service Integration** (1h)
    - Call EmailService from ReferralService
    - Send on signup attribution
    - Send on subscription conversion
    - Add unsubscribe links

12. **In-App Notifications** (1h)
    - Toast notification when reward earned
    - Badge on referral menu item with count
    - Notification center entry

### Phase 5: Analytics & Testing (Day 5)

13. **Analytics Events** (2h)
    - Track `referral_link_clicked`
    - Track `referral_signup`
    - Track `referral_conversion`
    - Dashboard for referral funnel metrics

14. **Unit Tests** (2h)
    - ReferralService methods
    - Cookie tracking utilities
    - Fraud prevention logic

15. **E2E Tests** (2h)
    - Full referral flow: click → signup → subscribe
    - Stats accuracy validation
    - Reward application

16. **Security Testing** (1h)
    - Test self-referral prevention
    - Test rate limiting
    - Test coupon application security

---

## Daily Breakdown

### Day 1: Backend Foundation
**Morning:**
- Database migration
- ReferralService scaffolding

**Afternoon:**
- Complete ReferralService methods
- API routes + tests

### Day 2: Payments Integration
**Morning:**
- Stripe coupon creation
- Checkout session integration

**Afternoon:**
- Webhook handlers
- Free month application logic

### Day 3: Frontend
**Morning:**
- Referral page UI
- Copy/share functionality

**Afternoon:**
- Cookie tracking
- Signup flow integration

### Day 4: Notifications
**Morning:**
- Email templates
- Email service integration

**Afternoon:**
- In-app notifications
- Testing notifications

### Day 5: Polish & Testing
**Morning:**
- Analytics integration
- Unit tests

**Afternoon:**
- E2E tests
- Security testing
- QA

---

## Dependencies

### External Services
- **Stripe:** Create test account, configure webhooks
- **Email Service:** Resend or SendGrid account
- **Analytics:** Mixpanel or Posthog account

### Internal
- Existing AuthService (signup flow)
- Existing StripeService (checkout sessions)
- Existing EmailService (notifications)

---

## Acceptance Criteria

- [ ] Unique referral code generated per user
- [ ] Referral link clickable and trackable
- [ ] Cookie persists for 30 days
- [ ] Signup attributed to referrer
- [ ] Referee receives 20% discount on first payment
- [ ] Referrer receives 1 free month on conversion
- [ ] Stats accurate (invited/signed/subscribed)
- [ ] Email notifications sent
- [ ] Fraud prevention active (10/day limit)
- [ ] All tests passing

---

**Total:** 27 hours (4-5 days)
**Priority:** P3 (Revenue driver, but not blocking)
