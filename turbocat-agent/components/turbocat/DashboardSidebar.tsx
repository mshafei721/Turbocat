'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Plus,
  SquaresFour,
  Gear,
  DeviceMobile,
  Users,
  Copy,
  CaretDown,
  SignOut,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Logo } from './Logo'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'

interface DashboardSidebarProps {
  user?: {
    id: string
    email?: string
    username?: string
    avatar?: string
  } | null
  className?: string
}

const navItems = [
  { href: '/dashboard', label: 'App library', icon: SquaresFour },
  { href: '/settings', label: 'Settings', icon: Gear },
]

export function DashboardSidebar({ user, className }: DashboardSidebarProps) {
  const pathname = usePathname()

  const handleCopyReferral = () => {
    const referralLink = `https://turbocat.app/ref/${user?.id || 'invite'}`
    navigator.clipboard.writeText(referralLink)
    toast.success('Referral link copied!')
  }

  const userInitials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : user?.email
      ? user.email.slice(0, 2).toUpperCase()
      : 'TC'

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-950',
        className
      )}
    >
      {/* Logo */}
      <div className="p-4">
        <Link href="/">
          <Logo size="md" />
        </Link>
      </div>

      {/* New App Button */}
      <div className="px-3 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full justify-between gap-2">
              <span className="flex items-center gap-2">
                <Plus size={18} weight="bold" />
                New app
              </span>
              <CaretDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/new?platform=web">
                <span>Web App</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/new?platform=mobile">
                <span>Mobile App</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/new">
                <span>From prompt...</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-3',
                      isActive && 'bg-slate-800 text-foreground'
                    )}
                  >
                    <Icon
                      size={20}
                      weight={isActive ? 'fill' : 'regular'}
                      className={isActive ? 'text-primary' : 'text-slate-400'}
                    />
                    {item.label}
                  </Button>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto border-t border-slate-800 p-3">
        {/* Get Mobile App */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-400 hover:text-foreground"
        >
          <DeviceMobile size={20} />
          Get the mobile app
        </Button>

        {/* Refer Friends */}
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Users size={18} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-300">Refer friends</span>
          </div>
          <p className="mb-3 text-xs text-slate-500">
            If someone signs up with your referral, you both get free credits!
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="w-full gap-2"
            onClick={handleCopyReferral}
          >
            <Copy size={14} />
            Copy referral link
          </Button>
        </div>

        {/* User Profile */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="mt-4 flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-slate-800">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-slate-700 text-xs">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium text-foreground">
                    {user.username || user.email}
                  </p>
                </div>
                <CaretDown size={14} className="text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Gear size={16} className="mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/api/auth/signout" className="text-destructive">
                  <SignOut size={16} className="mr-2" />
                  Sign out
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </motion.aside>
  )
}

export default DashboardSidebar
