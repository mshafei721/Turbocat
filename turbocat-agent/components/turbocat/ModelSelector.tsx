'use client'

import * as React from 'react'
import { CaretDown, Check, Sparkle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface AIModel {
  id: string
  name: string
  provider: 'anthropic' | 'openai' | 'google'
  description: string
  icon?: React.ReactNode
  isDefault?: boolean
  isPremium?: boolean
}

const DEFAULT_MODELS: AIModel[] = [
  {
    id: 'claude-opus-4-5',
    name: 'Claude Opus 4.5',
    provider: 'anthropic',
    description: 'Most capable model for complex tasks',
    isDefault: true,
    isPremium: true,
  },
  {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    description: 'Fast and intelligent for everyday tasks',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'OpenAI multimodal model',
    isPremium: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: 'Fast and cost-effective',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    description: 'Google fastest model',
  },
]

interface ModelSelectorProps {
  models?: AIModel[]
  selectedModel?: string
  onModelChange?: (modelId: string) => void
  className?: string
  disabled?: boolean
}

export function ModelSelector({
  models = DEFAULT_MODELS,
  selectedModel,
  onModelChange,
  className,
  disabled = false,
}: ModelSelectorProps) {
  const [selected, setSelected] = React.useState<string>(
    selectedModel || models.find(m => m.isDefault)?.id || models[0]?.id || ''
  )

  const currentModel = models.find(m => m.id === selected)

  const handleSelect = (modelId: string) => {
    setSelected(modelId)
    onModelChange?.(modelId)
  }

  const getProviderIcon = (provider: AIModel['provider']) => {
    switch (provider) {
      case 'anthropic':
        return (
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
            <path d="M17.604 3.293L12 15.707L6.396 3.293H3l9 18l9-18h-3.396z" />
          </svg>
        )
      case 'openai':
        return (
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
            <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
          </svg>
        )
      case 'google':
        return (
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        )
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          {currentModel && getProviderIcon(currentModel.provider)}
          <span className="max-w-[120px] truncate">{currentModel?.name || 'Select Model'}</span>
          <CaretDown size={14} className="text-slate-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-64 border-slate-700 bg-slate-900"
      >
        <DropdownMenuLabel className="text-xs text-slate-500">
          AI Models
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-800" />
        {models.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => handleSelect(model.id)}
            className="flex items-start gap-3 rounded-md px-3 py-2.5 cursor-pointer hover:bg-slate-800 focus:bg-slate-800"
          >
            <div className="mt-0.5 text-slate-400">
              {getProviderIcon(model.provider)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-200 truncate">
                  {model.name}
                </span>
                {model.isPremium && (
                  <Sparkle size={12} weight="fill" className="text-amber-400" />
                )}
              </div>
              <p className="text-xs text-slate-500 truncate">
                {model.description}
              </p>
            </div>
            {selected === model.id && (
              <Check size={16} className="mt-0.5 text-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default ModelSelector
