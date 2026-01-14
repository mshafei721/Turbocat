'use client'

import * as React from 'react'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { CheckCircle2, XCircle, Loader2, AlertCircle, ExternalLink, Copy, Download, Clock, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// =============================================================================
// TYPES
// =============================================================================

interface BuildingStepProps {
  publishingId: string | null
  projectId: string
  onComplete?: () => void
  onRetry?: () => void
  onClose?: () => void
}

type PublishingStatus = 'INITIATED' | 'BUILDING' | 'SUBMITTING' | 'SUBMITTED' | 'FAILED'

interface PublishingStatusResponse {
  id: string
  status: PublishingStatus
  statusMessage: string | null
  buildLogs: string | null
  ipaUrl: string | null
  expoBuildId: string | null
  createdAt: string
  updatedAt: string
  initiatedAt: string
  buildStartedAt: string | null
  buildCompletedAt: string | null
  submittedAt: string | null
  failedAt: string | null
}

interface TimelineStage {
  id: string
  label: string
  description: string
  status: 'pending' | 'active' | 'completed' | 'failed'
}

// =============================================================================
// CONSTANTS
// =============================================================================

const POLL_INTERVAL = 5000 // 5 seconds
const MAX_POLL_DURATION = 30 * 60 * 1000 // 30 minutes

const STATUS_MESSAGES: Record<PublishingStatus, { title: string; description: string }> = {
  INITIATED: {
    title: 'Preparing Build Environment',
    description: 'Your build has been queued and will start shortly. Setting up Expo Build Services...',
  },
  BUILDING: {
    title: 'Building Your iOS App',
    description: 'Building your iOS app with Expo. This usually takes 5-10 minutes depending on your app size and complexity.',
  },
  SUBMITTING: {
    title: 'Submitting to App Store',
    description: 'Build complete! Uploading to App Store Connect and preparing submission...',
  },
  SUBMITTED: {
    title: 'Successfully Submitted!',
    description: 'Your app has been submitted to the App Store for review.',
  },
  FAILED: {
    title: 'Build Failed',
    description: 'An error occurred during the publishing process. Please review the error details below.',
  },
}

const COMMON_ERRORS = [
  {
    title: 'Invalid Apple Credentials',
    description: 'Your Apple Developer credentials may be incorrect or expired. Verify your Team ID, Key ID, Issuer ID, and Private Key.',
    solutions: [
      'Check that your Apple Developer account is active',
      'Verify credentials in App Store Connect',
      'Ensure your Private Key file is valid and not expired',
    ],
  },
  {
    title: 'Bundle ID Conflict',
    description: 'The Bundle ID already exists or is not available for your team.',
    solutions: [
      'Choose a unique Bundle ID for your app',
      'Check App Store Connect for existing apps',
      'Verify you have permissions for this Bundle ID',
    ],
  },
  {
    title: 'Missing or Invalid Icon',
    description: 'Your app icon may be missing or in the wrong format.',
    solutions: [
      'Ensure icon is 1024x1024 PNG format',
      'Icon should not have transparency or rounded corners',
      'Re-upload icon and try again',
    ],
  },
  {
    title: 'Build Timeout',
    description: 'The build took too long and was terminated.',
    solutions: [
      'Reduce app size by removing unused dependencies',
      'Optimize assets and images',
      'Contact support if issue persists',
    ],
  },
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const getTimelineStages = (status: PublishingStatus): TimelineStage[] => {
  const stages: TimelineStage[] = [
    {
      id: 'initiated',
      label: 'Initiating',
      description: 'Preparing build environment',
      status: 'pending',
    },
    {
      id: 'building',
      label: 'Building',
      description: 'Compiling iOS app with Expo',
      status: 'pending',
    },
    {
      id: 'submitting',
      label: 'Submitting',
      description: 'Uploading to App Store Connect',
      status: 'pending',
    },
    {
      id: 'complete',
      label: 'Complete',
      description: 'App submitted for review',
      status: 'pending',
    },
  ]

  if (status === 'FAILED') {
    return stages.map((stage, index) => ({
      ...stage,
      status: index === 0 ? 'failed' : 'pending',
    }))
  }

  const statusOrder = ['INITIATED', 'BUILDING', 'SUBMITTING', 'SUBMITTED']
  const currentIndex = statusOrder.indexOf(status)

  return stages.map((stage, index) => {
    if (index < currentIndex) {
      return { ...stage, status: 'completed' }
    }
    if (index === currentIndex) {
      return { ...stage, status: status === 'SUBMITTED' ? 'completed' : 'active' }
    }
    return stage
  })
}

const getProgressPercentage = (status: PublishingStatus): number => {
  const percentages: Record<PublishingStatus, number> = {
    INITIATED: 10,
    BUILDING: 40,
    SUBMITTING: 80,
    SUBMITTED: 100,
    FAILED: 0,
  }
  return percentages[status]
}

const formatElapsedTime = (startTime: string): string => {
  const elapsed = Date.now() - new Date(startTime).getTime()
  const seconds = Math.floor(elapsed / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes === 0) {
    return `${remainingSeconds}s`
  }
  return `${minutes}m ${remainingSeconds}s`
}

const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  } catch (error) {
    toast.error('Failed to copy to clipboard')
  }
}

