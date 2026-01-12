'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: 'rounded-xl border-2 border-border shadow-ai-lg transition-ai',
          title: 'font-medium',
          description: 'text-muted-foreground',
          success: 'border-success/30 bg-card',
          error: 'border-destructive/30 bg-card',
          warning: 'border-warning/30 bg-card',
          info: 'border-primary/30 bg-card',
        },
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
