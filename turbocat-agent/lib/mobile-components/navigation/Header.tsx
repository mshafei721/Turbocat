/**
 * Header/AppBar Component - Navigation Header
 * Phase 4: Mobile Development - Task 5.3
 *
 * A customizable navigation header/app bar with support for titles, back buttons,
 * and action items. Follows iOS and Android design patterns.
 *
 * @example
 * ```tsx
 * import { Header } from '@/components/mobile/navigation/Header';
 *
 * export default function ProfileScreen() {
 *   return (
 *     <Screen>
 *       <Header
 *         title="Profile"
 *         showBack
 *         onBack={() => navigation.goBack()}
 *         rightAction={<Icon name="settings" />}
 *         onRightAction={() => navigation.navigate('Settings')}
 *       />
 *       <View>...</View>
 *     </Screen>
 *   );
 * }
 * ```
 */

import { cn } from '../utils'

/**
 * Header variant styles
 */
export type HeaderVariant = 'default' | 'transparent' | 'primary' | 'dark'

/**
 * Header size
 */
export type HeaderSize = 'sm' | 'md' | 'lg'

/**
 * Header component props
 */
export interface HeaderProps {
  /** Header title text */
  title?: string
  /** Subtitle text */
  subtitle?: string
  /** Additional NativeWind classes */
  className?: string
  /** Visual variant (default: 'default') */
  variant?: HeaderVariant
  /** Header size (default: 'md') */
  size?: HeaderSize
  /** Show back button */
  showBack?: boolean
  /** Back button callback */
  onBack?: () => void
  /** Custom back button icon/element */
  backIcon?: React.ReactNode
  /** Left action element */
  leftAction?: React.ReactNode
  /** Left action callback */
  onLeftAction?: () => void
  /** Right action element */
  rightAction?: React.ReactNode
  /** Right action callback */
  onRightAction?: () => void
  /** Center content (replaces title) */
  centerContent?: React.ReactNode
  /** Whether title is centered (iOS style) */
  centerTitle?: boolean
  /** Shadow/elevation */
  elevated?: boolean
  /** Border bottom */
  bordered?: boolean
  /** Test ID for testing */
  testID?: string
}

/**
 * Variant class mapping
 */
const variantClasses: Record<HeaderVariant, { container: string; title: string }> = {
  default: {
    container: 'bg-background',
    title: 'text-foreground',
  },
  transparent: {
    container: 'bg-transparent',
    title: 'text-foreground',
  },
  primary: {
    container: 'bg-primary',
    title: 'text-primary-foreground',
  },
  dark: {
    container: 'bg-gray-900',
    title: 'text-white',
  },
}

/**
 * Size class mapping
 */
const sizeClasses: Record<HeaderSize, { container: string; title: string; subtitle: string }> = {
  sm: {
    container: 'h-12 px-2',
    title: 'text-base font-semibold',
    subtitle: 'text-xs',
  },
  md: {
    container: 'h-14 px-3',
    title: 'text-lg font-semibold',
    subtitle: 'text-sm',
  },
  lg: {
    container: 'h-16 px-4',
    title: 'text-xl font-bold',
    subtitle: 'text-sm',
  },
}

/**
 * Header Component Template
 *
 * Full React Native implementation with NativeWind styling:
 */
export const HeaderTemplate = `import { View, Text, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '@/lib/utils';

type HeaderVariant = 'default' | 'transparent' | 'primary' | 'dark';
type HeaderSize = 'sm' | 'md' | 'lg';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  className?: string;
  variant?: HeaderVariant;
  size?: HeaderSize;
  showBack?: boolean;
  onBack?: () => void;
  backIcon?: React.ReactNode;
  leftAction?: React.ReactNode;
  onLeftAction?: () => void;
  rightAction?: React.ReactNode;
  onRightAction?: () => void;
  centerContent?: React.ReactNode;
  centerTitle?: boolean;
  elevated?: boolean;
  bordered?: boolean;
  testID?: string;
}

export function Header({
  title,
  subtitle,
  className,
  variant = 'default',
  size = 'md',
  showBack = false,
  onBack,
  backIcon,
  leftAction,
  onLeftAction,
  rightAction,
  onRightAction,
  centerContent,
  centerTitle = Platform.OS === 'ios',
  elevated = false,
  bordered = true,
  testID,
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const variantStyle = variantClasses[variant];
  const sizeStyle = sizeClasses[size];

  // Default back icon (chevron left)
  const BackIcon = backIcon || (
    <Text className={cn('text-2xl', variantStyle.title)}>{'<'}</Text>
  );

  return (
    <View
      className={cn(
        'flex-row items-center',
        variantStyle.container,
        sizeStyle.container,
        elevated && 'shadow-md',
        bordered && 'border-b border-border',
        className,
      )}
      style={{ paddingTop: insets.top }}
      testID={testID}
      accessible
      accessibilityRole="header"
    >
      {/* Left Section */}
      <View className="flex-row items-center min-w-[60px]">
        {showBack && (
          <Pressable
            onPress={onBack}
            className="p-2 -ml-2 active:opacity-70"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            {BackIcon}
          </Pressable>
        )}
        {leftAction && (
          <Pressable
            onPress={onLeftAction}
            className="p-2 active:opacity-70"
            accessibilityRole="button"
          >
            {leftAction}
          </Pressable>
        )}
      </View>

      {/* Center Section */}
      <View className={cn('flex-1', centerTitle && 'items-center')}>
        {centerContent || (
          <View>
            {title && (
              <Text
                className={cn(sizeStyle.title, variantStyle.title)}
                numberOfLines={1}
                accessibilityRole="header"
              >
                {title}
              </Text>
            )}
            {subtitle && (
              <Text
                className={cn(sizeStyle.subtitle, 'text-muted-foreground')}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Right Section */}
      <View className="flex-row items-center min-w-[60px] justify-end">
        {rightAction && (
          <Pressable
            onPress={onRightAction}
            className="p-2 active:opacity-70"
            accessibilityRole="button"
          >
            {rightAction}
          </Pressable>
        )}
      </View>
    </View>
  );
}
`

