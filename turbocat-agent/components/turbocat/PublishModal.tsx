'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Rocket,
  Globe,
  DeviceMobile,
  Check,
  Spinner,
  Warning,
  Copy,
  ArrowSquareOut,
  GithubLogo,
  X,
  CaretRight,
  CheckCircle,
  Circle,
} from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Step = 'options' | 'publishing' | 'success' | 'error'
type Platform = 'web' | 'mobile'

interface PublishTarget {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  platform: Platform
  enabled: boolean
}

interface PublishStep {
  id: string
  label: string
  status: 'pending' | 'in_progress' | 'completed' | 'error'
}

interface PublishModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
  platform: 'web' | 'mobile' | 'both'
  existingUrl?: string
}

const PUBLISH_TARGETS: PublishTarget[] = [
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Deploy to Vercel for instant global CDN',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M12 2L2 19.5h20L12 2z" />
      </svg>
    ),
    platform: 'web',
    enabled: true,
  },
  {
    id: 'expo',
    name: 'Expo',
    description: 'Publish to Expo for OTA updates',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
      </svg>
    ),
    platform: 'mobile',
    enabled: true,
  },
  {
    id: 'github-pages',
    name: 'GitHub Pages',
    description: 'Free hosting on GitHub',
    icon: <GithubLogo size={20} weight="fill" />,
    platform: 'web',
    enabled: false,
  },
]

