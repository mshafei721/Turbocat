/**
 * Chip/Tag Component - Compact Selection/Label
 * Phase 4: Mobile Development - Task 5.5
 *
 * A compact component for tags, filters, or small interactive elements.
 * Supports selection, removal, and icon prefixes.
 *
 * @example
 * ```tsx
 * import { Chip, ChipGroup } from '@/components/mobile/data-display/Chip';
 *
 * export default function FilterScreen() {
 *   const [selected, setSelected] = useState(['react']);
 *
 *   return (
 *     <ChipGroup
 *       selected={selected}
 *       onSelectedChange={setSelected}
 *       multiple
 *     >
 *       <Chip value="react">React Native</Chip>
 *       <Chip value="flutter">Flutter</Chip>
 *       <Chip value="swift">SwiftUI</Chip>
 *     </ChipGroup>
 *   );
 * }
 * ```
 */

import { createContext, useContext } from 'react'
import { cn } from '../utils'

/**
 * Chip variant
 */
export type ChipVariant = 'default' | 'outline' | 'filled'

/**
 * Chip size
 */
export type ChipSize = 'sm' | 'md' | 'lg'

/**
 * ChipGroup context
 */
interface ChipGroupContextValue {
  selected?: string[]
  onSelect?: (value: string) => void
  multiple?: boolean
  disabled?: boolean
  size?: ChipSize
}

const ChipGroupContext = createContext<ChipGroupContextValue>({})

/**
 * Chip component props
 */
export interface ChipProps {
  /** Chip content */
  children: React.ReactNode
  /** Chip value (for controlled selection) */
  value?: string
  /** Additional NativeWind classes */
  className?: string
  /** Visual variant (default: 'default') */
  variant?: ChipVariant
  /** Chip size (default: 'md') */
  size?: ChipSize
  /** Whether chip is selected */
  selected?: boolean
  /** Whether chip is disabled */
  disabled?: boolean
  /** Show removable close button */
  removable?: boolean
  /** Remove/dismiss handler */
  onRemove?: () => void
  /** Press handler */
  onPress?: () => void
  /** Icon on the left side */
  leftIcon?: React.ReactNode
  /** Test ID for testing */
  testID?: string
}

/**
 * ChipGroup props
 */
export interface ChipGroupProps {
  /** Chip children */
  children: React.ReactNode
  /** Selected values */
  selected?: string[]
  /** Selection change handler */
  onSelectedChange?: (selected: string[]) => void
  /** Allow multiple selection */
  multiple?: boolean
  /** Disable all chips */
  disabled?: boolean
  /** Size for all chips */
  size?: ChipSize
  /** Additional NativeWind classes */
  className?: string
  /** Test ID for testing */
  testID?: string
}

/**
 * Variant class mapping
 */
const variantClasses: Record<ChipVariant, { base: string; selected: string }> = {
  default: {
    base: 'bg-muted text-foreground',
    selected: 'bg-primary text-primary-foreground',
  },
  outline: {
    base: 'bg-transparent border border-border text-foreground',
    selected: 'bg-primary/10 border-primary text-primary',
  },
  filled: {
    base: 'bg-secondary text-secondary-foreground',
    selected: 'bg-primary text-primary-foreground',
  },
}

/**
 * Size class mapping
 */
const sizeClasses: Record<ChipSize, { chip: string; text: string; icon: string }> = {
  sm: {
    chip: 'h-6 px-2 rounded-full',
    text: 'text-xs',
    icon: 'w-3 h-3',
  },
  md: {
    chip: 'h-8 px-3 rounded-full',
    text: 'text-sm',
    icon: 'w-4 h-4',
  },
  lg: {
    chip: 'h-10 px-4 rounded-full',
    text: 'text-base',
    icon: 'w-5 h-5',
  },
}

/**
 * Chip Component Template
 *
 * Full React Native implementation with NativeWind styling:
 */
