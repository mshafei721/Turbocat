'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Bell,
  Moon,
  Globe,
  Shield,
  Trash,
  Coins,
  UserPlus,
  Gift,
  Copy,
  Check,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface SettingsPageProps {
  user: {
    id: string
    email?: string
    username?: string
  }
  credits?: number
  referralCode?: string
  referralCount?: number
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

export function SettingsPage({
  user,
  credits = 0,
  referralCode = '',
  referralCount = 0,
}: SettingsPageProps) {
  const router = useRouter()
  const [promoCode, setPromoCode] = React.useState('')
  const [isRedeemingPromo, setIsRedeemingPromo] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const handleCopyReferralCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRedeemPromo = async () => {
    if (!promoCode.trim()) return
    setIsRedeemingPromo(true)
    // TODO: Implement promo code redemption API
    setTimeout(() => {
      setIsRedeemingPromo(false)
      setPromoCode('')
    }, 1000)
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
            <h1 className="text-3xl font-bold text-white">Settings</h1>
            <p className="mt-2 text-slate-400">Manage your app preferences</p>
          </div>

          {/* Credits */}
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Coins size={20} className="text-amber-400" />
                Credits
              </CardTitle>
              <CardDescription className="text-slate-400">
                Your current balance and usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                <div>
                  <p className="text-xs text-slate-500">Available Credits</p>
                  <p className="text-2xl font-bold text-white">{credits.toLocaleString()}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-500/50 text-amber-400 hover:bg-amber-950/40"
                >
                  Buy Credits
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Credits are used for AI code generation. 1 credit = 1 AI request.
              </p>
            </CardContent>
          </Card>

          {/* Referrals */}
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <UserPlus size={20} className="text-teal-400" />
                Referrals
              </CardTitle>
              <CardDescription className="text-slate-400">
                Invite friends and earn credits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                  <p className="text-xs text-slate-500">Friends Invited</p>
                  <p className="text-2xl font-bold text-white">{referralCount}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                  <p className="text-xs text-slate-500">Credits Earned</p>
                  <p className="text-2xl font-bold text-teal-400">{referralCount * 100}</p>
                </div>
              </div>
              {referralCode && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2">
                    <p className="text-xs text-slate-500">Your Referral Code</p>
                    <p className="font-mono text-sm text-white">{referralCode}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyReferralCode}
                    className="h-10 w-10 border-slate-700"
                  >
                    {copied ? (
                      <Check size={16} className="text-green-400" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </Button>
                </div>
              )}
              <p className="text-xs text-slate-500">
                Earn 100 credits for each friend who signs up with your code.
              </p>
            </CardContent>
          </Card>

          {/* Promo Codes */}
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Gift size={20} className="text-purple-400" />
                Promo Codes
              </CardTitle>
              <CardDescription className="text-slate-400">
                Redeem codes for free credits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="font-mono uppercase"
                />
                <Button
                  onClick={handleRedeemPromo}
                  disabled={!promoCode.trim() || isRedeemingPromo}
                  className="shrink-0"
                >
                  {isRedeemingPromo ? 'Redeeming...' : 'Redeem'}
                </Button>
              </div>
            </CardContent>
          </Card>

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
    </div>
  )
}

export default SettingsPage
