'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  GoogleLogo,
  AppleLogo,
  Envelope,
  Lock,
  Eye,
  EyeSlash,
  ArrowRight,
  Sparkle,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Logo } from './Logo'
import { GitHubIcon } from '@/components/icons/github-icon'
import { getEnabledAuthProviders } from '@/lib/auth/providers'
import { redirectToSignIn } from '@/lib/session/redirect-to-sign-in'

interface AuthPageProps {
  mode?: 'login' | 'signup'
  className?: string
}

export function AuthPage({ mode = 'login', className }: AuthPageProps) {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [loadingProvider, setLoadingProvider] = React.useState<string | null>(null)

  const { github: hasGitHub, vercel: hasVercel, google: hasGoogle, apple: hasApple } = getEnabledAuthProviders()

  const isLogin = mode === 'login'

  const handleVercelSignIn = async () => {
    setLoadingProvider('vercel')
    await redirectToSignIn()
  }

  const handleGitHubSignIn = () => {
    setLoadingProvider('github')
    window.location.href = '/api/auth/signin/github'
  }

  const handleGoogleSignIn = () => {
    setLoadingProvider('google')
    window.location.href = '/api/auth/signin/google'
  }

  const handleAppleSignIn = () => {
    setLoadingProvider('apple')
    window.location.href = '/api/auth/signin/apple'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Handle email/password sign in
    // For now, redirect to GitHub/Vercel auth as that's the primary flow
    setTimeout(() => setIsLoading(false), 1000)
  }

  return (
    <div className={cn('min-h-screen flex', className)}>
      {/* Left Side - Auth Form */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex w-full flex-col justify-center px-8 py-12 lg:w-1/2 lg:px-16"
      >
        <div className="mx-auto w-full max-w-sm">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mb-8 flex justify-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/25">
              <span className="text-2xl font-bold text-white">T</span>
            </div>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mb-8 text-center"
          >
            <h1 className="text-2xl font-bold text-foreground">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {isLogin ? 'Continue where you left off' : 'Start building amazing apps'}
            </p>
          </motion.div>

          {/* Social Login Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="space-y-3"
          >
            {/* Google (if enabled) */}
            {hasGoogle && (
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-3 border-slate-700 bg-slate-800/50 hover:bg-slate-800"
                onClick={handleGoogleSignIn}
                disabled={loadingProvider !== null}
              >
                {loadingProvider === 'google' ? (
                  <LoadingSpinner />
                ) : (
                  <GoogleLogo size={20} weight="bold" className="text-foreground" />
                )}
                Continue with Google
              </Button>
            )}

            {/* Apple (if enabled) */}
            {hasApple && (
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-3 border-slate-700 bg-slate-800/50 hover:bg-slate-800"
                onClick={handleAppleSignIn}
                disabled={loadingProvider !== null}
              >
                {loadingProvider === 'apple' ? (
                  <LoadingSpinner />
                ) : (
                  <AppleLogo size={20} weight="fill" className="text-foreground" />
                )}
                Continue with Apple
              </Button>
            )}

            {/* GitHub (if enabled) */}
            {hasGitHub && (
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-3 border-slate-700 bg-slate-800/50 hover:bg-slate-800"
                onClick={handleGitHubSignIn}
                disabled={loadingProvider !== null}
              >
                {loadingProvider === 'github' ? (
                  <LoadingSpinner />
                ) : (
                  <GitHubIcon className="h-5 w-5" />
                )}
                Continue with GitHub
              </Button>
            )}

            {/* Vercel (if enabled) */}
            {hasVercel && (
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-3 border-slate-700 bg-slate-800/50 hover:bg-slate-800"
                onClick={handleVercelSignIn}
                disabled={loadingProvider !== null}
              >
                {loadingProvider === 'vercel' ? (
                  <LoadingSpinner />
                ) : (
                  <svg viewBox="0 0 76 65" className="h-4 w-4" fill="currentColor">
                    <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                  </svg>
                )}
                Continue with Vercel
              </Button>
            )}
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="my-6 flex items-center gap-4"
          >
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-xs text-slate-500">OR</span>
            <div className="h-px flex-1 bg-slate-800" />
          </motion.div>

          {/* Email/Password Form */}
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="relative">
              <Envelope
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={isLoading || loadingProvider !== null}
              />
            </div>

            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
                disabled={isLoading || loadingProvider !== null}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* TODO: Add forgot-password route when email auth is implemented
            {isLogin && (
              <div className="text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm text-slate-400 hover:text-primary"
                >
                  Forgot password?
                </Link>
              </div>
            )}
            */}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isLoading || loadingProvider !== null}
            >
              {isLoading ? <LoadingSpinner /> : isLogin ? 'Sign in' : 'Create account'}
            </Button>
          </motion.form>

          {/* Toggle Mode */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            className="mt-8 text-center text-sm text-slate-400"
          >
            {isLogin ? "New to Turbocat? " : "Already have an account? "}
            <Link
              href={isLogin ? '/signup' : '/login'}
              className="font-medium text-foreground hover:text-primary"
            >
              {isLogin ? 'Create an account' : 'Sign in'}
            </Link>
          </motion.p>
        </div>
      </motion.div>

      {/* Right Side - Preview/Promo */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative hidden w-1/2 overflow-hidden bg-gradient-radial lg:block"
      >
        {/* Subtle glow */}
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/5 blur-3xl" />

        <div className="relative flex h-full flex-col items-center justify-center px-12">
          {/* Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="w-full max-w-md"
          >
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 backdrop-blur-sm">
              <h2 className="mb-2 text-center text-2xl font-bold text-foreground">
                Any app in minutes
              </h2>
              <p className="mb-6 text-center text-slate-400">
                Just describe what you want
              </p>

              {/* Fake input preview */}
              <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                <p className="font-mono text-sm text-slate-300">
                  Vibecode a dating app with videos and AI matching
                  <span className="ml-1 inline-block h-4 w-0.5 animate-pulse bg-primary" />
                </p>
              </div>

              {/* Submit hint */}
              <div className="mt-4 flex justify-end">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
                  <ArrowRight size={18} className="text-slate-400" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sparkle decoration */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            className="absolute right-20 top-1/4"
          >
            <Sparkle size={32} weight="fill" className="text-orange-400/40" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.7 }}
            className="absolute bottom-1/3 left-16"
          >
            <Sparkle size={24} weight="fill" className="text-teal-400/40" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin"
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
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

export default AuthPage
