/**
 * Loading/Spinner Component - Activity Indicator
 * Phase 4: Mobile Development - Task 5.6
 *
 * A loading indicator component with various sizes and styles.
 * Can be used inline, overlay, or fullscreen.
 *
 * @example
 * ```tsx
 * import { Loading, Spinner, LoadingOverlay } from '@/components/mobile/feedback/Loading';
 *
 * export default function DataScreen() {
 *   if (isLoading) {
 *     return <Loading fullscreen message="Loading data..." />;
 *   }
 *
 *   return (
 *     <View>
 *       <Button loading={isSubmitting}>
 *         <Spinner size="sm" color="white" />
 *         Submit
 *       </Button>
 *     </View>
 *   );
 * }
 * ```
 */

import { cn } from '../utils'

/**
 * Spinner size
 */
export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * Spinner color
 */
export type SpinnerColor = 'primary' | 'secondary' | 'white' | 'muted' | 'current'

/**
 * Spinner component props
 */
export interface SpinnerProps {
  /** Spinner size (default: 'md') */
  size?: SpinnerSize
  /** Spinner color (default: 'primary') */
  color?: SpinnerColor
  /** Additional NativeWind classes */
  className?: string
  /** Test ID for testing */
  testID?: string
}

/**
 * Loading component props
 */
export interface LoadingProps {
  /** Loading message */
  message?: string
  /** Spinner size */
  size?: SpinnerSize
  /** Spinner color */
  color?: SpinnerColor
  /** Fullscreen loading overlay */
  fullscreen?: boolean
  /** Show backdrop */
  showBackdrop?: boolean
  /** Additional NativeWind classes */
  className?: string
  /** Test ID for testing */
  testID?: string
}

/**
 * LoadingOverlay props
 */
export interface LoadingOverlayProps {
  /** Whether overlay is visible */
  visible: boolean
  /** Loading message */
  message?: string
  /** Backdrop opacity */
  backdropOpacity?: number
  /** Spinner size */
  size?: SpinnerSize
  /** Test ID for testing */
  testID?: string
}

/**
 * Size class mapping
 */
const sizeClasses: Record<SpinnerSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
}

/**
 * Color class mapping
 */
const colorClasses: Record<SpinnerColor, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary-foreground',
  white: 'text-white',
  muted: 'text-muted-foreground',
  current: 'text-current',
}

/**
 * Loading Component Template
 *
 * Full React Native implementation with NativeWind styling:
 */
export const LoadingTemplate = `import { View, Text, ActivityIndicator, Modal } from 'react-native';
import { cn } from '@/lib/utils';

// Types...

const sizeMap: Record<SpinnerSize, 'small' | 'large'> = {
  xs: 'small',
  sm: 'small',
  md: 'small',
  lg: 'large',
  xl: 'large',
};

const colorMap: Record<SpinnerColor, string> = {
  primary: '#f97316',
  secondary: '#6b7280',
  white: '#ffffff',
  muted: '#9ca3af',
  current: undefined, // Uses current text color
};

export function Spinner({
  size = 'md',
  color = 'primary',
  className,
  testID,
}: SpinnerProps) {
  return (
    <ActivityIndicator
      size={sizeMap[size]}
      color={colorMap[color]}
      className={cn(sizeClasses[size], className)}
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    />
  );
}

export function Loading({
  message,
  size = 'md',
  color = 'primary',
  fullscreen = false,
  showBackdrop = true,
  className,
  testID,
}: LoadingProps) {
  const content = (
    <View className={cn(
      'items-center justify-center',
      fullscreen && 'flex-1',
      className,
    )}>
      <Spinner size={size} color={color} />
      {message && (
        <Text className="mt-3 text-muted-foreground">
          {message}
        </Text>
      )}
    </View>
  );

  if (fullscreen) {
    return (
      <View
        className={cn(
          'flex-1 items-center justify-center',
          showBackdrop && 'bg-background',
        )}
        testID={testID}
        accessibilityRole="alert"
        accessibilityLabel={message || 'Loading'}
      >
        {content}
      </View>
    );
  }

  return (
    <View
      testID={testID}
      accessibilityRole="alert"
      accessibilityLabel={message || 'Loading'}
    >
      {content}
    </View>
  );
}

export function LoadingOverlay({
  visible,
  message,
  backdropOpacity = 0.7,
  size = 'lg',
  testID,
}: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      testID={testID}
    >
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: \`rgba(255, 255, 255, \${backdropOpacity})\` }}
      >
        <View className="bg-card p-6 rounded-xl shadow-lg items-center">
          <Spinner size={size} color="primary" />
          {message && (
            <Text className="mt-3 text-foreground font-medium">
              {message}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}
`

