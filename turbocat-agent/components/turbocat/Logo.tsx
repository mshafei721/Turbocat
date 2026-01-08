'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  href?: string
}

const sizeMap = {
  sm: { icon: 24, text: 'text-lg' },
  md: { icon: 32, text: 'text-xl' },
  lg: { icon: 40, text: 'text-2xl' },
}

export function Logo({ className, size = 'md', showText = true, href = '/' }: LogoProps) {
  const { icon, text } = sizeMap[size]

  const content = (
    <div className={cn('flex items-center gap-2', className)}>
      <Image
        src="/turbocat-logo.png"
        alt="Turbocat"
        width={icon}
        height={icon}
        className="object-contain"
        priority
      />
      {showText && (
        <span className={cn('font-bold tracking-tight text-foreground', text)}>
          Turbo<span className="text-primary">cat</span>
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="transition-opacity hover:opacity-80">
        {content}
      </Link>
    )
  }

  return content
}

export default Logo
