# Stripe Integration Template

Complete Stripe payment integration for Next.js applications with React components, hooks, and server-side utilities.

## Quick Start

### 1. Install Dependencies

```bash
npm install stripe @stripe/stripe-js
```

### 2. Configure Environment Variables

Copy the environment template:

```bash
cp templates/stripe/env/.env.template .env.local
```

Add your Stripe API keys from [Stripe Dashboard](https://dashboard.stripe.com/apikeys):

```env
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

### 3. Copy Template Files

Use the template loader or manually copy files:

```bash
# Using template loader
npx tsx scripts/load-template.ts stripe

# Or manually
cp -r templates/stripe/code/* lib/stripe/
```

### 4. Create API Routes

Create the following API routes in your Next.js app:

#### `/app/api/stripe/checkout/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe/client'
import { getServerSession } from 'next-auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { priceId, successUrl, cancelUrl, mode } = await request.json()

    const checkoutSession = await createCheckoutSession({
      priceId,
      successUrl: successUrl || `${process.env.NEXT_PUBLIC_URL}/success`,
      cancelUrl: cancelUrl || `${process.env.NEXT_PUBLIC_URL}/pricing`,
      mode: mode || 'payment',
      metadata: {
        userId: session.user.id,
      },
    })

    return NextResponse.json({ sessionId: checkoutSession.id })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
```

#### `/app/api/stripe/webhooks/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature, handleWebhookEvent } from '@/lib/stripe/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    // Verify webhook signature
    const event = verifyWebhookSignature(body, signature)

    // Handle the event
    await handleWebhookEvent(event)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    )
  }
}
```

### 5. Setup Stripe Webhook

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to Stripe CLI: `stripe login`
3. Forward webhooks to your local server:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

4. Copy the webhook signing secret to your `.env.local`

## Usage Examples

### Checkout Button

```tsx
import { CheckoutButton } from '@/lib/stripe/components/checkout-button'

export function SubscribeButton() {
  return (
    <CheckoutButton
      priceId="price_1234567890"
      mode="subscription"
      variant="default"
    >
      Subscribe Now
    </CheckoutButton>
  )
}
```

### Pricing Card

```tsx
import { PricingCard } from '@/lib/stripe/components/pricing-card'

export function PricingPage() {
  return (
    <div className="grid md:grid-cols-3 gap-8">
      <PricingCard
        name="Starter"
        description="Perfect for individuals"
        price={9}
        interval="month"
        features={[
          '10 projects',
          'Basic analytics',
          'Email support',
        ]}
        priceId="price_starter"
      />

      <PricingCard
        name="Pro"
        description="For growing teams"
        price={29}
        interval="month"
        features={[
          'Unlimited projects',
          'Advanced analytics',
          'Priority support',
          'Custom integrations',
        ]}
        priceId="price_pro"
        highlighted={true}
        popular={true}
      />

      <PricingCard
        name="Enterprise"
        description="For large organizations"
        price={99}
        interval="month"
        features={[
          'Everything in Pro',
          'Dedicated support',
          'SLA guarantee',
          'Custom contracts',
        ]}
        priceId="price_enterprise"
      />
    </div>
  )
}
```

### Custom Checkout Flow

```tsx
import { useStripeCheckout } from '@/lib/stripe/hooks'

export function CustomCheckout() {
  const { createCheckout, isLoading, error } = useStripeCheckout()

  const handleCheckout = async () => {
    await createCheckout({
      priceId: 'price_1234567890',
      successUrl: '/success?session_id={CHECKOUT_SESSION_ID}',
      cancelUrl: '/pricing',
      mode: 'subscription',
      metadata: {
        customField: 'value',
      },
    })
  }

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : 'Checkout'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  )
}
```

### Customer Portal

```tsx
import { useCustomerPortal } from '@/lib/stripe/hooks'

export function ManageSubscription() {
  const { openPortal, isLoading } = useCustomerPortal()

  return (
    <button
      onClick={() => openPortal('/dashboard')}
      disabled={isLoading}
    >
      Manage Subscription
    </button>
  )
}
```

## Stripe Dashboard Setup

### 1. Create Products

1. Go to [Products](https://dashboard.stripe.com/products)
2. Click "Add product"
3. Enter product details
4. Set pricing (one-time or recurring)
5. Save and copy the Price ID

### 2. Configure Customer Portal

1. Go to [Customer Portal](https://dashboard.stripe.com/settings/billing/portal)
2. Enable customer portal
3. Configure features:
   - Invoice history
   - Update payment method
   - Cancel subscription
4. Set up custom branding

### 3. Setup Webhooks

1. Go to [Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/stripe/webhooks`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the signing secret

## Testing

### Test Cards

Stripe provides test cards for different scenarios:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`
- **Insufficient Funds**: `4000 0000 0000 9995`

Use any future expiry date and any CVC.

### Test Webhooks

```bash
# Listen for webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhooks

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

## Production Checklist

- [ ] Replace test API keys with live keys
- [ ] Update webhook endpoint to production URL
- [ ] Configure customer portal branding
- [ ] Set up proper error logging
- [ ] Implement fraud prevention
- [ ] Add monitoring and alerts
- [ ] Test all payment flows
- [ ] Review Stripe Dashboard settings
- [ ] Enable relevant Stripe features (tax, billing, etc.)
- [ ] Set up proper database sync for subscriptions

## Security Best Practices

### Environment Variables

- Never commit `.env` files
- Use different keys for development and production
- Rotate API keys regularly
- Use read-only keys where possible

### Webhook Verification

- Always verify webhook signatures
- Use the raw request body for verification
- Handle webhook events idempotently
- Log failed verifications

### Client-Side Security

- Never expose secret keys to client
- Use publishable keys only in frontend
- Validate all inputs server-side
- Use HTTPS in production

## Troubleshooting

### "No such price" Error

- Verify price ID is correct
- Check you're using the right environment (test/live)
- Ensure price is active in Stripe Dashboard

### Webhook Signature Verification Failed

- Check webhook secret is correct
- Ensure raw body is passed to verification
- Verify webhook endpoint URL is correct
- Check Stripe CLI is forwarding to correct port

### Checkout Not Redirecting

- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- Check browser console for errors
- Ensure success/cancel URLs are valid
- Test with Stripe test mode first

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Test Cards](https://stripe.com/docs/testing)
- [Webhook Events](https://stripe.com/docs/api/events/types)

## Support

For issues or questions:
- Check [Stripe Documentation](https://stripe.com/docs)
- Visit [Stripe Support](https://support.stripe.com)
- Ask in [Stripe Discord](https://discord.gg/stripe)
