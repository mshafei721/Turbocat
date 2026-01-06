/**
 * Navigation Components - Mobile Component Library
 * Phase 4: Mobile Development - Task 5.3
 *
 * Re-exports all navigation components for convenient importing.
 */

export { Header, HeaderTemplate, HeaderMetadata } from './Header'
export type { HeaderProps, HeaderVariant, HeaderSize } from './Header'

export { TabBar, TabBarItem, TabBarTemplate, TabBarMetadata } from './TabBar'
export type { TabBarProps, TabBarItemProps, TabBarVariant } from './TabBar'

export { Drawer, DrawerItem, DrawerHeader, DrawerTemplate, DrawerMetadata } from './Drawer'
export type { DrawerProps, DrawerItemProps, DrawerPosition } from './Drawer'

export { BackButton, IOSBackButton, AndroidBackButton, BackButtonTemplate, BackButtonMetadata } from './BackButton'
export type { BackButtonProps, BackButtonVariant, BackButtonSize } from './BackButton'

/**
 * All navigation component metadata for Component Gallery
 */
export const navigationComponentMetadata = [
  { component: 'Header', metadata: () => import('./Header').then((m) => m.HeaderMetadata) },
  { component: 'TabBar', metadata: () => import('./TabBar').then((m) => m.TabBarMetadata) },
  { component: 'Drawer', metadata: () => import('./Drawer').then((m) => m.DrawerMetadata) },
  { component: 'BackButton', metadata: () => import('./BackButton').then((m) => m.BackButtonMetadata) },
]
