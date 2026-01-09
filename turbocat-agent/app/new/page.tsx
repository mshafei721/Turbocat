'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Desktop, DeviceMobile, Sparkle, Rocket } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/turbocat/Logo'
import { PromptInput } from '@/components/turbocat/PromptInput'

type Platform = 'web' | 'mobile' | null

export default function NewProjectPage() {
  const router = useRouter()
  const [platform, setPlatform] = React.useState<Platform>(null)
  const [prompt, setPrompt] = React.useState('')
  const [isCreating, setIsCreating] = React.useState(false)

  // Check for pending prompt from landing page
  React.useEffect(() => {
    const pendingPrompt = localStorage.getItem('turbocat-pending-prompt')
    if (pendingPrompt) {
      setPrompt(pendingPrompt)
      localStorage.removeItem('turbocat-pending-prompt')
    }
  }, [])

  const handleCreateProject = async () => {
    if (!platform || !prompt.trim()) return

    setIsCreating(true)

    try {
      // Create a new task via API
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          platform,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create project')
      }

      const task = await response.json()

      // Navigate to the project workspace
      router.push(`/project/${task.id}`)
    } catch (error) {
      console.error('Error creating project:', error)
      setIsCreating(false)
    }
  }

  const handlePromptSubmit = (submittedPrompt: string) => {
    setPrompt(submittedPrompt)
    if (platform) {
      handleCreateProject()
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard')}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft size={20} />
            </Button>
            <Logo size="md" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-8"
        >
          {/* Title */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              Create a new app
            </h1>
            <p className="mt-2 text-slate-400">
              Describe your idea and choose a platform to get started
            </p>
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              What do you want to build?
            </label>
            <PromptInput
              value={prompt}
              onChange={setPrompt}
              onSubmit={handlePromptSubmit}
              placeholder="Describe your app idea..."
              disabled={isCreating}
            />
          </div>

          {/* Platform Selection */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-slate-300">
              Choose a platform
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card
                className={cn(
                  'cursor-pointer transition-all hover:border-orange-500/50',
                  platform === 'web'
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-slate-800 bg-slate-900/50'
                )}
                onClick={() => setPlatform('web')}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        platform === 'web'
                          ? 'bg-orange-500/20 text-orange-500'
                          : 'bg-slate-800 text-slate-400'
                      )}
                    >
                      <Desktop size={24} />
                    </div>
                    <CardTitle className="text-lg text-white">Web App</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400">
                    Build a responsive web application with React and Next.js
                  </CardDescription>
                </CardContent>
              </Card>

              <Card
                className={cn(
                  'cursor-pointer transition-all hover:border-teal-500/50',
                  platform === 'mobile'
                    ? 'border-teal-500 bg-teal-500/10'
                    : 'border-slate-800 bg-slate-900/50'
                )}
                onClick={() => setPlatform('mobile')}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        platform === 'mobile'
                          ? 'bg-teal-500/20 text-teal-500'
                          : 'bg-slate-800 text-slate-400'
                      )}
                    >
                      <DeviceMobile size={24} />
                    </div>
                    <CardTitle className="text-lg text-white">Mobile App</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400">
                    Build a native mobile app with React Native and Expo
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Create Button */}
          <Button
            size="lg"
            className="w-full bg-orange-500 hover:bg-orange-600"
            disabled={!platform || !prompt.trim() || isCreating}
            onClick={handleCreateProject}
          >
            {isCreating ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating your app...
              </>
            ) : (
              <>
                <Rocket size={20} className="mr-2" weight="duotone" />
                Create App
              </>
            )}
          </Button>

          {/* Tips */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
            <div className="flex items-start gap-3">
              <Sparkle size={20} className="mt-0.5 text-orange-500" weight="duotone" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">Tips for better results</p>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Be specific about features and functionality</li>
                  <li>• Mention the target audience or use case</li>
                  <li>• Include any design preferences or styles</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
