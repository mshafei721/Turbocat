'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Spinner, Warning } from '@phosphor-icons/react'
import { WorkspaceHeader } from './WorkspaceHeader'
import { WorkspaceChat } from './WorkspaceChat'
import { WorkspacePreview } from './WorkspacePreview'
import { Button } from '@/components/ui/button'

interface Task {
  id: string
  prompt: string
  title?: string | null
  status: 'pending' | 'processing' | 'completed' | 'error' | 'stopped'
  progress: number | null
  platform: 'web' | 'mobile'
  sandboxUrl?: string | null
  previewUrl?: string | null
  createdAt: string
  updatedAt: string
}

interface Message {
  id: string
  taskId: string
  role: 'user' | 'agent'
  content: string
  createdAt: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  updates?: number
  timestamp?: Date
}

interface ProjectWorkspaceProps {
  projectId: string
}

function generateProjectName(prompt: string): string {
  // Extract first few meaningful words from prompt
  const words = prompt
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !['the', 'and', 'for', 'with', 'that', 'this', 'app', 'build', 'create', 'make'].includes(word.toLowerCase()))
    .slice(0, 3)

  if (words.length === 0) {
    return 'New Project'
  }

  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

function generateProjectIcon(prompt: string): string {
  const promptLower = prompt.toLowerCase()

  // Match keywords to emojis
  if (promptLower.includes('travel') || promptLower.includes('trip') || promptLower.includes('vacation')) return '✈️'
  if (promptLower.includes('food') || promptLower.includes('restaurant') || promptLower.includes('recipe')) return '🍔'
  if (promptLower.includes('fitness') || promptLower.includes('gym') || promptLower.includes('workout')) return '💪'
  if (promptLower.includes('music') || promptLower.includes('song') || promptLower.includes('playlist')) return '🎵'
  if (promptLower.includes('shopping') || promptLower.includes('store') || promptLower.includes('ecommerce')) return '🛒'
  if (promptLower.includes('chat') || promptLower.includes('message') || promptLower.includes('social')) return '💬'
  if (promptLower.includes('finance') || promptLower.includes('money') || promptLower.includes('budget')) return '💰'
  if (promptLower.includes('health') || promptLower.includes('medical') || promptLower.includes('doctor')) return '🏥'
  if (promptLower.includes('education') || promptLower.includes('learn') || promptLower.includes('course')) return '📚'
  if (promptLower.includes('game') || promptLower.includes('play')) return '🎮'
  if (promptLower.includes('weather')) return '☀️'
  if (promptLower.includes('calendar') || promptLower.includes('schedule') || promptLower.includes('event')) return '📅'
  if (promptLower.includes('photo') || promptLower.includes('image') || promptLower.includes('gallery')) return '📷'
  if (promptLower.includes('video') || promptLower.includes('stream')) return '🎬'
  if (promptLower.includes('note') || promptLower.includes('todo') || promptLower.includes('task')) return '📝'
  if (promptLower.includes('map') || promptLower.includes('location') || promptLower.includes('navigation')) return '🗺️'

  // Default icons based on platform
  return '🚀'
}

