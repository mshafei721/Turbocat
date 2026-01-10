'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShareNetwork,
  Copy,
  Check,
  Link,
  Envelope,
  TwitterLogo,
  LinkedinLogo,
  QrCode,
  Globe,
  Lock,
  Users,
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

type ShareVisibility = 'public' | 'unlisted' | 'private'

interface ShareOption {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  action: (url: string, title: string) => void
}

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  projectName: string
  projectUrl?: string
}

const SHARE_OPTIONS: ShareOption[] = [
  {
    id: 'copy',
    name: 'Copy Link',
    icon: <Link size={20} />,
    color: 'bg-slate-700',
    action: () => {}, // Handled separately
  },
  {
    id: 'email',
    name: 'Email',
    icon: <Envelope size={20} />,
    color: 'bg-blue-600',
    action: (url, title) => {
      window.open(
        `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(
          `Check out this project: ${url}`
        )}`,
        '_blank'
      )
    },
  },
  {
    id: 'twitter',
    name: 'Twitter',
    icon: <TwitterLogo size={20} weight="fill" />,
    color: 'bg-sky-500',
    action: (url, title) => {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
        '_blank'
      )
    },
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: <LinkedinLogo size={20} weight="fill" />,
    color: 'bg-blue-700',
    action: (url, title) => {
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        '_blank'
      )
    },
  },
]

const VISIBILITY_OPTIONS = [
  {
    id: 'public' as ShareVisibility,
    name: 'Public',
    description: 'Anyone can view this project',
    icon: <Globe size={18} />,
  },
  {
    id: 'unlisted' as ShareVisibility,
    name: 'Unlisted',
    description: 'Only people with the link can view',
    icon: <Link size={18} />,
  },
  {
    id: 'private' as ShareVisibility,
    name: 'Private',
    description: 'Only you can view this project',
    icon: <Lock size={18} />,
  },
]

export function ShareModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  projectUrl,
}: ShareModalProps) {
  const [copied, setCopied] = React.useState(false)
  const [visibility, setVisibility] = React.useState<ShareVisibility>('unlisted')
  const [showQrCode, setShowQrCode] = React.useState(false)

  const shareUrl = projectUrl || `https://turbocat.app/project/${projectId}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = (option: ShareOption) => {
    if (option.id === 'copy') {
      handleCopyLink()
    } else {
      option.action(shareUrl, `Check out ${projectName} on Turbocat`)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md border-slate-800 bg-slate-900 p-0">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-white">
              <ShareNetwork size={24} weight="fill" className="text-primary" />
              Share Project
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Share {projectName} with others
            </DialogDescription>
          </DialogHeader>

          {/* Share Link */}
          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Share link
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={shareUrl}
                  readOnly
                  className="bg-slate-800/50 pr-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check size={16} className="text-success" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Visibility Options */}
          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Visibility
            </label>
            <div className="space-y-2">
              {VISIBILITY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setVisibility(option.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all',
                    visibility === option.id
                      ? 'border-primary bg-primary/10'
                      : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg',
                      visibility === option.id
                        ? 'bg-primary text-white'
                        : 'bg-slate-800 text-slate-400'
                    )}
                  >
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{option.name}</p>
                    <p className="text-xs text-slate-500">{option.description}</p>
                  </div>
                  {visibility === option.id && (
                    <Check size={18} className="text-primary" weight="bold" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Share Options */}
          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Share via
            </label>
            <div className="flex gap-2">
              {SHARE_OPTIONS.map((option) => (
                <Button
                  key={option.id}
                  variant="outline"
                  size="icon"
                  className={cn(
                    'h-10 w-10',
                    option.id === 'copy' && copied && 'border-success text-success'
                  )}
                  onClick={() => handleShare(option)}
                >
                  {option.id === 'copy' && copied ? (
                    <Check size={18} />
                  ) : (
                    option.icon
                  )}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => setShowQrCode(!showQrCode)}
              >
                <QrCode size={18} />
              </Button>
            </div>
          </div>

          {/* QR Code */}
          <AnimatePresence>
            {showQrCode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="flex items-center justify-center rounded-lg bg-white p-4">
                  {/* Placeholder QR code - in production, use a QR library */}
                  <div className="flex h-32 w-32 items-center justify-center bg-slate-100 text-slate-400">
                    <QrCode size={64} />
                  </div>
                </div>
                <p className="mt-2 text-center text-xs text-slate-500">
                  Scan to open on mobile
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Invite Collaborators */}
          <div className="mt-6 border-t border-slate-800 pt-6">
            <button className="flex w-full items-center gap-3 rounded-lg border border-dashed border-slate-700 p-3 text-left transition-colors hover:border-slate-600 hover:bg-slate-800/30">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                <Users size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Invite collaborators</p>
                <p className="text-xs text-slate-500">
                  Work together on this project
                </p>
              </div>
            </button>
          </div>

          {/* Actions */}
          <div className="mt-6">
            <Button variant="outline" onClick={onClose} className="w-full">
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ShareModal
