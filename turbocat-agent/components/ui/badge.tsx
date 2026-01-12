import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none transition-ai overflow-hidden',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow-ai-sm [a&]:hover:bg-primary/90',
        secondary: 'border-border bg-accent/50 text-accent-foreground [a&]:hover:bg-accent',
        destructive:
          'border-transparent bg-destructive text-white shadow-ai-sm [a&]:hover:bg-destructive/90',
        outline: 'border-2 border-border text-foreground [a&]:hover:bg-muted [a&]:hover:border-primary/30',
        success: 'border-transparent bg-success text-white shadow-ai-sm [a&]:hover:bg-success/90',
        warning: 'border-transparent bg-warning text-slate-900 dark:text-slate-950 shadow-ai-sm [a&]:hover:bg-warning/90',
        accent: 'border-transparent bg-accent text-accent-foreground shadow-ai-sm [a&]:hover:bg-accent/90',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
