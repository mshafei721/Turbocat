'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, File, Spinner, Warning } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Attachment } from '@/lib/hooks/use-attachments'

interface AttachmentPreviewProps {
  attachments: Attachment[]
  onRemove: (id: string) => void
  className?: string
}

export function AttachmentPreview({
  attachments,
  onRemove,
  className,
}: AttachmentPreviewProps) {
  if (attachments.length === 0) return null

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <AnimatePresence mode="popLayout">
        {attachments.map((attachment) => (
          <motion.div
            key={attachment.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'relative group',
              attachment.error && 'ring-2 ring-red-500 rounded-lg'
            )}
          >
            {attachment.type === 'image' && attachment.preview ? (
              <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-slate-800">
                <img
                  src={attachment.preview}
                  alt={attachment.file.name}
                  className="h-full w-full object-cover"
                />
                {attachment.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Spinner size={20} className="animate-spin text-white" />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-800">
                <File size={24} className="text-slate-400" />
              </div>
            )}

            {/* Remove button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(attachment.id)}
              className={cn(
                'absolute -top-2 -right-2 h-5 w-5 rounded-full',
                'bg-slate-700 hover:bg-red-600',
                'text-white opacity-0 group-hover:opacity-100 transition-opacity'
              )}
            >
              <X size={12} />
            </Button>

            {/* Error indicator */}
            {attachment.error && (
              <div className="absolute bottom-1 left-1 right-1">
                <div className="flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5">
                  <Warning size={10} className="text-white" />
                  <span className="text-[8px] text-white truncate">Error</span>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default AttachmentPreview
