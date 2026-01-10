/**
 * Skill Logs Page
 *
 * Server-side page for viewing skill execution logs.
 *
 * @file app/skills/[slug]/logs/page.tsx
 */

import { Suspense } from 'react'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from '@/lib/session/get-server-session'
import { SkillRegistry } from '@/lib/skills/registry'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
} from 'lucide-react'

interface SkillLogsPageProps {
  params: Promise<{ slug: string }>
}

/**
 * Mock execution log for display
 */
interface MockExecutionLog {
  id: string
  timestamp: Date
  status: 'completed' | 'failed' | 'running'
  durationMs: number
  inputPrompt: string
  confidence: number
  errorMessage?: string
}

/**
 * Generate mock logs for demonstration
 */
function generateMockLogs(skillSlug: string): MockExecutionLog[] {
  const now = Date.now()
  return [
    {
      id: '1',
      timestamp: new Date(now - 1000 * 60 * 5),
      status: 'completed',
      durationMs: 1250,
      inputPrompt: `Help me set up ${skillSlug} configuration`,
      confidence: 0.92,
    },
    {
      id: '2',
      timestamp: new Date(now - 1000 * 60 * 30),
      status: 'completed',
      durationMs: 2100,
      inputPrompt: `Create a new ${skillSlug} integration`,
      confidence: 0.87,
    },
    {
      id: '3',
      timestamp: new Date(now - 1000 * 60 * 60 * 2),
      status: 'failed',
      durationMs: 500,
      inputPrompt: `Debug ${skillSlug} connection issue`,
      confidence: 0.78,
      errorMessage: 'MCP server connection timeout',
    },
    {
      id: '4',
      timestamp: new Date(now - 1000 * 60 * 60 * 5),
      status: 'completed',
      durationMs: 3200,
      inputPrompt: `Generate ${skillSlug} boilerplate code`,
      confidence: 0.95,
    },
    {
      id: '5',
      timestamp: new Date(now - 1000 * 60 * 60 * 24),
      status: 'completed',
      durationMs: 1800,
      inputPrompt: `Update ${skillSlug} schema`,
      confidence: 0.89,
    },
  ]
}

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

/**
 * Format relative time
 */
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

/**
 * Loading fallback component
 */
function SkillLogsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Clock className="h-8 w-8 text-gray-400 animate-pulse" />
            <p className="text-sm text-muted-foreground">Loading logs...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Status icon component
 */
function StatusIcon({ status }: { status: MockExecutionLog['status'] }) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-500" />
    case 'running':
      return <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />
  }
}

/**
 * Skill Logs Page Component
 */
export default async function SkillLogsPage({ params }: SkillLogsPageProps) {
  const session = await getServerSession()
  const { slug } = await params

  if (!session?.user) {
    redirect('/')
  }

  const registry = new SkillRegistry()
  const skill = await registry.get(slug)

  if (!skill) {
    notFound()
  }

  // TODO: Replace with actual execution log fetching
  const logs = generateMockLogs(slug)

  const completedCount = logs.filter((l) => l.status === 'completed').length
  const failedCount = logs.filter((l) => l.status === 'failed').length
  const avgDuration =
    logs.length > 0 ? logs.reduce((acc, l) => acc + l.durationMs, 0) / logs.length : 0

  return (
    <Suspense fallback={<SkillLogsLoading />}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link href={`/skills/${slug}`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to {skill.name}
            </Button>
          </Link>
        </div>

        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{skill.name} - Execution Logs</CardTitle>
                <CardDescription>View execution history and performance metrics</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                <p className="text-sm text-muted-foreground">Successful</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-red-600">{failedCount}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{formatDuration(avgDuration)}</p>
                <p className="text-sm text-muted-foreground">Avg Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Executions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No execution logs found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <StatusIcon status={log.status} />
                        <div>
                          <p className="font-medium">{log.inputPrompt}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatRelativeTime(log.timestamp)} | {formatDuration(log.durationMs)} |{' '}
                            {(log.confidence * 100).toFixed(0)}% confidence
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          log.status === 'completed'
                            ? 'default'
                            : log.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {log.status}
                      </Badge>
                    </div>
                    {log.errorMessage && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-950 rounded text-sm text-red-700 dark:text-red-300">
                        {log.errorMessage}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Suspense>
  )
}

/**
 * Generate metadata for the page
 */
export async function generateMetadata({ params }: SkillLogsPageProps) {
  const { slug } = await params
  const registry = new SkillRegistry()
  const skill = await registry.get(slug)

  if (!skill) {
    return {
      title: 'Skill Not Found | Turbocat',
    }
  }

  return {
    title: `${skill.name} Logs | Skills | Turbocat`,
    description: `Execution logs for ${skill.name}`,
  }
}
