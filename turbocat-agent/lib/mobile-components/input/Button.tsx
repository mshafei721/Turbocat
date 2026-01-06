/**
 * Button Component - Interactive Action Element
 * Phase 4: Mobile Development - Task 5.4
 *
 * A versatile button component with multiple variants, sizes, and states.
 * Supports icons, loading states, and full-width modes.
 *
 * @example
 * ```tsx
 * import { Button } from '@/components/mobile/input/Button';
 *
 * export default function LoginScreen() {
 *   return (
 *     <View className="p-4">
 *       <Button onPress={handleLogin} variant="primary" fullWidth>
 *         Sign In
 *       </Button>
 *       <Button onPress={handleGoogle} variant="outline" leftIcon={<GoogleIcon />}>
 *         Continue with Google
 *       </Button>
 *     </View>
 *   );
 * }
 * ```
 */

import { cn } from '../utils'

/**
 * Button variant styles
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'

/**
 * Button size
 */
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

/**
 * Button component props
 */
export interface ButtonProps {
  /** Button content */
  children?: React.ReactNode
  /** Press handler */
  onPress?: () => void
  /** Additional NativeWind classes */
  className?: string
  /** Visual variant (default: 'primary') */
  variant?: ButtonVariant
  /** Button size (default: 'md') */
  size?: ButtonSize
  /** Whether button is disabled */
  disabled?: boolean
  /** Whether button is loading */
  loading?: boolean
  /** Loading text to display */
  loadingText?: string
  /** Icon on the left side */
  leftIcon?: React.ReactNode
  /** Icon on the right side */
  rightIcon?: React.ReactNode
  /** Make button full width */
  fullWidth?: boolean
  /** Test ID for testing */
  testID?: string
  /** Accessibility label */
  accessibilityLabel?: string
}

/**
 * Variant class mapping
 */
const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground active:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground active:bg-secondary/90',
  outline: 'border-2 border-input bg-transparent text-foreground active:bg-accent',
  ghost: 'bg-transparent text-foreground active:bg-accent',
  destructive: 'bg-destructive text-destructive-foreground active:bg-destructive/90',
  link: 'bg-transparent text-primary underline-offset-4 active:underline',
}

/**
 * Size class mapping
 */
const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm rounded-md',
  md: 'h-10 px-4 text-base rounded-lg',
  lg: 'h-12 px-6 text-lg rounded-lg',
  icon: 'h-10 w-10 rounded-lg',
}

/**
 * Button Component Template
 *
 * Full React Native implementation with NativeWind styling:
 */
export const ButtonTemplate = `import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps {
  children?: React.ReactNode;
  onPress?: () => void;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary active:bg-primary/90',
  secondary: 'bg-secondary active:bg-secondary/90',
  outline: 'border-2 border-input bg-transparent active:bg-accent',
  ghost: 'bg-transparent active:bg-accent',
  destructive: 'bg-destructive active:bg-destructive/90',
  link: 'bg-transparent',
};

const textClasses: Record<ButtonVariant, string> = {
  primary: 'text-primary-foreground',
  secondary: 'text-secondary-foreground',
  outline: 'text-foreground',
  ghost: 'text-foreground',
  destructive: 'text-destructive-foreground',
  link: 'text-primary underline',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 rounded-md',
  md: 'h-10 px-4 rounded-lg',
  lg: 'h-12 px-6 rounded-lg',
  icon: 'h-10 w-10 rounded-lg',
};

const textSizeClasses: Record<ButtonSize, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  icon: 'text-base',
};

export function Button({
  children,
  onPress,
  className,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  testID,
  accessibilityLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      className={cn(
        'flex-row items-center justify-center',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        isDisabled && 'opacity-50',
        className,
      )}
      testID={testID}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
      accessibilityState={{ disabled: isDisabled }}
    >
      {/* Loading Spinner */}
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? '#000' : '#fff'}
          className="mr-2"
        />
      )}

      {/* Left Icon */}
      {!loading && leftIcon && (
        <View className="mr-2">{leftIcon}</View>
      )}

      {/* Button Text */}
      {children && (
        <Text className={cn(textClasses[variant], textSizeClasses[size], 'font-medium')}>
          {loading && loadingText ? loadingText : children}
        </Text>
      )}

      {/* Right Icon */}
      {!loading && rightIcon && (
        <View className="ml-2">{rightIcon}</View>
      )}
    </Pressable>
  );
}
`

