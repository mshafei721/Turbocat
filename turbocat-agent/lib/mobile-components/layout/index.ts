/**
 * Layout Components - Mobile Component Library
 * Phase 4: Mobile Development - Task 5.2
 *
 * Re-exports all layout components for convenient importing.
 */

export { Screen, ScreenTemplate, ScreenMetadata } from './Screen'
export type { ScreenProps } from './Screen'

export { Container, ContainerTemplate, ContainerMetadata } from './Container'
export type { ContainerProps, ContainerPadding } from './Container'

export { Card, CardHeader, CardContent, CardFooter, CardTemplate, CardMetadata } from './Card'
export type { CardProps, CardVariant } from './Card'

export { Divider, DividerTemplate, DividerMetadata } from './Divider'
export type { DividerProps, DividerOrientation, DividerThickness, DividerColor } from './Divider'

export { Spacer, VSpacer, HSpacer, FlexSpacer, SpacerTemplate, SpacerMetadata } from './Spacer'
export type { SpacerProps, SpacerSize } from './Spacer'

/**
 * All layout component metadata for Component Gallery
 */
export const layoutComponentMetadata = [
  { component: 'Screen', metadata: () => import('./Screen').then((m) => m.ScreenMetadata) },
  { component: 'Container', metadata: () => import('./Container').then((m) => m.ContainerMetadata) },
  { component: 'Card', metadata: () => import('./Card').then((m) => m.CardMetadata) },
  { component: 'Divider', metadata: () => import('./Divider').then((m) => m.DividerMetadata) },
  { component: 'Spacer', metadata: () => import('./Spacer').then((m) => m.SpacerMetadata) },
]
