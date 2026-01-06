/**
 * List/FlatList Component - Virtualized List Display
 * Phase 4: Mobile Development - Task 5.5
 *
 * A performant list component based on FlatList with support for headers,
 * footers, separators, and pull-to-refresh.
 *
 * @example
 * ```tsx
 * import { List, ListItem } from '@/components/mobile/data-display/List';
 *
 * export default function ContactsScreen() {
 *   return (
 *     <List
 *       data={contacts}
 *       renderItem={({ item }) => (
 *         <ListItem
 *           title={item.name}
 *           subtitle={item.email}
 *           leftElement={<Avatar src={item.avatar} />}
 *           onPress={() => openContact(item.id)}
 *         />
 *       )}
 *       keyExtractor={(item) => item.id}
 *       ItemSeparatorComponent={<Divider />}
 *     />
 *   );
 * }
 * ```
 */

import { cn } from '../utils'

/**
 * List component props
 */
export interface ListProps<T> {
  /** Array of data items */
  data: T[]
  /** Render function for each item */
  renderItem: (info: { item: T; index: number }) => React.ReactNode
  /** Key extractor function */
  keyExtractor: (item: T, index: number) => string
  /** Additional NativeWind classes */
  className?: string
  /** List header component */
  ListHeaderComponent?: React.ReactNode
  /** List footer component */
  ListFooterComponent?: React.ReactNode
  /** Empty list component */
  ListEmptyComponent?: React.ReactNode
  /** Separator between items */
  ItemSeparatorComponent?: React.ReactNode
  /** Horizontal list mode */
  horizontal?: boolean
  /** Number of columns (grid mode) */
  numColumns?: number
  /** Enable pull-to-refresh */
  refreshing?: boolean
  /** Refresh callback */
  onRefresh?: () => void
  /** End reached callback */
  onEndReached?: () => void
  /** End reached threshold (0-1) */
  onEndReachedThreshold?: number
  /** Show scroll indicator */
  showsScrollIndicator?: boolean
  /** Disable virtualization (for short lists) */
  disableVirtualization?: boolean
  /** Test ID for testing */
  testID?: string
}

/**
 * ListItem component props
 */
export interface ListItemProps {
  /** Primary title text */
  title: string
  /** Secondary subtitle text */
  subtitle?: string
  /** Description text */
  description?: string
  /** Left side element (icon, avatar) */
  leftElement?: React.ReactNode
  /** Right side element (chevron, badge) */
  rightElement?: React.ReactNode
  /** Press handler */
  onPress?: () => void
  /** Long press handler */
  onLongPress?: () => void
  /** Whether item is disabled */
  disabled?: boolean
  /** Whether item is selected */
  selected?: boolean
  /** Additional NativeWind classes */
  className?: string
  /** Test ID for testing */
  testID?: string
}

/**
 * List Component Template
 *
 * Full React Native implementation with NativeWind styling:
 */
