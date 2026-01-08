'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  DeviceMobile,
  DiscordLogo,
  TwitterLogo,
  InstagramLogo,
  LinkedinLogo,
  YoutubeLogo,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Logo } from './Logo'

interface LandingFooterProps {
  className?: string
}

const footerLinks = {
  product: {
    title: 'Vibecode',
    links: [
      { href: '/blog', label: 'Blog' },
    ],
  },
  account: {
    title: 'Account',
    links: [
      { href: '/dashboard', label: 'My projects' },
      { href: '/profile', label: 'Profile' },
      { href: '/referrals', label: 'Referrals' },
      { href: '/settings', label: 'Settings' },
    ],
  },
  resources: {
    title: 'Resources',
    links: [
      { href: '/faqs', label: 'FAQ' },
      { href: '/docs', label: 'Docs' },
    ],
  },
  pricing: {
    title: 'Product',
    links: [
      { href: '/pricing', label: 'Pricing' },
      { href: '/docs', label: 'Docs' },
    ],
  },
  community: {
    title: 'Community',
    links: [
      { href: 'https://discord.gg/turbocat', label: 'Discord', external: true },
      { href: 'https://twitter.com/turbocat', label: 'X / Twitter', external: true },
      { href: 'https://instagram.com/turbocat', label: 'Instagram', external: true },
      { href: 'https://linkedin.com/company/turbocat', label: 'LinkedIn', external: true },
      { href: 'https://youtube.com/@turbocat', label: 'YouTube', external: true },
    ],
  },
}

const socialLinks = [
  { href: 'https://discord.gg/turbocat', icon: DiscordLogo, label: 'Discord' },
  { href: 'https://twitter.com/turbocat', icon: TwitterLogo, label: 'Twitter' },
  { href: 'https://instagram.com/turbocat', icon: InstagramLogo, label: 'Instagram' },
  { href: 'https://linkedin.com/company/turbocat', icon: LinkedinLogo, label: 'LinkedIn' },
  { href: 'https://youtube.com/@turbocat', icon: YoutubeLogo, label: 'YouTube' },
]

export function LandingFooter({ className }: LandingFooterProps) {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={cn(
        'border-t border-slate-800 bg-slate-950',
        className
      )}
    >
      <div className="mx-auto max-w-screen-xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Logo size="md" className="mb-4" />

            {/* Mobile App CTA */}
            <Button
              variant="outline"
              size="sm"
              className="mt-4 gap-2 border-slate-700 text-slate-400 hover:text-foreground"
            >
              <DeviceMobile size={18} />
              Get the mobile app
            </Button>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-4">
            {Object.entries(footerLinks).slice(0, 4).map(([key, section]) => (
              <div key={key}>
                <h3 className="mb-3 text-sm font-semibold text-slate-300">
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        target={'external' in link && link.external ? '_blank' : undefined}
                        rel={'external' in link && link.external ? 'noopener noreferrer' : undefined}
                        className="text-sm text-slate-500 transition-colors hover:text-slate-300"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 sm:flex-row">
          <p className="text-sm text-slate-500">
            <Link href="/terms" className="hover:text-slate-300">
              Terms of service
            </Link>
          </p>

          <p className="text-sm text-slate-500">
            All rights reserved &copy; {new Date().getFullYear()} Turbocat, Inc.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-2">
            {socialLinks.map((social) => {
              const Icon = social.icon
              return (
                <Link
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
                  aria-label={social.label}
                >
                  <Icon size={18} />
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </motion.footer>
  )
}

export default LandingFooter