export function ProjectWorkspace({ projectId }: ProjectWorkspaceProps) {
  const router = useRouter()
  const [task, setTask] = React.useState<Task | null>(null)
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isSending, setIsSending] = React.useState(false)

  // Fetch task and messages
  React.useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch task data
        const taskRes = await fetch(`/api/tasks/${projectId}`)
        if (!taskRes.ok) {
          if (taskRes.status === 404) {
            setError('Project not found')
          } else if (taskRes.status === 401) {
            router.push('/login')
            return
          } else {
            throw new Error('Failed to fetch project')
          }
          return
        }
        const taskData = await taskRes.json()
        setTask(taskData.task)

        // Fetch messages
        const messagesRes = await fetch(`/api/tasks/${projectId}/messages`)
        if (messagesRes.ok) {
          const messagesData = await messagesRes.json()
          // Transform API messages to chat format
          const chatMessages: ChatMessage[] = messagesData.messages.map((msg: Message) => ({
            id: msg.id,
            role: msg.role === 'agent' ? 'assistant' : 'user',
            content: msg.content,
            timestamp: new Date(msg.createdAt),
          }))
          setMessages(chatMessages)
        }
      } catch (err) {
        console.error('Error fetching project data:', err)
        setError('Failed to load project')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Poll for updates if task is processing
    const pollInterval = setInterval(async () => {
      if (!task || task.status !== 'processing') return

      try {
        const taskRes = await fetch(`/api/tasks/${projectId}`)
        if (taskRes.ok) {
          const taskData = await taskRes.json()
          setTask(taskData.task)
        }

        const messagesRes = await fetch(`/api/tasks/${projectId}/messages`)
        if (messagesRes.ok) {
          const messagesData = await messagesRes.json()
          const chatMessages: ChatMessage[] = messagesData.messages.map((msg: Message) => ({
            id: msg.id,
            role: msg.role === 'agent' ? 'assistant' : 'user',
            content: msg.content,
            timestamp: new Date(msg.createdAt),
          }))
          setMessages(chatMessages)
        }
      } catch (err) {
        console.error('Error polling for updates:', err)
      }
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [projectId, router, task?.status])

  const handleSendMessage = async (content: string) => {
    if (!task) return

    // Add optimistic user message
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setIsSending(true)

    try {
      // Send message to continue the task
      const response = await fetch(`/api/tasks/${projectId}/continue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      // Refresh messages after sending
      const messagesRes = await fetch(`/api/tasks/${projectId}/messages`)
      if (messagesRes.ok) {
        const messagesData = await messagesRes.json()
        const chatMessages: ChatMessage[] = messagesData.messages.map((msg: Message) => ({
          id: msg.id,
          role: msg.role === 'agent' ? 'assistant' : 'user',
          content: msg.content,
          timestamp: new Date(msg.createdAt),
        }))
        setMessages(chatMessages)
      }
    } catch (err) {
      console.error('Error sending message:', err)
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id))
    } finally {
      setIsSending(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Spinner size={32} className="animate-spin text-orange-500" />
          <p className="text-slate-400">Loading project...</p>
        </motion.div>
      </div>
    )
  }

  // Error state
  if (error || !task) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <Warning size={48} className="text-red-500" />
          <h2 className="text-xl font-semibold text-white">{error || 'Project not found'}</h2>
          <p className="text-slate-400">The project you're looking for doesn't exist or you don't have access.</p>
          <Button onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    )
  }

  // Generate project display info from task
  const projectName = task.title || generateProjectName(task.prompt)
  const projectIcon = generateProjectIcon(task.prompt)
  const isProcessing = task.status === 'processing'

  return (
    <div className="flex h-screen flex-col bg-slate-950">
      {/* Header */}
      <WorkspaceHeader
        projectId={task.id}
        projectName={projectName}
        projectIcon={projectIcon}
        lastUpdated={new Date(task.updatedAt)}
        credits={0}
        onClearContext={() => console.log('Clear context')}
        onShare={() => console.log('Share')}
        onPublish={() => console.log('Publish')}
      />

      {/* Progress Bar (when processing) */}
      {isProcessing && task.progress !== null && (
        <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-2">
          <div className="flex items-center gap-3">
            <Spinner size={16} className="animate-spin text-orange-500" />
            <span className="text-sm text-slate-400">
              Generating your app... {task.progress}%
            </span>
            <div className="flex-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${task.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Chat */}
        <div className="w-full border-r border-slate-800 md:w-1/2 lg:w-2/5">
          <WorkspaceChat
            messages={messages}
            isLoading={isSending || isProcessing}
            onSendMessage={handleSendMessage}
          />
        </div>

        {/* Right Panel - Preview */}
        <div className="hidden flex-1 md:block">
          <WorkspacePreview
            previewUrl={task.sandboxUrl || task.previewUrl || undefined}
            platform={task.platform}
            isLoading={isProcessing}
            onOpenInNew={() => {
              const url = task.sandboxUrl || task.previewUrl
              if (url) window.open(url, '_blank')
            }}
            onRefresh={() => {
              // Trigger iframe refresh
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default ProjectWorkspace