export const ListTemplate = `import { FlatList, View, Text, Pressable, RefreshControl, ListRenderItem } from 'react-native';
import { cn } from '@/lib/utils';

interface ListProps<T> {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  ListHeaderComponent?: React.ReactNode;
  ListFooterComponent?: React.ReactNode;
  ListEmptyComponent?: React.ReactNode;
  ItemSeparatorComponent?: React.ComponentType<any> | null;
  horizontal?: boolean;
  numColumns?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  showsScrollIndicator?: boolean;
  testID?: string;
}

export function List<T>({
  data,
  renderItem,
  keyExtractor,
  className,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  ItemSeparatorComponent,
  horizontal = false,
  numColumns,
  refreshing,
  onRefresh,
  onEndReached,
  onEndReachedThreshold = 0.5,
  showsScrollIndicator = true,
  testID,
}: ListProps<T>) {
  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      className={cn('flex-1', className)}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent || <EmptyState />}
      ItemSeparatorComponent={ItemSeparatorComponent}
      horizontal={horizontal}
      numColumns={numColumns}
      showsVerticalScrollIndicator={showsScrollIndicator}
      showsHorizontalScrollIndicator={showsScrollIndicator}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing || false}
            onRefresh={onRefresh}
            tintColor="#f97316"
            colors={['#f97316']}
          />
        ) : undefined
      }
      testID={testID}
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      windowSize={21}
      initialNumToRender={10}
    />
  );
}

// Default empty state component
function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center p-8">
      <Text className="text-muted-foreground text-center">
        No items to display
      </Text>
    </View>
  );
}

// ListItem component
interface ListItemProps {
  title: string;
  subtitle?: string;
  description?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  selected?: boolean;
  className?: string;
  testID?: string;
}

export function ListItem({
  title,
  subtitle,
  description,
  leftElement,
  rightElement,
  onPress,
  onLongPress,
  disabled = false,
  selected = false,
  className,
  testID,
}: ListItemProps) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onLongPress={disabled ? undefined : onLongPress}
      disabled={disabled}
      className={cn(
        'flex-row items-center px-4 py-3 bg-background',
        selected && 'bg-muted',
        disabled && 'opacity-50',
        'active:bg-accent',
        className,
      )}
      testID={testID}
      accessible
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
    >
      {/* Left Element */}
      {leftElement && (
        <View className="mr-3">
          {leftElement}
        </View>
      )}

      {/* Content */}
      <View className="flex-1">
        <Text className="text-base font-medium text-foreground" numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text className="text-sm text-muted-foreground mt-0.5" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
        {description && (
          <Text className="text-sm text-muted-foreground mt-1" numberOfLines={2}>
            {description}
          </Text>
        )}
      </View>

      {/* Right Element */}
      {rightElement && (
        <View className="ml-3">
          {rightElement}
        </View>
      )}
    </Pressable>
  );
}
`

/**
 * List component for React Native Web preview
 */
export function List<T>({
  data,
  renderItem,
  keyExtractor,
  className,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  ItemSeparatorComponent,
  horizontal = false,
  numColumns,
  refreshing,
  onRefresh,
  onEndReached,
  showsScrollIndicator = true,
  testID,
}: ListProps<T>) {
  // Default empty state
  const EmptyState = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <p className="text-muted-foreground text-center">No items to display</p>
    </div>
  )

  if (data.length === 0 && ListEmptyComponent) {
    return (
      <div className={cn('flex-1', className)} data-testid={testID}>
        {ListHeaderComponent}
        {ListEmptyComponent}
        {ListFooterComponent}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={cn('flex-1', className)} data-testid={testID}>
        {ListHeaderComponent}
        <EmptyState />
        {ListFooterComponent}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex-1 overflow-auto',
        horizontal ? 'flex-row' : 'flex-col',
        numColumns && numColumns > 1 && 'grid',
        !showsScrollIndicator && 'scrollbar-hide',
        className,
      )}
      style={numColumns && numColumns > 1 ? { gridTemplateColumns: `repeat(${numColumns}, 1fr)` } : undefined}
      data-testid={testID}
      role="list"
    >
      {/* Refresh indicator */}
      {refreshing && (
        <div className="flex items-center justify-center py-4">
          <span className="animate-spin text-primary">Loading...</span>
        </div>
      )}

      {/* Header */}
      {ListHeaderComponent}

      {/* List items */}
      {data.map((item, index) => (
        <div key={keyExtractor(item, index)} role="listitem">
          {renderItem({ item, index })}
          {ItemSeparatorComponent && index < data.length - 1 && ItemSeparatorComponent}
        </div>
      ))}

      {/* Footer */}
      {ListFooterComponent}
    </div>
  )
}

/**
 * ListItem component for React Native Web preview
 */
