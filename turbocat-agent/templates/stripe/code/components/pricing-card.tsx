/**
 * Pricing Card Component
 *
 * Display pricing plans with Stripe integration.
 *
 * @file templates/stripe/code/components/pricing-card.tsx
 */

'use client'

import { CheckoutButton } from './checkout-button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PricingCardProps {
  name: string
  description?: string
  price: number
  currency?: string
  interval?: 'month' | 'year' | 'week' | 'day'
  features: string[]
  priceId: string
  highlighted?: boolean
  popular?: boolean
  className?: string
  buttonText?: string
  mode?: 'payment' | 'subscription'
  trialDays?: number
}

/**
 * Pricing Card Component
 *
 * Displays a pricing plan with features and checkout button.
 *
 * @example
 * ```tsx
 * <PricingCard
 *   name="Pro Plan"
 *   description="Perfect for growing teams"
 *   price={29}
 *   interval="month"
 *   features={[
 *     'Unlimited projects',
 *     'Advanced analytics',
 *     'Priority support',
 *     'Custom integrations',
 *   ]}
 *   priceId="price_1234"
 *   highlighted={true}
 *   popular={true}
 * />
 * ```
 */
export function PricingCard({
  name,
  description,
  price,
  currency = 'USD',
  interval = 'month',
  features,
  priceId,
  highlighted = false,
  popular = false,
  className,
  buttonText,
  mode = 'subscription',
  trialDays,
}: PricingCardProps) {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(price)

  return (
    <Card
      className={cn(
        'relative flex flex-col',
        highlighted && 'border-orange-500 border-2',
        className
      )}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white">
            Most Popular
          </span>
        </div>
      )}

      <CardHeader>
        <CardTitle className="text-2xl">{name}</CardTitle>
        {description && (
          <CardDescription className="text-base">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="flex-1">
        <div className="mb-6">
          <span className="text-4xl font-bold">{formattedPrice}</span>
          {interval && (
            <span className="text-muted-foreground ml-2">
              / {interval}
            </span>
          )}
        </div>

        {trialDays && (
          <p className="mb-4 text-sm text-muted-foreground">
            {trialDays} day free trial
          </p>
        )}

        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <CheckoutButton
          priceId={priceId}
          mode={mode}
          variant={highlighted ? 'default' : 'outline'}
          size="lg"
          className="w-full"
        >
          {buttonText || (mode === 'subscription' ? 'Subscribe' : 'Buy Now')}
        </CheckoutButton>
      </CardFooter>
    </Card>
  )
}

/**
 * Simple Pricing Card (no UI library dependency)
 *
 * Use this if you don't have shadcn/ui installed.
 */
export function SimplePricingCard({
  name,
  description,
  price,
  currency = 'USD',
  interval = 'month',
  features,
  priceId,
  highlighted = false,
  popular = false,
  className = '',
  buttonText,
  mode = 'subscription',
}: PricingCardProps) {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(price)

  return (
    <div
      className={`
        relative flex flex-col
        rounded-lg border p-6
        ${highlighted ? 'border-orange-500 border-2' : 'border-gray-200'}
        ${className}
      `}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">{name}</h3>
        {description && (
          <p className="text-gray-600 text-sm">{description}</p>
        )}
      </div>

      <div className="mb-6">
        <span className="text-4xl font-bold">{formattedPrice}</span>
        {interval && (
          <span className="text-gray-500 ml-2">/ {interval}</span>
        )}
      </div>

      <ul className="space-y-3 mb-8 flex-1">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <svg
              className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => {
          // Redirect to checkout with priceId
          window.location.href = `/checkout?priceId=${priceId}&mode=${mode}`
        }}
        className={`
          w-full py-3 px-4 rounded-md font-medium
          transition-colors
          ${
            highlighted
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'border border-gray-300 hover:bg-gray-50'
          }
        `}
      >
        {buttonText || (mode === 'subscription' ? 'Subscribe' : 'Buy Now')}
      </button>
    </div>
  )
}
