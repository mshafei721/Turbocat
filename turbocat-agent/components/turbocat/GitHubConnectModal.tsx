'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GithubLogo,
  Plus,
  ArrowRight,
  X,
  Spinner,
  Check,
  Warning,
  Globe,
  Lock,
  MagnifyingGlass,
  CaretDown,
} from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type Step = 'choice' | 'create-repo' | 'select-repo' | 'pushing' | 'success' | 'error'

interface GitHubRepo {
  name: string
  full_name: string
  owner: string
  description?: string
  private: boolean
  clone_url: string
  updated_at: string
  language?: string
}

interface GitHubConnectModalProps {
  isOpen: boolean
  onClose: () => void
  onSkip: () => void
  taskId: string
  projectName: string
}

export function GitHubConnectModal({
  isOpen,
  onClose,
  onSkip,
  taskId,
  projectName,
}: GitHubConnectModalProps) {
  const [step, setStep] = React.useState<Step>('choice')
  const [isGitHubConnected, setIsGitHubConnected] = React.useState<boolean | null>(null)
  const [githubUsername, setGithubUsername] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  // Create repo state
  const [repoName, setRepoName] = React.useState(
    projectName.toLowerCase().replace(/[^a-z0-9._-]/g, '-').replace(/-+/g, '-')
  )
  const [repoDescription, setRepoDescription] = React.useState('')
  const [isPrivate, setIsPrivate] = React.useState(true)
  const [isCreating, setIsCreating] = React.useState(false)

  // Select repo state
  const [repos, setRepos] = React.useState<GitHubRepo[]>([])
  const [isLoadingRepos, setIsLoadingRepos] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [selectedRepo, setSelectedRepo] = React.useState<GitHubRepo | null>(null)

  // Pushing state
  const [pushProgress, setPushProgress] = React.useState(0)
  const [pushMessage, setPushMessage] = React.useState('')

  // Success state
  const [createdRepoUrl, setCreatedRepoUrl] = React.useState<string | null>(null)

  // Check GitHub connection on mount
  React.useEffect(() => {
    async function checkGitHub() {
      try {
        const res = await fetch('/api/github/user')
        if (res.ok) {
          const data = await res.json()
          setIsGitHubConnected(true)
          setGithubUsername(data.login)
        } else {
          setIsGitHubConnected(false)
        }
      } catch {
        setIsGitHubConnected(false)
      }
    }

    if (isOpen) {
      checkGitHub()
    }
  }, [isOpen])

  // Fetch repos when selecting
  React.useEffect(() => {
    async function fetchRepos() {
      if (step !== 'select-repo' || !isGitHubConnected) return

      setIsLoadingRepos(true)
      try {
        const params = new URLSearchParams({
          per_page: '50',
          ...(searchQuery && { search: searchQuery }),
        })
        const res = await fetch(`/api/github/user-repos?${params}`)
        if (res.ok) {
          const data = await res.json()
          setRepos(data.repos || [])
        }
      } catch (err) {
        console.error('Error fetching repos:', err)
      } finally {
        setIsLoadingRepos(false)
      }
    }

    const debounce = setTimeout(fetchRepos, 300)
    return () => clearTimeout(debounce)
  }, [step, isGitHubConnected, searchQuery])

  const handleConnectGitHub = () => {
    // Redirect to GitHub OAuth flow
    window.location.href = '/api/auth/signin/github?redirect=/project/' + taskId
  }

  const handleCreateRepo = async () => {
    if (!repoName.trim()) return

    setIsCreating(true)
    setError(null)

    try {
      // Create the repo
      const createRes = await fetch('/api/github/repos/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: repoName,
          description: repoDescription,
          private: isPrivate,
        }),
      })

      if (!createRes.ok) {
        const data = await createRes.json()
        throw new Error(data.error || 'Failed to create repository')
      }

      const repoData = await createRes.json()

      // Push to the new repo
      await pushToRepo(repoData.full_name, repoData.html_url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create repository')
      setStep('error')
    } finally {
      setIsCreating(false)
    }
  }

  const handleSelectRepo = async () => {
    if (!selectedRepo) return

    await pushToRepo(selectedRepo.full_name, `https://github.com/${selectedRepo.full_name}`)
  }

  const pushToRepo = async (repoFullName: string, repoUrl: string) => {
    setStep('pushing')
    setPushProgress(0)
    setPushMessage('Initializing...')
    setError(null)

    try {
      // Step 1: Push sandbox files to GitHub
      setPushProgress(20)
      setPushMessage('Connecting to GitHub...')

      const pushRes = await fetch(`/api/tasks/${taskId}/push-to-github`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoFullName }),
      })

      if (!pushRes.ok) {
        const data = await pushRes.json()
        throw new Error(data.error || 'Failed to push to GitHub')
      }

      setPushProgress(60)
      setPushMessage('Pushing files...')

      // Simulate progress for UX
      await new Promise(resolve => setTimeout(resolve, 1000))
      setPushProgress(80)
      setPushMessage('Finalizing...')

      await new Promise(resolve => setTimeout(resolve, 500))
      setPushProgress(100)
      setPushMessage('Complete!')

      setCreatedRepoUrl(repoUrl)
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to push to GitHub')
      setStep('error')
    }
  }

  const handleReset = () => {
    setStep('choice')
    setError(null)
    setPushProgress(0)
    setPushMessage('')
    setSelectedRepo(null)
  }

  const renderChoiceStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-white">
          <GithubLogo size={24} weight="fill" />
          Connect to GitHub
        </DialogTitle>
        <DialogDescription className="text-slate-400">
          Your project is ready! Save it to GitHub to keep your code safe and collaborate with others.
        </DialogDescription>
      </DialogHeader>

      {isGitHubConnected === false && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <Warning size={20} className="text-amber-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-400">GitHub not connected</p>
              <p className="text-xs text-slate-400 mt-1">
                Connect your GitHub account to push your project.
              </p>
              <Button
                onClick={handleConnectGitHub}
                className="mt-3 bg-slate-800 hover:bg-slate-700"
                size="sm"
              >
                <GithubLogo size={16} className="mr-2" />
                Connect GitHub
              </Button>
            </div>
          </div>
        </div>
      )}

      {isGitHubConnected && (
        <div className="space-y-3">
          <button
            onClick={() => setStep('create-repo')}
            className="w-full flex items-center gap-4 p-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600 transition-all group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-400">
              <Plus size={20} weight="bold" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-white">Create new repository</p>
              <p className="text-sm text-slate-400">Start fresh with a new GitHub repo</p>
            </div>
            <ArrowRight size={20} className="text-slate-500 group-hover:text-white transition-colors" />
          </button>

          <button
            onClick={() => setStep('select-repo')}
            className="w-full flex items-center gap-4 p-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600 transition-all group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <GithubLogo size={20} weight="fill" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-white">Push to existing repository</p>
              <p className="text-sm text-slate-400">Add to an existing GitHub repo</p>
            </div>
            <ArrowRight size={20} className="text-slate-500 group-hover:text-white transition-colors" />
          </button>
        </div>
      )}

      <DialogFooter className="mt-6">
        <Button variant="ghost" onClick={onSkip} className="text-slate-400 hover:text-white">
          Skip for now
        </Button>
      </DialogFooter>
    </motion.div>
  )

  const renderCreateRepoStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <DialogHeader>
        <DialogTitle className="text-white">Create new repository</DialogTitle>
        <DialogDescription className="text-slate-400">
          Create a new GitHub repository for your project.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-300 mb-1.5 block">
            Repository name
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">{githubUsername}/</span>
            <Input
              value={repoName}
              onChange={(e) => setRepoName(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '-'))}
              placeholder="my-awesome-project"
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300 mb-1.5 block">
            Description <span className="text-slate-500">(optional)</span>
          </label>
          <Input
            value={repoDescription}
            onChange={(e) => setRepoDescription(e.target.value)}
            placeholder="A brief description of your project"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300 mb-1.5 block">
            Visibility
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setIsPrivate(false)}
              className={cn(
                'flex-1 flex items-center gap-3 p-3 rounded-lg border transition-all',
                !isPrivate
                  ? 'border-green-500 bg-green-500/10 text-white'
                  : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
              )}
            >
              <Globe size={18} />
              <div className="text-left">
                <p className="font-medium text-sm">Public</p>
                <p className="text-xs text-slate-500">Anyone can see</p>
              </div>
            </button>
            <button
              onClick={() => setIsPrivate(true)}
              className={cn(
                'flex-1 flex items-center gap-3 p-3 rounded-lg border transition-all',
                isPrivate
                  ? 'border-amber-500 bg-amber-500/10 text-white'
                  : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
              )}
            >
              <Lock size={18} />
              <div className="text-left">
                <p className="font-medium text-sm">Private</p>
                <p className="text-xs text-slate-500">Only you can see</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <DialogFooter className="mt-6">
        <Button variant="ghost" onClick={() => setStep('choice')} className="text-slate-400">
          Back
        </Button>
        <Button
          onClick={handleCreateRepo}
          disabled={!repoName.trim() || isCreating}
          className="bg-green-600 hover:bg-green-700"
        >
          {isCreating ? (
            <>
              <Spinner size={16} className="mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus size={16} className="mr-2" />
              Create & Push
            </>
          )}
        </Button>
      </DialogFooter>
    </motion.div>
  )

  const renderSelectRepoStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <DialogHeader>
        <DialogTitle className="text-white">Select repository</DialogTitle>
        <DialogDescription className="text-slate-400">
          Choose an existing repository to push your project to.
        </DialogDescription>
      </DialogHeader>

      <div className="relative">
        <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search repositories..."
          className="pl-9"
        />
      </div>

      <div className="max-h-64 overflow-auto rounded-lg border border-slate-700 bg-slate-800/30">
        {isLoadingRepos ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size={24} className="animate-spin text-slate-500" />
          </div>
        ) : repos.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500">
            {searchQuery ? 'No repositories found' : 'No repositories available'}
          </div>
        ) : (
          repos.map((repo) => (
            <button
              key={repo.full_name}
              onClick={() => setSelectedRepo(repo)}
              className={cn(
                'w-full flex items-center gap-3 p-3 border-b border-slate-700/50 last:border-0 transition-colors',
                selectedRepo?.full_name === repo.full_name
                  ? 'bg-blue-500/10'
                  : 'hover:bg-slate-800/50'
              )}
            >
              <div className={cn(
                'h-5 w-5 rounded-full border-2 flex items-center justify-center',
                selectedRepo?.full_name === repo.full_name
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-slate-600'
              )}>
                {selectedRepo?.full_name === repo.full_name && (
                  <Check size={12} className="text-white" weight="bold" />
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white text-sm">{repo.name}</span>
                  {repo.private ? (
                    <Lock size={12} className="text-amber-400" />
                  ) : (
                    <Globe size={12} className="text-slate-500" />
                  )}
                </div>
                {repo.description && (
                  <p className="text-xs text-slate-500 truncate">{repo.description}</p>
                )}
              </div>
              {repo.language && (
                <span className="text-xs text-slate-500">{repo.language}</span>
              )}
            </button>
          ))
        )}
      </div>

      <DialogFooter className="mt-6">
        <Button variant="ghost" onClick={() => setStep('choice')} className="text-slate-400">
          Back
        </Button>
        <Button
          onClick={handleSelectRepo}
          disabled={!selectedRepo}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <ArrowRight size={16} className="mr-2" />
          Push to Repository
        </Button>
      </DialogFooter>
    </motion.div>
  )

  const renderPushingStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 py-4"
    >
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="inline-block"
        >
          <GithubLogo size={48} className="text-white" weight="fill" />
        </motion.div>
        <h3 className="mt-4 text-lg font-semibold text-white">Pushing to GitHub</h3>
        <p className="text-sm text-slate-400 mt-1">{pushMessage}</p>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-green-500"
          initial={{ width: 0 }}
          animate={{ width: `${pushProgress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </motion.div>
  )

  const renderSuccessStep = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-6 py-4 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20"
      >
        <Check size={32} className="text-green-400" weight="bold" />
      </motion.div>

      <div>
        <h3 className="text-lg font-semibold text-white">Successfully pushed to GitHub!</h3>
        <p className="text-sm text-slate-400 mt-1">Your project is now saved on GitHub.</p>
      </div>

      {createdRepoUrl && (
        <a
          href={createdRepoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <GithubLogo size={16} weight="fill" />
          View on GitHub
          <ArrowRight size={14} />
        </a>
      )}

      <DialogFooter className="mt-6">
        <Button onClick={onClose} className="w-full bg-slate-800 hover:bg-slate-700">
          Done
        </Button>
      </DialogFooter>
    </motion.div>
  )

  const renderErrorStep = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-6 py-4 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20"
      >
        <X size={32} className="text-red-400" weight="bold" />
      </motion.div>

      <div>
        <h3 className="text-lg font-semibold text-white">Something went wrong</h3>
        <p className="text-sm text-red-400 mt-1">{error}</p>
      </div>

      <DialogFooter className="mt-6 flex-col gap-2">
        <Button onClick={handleReset} className="w-full bg-slate-800 hover:bg-slate-700">
          Try Again
        </Button>
        <Button variant="ghost" onClick={onSkip} className="w-full text-slate-400">
          Skip for now
        </Button>
      </DialogFooter>
    </motion.div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" showCloseButton={step === 'choice'}>
        <AnimatePresence mode="wait">
          {step === 'choice' && renderChoiceStep()}
          {step === 'create-repo' && renderCreateRepoStep()}
          {step === 'select-repo' && renderSelectRepoStep()}
          {step === 'pushing' && renderPushingStep()}
          {step === 'success' && renderSuccessStep()}
          {step === 'error' && renderErrorStep()}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}

export default GitHubConnectModal
