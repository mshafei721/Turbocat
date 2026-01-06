/**
 * Avatar Component - User/Entity Representation
 * Phase 4: Mobile Development - Task 5.5
 *
 * Displays user avatars with support for images, initials fallback,
 * and various sizes and shapes.
 *
 * @example
 * ```tsx
 * import { Avatar, AvatarGroup } from '@/components/mobile/data-display/Avatar';
 *
 * export default function UserProfile() {
 *   return (
 *     <View className="flex-row items-center">
 *       <Avatar
 *         src={user.avatarUrl}
 *         fallback={user.initials}
 *         size="lg"
 *       />
 *       <Text className="ml-3">{user.name}</Text>
 *     </View>
 *   );
 * }
 * ```
 */

import { cn } from '../utils'

/**
 * Avatar size
 */
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

/**
 * Avatar shape
 */
export type AvatarShape = 'circle' | 'square' | 'rounded'

/**
 * Avatar component props
 */
export interface AvatarProps {
  /** Image source URL */
  src?: string
  /** Alt text for image */
  alt?: string
  /** Fallback text (usually initials) */
  fallback?: string
  /** Additional NativeWind classes */
  className?: string
  /** Avatar size (default: 'md') */
  size?: AvatarSize
  /** Avatar shape (default: 'circle') */
  shape?: AvatarShape
  /** Background color for fallback */
  backgroundColor?: string
  /** Text color for fallback */
  textColor?: string
  /** Online status indicator */
  status?: 'online' | 'offline' | 'busy' | 'away'
  /** Border around avatar */
  bordered?: boolean
  /** Test ID for testing */
  testID?: string
}

/**
 * AvatarGroup props
 */
export interface AvatarGroupProps {
  /** Array of avatar props */
  avatars: AvatarProps[]
  /** Maximum avatars to show */
  max?: number
  /** Size for all avatars */
  size?: AvatarSize
  /** Additional NativeWind classes */
  className?: string
}

/**
 * Size class mapping
 */
const sizeClasses: Record<AvatarSize, { container: string; text: string; status: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]', status: 'w-1.5 h-1.5' },
  sm: { container: 'w-8 h-8', text: 'text-xs', status: 'w-2 h-2' },
  md: { container: 'w-10 h-10', text: 'text-sm', status: 'w-2.5 h-2.5' },
  lg: { container: 'w-12 h-12', text: 'text-base', status: 'w-3 h-3' },
  xl: { container: 'w-16 h-16', text: 'text-lg', status: 'w-4 h-4' },
  '2xl': { container: 'w-20 h-20', text: 'text-xl', status: 'w-5 h-5' },
}

/**
 * Shape class mapping
 */
const shapeClasses: Record<AvatarShape, string> = {
  circle: 'rounded-full',
  square: 'rounded-none',
  rounded: 'rounded-lg',
}

/**
 * Status color mapping
 */
const statusColors: Record<string, string> = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  busy: 'bg-red-500',
  away: 'bg-yellow-500',
}

/**
 * Avatar Component Template
 *
 * Full React Native implementation with NativeWind styling:
 */
export const AvatarTemplate = `import { View, Text, Image } from 'react-native';
import { useState } from 'react';
import { cn } from '@/lib/utils';

// ... (types remain the same)

export function Avatar({
  src,
  alt,
  fallback,
  className,
  size = 'md',
  shape = 'circle',
  backgroundColor = 'bg-muted',
  textColor = 'text-muted-foreground',
  status,
  bordered = false,
  testID,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const sizeStyle = sizeClasses[size];
  const showFallback = !src || imageError;

  // Generate initials from fallback if not provided
  const displayFallback = fallback || '?';

  return (
    <View
      className={cn(
        'relative items-center justify-center overflow-hidden',
        sizeStyle.container,
        shapeClasses[shape],
        bordered && 'border-2 border-background',
        className,
      )}
      testID={testID}
      accessible
      accessibilityRole="image"
      accessibilityLabel={alt || fallback || 'Avatar'}
    >
      {/* Image */}
      {!showFallback && (
        <Image
          source={{ uri: src }}
          className="w-full h-full"
          onError={() => setImageError(true)}
          resizeMode="cover"
        />
      )}

      {/* Fallback */}
      {showFallback && (
        <View className={cn('w-full h-full items-center justify-center', backgroundColor)}>
          <Text className={cn(sizeStyle.text, 'font-semibold', textColor)}>
            {displayFallback.slice(0, 2).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Status Indicator */}
      {status && (
        <View
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-background',
            sizeStyle.status,
            statusColors[status],
          )}
        />
      )}
    </View>
  );
}

// AvatarGroup component
export function AvatarGroup({ avatars, max = 4, size = 'md', className }: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <View className={cn('flex-row', className)}>
      {visibleAvatars.map((avatar, index) => (
        <View
          key={index}
          className={cn(index > 0 && '-ml-2')}
          style={{ zIndex: visibleAvatars.length - index }}
        >
          <Avatar {...avatar} size={size} bordered />
        </View>
      ))}
      {remainingCount > 0 && (
        <View className="-ml-2" style={{ zIndex: 0 }}>
          <Avatar
            fallback={'+' + remainingCount}
            size={size}
            backgroundColor="bg-muted"
            textColor="text-muted-foreground"
            bordered
          />
        </View>
      )}
    </View>
  );
}
`

