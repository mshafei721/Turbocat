'use client'

import * as React from 'react'
import { Controller, FieldPath, FieldValues, ControllerProps } from 'react-hook-form'

import { cn } from '@/lib/utils'
import { FormMessage } from './form-message'
import { FormLabel } from './form-label'

/**
 * FormField - Composable Form Field Wrapper (AI Native)
 *
 * Features:
 * - React Hook Form integration
 * - Accessible error messages
 * - Required indicator
 * - AI Native themed inline validation
 * - Dark mode support
 *
 * Usage:
 * <FormField
 *   control={form.control}
 *   name="email"
 *   label="Email"
 *   required
 *   render={({ field }) => <Input {...field} />}
 * />
 */

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
)

export function useFormField() {
  const fieldContext = React.useContext(FormFieldContext)

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>')
  }

  return fieldContext
}

interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<ControllerProps<TFieldValues, TName>, 'render'> {
  label?: string
  description?: string
  required?: boolean
  className?: string
  children?: (props: {
    field: ControllerProps<TFieldValues, TName>['render'] extends (props: infer P) => unknown
      ? P extends { field: infer F }
        ? F
        : never
      : never
  }) => React.ReactElement
  render?: ControllerProps<TFieldValues, TName>['render']
}

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  description,
  required = false,
  className,
  children,
  render,
  ...props
}: FormFieldProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller
        {...props}
        render={(fieldProps) => {
          const { field, fieldState } = fieldProps
          const hasError = !!fieldState.error

          return (
            <div className={cn('space-y-2', className)}>
              {label && (
                <FormLabel htmlFor={props.name} required={required}>
                  {label}
                </FormLabel>
              )}

              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}

              <div
                className={cn(
                  'transition-all duration-200',
                  hasError && 'animate-shake',
                )}
              >
                {render ? render(fieldProps) : children?.({ field })}
              </div>

              {hasError && <FormMessage>{fieldState.error?.message}</FormMessage>}
            </div>
          )
        }}
      />
    </FormFieldContext.Provider>
  )
}
