/**
 * Skill Detail Page
 *
 * Server-side page for viewing skill details and SKILL.md content.
 *
 * @file app/skills/[slug]/page.tsx
 */

import { Suspense } from 'react'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerSession } from '@/lib/session/get-server-session'
import { SkillRegistry } from '@/lib/skills/registry'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Play, Settings, Clock, CheckCircle, XCircle } from 'lucide-react'

interface SkillDetailPageProps {
  params: Promise<{ slug: string }>
}

/**
 * Loading fallback component
 */
function SkillDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Skill Detail Page Component
 */
export default async function SkillDetailPage({ params }: SkillDetailPageProps) {
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

  const successRate = skill.successRate ?? 0
  const usageCount = skill.usageCount ?? 0

  return (
    <Suspense fallback={<SkillDetailLoading />}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link href="/skills">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Skills
            </Button>
          </Link>
        </div>

        {/* Skill Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-2xl">{skill.name}</CardTitle>
                  <Badge variant={skill.isActive ? 'default' : 'secondary'}>
                    {skill.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <CardDescription className="text-base">{skill.description}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Link href={`/skills/${slug}/logs`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Clock className="h-4 w-4" />
                    View Logs
                  </Button>
                </Link>
                <Button size="sm" className="gap-2">
                  <Play className="h-4 w-4" />
                  Test Skill
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Version</p>
                <p className="font-medium">{skill.version}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{skill.category || 'Uncategorized'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Usage Count</p>
                <p className="font-medium">{usageCount.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <div className="flex items-center gap-2">
                  {successRate >= 80 ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : successRate >= 50 ? (
                    <Clock className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-medium">{successRate}%</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {skill.tags && skill.tags.length > 0 && (
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {skill.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* MCP Dependencies */}
            {skill.mcpDependencies && skill.mcpDependencies.length > 0 && (
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-2">MCP Dependencies</p>
                <div className="flex flex-wrap gap-2">
                  {skill.mcpDependencies.map((dep) => (
                    <Badge
                      key={dep.server}
                      variant={dep.required ? 'default' : 'secondary'}
                      className="gap-1"
                    >
                      {dep.server}
                      {dep.required && <span className="text-xs">*</span>}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SKILL.md Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">SKILL.md Content</CardTitle>
            <CardDescription>Full skill definition and instructions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-4 overflow-x-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono">{skill.content}</pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </Suspense>
  )
}

/**
 * Generate metadata for the page
 */
export async function generateMetadata({ params }: SkillDetailPageProps) {
  const { slug } = await params
  const registry = new SkillRegistry()
  const skill = await registry.get(slug)

  if (!skill) {
    return {
      title: 'Skill Not Found | Turbocat',
    }
  }

  return {
    title: `${skill.name} | Skills | Turbocat`,
    description: skill.description,
  }
}
