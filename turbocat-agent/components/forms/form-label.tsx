'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * FormLabel - Enhanced Label with Required Indicator (AI Native)
 *
 * Features:
 * - Required indicator
 * - Accessible attributes
 * - AI Native styling
 * - Dark mode support
 *
 * Usage:
 * <FormLabel htmlFor="email" required>
 *   Email Address
 * </FormLabel>
 */

export interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
  disabled?: boolean
}

export const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, required, disabled, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          disabled && 'cursor-not-allowed opacity-70',
          className,
        )}
        aria-required={required}
        {...props}
      >
        {children}
        {required && (
          <span
            className="ml-1 text-destructive"
            aria-label="required"
            role="presentation"
          >
            *
          </span>
        )}
      </label>
    )
  },
)
FormLabel.displayName = 'FormLabel'
