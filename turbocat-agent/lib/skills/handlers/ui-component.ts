/**
 * UI Component Skill Handler
 *
 * Generates design-compliant React components using shadcn/ui primitives
 * and design tokens from the Turbocat design system.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/lib/skills/handlers/ui-component.ts
 */

import fs from 'fs'
import path from 'path'
import { colors } from '@/lib/design-tokens'

interface ComponentDetectionResult {
  isComponent: boolean
  componentType?: string
  confidence: number
}

interface ComponentMetadata {
  name: string
  type: string
  description: string
  dependencies: string[]
  references?: string[]
  accessibility: {
    hasAriaAttributes: boolean
    hasKeyboardSupport: boolean
    hasFocusManagement: boolean
    colorContrast: 'AA' | 'AAA'
  }
}

interface GeneratedComponent {
  code: string
  filePath: string
  metadata: ComponentMetadata
  story?: string
  error?: string
}

interface ExistingComponent {
  name: string
  path: string
  type: string
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export class UIComponentHandler {
  private componentTypeMappings: Record<string, string> = {
    card: 'card',
    button: 'button',
    form: 'form',
    modal: 'modal',
    dialog: 'dialog',
    table: 'table',
    list: 'list',
    nav: 'navigation',
    navigation: 'navigation',
    menu: 'menu',
    dropdown: 'dropdown',
    accordion: 'accordion',
    tabs: 'tabs',
    input: 'input',
    select: 'select',
    checkbox: 'checkbox',
    radio: 'radio',
    switch: 'switch',
    slider: 'slider',
    tooltip: 'tooltip',
    popover: 'popover',
    alert: 'alert',
    toast: 'toast',
    badge: 'badge',
    avatar: 'avatar',
    progress: 'progress',
    skeleton: 'skeleton',
    separator: 'separator',
    sheet: 'sheet',
    calendar: 'calendar',
    combobox: 'combobox',
  }

  /**
   * Detect if a prompt is requesting a component
   */
  detectComponent(prompt: string): ComponentDetectionResult {
    if (!prompt || prompt.trim().length === 0) {
      return { isComponent: false, confidence: 0 }
    }

    const lower = prompt.toLowerCase()

    // Check for component keywords
    const componentKeywords = Object.keys(this.componentTypeMappings)
    const hasComponentKeyword = componentKeywords.some((keyword) =>
      lower.includes(keyword)
    )

    // Check for action verbs
    const actionVerbs = ['create', 'build', 'generate', 'make', 'add', 'design']
    const hasActionVerb = actionVerbs.some((verb) => lower.includes(verb))

    // Check for "component" word
    const hasComponentWord = lower.includes('component')

    // Determine component type
    let componentType: string | undefined
    for (const [keyword, type] of Object.entries(this.componentTypeMappings)) {
      if (lower.includes(keyword)) {
        componentType = type
        break
      }
    }

    // Calculate confidence
    let confidence = 0
    if (hasComponentKeyword) confidence += 0.5
    if (hasActionVerb) confidence += 0.2
    if (hasComponentWord) confidence += 0.3

    // Non-component indicators (reduce confidence)
    const nonComponentKeywords = ['api', 'endpoint', 'database', 'table schema', 'auth', 'route']
    const hasNonComponentKeyword = nonComponentKeywords.some((keyword) =>
      lower.includes(keyword)
    )
    if (hasNonComponentKeyword) {
      confidence *= 0.3
    }

    const isComponent = confidence >= 0.5

    // If we detected it as component but no specific type, use generic
    if (isComponent && !componentType) {
      componentType = 'generic'
    }

    return {
      isComponent,
      componentType,
      confidence,
    }
  }

  /**
   * Read existing components from the component gallery (components/ui/)
   */
  readComponentGallery(): ExistingComponent[] {
    const componentsDir = path.join(process.cwd(), 'components', 'ui')

    if (!fs.existsSync(componentsDir)) {
      return []
    }

    const files = fs.readdirSync(componentsDir)
    const components: ExistingComponent[] = []

    for (const file of files) {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const name = path.basename(file, path.extname(file))
        const fullPath = path.join(componentsDir, file)

        // Try to determine type from filename
        let type = 'generic'
        for (const [keyword, mappedType] of Object.entries(this.componentTypeMappings)) {
          if (name.includes(keyword)) {
            type = mappedType
            break
          }
        }

        components.push({
          name,
          path: fullPath,
          type,
        })
      }
    }

    return components
  }