/**
 * Avatar component for React Native Web preview
 */
export function Avatar({
  src,
  alt,
  fallback,
  className,
  size = 'md',
  shape = 'circle',
  backgroundColor = 'bg-muted',
  textColor = 'text-muted-foreground',
  status,
  bordered = false,
  testID,
}: AvatarProps) {
  const sizeStyle = sizeClasses[size]

  // Generate initials from fallback if not provided
  const displayFallback = fallback || '?'

  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden',
        sizeStyle.container,
        shapeClasses[shape],
        bordered && 'border-2 border-background ring-2 ring-background',
        className,
      )}
      data-testid={testID}
      role="img"
      aria-label={alt || fallback || 'Avatar'}
    >
      {/* Image */}
      {src && (
        <img
          src={src}
          alt={alt || ''}
          className="w-full h-full object-cover"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      )}

      {/* Fallback (shown when no src or image fails to load) */}
      {!src && (
        <div className={cn('w-full h-full flex items-center justify-center', backgroundColor)}>
          <span className={cn(sizeStyle.text, 'font-semibold', textColor)}>{displayFallback.slice(0, 2).toUpperCase()}</span>
        </div>
      )}

      {/* Status Indicator */}
      {status && (
        <span className={cn('absolute bottom-0 right-0 rounded-full border-2 border-background', sizeStyle.status, statusColors[status])} />
      )}
    </div>
  )
}

/**
 * AvatarGroup component for React Native Web preview
 */
export function AvatarGroup({ avatars, max = 4, size = 'md', className }: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max)
  const remainingCount = avatars.length - max

  return (
    <div className={cn('flex flex-row', className)}>
      {visibleAvatars.map((avatar, index) => (
        <div key={index} className={cn(index > 0 && '-ml-2')} style={{ zIndex: visibleAvatars.length - index }}>
          <Avatar {...avatar} size={size} bordered />
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="-ml-2" style={{ zIndex: 0 }}>
          <Avatar fallback={`+${remainingCount}`} size={size} backgroundColor="bg-muted" textColor="text-muted-foreground" bordered />
        </div>
      )}
    </div>
  )
}

/**
 * Component metadata for Component Gallery
 */
export const AvatarMetadata = {
  name: 'Avatar',
  description: 'User avatar component with image support, initials fallback, and status indicators.',
  category: 'Data Display',
  platform: 'mobile' as const,
  props: [
    { name: 'src', type: 'string', required: false, description: 'Image source URL' },
    { name: 'alt', type: 'string', required: false, description: 'Alt text for image' },
    { name: 'fallback', type: 'string', required: false, description: 'Fallback text (initials)' },
    { name: 'className', type: 'string', required: false, description: 'Additional NativeWind classes' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'", required: false, default: "'md'", description: 'Avatar size' },
    { name: 'shape', type: "'circle' | 'square' | 'rounded'", required: false, default: "'circle'", description: 'Avatar shape' },
    { name: 'backgroundColor', type: 'string', required: false, default: "'bg-muted'", description: 'Fallback background color' },
    { name: 'textColor', type: 'string', required: false, default: "'text-muted-foreground'", description: 'Fallback text color' },
    { name: 'status', type: "'online' | 'offline' | 'busy' | 'away'", required: false, description: 'Status indicator' },
    { name: 'bordered', type: 'boolean', required: false, default: 'false', description: 'Show border' },
    { name: 'testID', type: 'string', required: false, description: 'Test ID for testing frameworks' },
  ],
  subcomponents: ['AvatarGroup'],
  dependencies: ['nativewind'],
  examples: [
    {
      title: 'Basic Avatar',
      code: `<Avatar src="https://example.com/user.jpg" alt="John Doe" />`,
    },
    {
      title: 'Avatar with Fallback',
      code: `<Avatar fallback="JD" />`,
    },
    {
      title: 'All Sizes',
      code: `<View className="flex-row items-end gap-2">
  <Avatar size="xs" fallback="XS" />
  <Avatar size="sm" fallback="SM" />
  <Avatar size="md" fallback="MD" />
  <Avatar size="lg" fallback="LG" />
  <Avatar size="xl" fallback="XL" />
  <Avatar size="2xl" fallback="2X" />
</View>`,
    },
    {
      title: 'With Status',
      code: `<View className="flex-row gap-4">
  <Avatar fallback="ON" status="online" />
  <Avatar fallback="OF" status="offline" />
  <Avatar fallback="BY" status="busy" />
  <Avatar fallback="AW" status="away" />
</View>`,
    },
    {
      title: 'Avatar Group',
      code: `<AvatarGroup
  avatars={[
    { src: 'user1.jpg', fallback: 'U1' },
    { src: 'user2.jpg', fallback: 'U2' },
    { src: 'user3.jpg', fallback: 'U3' },
    { fallback: 'U4' },
    { fallback: 'U5' },
  ]}
  max={3}
/>`,
    },
  ],
}

export default Avatar
