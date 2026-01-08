'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Gear,
  Key,
  CreditCard,
  Moon,
  Sun,
  SignOut,
  CaretDown,
} from '@phosphor-icons/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface UserMenuProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const [theme, setTheme] = React.useState<'dark' | 'light'>('dark')

  // Get initials from name or email
  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase()
    }
    return 'TC'
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-2 hover:bg-slate-800"
        >
          <Avatar className="h-8 w-8 border border-slate-700">
            <AvatarImage src={user?.image || undefined} alt={user?.name || 'User'} />
            <AvatarFallback className="bg-slate-800 text-sm font-medium text-slate-300">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <CaretDown size={14} className="text-slate-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="font-medium">{user?.name || 'User'}</span>
          <span className="text-xs font-normal text-slate-400">
            {user?.email || 'user@example.com'}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User size={16} className="mr-2" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Gear size={16} className="mr-2" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Key size={16} className="mr-2" />
            API Keys
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard size={16} className="mr-2" />
            Billing
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={16} className="mr-2" />
              Light Mode
            </>
          ) : (
            <>
              <Moon size={16} className="mr-2" />
              Dark Mode
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive">
          <SignOut size={16} className="mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserMenu
