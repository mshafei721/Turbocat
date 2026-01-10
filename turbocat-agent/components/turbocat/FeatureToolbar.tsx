'use client'

import * as React from 'react'
import {
  Globe,
  Code,
  Database,
  MagnifyingGlass,
  Robot,
  MagicWand,
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
  icon: React.ElementType
}

const FEATURES: Feature[] = [
  {
    id: 'web-search',
    name: 'Web Search',
    description: 'Search the web for current information',
    icon: Globe,
  },
  {
    id: 'code-interpreter',
    name: 'Code Interpreter',
    description: 'Execute and analyze code',
    icon: Code,
  },
  {
    id: 'file-analysis',
    name: 'File Analysis',
    description: 'Analyze uploaded files and documents',
    icon: MagnifyingGlass,
  },
  {
    id: 'database',
    name: 'Database',
    description: 'Query and manage data',
    icon: Database,
  },
  {
    id: 'agents',
    name: 'Agents',
    description: 'Use specialized AI agents',
    icon: Robot,
  },
  {
    id: 'auto',
    name: 'Auto',
    description: 'Let AI choose the best tools',
    icon: MagicWand,
  },
]

interface FeatureToolbarProps {
  activeFeatures?: string[]
  onFeatureClick?: (featureId: string) => void
  disabled?: boolean
  variant?: 'default' | 'compact'
  className?: string
}

export function FeatureToolbar({
  activeFeatures = [],
  onFeatureClick,
  disabled = false,
  variant = 'default',
  className,
}: FeatureToolbarProps) {
  const isCompact = variant === 'compact'

  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex items-center gap-1',
          isCompact ? 'gap-0.5' : 'gap-1',
          className
        )}
      >
        {FEATURES.map((feature) => {
          const isActive = activeFeatures.includes(feature.id)

          return (
            <Tooltip key={feature.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  onClick={() => onFeatureClick?.(feature.id)}
                  className={cn(
                    'transition-all duration-200',
                    isCompact ? 'h-7 w-7' : 'h-8 w-8',
                    isActive
                      ? 'text-primary bg-primary/10 hover:bg-primary/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <feature.icon
                    size={isCompact ? 14 : 16}
                    weight={isActive ? 'fill' : 'regular'}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px]">
                <p className="font-medium">{feature.name}</p>
                <p className="text-xs text-slate-400">{feature.description}</p>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}

export default FeatureToolbar
