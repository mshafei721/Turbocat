/**
 * Stripe Server Client
 *
 * Server-side Stripe SDK setup and utility functions.
 * NEVER expose this client or secret key to the browser.
 *
 * @file templates/stripe/code/client.ts
 */

import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

/**
 * Stripe client instance
 * Only use this on the server side (API routes, server components, server actions)
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

/**
 * Create a checkout session for one-time or recurring payments
 */
export async function createCheckoutSession(params: {
  priceId: string
  customerId?: string
  successUrl: string
  cancelUrl: string
  mode?: 'payment' | 'subscription' | 'setup'
  metadata?: Record<string, string>
  subscriptionData?: {
    trialPeriodDays?: number
    metadata?: Record<string, string>
  }
}) {
  const {
    priceId,
    customerId,
    successUrl,
    cancelUrl,
    mode = 'payment',
    metadata = {},
    subscriptionData,
  } = params

  const session = await stripe.checkout.sessions.create({
    mode,
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    subscription_data: subscriptionData,
  })

  return session
}

/**
 * Create a customer in Stripe
 */
export async function createCustomer(params: {
  email: string
  name?: string
  metadata?: Record<string, string>
}) {
  const { email, name, metadata = {} } = params

  const customer = await stripe.customers.create({
    email,
    name,
    metadata,
  })

  return customer
}

/**
 * Create a subscription directly (without checkout)
 */
export async function createSubscription(params: {
  customerId: string
  priceId: string
  trialPeriodDays?: number
  metadata?: Record<string, string>
}) {
  const { customerId, priceId, trialPeriodDays, metadata = {} } = params

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: trialPeriodDays,
    metadata,
  })

  return subscription
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.cancel(subscriptionId)
  return subscription
}

/**
 * Update a subscription
 */
export async function updateSubscription(
  subscriptionId: string,
  params: {
    priceId?: string
    metadata?: Record<string, string>
  }
) {
  const { priceId, metadata } = params

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  const updatedSubscription = await stripe.subscriptions.update(
    subscriptionId,
    {
      items: priceId
        ? [
            {
              id: subscription.items.data[0].id,
              price: priceId,
            },
          ]
        : undefined,
      metadata,
    }
  )

  return updatedSubscription
}

/**
 * Create a customer portal session
 * Allows customers to manage their subscriptions, payment methods, etc.
 */
export async function createCustomerPortalSession(params: {
  customerId: string
  returnUrl: string
}) {
  const { customerId, returnUrl } = params

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

/**
 * Retrieve a subscription
 */
export async function getSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  return subscription
}

/**
 * Get customer subscriptions
 */
export async function getCustomerSubscriptions(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
  })
  return subscriptions.data
}

/**
 * Verify webhook signature
 * CRITICAL: Always verify webhooks to prevent malicious requests
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set')
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    )
    return event
  } catch (error) {
    throw new Error(
      `Webhook signature verification failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }
}

/**
 * Create a payment intent for custom checkout flows
 */
export async function createPaymentIntent(params: {
  amount: number
  currency?: string
  customerId?: string
  metadata?: Record<string, string>
}) {
  const { amount, currency = 'usd', customerId, metadata = {} } = params

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    customer: customerId,
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  })

  return paymentIntent
}

/**
 * Get product details
 */
export async function getProduct(productId: string) {
  const product = await stripe.products.retrieve(productId)
  return product
}

/**
 * Get price details
 */
export async function getPrice(priceId: string) {
  const price = await stripe.prices.retrieve(priceId)
  return price
}

/**
 * List all active products with prices
 */
export async function listProductsWithPrices() {
  const products = await stripe.products.list({
    active: true,
    expand: ['data.default_price'],
  })

  return products.data
}

/**
 * Handle common webhook events
 * Extend this based on your needs
 */
export async function handleWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      // Handle successful checkout
      console.log('Checkout completed:', session.id)
      // TODO: Fulfill order, update database, send confirmation email
      break
    }

    case 'customer.subscription.created': {
      const subscription = event.data.object as Stripe.Subscription
      // Handle new subscription
      console.log('Subscription created:', subscription.id)
      // TODO: Grant access, update user record
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      // Handle subscription update
      console.log('Subscription updated:', subscription.id)
      // TODO: Update access level, notify user
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      // Handle subscription cancellation
      console.log('Subscription deleted:', subscription.id)
      // TODO: Revoke access, update user record
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      // Handle successful payment
      console.log('Payment succeeded:', invoice.id)
      // TODO: Send receipt, update payment history
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      // Handle failed payment
      console.log('Payment failed:', invoice.id)
      // TODO: Notify user, update subscription status
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }
}
