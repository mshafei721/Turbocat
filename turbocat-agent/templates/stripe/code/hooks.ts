/**
 * Stripe React Hooks
 *
 * Client-side hooks for Stripe checkout and payment flows.
 *
 * @file templates/stripe/code/hooks.ts
 */

'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

/**
 * Hook for creating and redirecting to Stripe Checkout
 */
export function useStripeCheckout() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createCheckout = async (params: {
    priceId: string
    successUrl?: string
    cancelUrl?: string
    mode?: 'payment' | 'subscription'
    metadata?: Record<string, string>
  }) => {
    setIsLoading(true)
    setError(null)

    try {
      // Call your API route to create checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { sessionId } = await response.json()

      // Redirect to Stripe Checkout
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      const { error: redirectError } = await stripe.redirectToCheckout({
        sessionId,
      })

      if (redirectError) {
        throw new Error(redirectError.message)
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Checkout error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const redirectToCheckout = async (sessionId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      const { error: redirectError } = await stripe.redirectToCheckout({
        sessionId,
      })

      if (redirectError) {
        throw new Error(redirectError.message)
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Redirect error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createCheckout,
    redirectToCheckout,
    isLoading,
    error,
  }
}

/**
 * Hook for managing customer portal
 */
export function useCustomerPortal() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openPortal = async (returnUrl?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ returnUrl }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create portal session')
      }

      const { url } = await response.json()

      // Redirect to customer portal
      window.location.href = url
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Portal error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    openPortal,
    isLoading,
    error,
  }
}

/**
 * Hook for fetching subscription status
 */
export function useSubscription() {
  const [subscription, setSubscription] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/subscription')

      if (!response.ok) {
        throw new Error('Failed to fetch subscription')
      }

      const data = await response.json()
      setSubscription(data.subscription)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Subscription fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const cancelSubscription = async (subscriptionId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/subscription', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId }),
      })

      if (!response.ok) {
        throw new Error('Failed to cancel subscription')
      }

      await fetchSubscription()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Subscription cancel error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    subscription,
    fetchSubscription,
    cancelSubscription,
    isLoading,
    error,
  }
}

/**
 * Hook for fetching pricing information
 */
export function usePricing() {
  const [prices, setPrices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPrices = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/prices')

      if (!response.ok) {
        throw new Error('Failed to fetch prices')
      }

      const data = await response.json()
      setPrices(data.prices)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Prices fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    prices,
    fetchPrices,
    isLoading,
    error,
  }
}
