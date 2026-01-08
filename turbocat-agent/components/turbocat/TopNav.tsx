'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  House,
  FolderSimple,
  Gear,
  Plus,
  Bell,
  MagnifyingGlass,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Logo } from './Logo'
import { UserMenu } from './UserMenu'

interface TopNavProps {
  className?: string
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: House },
  { href: '/projects', label: 'Projects', icon: FolderSimple },
]

export function TopNav({ className }: TopNavProps) {
  const pathname = usePathname()

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-lg',
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Section: Logo + Navigation */}
        <div className="flex items-center gap-8">
          <Logo size="md" />

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn(
                      'gap-2',
                      isActive && 'bg-slate-800 text-foreground'
                    )}
                  >
                    <Icon
                      size={18}
                      weight={isActive ? 'fill' : 'regular'}
                      className={isActive ? 'text-primary' : 'text-slate-400'}
                    />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right Section: Actions + User */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden text-slate-400 hover:text-foreground sm:flex"
          >
            <MagnifyingGlass size={20} />
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-slate-400 hover:text-foreground"
          >
            <Bell size={20} />
            {/* Notification dot */}
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
          </Button>

          {/* New Project Button */}
          <Button size="sm" className="hidden gap-2 sm:flex">
            <Plus size={18} weight="bold" />
            New Project
          </Button>

          {/* User Menu */}
          <UserMenu />
        </div>
      </div>
    </motion.header>
  )
}

export default TopNav
