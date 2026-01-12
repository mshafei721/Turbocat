import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground',
        'flex field-sizing-content min-h-24 w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-base',
        'shadow-ai-sm transition-ai outline-none resize-none',
        'disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'hover:border-primary/30 hover:shadow-ai-md',
        'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/50',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
