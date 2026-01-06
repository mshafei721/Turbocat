/**
 * TabBar Component - Bottom Navigation
 * Phase 4: Mobile Development - Task 5.3
 *
 * A bottom tab bar for app-level navigation. Supports icons, labels, badges,
 * and follows both iOS and Material Design patterns.
 *
 * @example
 * ```tsx
 * import { TabBar, TabBarItem } from '@/components/mobile/navigation/TabBar';
 *
 * export default function AppLayout() {
 *   const [activeTab, setActiveTab] = useState('home');
 *
 *   return (
 *     <View className="flex-1">
 *       <View className="flex-1">{renderScreen()}</View>
 *       <TabBar activeTab={activeTab} onTabChange={setActiveTab}>
 *         <TabBarItem id="home" label="Home" icon="home" />
 *         <TabBarItem id="search" label="Search" icon="search" />
 *         <TabBarItem id="profile" label="Profile" icon="user" badge={3} />
 *       </TabBar>
 *     </View>
 *   );
 * }
 * ```
 */

import { cn } from '../utils'

/**
 * TabBar variant styles
 */
export type TabBarVariant = 'default' | 'elevated' | 'transparent'

/**
 * TabBar item props
 */
export interface TabBarItemProps {
  /** Unique identifier for the tab */
  id: string
  /** Tab label text */
  label: string
  /** Icon element or icon name */
  icon?: React.ReactNode | string
  /** Badge count or indicator */
  badge?: number | boolean
  /** Whether tab is disabled */
  disabled?: boolean
  /** Custom active icon */
  activeIcon?: React.ReactNode | string
}

/**
 * TabBar component props
 */
export interface TabBarProps {
  /** Tab items (TabBarItem children) */
  children?: React.ReactNode
  /** Tab items as array (alternative to children) */
  items?: TabBarItemProps[]
  /** Currently active tab ID */
  activeTab: string
  /** Callback when tab changes */
  onTabChange: (tabId: string) => void
  /** Additional NativeWind classes */
  className?: string
  /** Visual variant (default: 'default') */
  variant?: TabBarVariant
  /** Show labels */
  showLabels?: boolean
  /** Active tab color */
  activeColor?: string
  /** Inactive tab color */
  inactiveColor?: string
  /** Test ID for testing */
  testID?: string
}

/**
 * Variant class mapping
 */
const variantClasses: Record<TabBarVariant, string> = {
  default: 'bg-background border-t border-border',
  elevated: 'bg-background shadow-lg',
  transparent: 'bg-transparent',
}

/**
 * TabBar Component Template
 *
 * Full React Native implementation with NativeWind styling:
 */
export const TabBarTemplate = `import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '@/lib/utils';

type TabBarVariant = 'default' | 'elevated' | 'transparent';

interface TabBarItemProps {
  id: string;
  label: string;
  icon?: React.ReactNode | string;
  badge?: number | boolean;
  disabled?: boolean;
  activeIcon?: React.ReactNode | string;
}

interface TabBarProps {
  children?: React.ReactNode;
  items?: TabBarItemProps[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  variant?: TabBarVariant;
  showLabels?: boolean;
  activeColor?: string;
  inactiveColor?: string;
  testID?: string;
}

export function TabBar({
  children,
  items,
  activeTab,
  onTabChange,
  className,
  variant = 'default',
  showLabels = true,
  activeColor = 'text-primary',
  inactiveColor = 'text-muted-foreground',
  testID,
}: TabBarProps) {
  const insets = useSafeAreaInsets();

  // Get tabs from items prop or children
  const tabs = items || React.Children.toArray(children).map((child) => {
    if (React.isValidElement(child)) {
      return child.props as TabBarItemProps;
    }
    return null;
  }).filter(Boolean);

  return (
    <View
      className={cn(
        'flex-row',
        variantClasses[variant],
        className,
      )}
      style={{ paddingBottom: insets.bottom }}
      testID={testID}
      accessibilityRole="tablist"
    >
      {tabs.map((tab) => {
        if (!tab) return null;
        const isActive = activeTab === tab.id;
        const colorClass = isActive ? activeColor : inactiveColor;

        return (
          <Pressable
            key={tab.id}
            onPress={() => !tab.disabled && onTabChange(tab.id)}
            className={cn(
              'flex-1 items-center justify-center py-2',
              tab.disabled && 'opacity-50',
            )}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
            disabled={tab.disabled}
          >
            <View className="relative">
              {/* Icon */}
              {typeof tab.icon === 'string' ? (
                <Text className={cn('text-2xl', colorClass)}>
                  {isActive && tab.activeIcon ? tab.activeIcon : tab.icon}
                </Text>
              ) : (
                <View className={colorClass}>
                  {isActive && tab.activeIcon ? tab.activeIcon : tab.icon}
                </View>
              )}

              {/* Badge */}
              {tab.badge && (
                <View className="absolute -top-1 -right-2 bg-destructive rounded-full min-w-[16px] h-4 items-center justify-center px-1">
                  {typeof tab.badge === 'number' && (
                    <Text className="text-xs text-white font-semibold">
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Label */}
            {showLabels && (
              <Text className={cn('text-xs mt-1', colorClass)}>
                {tab.label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// TabBarItem component for declarative usage
export function TabBarItem(_props: TabBarItemProps) {
  return null; // Rendered by parent TabBar
}
`