export const ChipTemplate = `import { View, Text, Pressable } from 'react-native';
import { createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

// Context and types...

export function Chip({
  children,
  value,
  className,
  variant = 'default',
  size: sizeProp,
  selected: selectedProp,
  disabled: disabledProp,
  removable = false,
  onRemove,
  onPress,
  leftIcon,
  testID,
}: ChipProps) {
  const context = useContext(ChipGroupContext);
  const size = sizeProp || context.size || 'md';
  const disabled = disabledProp ?? context.disabled;
  const isSelected = selectedProp ?? (value && context.selected?.includes(value));
  const sizeStyle = sizeClasses[size];
  const variantStyle = variantClasses[variant];

  const handlePress = () => {
    if (disabled) return;

    if (value && context.onSelect) {
      context.onSelect(value);
    }
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      className={cn(
        'flex-row items-center',
        sizeStyle.chip,
        isSelected ? variantStyle.selected : variantStyle.base,
        disabled && 'opacity-50',
        'active:opacity-80',
        className,
      )}
      testID={testID}
      accessible
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected, disabled }}
    >
      {/* Left Icon */}
      {leftIcon && (
        <View className="mr-1.5">
          {leftIcon}
        </View>
      )}

      {/* Content */}
      <Text className={cn(sizeStyle.text, 'font-medium')}>
        {children}
      </Text>

      {/* Remove Button */}
      {removable && (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-1.5 -mr-1"
          accessibilityLabel="Remove"
        >
          <Text className={sizeStyle.icon}>x</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

export function ChipGroup({
  children,
  selected = [],
  onSelectedChange,
  multiple = false,
  disabled = false,
  size = 'md',
  className,
  testID,
}: ChipGroupProps) {
  const handleSelect = (value: string) => {
    if (disabled || !onSelectedChange) return;

    if (multiple) {
      const newSelected = selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value];
      onSelectedChange(newSelected);
    } else {
      onSelectedChange(selected.includes(value) ? [] : [value]);
    }
  };

  return (
    <ChipGroupContext.Provider value={{ selected, onSelect: handleSelect, multiple, disabled, size }}>
      <View
        className={cn('flex-row flex-wrap gap-2', className)}
        testID={testID}
        accessible
        accessibilityRole="group"
      >
        {children}
      </View>
    </ChipGroupContext.Provider>
  );
}
`

/**
 * Chip component for React Native Web preview
 */
export function Chip({
  children,
  value,
  className,
  variant = 'default',
  size: sizeProp,
  selected: selectedProp,
  disabled: disabledProp,
  removable = false,
  onRemove,
  onPress,
  leftIcon,
  testID,
}: ChipProps) {
  const context = useContext(ChipGroupContext)
  const size = sizeProp || context.size || 'md'
  const disabled = disabledProp ?? context.disabled
  const isSelected = selectedProp ?? (value && context.selected?.includes(value))
  const sizeStyle = sizeClasses[size]
  const variantStyle = variantClasses[variant]

  const handleClick = () => {
    if (disabled) return

    if (value && context.onSelect) {
      context.onSelect(value)
    }
    onPress?.()
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'inline-flex flex-row items-center transition-colors',
        sizeStyle.chip,
        isSelected ? variantStyle.selected : variantStyle.base,
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'hover:opacity-90 active:opacity-80 cursor-pointer',
        className,
      )}
      data-testid={testID}
      aria-pressed={isSelected ? true : false}
      aria-disabled={disabled}
    >
      {/* Left Icon */}
      {leftIcon && <span className="mr-1.5">{leftIcon}</span>}

      {/* Content */}
      <span className={cn(sizeStyle.text, 'font-medium')}>{children}</span>

      {/* Remove Button */}
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          className="ml-1.5 -mr-1 hover:opacity-70"
          aria-label="Remove"
        >
          <span className={sizeStyle.icon}>x</span>
        </button>
      )}
    </button>
  )
}

