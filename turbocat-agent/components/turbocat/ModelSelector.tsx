'use client'

import * as React from 'react'
import { CaretDown, Check, Brain, Lightning, Sparkle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface Model {
  id: string
  name: string
  description: string
  icon: React.ElementType
  tier: 'free' | 'pro' | 'enterprise'
}

const MODELS: Model[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Most capable, best for complex tasks',
    icon: Brain,
    tier: 'pro',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast and efficient for most tasks',
    icon: Lightning,
    tier: 'free',
  },
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Great for code and reasoning',
    icon: Sparkle,
    tier: 'pro',
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    description: 'Quick responses, good balance',
    icon: Lightning,
    tier: 'free',
  },
]

interface ModelSelectorProps {
  selectedModel?: string
  onModelChange?: (modelId: string) => void
  disabled?: boolean
  className?: string
}

export function ModelSelector({
  selectedModel = 'gpt-4o-mini',
  onModelChange,
  disabled = false,
  className,
}: ModelSelectorProps) {
  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[1]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={cn(
            'h-8 gap-2 px-3 text-slate-300 hover:text-white hover:bg-slate-800',
            'border border-slate-700 rounded-lg',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          <currentModel.icon size={14} weight="duotone" />
          <span className="text-xs font-medium">{currentModel.name}</span>
          <CaretDown size={12} className="text-slate-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-64 bg-slate-900 border-slate-700"
      >
        {MODELS.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => onModelChange?.(model.id)}
            className={cn(
              'flex items-start gap-3 p-3 cursor-pointer',
              'hover:bg-slate-800 focus:bg-slate-800',
              model.id === selectedModel && 'bg-slate-800/50'
            )}
          >
            <model.icon
              size={18}
              weight="duotone"
              className={cn(
                'mt-0.5 shrink-0',
                model.id === selectedModel ? 'text-primary' : 'text-slate-400'
              )}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-sm font-medium',
                    model.id === selectedModel ? 'text-white' : 'text-slate-200'
                  )}
                >
                  {model.name}
                </span>
                {model.tier === 'pro' && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{model.description}</p>
            </div>
            {model.id === selectedModel && (
              <Check size={16} className="text-primary shrink-0 mt-0.5" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ModelSelector
