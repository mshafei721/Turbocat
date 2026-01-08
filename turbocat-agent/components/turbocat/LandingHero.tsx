'use client'

import * as React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { AppleLogo, ArrowRight, Sparkle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PromptInput } from './PromptInput'

interface LandingHeroProps {
  className?: string
  onSubmit?: (prompt: string) => void
  isLoading?: boolean
}

export function LandingHero({ className, onSubmit, isLoading }: LandingHeroProps) {
  return (
    <section
      className={cn(
        'relative min-h-screen overflow-hidden pt-24 pb-16',
        className
      )}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-radial" />

      {/* Subtle glow effect */}
      <div className="absolute left-1/2 top-1/4 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/5 blur-3xl" />

      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {/* Hero Content */}
        <div className="flex flex-col items-center text-center">
          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
              Turbocat Something{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                  Amazing
                </span>
                <Sparkle
                  size={24}
                  weight="fill"
                  className="absolute -right-6 -top-2 text-orange-400 animate-pulse"
                />
              </span>
            </h1>
          </motion.div>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-10 max-w-2xl text-lg text-slate-400 sm:text-xl"
          >
            Describe what you want to build and watch it come to life
          </motion.p>

          {/* Prompt Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-2xl"
          >
            <PromptInput
              onSubmit={onSubmit}
              isLoading={isLoading}
              placeholder="What do you want to create?"
              suggestions={[
                'A fitness tracking app with workout plans',
                'An expense tracker with beautiful charts',
                'A recipe app with shopping lists',
                'A habit tracker with streaks',
              ]}
            />
          </motion.div>

          {/* Enable Backend Toggle (placeholder for now) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-4"
          >
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-slate-500 hover:text-slate-300"
            >
              <span className="text-primary">+</span>
              Enable Backend
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                beta
              </span>
            </Button>
          </motion.div>
        </div>

        {/* Second Section: The app that builds apps */}
        <div className="mt-32 grid items-center gap-12 lg:grid-cols-2">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-6 text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">
              The app
              <br />
              that builds apps
            </h2>
            <p className="mb-8 text-lg text-slate-400">
              Create native apps in{' '}
              <span className="text-primary">seconds</span> with AI
            </p>

            {/* App Store Button */}
            <Button
              size="lg"
              variant="secondary"
              className="gap-3 rounded-xl bg-slate-800 hover:bg-slate-700"
            >
              <AppleLogo size={24} weight="fill" />
              <div className="flex flex-col items-start">
                <span className="text-xs text-slate-400">Download on the</span>
                <span className="text-sm font-semibold">App Store</span>
              </div>
            </Button>
          </motion.div>

          {/* Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative flex justify-center"
          >
            <div className="relative w-[280px] sm:w-[320px]">
              {/* Phone Frame */}
              <div className="relative overflow-hidden rounded-[40px] border border-slate-700 bg-slate-900 p-2 shadow-2xl">
                {/* Screen */}
                <div className="aspect-[9/19] overflow-hidden rounded-[32px] bg-slate-950">
                  {/* Status Bar */}
                  <div className="flex items-center justify-between px-6 py-3">
                    <span className="text-xs text-slate-400">10:39</span>
                    <div className="h-6 w-20 rounded-full bg-slate-800" />
                    <div className="flex items-center gap-1">
                      <div className="h-3 w-3 rounded-full bg-slate-600" />
                      <div className="h-3 w-5 rounded bg-slate-600" />
                    </div>
                  </div>

                  {/* App Content Preview */}
                  <div className="px-4 py-6">
                    <p className="mb-6 text-lg text-slate-300">
                      <span className="text-primary">D</span>escribe your
                      <br />
                      app idea....
                    </p>

                    {/* Suggestion Pills */}
                    <div className="space-y-2">
                      {['Note taking app', 'Step tracking app', 'Airbnb UI clone', 'Tic-tac-toe game'].map((text, i) => (
                        <div
                          key={i}
                          className="rounded-lg bg-slate-800/50 px-3 py-2 text-sm text-slate-400"
                        >
                          {text}
                        </div>
                      ))}
                    </div>

                    {/* Submit Button */}
                    <div className="mt-6 flex justify-end">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                        <ArrowRight size={20} weight="bold" className="text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Glow effect behind phone */}
              <div className="absolute -inset-4 -z-10 rounded-full bg-teal-500/10 blur-2xl" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default LandingHero
