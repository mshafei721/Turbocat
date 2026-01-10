'use client'

import * as React from 'react'
import {
  Image,
  Waveform,
  Plugs,
  CreditCard,
  Cloud,
  Vibrate,
  FileText,
  Gear,
  Terminal,
  Layout,
  Selection,
  Globe,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface Feature {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  enabled?: boolean
  comingSoon?: boolean
}

const DEFAULT_FEATURES: Feature[] = [
  {
    id: 'image',
    name: 'Image',
    description: 'Upload images for context',
    icon: <Image size={18} />,
    enabled: true,
  },
  {
    id: 'audio',
    name: 'Audio',
    description: 'Voice input and audio processing',
    icon: <Waveform size={18} />,
    enabled: true,
  },
  {
    id: 'api',
    name: 'API',
    description: 'Connect external APIs',
    icon: <Plugs size={18} />,
    enabled: true,
  },
  {
    id: 'payment',
    name: 'Payment',
    description: 'Add Stripe payment integration',
    icon: <CreditCard size={18} />,
    enabled: true,
  },
  {
    id: 'cloud',
    name: 'Cloud',
    description: 'Cloud storage integration',
    icon: <Cloud size={18} />,
    enabled: true,
  },
  {
    id: 'haptics',
    name: 'Haptics',
    description: 'Mobile haptic feedback',
    icon: <Vibrate size={18} />,
    enabled: true,
  },
  {
    id: 'file',
    name: 'File',
    description: 'File upload and management',
    icon: <FileText size={18} />,
    enabled: true,
  },
  {
    id: 'env',
    name: 'Env Vars',
    description: 'Environment variables',
    icon: <Gear size={18} />,
    enabled: true,
  },
  {
    id: 'logs',
    name: 'Logs',
    description: 'View application logs',
    icon: <Terminal size={18} />,
    enabled: true,
  },
  {
    id: 'ui',
    name: 'UI',
    description: 'UI component library',
    icon: <Layout size={18} />,
    enabled: true,
  },
  {
    id: 'select',
    name: 'Select',
    description: 'Select and modify elements',
    icon: <Selection size={18} />,
    enabled: true,
  },
  {
    id: 'request',
    name: 'Request',
    description: 'HTTP request testing',
    icon: <Globe size={18} />,
    enabled: true,
  },
]

interface FeatureToolbarProps {
  features?: Feature[]
  activeFeatures?: string[]
  onFeatureToggle?: (featureId: string) => void
  onFeatureClick?: (featureId: string) => void
  className?: string
  disabled?: boolean
  variant?: 'default' | 'compact'
}

export function FeatureToolbar({
  features = DEFAULT_FEATURES,
  activeFeatures = [],
  onFeatureToggle,
  onFeatureClick,
  className,
  disabled = false,
  variant = 'default',
}: FeatureToolbarProps) {
  const handleClick = (featureId: string, feature: Feature) => {
    if (disabled || feature.comingSoon) return

    if (onFeatureClick) {
      onFeatureClick(featureId)
    } else if (onFeatureToggle) {
      onFeatureToggle(featureId)
    }
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/50 p-1',
          variant === 'compact' && 'p-0.5',
          className
        )}
      >
        {features.map((feature) => {
          const isActive = activeFeatures.includes(feature.id)

          return (
            <Tooltip key={feature.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleClick(feature.id, feature)}
                  disabled={disabled || feature.comingSoon}
                  className={cn(
                    'h-8 w-8 rounded-md text-slate-500 transition-colors',
                    'hover:bg-slate-800 hover:text-slate-300',
                    isActive && 'bg-slate-800 text-primary',
                    feature.comingSoon && 'opacity-40 cursor-not-allowed',
                    variant === 'compact' && 'h-7 w-7'
                  )}
                >
                  {feature.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="border-slate-700 bg-slate-900"
              >
                <p className="font-medium">{feature.name}</p>
                <p className="text-xs text-slate-400">{feature.description}</p>
                {feature.comingSoon && (
                  <p className="mt-1 text-xs text-amber-400">Coming soon</p>
                )}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

export default FeatureToolbar
