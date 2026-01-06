/**
 * Switch/Toggle Component - Binary Toggle Control
 * Phase 4: Mobile Development - Task 5.4
 *
 * A toggle switch component for binary on/off states with iOS and Android
 * styling support.
 *
 * @example
 * ```tsx
 * import { Switch } from '@/components/mobile/input/Switch';
 *
 * export default function SettingsScreen() {
 *   const [darkMode, setDarkMode] = useState(false);
 *
 *   return (
 *     <View className="p-4">
 *       <Switch
 *         checked={darkMode}
 *         onCheckedChange={setDarkMode}
 *         label="Dark Mode"
 *         description="Enable dark theme throughout the app"
 *       />
 *     </View>
 *   );
 * }
 * ```
 */

import { cn } from '../utils'

/**
 * Switch size
 */
export type SwitchSize = 'sm' | 'md' | 'lg'

/**
 * Switch component props
 */
export interface SwitchProps {
  /** Whether switch is on */
  checked?: boolean
  /** Change handler */
  onCheckedChange?: (checked: boolean) => void
  /** Label text */
  label?: string
  /** Description text below label */
  description?: string
  /** Additional NativeWind classes */
  className?: string
  /** Switch size (default: 'md') */
  size?: SwitchSize
  /** Whether switch is disabled */
  disabled?: boolean
  /** Color when on (default: primary) */
  activeColor?: string
  /** Color when off (default: muted) */
  inactiveColor?: string
  /** Test ID for testing */
  testID?: string
  /** Accessibility label */
  accessibilityLabel?: string
}

/**
 * Size class mapping
 */
const sizeClasses: Record<SwitchSize, { track: string; thumb: string; thumbPosition: string; label: string; description: string }> = {
  sm: {
    track: 'w-8 h-4',
    thumb: 'w-3 h-3',
    thumbPosition: 'left-0.5 group-data-[state=checked]:left-[18px]',
    label: 'text-sm',
    description: 'text-xs',
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'w-5 h-5',
    thumbPosition: 'left-0.5 group-data-[state=checked]:left-[22px]',
    label: 'text-base',
    description: 'text-sm',
  },
  lg: {
    track: 'w-14 h-8',
    thumb: 'w-7 h-7',
    thumbPosition: 'left-0.5 group-data-[state=checked]:left-[26px]',
    label: 'text-lg',
    description: 'text-base',
  },
}

/**
 * Switch Component Template
 *
 * Full React Native implementation with NativeWind styling:
 */
export const SwitchTemplate = `import { View, Text, Pressable, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

type SwitchSize = 'sm' | 'md' | 'lg';

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  className?: string;
  size?: SwitchSize;
  disabled?: boolean;
  activeColor?: string;
  inactiveColor?: string;
  testID?: string;
  accessibilityLabel?: string;
}

const sizeConfigs = {
  sm: { trackWidth: 32, trackHeight: 16, thumbSize: 12, thumbTravel: 14 },
  md: { trackWidth: 44, trackHeight: 24, thumbSize: 20, thumbTravel: 18 },
  lg: { trackWidth: 56, trackHeight: 32, thumbSize: 28, thumbTravel: 22 },
};

export function Switch({
  checked = false,
  onCheckedChange,
  label,
  description,
  className,
  size = 'md',
  disabled = false,
  activeColor,
  inactiveColor,
  testID,
  accessibilityLabel,
}: SwitchProps) {
  const sizeConfig = sizeConfigs[size];
  const thumbPosition = useRef(new Animated.Value(checked ? sizeConfig.thumbTravel : 2)).current;

  // Animate thumb position when checked changes
  useEffect(() => {
    Animated.spring(thumbPosition, {
      toValue: checked ? sizeConfig.thumbTravel : 2,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [checked, sizeConfig.thumbTravel]);

  const handlePress = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      className={cn(
        'flex-row items-center justify-between',
        disabled && 'opacity-50',
        className,
      )}
      testID={testID}
      accessible
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ checked, disabled }}
    >
      {/* Label & Description */}
      {(label || description) && (
        <View className="flex-1 mr-3">
          {label && (
            <Text className={cn(
              sizeClasses[size].label,
              'text-foreground',
              disabled && 'text-muted-foreground',
            )}>
              {label}
            </Text>
          )}
          {description && (
            <Text className={cn(sizeClasses[size].description, 'text-muted-foreground mt-0.5')}>
              {description}
            </Text>
          )}
        </View>
      )}

      {/* Switch Track */}
      <View
        className={cn(
          'rounded-full items-center',
          checked
            ? (activeColor || 'bg-primary')
            : (inactiveColor || 'bg-muted'),
        )}
        style={{
          width: sizeConfig.trackWidth,
          height: sizeConfig.trackHeight,
        }}
      >
        {/* Switch Thumb */}
        <Animated.View
          className="absolute bg-white rounded-full shadow-sm"
          style={{
            width: sizeConfig.thumbSize,
            height: sizeConfig.thumbSize,
            top: (sizeConfig.trackHeight - sizeConfig.thumbSize) / 2,
            transform: [{ translateX: thumbPosition }],
          }}
        />
      </View>
    </Pressable>
  );
}
`

