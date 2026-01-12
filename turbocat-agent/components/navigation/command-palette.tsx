'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  House,
  Wrench,
  Files,
  Gear,
  Sun,
  Moon,
  Clock,
  MagnifyingGlass,
} from '@phosphor-icons/react'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'

/**
 * CommandPalette - AI Native Keyboard-driven Navigation
 *
 * Features:
 * - Cmd+K / Ctrl+K shortcut
 * - Recent commands tracking
 * - Theme switching
 * - Navigation to key pages
 * - Dark mode support
 * - WCAG AA compliant
 *
 * Usage:
 * <CommandPalette />
 */

interface RecentCommand {
  id: string
  label: string
  path: string
  timestamp: number
}

export function CommandPalette() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = React.useState(false)
  const [recentCommands, setRecentCommands] = React.useState<RecentCommand[]>([])

  // Load recent commands from localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem('turbocat-recent-commands')
    if (stored) {
      try {
        setRecentCommands(JSON.parse(stored))
      } catch {
        // Ignore parse errors
      }
    }
  }, [])

  // Keyboard shortcut: Cmd+K / Ctrl+K
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const addRecentCommand = (command: Omit<RecentCommand, 'timestamp'>) => {
    const newCommand: RecentCommand = {
      ...command,
      timestamp: Date.now(),
    }

    setRecentCommands((prev) => {
      // Remove duplicates and limit to 5
      const filtered = prev.filter((c) => c.id !== command.id)
      const updated = [newCommand, ...filtered].slice(0, 5)
      localStorage.setItem('turbocat-recent-commands', JSON.stringify(updated))
      return updated
    })
  }

  const handleNavigation = (path: string, label: string, id: string) => {
    addRecentCommand({ id, label, path })
    router.push(path)
    setOpen(false)
  }

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    addRecentCommand({
      id: `theme-${newTheme}`,
      label: `Switch to ${newTheme} mode`,
      path: '',
    })
    setOpen(false)
  }

  return (
    <>
      {/* Trigger button for accessibility */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Open command palette"
      >
        <MagnifyingGlass className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Recent commands */}
          {recentCommands.length > 0 && (
            <>
              <CommandGroup heading="Recent">
                {recentCommands.map((cmd) => (
                  <CommandItem
                    key={cmd.id}
                    onSelect={() => {
                      if (cmd.path) {
                        handleNavigation(cmd.path, cmd.label, cmd.id)
                      }
                    }}
                  >
                    <Clock className="h-4 w-4" />
                    <span>{cmd.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Navigation */}
          <CommandGroup heading="Navigation">
            <CommandItem
              onSelect={() => handleNavigation('/', 'Home', 'nav-home')}
            >
              <House className="h-4 w-4" />
              <span>Home</span>
              <CommandShortcut>⌘H</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => handleNavigation('/tasks', 'Tasks', 'nav-tasks')}
            >
              <Wrench className="h-4 w-4" />
              <span>Tasks</span>
              <CommandShortcut>⌘T</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => handleNavigation('/projects', 'Projects', 'nav-projects')}
            >
              <Files className="h-4 w-4" />
              <span>Projects</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem
              onSelect={() => handleNavigation('/settings', 'Settings', 'nav-settings')}
            >
              <Gear className="h-4 w-4" />
              <span>Settings</span>
              <CommandShortcut>⌘,</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Theme */}
          <CommandGroup heading="Theme">
            <CommandItem onSelect={() => handleThemeChange('light')}>
              <Sun className="h-4 w-4" />
              <span>Light</span>
              {theme === 'light' && <span className="ml-auto text-xs">✓</span>}
            </CommandItem>
            <CommandItem onSelect={() => handleThemeChange('dark')}>
              <Moon className="h-4 w-4" />
              <span>Dark</span>
              {theme === 'dark' && <span className="ml-auto text-xs">✓</span>}
            </CommandItem>
            <CommandItem onSelect={() => handleThemeChange('system')}>
              <Gear className="h-4 w-4" />
              <span>System</span>
              {theme === 'system' && <span className="ml-auto text-xs">✓</span>}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
