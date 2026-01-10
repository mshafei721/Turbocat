'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, Envelope, SignOut, Gear, Camera } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { AuthProvider } from '@/lib/session/types'

interface ProfilePageProps {
  user: {
    id: string
    email?: string
    username?: string
    avatar?: string
    name?: string
  }
  authProvider?: AuthProvider | null
}

export function ProfilePage({ user, authProvider }: ProfilePageProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Logout failed:', error)
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-8"
        >
          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold text-white">Profile</h1>
            <p className="mt-2 text-slate-400">Manage your account settings</p>
          </div>

          {/* Profile Card */}
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white">Account Information</CardTitle>
              <CardDescription className="text-slate-400">
                Your profile information from {authProvider === 'github' ? 'GitHub' : 'Vercel'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || user.username || 'User'}
                      className="h-20 w-20 rounded-full border-2 border-slate-700"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-500 text-2xl font-bold text-white">
                      {(user.name || user.username || user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
                    <Camera size={16} />
                  </button>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {user.name || user.username || 'User'}
                  </h3>
                  <p className="text-sm text-slate-400">@{user.username || 'user'}</p>
                </div>
              </div>

              {/* Info Fields */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                  <User size={20} className="text-slate-400" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Username</p>
                    <p className="text-sm text-white">{user.username || 'Not set'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                  <Envelope size={20} className="text-slate-400" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="text-sm text-white">{user.email || 'Not available'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                  <div className="flex h-5 w-5 items-center justify-center">
                    {authProvider === 'github' ? (
                      <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-400" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 76 65" className="h-4 w-4 text-slate-400" fill="currentColor">
                        <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Connected via</p>
                    <p className="text-sm text-white capitalize">{authProvider || 'Unknown'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 border-slate-800 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white"
              onClick={() => router.push('/settings')}
            >
              <Gear size={20} />
              Settings
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3 border-red-900/50 bg-red-950/20 text-red-400 hover:bg-red-950/40 hover:text-red-300"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
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
                  Signing out...
                </>
              ) : (
                <>
                  <SignOut size={20} />
                  Sign out
                </>
              )}
            </Button>
          </div>
        </motion.div>
    </div>
  )
}

export default ProfilePage
