# Technical Design: Referral & Monetization

**Feature:** REF-001
**Last Updated:** 2026-01-12

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ ReferralPage │  │ ReferralStats│  │ ShareButtons │      │
│  │              │  │              │  │              │      │
│  │ - Link copy  │  │ - Invited    │  │ - Social     │      │
│  │ - Share UI   │  │ - Signed up  │  │ - Email      │      │
│  │ - Stats      │  │ - Converted  │  │ - Copy       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ↓                  ↓                  ↓              │
└─────────────────────────────────────────────────────────────┘
                            │
                    REST API (HTTPS)
                            │
┌─────────────────────────────────────────────────────────────┐
│                         Backend                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              ReferralService                         │   │
│  │  - generateReferralCode()                            │   │
│  │  - trackClick()                                      │   │
│  │  - attributeSignup()                                 │   │
│  │  - rewardReferrer()                                  │   │
│  │  - getReferralStats()                                │   │
│  └──────────────────────────────────────────────────────┘   │
│         ↓                  ↓                  ↓              │
│  ┌──────────┐       ┌──────────┐      ┌──────────┐         │
│  │ Prisma   │       │ Stripe   │      │  Email   │         │
│  │ (User,   │       │ (Coupons)│      │ Service  │         │
│  │ Referral)│       │          │      │          │         │
│  └──────────┘       └──────────┘      └──────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### User Model Updates

```prisma
model User {
  id                String   @id @default(uuid())
  email             String   @unique
  name              String?

  // Referral fields
  referralCode      String   @unique @default(cuid())
  referredById      String?
  referredBy        User?    @relation("Referrals", fields: [referredById], references: [id])
  referrals         User[]   @relation("Referrals")

  // Reward tracking
  freeMonthsBalance Int      @default(0)
  freeMonthsUsed    Int      @default(0)

  // Relations
  referralClicks    ReferralClick[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### ReferralClick Model

```prisma
model ReferralClick {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  clickedAt   DateTime @default(now())
  ipAddress   String?
  userAgent   String?
  referrer    String?  // HTTP referrer header

  converted   Boolean  @default(false)
  convertedAt DateTime?
  convertedUserId String?

  @@index([userId])
  @@index([convertedUserId])
  @@index([clickedAt])
}
```

---

## Backend Implementation

### ReferralService

```typescript
// backend/src/services/ReferralService.ts

import { nanoid } from 'nanoid';
import { PrismaClient } from '@prisma/client';
import { EmailService } from './EmailService';
import { StripeService } from './StripeService';

export class ReferralService {
  constructor(
    private prisma: PrismaClient,
    private emailService: EmailService,
    private stripeService: StripeService
  ) {}

  /**
   * Generate unique referral code for user
   */
  generateReferralCode(): string {
    return nanoid(8); // ABC12XYZ format
  }

  /**
   * Track referral link click
   */
  async trackClick(
    referralCode: string,
    ipAddress: string,
    userAgent: string,
    referrer?: string
  ): Promise<{ referrerId: string; referralCode: string } | null> {
    const referrer = await this.prisma.user.findUnique({
      where: { referralCode },
    });

    if (!referrer) {
      return null;
    }

    // Check for duplicate clicks (same IP within 1 hour)
    const recentClick = await this.prisma.referralClick.findFirst({
      where: {
        userId: referrer.id,
        ipAddress,
        clickedAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // 1 hour
        },
      },
    });

    if (!recentClick) {
      await this.prisma.referralClick.create({
        data: {
          userId: referrer.id,
          ipAddress,
          userAgent,
          referrer,
        },
      });
    }