/**
 * Switch component for React Native Web preview
 */
export function Switch({
  checked = false,
  onCheckedChange,
  label,
  description,
  className,
  size = 'md',
  disabled = false,
  activeColor,
  inactiveColor,
  testID,
  accessibilityLabel,
}: SwitchProps) {
  const sizeStyle = sizeClasses[size]

  const handleClick = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked)
    }
  }

  return (
    <label
      className={cn('flex flex-row items-center justify-between cursor-pointer', disabled && 'opacity-50 cursor-not-allowed', className)}
      data-testid={testID}
    >
      {/* Hidden native checkbox for accessibility */}
      <input
        type="checkbox"
        checked={checked}
        onChange={() => !disabled && onCheckedChange?.(!checked)}
        disabled={disabled}
        className="sr-only"
        role="switch"
        aria-label={accessibilityLabel || label}
      />

      {/* Label & Description */}
      {(label || description) && (
        <span className="flex-1 mr-3">
          {label && (
            <span className={cn(sizeStyle.label, 'text-foreground block', disabled && 'text-muted-foreground')}>{label}</span>
          )}
          {description && <span className={cn(sizeStyle.description, 'text-muted-foreground block mt-0.5')}>{description}</span>}
        </span>
      )}

      {/* Switch Track */}
      <span
        className={cn(
          'relative rounded-full transition-colors group',
          sizeStyle.track,
          checked ? (activeColor || 'bg-primary') : (inactiveColor || 'bg-muted'),
          !disabled && 'hover:opacity-90',
        )}
        data-state={checked ? 'checked' : 'unchecked'}
        onClick={handleClick}
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
      >
        {/* Switch Thumb */}
        <span
          className={cn(
            'absolute top-0.5 bg-white rounded-full shadow-sm transition-all duration-200',
            sizeStyle.thumb,
            checked ? 'translate-x-full' : 'translate-x-0.5',
          )}
          style={{
            transform: checked
              ? `translateX(calc(100% - 2px))`
              : 'translateX(2px)',
          }}
        />
      </span>
    </label>
  )
}

/**
 * Component metadata for Component Gallery
 */
export const SwitchMetadata = {
  name: 'Switch',
  description: 'Binary toggle switch with iOS and Android styling, supporting labels and descriptions.',
  category: 'Input',
  platform: 'mobile' as const,
  props: [
    { name: 'checked', type: 'boolean', required: false, default: 'false', description: 'Whether switch is on' },
    { name: 'onCheckedChange', type: '(checked: boolean) => void', required: false, description: 'Change handler' },
    { name: 'label', type: 'string', required: false, description: 'Label text' },
    { name: 'description', type: 'string', required: false, description: 'Description below label' },
    { name: 'className', type: 'string', required: false, description: 'Additional NativeWind classes' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, default: "'md'", description: 'Switch size' },
    { name: 'disabled', type: 'boolean', required: false, default: 'false', description: 'Disable switch' },
    { name: 'activeColor', type: 'string', required: false, description: 'Background color when on' },
    { name: 'inactiveColor', type: 'string', required: false, description: 'Background color when off' },
    { name: 'accessibilityLabel', type: 'string', required: false, description: 'Screen reader label' },
    { name: 'testID', type: 'string', required: false, description: 'Test ID for testing frameworks' },
  ],
  dependencies: ['nativewind'],
  examples: [
    {
      title: 'Basic Switch',
      code: `<Switch
  checked={enabled}
  onCheckedChange={setEnabled}
/>`,
    },
    {
      title: 'With Label',
      code: `<Switch
  checked={notifications}
  onCheckedChange={setNotifications}
  label="Push Notifications"
/>`,
    },
    {
      title: 'With Label and Description',
      code: `<Switch
  checked={autoUpdate}
  onCheckedChange={setAutoUpdate}
  label="Auto Update"
  description="Automatically download and install updates"
/>`,
    },
    {
      title: 'Different Sizes',
      code: `<Switch size="sm" checked />
<Switch size="md" checked />
<Switch size="lg" checked />`,
    },
    {
      title: 'Custom Colors',
      code: `<Switch
  checked={true}
  activeColor="bg-green-500"
  inactiveColor="bg-red-200"
  label="Custom colors"
/>`,
    },
    {
      title: 'Disabled State',
      code: `<Switch
  checked={true}
  disabled
  label="Cannot be changed"
/>`,
    },
  ],
}

export default Switch