const downloadLogs = (logs: string, publishingId: string): void => {
  try {
    const blob = new Blob([logs], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `build-logs-${publishingId}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Build logs downloaded')
  } catch (error) {
    toast.error('Failed to download logs')
  }
}

// =============================================================================
// COMPONENTS
// =============================================================================

function StatusTimeline({ stages }: { stages: TimelineStage[] }) {
  return (
    <div className="relative">
      <div className="flex items-center justify-between gap-2">
        {stages.map((stage, index) => (
          <React.Fragment key={stage.id}>
            <div className="flex flex-col items-center flex-1 min-w-0">
              {/* Stage Icon */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2',
                  stage.status === 'completed' &&
                    'bg-success/10 border-success text-success',
                  stage.status === 'active' &&
                    'bg-primary/10 border-primary text-primary',
                  stage.status === 'pending' &&
                    'bg-muted border-border text-muted-foreground',
                  stage.status === 'failed' &&
                    'bg-destructive/10 border-destructive text-destructive',
                )}
              >
                {stage.status === 'completed' && <CheckCircle2 className="w-5 h-5" />}
                {stage.status === 'active' && <Loader2 className="w-5 h-5 animate-spin" />}
                {stage.status === 'pending' && (
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                )}
                {stage.status === 'failed' && <XCircle className="w-5 h-5" />}
              </div>

              {/* Stage Label */}
              <div className="mt-3 text-center">
                <p
                  className={cn(
                    'text-sm font-medium transition-colors',
                    stage.status === 'completed' && 'text-success',
                    stage.status === 'active' && 'text-primary',
                    stage.status === 'pending' && 'text-muted-foreground',
                    stage.status === 'failed' && 'text-destructive',
                  )}
                >
                  {stage.label}
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {stage.description}
                </p>
              </div>
            </div>

            {/* Connector Line */}
            {index < stages.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 -mt-14 transition-colors',
                  stage.status === 'completed' ? 'bg-success' : 'bg-muted',
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

function BuildLogsViewer({ logs, publishingId }: { logs: string; publishingId: string }) {
  const logsContainerRef = React.useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = React.useState(true)

  // Auto-scroll to bottom when logs update
  React.useEffect(() => {
    if (shouldAutoScroll && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight
    }
  }, [logs, shouldAutoScroll])

  const handleScroll = () => {
    if (logsContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logsContainerRef.current
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 10
      setShouldAutoScroll(isAtBottom)
    }
  }

  // Parse logs with timestamps (if available)
  const logLines = logs.split('\n').filter((line) => line.trim())

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="logs" className="border rounded-lg">
        <AccordionTrigger className="px-4 hover:no-underline">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">View Build Logs</span>
            <span className="text-xs text-muted-foreground">({logLines.length} lines)</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="space-y-3">
            {/* Logs Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(logs)}
                className="flex items-center gap-2"
              >
                <Copy className="w-3 h-3" />
                Copy Logs
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadLogs(logs, publishingId)}
                className="flex items-center gap-2"
              >
                <Download className="w-3 h-3" />
                Download Logs
              </Button>
            </div>

            {/* Logs Container */}
            <div
              ref={logsContainerRef}
              onScroll={handleScroll}
              className="bg-muted/50 rounded-lg border border-border p-4 max-h-[400px] overflow-y-auto font-mono text-xs leading-relaxed"
            >
              {logLines.map((line, index) => (
                <div
                  key={index}
                  className={cn(
                    'py-0.5',
                    line.toLowerCase().includes('error') && 'text-destructive',
                    line.toLowerCase().includes('warn') && 'text-warning',
                  )}
                >
                  <span className="text-muted-foreground select-none mr-4">{index + 1}</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>

            {!shouldAutoScroll && (
              <div className="text-xs text-muted-foreground text-center">
                Scroll to bottom to enable auto-scroll
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

function SuccessState({ onClose }: { onClose?: () => void }) {
  return (
    <div className="space-y-6">
      {/* Success Icon */}
      <div className="flex flex-col items-center text-center space-y-4 py-8">
        <div className="relative">
          <div className="absolute inset-0 animate-ping">
            <Sparkles className="w-16 h-16 text-success/50" />
          </div>
          <CheckCircle2 className="w-16 h-16 text-success relative" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-success mb-2">Success!</h3>
          <p className="text-muted-foreground">
            Your app has been successfully submitted to the App Store.
          </p>
        </div>
      </div>

      {/* Next Steps */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>What happens next?</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Your app is now being reviewed by Apple</li>
            <li>You'll receive an email notification from Apple about the review status</li>
            <li>The review process typically takes 24-48 hours</li>
            <li>You can track the status in App Store Connect</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* App Store Connect Link */}
      <div className="p-4 rounded-lg border border-border bg-muted/50">
        <h4 className="font-medium mb-2">Track Your Submission</h4>
        <a
          href="https://appstoreconnect.apple.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Open App Store Connect <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Close Button */}
      {onClose && (
        <div className="flex justify-center pt-4">
          <Button onClick={onClose} size="lg">
            Close
          </Button>
        </div>
      )}
    </div>
  )
}

function FailedState({
  error,
  logs,
  publishingId,
  onRetry,
}: {
  error: string
  logs: string | null
  publishingId: string
  onRetry?: () => void
}) {
  return (
    <div className="space-y-6">
      {/* Error Alert */}
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Build Failed</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="font-medium mb-2">Error Details:</p>
          <p className="text-sm whitespace-pre-wrap">{error}</p>
        </AlertDescription>
      </Alert>

      {/* Build Logs */}
      {logs && <BuildLogsViewer logs={logs} publishingId={publishingId} />}

      {/* Common Errors & Solutions */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="troubleshooting" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Common Issues & Solutions</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              {COMMON_ERRORS.map((errorInfo, index) => (
                <div key={index} className="space-y-2">
                  <h4 className="font-medium text-sm">{errorInfo.title}</h4>
                  <p className="text-sm text-muted-foreground">{errorInfo.description}</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                    {errorInfo.solutions.map((solution, sIndex) => (
                      <li key={sIndex}>{solution}</li>
                    ))}
                  </ul>
                  {index < COMMON_ERRORS.length - 1 && (
                    <div className="h-px bg-border mt-4" />
                  )}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Retry Button */}
      {onRetry && (
        <div className="flex justify-center gap-3">
          <Button onClick={onRetry} variant="default">
            Retry Publishing
          </Button>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BuildingStep({ publishingId, projectId, onComplete, onRetry, onClose }: BuildingStepProps) {
  const [status, setStatus] = React.useState<PublishingStatusResponse | null>(null)
  const [isPolling, setIsPolling] = React.useState(true)
  const [pollingError, setPollingError] = React.useState<string | null>(null)
  const [elapsedTime, setElapsedTime] = React.useState<string>('0s')
  const pollingIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = React.useRef<Date>(new Date())

  // Update elapsed time counter
  React.useEffect(() => {
    if (!status || status.status === 'SUBMITTED' || status.status === 'FAILED') {
      return
    }

    const interval = setInterval(() => {
      setElapsedTime(formatElapsedTime(status.initiatedAt))
    }, 1000)

    return () => clearInterval(interval)
  }, [status])

  // Poll for status updates
  React.useEffect(() => {
    if (!publishingId || !isPolling) return

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/v1/publishing/${publishingId}/status`)
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error?.message || 'Failed to fetch publishing status')
        }

        const publishingStatus = result.data.publishing
        setStatus(publishingStatus)
        setPollingError(null)

        // Stop polling if completed or failed
        if (publishingStatus.status === 'SUBMITTED' || publishingStatus.status === 'FAILED') {
          setIsPolling(false)
          if (publishingStatus.status === 'SUBMITTED' && onComplete) {
            onComplete()
          }
        }

        // Timeout check (30 minutes)
        const elapsed = Date.now() - startTimeRef.current.getTime()
        if (elapsed > MAX_POLL_DURATION) {
          setIsPolling(false)
          setPollingError('Build timeout - the process took too long. Please try again.')
        }
      } catch (error) {
        console.error('Error polling publishing status:', error)
        setPollingError('Connection lost. Retrying...')
      }
    }

    // Initial poll
    pollStatus()

    // Set up polling interval
    pollingIntervalRef.current = setInterval(pollStatus, POLL_INTERVAL)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [publishingId, isPolling, onComplete])

  const handleRetry = async () => {
    if (!publishingId) return

    try {
      const response = await fetch(`/api/v1/publishing/${publishingId}/retry`, {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to retry publishing')
      }

      toast.success('Retrying publishing...')
      setIsPolling(true)
      setPollingError(null)
      startTimeRef.current = new Date()

      if (onRetry) {
        onRetry()
      }
    } catch (error) {
      console.error('Error retrying publishing:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to retry publishing')
    }
  }

  // Loading states
  if (!publishingId) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Initializing build...</p>
        </div>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading status...</p>
        </div>
      </div>
    )
  }

  const timelineStages = getTimelineStages(status.status)
  const progressPercentage = getProgressPercentage(status.status)
  const statusMessage = STATUS_MESSAGES[status.status]

  // Success state
  if (status.status === 'SUBMITTED') {
    return <SuccessState onClose={onClose} />
  }

  // Failed state
  if (status.status === 'FAILED') {
    return (
      <FailedState
        error={status.statusMessage || 'An unknown error occurred during the build process.'}
        logs={status.buildLogs}
        publishingId={publishingId}
        onRetry={handleRetry}
      />
    )
  }

  // Building/In-progress states
  return (
    <div className="space-y-8" role="status" aria-live="polite" aria-busy={isPolling}>
      {/* Status Timeline */}
      <StatusTimeline stages={timelineStages} />

      {/* Status Info */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold">{statusMessage.title}</h3>
        <p className="text-sm text-muted-foreground">{statusMessage.description}</p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-3">
        <Progress value={progressPercentage} className="h-3" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3" />
            <span>Elapsed: {elapsedTime}</span>
          </div>
          <span>{progressPercentage}% complete</span>
        </div>
        <p className="text-xs text-center text-muted-foreground">
          Estimated time: 5-10 minutes
        </p>
      </div>

      {/* Polling Error Alert */}
      {pollingError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{pollingError}</AlertDescription>
        </Alert>
      )}

      {/* Custom Status Message */}
      {status.statusMessage && !pollingError && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{status.statusMessage}</AlertDescription>
        </Alert>
      )}

      {/* Build Logs (if available) */}
      {status.buildLogs && (
        <BuildLogsViewer logs={status.buildLogs} publishingId={publishingId} />
      )}

      {/* Expo Build Link */}
      {status.expoBuildId && (
        <div className="p-4 rounded-lg border border-border bg-muted/50">
          <h4 className="font-medium mb-2">Expo Build Details</h4>
          <a
            href={`https://expo.dev/accounts/${projectId}/projects/${projectId}/builds/${status.expoBuildId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            View build on Expo <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  )
}
