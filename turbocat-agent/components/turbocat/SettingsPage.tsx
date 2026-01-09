'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Bell, Moon, Globe, Shield, Trash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from './Logo'

interface SettingsPageProps {
  user: {
    id: string
    email?: string
    username?: string
  }
}

interface SettingItemProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}

function SettingItem({ icon, title, description, action }: SettingItemProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex items-center gap-3">
        <div className="text-slate-400">{icon}</div>
        <div>
          <p className="text-sm font-medium text-white">{title}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function SettingsPage({ user }: SettingsPageProps) {
  const router = useRouter()

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
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-8"
        >
          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <p className="mt-2 text-slate-400">Manage your app preferences</p>
          </div>

          {/* Appearance */}
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white">Appearance</CardTitle>
              <CardDescription className="text-slate-400">
                Customize how Turbocat looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingItem
                icon={<Moon size={20} />}
                title="Theme"
                description="Dark mode is always on for optimal coding"
                action={
                  <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                    Dark
                  </span>
                }
              />
              <SettingItem
                icon={<Globe size={20} />}
                title="Language"
                description="Interface language"
                action={
                  <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
                    English
                  </span>
                }
              />
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white">Notifications</CardTitle>
              <CardDescription className="text-slate-400">
                Configure how you receive updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingItem
                icon={<Bell size={20} />}
                title="Email Notifications"
                description="Receive updates about your projects"
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Configure
                  </Button>
                }
              />
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white">Security</CardTitle>
              <CardDescription className="text-slate-400">
                Manage your account security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingItem
                icon={<Shield size={20} />}
                title="Connected Accounts"
                description="Manage OAuth connections"
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    onClick={() => router.push('/profile')}
                  >
                    View
                  </Button>
                }
              />
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-900/50 bg-red-950/20">
            <CardHeader>
              <CardTitle className="text-red-400">Danger Zone</CardTitle>
              <CardDescription className="text-red-400/70">
                Irreversible actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SettingItem
                icon={<Trash size={20} className="text-red-400" />}
                title="Delete Account"
                description="Permanently delete your account and all data"
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-900/50 text-red-400 hover:bg-red-950/40"
                  >
                    Delete
                  </Button>
                }
              />
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}

export default SettingsPage
