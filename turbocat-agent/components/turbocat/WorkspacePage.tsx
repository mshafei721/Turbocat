'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { WorkspaceHeader } from './WorkspaceHeader'
import { WorkspaceChat } from './WorkspaceChat'
import { WorkspacePreview } from './WorkspacePreview'
import { PublishModal } from './PublishModal'
import { ShareModal } from './ShareModal'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  updates?: number
  timestamp?: Date
}

interface Project {
  id: string
  name: string
  icon?: string
  platform: 'web' | 'mobile' | 'both'
  previewUrl?: string
  lastUpdated?: Date
  credits?: number
}

interface WorkspacePageProps {
  project: Project
  messages?: ChatMessage[]
  isGenerating?: boolean
  className?: string
}

export function WorkspacePage({
  project,
  messages = [],
  isGenerating = false,
  className,
}: WorkspacePageProps) {
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>(messages)
  const [isLoading, setIsLoading] = React.useState(isGenerating)
  const [isPublishModalOpen, setIsPublishModalOpen] = React.useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false)

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    }
    setChatMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: `I'll help you with that. Let me analyze your request and make the necessary changes...`,
        updates: 1,
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 2000)
  }

  const handleClearContext = () => {
    // Implement clear context logic
    console.log('Clear context')
  }

  const handleShare = () => {
    setIsShareModalOpen(true)
  }

  const handlePublish = () => {
    setIsPublishModalOpen(true)
  }

  const handleRefreshPreview = () => {
    // Implement refresh logic
    console.log('Refresh preview')
  }

  const handleOpenInNew = () => {
    if (project.previewUrl) {
      window.open(project.previewUrl, '_blank')
    }
  }

  return (
    <div className={cn('flex h-screen flex-col bg-slate-950', className)}>
      {/* Header */}
      <WorkspaceHeader
        projectId={project.id}
        projectName={project.name}
        projectIcon={project.icon}
        lastUpdated={project.lastUpdated}
        credits={project.credits}
        onClearContext={handleClearContext}
        onShare={handleShare}
        onPublish={handlePublish}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Chat */}
        <div className="w-full border-r border-slate-800 md:w-1/2 lg:w-2/5">
          <WorkspaceChat
            messages={chatMessages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
          />
        </div>

        {/* Right Panel - Preview */}
        <div className="hidden flex-1 md:block">
          <WorkspacePreview
            previewUrl={project.previewUrl}
            platform={project.platform === 'both' ? 'mobile' : project.platform}
            isLoading={isLoading}
            onOpenInNew={handleOpenInNew}
            onRefresh={handleRefreshPreview}
          />
        </div>
      </div>

      {/* Publish Modal */}
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        projectId={project.id}
        projectName={project.name}
        platform={project.platform}
        existingUrl={project.previewUrl}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        projectId={project.id}
        projectName={project.name}
        projectUrl={project.previewUrl}
      />
    </div>
  )
}

export default WorkspacePage
