/**
 * Data Display Components - Mobile Component Library
 * Phase 4: Mobile Development - Task 5.5
 *
 * Re-exports all data display components for convenient importing.
 */

export { default as List, ListItem, ListSectionHeader, ListTemplate, ListMetadata } from './List'
export type { ListProps, ListItemProps } from './List'

export { default as Avatar, AvatarGroup, AvatarTemplate, AvatarMetadata } from './Avatar'
export type { AvatarProps, AvatarGroupProps, AvatarSize, AvatarShape } from './Avatar'

export { default as Badge, BadgeWrapper, BadgeTemplate, BadgeMetadata } from './Badge'
export type { BadgeProps, BadgeVariant, BadgeSize } from './Badge'

export { default as Chip, ChipGroup, ChipTemplate, ChipMetadata } from './Chip'
export type { ChipProps, ChipGroupProps, ChipVariant, ChipSize } from './Chip'

/**
 * All data display component metadata for Component Gallery
 */
export const dataDisplayComponentMetadata = [
  { component: 'List', metadata: () => import('./List').then((m) => m.ListMetadata) },
  { component: 'Avatar', metadata: () => import('./Avatar').then((m) => m.AvatarMetadata) },
  { component: 'Badge', metadata: () => import('./Badge').then((m) => m.BadgeMetadata) },
  { component: 'Chip', metadata: () => import('./Chip').then((m) => m.ChipMetadata) },
]
