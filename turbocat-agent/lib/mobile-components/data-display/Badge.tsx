/**
 * Badge Component - Status/Count Indicator
 * Phase 4: Mobile Development - Task 5.5
 *
 * A small label component for displaying status, counts, or category labels.
 * Supports various colors, sizes, and animation options.
 *
 * @example
 * ```tsx
 * import { Badge } from '@/components/mobile/data-display/Badge';
 *
 * export default function NotificationItem() {
 *   return (
 *     <View className="flex-row items-center">
 *       <Text>Messages</Text>
 *       <Badge variant="primary" count={5} />
 *       <Badge variant="success">New</Badge>
 *     </View>
 *   );
 * }
 * ```
 */

import { cn } from '../utils'

/**
 * Badge variant
 */
export type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline'

/**
 * Badge size
 */
export type BadgeSize = 'sm' | 'md' | 'lg'

/**
 * Badge component props
 */
export interface BadgeProps {
  /** Badge content (text) */
  children?: React.ReactNode
  /** Numeric count (displayed instead of children) */
  count?: number
  /** Maximum count to display */
  maxCount?: number
  /** Show dot indicator only */
  dot?: boolean
  /** Additional NativeWind classes */
  className?: string
  /** Visual variant (default: 'default') */
  variant?: BadgeVariant
  /** Badge size (default: 'md') */
  size?: BadgeSize
  /** Pulse animation */
  pulse?: boolean
  /** Test ID for testing */
  testID?: string
}

/**
 * Variant class mapping
 */
const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  success: 'bg-green-500 text-white',
  warning: 'bg-yellow-500 text-white',
  error: 'bg-destructive text-destructive-foreground',
  outline: 'bg-transparent border border-border text-foreground',
}

/**
 * Size class mapping
 */
const sizeClasses: Record<BadgeSize, { badge: string; text: string; dot: string }> = {
  sm: {
    badge: 'h-4 px-1.5 rounded',
    text: 'text-[10px]',
    dot: 'w-1.5 h-1.5',
  },
  md: {
    badge: 'h-5 px-2 rounded-md',
    text: 'text-xs',
    dot: 'w-2 h-2',
  },
  lg: {
    badge: 'h-6 px-2.5 rounded-md',
    text: 'text-sm',
    dot: 'w-2.5 h-2.5',
  },
}

/**
 * Badge Component Template
 *
 * Full React Native implementation with NativeWind styling:
 */
export const BadgeTemplate = `import { View, Text, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

// ... (types remain the same)

export function Badge({
  children,
  count,
  maxCount = 99,
  dot = false,
  className,
  variant = 'default',
  size = 'md',
  pulse = false,
  testID,
}: BadgeProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sizeStyle = sizeClasses[size];

  // Pulse animation
  useEffect(() => {
    if (pulse) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [pulse, pulseAnim]);

  // Display count with max limit
  const displayCount = count !== undefined
    ? count > maxCount
      ? maxCount + '+'
      : String(count)
    : null;

  // Dot only mode
  if (dot) {
    return (
      <Animated.View
        className={cn(
          'rounded-full',
          sizeStyle.dot,
          variantClasses[variant],
          className,
        )}
        style={pulse ? { transform: [{ scale: pulseAnim }] } : undefined}
        testID={testID}
        accessible
        accessibilityRole="text"
        accessibilityLabel="Notification indicator"
      />
    );
  }

  // No content - don't render
  if (!children && count === undefined) {
    return null;
  }

  return (
    <Animated.View
      className={cn(
        'flex-row items-center justify-center',
        sizeStyle.badge,
        variantClasses[variant],
        className,
      )}
      style={pulse ? { transform: [{ scale: pulseAnim }] } : undefined}
      testID={testID}
      accessible
      accessibilityRole="text"
    >
      <Text className={cn(sizeStyle.text, 'font-semibold', variantClasses[variant].split(' ').pop())}>
        {displayCount || children}
      </Text>
    </Animated.View>
  );
}
`

/**
 * Badge component for React Native Web preview
 */
