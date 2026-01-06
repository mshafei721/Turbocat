/**
 * Input/Form Components - Mobile Component Library
 * Phase 4: Mobile Development - Task 5.4
 *
 * Re-exports all input/form components for convenient importing.
 */

export { Button, ButtonTemplate, ButtonMetadata } from './Button'
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button'

export { TextInput, TextInputTemplate, TextInputMetadata } from './TextInput'
export type { TextInputProps, TextInputVariant, TextInputSize, KeyboardType } from './TextInput'

export { Checkbox, CheckboxTemplate, CheckboxMetadata } from './Checkbox'
export type { CheckboxProps, CheckboxSize } from './Checkbox'

export { RadioGroup, RadioItem, RadioTemplate, RadioMetadata } from './Radio'
export type { RadioGroupProps, RadioItemProps, RadioSize } from './Radio'

export { default as Switch, SwitchTemplate, SwitchMetadata } from './Switch'
export type { SwitchProps, SwitchSize } from './Switch'

/**
 * All input component metadata for Component Gallery
 */
export const inputComponentMetadata = [
  { component: 'Button', metadata: () => import('./Button').then((m) => m.ButtonMetadata) },
  { component: 'TextInput', metadata: () => import('./TextInput').then((m) => m.TextInputMetadata) },
  { component: 'Checkbox', metadata: () => import('./Checkbox').then((m) => m.CheckboxMetadata) },
  { component: 'Radio', metadata: () => import('./Radio').then((m) => m.RadioMetadata) },
  { component: 'Switch', metadata: () => import('./Switch').then((m) => m.SwitchMetadata) },
]