/**
 * Header component for React Native Web preview
 */
export function Header({
  title,
  subtitle,
  className,
  variant = 'default',
  size = 'md',
  showBack = false,
  onBack,
  backIcon,
  leftAction,
  onLeftAction,
  rightAction,
  onRightAction,
  centerContent,
  centerTitle = true, // iOS style default for web preview
  elevated = false,
  bordered = true,
  testID,
}: HeaderProps) {
  const variantStyle = variantClasses[variant]
  const sizeStyle = sizeClasses[size]

  // Default back icon
  const BackIcon = backIcon || <span className={cn('text-2xl', variantStyle.title)}>&#8249;</span>

  return (
    <header
      className={cn(
        'flex flex-row items-center',
        variantStyle.container,
        sizeStyle.container,
        elevated && 'shadow-md',
        bordered && 'border-b border-border',
        className,
      )}
      data-testid={testID}
      role="banner"
    >
      {/* Left Section */}
      <div className="flex flex-row items-center min-w-[60px]">
        {showBack && (
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:opacity-70 active:opacity-50 transition-opacity"
            aria-label="Go back"
          >
            {BackIcon}
          </button>
        )}
        {leftAction && (
          <button onClick={onLeftAction} className="p-2 hover:opacity-70 active:opacity-50 transition-opacity">
            {leftAction}
          </button>
        )}
      </div>

      {/* Center Section */}
      <div className={cn('flex-1', centerTitle && 'text-center')}>
        {centerContent || (
          <div>
            {title && (
              <h1 className={cn(sizeStyle.title, variantStyle.title, 'truncate')} role="heading" aria-level={1}>
                {title}
              </h1>
            )}
            {subtitle && <p className={cn(sizeStyle.subtitle, 'text-muted-foreground truncate')}>{subtitle}</p>}
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="flex flex-row items-center min-w-[60px] justify-end">
        {rightAction && (
          <button onClick={onRightAction} className="p-2 hover:opacity-70 active:opacity-50 transition-opacity">
            {rightAction}
          </button>
        )}
      </div>
    </header>
  )
}

/**
 * Component metadata for Component Gallery
 */
export const HeaderMetadata = {
  name: 'Header',
  description: 'Customizable navigation header/app bar with back button, title, and action items.',
  category: 'Navigation',
  platform: 'mobile' as const,
  props: [
    { name: 'title', type: 'string', required: false, description: 'Header title text' },
    { name: 'subtitle', type: 'string', required: false, description: 'Subtitle text below title' },
    { name: 'className', type: 'string', required: false, description: 'Additional NativeWind classes' },
    { name: 'variant', type: "'default' | 'transparent' | 'primary' | 'dark'", required: false, default: "'default'", description: 'Visual style variant' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, default: "'md'", description: 'Header size' },
    { name: 'showBack', type: 'boolean', required: false, default: 'false', description: 'Show back button' },
    { name: 'onBack', type: '() => void', required: false, description: 'Back button callback' },
    { name: 'leftAction', type: 'React.ReactNode', required: false, description: 'Left action element' },
    { name: 'rightAction', type: 'React.ReactNode', required: false, description: 'Right action element' },
    { name: 'centerContent', type: 'React.ReactNode', required: false, description: 'Custom center content' },
    { name: 'centerTitle', type: 'boolean', required: false, default: 'Platform.OS === ios', description: 'Center title (iOS style)' },
    { name: 'elevated', type: 'boolean', required: false, default: 'false', description: 'Add shadow/elevation' },
    { name: 'bordered', type: 'boolean', required: false, default: 'true', description: 'Show bottom border' },
    { name: 'testID', type: 'string', required: false, description: 'Test ID for testing frameworks' },
  ],
  dependencies: ['react-native-safe-area-context', 'nativewind'],
  examples: [
    {
      title: 'Basic Header',
      code: `<Header title="Home" />`,
    },
    {
      title: 'Header with Back Button',
      code: `<Header
  title="Profile"
  showBack
  onBack={() => navigation.goBack()}
/>`,
    },
    {
      title: 'Header with Actions',
      code: `<Header
  title="Messages"
  leftAction={<Icon name="menu" />}
  onLeftAction={() => openDrawer()}
  rightAction={<Icon name="search" />}
  onRightAction={() => openSearch()}
/>`,
    },
    {
      title: 'Primary Variant',
      code: `<Header
  title="Settings"
  variant="primary"
  showBack
  onBack={() => navigation.goBack()}
/>`,
    },
  ],
}

export default Header
