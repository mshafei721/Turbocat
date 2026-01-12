'use client'

import * as React from 'react'
import { WarningCircle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

/**
 * FormMessage - Error Message Component (AI Native)
 *
 * Features:
 * - Accessible error announcements
 * - Icon indicator
 * - AI Native themed inline validation
 * - Smooth animations
 * - Dark mode support
 *
 * Usage:
 * <FormMessage>{error.message}</FormMessage>
 */

export interface FormMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: 'error' | 'warning' | 'info'
}

export const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className, variant = 'error', children, ...props }, ref) => {
    if (!children) {
      return null
    }

    const variantStyles = {
      error: 'text-destructive',
      warning: 'text-warning',
      info: 'text-muted-foreground',
    }

    return (
      <p
        ref={ref}
        role="alert"
        aria-live="polite"
        className={cn(
          'flex items-center gap-1.5 text-sm font-medium',
          'animate-fade-in-up',
          variantStyles[variant],
          className,
        )}
        {...props}
      >
        {variant === 'error' && <WarningCircle className="h-4 w-4" weight="fill" />}
        {children}
      </p>
    )
  },
)
FormMessage.displayName = 'FormMessage'
