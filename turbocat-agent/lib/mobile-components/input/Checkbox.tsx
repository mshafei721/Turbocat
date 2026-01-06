/**
 * Checkbox Component - Binary Selection Control
 * Phase 4: Mobile Development - Task 5.4
 *
 * A checkbox component for binary selections with support for labels,
 * indeterminate state, and custom styling.
 *
 * @example
 * ```tsx
 * import { Checkbox } from '@/components/mobile/input/Checkbox';
 *
 * export default function SettingsScreen() {
 *   const [notifications, setNotifications] = useState(false);
 *
 *   return (
 *     <View className="p-4">
 *       <Checkbox
 *         checked={notifications}
 *         onCheckedChange={setNotifications}
 *         label="Enable notifications"
 *       />
 *     </View>
 *   );
 * }
 * ```
 */

import { cn } from '../utils'

/**
 * Checkbox size
 */
export type CheckboxSize = 'sm' | 'md' | 'lg'

/**
 * Checkbox component props
 */
export interface CheckboxProps {
  /** Whether checkbox is checked */
  checked?: boolean
  /** Indeterminate state (partial selection) */
  indeterminate?: boolean
  /** Change handler */
  onCheckedChange?: (checked: boolean) => void
  /** Label text */
  label?: string
  /** Description text below label */
  description?: string
  /** Additional NativeWind classes */
  className?: string
  /** Checkbox size (default: 'md') */
  size?: CheckboxSize
  /** Whether checkbox is disabled */
  disabled?: boolean
  /** Error state */
  error?: boolean
  /** Test ID for testing */
  testID?: string
  /** Accessibility label */
  accessibilityLabel?: string
}

/**
 * Size class mapping
 */
const sizeClasses: Record<CheckboxSize, { box: string; label: string; description: string; check: string }> = {
  sm: {
    box: 'w-4 h-4 rounded',
    label: 'text-sm',
    description: 'text-xs',
    check: 'text-xs',
  },
  md: {
    box: 'w-5 h-5 rounded-md',
    label: 'text-base',
    description: 'text-sm',
    check: 'text-sm',
  },
  lg: {
    box: 'w-6 h-6 rounded-md',
    label: 'text-lg',
    description: 'text-base',
    check: 'text-base',
  },
}

/**
 * Checkbox Component Template
 *
 * Full React Native implementation with NativeWind styling:
 */
export const CheckboxTemplate = `import { View, Text, Pressable } from 'react-native';
import { cn } from '@/lib/utils';

type CheckboxSize = 'sm' | 'md' | 'lg';

interface CheckboxProps {
  checked?: boolean;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  className?: string;
  size?: CheckboxSize;
  disabled?: boolean;
  error?: boolean;
  testID?: string;
  accessibilityLabel?: string;
}

const sizeClasses = {
  sm: { box: 'w-4 h-4 rounded', label: 'text-sm', description: 'text-xs', check: 'text-xs' },
  md: { box: 'w-5 h-5 rounded-md', label: 'text-base', description: 'text-sm', check: 'text-sm' },
  lg: { box: 'w-6 h-6 rounded-md', label: 'text-lg', description: 'text-base', check: 'text-base' },
};

export function Checkbox({
  checked = false,
  indeterminate = false,
  onCheckedChange,
  label,
  description,
  className,
  size = 'md',
  disabled = false,
  error = false,
  testID,
  accessibilityLabel,
}: CheckboxProps) {
  const sizeStyle = sizeClasses[size];

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
        'flex-row items-start',
        disabled && 'opacity-50',
        className,
      )}
      testID={testID}
      accessible
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ checked, disabled }}
    >
      {/* Checkbox Box */}
      <View className={cn(
        'items-center justify-center border-2',
        sizeStyle.box,
        checked || indeterminate
          ? 'bg-primary border-primary'
          : 'bg-background border-input',
        error && 'border-destructive',
        disabled && 'bg-muted',
      )}>
        {checked && (
          <Text className={cn('text-primary-foreground font-bold', sizeStyle.check)}>
            ✓
          </Text>
        )}
        {indeterminate && !checked && (
          <View className="w-2/3 h-0.5 bg-primary-foreground" />
        )}
      </View>

      {/* Label & Description */}
      {(label || description) && (
        <View className="ml-3 flex-1">
          {label && (
            <Text className={cn(
              sizeStyle.label,
              'text-foreground',
              disabled && 'text-muted-foreground',
            )}>
              {label}
            </Text>
          )}
          {description && (
            <Text className={cn(sizeStyle.description, 'text-muted-foreground mt-0.5')}>
              {description}
            </Text>
          )}
        </View>
      )}
    </Pressable>
  );
}
`