/**
 * ChipGroup component for React Native Web preview
 */
export function ChipGroup({
  children,
  selected = [],
  onSelectedChange,
  multiple = false,
  disabled = false,
  size = 'md',
  className,
  testID,
}: ChipGroupProps) {
  const handleSelect = (value: string) => {
    if (disabled || !onSelectedChange) return

    if (multiple) {
      const newSelected = selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]
      onSelectedChange(newSelected)
    } else {
      onSelectedChange(selected.includes(value) ? [] : [value])
    }
  }

  return (
    <ChipGroupContext.Provider value={{ selected, onSelect: handleSelect, multiple, disabled, size }}>
      <div className={cn('flex flex-row flex-wrap gap-2', className)} data-testid={testID} role="group">
        {children}
      </div>
    </ChipGroupContext.Provider>
  )
}

/**
 * Component metadata for Component Gallery
 */
export const ChipMetadata = {
  name: 'Chip',
  description: 'Compact tag/filter component with selection, removal, and icon support.',
  category: 'Data Display',
  platform: 'mobile' as const,
  props: [
    { name: 'children', type: 'React.ReactNode', required: true, description: 'Chip content' },
    { name: 'value', type: 'string', required: false, description: 'Value for controlled selection' },
    { name: 'className', type: 'string', required: false, description: 'Additional NativeWind classes' },
    { name: 'variant', type: "'default' | 'outline' | 'filled'", required: false, default: "'default'", description: 'Visual style variant' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, default: "'md'", description: 'Chip size' },
    { name: 'selected', type: 'boolean', required: false, description: 'Selection state' },
    { name: 'disabled', type: 'boolean', required: false, default: 'false', description: 'Disable chip' },
    { name: 'removable', type: 'boolean', required: false, default: 'false', description: 'Show remove button' },
    { name: 'onRemove', type: '() => void', required: false, description: 'Remove callback' },
    { name: 'onPress', type: '() => void', required: false, description: 'Press callback' },
    { name: 'leftIcon', type: 'React.ReactNode', required: false, description: 'Left side icon' },
    { name: 'testID', type: 'string', required: false, description: 'Test ID for testing frameworks' },
  ],
  subcomponents: ['ChipGroup'],
  dependencies: ['nativewind'],
  examples: [
    {
      title: 'Basic Chip',
      code: `<Chip>React Native</Chip>`,
    },
    {
      title: 'All Variants',
      code: `<View className="flex-row gap-2">
  <Chip variant="default">Default</Chip>
  <Chip variant="outline">Outline</Chip>
  <Chip variant="filled">Filled</Chip>
</View>`,
    },
    {
      title: 'Selected States',
      code: `<View className="flex-row gap-2">
  <Chip selected>Selected</Chip>
  <Chip variant="outline" selected>Selected</Chip>
</View>`,
    },
    {
      title: 'Removable Chips',
      code: `<View className="flex-row gap-2">
  {tags.map((tag) => (
    <Chip
      key={tag}
      removable
      onRemove={() => removeTag(tag)}
    >
      {tag}
    </Chip>
  ))}
</View>`,
    },
    {
      title: 'ChipGroup (Single Selection)',
      code: `<ChipGroup
  selected={selected}
  onSelectedChange={setSelected}
>
  <Chip value="small">Small</Chip>
  <Chip value="medium">Medium</Chip>
  <Chip value="large">Large</Chip>
</ChipGroup>`,
    },
    {
      title: 'ChipGroup (Multiple Selection)',
      code: `<ChipGroup
  selected={selectedTags}
  onSelectedChange={setSelectedTags}
  multiple
>
  <Chip value="react">React</Chip>
  <Chip value="typescript">TypeScript</Chip>
  <Chip value="tailwind">Tailwind</Chip>
</ChipGroup>`,
    },
  ],
}

export default Chip