export function Badge({
  children,
  count,
  maxCount = 99,
  dot = false,
  className,
  variant = 'default',
  size = 'md',
  pulse = false,
  testID,
}: BadgeProps) {
  const sizeStyle = sizeClasses[size]

  // Display count with max limit
  const displayCount = count !== undefined ? (count > maxCount ? `${maxCount}+` : String(count)) : null

  // Dot only mode
  if (dot) {
    return (
      <span
        className={cn('rounded-full inline-block', sizeStyle.dot, variantClasses[variant], pulse && 'animate-pulse', className)}
        data-testid={testID}
        role="status"
        aria-label="Notification indicator"
      />
    )
  }

  // No content - don't render
  if (!children && count === undefined) {
    return null
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-semibold',
        sizeStyle.badge,
        sizeStyle.text,
        variantClasses[variant],
        pulse && 'animate-pulse',
        className,
      )}
      data-testid={testID}
      role="status"
    >
      {displayCount || children}
    </span>
  )
}

/**
 * BadgeWrapper for positioning badges on other elements
 */
export function BadgeWrapper({
  children,
  badge,
  position = 'top-right',
  className,
}: {
  children: React.ReactNode
  badge: React.ReactNode
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  className?: string
}) {
  const positionClasses: Record<string, string> = {
    'top-right': 'top-0 right-0 translate-x-1/2 -translate-y-1/2',
    'top-left': 'top-0 left-0 -translate-x-1/2 -translate-y-1/2',
    'bottom-right': 'bottom-0 right-0 translate-x-1/2 translate-y-1/2',
    'bottom-left': 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2',
  }

  return (
    <div className={cn('relative inline-flex', className)}>
      {children}
      <span className={cn('absolute', positionClasses[position])}>{badge}</span>
    </div>
  )
}

/**
 * Component metadata for Component Gallery
 */
export const BadgeMetadata = {
  name: 'Badge',
  description: 'Status/count indicator badge with various colors, sizes, and animation options.',
  category: 'Data Display',
  platform: 'mobile' as const,
  props: [
    { name: 'children', type: 'React.ReactNode', required: false, description: 'Badge content' },
    { name: 'count', type: 'number', required: false, description: 'Numeric count' },
    { name: 'maxCount', type: 'number', required: false, default: '99', description: 'Maximum count to display' },
    { name: 'dot', type: 'boolean', required: false, default: 'false', description: 'Show dot indicator only' },
    { name: 'className', type: 'string', required: false, description: 'Additional NativeWind classes' },
    { name: 'variant', type: "'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline'", required: false, default: "'default'", description: 'Color variant' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, default: "'md'", description: 'Badge size' },
    { name: 'pulse', type: 'boolean', required: false, default: 'false', description: 'Pulse animation' },
    { name: 'testID', type: 'string', required: false, description: 'Test ID for testing frameworks' },
  ],
  subcomponents: ['BadgeWrapper'],
  dependencies: ['nativewind'],
  examples: [
    {
      title: 'Basic Badge',
      code: `<Badge>New</Badge>`,
    },
    {
      title: 'Count Badge',
      code: `<Badge count={5} variant="primary" />`,
    },
    {
      title: 'All Variants',
      code: `<View className="flex-row gap-2">
  <Badge variant="default">Default</Badge>
  <Badge variant="primary">Primary</Badge>
  <Badge variant="secondary">Secondary</Badge>
  <Badge variant="success">Success</Badge>
  <Badge variant="warning">Warning</Badge>
  <Badge variant="error">Error</Badge>
  <Badge variant="outline">Outline</Badge>
</View>`,
    },
    {
      title: 'Max Count',
      code: `<Badge count={150} maxCount={99} variant="error" />`,
    },
    {
      title: 'Dot Indicator',
      code: `<BadgeWrapper badge={<Badge dot variant="success" />}>
  <Icon name="bell" />
</BadgeWrapper>`,
    },
    {
      title: 'Pulsing Badge',
      code: `<Badge variant="error" pulse>Live</Badge>`,
    },
  ],
}

export default Badge
