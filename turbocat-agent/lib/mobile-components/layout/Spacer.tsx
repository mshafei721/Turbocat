/**
 * Spacer Component - Flexible Space Filler
 * Phase 4: Mobile Development - Task 5.2
 */

import { cn } from '../utils'

export type SpacerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'

export interface SpacerProps {
  className?: string
  size?: SpacerSize
  flex?: boolean
  width?: number | string
  height?: number | string
  direction?: 'horizontal' | 'vertical' | 'both'
  testID?: string
}

const horizontalSizeClasses: Record<SpacerSize, string> = {
  xs: 'w-1',
  sm: 'w-2',
  md: 'w-4',
  lg: 'w-6',
  xl: 'w-8',
  '2xl': 'w-12',
  '3xl': 'w-16',
}

const verticalSizeClasses: Record<SpacerSize, string> = {
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-4',
  lg: 'h-6',
  xl: 'h-8',
  '2xl': 'h-12',
  '3xl': 'h-16',
}

export const SpacerTemplate = 'See lib/mobile-components/layout/Spacer.tsx'

export function Spacer({
  className,
  size = 'md',
  flex = false,
  width,
  height,
  direction = 'vertical',
  testID,
}: SpacerProps) {
  if (flex) {
    return <div className={cn('flex-1', className)} data-testid={testID} aria-hidden="true" />
  }

  let sizeClass = ''
  if (direction === 'horizontal') {
    sizeClass = horizontalSizeClasses[size]
  } else if (direction === 'vertical') {
    sizeClass = verticalSizeClasses[size]
  } else {
    sizeClass = cn(horizontalSizeClasses[size], verticalSizeClasses[size])
  }

  const customStyle: React.CSSProperties = {}
  if (width !== undefined) customStyle.width = typeof width === 'number' ? `${width}px` : width
  if (height !== undefined) customStyle.height = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={cn(sizeClass, className)}
      style={Object.keys(customStyle).length > 0 ? customStyle : undefined}
      data-testid={testID}
      aria-hidden="true"
    />
  )
}

export function VSpacer({ size = 'md' }: { size?: SpacerSize }) {
  return <Spacer size={size} direction="vertical" />
}

export function HSpacer({ size = 'md' }: { size?: SpacerSize }) {
  return <Spacer size={size} direction="horizontal" />
}

export function FlexSpacer() {
  return <Spacer flex />
}

export const SpacerMetadata = {
  name: 'Spacer',
  description: 'Utility component for adding consistent spacing.',
  category: 'Layout',
  platform: 'mobile' as const,
  props: [],
  shortcuts: ['VSpacer', 'HSpacer', 'FlexSpacer'],
  dependencies: ['nativewind'],
  examples: [],
}

export default Spacer
