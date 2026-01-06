/**
 * TextInput Component - Text Entry Field
 * Phase 4: Mobile Development - Task 5.4
 *
 * A comprehensive text input component with label, helper text, error states,
 * icons, and various keyboard types.
 *
 * @example
 * ```tsx
 * import { TextInput } from '@/components/mobile/input/TextInput';
 *
 * export default function SignupForm() {
 *   const [email, setEmail] = useState('');
 *
 *   return (
 *     <View className="p-4">
 *       <TextInput
 *         label="Email"
 *         placeholder="Enter your email"
 *         value={email}
 *         onChangeText={setEmail}
 *         keyboardType="email-address"
 *         autoCapitalize="none"
 *         leftIcon={<MailIcon />}
 *       />
 *     </View>
 *   );
 * }
 * ```
 */

import { cn } from '../utils'

/**
 * TextInput variant styles
 */
export type TextInputVariant = 'default' | 'filled' | 'outline'

/**
 * TextInput size
 */
export type TextInputSize = 'sm' | 'md' | 'lg'

/**
 * Keyboard type options
 */
export type KeyboardType =
  | 'default'
  | 'email-address'
  | 'numeric'
  | 'phone-pad'
  | 'decimal-pad'
  | 'number-pad'
  | 'url'
  | 'web-search'

/**
 * TextInput component props
 */
export interface TextInputProps {
  /** Input value */
  value?: string
  /** Change handler */
  onChangeText?: (text: string) => void
  /** Placeholder text */
  placeholder?: string
  /** Input label */
  label?: string
  /** Helper text below input */
  helperText?: string
  /** Error message (shows error state when present) */
  error?: string
  /** Additional NativeWind classes */
  className?: string
  /** Container classes */
  containerClassName?: string
  /** Visual variant (default: 'default') */
  variant?: TextInputVariant
  /** Input size (default: 'md') */
  size?: TextInputSize
  /** Whether input is disabled */
  disabled?: boolean
  /** Whether input is read-only */
  readOnly?: boolean
  /** Secure text entry (password) */
  secureTextEntry?: boolean
  /** Toggle secure text visibility */
  showSecureToggle?: boolean
  /** Keyboard type */
  keyboardType?: KeyboardType
  /** Auto capitalization */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  /** Auto correct */
  autoCorrect?: boolean
  /** Auto focus */
  autoFocus?: boolean
  /** Maximum length */
  maxLength?: number
  /** Multiline input */
  multiline?: boolean
  /** Number of lines for multiline */
  numberOfLines?: number
  /** Icon on the left side */
  leftIcon?: React.ReactNode
  /** Icon on the right side */
  rightIcon?: React.ReactNode
  /** Right icon press handler */
  onRightIconPress?: () => void
  /** Submit handler */
  onSubmitEditing?: () => void
  /** Focus handler */
  onFocus?: () => void
  /** Blur handler */
  onBlur?: () => void
  /** Test ID for testing */
  testID?: string
}

/**
 * Variant class mapping
 */
const variantClasses: Record<TextInputVariant, string> = {
  default: 'bg-background border border-input',
  filled: 'bg-muted border border-transparent',
  outline: 'bg-transparent border-2 border-input',
}

/**
 * Size class mapping
 */
const sizeClasses: Record<TextInputSize, { input: string; label: string; helper: string }> = {
  sm: {
    input: 'h-9 px-3 text-sm',
    label: 'text-sm mb-1',
    helper: 'text-xs mt-1',
  },
  md: {
    input: 'h-10 px-3 text-base',
    label: 'text-sm mb-1.5',
    helper: 'text-sm mt-1',
  },
  lg: {
    input: 'h-12 px-4 text-lg',
    label: 'text-base mb-2',
    helper: 'text-sm mt-1.5',
  },
}

/**
 * TextInput Component Template
 *
 * Full React Native implementation with NativeWind styling:
 */
