'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import {
  PaperPlaneRight,
  Microphone,
  ImageSquare,
  Sparkle,
  Spinner,
  MicrophoneSlash,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAttachments, type Attachment } from '@/lib/hooks/use-attachments'
import { AttachmentPreview } from './AttachmentPreview'

interface PromptInputProps {
  onSubmit?: (prompt: string, attachments?: Attachment[]) => void
  placeholder?: string
  isLoading?: boolean
  disabled?: boolean
  className?: string
  suggestions?: string[]
  maxLength?: number
  /** Controlled value - if provided, component becomes controlled */
  value?: string
  /** Called when value changes in controlled mode */
  onChange?: (value: string) => void
  /** Enable voice input */
  enableVoice?: boolean
  /** Enable image attachment */
  enableImages?: boolean
}

export function PromptInput({
  onSubmit,
  placeholder = 'Describe the app you want to build...',
  isLoading = false,
  disabled = false,
  className,
  suggestions = [
    'A fitness tracking app with workout plans',
    'An expense tracker with charts',
    'A recipe app with shopping lists',
    'A habit tracker with streaks',
  ],
  maxLength = 2000,
  value: controlledValue,
  onChange,
  enableVoice = true,
  enableImages = true,
}: PromptInputProps) {
  const [internalPrompt, setInternalPrompt] = React.useState('')
  const [isRecording, setIsRecording] = React.useState(false)

  // Support both controlled and uncontrolled modes
  const isControlled = controlledValue !== undefined
  const prompt = isControlled ? controlledValue : internalPrompt
  const setPrompt = isControlled
    ? (val: string) => onChange?.(val)
    : setInternalPrompt
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Attachment handling
  const {
    attachments,
    fileInputRef,
    openFilePicker,
    handleFileInputChange,
    removeAttachment,
    clearAttachments,
    acceptedTypesString,
    hasAttachments,
  } = useAttachments({
    maxFiles: 5,
    maxFileSize: 10 * 1024 * 1024,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  })

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [prompt])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (prompt.trim() && !isLoading) {
      onSubmit?.(prompt.trim(), hasAttachments ? attachments : undefined)
      clearAttachments()
    }
  }

  const handleVoiceToggle = () => {
    if (!enableVoice) return
    setIsRecording((prev) => !prev)
    // Voice recording implementation would go here
    // For now, this is a placeholder that toggles the state
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter without Shift
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion)
    textareaRef.current?.focus()
  }

  return (
    <TooltipProvider>
      <div className={cn('w-full max-w-3xl mx-auto', className)}>
        {/* Main Input Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="relative"
        >
          <form onSubmit={handleSubmit}>
            <div
              className={cn(
                'relative rounded-2xl border border-slate-700 bg-slate-900/80 backdrop-blur-sm',
                'shadow-lg shadow-slate-950/50',
                'transition-all duration-200',
                'hover:border-slate-600',
                'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
                (isLoading || disabled) && 'opacity-80 pointer-events-none'
              )}
            >
              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                maxLength={maxLength}
                disabled={isLoading || disabled}
                rows={1}
                className={cn(
                  'w-full resize-none bg-transparent px-5 py-4 pr-32 text-base outline-none',
                  'placeholder:text-slate-500',
                  'disabled:cursor-not-allowed',
                  'min-h-[56px] max-h-[200px]'
                )}
              />

              {/* Action Buttons */}
              <div className="absolute bottom-2 right-2 flex items-center gap-1">
                {/* Character Count */}
                {prompt.length > 0 && (
                  <span className="text-xs text-slate-500 mr-2">
                    {prompt.length}/{maxLength}
                  </span>
                )}

                {/* Image Upload */}
                {enableImages && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'h-8 w-8 text-slate-400 hover:text-slate-200',
                          hasAttachments && 'text-primary'
                        )}
                        disabled={isLoading}
                        onClick={openFilePicker}
                      >
                        <ImageSquare size={18} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Attach image</TooltipContent>
                  </Tooltip>
                )}

                {/* Voice Input */}
                {enableVoice && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'h-8 w-8 text-slate-400 hover:text-slate-200',
                          isRecording && 'text-red-500 bg-red-500/10'
                        )}
                        disabled={isLoading}
                        onClick={handleVoiceToggle}
                      >
                        {isRecording ? (
                          <MicrophoneSlash size={18} />
                        ) : (
                          <Microphone size={18} />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isRecording ? 'Stop recording' : 'Voice input'}
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="icon"
                  className={cn(
                    'h-10 w-10 rounded-xl',
                    !prompt.trim() && 'opacity-50 cursor-not-allowed'
                  )}
                  disabled={!prompt.trim() || isLoading}
                >
                  {isLoading ? (
                    <Spinner size={18} className="animate-spin" />
                  ) : (
                    <PaperPlaneRight size={18} weight="fill" />
                  )}
                </Button>
              </div>
            </div>

            {/* Hidden file input */}
            {enableImages && (
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedTypesString}
                multiple
                onChange={handleFileInputChange}
                className="hidden"
              />
            )}

            {/* Attachment preview */}
            {hasAttachments && (
              <div className="px-4 pb-3">
                <AttachmentPreview
                  attachments={attachments}
                  onRemove={removeAttachment}
                />
              </div>
            )}
          </form>

          {/* AI Badge */}
          <div className="absolute -top-3 left-4">
            <div className="flex items-center gap-1.5 rounded-full bg-slate-800 border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300">
              <Sparkle size={12} className="text-primary" weight="fill" />
              AI Powered
            </div>
          </div>
        </motion.div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mt-4"
          >
            <p className="text-xs text-slate-500 mb-2">Try these ideas:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: 0.1 * (index + 3) }}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    'rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-sm text-slate-400',
                    'transition-all duration-200',
                    'hover:border-slate-700 hover:bg-slate-800 hover:text-slate-200',
                    'focus:outline-none focus:ring-2 focus:ring-primary/20'
                  )}
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  )
}

export default PromptInput
