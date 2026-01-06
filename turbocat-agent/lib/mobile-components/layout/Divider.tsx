/**
 * Divider Component - Visual Separator
 * Phase 4: Mobile Development - Task 5.2
 *
 * A visual separator for dividing content sections. Supports horizontal and vertical
 * orientations with various thickness and color options.
 *
 * @example
 * ```tsx
 * import { Divider } from '@/components/mobile/layout/Divider';
 *
 * export default function SettingsScreen() {
 *   return (
 *     <View>
 *       <Text>Section 1</Text>
 *       <Divider />
 *       <Text>Section 2</Text>
 *       <Divider thickness="thick" color="primary" />
 *       <Text>Section 3</Text>
 *     </View>
 *   );
 * }
 * ```
 */

import { cn } from '../utils'

/**
 * Divider orientation
 */
export type DividerOrientation = 'horizontal' | 'vertical'

/**
 * Divider thickness
 */
export type DividerThickness = 'thin' | 'medium' | 'thick'

/**
 * Divider color variants
 */
export type DividerColor = 'default' | 'muted' | 'primary' | 'secondary'

/**
 * Divider component props
 */
export interface DividerProps {
  /** Additional NativeWind classes */
  className?: string
  /** Orientation (default: 'horizontal') */
  orientation?: DividerOrientation
  /** Thickness (default: 'thin') */
  thickness?: DividerThickness
  /** Color variant (default: 'default') */
  color?: DividerColor
  /** Optional text to display in the middle */
  label?: string
  /** Spacing around the divider */
  spacing?: 'none' | 'sm' | 'md' | 'lg'
  /** Test ID for testing */
  testID?: string
}

/**
 * Thickness class mapping for horizontal dividers
 */
const horizontalThicknessClasses: Record<DividerThickness, string> = {
  thin: 'h-px',
  medium: 'h-0.5',
  thick: 'h-1',
}

/**
 * Thickness class mapping for vertical dividers
 */
const verticalThicknessClasses: Record<DividerThickness, string> = {
  thin: 'w-px',
  medium: 'w-0.5',
  thick: 'w-1',
}

/**
 * Color class mapping
 */
const colorClasses: Record<DividerColor, string> = {
  default: 'bg-border',
  muted: 'bg-muted',
  primary: 'bg-primary',
  secondary: 'bg-secondary',
}

/**
 * Spacing class mapping
 */
const spacingClasses: Record<'none' | 'sm' | 'md' | 'lg', { horizontal: string; vertical: string }> = {
  none: { horizontal: '', vertical: '' },
  sm: { horizontal: 'my-2', vertical: 'mx-2' },
  md: { horizontal: 'my-4', vertical: 'mx-4' },
  lg: { horizontal: 'my-6', vertical: 'mx-6' },
}

/**
 * Divider Component Template
 *
 * Full React Native implementation with NativeWind styling:
 */
export const DividerTemplate = `import { View, Text } from 'react-native';
import { cn } from '@/lib/utils';

type DividerOrientation = 'horizontal' | 'vertical';
type DividerThickness = 'thin' | 'medium' | 'thick';
type DividerColor = 'default' | 'muted' | 'primary' | 'secondary';

interface DividerProps {
  className?: string;
  orientation?: DividerOrientation;
  thickness?: DividerThickness;
  color?: DividerColor;
  label?: string;
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  testID?: string;
}

const horizontalThicknessClasses: Record<DividerThickness, string> = {
  thin: 'h-px',
  medium: 'h-0.5',
  thick: 'h-1',
};

const verticalThicknessClasses: Record<DividerThickness, string> = {
  thin: 'w-px',
  medium: 'w-0.5',
  thick: 'w-1',
};

const colorClasses: Record<DividerColor, string> = {
  default: 'bg-border',
  muted: 'bg-muted',
  primary: 'bg-primary',
  secondary: 'bg-secondary',
};

const spacingClasses = {
  none: { horizontal: '', vertical: '' },
  sm: { horizontal: 'my-2', vertical: 'mx-2' },
  md: { horizontal: 'my-4', vertical: 'mx-4' },
  lg: { horizontal: 'my-6', vertical: 'mx-6' },
};

export function Divider({
  className,
  orientation = 'horizontal',
  thickness = 'thin',
  color = 'default',
  label,
  spacing = 'md',
  testID,
}: DividerProps) {
  const isHorizontal = orientation === 'horizontal';
  const thicknessClass = isHorizontal
    ? horizontalThicknessClasses[thickness]
    : verticalThicknessClasses[thickness];
  const spacingClass = isHorizontal
    ? spacingClasses[spacing].horizontal
    : spacingClasses[spacing].vertical;

  // Divider with label
  if (label && isHorizontal) {
    return (
      <View
        className={cn('flex-row items-center', spacingClass, className)}
        testID={testID}
        accessible
        accessibilityRole="separator"
      >
        <View className={cn('flex-1', thicknessClass, colorClasses[color])} />
        <Text className="px-3 text-muted-foreground text-sm">{label}</Text>
        <View className={cn('flex-1', thicknessClass, colorClasses[color])} />
      </View>
    );
  }

  // Simple divider
  return (
    <View
      className={cn(
        isHorizontal ? 'w-full' : 'h-full self-stretch',
        thicknessClass,
        colorClasses[color],
        spacingClass,
        className,
      )}
      testID={testID}
      accessible
      accessibilityRole="separator"
    />
  );
}
`

