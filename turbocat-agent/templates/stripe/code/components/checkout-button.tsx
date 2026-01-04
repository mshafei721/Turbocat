/**
 * Stripe Checkout Button Component
 *
 * Reusable button component that triggers Stripe checkout flow.
 *
 * @file templates/stripe/code/components/checkout-button.tsx
 */

'use client'

import { useStripeCheckout } from '../hooks'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export interface CheckoutButtonProps {
  priceId: string
  children?: React.ReactNode
  successUrl?: string
  cancelUrl?: string
  mode?: 'payment' | 'subscription'
  metadata?: Record<string, string>
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  disabled?: boolean
  onSuccess?: () => void
  onError?: (error: string) => void
}

/**
 * Checkout Button Component
 *
 * Handles Stripe checkout session creation and redirect.
 *
 * @example
 * ```tsx
 * <CheckoutButton
 *   priceId="price_1234"
 *   mode="subscription"
 *   variant="default"
 * >
 *   Subscribe Now
 * </CheckoutButton>
 * ```
 */
export function CheckoutButton({
  priceId,
  children = 'Checkout',
  successUrl = `${window.location.origin}/success`,
  cancelUrl = `${window.location.origin}/pricing`,
  mode = 'payment',
  metadata,
  variant = 'default',
  size = 'default',
  className,
  disabled = false,
  onSuccess,
  onError,
}: CheckoutButtonProps) {
  const { createCheckout, isLoading, error } = useStripeCheckout()

  const handleClick = async () => {
    try {
      await createCheckout({
        priceId,
        successUrl,
        cancelUrl,
        mode,
        metadata,
      })
      onSuccess?.()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Checkout failed'
      onError?.(errorMessage)
    }
  }

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={disabled || isLoading}
        variant={variant}
        size={size}
        className={className}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </Button>
      {error && (
        <p className="mt-2 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </>
  )
}

/**
 * Simple Checkout Button (no UI library dependency)
 *
 * Use this if you don't have shadcn/ui installed.
 */
export function SimpleCheckoutButton({
  priceId,
  children = 'Checkout',
  successUrl,
  cancelUrl,
  mode = 'payment',
  metadata,
  className = '',
  disabled = false,
}: Omit<CheckoutButtonProps, 'variant' | 'size' | 'onSuccess' | 'onError'>) {
  const { createCheckout, isLoading, error } = useStripeCheckout()

  const handleClick = async () => {
    await createCheckout({
      priceId,
      successUrl:
        successUrl || `${window.location.origin}/success`,
      cancelUrl:
        cancelUrl || `${window.location.origin}/pricing`,
      mode,
      metadata,
    })
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center justify-center
          px-4 py-2 rounded-md
          bg-orange-500 text-white
          hover:bg-orange-600
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
          ${className}
        `}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
