'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { List, X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Logo } from './Logo'

interface LandingNavProps {
  className?: string
  user?: { id: string; email?: string } | null
  onSignIn?: () => void
}

const navLinks = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/blog', label: 'Blog' },
  { href: '/community', label: 'Community' },
  { href: '/faqs', label: 'FAQs' },
  { href: '/docs', label: 'Docs' },
]

export function LandingNav({ className, user, onSignIn }: LandingNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-lg',
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Logo size="md" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-foreground"
              >
                {link.label}
              </Button>
            </Link>
          ))}
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Link href="/dashboard">
              <Button size="sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300"
                onClick={onSignIn}
              >
                Log in
              </Button>
              <Button size="sm" onClick={onSignIn}>
                Get started
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <List size={24} />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="border-t border-slate-800 bg-slate-950 px-4 py-4 md:hidden"
        >
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-400"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
            <div className="my-2 border-t border-slate-800" />
            {user ? (
              <Link href="/dashboard">
                <Button className="w-full">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="w-full text-slate-300"
                  onClick={onSignIn}
                >
                  Log in
                </Button>
                <Button className="w-full" onClick={onSignIn}>
                  Get started
                </Button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.nav>
  )
}

export default LandingNav