  /**
   * Find similar components in the gallery
   */
  findSimilarComponents(componentType: string): ExistingComponent[] {
    const allComponents = this.readComponentGallery()

    return allComponents.filter((comp) => {
      // Exact type match
      if (comp.type === componentType) {
        return true
      }

      // Partial name match
      if (comp.name.includes(componentType) || componentType.includes(comp.name)) {
        return true
      }

      return false
    })
  }

  /**
   * Check if a component is a duplicate
   */
  isDuplicateComponent(componentName: string): boolean {
    const components = this.readComponentGallery()
    const normalizedName = componentName.toLowerCase().replace(/component$/i, '').trim()

    return components.some((comp) => {
      const compNormalizedName = comp.name.toLowerCase().replace(/component$/i, '').trim()
      return compNormalizedName === normalizedName
    })
  }

  /**
   * Generate a component based on the prompt
   */
  generateComponent(
    prompt: string,
    options: { includeStory?: boolean } = {}
  ): GeneratedComponent {
    if (!prompt || prompt.trim().length === 0) {
      return {
        code: '',
        filePath: '',
        metadata: this.createEmptyMetadata(),
        error: 'Empty prompt provided',
      }
    }

    const detection = this.detectComponent(prompt)

    if (!detection.isComponent || !detection.componentType) {
      return {
        code: '',
        filePath: '',
        metadata: this.createEmptyMetadata(),
        error: 'Not a component request',
      }
    }

    const componentType = detection.componentType
    const componentName = this.extractComponentName(prompt, componentType)

    // Check for similar components
    const similarComponents = this.findSimilarComponents(componentType)

    // Generate component code
    const code = this.generateComponentCode(componentName, componentType, prompt, similarComponents)

    // Generate file path
    const filePath = this.generateFilePath(componentName)

    // Generate metadata
    const metadata = this.generateMetadata(componentName, componentType, prompt, code)

    // Optionally generate Storybook story
    const story = options.includeStory
      ? this.generateStorybook(componentName, componentType)
      : undefined

    return {
      code,
      filePath,
      metadata,
      story,
    }
  }

  /**
   * Validate a generated component
   */
  validateComponent(component: GeneratedComponent): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check if code exists
    if (!component.code || component.code.trim().length === 0) {
      errors.push('Component code is empty')
    }

    // Check for React import
    if (!component.code.includes('import') || !component.code.includes('React')) {
      warnings.push('Missing React import')
    }

    // Check for TypeScript types
    if (!component.code.includes('interface') && !component.code.includes('type ')) {
      warnings.push('Missing TypeScript type definitions')
    }

    // Check for export
    if (!component.code.includes('export')) {
      errors.push('Component is not exported')
    }