export function PublishModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  platform,
  existingUrl,
}: PublishModalProps) {
  const [step, setStep] = React.useState<Step>('options')
  const [selectedTarget, setSelectedTarget] = React.useState<string | null>(null)
  const [customDomain, setCustomDomain] = React.useState('')
  const [copied, setCopied] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [publishedUrl, setPublishedUrl] = React.useState<string | null>(existingUrl || null)

  const [publishSteps, setPublishSteps] = React.useState<PublishStep[]>([
    { id: 'validate', label: 'Validating project', status: 'pending' },
    { id: 'build', label: 'Building application', status: 'pending' },
    { id: 'deploy', label: 'Deploying to cloud', status: 'pending' },
    { id: 'dns', label: 'Configuring DNS', status: 'pending' },
  ])

  // Filter targets based on platform
  const availableTargets = PUBLISH_TARGETS.filter(
    (t) => platform === 'both' || t.platform === platform
  )

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setStep('options')
      setSelectedTarget(null)
      setError(null)
      setPublishSteps([
        { id: 'validate', label: 'Validating project', status: 'pending' },
        { id: 'build', label: 'Building application', status: 'pending' },
        { id: 'deploy', label: 'Deploying to cloud', status: 'pending' },
        { id: 'dns', label: 'Configuring DNS', status: 'pending' },
      ])
    }
  }, [isOpen])

  const handlePublish = async () => {
    if (!selectedTarget) return

    setStep('publishing')
    setError(null)

    try {
      // Simulate publishing process
      // Step 1: Validate
      updateStepStatus('validate', 'in_progress')
      await simulateDelay(1000)
      updateStepStatus('validate', 'completed')

      // Step 2: Build
      updateStepStatus('build', 'in_progress')
      await simulateDelay(2000)
      updateStepStatus('build', 'completed')

      // Step 3: Deploy
      updateStepStatus('deploy', 'in_progress')
      await simulateDelay(2500)
      updateStepStatus('deploy', 'completed')

      // Step 4: DNS
      updateStepStatus('dns', 'in_progress')
      await simulateDelay(1000)
      updateStepStatus('dns', 'completed')

      // Generate URL based on target
      const generatedUrl = generatePublishUrl(selectedTarget, projectName)
      setPublishedUrl(generatedUrl)
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publishing failed')
      setStep('error')
    }
  }

  const updateStepStatus = (stepId: string, status: PublishStep['status']) => {
    setPublishSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, status } : s))
    )
  }

  const simulateDelay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const generatePublishUrl = (target: string, name: string): string => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-')
    switch (target) {
      case 'vercel':
        return `https://${slug}.vercel.app`
      case 'expo':
        return `exp://expo.dev/@turbocat/${slug}`
      case 'github-pages':
        return `https://turbocat.github.io/${slug}`
      default:
        return `https://${slug}.turbocat.app`
    }
  }

  const handleCopyUrl = () => {
    if (publishedUrl) {
      navigator.clipboard.writeText(publishedUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleOpenUrl = () => {
    if (publishedUrl) {
      window.open(publishedUrl, '_blank')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md border-slate-800 bg-slate-900 p-0">
        <AnimatePresence mode="wait">
          {/* Options Step */}
          {step === 'options' && (
            <motion.div
              key="options"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6"
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl text-white">
                  <Rocket size={24} weight="fill" className="text-primary" />
                  Publish {projectName}
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Choose where to deploy your application
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-3">
                {availableTargets.map((target) => (
                  <button
                    key={target.id}
                    onClick={() => target.enabled && setSelectedTarget(target.id)}
                    disabled={!target.enabled}
                    className={cn(
                      'flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-all',
                      target.enabled
                        ? 'border-slate-700 hover:border-primary hover:bg-slate-800/50'
                        : 'cursor-not-allowed border-slate-800 opacity-50',
                      selectedTarget === target.id && 'border-primary bg-primary/10'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        selectedTarget === target.id
                          ? 'bg-primary text-white'
                          : 'bg-slate-800 text-slate-400'
                      )}
                    >
                      {target.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{target.name}</p>
                        {target.platform === 'web' ? (
                          <Globe size={14} className="text-slate-500" />
                        ) : (
                          <DeviceMobile size={14} className="text-slate-500" />
                        )}
                        {!target.enabled && (
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-500">
                            Coming soon
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{target.description}</p>
                    </div>
                    {selectedTarget === target.id && (
                      <Check size={20} className="text-primary" weight="bold" />
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Domain (optional) */}
              {selectedTarget === 'vercel' && (
                <div className="mt-4">
                  <label className="mb-2 block text-sm text-slate-400">
                    Custom domain (optional)
                  </label>
                  <Input
                    placeholder="myapp.com"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    className="bg-slate-800/50"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    You can configure a custom domain after publishing
                  </p>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handlePublish}
                  disabled={!selectedTarget}
                  className="flex-1 gap-2"
                >
                  <Rocket size={16} weight="fill" />
                  Publish
                </Button>
              </div>
            </motion.div>
          )}

          {/* Publishing Step */}
          {step === 'publishing' && (
            <motion.div
              key="publishing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6"
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl text-white">
                  <Spinner size={24} className="animate-spin text-primary" />
                  Publishing...
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Your app is being deployed
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-3">
                {publishSteps.map((publishStep, index) => (
                  <motion.div
                    key={publishStep.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    {publishStep.status === 'completed' ? (
                      <CheckCircle size={20} weight="fill" className="text-success" />
                    ) : publishStep.status === 'in_progress' ? (
                      <Spinner size={20} className="animate-spin text-primary" />
                    ) : publishStep.status === 'error' ? (
                      <Warning size={20} weight="fill" className="text-destructive" />
                    ) : (
                      <Circle size={20} className="text-slate-600" />
                    )}
                    <span
                      className={cn(
                        'text-sm',
                        publishStep.status === 'completed'
                          ? 'text-slate-300'
                          : publishStep.status === 'in_progress'
                          ? 'text-white'
                          : 'text-slate-500'
                      )}
                    >
                      {publishStep.label}
                    </span>
                  </motion.div>
                ))}
              </div>

              <p className="mt-6 text-center text-xs text-slate-500">
                This may take a few minutes...
              </p>
            </motion.div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/20"
              >
                <CheckCircle size={40} weight="fill" className="text-success" />
              </motion.div>

              <h2 className="mt-4 text-xl font-semibold text-white">
                Published Successfully!
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Your app is now live and accessible worldwide
              </p>

              {publishedUrl && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                    <Globe size={18} className="shrink-0 text-slate-400" />
                    <span className="flex-1 truncate text-sm text-white">
                      {publishedUrl}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={handleCopyUrl}
                    >
                      {copied ? (
                        <Check size={16} className="text-success" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={handleOpenUrl}
                    >
                      <ArrowSquareOut size={16} />
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Close
                </Button>
                <Button onClick={handleOpenUrl} className="flex-1 gap-2">
                  <ArrowSquareOut size={16} />
                  Open Site
                </Button>
              </div>
            </motion.div>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-6 text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20">
                <Warning size={40} weight="fill" className="text-destructive" />
              </div>

              <h2 className="mt-4 text-xl font-semibold text-white">
                Publishing Failed
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                {error || 'Something went wrong during deployment'}
              </p>

              <div className="mt-6 flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={() => setStep('options')}
                  className="flex-1 gap-2"
                >
                  <CaretRight size={16} />
                  Try Again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

export default PublishModal