/**
 * Checkbox component for React Native Web preview
 */
export function Checkbox({
  checked = false,
  indeterminate = false,
  onCheckedChange,
  label,
  description,
  className,
  size = 'md',
  disabled = false,
  error = false,
  testID,
  accessibilityLabel,
}: CheckboxProps) {
  const sizeStyle = sizeClasses[size]

  const handleClick = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked)
    }
  }

  return (
    <label
      className={cn('flex flex-row items-start cursor-pointer', disabled && 'opacity-50 cursor-not-allowed', className)}
      data-testid={testID}
    >
      {/* Hidden native checkbox for accessibility */}
      <input
        type="checkbox"
        checked={checked}
        onChange={() => !disabled && onCheckedChange?.(!checked)}
        disabled={disabled}
        className="sr-only"
        aria-label={accessibilityLabel || label}
      />

      {/* Custom Checkbox Box */}
      <span
        className={cn(
          'flex items-center justify-center border-2 transition-colors',
          sizeStyle.box,
          checked || indeterminate ? 'bg-primary border-primary' : 'bg-background border-input',
          error && 'border-destructive',
          disabled && 'bg-muted',
          !disabled && 'hover:border-primary/50',
        )}
        onClick={handleClick}
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        aria-disabled={disabled}
      >
        {checked && <span className={cn('text-primary-foreground font-bold leading-none', sizeStyle.check)}>&#10003;</span>}
        {indeterminate && !checked && <span className="w-2/3 h-0.5 bg-primary-foreground" />}
      </span>

      {/* Label & Description */}
      {(label || description) && (
        <span className="ml-3 flex-1">
          {label && (
            <span className={cn(sizeStyle.label, 'text-foreground block', disabled && 'text-muted-foreground')}>
              {label}
            </span>
          )}
          {description && <span className={cn(sizeStyle.description, 'text-muted-foreground block mt-0.5')}>{description}</span>}
        </span>
      )}
    </label>
  )
}

/**
 * Component metadata for Component Gallery
 */
export const CheckboxMetadata = {
  name: 'Checkbox',
  description: 'Binary selection control with label, description, and indeterminate state support.',
  category: 'Input',
  platform: 'mobile' as const,
  props: [
    { name: 'checked', type: 'boolean', required: false, default: 'false', description: 'Whether checkbox is checked' },
    { name: 'indeterminate', type: 'boolean', required: false, default: 'false', description: 'Partial selection state' },
    { name: 'onCheckedChange', type: '(checked: boolean) => void', required: false, description: 'Change handler' },
    { name: 'label', type: 'string', required: false, description: 'Label text' },
    { name: 'description', type: 'string', required: false, description: 'Description below label' },
    { name: 'className', type: 'string', required: false, description: 'Additional NativeWind classes' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, default: "'md'", description: 'Checkbox size' },
    { name: 'disabled', type: 'boolean', required: false, default: 'false', description: 'Disable checkbox' },
    { name: 'error', type: 'boolean', required: false, default: 'false', description: 'Error state' },
    { name: 'accessibilityLabel', type: 'string', required: false, description: 'Screen reader label' },
    { name: 'testID', type: 'string', required: false, description: 'Test ID for testing frameworks' },
  ],
  dependencies: ['nativewind'],
  examples: [
    {
      title: 'Basic Checkbox',
      code: `<Checkbox
  checked={checked}
  onCheckedChange={setChecked}
  label="Accept terms and conditions"
/>`,
    },
    {
      title: 'With Description',
      code: `<Checkbox
  checked={marketing}
  onCheckedChange={setMarketing}
  label="Marketing emails"
  description="Receive updates about new features and promotions"
/>`,
    },
    {
      title: 'Different Sizes',
      code: `<Checkbox size="sm" label="Small" checked />
<Checkbox size="md" label="Medium" checked />
<Checkbox size="lg" label="Large" checked />`,
    },
    {
      title: 'Indeterminate State',
      code: `<Checkbox
  indeterminate={someSelected && !allSelected}
  checked={allSelected}
  onCheckedChange={toggleAll}
  label="Select all"
/>`,
    },
    {
      title: 'Disabled State',
      code: `<Checkbox
  checked={true}
  disabled
  label="This option is required"
/>`,
    },
  ],
}

export default Checkbox
