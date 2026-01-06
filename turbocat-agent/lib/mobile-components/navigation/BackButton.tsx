/**
 * BackButton Component - Navigation Back Control
 * Phase 4: Mobile Development - Task 5.3
 *
 * A standalone back button component for navigation with platform-specific styling.
 * Can be used independently or as part of custom headers.
 *
 * @example
 * ```tsx
 * import { BackButton } from '@/components/mobile/navigation/BackButton';
 *
 * export default function DetailScreen() {
 *   return (
 *     <Screen>
 *       <View className="flex-row items-center p-4">
 *         <BackButton onPress={() => navigation.goBack()} />
 *         <Text className="ml-2 text-lg">Details</Text>
 *       </View>
 *       <View>...</View>
 *     </Screen>
 *   );
 * }
 * ```
 */

import { cn } from '../utils'

/**
 * BackButton variant styles
 */
export type BackButtonVariant = 'default' | 'ghost' | 'outline' | 'filled'

/**
 * BackButton size
 */
export type BackButtonSize = 'sm' | 'md' | 'lg'

/**
 * BackButton component props
 */
export interface BackButtonProps {
  /** Press handler */
  onPress: () => void
  /** Additional NativeWind classes */
  className?: string
  /** Visual variant (default: 'ghost') */
  variant?: BackButtonVariant
  /** Button size (default: 'md') */
  size?: BackButtonSize
  /** Custom icon element */
  icon?: React.ReactNode
  /** Show label text */
  label?: string
  /** Icon color class */
  color?: string
  /** Whether button is disabled */
  disabled?: boolean
  /** Test ID for testing */
  testID?: string
  /** Accessibility label override */
  accessibilityLabel?: string
}

/**
 * Variant class mapping
 */
const variantClasses: Record<BackButtonVariant, string> = {
  default: 'bg-background',
  ghost: 'bg-transparent',
  outline: 'bg-transparent border border-border',
  filled: 'bg-muted',
}

/**
 * Size class mapping
 */
const sizeClasses: Record<BackButtonSize, { button: string; icon: string; label: string }> = {
  sm: {
    button: 'h-8 px-2',
    icon: 'text-lg',
    label: 'text-sm',
  },
  md: {
    button: 'h-10 px-3',
    icon: 'text-xl',
    label: 'text-base',
  },
  lg: {
    button: 'h-12 px-4',
    icon: 'text-2xl',
    label: 'text-lg',
  },
}

/**
 * BackButton Component Template
 *
 * Full React Native implementation with NativeWind styling:
 */
export const BackButtonTemplate = `import { Pressable, Text, View, Platform } from 'react-native';
import { cn } from '@/lib/utils';

type BackButtonVariant = 'default' | 'ghost' | 'outline' | 'filled';
type BackButtonSize = 'sm' | 'md' | 'lg';

interface BackButtonProps {
  onPress: () => void;
  className?: string;
  variant?: BackButtonVariant;
  size?: BackButtonSize;
  icon?: React.ReactNode;
  label?: string;
  color?: string;
  disabled?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

const variantClasses: Record<BackButtonVariant, string> = {
  default: 'bg-background',
  ghost: 'bg-transparent',
  outline: 'bg-transparent border border-border',
  filled: 'bg-muted',
};

const sizeClasses: Record<BackButtonSize, { button: string; icon: string; label: string }> = {
  sm: { button: 'h-8 px-2', icon: 'text-lg', label: 'text-sm' },
  md: { button: 'h-10 px-3', icon: 'text-xl', label: 'text-base' },
  lg: { button: 'h-12 px-4', icon: 'text-2xl', label: 'text-lg' },
};

// Platform-specific back icons
const getDefaultIcon = () => {
  // iOS uses chevron, Android uses arrow
  return Platform.OS === 'ios' ? '‹' : '←';
};

export function BackButton({
  onPress,
  className,
  variant = 'ghost',
  size = 'md',
  icon,
  label,
  color = 'text-primary',
  disabled = false,
  testID,
  accessibilityLabel = 'Go back',
}: BackButtonProps) {
  const sizeStyle = sizeClasses[size];

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      className={cn(
        'flex-row items-center justify-center rounded-lg',
        variantClasses[variant],
        sizeStyle.button,
        disabled && 'opacity-50',
        'active:opacity-70',
        className,
      )}
      disabled={disabled}
      testID={testID}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
    >
      {/* Icon */}
      <View className="items-center justify-center">
        {icon || (
          <Text className={cn(sizeStyle.icon, color, 'font-medium')}>
            {getDefaultIcon()}
          </Text>
        )}
      </View>

      {/* Label */}
      {label && (
        <Text className={cn(sizeStyle.label, color, 'ml-1')}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
`

