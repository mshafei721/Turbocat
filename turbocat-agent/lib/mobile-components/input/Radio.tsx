/**
 * Radio Component - Single Selection Control
 * Phase 4: Mobile Development - Task 5.4
 *
 * Radio button components for single selection from multiple options.
 * Use RadioGroup for managing a set of related radio buttons.
 *
 * @example
 * ```tsx
 * import { RadioGroup, RadioItem } from '@/components/mobile/input/Radio';
 *
 * export default function SortOptions() {
 *   const [sortBy, setSortBy] = useState('newest');
 *
 *   return (
 *     <RadioGroup value={sortBy} onValueChange={setSortBy}>
 *       <RadioItem value="newest" label="Newest first" />
 *       <RadioItem value="oldest" label="Oldest first" />
 *       <RadioItem value="popular" label="Most popular" />
 *     </RadioGroup>
 *   );
 * }
 * ```
 */

import { createContext, useContext } from 'react'
import { cn } from '../utils'

/**
 * Radio size
 */
export type RadioSize = 'sm' | 'md' | 'lg'

/**
 * Radio context for group management
 */
interface RadioContextValue {
  value?: string
  onValueChange?: (value: string) => void
  size?: RadioSize
  disabled?: boolean
  name?: string
}

const RadioContext = createContext<RadioContextValue>({})

/**
 * RadioGroup props
 */
export interface RadioGroupProps {
  /** Current selected value */
  value?: string
  /** Change handler */
  onValueChange?: (value: string) => void
  /** Radio items */
  children: React.ReactNode
  /** Additional NativeWind classes */
  className?: string
  /** Radio size (default: 'md') */
  size?: RadioSize
  /** Whether all radios are disabled */
  disabled?: boolean
  /** Form name for native radio behavior */
  name?: string
  /** Orientation (default: 'vertical') */
  orientation?: 'horizontal' | 'vertical'
  /** Test ID for testing */
  testID?: string
  /** Accessibility label */
  accessibilityLabel?: string
}

/**
 * RadioItem props
 */
export interface RadioItemProps {
  /** Radio value */
  value: string
  /** Label text */
  label?: string
  /** Description text */
  description?: string
  /** Additional NativeWind classes */
  className?: string
  /** Override group size */
  size?: RadioSize
  /** Whether this radio is disabled */
  disabled?: boolean
  /** Test ID for testing */
  testID?: string
}

/**
 * Size class mapping
 */
const sizeClasses: Record<RadioSize, { radio: string; dot: string; label: string; description: string }> = {
  sm: {
    radio: 'w-4 h-4',
    dot: 'w-2 h-2',
    label: 'text-sm',
    description: 'text-xs',
  },
  md: {
    radio: 'w-5 h-5',
    dot: 'w-2.5 h-2.5',
    label: 'text-base',
    description: 'text-sm',
  },
  lg: {
    radio: 'w-6 h-6',
    dot: 'w-3 h-3',
    label: 'text-lg',
    description: 'text-base',
  },
}

/**
 * Radio Component Template
 *
 * Full React Native implementation with NativeWind styling:
 */