/**
 * Divider component for React Native Web preview
 */
export function Divider({
  className,
  orientation = 'horizontal',
  thickness = 'thin',
  color = 'default',
  label,
  spacing = 'md',
  testID,
}: DividerProps) {
  const isHorizontal = orientation === 'horizontal'
  const thicknessClass = isHorizontal ? horizontalThicknessClasses[thickness] : verticalThicknessClasses[thickness]
  const spacingClass = isHorizontal ? spacingClasses[spacing].horizontal : spacingClasses[spacing].vertical

  // Divider with label
  if (label && isHorizontal) {
    return (
      <div
        className={cn('flex flex-row items-center', spacingClass, className)}
        data-testid={testID}
        role="separator"
        aria-orientation={orientation}
      >
        <div className={cn('flex-1', thicknessClass, colorClasses[color])} />
        <span className="px-3 text-muted-foreground text-sm">{label}</span>
        <div className={cn('flex-1', thicknessClass, colorClasses[color])} />
      </div>
    )
  }

  // Simple divider
  return (
    <div
      className={cn(
        isHorizontal ? 'w-full' : 'h-full self-stretch',
        thicknessClass,
        colorClasses[color],
        spacingClass,
        className,
      )}
      data-testid={testID}
      role="separator"
      aria-orientation={orientation}
    />
  )
}

/**
 * Component metadata for Component Gallery
 */
export const DividerMetadata = {
  name: 'Divider',
  description: 'Visual separator for dividing content sections. Supports labels and multiple orientations.',
  category: 'Layout',
  platform: 'mobile' as const,
  props: [
    { name: 'className', type: 'string', required: false, description: 'Additional NativeWind classes' },
    { name: 'orientation', type: "'horizontal' | 'vertical'", required: false, default: "'horizontal'", description: 'Divider orientation' },
    { name: 'thickness', type: "'thin' | 'medium' | 'thick'", required: false, default: "'thin'", description: 'Line thickness' },
    { name: 'color', type: "'default' | 'muted' | 'primary' | 'secondary'", required: false, default: "'default'", description: 'Color variant' },
    { name: 'label', type: 'string', required: false, description: 'Optional text label in the middle' },
    { name: 'spacing', type: "'none' | 'sm' | 'md' | 'lg'", required: false, default: "'md'", description: 'Spacing around divider' },
    { name: 'testID', type: 'string', required: false, description: 'Test ID for testing frameworks' },
  ],
  dependencies: ['nativewind'],
  examples: [
    {
      title: 'Basic Divider',
      code: `<View>
  <Text>Above divider</Text>
  <Divider />
  <Text>Below divider</Text>
</View>`,
    },
    {
      title: 'Divider with Label',
      code: `<View>
  <Text>Social login options above</Text>
  <Divider label="OR" />
  <Text>Email login below</Text>
</View>`,
    },
    {
      title: 'Thick Primary Divider',
      code: `<Divider thickness="thick" color="primary" spacing="lg" />`,
    },
    {
      title: 'Vertical Divider',
      code: `<View className="flex-row items-center h-12">
  <Text>Left</Text>
  <Divider orientation="vertical" spacing="sm" />
  <Text>Right</Text>
</View>`,
    },
  ],
}

export default Divider