export const TextInputTemplate = `import { View, Text, TextInput as RNTextInput, Pressable } from 'react-native';
import { useState } from 'react';
import { cn } from '@/lib/utils';

// ... (types remain the same)

export function TextInput({
  value,
  onChangeText,
  placeholder,
  label,
  helperText,
  error,
  className,
  containerClassName,
  variant = 'default',
  size = 'md',
  disabled = false,
  readOnly = false,
  secureTextEntry = false,
  showSecureToggle = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  autoFocus = false,
  maxLength,
  multiline = false,
  numberOfLines = 1,
  leftIcon,
  rightIcon,
  onRightIconPress,
  onSubmitEditing,
  onFocus,
  onBlur,
  testID,
}: TextInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isSecureVisible, setIsSecureVisible] = useState(false);

  const sizeStyle = sizeClasses[size];
  const hasError = !!error;

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  return (
    <View className={cn('w-full', containerClassName)} testID={testID}>
      {/* Label */}
      {label && (
        <Text className={cn(
          sizeStyle.label,
          'font-medium',
          hasError ? 'text-destructive' : 'text-foreground',
        )}>
          {label}
        </Text>
      )}

      {/* Input Container */}
      <View className={cn(
        'flex-row items-center rounded-lg',
        variantClasses[variant],
        sizeStyle.input,
        isFocused && 'border-ring ring-2 ring-ring/20',
        hasError && 'border-destructive',
        disabled && 'opacity-50',
        multiline && 'h-auto py-2',
        className,
      )}>
        {/* Left Icon */}
        {leftIcon && (
          <View className="mr-2 text-muted-foreground">
            {leftIcon}
          </View>
        )}

        {/* Text Input */}
        <RNTextInput
          value={value}
          onChangeText={disabled || readOnly ? undefined : onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          editable={!disabled && !readOnly}
          secureTextEntry={secureTextEntry && !isSecureVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          autoFocus={autoFocus}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onSubmitEditing={onSubmitEditing}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={cn(
            'flex-1 text-foreground',
            multiline && 'min-h-[80px]',
          )}
          accessibilityLabel={label}
          accessibilityState={{ disabled }}
        />

        {/* Secure Toggle */}
        {secureTextEntry && showSecureToggle && (
          <Pressable
            onPress={() => setIsSecureVisible(!isSecureVisible)}
            className="ml-2 p-1"
            accessibilityLabel={isSecureVisible ? 'Hide password' : 'Show password'}
          >
            <Text>{isSecureVisible ? '👁️' : '👁️‍🗨️'}</Text>
          </Pressable>
        )}

        {/* Right Icon */}
        {rightIcon && !showSecureToggle && (
          <Pressable
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            className="ml-2 text-muted-foreground"
          >
            {rightIcon}
          </Pressable>
        )}
      </View>

      {/* Helper Text / Error */}
      {(helperText || error) && (
        <Text className={cn(
          sizeStyle.helper,
          hasError ? 'text-destructive' : 'text-muted-foreground',
        )}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
}
`

/**
 * TextInput component for React Native Web preview
 */