    return {
      referrerId: referrer.id,
      referralCode: referralCode,
    };
  }

  /**
   * Attribute signup to referrer
   */
  async attributeSignup(userId: string, referrerId: string): Promise<void> {
    // Update new user with referrer
    await this.prisma.user.update({
      where: { id: userId },
      data: { referredById: referrerId },
    });

    // Update referral click as converted
    await this.prisma.referralClick.updateMany({
      where: {
        userId: referrerId,
        converted: false,
        clickedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      },
      data: {
        converted: true,
        convertedAt: new Date(),
        convertedUserId: userId,
      },
    });

    // Send email to referrer
    const referrer = await this.prisma.user.findUnique({
      where: { id: referrerId },
    });

    const newUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (referrer && newUser) {
      await this.emailService.send({
        to: referrer.email,
        subject: '🎉 Your friend signed up!',
        template: 'referral-signup',
        data: {
          referrerName: referrer.name,
          friendName: newUser.name || newUser.email,
        },
      });
    }
  }

  /**
   * Reward referrer when referee subscribes
   */
  async rewardReferrer(refereeId: string): Promise<void> {
    const referee = await this.prisma.user.findUnique({
      where: { id: refereeId },
      include: { referredBy: true },
    });

    if (!referee?.referredBy) {
      return;
    }

    const referrer = referee.referredBy;

    // Award 1 free month
    await this.prisma.user.update({
      where: { id: referrer.id },
      data: { freeMonthsBalance: { increment: 1 } },
    });

    // Send congratulations email
    await this.emailService.send({
      to: referrer.email,
      subject: '🎁 You earned a free month!',
      template: 'referral-reward',
      data: {
        referrerName: referrer.name,
        friendName: referee.name || referee.email,
        freeMonthsBalance: referrer.freeMonthsBalance + 1,
      },
    });
  }

  /**
   * Get referral stats for user
   */
  async getReferralStats(userId: string): Promise<{
    invited: number;
    signedUp: number;
    subscribed: number;
    freeMonthsBalance: number;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        referralClicks: true,
        referrals: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const invited = user.referralClicks.length;
    const signedUp = user.referrals.length;
    const subscribed = user.referrals.filter(
      (r) => r.subscription && r.subscription.status === 'active'
    ).length;

    return {
      invited,
      signedUp,
      subscribed,
      freeMonthsBalance: user.freeMonthsBalance,
    };
  }

  /**
   * Apply referee discount (20% off first month)
   */
  async applyRefereeDiscount(userId: string): Promise<string> {
    // Create Stripe coupon if not exists
    const couponId = 'REF20';

    try {
      await this.stripeService.createCoupon({
        id: couponId,
        percentOff: 20,
        duration: 'once',
        name: 'Referral Discount',
      });
    } catch (error) {
      // Coupon already exists
    }

    return couponId;
  }

  /**
   * Prevent abuse: max 10 referrals per day
   */
  async checkReferralLimit(userId: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await this.prisma.referralClick.count({
      where: {
        userId,
        clickedAt: { gte: today },
      },
    });

    return count < 10;
  }
}
```

### API Routes

```typescript
// backend/src/routes/referral.routes.ts

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { ReferralService } from '../services/ReferralService';

const router = Router();
const referralService = new ReferralService(prisma, emailService, stripeService);

/**
 * GET /api/v1/referrals/me
 * Get current user's referral info
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true, freeMonthsBalance: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stats = await referralService.getReferralStats(userId);

    res.json({
      referralCode: user.referralCode,
      referralLink: `${process.env.APP_URL}?ref=${user.referralCode}`,
      stats,
    });
  } catch (error) {
    console.error('Get referral info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/v1/referrals/stats
 * Get referral stats
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const stats = await referralService.getReferralStats(req.user.id);
    res.json(stats);
  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/v1/referrals/track
 * Track referral click (public endpoint)
 */