export function ListItem({
  title,
  subtitle,
  description,
  leftElement,
  rightElement,
  onPress,
  onLongPress,
  disabled = false,
  selected = false,
  className,
  testID,
}: ListItemProps) {
  return (
    <button
      onClick={disabled ? undefined : onPress}
      onContextMenu={
        onLongPress
          ? (e) => {
              e.preventDefault()
              onLongPress()
            }
          : undefined
      }
      disabled={disabled}
      className={cn(
        'flex flex-row items-center w-full px-4 py-3 bg-background text-left transition-colors',
        selected && 'bg-muted',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'hover:bg-accent active:bg-accent',
        className,
      )}
      data-testid={testID}
      aria-disabled={disabled}
      aria-selected={selected}
    >
      {/* Left Element */}
      {leftElement && <span className="mr-3">{leftElement}</span>}

      {/* Content */}
      <span className="flex-1 min-w-0">
        <span className="text-base font-medium text-foreground block truncate">{title}</span>
        {subtitle && <span className="text-sm text-muted-foreground block mt-0.5 truncate">{subtitle}</span>}
        {description && <span className="text-sm text-muted-foreground block mt-1 line-clamp-2">{description}</span>}
      </span>

      {/* Right Element */}
      {rightElement && <span className="ml-3">{rightElement}</span>}
    </button>
  )
}

/**
 * ListSection header component
 */
export function ListSectionHeader({ title, className }: { title: string; className?: string }) {
  return (
    <div className={cn('px-4 py-2 bg-muted', className)}>
      <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
    </div>
  )
}

/**
 * Component metadata for Component Gallery
 */
export const ListMetadata = {
  name: 'List',
  description: 'Virtualized list component with headers, separators, pull-to-refresh, and infinite scroll.',
  category: 'Data Display',
  platform: 'mobile' as const,
  props: [
    { name: 'data', type: 'T[]', required: true, description: 'Array of data items' },
    { name: 'renderItem', type: '({ item, index }) => ReactNode', required: true, description: 'Render function for each item' },
    { name: 'keyExtractor', type: '(item, index) => string', required: true, description: 'Unique key extractor' },
    { name: 'ListHeaderComponent', type: 'React.ReactNode', required: false, description: 'Header component' },
    { name: 'ListFooterComponent', type: 'React.ReactNode', required: false, description: 'Footer component' },
    { name: 'ListEmptyComponent', type: 'React.ReactNode', required: false, description: 'Empty state component' },
    { name: 'ItemSeparatorComponent', type: 'React.ReactNode', required: false, description: 'Separator between items' },
    { name: 'horizontal', type: 'boolean', required: false, default: 'false', description: 'Horizontal scroll mode' },
    { name: 'numColumns', type: 'number', required: false, description: 'Grid columns count' },
    { name: 'refreshing', type: 'boolean', required: false, description: 'Pull-to-refresh loading state' },
    { name: 'onRefresh', type: '() => void', required: false, description: 'Pull-to-refresh callback' },
    { name: 'onEndReached', type: '() => void', required: false, description: 'Infinite scroll callback' },
    { name: 'testID', type: 'string', required: false, description: 'Test ID for testing frameworks' },
  ],
  subcomponents: ['ListItem', 'ListSectionHeader'],
  dependencies: ['nativewind'],
  examples: [
    {
      title: 'Basic List',
      code: `<List
  data={items}
  renderItem={({ item }) => (
    <ListItem title={item.name} onPress={() => select(item)} />
  )}
  keyExtractor={(item) => item.id}
/>`,
    },
    {
      title: 'List with Avatar and Subtitle',
      code: `<List
  data={contacts}
  renderItem={({ item }) => (
    <ListItem
      title={item.name}
      subtitle={item.email}
      leftElement={<Avatar src={item.avatar} size="sm" />}
      rightElement={<ChevronRight />}
      onPress={() => viewContact(item.id)}
    />
  )}
  keyExtractor={(item) => item.id}
/>`,
    },
    {
      title: 'Pull-to-Refresh',
      code: `<List
  data={posts}
  renderItem={renderPost}
  keyExtractor={(post) => post.id}
  refreshing={isRefreshing}
  onRefresh={handleRefresh}
/>`,
    },
    {
      title: 'Infinite Scroll',
      code: `<List
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
  ListFooterComponent={isLoading && <Spinner />}
/>`,
    },
  ],
}

export default List
