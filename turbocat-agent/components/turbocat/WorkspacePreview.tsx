'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  DeviceMobile,
  Desktop,
  ArrowsClockwise,
  ArrowSquareOut,
  Info,
  Spinner,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface WorkspacePreviewProps {
  previewUrl?: string
  platform?: 'web' | 'mobile'
  isLoading?: boolean
  onOpenInNew?: () => void
  onRefresh?: () => void
  className?: string
}

export function WorkspacePreview({
  previewUrl,
  platform = 'mobile',
  isLoading = false,
  onOpenInNew,
  onRefresh,
  className,
}: WorkspacePreviewProps) {
  const [currentPlatform, setCurrentPlatform] = React.useState(platform)

  return (
    <div className={cn('flex h-full flex-col bg-slate-900/50', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        {/* Platform Tabs */}
        <Tabs value={currentPlatform} onValueChange={(v) => setCurrentPlatform(v as 'web' | 'mobile')}>
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="mobile" className="gap-2">
              <DeviceMobile size={16} />
              Mobile
            </TabsTrigger>
            <TabsTrigger value="web" className="gap-2">
              <Desktop size={16} />
              Web
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-slate-400"
            onClick={onOpenInNew}
          >
            <ArrowSquareOut size={16} />
            Open on {currentPlatform === 'mobile' ? 'mobile' : 'web'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400"
            onClick={onRefresh}
          >
            <ArrowsClockwise size={18} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex flex-1 items-center justify-center p-8">
        {currentPlatform === 'mobile' ? (
          <MobilePreview
            previewUrl={previewUrl}
            isLoading={isLoading}
          />
        ) : (
          <WebPreview
            previewUrl={previewUrl}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Info Banner */}
      <div className="border-t border-slate-800 px-4 py-3">
        <div className="flex items-start gap-3 rounded-lg bg-slate-800/50 p-3 text-xs text-slate-400">
          <Info size={16} className="mt-0.5 shrink-0 text-slate-500" />
          <p>
            Preview may not be fully accurate. Test on a real device for the best experience.
          </p>
        </div>
      </div>
    </div>
  )
}

function MobilePreview({ previewUrl, isLoading }: { previewUrl?: string; isLoading?: boolean }) {
  return (
    <div className="relative w-[280px]">
      {/* Phone Frame */}
      <div className="relative overflow-hidden rounded-[40px] border-2 border-slate-700 bg-slate-950 p-2 shadow-2xl">
        {/* Notch */}
        <div className="absolute left-1/2 top-4 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-slate-800" />

        {/* Screen */}
        <div className="aspect-[9/19.5] overflow-hidden rounded-[32px] bg-slate-900">
          {isLoading || !previewUrl ? (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              {isLoading && <Spinner size={32} className="animate-spin text-slate-600" />}
              <p className="text-sm text-slate-500">
                {isLoading ? 'Loading preview...' : 'No preview available'}
              </p>
            </div>
          ) : (
            <iframe
              src={previewUrl}
              className="h-full w-full"
              title="Mobile Preview"
            />
          )}
        </div>
      </div>

      {/* Glow effect */}
      <div className="absolute -inset-4 -z-10 rounded-full bg-teal-500/5 blur-2xl" />
    </div>
  )
}

function WebPreview({ previewUrl, isLoading }: { previewUrl?: string; isLoading?: boolean }) {
  return (
    <div className="w-full max-w-3xl">
      {/* Browser Frame */}
      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Browser Bar */}
        <div className="flex items-center gap-2 border-b border-slate-800 px-3 py-2">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-slate-700" />
            <div className="h-3 w-3 rounded-full bg-slate-700" />
            <div className="h-3 w-3 rounded-full bg-slate-700" />
          </div>
          <div className="flex-1 rounded-md bg-slate-800 px-3 py-1 text-xs text-slate-500">
            {previewUrl || 'https://preview.turbocat.app'}
          </div>
        </div>

        {/* Content */}
        <div className="aspect-video bg-slate-950">
          {isLoading || !previewUrl ? (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              {isLoading && <Spinner size={32} className="animate-spin text-slate-600" />}
              <p className="text-sm text-slate-500">
                {isLoading ? 'Loading preview...' : 'No preview available'}
              </p>
            </div>
          ) : (
            <iframe
              src={previewUrl}
              className="h-full w-full"
              title="Web Preview"
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default WorkspacePreview