router.post('/track', async (req, res) => {
  try {
    const { referralCode } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const referrer = req.headers['referer'];

    const result = await referralService.trackClick(
      referralCode,
      ipAddress,
      userAgent,
      referrer
    );

    if (!result) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    // Set cookie for 30 days
    res.cookie('ref', referralCode, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Track referral error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

---

## Frontend Implementation

### ReferralPage Component

```typescript
// turbocat-agent/app/(dashboard)/referral/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Mail, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReferralData {
  referralCode: string;
  referralLink: string;
  stats: {
    invited: number;
    signedUp: number;
    subscribed: number;
    freeMonthsBalance: number;
  };
}

export default function ReferralPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferralData();
  }, []);

  async function fetchReferralData() {
    try {
      const res = await fetch('/api/v1/referrals/me');
      const json = await res.json();
      setData(json);
    } catch (error) {
      toast.error('Failed to load referral data');
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!data) return;
    await navigator.clipboard.writeText(data.referralLink);
    toast.success('Referral link copied!');
  }

  function shareEmail() {
    if (!data) return;
    const subject = 'Try Turbocat - Build apps with AI';
    const body = `Hey! I've been using Turbocat to build apps with AI and it's amazing. Sign up with my link and get 20% off your first month: ${data.referralLink}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function shareTwitter() {
    if (!data) return;
    const text = `I'm building apps 10x faster with @TurbocatAI. Sign up with my link and get 20% off: ${data.referralLink}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  }

  if (loading) {
    return <div className="container py-8">Loading...</div>;
  }

  if (!data) {
    return <div className="container py-8">Failed to load referral data</div>;
  }

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-2">Refer Friends, Get Rewards</h1>
      <p className="text-muted-foreground mb-8">
        Share Turbocat with your friends and earn 1 free month for every friend who subscribes.
      </p>

      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Your Referral Link</h2>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={data.referralLink}
            readOnly
            className="flex-1 px-4 py-2 border rounded-lg bg-muted"
          />
          <Button onClick={copyLink}>
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={shareEmail}>
            <Mail className="w-4 h-4 mr-2" />
            Email
          </Button>
          <Button variant="outline" onClick={shareTwitter}>
            <Share2 className="w-4 h-4 mr-2" />
            Twitter
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="p-6 text-center">
          <div className="text-4xl font-bold mb-2">{data.stats.invited}</div>
          <div className="text-sm text-muted-foreground">Invited</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-4xl font-bold mb-2">{data.stats.signedUp}</div>
          <div className="text-sm text-muted-foreground">Signed Up</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-4xl font-bold mb-2">{data.stats.subscribed}</div>
          <div className="text-sm text-muted-foreground">Subscribed</div>
        </Card>
      </div>

      <Card className="p-6 bg-primary/5 border-primary">
        <div className="text-lg font-semibold mb-1">
          🎁 {data.stats.freeMonthsBalance} Free Months Earned
        </div>
        <p className="text-sm text-muted-foreground">
          Your rewards will be automatically applied to your next billing cycle.
        </p>
      </Card>

      <div className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold">How It Works</h2>
        <ol className="space-y-2 text-muted-foreground">
          <li>1. Share your unique link with friends</li>
          <li>2. Friends sign up and get 20% off their first month</li>
          <li>3. You earn 1 free month when they subscribe</li>
        </ol>
      </div>
    </div>
  );
}
```

### Referral Cookie Tracking

```typescript
// turbocat-agent/lib/referralTracking.ts

export async function trackReferralClick(referralCode: string): Promise<void> {
  try {
    await fetch('/api/v1/referrals/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referralCode }),
    });
  } catch (error) {
    console.error('Failed to track referral:', error);
  }
}

export function getReferralCodeFromCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(/ref=([^;]+)/);
  return match ? match[1] : null;
}

export function getReferralCodeFromURL(): string | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  return params.get('ref');
}
```

---

## Integration Points

### 1. Landing Page Integration

```typescript
// turbocat-agent/app/page.tsx

useEffect(() => {
  const refCode = getReferralCodeFromURL();
  if (refCode) {
    trackReferralClick(refCode);
  }
}, []);
```

### 2. Signup Flow Integration

```typescript
// backend/src/services/AuthService.ts

async register(email: string, password: string, referralCode?: string) {
  const user = await this.prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 12),
      referralCode: this.referralService.generateReferralCode(),
    },
  });

  // Attribute signup to referrer
  if (referralCode) {
    const referrer = await this.prisma.user.findUnique({
      where: { referralCode },
    });

    if (referrer) {
      await this.referralService.attributeSignup(user.id, referrer.id);
    }
  }

  return user;
}
```

### 3. Subscription Flow Integration

```typescript
// backend/src/services/StripeService.ts

async createCheckoutSession(userId: string, priceId: string) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: { referredBy: true },
  });

  const sessionConfig: any = {
    customer: user.stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.APP_URL}/pricing`,
  };

  // Apply referee discount (20% off)
  if (user.referredBy) {
    const coupon = await this.referralService.applyRefereeDiscount(userId);
    sessionConfig.discounts = [{ coupon }];
  }

  return this.stripe.checkout.sessions.create(sessionConfig);
}
```

### 4. Webhook Handler

```typescript
// backend/src/webhooks/stripe.webhook.ts

case 'customer.subscription.created':
  const subscription = event.data.object;
  const customer = await stripe.customers.retrieve(subscription.customer);
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customer.id },
  });

  if (user) {
    // Reward referrer
    await referralService.rewardReferrer(user.id);
  }
  break;
```

---

## Security Considerations

1. **Fraud Prevention:**
   - Track IP addresses to detect duplicate clicks
   - Limit to 10 referrals per day per user
   - Prevent self-referrals (check email/IP matching)
   - Cookie-based attribution with 30-day expiry

2. **Data Privacy:**
   - Hash IP addresses before storage
   - Do not expose referee emails to referrers
   - GDPR-compliant data retention

3. **API Security:**
   - Rate limit /track endpoint
   - Validate referral codes against database
   - Authenticate all stats/rewards endpoints

---

**Last Updated:** 2026-01-12