/**
 * TabBar component for React Native Web preview
 */
export function TabBar({
  children,
  items,
  activeTab,
  onTabChange,
  className,
  variant = 'default',
  showLabels = true,
  activeColor = 'text-primary',
  inactiveColor = 'text-muted-foreground',
  testID,
}: TabBarProps) {
  // Get tabs from items prop or children
  const tabs =
    items ||
    (children
      ? (Array.isArray(children) ? children : [children])
          .map((child) => {
            if (child && typeof child === 'object' && 'props' in child) {
              return child.props as TabBarItemProps
            }
            return null
          })
          .filter(Boolean)
      : [])

  return (
    <nav
      className={cn('flex flex-row', variantClasses[variant], className)}
      data-testid={testID}
      role="tablist"
      aria-label="Main navigation"
    >
      {tabs.map((tab) => {
        if (!tab) return null
        const isActive = activeTab === tab.id
        const colorClass = isActive ? activeColor : inactiveColor

        return (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center py-2 transition-colors',
              tab.disabled && 'opacity-50 cursor-not-allowed',
              !tab.disabled && 'hover:bg-muted/50',
            )}
            role="tab"
            aria-selected={isActive}
            aria-label={tab.label}
            disabled={tab.disabled}
          >
            <div className="relative">
              {/* Icon */}
              {typeof tab.icon === 'string' ? (
                <span className={cn('text-2xl', colorClass)}>{isActive && tab.activeIcon ? tab.activeIcon : tab.icon}</span>
              ) : (
                <div className={colorClass}>{isActive && tab.activeIcon ? tab.activeIcon : tab.icon}</div>
              )}

              {/* Badge */}
              {tab.badge && (
                <span className="absolute -top-1 -right-2 bg-destructive rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                  {typeof tab.badge === 'number' && (
                    <span className="text-xs text-white font-semibold">{tab.badge > 99 ? '99+' : tab.badge}</span>
                  )}
                </span>
              )}
            </div>

            {/* Label */}
            {showLabels && <span className={cn('text-xs mt-1', colorClass)}>{tab.label}</span>}
          </button>
        )
      })}
    </nav>
  )
}

/**
 * TabBarItem component for declarative usage
 */
export function TabBarItem(_props: TabBarItemProps) {
  return null // Rendered by parent TabBar
}

/**
 * Component metadata for Component Gallery
 */
export const TabBarMetadata = {
  name: 'TabBar',
  description: 'Bottom tab bar for app-level navigation with icons, labels, and badges.',
  category: 'Navigation',
  platform: 'mobile' as const,
  props: [
    { name: 'items', type: 'TabBarItemProps[]', required: false, description: 'Tab items as array' },
    { name: 'activeTab', type: 'string', required: true, description: 'Currently active tab ID' },
    { name: 'onTabChange', type: '(tabId: string) => void', required: true, description: 'Callback when tab changes' },
    { name: 'className', type: 'string', required: false, description: 'Additional NativeWind classes' },
    { name: 'variant', type: "'default' | 'elevated' | 'transparent'", required: false, default: "'default'", description: 'Visual style variant' },
    { name: 'showLabels', type: 'boolean', required: false, default: 'true', description: 'Show tab labels' },
    { name: 'activeColor', type: 'string', required: false, default: "'text-primary'", description: 'Active tab color class' },
    { name: 'inactiveColor', type: 'string', required: false, default: "'text-muted-foreground'", description: 'Inactive tab color class' },
    { name: 'testID', type: 'string', required: false, description: 'Test ID for testing frameworks' },
  ],
  subcomponents: ['TabBarItem'],
  dependencies: ['react-native-safe-area-context', 'nativewind'],
  examples: [
    {
      title: 'Basic TabBar',
      code: `<TabBar
  activeTab={activeTab}
  onTabChange={setActiveTab}
  items={[
    { id: 'home', label: 'Home', icon: <HomeIcon /> },
    { id: 'search', label: 'Search', icon: <SearchIcon /> },
    { id: 'profile', label: 'Profile', icon: <UserIcon /> },
  ]}
/>`,
    },
    {
      title: 'TabBar with Badge',
      code: `<TabBar
  activeTab="inbox"
  onTabChange={handleTab}
  items={[
    { id: 'inbox', label: 'Inbox', icon: '📥', badge: 5 },
    { id: 'sent', label: 'Sent', icon: '📤' },
    { id: 'trash', label: 'Trash', icon: '🗑️' },
  ]}
/>`,
    },
    {
      title: 'Elevated Variant',
      code: `<TabBar
  variant="elevated"
  activeTab="home"
  onTabChange={setTab}
  activeColor="text-orange-500"
  items={[
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'explore', label: 'Explore', icon: '🔍' },
  ]}
/>`,
    },
  ],
}

export default TabBar
