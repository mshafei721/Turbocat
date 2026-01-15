'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { LandingNav } from './LandingNav'
import { LandingHero } from './LandingHero'
import { LandingFooter } from './LandingFooter'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { GitHubIcon } from '@/components/icons/github-icon'
import { getEnabledAuthProviders } from '@/lib/auth/providers'
import { redirectToSignIn } from '@/lib/session/redirect-to-sign-in'

interface LandingPageProps {
  user?: { id: string; email?: string; username?: string; avatar?: string; name?: string } | null
  className?: string
}

export function LandingPage({ user, className }: LandingPageProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [showSignInDialog, setShowSignInDialog] = React.useState(false)
  const [loadingVercel, setLoadingVercel] = React.useState(false)
  const [loadingGitHub, setLoadingGitHub] = React.useState(false)
  const [pendingPrompt, setPendingPrompt] = React.useState<string | null>(null)

  const { github: hasGitHub, vercel: hasVercel } = getEnabledAuthProviders()

  const handlePromptSubmit = async (prompt: string) => {
    if (!user) {
      // Save prompt and show sign in dialog
      setPendingPrompt(prompt)
      setShowSignInDialog(true)
      return
    }

    // User is logged in, redirect to new project page with prompt
    setIsLoading(true)

    // Store prompt in localStorage to be picked up by the new project page
    localStorage.setItem('turbocat-pending-prompt', prompt)

    // Navigate to new project flow
    router.push('/new')
  }

  const handleSignIn = () => {
    setShowSignInDialog(true)
  }

  const handleVercelSignIn = async () => {
    setLoadingVercel(true)
    if (pendingPrompt) {
      localStorage.setItem('turbocat-pending-prompt', pendingPrompt)
    }
    await redirectToSignIn()
  }

  const handleGitHubSignIn = () => {
    setLoadingGitHub(true)
    if (pendingPrompt) {
      localStorage.setItem('turbocat-pending-prompt', pendingPrompt)
    }
    window.location.href = '/api/auth/signin/github'
  }

  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {/* Navigation */}
      <LandingNav user={user} onSignIn={handleSignIn} />

      {/* Main Content */}
      <main>
        <LandingHero onSubmit={handlePromptSubmit} isLoading={isLoading} />
      </main>

      {/* Footer */}
      <LandingFooter />

      {/* Sign In Dialog */}
      <Dialog open={showSignInDialog} onOpenChange={setShowSignInDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to continue</DialogTitle>
            <DialogDescription>
              {hasGitHub && hasVercel
                ? 'Choose how you want to sign in to start building.'
                : hasVercel
                  ? 'Sign in with Vercel to start building.'
                  : 'Sign in with GitHub to start building.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-4">
            {hasVercel && (
              <Button
                onClick={handleVercelSignIn}
                disabled={loadingVercel || loadingGitHub}
                variant="outline"
                size="lg"
                className="w-full"
              >
                {loadingVercel ? (
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
                    Loading...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 76 65" className="h-3 w-3 mr-2" fill="currentColor">
                      <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                    </svg>
                    Sign in with Vercel
                  </>
                )}
              </Button>
            )}

            {hasGitHub && (
              <Button
                onClick={handleGitHubSignIn}
                disabled={loadingVercel || loadingGitHub}
                variant="outline"
                size="lg"
                className="w-full"
              >
                {loadingGitHub ? (
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
                    Loading...
                  </>
                ) : (
                  <>
                    <GitHubIcon className="h-4 w-4 mr-2" />
                    Sign in with GitHub
                  </>
                )}
              </Button>
            )}
          </div>

          {pendingPrompt && (
            <p className="text-xs text-muted-foreground text-center">
              Your idea will be saved and ready to build after signing in.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default LandingPage
