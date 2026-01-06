/**
 * Spacer Component - Flexible Space Filler
 * Phase 4: Mobile Development - Task 5.2
 *
 * A utility component for adding consistent spacing between elements.
 * Supports fixed sizes and flexible space filling.
 *
 * @example
 * ```tsx
 * import { Spacer } from '@/components/mobile/layout/Spacer';
 *
 * export default function HeaderScreen() {
 *   return (
 *     <View className="flex-row items-center">
 *       <Logo />
 *       <Spacer flex /> {/* Pushes content to edges */}
 *       <ProfileAvatar />
 *     </View>
 *   );
 * }
 * ```
 */

import { cn } from '../utils'

/**
 * Spacer size presets
 */
export type SpacerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'

/**
 * Spacer component props
 */
export interface SpacerProps {
  /** Additional NativeWind classes */
  className?: string
  /** Size preset for fixed spacing */
  size?: SpacerSize
  /** Whether spacer should flex to fill available space */
  flex?: boolean
  /** Custom width (overrides size for horizontal spacing) */
  width?: number | string
  /** Custom height (overrides size for vertical spacing) */
  height?: number | string
  /** Direction of spacing (affects which dimension is used from size) */
  direction?: 'horizontal' | 'vertical' | 'both'
  /** Test ID for testing */
  testID?: string
}

/**
 * Size class mapping (in pixels/rem)
 */
const sizeValues: Record<SpacerSize, number> = {
  xs: 4, // 0.25rem
  sm: 8, // 0.5rem
  md: 16, // 1rem
  lg: 24, // 1.5rem
  xl: 32, // 2rem
  '2xl': 48, // 3rem
  '3xl': 64, // 4rem
}

/**
 * Horizontal size classes
 */
const horizontalSizeClasses: Record<SpacerSize, string> = {
  xs: 'w-1',
  sm: 'w-2',
  md: 'w-4',
  lg: 'w-6',
  xl: 'w-8',
  '2xl': 'w-12',
  '3xl': 'w-16',
}

/**
 * Vertical size classes
 */
const verticalSizeClasses: Record<SpacerSize, string> = {
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-4',
  lg: 'h-6',
  xl: 'h-8',
  '2xl': 'h-12',
  '3xl': 'h-16',
}

/**
 * Spacer Component Template
 *
 * Full React Native implementation with NativeWind styling:
 */
export const SpacerTemplate = `import { View } from 'react-native';
import { cn } from '@/lib/utils';

type SpacerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

interface SpacerProps {
  className?: string;
  size?: SpacerSize;
  flex?: boolean;
  width?: number | string;
  height?: number | string;
  direction?: 'horizontal' | 'vertical' | 'both';
  testID?: string;
}

const sizeValues: Record<SpacerSize, number> = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

const horizontalSizeClasses: Record<SpacerSize, string> = {
  xs: 'w-1',
  sm: 'w-2',
  md: 'w-4',
  lg: 'w-6',
  xl: 'w-8',
  '2xl': 'w-12',
  '3xl': 'w-16',
};

const verticalSizeClasses: Record<SpacerSize, string> = {
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-4',
  lg: 'h-6',
  xl: 'h-8',
  '2xl': 'h-12',
  '3xl': 'h-16',
};

export function Spacer({
  className,
  size = 'md',
  flex = false,
  width,
  height,
  direction = 'vertical',
  testID,
}: SpacerProps) {
  // If flex mode, return a flexible spacer
  if (flex) {
    return (
      <View
        className={cn('flex-1', className)}
        testID={testID}
        pointerEvents="none"
        accessible={false}
      />
    );
  }

  // Determine size classes based on direction
  let sizeClass = '';
  if (direction === 'horizontal') {
    sizeClass = horizontalSizeClasses[size];
  } else if (direction === 'vertical') {
    sizeClass = verticalSizeClasses[size];
  } else {
    sizeClass = cn(horizontalSizeClasses[size], verticalSizeClasses[size]);
  }

  // Build style for custom dimensions
  const customStyle: { width?: number | string; height?: number | string } = {};
  if (width !== undefined) customStyle.width = width;
  if (height !== undefined) customStyle.height = height;

  return (
    <View
      className={cn(sizeClass, className)}
      style={Object.keys(customStyle).length > 0 ? customStyle : undefined}
      testID={testID}
      pointerEvents="none"
      accessible={false}
    />
  );
}
`

/**
 * Spacer component for React Native Web preview
 */
export function Spacer({
  className,
  size = 'md',
  flex = false,
  width,
  height,
  direction = 'vertical',
  testID,
}: SpacerProps) {
  // If flex mode, return a flexible spacer
  if (flex) {
    return <div className={cn('flex-1', className)} data-testid={testID} aria-hidden="true" />
  }

  // Determine size classes based on direction
  let sizeClass = ''
  if (direction === 'horizontal') {
    sizeClass = horizontalSizeClasses[size]
  } else if (direction === 'vertical') {
    sizeClass = verticalSizeClasses[size]
  } else {
    sizeClass = cn(horizontalSizeClasses[size], verticalSizeClasses[size])
  }

  // Build style for custom dimensions
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

/**
 * Shorthand components for common use cases
 */
export function VSpacer({ size = 'md' }: { size?: SpacerSize }) {
  return <Spacer size={size} direction="vertical" />
}

export function HSpacer({ size = 'md' }: { size?: SpacerSize }) {
  return <Spacer size={size} direction="horizontal" />
}

export function FlexSpacer() {
  return <Spacer flex />
}

/**
 * Component metadata for Component Gallery
 */
export const SpacerMetadata = {
  name: 'Spacer',
  description: 'Utility component for adding consistent spacing or flexible space between elements.',
  category: 'Layout',
  platform: 'mobile' as const,
  props: [
    { name: 'className', type: 'string', required: false, description: 'Additional NativeWind classes' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'", required: false, default: "'md'", description: 'Spacing size preset' },
    { name: 'flex', type: 'boolean', required: false, default: 'false', description: 'Fill available space (flexbox)' },
    { name: 'width', type: 'number | string', required: false, description: 'Custom width override' },
    { name: 'height', type: 'number | string', required: false, description: 'Custom height override' },
    { name: 'direction', type: "'horizontal' | 'vertical' | 'both'", required: false, default: "'vertical'", description: 'Direction of spacing' },
    { name: 'testID', type: 'string', required: false, description: 'Test ID for testing frameworks' },
  ],
  shortcuts: ['VSpacer', 'HSpacer', 'FlexSpacer'],
  dependencies: ['nativewind'],
  examples: [
    {
      title: 'Vertical Spacing',
      code: `<View>
  <Text>First item</Text>
  <Spacer size="lg" />
  <Text>Second item with large gap</Text>
</View>`,
    },
    {
      title: 'Flexible Spacer (Push to Edges)',
      code: `<View className="flex-row items-center p-4">
  <Text>Logo</Text>
  <Spacer flex />
  <Button>Login</Button>
</View>`,
    },
    {
      title: 'Horizontal Spacing',
      code: `<View className="flex-row">
  <Icon name="star" />
  <Spacer size="sm" direction="horizontal" />
  <Text>4.5 rating</Text>
</View>`,
    },
    {
      title: 'Custom Dimensions',
      code: `<Spacer width={100} height={50} />`,
    },
  ],
}

export default Spacer
