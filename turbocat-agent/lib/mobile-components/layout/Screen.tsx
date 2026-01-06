/**
 * Screen Component - Mobile Layout Foundation
 * Phase 4: Mobile Development - Task 5.2
 *
 * A full-screen container with safe area handling for iOS notches and Android status bars.
 * Uses SafeAreaView for proper edge-to-edge display.
 *
 * @example
 * ```tsx
 * import { Screen } from '@/components/mobile/layout/Screen';
 *
 * export default function HomeScreen() {
 *   return (
 *     <Screen className="bg-background">
 *       <Text className="text-2xl font-bold">Welcome</Text>
 *     </Screen>
 *   );
 * }
 * ```
 */

import { cn } from '../utils'

/**
 * Screen component props
 */
export interface ScreenProps {
  /** Child elements to render */
  children: React.ReactNode
  /** Additional NativeWind classes */
  className?: string
  /** Whether to include safe area padding on all edges (default: true) */
  safeArea?: boolean
  /** Whether to include safe area padding only on top */
  safeAreaTop?: boolean
  /** Whether to include safe area padding only on bottom */
  safeAreaBottom?: boolean
  /** Background color override */
  backgroundColor?: string
  /** Accessibility label for the screen */
  accessibilityLabel?: string
  /** Test ID for testing */
  testID?: string
}

/**
 * Screen Component Template
 *
 * Full React Native implementation with NativeWind styling:
 */
export const ScreenTemplate = `import { SafeAreaView, View, StatusBar, Platform } from 'react-native';
import { cn } from '@/lib/utils';

interface ScreenProps {
  children: React.ReactNode;
  className?: string;
  safeArea?: boolean;
  safeAreaTop?: boolean;
  safeAreaBottom?: boolean;
  backgroundColor?: string;
  accessibilityLabel?: string;
  testID?: string;
}

export function Screen({
  children,
  className,
  safeArea = true,
  safeAreaTop = false,
  safeAreaBottom = false,
  backgroundColor,
  accessibilityLabel,
  testID,
}: ScreenProps) {
  // Determine safe area edges
  const edges = safeArea
    ? ['top', 'bottom', 'left', 'right']
    : [
        ...(safeAreaTop ? ['top'] : []),
        ...(safeAreaBottom ? ['bottom'] : []),
      ];

  return (
    <SafeAreaView
      className={cn('flex-1 bg-background', className)}
      style={backgroundColor ? { backgroundColor } : undefined}
      edges={edges as any}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="none"
      testID={testID}
    >
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'default'}
        backgroundColor="transparent"
        translucent
      />
      {children}
    </SafeAreaView>
  );
}
`

/**
 * Screen component code for display in Component Gallery
 */
export function Screen({
  children,
  className,
  safeArea = true,
  safeAreaTop = false,
  safeAreaBottom = false,
  backgroundColor,
  accessibilityLabel,
  testID,
}: ScreenProps) {
  // This is a placeholder for React Native Web preview
  // In actual React Native, this would use SafeAreaView
  const baseClasses = cn('flex-1 bg-white dark:bg-gray-900', className)

  const paddingClasses = cn(
    safeArea && 'pt-safe-top pb-safe-bottom',
    safeAreaTop && !safeArea && 'pt-safe-top',
    safeAreaBottom && !safeArea && 'pb-safe-bottom',
  )

  return (
    <div
      className={cn(baseClasses, paddingClasses)}
      style={backgroundColor ? { backgroundColor } : undefined}
      aria-label={accessibilityLabel}
      data-testid={testID}
      role="main"
    >
      {children}
    </div>
  )
}

/**
 * Component metadata for Component Gallery
 */
export const ScreenMetadata = {
  name: 'Screen',
  description: 'Full-screen container with safe area handling for iOS notches and Android status bars.',
  category: 'Layout',
  platform: 'mobile' as const,
  props: [
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Child elements to render' },
    { name: 'className', type: 'string', required: false, description: 'Additional NativeWind classes' },
    { name: 'safeArea', type: 'boolean', required: false, default: 'true', description: 'Include safe area padding on all edges' },
    { name: 'safeAreaTop', type: 'boolean', required: false, default: 'false', description: 'Include safe area padding only on top' },
    { name: 'safeAreaBottom', type: 'boolean', required: false, default: 'false', description: 'Include safe area padding only on bottom' },
    { name: 'backgroundColor', type: 'string', required: false, description: 'Background color override' },
    { name: 'accessibilityLabel', type: 'string', required: false, description: 'Accessibility label for screen readers' },
    { name: 'testID', type: 'string', required: false, description: 'Test ID for testing frameworks' },
  ],
  dependencies: ['react-native-safe-area-context', 'nativewind'],
  examples: [
    {
      title: 'Basic Screen',
      code: `<Screen>
  <Text className="text-2xl font-bold">Welcome</Text>
</Screen>`,
    },
    {
      title: 'Screen with custom background',
      code: `<Screen backgroundColor="#f97316" className="items-center justify-center">
  <Text className="text-white text-xl">Orange Screen</Text>
</Screen>`,
    },
    {
      title: 'Screen with top-only safe area',
      code: `<Screen safeArea={false} safeAreaTop>
  <View className="flex-1 p-4">
    <Text>Content with top safe area only</Text>
  </View>
</Screen>`,
    },
  ],
}

export default Screen
