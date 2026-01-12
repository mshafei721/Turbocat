'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

import { cn } from '@/lib/utils'

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-border focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/50 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border-2 border-transparent shadow-ai-sm transition-ai outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'bg-background data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full shadow-ai-sm ring-0 transition-ai data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0',
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
