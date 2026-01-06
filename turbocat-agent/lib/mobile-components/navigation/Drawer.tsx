/**
 * Drawer Component - Side Navigation Panel
 * Phase 4: Mobile Development - Task 5.3
 *
 * A slide-out navigation drawer/panel for secondary navigation and settings.
 * Supports swipe gestures and overlay backdrop.
 *
 * @example
 * ```tsx
 * import { Drawer, DrawerItem } from '@/components/mobile/navigation/Drawer';
 *
 * export default function App() {
 *   const [drawerOpen, setDrawerOpen] = useState(false);
 *
 *   return (
 *     <View className="flex-1">
 *       <Drawer
 *         isOpen={drawerOpen}
 *         onClose={() => setDrawerOpen(false)}
 *       >
 *         <DrawerItem icon="home" label="Home" onPress={() => navigate('Home')} />
 *         <DrawerItem icon="settings" label="Settings" onPress={() => navigate('Settings')} />
 *         <DrawerItem icon="logout" label="Logout" onPress={logout} />
 *       </Drawer>
 *       <Screen>...</Screen>
 *     </View>
 *   );
 * }
 * ```
 */

import { cn } from '../utils'

/**
 * Drawer position
 */
export type DrawerPosition = 'left' | 'right'

/**
 * DrawerItem props
 */
export interface DrawerItemProps {
  /** Item label */
  label: string
  /** Icon element or icon name */
  icon?: React.ReactNode | string
  /** Press handler */
  onPress?: () => void
  /** Whether item is active/selected */
  active?: boolean
  /** Whether item is disabled */
  disabled?: boolean
  /** Divider after item */
  divider?: boolean
  /** Additional className */
  className?: string
}

/**
 * Drawer component props
 */
export interface DrawerProps {
  /** Whether drawer is open */
  isOpen: boolean
  /** Close handler */
  onClose: () => void
  /** Drawer content (DrawerItem children) */
  children?: React.ReactNode
  /** Additional NativeWind classes */
  className?: string
  /** Drawer position (default: 'left') */
  position?: DrawerPosition
  /** Drawer width (default: '80%') */
  width?: string | number
  /** Show backdrop overlay */
  showBackdrop?: boolean
  /** Close on backdrop press */
  closeOnBackdropPress?: boolean
  /** Header content */
  header?: React.ReactNode
  /** Footer content */
  footer?: React.ReactNode
  /** Test ID for testing */
  testID?: string
}

/**
 * Drawer Component Template
 *
 * Full React Native implementation with NativeWind styling:
 */
export const DrawerTemplate = `import { View, Text, Pressable, Modal, Animated, Dimensions, PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

type DrawerPosition = 'left' | 'right';

interface DrawerItemProps {
  label: string;
  icon?: React.ReactNode | string;
  onPress?: () => void;
  active?: boolean;
  disabled?: boolean;
  divider?: boolean;
  className?: string;
}

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  className?: string;
  position?: DrawerPosition;
  width?: string | number;
  showBackdrop?: boolean;
  closeOnBackdropPress?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  testID?: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export function Drawer({
  isOpen,
  onClose,
  children,
  className,
  position = 'left',
  width = '80%',
  showBackdrop = true,
  closeOnBackdropPress = true,
  header,
  footer,
  testID,
}: DrawerProps) {
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(position === 'left' ? -SCREEN_WIDTH : SCREEN_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Calculate drawer width
  const drawerWidth = typeof width === 'string' && width.includes('%')
    ? (parseFloat(width) / 100) * SCREEN_WIDTH
    : typeof width === 'number'
    ? width
    : SCREEN_WIDTH * 0.8;

  // Animation when drawer opens/closes
  useEffect(() => {
    const toValue = isOpen ? 0 : (position === 'left' ? -drawerWidth : drawerWidth);
    Animated.parallel([
      Animated.timing(translateX, {
        toValue,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: isOpen ? 0.5 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen]);

  // Pan responder for swipe gestures
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        const clampedX = position === 'left'
          ? Math.min(0, Math.max(-drawerWidth, gestureState.dx))
          : Math.max(0, Math.min(drawerWidth, gestureState.dx));
        translateX.setValue(clampedX);
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = drawerWidth / 2;
        const shouldClose = position === 'left'
          ? gestureState.dx < -threshold
          : gestureState.dx > threshold;
        if (shouldClose) {
          onClose();
        } else {
          Animated.timing(translateX, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
      testID={testID}
    >
      {/* Backdrop */}
      {showBackdrop && (
        <Pressable
          onPress={closeOnBackdropPress ? onClose : undefined}
          className="absolute inset-0"
        >
          <Animated.View
            className="flex-1 bg-black"
            style={{ opacity: backdropOpacity }}
          />
        </Pressable>
      )}

      {/* Drawer Panel */}
      <Animated.View
        className={cn(
          'absolute top-0 bottom-0 bg-background',
          position === 'left' ? 'left-0' : 'right-0',
          className,
        )}
        style={{
          width: drawerWidth,
          transform: [{ translateX }],
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
        {...panResponder.panHandlers}
        accessibilityViewIsModal
        accessibilityRole="menu"
      >
        {/* Header */}
        {header && (
          <View className="p-4 border-b border-border">
            {header}
          </View>
        )}

        {/* Content */}
        <View className="flex-1">
          {children}
        </View>

        {/* Footer */}
        {footer && (
          <View className="p-4 border-t border-border">
            {footer}
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

// DrawerItem component
export function DrawerItem({
  label,
  icon,
  onPress,
  active = false,
  disabled = false,
  divider = false,
  className,
}: DrawerItemProps) {
  return (
    <>
      <Pressable
        onPress={disabled ? undefined : onPress}
        className={cn(
          'flex-row items-center px-4 py-3',
          active && 'bg-muted',
          disabled && 'opacity-50',
          className,
        )}
        accessibilityRole="menuitem"
        accessibilityState={{ disabled, selected: active }}
      >
        {icon && (
          <View className="mr-3">
            {typeof icon === 'string' ? (
              <Text className="text-xl text-foreground">{icon}</Text>
            ) : (
              icon
            )}
          </View>
        )}
        <Text className={cn('text-base', active ? 'font-semibold text-primary' : 'text-foreground')}>
          {label}
        </Text>
      </Pressable>
      {divider && <View className="h-px bg-border mx-4" />}
    </>
  );
}
`

