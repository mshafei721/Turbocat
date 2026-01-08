import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'placeholder:text-muted-foreground',
        'flex field-sizing-content min-h-24 w-full rounded-[10px] border border-slate-700 bg-slate-900/50 px-4 py-3 text-base',
        'shadow-sm transition-all duration-200 outline-none resize-none',
        'disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'hover:border-slate-600 hover:bg-slate-900/70',
        'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-slate-900',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