/**
 * BackButton component for React Native Web preview
 */
export function BackButton({
  onPress,
  className,
  variant = 'ghost',
  size = 'md',
  icon,
  label,
  color = 'text-primary',
  disabled = false,
  testID,
  accessibilityLabel = 'Go back',
}: BackButtonProps) {
  const sizeStyle = sizeClasses[size]

  // Default icon (chevron for web preview, iOS style)
  const defaultIcon = <span className={cn(sizeStyle.icon, color, 'font-medium')}>&#8249;</span>

  return (
    <button
      onClick={disabled ? undefined : onPress}
      className={cn(
        'flex flex-row items-center justify-center rounded-lg transition-opacity',
        variantClasses[variant],
        sizeStyle.button,
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'hover:opacity-80 active:opacity-70',
        className,
      )}
      disabled={disabled}
      data-testid={testID}
      aria-label={accessibilityLabel}
    >
      {/* Icon */}
      <span className="flex items-center justify-center">{icon || defaultIcon}</span>

      {/* Label */}
      {label && <span className={cn(sizeStyle.label, color, 'ml-1')}>{label}</span>}
    </button>
  )
}

/**
 * iOS-style BackButton with "Back" label
 */
export function IOSBackButton({
  onPress,
  label = 'Back',
  ...props
}: Omit<BackButtonProps, 'label'> & { label?: string }) {
  return <BackButton onPress={onPress} label={label} variant="ghost" {...props} />
}

/**
 * Android-style BackButton (arrow only)
 */
export function AndroidBackButton({
  onPress,
  ...props
}: Omit<BackButtonProps, 'label' | 'icon'>) {
  return (
    <BackButton
      onPress={onPress}
      icon={<span className="text-xl text-foreground">&#8592;</span>}
      variant="ghost"
      {...props}
    />
  )
}

/**
 * Component metadata for Component Gallery
 */
export const BackButtonMetadata = {
  name: 'BackButton',
  description: 'Navigation back button with platform-specific styling and customization options.',
  category: 'Navigation',
  platform: 'mobile' as const,
  props: [
    { name: 'onPress', type: '() => void', required: true, description: 'Press handler' },
    { name: 'className', type: 'string', required: false, description: 'Additional NativeWind classes' },
    { name: 'variant', type: "'default' | 'ghost' | 'outline' | 'filled'", required: false, default: "'ghost'", description: 'Visual style variant' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, default: "'md'", description: 'Button size' },
    { name: 'icon', type: 'React.ReactNode', required: false, description: 'Custom icon element' },
    { name: 'label', type: 'string', required: false, description: 'Label text (iOS style)' },
    { name: 'color', type: 'string', required: false, default: "'text-primary'", description: 'Icon/label color class' },
    { name: 'disabled', type: 'boolean', required: false, default: 'false', description: 'Disable button' },
    { name: 'accessibilityLabel', type: 'string', required: false, default: "'Go back'", description: 'Screen reader label' },
    { name: 'testID', type: 'string', required: false, description: 'Test ID for testing frameworks' },
  ],
  variants: ['IOSBackButton', 'AndroidBackButton'],
  dependencies: ['nativewind'],
  examples: [
    {
      title: 'Basic BackButton',
      code: `<BackButton onPress={() => navigation.goBack()} />`,
    },
    {
      title: 'iOS-style with Label',
      code: `<BackButton
  onPress={() => navigation.goBack()}
  label="Back"
  color="text-blue-500"
/>`,
    },
    {
      title: 'Filled Variant',
      code: `<BackButton
  onPress={handleBack}
  variant="filled"
  size="lg"
/>`,
    },
    {
      title: 'Custom Icon',
      code: `<BackButton
  onPress={handleBack}
  icon={<ChevronLeftIcon className="w-6 h-6" />}
/>`,
    },
    {
      title: 'Platform-specific Buttons',
      code: `// iOS style (chevron + "Back" label)
<IOSBackButton onPress={goBack} />

// Android style (arrow only)
<AndroidBackButton onPress={goBack} />`,
    },
  ],
}

export default BackButton
