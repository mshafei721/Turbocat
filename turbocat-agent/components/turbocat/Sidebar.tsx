'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  House,
  Gear,
  Plus,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Logo } from './Logo'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SidebarProps {
  className?: string
}

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  badge?: string
}

const mainNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: House },
]

const bottomNavItems: NavItem[] = [
  { href: '/settings', label: 'Settings', icon: Gear },
]

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)

  const sidebarVariants = {
    expanded: { width: 240 },
    collapsed: { width: 72 },
  }

  const itemVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -10 },
  }

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

    const button = (
      <Link href={item.href} className="w-full">
        <Button
          variant={isActive ? 'secondary' : 'ghost'}
          className={cn(
            'w-full justify-start gap-3',
            collapsed && 'justify-center px-0',
            isActive && 'bg-slate-800 text-foreground'
          )}
        >
          <Icon
            size={20}
            weight={isActive ? 'fill' : 'regular'}
            className={cn(
              isActive ? 'text-primary' : 'text-slate-400',
              collapsed && 'mx-auto'
            )}
          />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                variants={itemVariants}
                transition={{ duration: 0.2 }}
                className="flex-1 text-left"
              >
                {item.label}
              </motion.span>
            )}
          </AnimatePresence>
          {item.badge && !collapsed && (
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
              {item.badge}
            </span>
          )}
        </Button>
      </Link>
    )

    if (collapsed) {
      return (
        <Tooltip key={item.href}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      )
    }

    return <div key={item.href}>{button}</div>
  }

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial="expanded"
        animate={collapsed ? 'collapsed' : 'expanded'}
        variants={sidebarVariants}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={cn(
          'relative flex h-screen flex-col border-r border-slate-800 bg-slate-950',
          className
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <Logo size="sm" showText={!collapsed} />
        </div>

        {/* New Project Button */}
        <div className="p-4">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/new">
                  <Button className="w-full" size="icon">
                    <Plus size={20} weight="bold" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">New Project</TooltipContent>
            </Tooltip>
          ) : (
            <Link href="/new">
              <Button className="w-full gap-2">
                <Plus size={18} weight="bold" />
                <motion.span
                  initial="collapsed"
                  animate="expanded"
                  variants={itemVariants}
                  transition={{ duration: 0.2 }}
                >
                  New Project
                </motion.span>
              </Button>
            </Link>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 px-3">
          {mainNavItems.map(renderNavItem)}
        </nav>

        {/* Bottom Navigation */}
        <div className="space-y-1 border-t border-slate-800 p-3">
          {bottomNavItems.map(renderNavItem)}
        </div>

        {/* Collapse Toggle */}
        <div className="absolute -right-3 top-20">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 rounded-full border-slate-700 bg-slate-900 shadow-md hover:bg-slate-800"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? (
              <CaretRight size={12} className="text-slate-400" />
            ) : (
              <CaretLeft size={12} className="text-slate-400" />
            )}
          </Button>
        </div>
      </motion.aside>
    </TooltipProvider>
  )
}

export default Sidebar