/**
 * Button component for React Native Web preview
 */
export function Button({
  children,
  onPress,
  className,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  testID,
  accessibilityLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading

  // Text color based on variant
  const textColorClass =
    variant === 'outline' || variant === 'ghost'
      ? 'text-foreground'
      : variant === 'link'
        ? 'text-primary'
        : variant === 'destructive'
          ? 'text-white'
          : 'text-white'

  return (
    <button
      onClick={isDisabled ? undefined : onPress}
      disabled={isDisabled}
      className={cn(
        'flex flex-row items-center justify-center font-medium transition-all',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        isDisabled && 'opacity-50 cursor-not-allowed',
        !isDisabled && 'hover:opacity-90',
        className,
      )}
      data-testid={testID}
      aria-label={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
      aria-disabled={isDisabled}
    >
      {/* Loading Spinner */}
      {loading && (
        <span className={cn('mr-2 animate-spin', textColorClass)}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      )}

      {/* Left Icon */}
      {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}

      {/* Button Text */}
      {children && <span className={textColorClass}>{loading && loadingText ? loadingText : children}</span>}

      {/* Right Icon */}
      {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  )
}

/**
 * Component metadata for Component Gallery
 */
export const ButtonMetadata = {
  name: 'Button',
  description: 'Versatile button component with multiple variants, sizes, and loading states.',
  category: 'Input',
  platform: 'mobile' as const,
  props: [
    { name: 'children', type: 'React.ReactNode', required: false, description: 'Button content/text' },
    { name: 'onPress', type: '() => void', required: false, description: 'Press handler' },
    { name: 'className', type: 'string', required: false, description: 'Additional NativeWind classes' },
    { name: 'variant', type: "'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'", required: false, default: "'primary'", description: 'Visual style variant' },
    { name: 'size', type: "'sm' | 'md' | 'lg' | 'icon'", required: false, default: "'md'", description: 'Button size' },
    { name: 'disabled', type: 'boolean', required: false, default: 'false', description: 'Disable button' },
    { name: 'loading', type: 'boolean', required: false, default: 'false', description: 'Show loading state' },
    { name: 'loadingText', type: 'string', required: false, description: 'Text to show during loading' },
    { name: 'leftIcon', type: 'React.ReactNode', required: false, description: 'Icon on left side' },
    { name: 'rightIcon', type: 'React.ReactNode', required: false, description: 'Icon on right side' },
    { name: 'fullWidth', type: 'boolean', required: false, default: 'false', description: 'Full width button' },
    { name: 'accessibilityLabel', type: 'string', required: false, description: 'Screen reader label' },
    { name: 'testID', type: 'string', required: false, description: 'Test ID for testing frameworks' },
  ],
  dependencies: ['nativewind'],
  examples: [
    {
      title: 'Primary Button',
      code: `<Button onPress={handleSubmit}>Submit</Button>`,
    },
    {
      title: 'All Variants',
      code: `<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button variant="link">Learn more</Button>`,
    },
    {
      title: 'Button with Icons',
      code: `<Button leftIcon={<PlusIcon />}>Add Item</Button>
<Button rightIcon={<ArrowRightIcon />}>Continue</Button>`,
    },
    {
      title: 'Loading State',
      code: `<Button loading loadingText="Saving...">Save</Button>`,
    },
    {
      title: 'Full Width',
      code: `<Button fullWidth variant="primary">Sign In</Button>`,
    },
  ],
}

export default Button
