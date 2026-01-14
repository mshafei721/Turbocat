# Feature Specification: Referral & Monetization

**Epic:** Referral & Monetization
**Feature ID:** REF-001
**Status:** Planned
**Priority:** P3 (Low - Revenue Driver)
**Effort:** Medium (4-5 days)
**Owner:** TBD

---

## Overview

Implement referral program where existing users can invite friends and earn rewards (free months, credits, or cash). This drives viral growth and reduces customer acquisition cost while rewarding loyal users.

---

## Business Context

### Problem
- Customer acquisition cost (CAC) is high
- No viral/word-of-mouth growth mechanism
- Users have no incentive to share Turbocat
- Competitors have referral programs

### Opportunity
- **Reduce CAC by 40%** (referral programs industry average)
- **Increase signups by 25%** through existing users
- **Improve retention:** Users who refer stay 2x longer
- **Revenue:** Referrals convert to paid at 35% vs 20% organic

### Success Metrics
- **Primary:** 30% of active users generate at least 1 referral
- **Secondary:** Referral conversion rate > 25%
- **Virality:** Viral coefficient k > 0.3 (each user brings 0.3 new users)
- **Revenue:** 20% of new paid customers come from referrals

---

## User Stories

### US-016: Referral Program
**As a** user who loves Turbocat
**I want to** invite my friends and earn rewards
**So that** I can get free premium features

**Acceptance Criteria:**
- [ ] User can access referral page from user menu or settings
- [ ] User sees unique referral link
- [ ] User can copy link with one click
- [ ] User sees referral stats: invited, signed up, converted
- [ ] User sees reward balance: free months earned
- [ ] Referral link works for new signups
- [ ] Referee gets 20% discount on first month
- [ ] Referrer gets 1 free month after referee subscribes
- [ ] Email sent to referrer when referee converts

---

## Functional Requirements

### Referral Link Generation
1. **FR-001:** System MUST generate unique referral code per user
2. **FR-002:** Referral code MUST be 8 characters (alphanumeric)
3. **FR-003:** Referral link format: turbocat.ai?ref=ABC12XYZ
4. **FR-004:** System MUST track referral code usage

### Referral Tracking
5. **FR-005:** System MUST record when user clicks referral link
6. **FR-006:** System MUST attribute signup to referrer via cookie
7. **FR-007:** Cookie MUST last 30 days
8. **FR-008:** System MUST track referral funnel: click → signup → paid

### Reward System
9. **FR-009:** Referee MUST receive 20% discount on first payment
10. **FR-010:** Referrer MUST receive 1 free month after referee subscribes
11. **FR-011:** System MUST update referrer's account balance
12. **FR-012:** System MUST prevent self-referrals
13. **FR-013:** System MUST prevent abuse (max 10 referrals/day)

### Notification System
14. **FR-014:** System MUST email referrer on referee signup
15. **FR-015:** System MUST email referrer on referee conversion
16. **FR-016:** System MUST show in-app notification for rewards

---

## UI/UX Specifications

### Referral Page Design
```
┌─────────────────────────────────────────────────────────────┐
│  Refer Friends, Get Rewards                                 │
│                                                             │
│  Share Turbocat with your friends and earn 1 free month    │
│  for every friend who subscribes.                           │
│                                                             │
│  Your Referral Link:                                        │
│  ┌──────────────────────────────────────┐                  │
│  │ https://turbocat.ai?ref=ABC12XYZ    │ [Copy]           │
│  └──────────────────────────────────────┘                  │
│                                                             │
│  Share via:  [Email] [Twitter] [LinkedIn] [WhatsApp]       │
│                                                             │
│  Your Stats:                                                │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐            │
│  │     15     │ │      8     │ │      3     │            │
│  │  Invited   │ │ Signed Up  │ │ Subscribed │            │
│  └────────────┘ └────────────┘ └────────────┘            │
│                                                             │
│  Rewards Earned:  🎁  3 Free Months                         │
│                                                             │
│  How It Works:                                              │
│  1. Share your unique link with friends                     │
│  2. Friends sign up and get 20% off                         │
│  3. You earn 1 free month when they subscribe               │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Approach

### Backend

**Database Schema:**
```prisma
model User {
  referralCode      String   @unique
  referredById      String?
  referredBy        User?    @relation("Referrals", fields: [referredById], references: [id])
  referrals         User[]   @relation("Referrals")

  freeMonthsBalance Int      @default(0)

  referralClicks    ReferralClick[]
}

model ReferralClick {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  clickedAt   DateTime @default(now())
  ipAddress   String?
  userAgent   String?
  converted   Boolean  @default(false)
  convertedAt DateTime?

  @@index([userId])
}
```

**ReferralService:**
```typescript
export class ReferralService {
  generateReferralCode(): string {
    return nanoid(8); // Generates 8-char code
  }

  async trackClick(referralCode: string, ipAddress: string, userAgent: string) {
    const referrer = await this.prisma.user.findUnique({
      where: { referralCode },
    });

    if (!referrer) return;

    await this.prisma.referralClick.create({
      data: {
        userId: referrer.id,
        ipAddress,
        userAgent,
      },
    });

    // Set cookie for 30 days
    return { referrerId: referrer.id };
  }

  async attributeSignup(userId: string, referrerId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { referredById: referrerId },
    });

    // Send email to referrer
    await this.emailService.send({
      to: referrer.email,
      subject: 'Your friend signed up!',
      template: 'referral-signup',
    });
  }

  async rewardReferrer(referrerId: string) {
    await this.prisma.user.update({
      where: { id: referrerId },
      data: { freeMonthsBalance: { increment: 1 } },
    });

    // Send email
    // In-app notification
  }
}
```

---

## Dependencies
- **Stripe** - Apply discount codes for referees
- **Email Service** - Referral notifications
- **Analytics** - Track referral funnel

---

## Rollout Plan
- **Day 1-2:** Backend (schema, service, API)
- **Day 3-4:** Frontend (referral page, tracking)
- **Day 5:** Testing, analytics integration

---

## Success Criteria
- [ ] Referral links work end-to-end
- [ ] Rewards applied correctly
- [ ] Analytics tracking functional
- [ ] Email notifications sent
- [ ] 30% of users share link within 30 days

---

**Last Updated:** 2026-01-12
**Status:** Ready for Implementation