    // Check for accessibility
    if (component.metadata.accessibility) {
      if (!component.metadata.accessibility.hasAriaAttributes) {
        warnings.push('Missing ARIA attributes for accessibility')
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  // Private helper methods

  private createEmptyMetadata(): ComponentMetadata {
    return {
      name: '',
      type: 'generic',
      description: '',
      dependencies: [],
      accessibility: {
        hasAriaAttributes: false,
        hasKeyboardSupport: false,
        hasFocusManagement: false,
        colorContrast: 'AA',
      },
    }
  }

  private extractComponentName(prompt: string, componentType: string): string {
    // Extract custom name if provided
    const matches = prompt.match(/(?:create|build|generate)\s+a\s+(\w+(?:\s+\w+)*)\s+component/i)

    if (matches && matches[1]) {
      return this.toPascalCase(matches[1])
    }

    // Use component type with descriptive suffix
    const descriptiveWords = prompt
      .toLowerCase()
      .split(' ')
      .filter((word) =>
        ['custom', 'primary', 'secondary', 'loading', 'animated', 'interactive'].includes(word)
      )

    if (descriptiveWords.length > 0) {
      return this.toPascalCase(`${descriptiveWords[0]} ${componentType}`)
    }

    return this.toPascalCase(componentType)
  }

  private generateComponentCode(
    componentName: string,
    componentType: string,
    prompt: string,
    similarComponents: ExistingComponent[]
  ): string {
    // Determine if we should extend existing component
    const shouldExtend = similarComponents.length > 0

    // Generate based on component type
    switch (componentType) {
      case 'button':
        return this.generateButtonComponent(componentName, shouldExtend, prompt)
      case 'card':
        return this.generateCardComponent(componentName, shouldExtend, prompt)
      case 'dialog':
      case 'modal':
        return this.generateDialogComponent(componentName, shouldExtend, prompt)
      case 'form':
        return this.generateFormComponent(componentName, shouldExtend, prompt)
      case 'table':
        return this.generateTableComponent(componentName, shouldExtend, prompt)
      case 'input':
        return this.generateInputComponent(componentName, shouldExtend, prompt)
      default:
        return this.generateGenericComponent(componentName, componentType, prompt)
    }
  }

  private generateButtonComponent(
    componentName: string,
    extendExisting: boolean,
    prompt: string
  ): string {
    const isLoading = prompt.toLowerCase().includes('loading')
    const isPrimary = prompt.toLowerCase().includes('primary')

    return `import * as React from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ${componentName}Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'${isLoading ? '\n  loading?: boolean' : ''}
}

export const ${componentName} = React.forwardRef<HTMLButtonElement, ${componentName}Props>(
  ({ className, variant${isPrimary ? ' = "default"' : ''}, size, ${isLoading ? 'loading = false, ' : ''}children, ${isLoading ? 'disabled, ' : ''}...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        ${isLoading ? 'disabled={disabled || loading}' : ''}
        className={cn(${isPrimary ? '"bg-orange-500 hover:bg-orange-600 text-white focus-visible:ring-orange-500", ' : ''}className)}
        {...props}
      >${isLoading ? `
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        <span className={cn(loading && "opacity-70")}>{children}</span>` : `
        {children}`}
      </Button>
    )
  }
)

${componentName}.displayName = '${componentName}'
`
  }

  private generateCardComponent(
    componentName: string,
    extendExisting: boolean,
    prompt: string
  ): string {
    const hasStats = prompt.toLowerCase().includes('stat') || prompt.toLowerCase().includes('metric')

    if (hasStats) {
      return `import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ${componentName}Props {
  title: string
  value: string | number
  description?: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  icon?: React.ReactNode
  className?: string
}

export function ${componentName}({
  title,
  value,
  description,
  trend,
  trendValue,
  icon,
  className,
}: ${componentName}Props) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && trendValue && (
          <div className="flex items-center mt-2">
            <span
              className={cn(
                'text-xs font-medium',
                trend === 'up' && 'text-green-600 dark:text-green-500',
                trend === 'down' && 'text-red-600 dark:text-red-500',
                trend === 'neutral' && 'text-gray-600 dark:text-gray-400'
              )}
              aria-label={\`Trend: \${trend}\`}
            >
              {trend === 'up' && '↑'}
              {trend === 'down' && '↓'}
              {trend === 'neutral' && '→'}
              {' '}
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
`
    }

    return `import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ${componentName}Props {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function ${componentName}({
  title,
  description,
  children,
  className,
}: ${componentName}Props) {
  return (
    <Card className={cn(className)}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle className="text-foreground">{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  )
}
`
  }

  private generateDialogComponent(
    componentName: string,
    extendExisting: boolean,
    prompt: string
  ): string {
    return `import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ${componentName}Props {
  trigger?: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ${componentName}({
  trigger,
  title,
  description,
  children,
  open,
  onOpenChange,
}: ${componentName}Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="mt-4">{children}</div>
      </DialogContent>
    </Dialog>
  )
}
`
  }

  private generateFormComponent(
    componentName: string,
    extendExisting: boolean,
    prompt: string
  ): string {
    return `import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface ${componentName}Props {
  onSubmit: (data: FormData) => void | Promise<void>
  children?: React.ReactNode
  className?: string
}

export function ${componentName}({ onSubmit, children, className }: ${componentName}Props) {
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      await onSubmit(formData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      {children}
      <Button
        type="submit"
        disabled={loading}
        className="bg-orange-500 hover:bg-orange-600 text-white focus-visible:ring-orange-500"
      >
        {loading ? 'Submitting...' : 'Submit'}
      </Button>
    </form>
  )
}
`
  }

  private generateTableComponent(
    componentName: string,
    extendExisting: boolean,
    prompt: string
  ): string {
    return `import * as React from 'react'
import { cn } from '@/lib/utils'

interface ${componentName}Props<T> {
  data: T[]
  columns: Array<{
    key: keyof T
    label: string
    render?: (value: T[keyof T], row: T) => React.ReactNode
  }>
  className?: string
}

export function ${componentName}<T extends Record<string, any>>({
  data,
  columns,
  className,
}: ${componentName}Props<T>) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-800">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className="px-4 py-3 text-left text-sm font-medium text-foreground"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="border-b border-gray-100 dark:border-gray-900 hover:bg-gray-50 dark:hover:bg-gray-900/50"
            >
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className="px-4 py-3 text-sm text-muted-foreground"
                >
                  {column.render
                    ? column.render(row[column.key], row)
                    : String(row[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
`
  }

  private generateInputComponent(
    componentName: string,
    extendExisting: boolean,
    prompt: string
  ): string {
    return `import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface ${componentName}Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const ${componentName} = React.forwardRef<HTMLInputElement, ${componentName}Props>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || React.useId()

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={inputId} className="text-foreground">
            {label}
          </Label>
        )}
        <Input
          ref={ref}
          id={inputId}
          className={cn(
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? \`\${inputId}-error\` : helperText ? \`\${inputId}-helper\` : undefined}
          {...props}
        />
        {error && (
          <p id={\`\${inputId}-error\`} className="text-sm text-red-600 dark:text-red-500">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={\`\${inputId}-helper\`} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

${componentName}.displayName = '${componentName}'
`
  }

  private generateGenericComponent(
    componentName: string,
    componentType: string,
    prompt: string
  ): string {
    // Check for specific component types that need special handling
    const isLink = prompt.toLowerCase().includes('link')
    const isBadge = componentType === 'badge' || prompt.toLowerCase().includes('badge')
    const isText = prompt.toLowerCase().includes('text')
    const isDropdown = componentType === 'dropdown' || prompt.toLowerCase().includes('dropdown')

    if (isLink) {
      return `import * as React from 'react'
import { cn } from '@/lib/utils'

interface ${componentName}Props extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode
}

export const ${componentName} = React.forwardRef<HTMLAnchorElement, ${componentName}Props>(
  ({ className, children, ...props }, ref) => {
    return (
      <a
        ref={ref}
        className={cn(
          'text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300',
          'underline-offset-4 hover:underline',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
          className
        )}
        {...props}
      >
        {children}
      </a>
    )
  }
)

${componentName}.displayName = '${componentName}'
`
    }

    if (isBadge) {
      return `import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ${componentName}Props {
  children: React.ReactNode
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  status?: 'success' | 'warning' | 'error' | 'info'
  className?: string
}

export function ${componentName}({ children, variant, status, className }: ${componentName}Props) {
  const statusColors = {
    success: 'bg-green-500 text-white',
    warning: 'bg-orange-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
  }

  return (
    <Badge
      variant={variant}
      className={cn(
        status && statusColors[status],
        className
      )}
    >
      {children}
    </Badge>
  )
}
`
    }

    if (isText) {
      return `import * as React from 'react'
import { cn } from '@/lib/utils'

interface ${componentName}Props {
  children: React.ReactNode
  variant?: 'body' | 'caption' | 'small'
  className?: string
}

export function ${componentName}({ children, variant = 'body', className }: ${componentName}Props) {
  return (
    <p
      className={cn(
        'text-foreground',
        variant === 'body' && 'text-base',
        variant === 'caption' && 'text-sm text-muted-foreground',
        variant === 'small' && 'text-xs text-muted-foreground dark:text-gray-400',
        className
      )}
    >
      {children}
    </p>
  )
}
`
    }

    if (isDropdown) {
      return `import * as React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface ${componentName}Props {
  trigger?: React.ReactNode
  items: Array<{
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }>
}

export function ${componentName}({ trigger, items }: ${componentName}Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || <Button variant="outline">Open Menu</Button>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {items.map((item, index) => (
          <DropdownMenuItem key={index} onClick={item.onClick} onKeyDown={(e) => e.key === 'Enter' && item.onClick()}>
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
`
    }

    return `import * as React from 'react'
import { cn } from '@/lib/utils'

interface ${componentName}Props {
  children?: React.ReactNode
  className?: string
}

export function ${componentName}({ children, className }: ${componentName}Props) {
  return (
    <div className={cn('p-4 rounded-md border border-gray-200 dark:border-gray-800 text-foreground', className)}>
      {children}
    </div>
  )
}
`
  }

  private generateFilePath(componentName: string): string {
    const fileName = this.toKebabCase(componentName)
    return path.join(process.cwd(), 'components', 'ui', `${fileName}.tsx`)
  }

  private generateMetadata(
    componentName: string,
    componentType: string,
    prompt: string,
    code: string
  ): ComponentMetadata {
    return {
      name: componentName,
      type: componentType,
      description: `Generated ${componentType} component based on: ${prompt}`,
      dependencies: this.extractDependencies(code),
      references: this.extractReferences(code),
      accessibility: {
        hasAriaAttributes: code.includes('aria-'),
        hasKeyboardSupport: code.includes('onKeyDown') || code.includes('Dialog') || code.includes('DropdownMenu'),
        hasFocusManagement: code.includes('focus:') || code.includes('focus-visible:'),
        colorContrast: 'AA',
      },
    }
  }

  private generateStorybook(componentName: string, componentType: string): string {
    const fileName = this.toKebabCase(componentName)

    return `import type { Meta, StoryObj } from '@storybook/react'
import { ${componentName} } from './${fileName}'

const meta: Meta<typeof ${componentName}> = {
  title: 'Components/${componentName}',
  component: ${componentName},
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof ${componentName}>

export const Default: Story = {
  args: {
    // Add default props here
  },
}

export const CustomVariant: Story = {
  args: {
    // Add custom props here
  },
}
`
  }

  private extractDependencies(code: string): string[] {
    const deps: string[] = []
    const importMatches = code.matchAll(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g)

    for (const match of importMatches) {
      deps.push(match[1])
    }

    return deps
  }

  private extractReferences(code: string): string[] {
    const refs: string[] = []

    // Check for shadcn/ui component references
    if (code.includes('Button') || code.includes('buttonVariants')) {
      refs.push('button')
    }
    if (code.includes('Card')) {
      refs.push('card')
    }
    if (code.includes('Dialog')) {
      refs.push('dialog')
    }
    if (code.includes('Input')) {
      refs.push('input')
    }

    return refs
  }

  private toPascalCase(str: string): string {
    return str
      .split(/[\s-_]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase()
  }
}