/**
 * Spinner component for React Native Web preview
 */
export function Spinner({ size = 'md', color = 'primary', className, testID }: SpinnerProps) {
  return (
    <svg
      className={cn('animate-spin', sizeClasses[size], colorClasses[color], className)}
      viewBox="0 0 24 24"
      fill="none"
      data-testid={testID}
      role="progressbar"
      aria-label="Loading"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

/**
 * Loading component for React Native Web preview
 */
export function Loading({
  message,
  size = 'md',
  color = 'primary',
  fullscreen = false,
  showBackdrop = true,
  className,
  testID,
}: LoadingProps) {
  const content = (
    <div className={cn('flex flex-col items-center justify-center', fullscreen && 'flex-1', className)}>
      <Spinner size={size} color={color} />
      {message && <p className="mt-3 text-muted-foreground">{message}</p>}
    </div>
  )

  if (fullscreen) {
    return (
      <div
        className={cn('fixed inset-0 flex items-center justify-center z-50', showBackdrop && 'bg-background')}
        data-testid={testID}
        role="alert"
        aria-label={message || 'Loading'}
      >
        {content}
      </div>
    )
  }

  return (
    <div data-testid={testID} role="alert" aria-label={message || 'Loading'}>
      {content}
    </div>
  )
}

/**
 * LoadingOverlay component for React Native Web preview
 */
export function LoadingOverlay({ visible, message, backdropOpacity = 0.7, size = 'lg', testID }: LoadingOverlayProps) {
  if (!visible) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: `rgba(255, 255, 255, ${backdropOpacity})` }}
      data-testid={testID}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-card p-6 rounded-xl shadow-lg flex flex-col items-center">
        <Spinner size={size} color="primary" />
        {message && <p className="mt-3 text-foreground font-medium">{message}</p>}
      </div>
    </div>
  )
}

/**
 * Skeleton loading placeholder
 */
export function Skeleton({ className, animated = true }: { className?: string; animated?: boolean }) {
  return (
    <div
      className={cn('bg-muted rounded', animated && 'animate-pulse', className)}
      aria-hidden="true"
    />
  )
}

/**
 * Component metadata for Component Gallery
 */
export const LoadingMetadata = {
  name: 'Loading',
  description: 'Loading indicators with spinner, overlay, and fullscreen options.',
  category: 'Feedback',
  platform: 'mobile' as const,
  props: [
    { name: 'message', type: 'string', required: false, description: 'Loading message text' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl'", required: false, default: "'md'", description: 'Spinner size' },
    { name: 'color', type: "'primary' | 'secondary' | 'white' | 'muted' | 'current'", required: false, default: "'primary'", description: 'Spinner color' },
    { name: 'fullscreen', type: 'boolean', required: false, default: 'false', description: 'Fullscreen loading' },
    { name: 'showBackdrop', type: 'boolean', required: false, default: 'true', description: 'Show background' },
    { name: 'testID', type: 'string', required: false, description: 'Test ID for testing frameworks' },
  ],
  subcomponents: ['Spinner', 'LoadingOverlay', 'Skeleton'],
  dependencies: ['nativewind'],
  examples: [
    {
      title: 'Basic Spinner',
      code: `<Spinner />`,
    },
    {
      title: 'All Sizes',
      code: `<View className="flex-row gap-4 items-center">
  <Spinner size="xs" />
  <Spinner size="sm" />
  <Spinner size="md" />
  <Spinner size="lg" />
  <Spinner size="xl" />
</View>`,
    },
    {
      title: 'With Message',
      code: `<Loading message="Loading data..." />`,
    },
    {
      title: 'Fullscreen Loading',
      code: `<Loading
  fullscreen
  message="Please wait..."
  size="lg"
/>`,
    },
    {
      title: 'Loading Overlay',
      code: `<LoadingOverlay
  visible={isProcessing}
  message="Processing..."
/>`,
    },
    {
      title: 'Skeleton Placeholders',
      code: `<View className="gap-3">
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
  <Skeleton className="h-20 w-full" />
</View>`,
    },
  ],
}

export default Loading