export const RadioTemplate = `import { View, Text, Pressable } from 'react-native';
import { createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

// Context setup...

export function RadioGroup({
  value,
  onValueChange,
  children,
  className,
  size = 'md',
  disabled = false,
  name,
  orientation = 'vertical',
  testID,
  accessibilityLabel,
}: RadioGroupProps) {
  return (
    <RadioContext.Provider value={{ value, onValueChange, size, disabled, name }}>
      <View
        className={cn(
          orientation === 'horizontal' ? 'flex-row flex-wrap gap-4' : 'gap-3',
          className,
        )}
        testID={testID}
        accessible
        accessibilityRole="radiogroup"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </View>
    </RadioContext.Provider>
  );
}

export function RadioItem({
  value,
  label,
  description,
  className,
  size: itemSize,
  disabled: itemDisabled,
  testID,
}: RadioItemProps) {
  const {
    value: groupValue,
    onValueChange,
    size: groupSize,
    disabled: groupDisabled,
  } = useContext(RadioContext);

  const size = itemSize || groupSize || 'md';
  const disabled = itemDisabled || groupDisabled;
  const isSelected = groupValue === value;
  const sizeStyle = sizeClasses[size];

  const handlePress = () => {
    if (!disabled && onValueChange) {
      onValueChange(value);
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
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: isSelected, disabled }}
    >
      {/* Radio Circle */}
      <View className={cn(
        'rounded-full border-2 items-center justify-center',
        sizeStyle.radio,
        isSelected ? 'border-primary bg-primary' : 'border-input bg-background',
      )}>
        {isSelected && (
          <View className={cn(
            'rounded-full bg-primary-foreground',
            sizeStyle.dot,
          )} />
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
 * RadioGroup component for React Native Web preview
 */
export function RadioGroup({
  value,
  onValueChange,
  children,
  className,
  size = 'md',
  disabled = false,
  name,
  orientation = 'vertical',
  testID,
  accessibilityLabel,
}: RadioGroupProps) {
  return (
    <RadioContext.Provider value={{ value, onValueChange, size, disabled, name }}>
      <div
        className={cn(orientation === 'horizontal' ? 'flex flex-row flex-wrap gap-4' : 'flex flex-col gap-3', className)}
        data-testid={testID}
        role="radiogroup"
        aria-label={accessibilityLabel}
      >
        {children}
      </div>
    </RadioContext.Provider>
  )
}

/**
 * RadioItem component for React Native Web preview
 */
export function RadioItem({ value, label, description, className, size: itemSize, disabled: itemDisabled, testID }: RadioItemProps) {
  const { value: groupValue, onValueChange, size: groupSize, disabled: groupDisabled, name } = useContext(RadioContext)

  const size = itemSize || groupSize || 'md'
  const disabled = itemDisabled || groupDisabled
  const isSelected = groupValue === value
  const sizeStyle = sizeClasses[size]

  const handleClick = () => {
    if (!disabled && onValueChange) {
      onValueChange(value)
    }
  }

  return (
    <label
      className={cn('flex flex-row items-start cursor-pointer', disabled && 'opacity-50 cursor-not-allowed', className)}
      data-testid={testID}
    >
      {/* Hidden native radio for accessibility */}
      <input
        type="radio"
        name={name}
        value={value}
        checked={isSelected}
        onChange={() => !disabled && onValueChange?.(value)}
        disabled={disabled}
        className="sr-only"
      />

      {/* Custom Radio Circle */}
      <span
        className={cn(
          'rounded-full border-2 flex items-center justify-center transition-colors',
          sizeStyle.radio,
          isSelected ? 'border-primary bg-primary' : 'border-input bg-background',
          !disabled && 'hover:border-primary/50',
        )}
        onClick={handleClick}
        role="radio"
        aria-checked={isSelected}
        aria-disabled={disabled}
      >
        {isSelected && <span className={cn('rounded-full bg-primary-foreground', sizeStyle.dot)} />}
      </span>

      {/* Label & Description */}
      {(label || description) && (
        <span className="ml-3 flex-1">
          {label && (
            <span className={cn(sizeStyle.label, 'text-foreground block', disabled && 'text-muted-foreground')}>{label}</span>
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
export const RadioMetadata = {
  name: 'Radio',
  description: 'Single selection control using RadioGroup and RadioItem for managing options.',
  category: 'Input',
  platform: 'mobile' as const,
  props: [
    { name: 'value', type: 'string', required: false, description: 'Current selected value (RadioGroup)' },
    { name: 'onValueChange', type: '(value: string) => void', required: false, description: 'Change handler (RadioGroup)' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, default: "'md'", description: 'Radio size' },
    { name: 'disabled', type: 'boolean', required: false, default: 'false', description: 'Disable radio(s)' },
    { name: 'orientation', type: "'horizontal' | 'vertical'", required: false, default: "'vertical'", description: 'Layout orientation (RadioGroup)' },
    { name: 'label', type: 'string', required: false, description: 'Label text (RadioItem)' },
    { name: 'description', type: 'string', required: false, description: 'Description below label (RadioItem)' },
    { name: 'testID', type: 'string', required: false, description: 'Test ID for testing frameworks' },
  ],
  subcomponents: ['RadioGroup', 'RadioItem'],
  dependencies: ['nativewind'],
  examples: [
    {
      title: 'Basic RadioGroup',
      code: `<RadioGroup value={selected} onValueChange={setSelected}>
  <RadioItem value="option1" label="Option 1" />
  <RadioItem value="option2" label="Option 2" />
  <RadioItem value="option3" label="Option 3" />
</RadioGroup>`,
    },
    {
      title: 'With Descriptions',
      code: `<RadioGroup value={plan} onValueChange={setPlan}>
  <RadioItem
    value="free"
    label="Free Plan"
    description="Basic features, limited usage"
  />
  <RadioItem
    value="pro"
    label="Pro Plan"
    description="All features, unlimited usage"
  />
</RadioGroup>`,
    },
    {
      title: 'Horizontal Layout',
      code: `<RadioGroup
  value={size}
  onValueChange={setSize}
  orientation="horizontal"
>
  <RadioItem value="s" label="S" />
  <RadioItem value="m" label="M" />
  <RadioItem value="l" label="L" />
  <RadioItem value="xl" label="XL" />
</RadioGroup>`,
    },
    {
      title: 'Different Sizes',
      code: `<RadioGroup value="selected" size="lg">
  <RadioItem value="large" label="Large radio buttons" />
</RadioGroup>`,
    },
  ],
}

export default { RadioGroup, RadioItem }