export function TextInput({
  value,
  onChangeText,
  placeholder,
  label,
  helperText,
  error,
  className,
  containerClassName,
  variant = 'default',
  size = 'md',
  disabled = false,
  readOnly = false,
  secureTextEntry = false,
  showSecureToggle = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = true,
  autoFocus = false,
  maxLength,
  multiline = false,
  numberOfLines = 1,
  leftIcon,
  rightIcon,
  onRightIconPress,
  onSubmitEditing,
  onFocus,
  onBlur,
  testID,
}: TextInputProps) {
  const sizeStyle = sizeClasses[size]
  const hasError = !!error

  // Map keyboard type to HTML input type
  const inputType =
    secureTextEntry && !showSecureToggle
      ? 'password'
      : keyboardType === 'email-address'
        ? 'email'
        : keyboardType === 'numeric' || keyboardType === 'number-pad'
          ? 'number'
          : keyboardType === 'phone-pad'
            ? 'tel'
            : keyboardType === 'url'
              ? 'url'
              : 'text'

  const InputComponent = multiline ? 'textarea' : 'input'

  return (
    <div className={cn('w-full', containerClassName)} data-testid={testID}>
      {/* Label */}
      {label && (
        <label
          className={cn(sizeStyle.label, 'font-medium block', hasError ? 'text-destructive' : 'text-foreground')}
        >
          {label}
        </label>
      )}

      {/* Input Container */}
      <div
        className={cn(
          'flex flex-row items-center rounded-lg',
          variantClasses[variant],
          sizeStyle.input,
          'focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20',
          hasError && 'border-destructive',
          disabled && 'opacity-50 cursor-not-allowed',
          multiline && 'h-auto py-2 items-start',
          className,
        )}
      >
        {/* Left Icon */}
        {leftIcon && <span className="mr-2 text-muted-foreground">{leftIcon}</span>}

        {/* Text Input */}
        <InputComponent
          value={value}
          onChange={(e) => !disabled && !readOnly && onChangeText?.(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          type={inputType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect ? 'on' : 'off'}
          autoFocus={autoFocus}
          maxLength={maxLength}
          rows={multiline ? numberOfLines : undefined}
          onKeyDown={(e) => e.key === 'Enter' && !multiline && onSubmitEditing?.()}
          onFocus={onFocus}
          onBlur={onBlur}
          className={cn(
            'flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground',
            multiline && 'min-h-[80px] resize-none',
          )}
          aria-label={label}
          aria-invalid={hasError}
          aria-describedby={helperText || error ? `${testID}-helper` : undefined}
        />

        {/* Secure Toggle */}
        {secureTextEntry && showSecureToggle && (
          <button className="ml-2 p-1 text-muted-foreground hover:text-foreground" aria-label="Toggle password visibility">
            <span>Show</span>
          </button>
        )}

        {/* Right Icon */}
        {rightIcon && !showSecureToggle && (
          <button
            onClick={onRightIconPress}
            disabled={!onRightIconPress}
            className="ml-2 text-muted-foreground hover:text-foreground"
          >
            {rightIcon}
          </button>
        )}
      </div>

      {/* Helper Text / Error */}
      {(helperText || error) && (
        <p
          id={`${testID}-helper`}
          className={cn(sizeStyle.helper, hasError ? 'text-destructive' : 'text-muted-foreground')}
        >
          {error || helperText}
        </p>
      )}
    </div>
  )
}

/**
 * Component metadata for Component Gallery
 */
export const TextInputMetadata = {
  name: 'TextInput',
  description: 'Comprehensive text input with label, helper text, error states, and icons.',
  category: 'Input',
  platform: 'mobile' as const,
  props: [
    { name: 'value', type: 'string', required: false, description: 'Input value' },
    { name: 'onChangeText', type: '(text: string) => void', required: false, description: 'Change handler' },
    { name: 'placeholder', type: 'string', required: false, description: 'Placeholder text' },
    { name: 'label', type: 'string', required: false, description: 'Input label' },
    { name: 'helperText', type: 'string', required: false, description: 'Helper text below input' },
    { name: 'error', type: 'string', required: false, description: 'Error message' },
    { name: 'variant', type: "'default' | 'filled' | 'outline'", required: false, default: "'default'", description: 'Visual style variant' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", required: false, default: "'md'", description: 'Input size' },
    { name: 'disabled', type: 'boolean', required: false, default: 'false', description: 'Disable input' },
    { name: 'secureTextEntry', type: 'boolean', required: false, default: 'false', description: 'Password input' },
    { name: 'keyboardType', type: 'KeyboardType', required: false, default: "'default'", description: 'Keyboard type' },
    { name: 'multiline', type: 'boolean', required: false, default: 'false', description: 'Multiline text area' },
    { name: 'leftIcon', type: 'React.ReactNode', required: false, description: 'Left side icon' },
    { name: 'rightIcon', type: 'React.ReactNode', required: false, description: 'Right side icon' },
    { name: 'testID', type: 'string', required: false, description: 'Test ID for testing frameworks' },
  ],
  dependencies: ['nativewind'],
  examples: [
    {
      title: 'Basic TextInput',
      code: `<TextInput
  label="Name"
  placeholder="Enter your name"
  value={name}
  onChangeText={setName}
/>`,
    },
    {
      title: 'Email Input',
      code: `<TextInput
  label="Email"
  placeholder="you@example.com"
  keyboardType="email-address"
  autoCapitalize="none"
  leftIcon={<MailIcon />}
/>`,
    },
    {
      title: 'Password Input',
      code: `<TextInput
  label="Password"
  secureTextEntry
  showSecureToggle
  placeholder="Enter password"
/>`,
    },
    {
      title: 'With Error',
      code: `<TextInput
  label="Username"
  value="x"
  error="Username must be at least 3 characters"
/>`,
    },
    {
      title: 'Multiline',
      code: `<TextInput
  label="Bio"
  multiline
  numberOfLines={4}
  placeholder="Tell us about yourself"
/>`,
    },
  ],
}

export default TextInput