/**
 * Drawer component for React Native Web preview
 */
export function Drawer({
  isOpen,
  onClose,
  children,
  className,
  position = 'left',
  width = '80%',
  showBackdrop = true,
  closeOnBackdropPress = true,
  header,
  footer,
  testID,
}: DrawerProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50" data-testid={testID} role="dialog" aria-modal="true">
      {/* Backdrop */}
      {showBackdrop && (
        <div
          className="absolute inset-0 bg-black/50 transition-opacity"
          onClick={closeOnBackdropPress ? onClose : undefined}
          aria-hidden="true"
        />
      )}

      {/* Drawer Panel */}
      <div
        className={cn(
          'absolute top-0 bottom-0 bg-background flex flex-col transition-transform duration-250',
          position === 'left' ? 'left-0' : 'right-0',
          className,
        )}
        style={{ width: typeof width === 'number' ? `${width}px` : width }}
        role="menu"
      >
        {/* Header */}
        {header && <div className="p-4 border-b border-border">{header}</div>}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && <div className="p-4 border-t border-border">{footer}</div>}
      </div>
    </div>
  )
}

/**
 * DrawerItem component for React Native Web preview
 */
export function DrawerItem({
  label,
  icon,
  onPress,
  active = false,
  disabled = false,
  divider = false,
  className,
}: DrawerItemProps) {
  return (
    <>
      <button
        onClick={disabled ? undefined : onPress}
        className={cn(
          'flex flex-row items-center w-full px-4 py-3 text-left transition-colors',
          active && 'bg-muted',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'hover:bg-muted/50',
          className,
        )}
        role="menuitem"
        aria-disabled={disabled}
        aria-current={active ? 'page' : undefined}
        disabled={disabled}
      >
        {icon && (
          <span className="mr-3">{typeof icon === 'string' ? <span className="text-xl">{icon}</span> : icon}</span>
        )}
        <span className={cn('text-base', active ? 'font-semibold text-primary' : 'text-foreground')}>{label}</span>
      </button>
      {divider && <div className="h-px bg-border mx-4" />}
    </>
  )
}

/**
 * DrawerHeader component for user info or branding
 */
export function DrawerHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('p-4', className)}>{children}</div>
}

/**
 * Component metadata for Component Gallery
 */
export const DrawerMetadata = {
  name: 'Drawer',
  description: 'Slide-out navigation drawer with swipe gestures and overlay backdrop.',
  category: 'Navigation',
  platform: 'mobile' as const,
  props: [
    { name: 'isOpen', type: 'boolean', required: true, description: 'Whether drawer is open' },
    { name: 'onClose', type: '() => void', required: true, description: 'Close handler' },
    { name: 'children', type: 'React.ReactNode', required: false, description: 'Drawer content' },
    { name: 'className', type: 'string', required: false, description: 'Additional NativeWind classes' },
    { name: 'position', type: "'left' | 'right'", required: false, default: "'left'", description: 'Drawer position' },
    { name: 'width', type: 'string | number', required: false, default: "'80%'", description: 'Drawer width' },
    { name: 'showBackdrop', type: 'boolean', required: false, default: 'true', description: 'Show backdrop overlay' },
    { name: 'closeOnBackdropPress', type: 'boolean', required: false, default: 'true', description: 'Close on backdrop press' },
    { name: 'header', type: 'React.ReactNode', required: false, description: 'Header content' },
    { name: 'footer', type: 'React.ReactNode', required: false, description: 'Footer content' },
    { name: 'testID', type: 'string', required: false, description: 'Test ID for testing frameworks' },
  ],
  subcomponents: ['DrawerItem', 'DrawerHeader'],
  dependencies: ['react-native-safe-area-context', 'nativewind'],
  examples: [
    {
      title: 'Basic Drawer',
      code: `<Drawer isOpen={isOpen} onClose={() => setIsOpen(false)}>
  <DrawerItem icon="🏠" label="Home" onPress={() => navigate('Home')} active />
  <DrawerItem icon="⚙️" label="Settings" onPress={() => navigate('Settings')} />
  <DrawerItem icon="🚪" label="Logout" onPress={logout} divider />
</Drawer>`,
    },
    {
      title: 'Drawer with Header',
      code: `<Drawer
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  header={
    <View className="flex-row items-center">
      <Avatar src={user.avatar} />
      <View className="ml-3">
        <Text className="font-semibold">{user.name}</Text>
        <Text className="text-sm text-muted-foreground">{user.email}</Text>
      </View>
    </View>
  }
>
  <DrawerItem label="Profile" onPress={() => {}} />
  <DrawerItem label="Settings" onPress={() => {}} />
</Drawer>`,
    },
    {
      title: 'Right-side Drawer',
      code: `<Drawer
  isOpen={isOpen}
  onClose={handleClose}
  position="right"
  width={300}
>
  <DrawerItem label="Notifications" />
  <DrawerItem label="Messages" badge={3} />
</Drawer>`,
    },
  ],
}

export default Drawer
