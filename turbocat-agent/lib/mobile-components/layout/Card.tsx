/**
 * Card Component - Content Container with Visual Styling
 * Phase 4: Mobile Development - Task 5.2
 *
 * A styled container for grouping related content with optional header, footer,
 * shadows, and various visual variants.
 *
 * @example
 * ```tsx
 * import { Card, CardHeader, CardContent, CardFooter } from '@/components/mobile/layout/Card';
 *
 * export default function ProductCard() {
 *   return (
 *     <Card variant="elevated">
 *       <CardHeader>
 *         <Text className="font-bold">Product Name</Text>
 *       </CardHeader>
 *       <CardContent>
 *         <Text>Product description goes here...</Text>
 *       </CardContent>
 *       <CardFooter>
 *         <Button>Add to Cart</Button>
 *       </CardFooter>
 *     </Card>
 *   );
 * }
 * ```
 */

import { cn } from '../utils'

/**
 * Card visual variants
 */
export type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled'

/**
 * Card component props
 */
export interface CardProps {
  /** Child elements to render */
  children: React.ReactNode
  /** Additional NativeWind classes */
  className?: string
  /** Visual variant (default: 'default') */
  variant?: CardVariant
  /** Whether the card is pressable/clickable */
  pressable?: boolean
  /** Callback when card is pressed */
  onPress?: () => void
  /** Whether card is disabled */
  disabled?: boolean
  /** Test ID for testing */
  testID?: string
  /** Accessibility label */
  accessibilityLabel?: string
}

/**
 * Variant class mapping
 */
const variantClasses: Record<CardVariant, string> = {
  default: 'bg-card border border-border rounded-lg',
  elevated: 'bg-card rounded-lg shadow-md',
  outlined: 'bg-transparent border-2 border-border rounded-lg',
  filled: 'bg-muted rounded-lg',
}

/**
 * Card Component Template
 *
 * Full React Native implementation with NativeWind styling:
 */
export const CardTemplate = `import { View, Pressable, ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'filled';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  variant?: CardVariant;
  pressable?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-card border border-border rounded-lg',
  elevated: 'bg-card rounded-lg shadow-md',
  outlined: 'bg-transparent border-2 border-border rounded-lg',
  filled: 'bg-muted rounded-lg',
};

export function Card({
  children,
  className,
  variant = 'default',
  pressable = false,
  onPress,
  disabled = false,
  testID,
  accessibilityLabel,
  ...props
}: CardProps) {
  const Wrapper = pressable ? Pressable : View;

  return (
    <Wrapper
      className={cn(
        variantClasses[variant],
        disabled && 'opacity-50',
        pressable && 'active:opacity-80',
        className,
      )}
      onPress={pressable ? onPress : undefined}
      disabled={disabled}
      testID={testID}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={pressable ? 'button' : 'none'}
      {...props}
    >
      {children}
    </Wrapper>
  );
}

// CardHeader subcomponent
export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={cn('p-4 pb-2', className)}>
      {children}
    </View>
  );
}

// CardContent subcomponent
export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={cn('p-4 pt-0', className)}>
      {children}
    </View>
  );
}

// CardFooter subcomponent
export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <View className={cn('p-4 pt-2 border-t border-border', className)}>
      {children}
    </View>
  );
}
`

/**
 * Card component for React Native Web preview
 */
export function Card({
  children,
  className,
  variant = 'default',
  pressable = false,
  onPress,
  disabled = false,
  testID,
  accessibilityLabel,
}: CardProps) {
  const Component = pressable ? 'button' : 'div'

  return (
    <Component
      className={cn(
        variantClasses[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        pressable && 'cursor-pointer hover:opacity-90 active:opacity-80 transition-opacity',
        className,
      )}
      onClick={pressable && !disabled ? onPress : undefined}
      disabled={disabled}
      data-testid={testID}
      aria-label={accessibilityLabel}
      role={pressable ? 'button' : undefined}
    >
      {children}
    </Component>
  )
}

/**
 * CardHeader subcomponent for React Native Web preview
 */
export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-4 pb-2', className)}>{children}</div>
}

/**
 * CardContent subcomponent for React Native Web preview
 */
export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-4 pt-0', className)}>{children}</div>
}

/**
 * CardFooter subcomponent for React Native Web preview
 */
export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('p-4 pt-2 border-t border-border', className)}>{children}</div>
}

/**
 * Component metadata for Component Gallery
 */
export const CardMetadata = {
  name: 'Card',
  description: 'Styled container for grouping related content with header, content, and footer sections.',
  category: 'Layout',
  platform: 'mobile' as const,
  props: [
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Child elements to render' },
    { name: 'className', type: 'string', required: false, description: 'Additional NativeWind classes' },
    { name: 'variant', type: "'default' | 'elevated' | 'outlined' | 'filled'", required: false, default: "'default'", description: 'Visual style variant' },
    { name: 'pressable', type: 'boolean', required: false, default: 'false', description: 'Make card clickable/pressable' },
    { name: 'onPress', type: '() => void', required: false, description: 'Callback when card is pressed' },
    { name: 'disabled', type: 'boolean', required: false, default: 'false', description: 'Disable card interactions' },
    { name: 'accessibilityLabel', type: 'string', required: false, description: 'Accessibility label for screen readers' },
    { name: 'testID', type: 'string', required: false, description: 'Test ID for testing frameworks' },
  ],
  subcomponents: ['CardHeader', 'CardContent', 'CardFooter'],
  dependencies: ['nativewind'],
  examples: [
    {
      title: 'Basic Card',
      code: `<Card>
  <CardHeader>
    <Text className="font-bold text-lg">Card Title</Text>
  </CardHeader>
  <CardContent>
    <Text>Card content goes here...</Text>
  </CardContent>
</Card>`,
    },
    {
      title: 'Elevated Card',
      code: `<Card variant="elevated">
  <CardContent>
    <Text>Elevated card with shadow</Text>
  </CardContent>
</Card>`,
    },
    {
      title: 'Pressable Card',
      code: `<Card pressable onPress={() => navigation.navigate('Details')}>
  <CardContent>
    <Text>Tap me to navigate</Text>
  </CardContent>
</Card>`,
    },
    {
      title: 'Card with Footer',
      code: `<Card variant="outlined">
  <CardHeader>
    <Text className="font-semibold">Order #12345</Text>
  </CardHeader>
  <CardContent>
    <Text>3 items - $49.99</Text>
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>`,
    },
  ],
}

export default Card
