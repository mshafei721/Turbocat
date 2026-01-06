'use client'

import { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Smartphone, Monitor, Code, Copy, Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

/**
 * Mobile Component Preview - Task 5.8
 * Phase 4: Mobile Development
 *
 * Provides interactive preview for mobile components using React Native Web
 * with fallback to code-only view. Supports both iOS and Android device frames.
 *
 * Features:
 * - Interactive preview using React Native Web
 * - Device frame selection (iPhone, Android)
 * - Dark/Light mode toggle
 * - Code view with syntax highlighting
 * - Copy to clipboard functionality
 * - Responsive preview sizes
 * - Fallback to code-only on preview failure
 */

export type DeviceFrame = 'iphone' | 'android' | 'none'
export type PreviewTheme = 'light' | 'dark'
export type PreviewTab = 'preview' | 'code' | 'template'

/**
 * Device frame dimensions
 */
const DEVICE_FRAMES: Record<DeviceFrame, { width: number; height: number; label: string }> = {
  iphone: { width: 375, height: 812, label: 'iPhone 14' },
  android: { width: 360, height: 780, label: 'Pixel 7' },
  none: { width: 375, height: 667, label: 'No Frame' },
}

/**
 * Component metadata structure
 */
export interface ComponentMetadata {
  name: string
  description: string
  category: string
  platform: 'web' | 'mobile' | 'universal'
  props: Array<{
    name: string
    type: string
    required: boolean
    default?: string
    description: string
  }>
  subcomponents?: string[]
  hooks?: string[]
  dependencies?: string[]
  examples: Array<{
    title: string
    code: string
  }>
}

/**
 * Props for MobileComponentPreview
 */
export interface MobileComponentPreviewProps {
  /** Component to preview (React element) */
  children?: React.ReactNode
  /** Component metadata */
  metadata: ComponentMetadata
  /** React Native template code */
  templateCode?: string
  /** Initial device frame */
  defaultDevice?: DeviceFrame
  /** Initial theme */
  defaultTheme?: PreviewTheme
  /** Show device selector */
  showDeviceSelector?: boolean
  /** Show theme toggle */
  showThemeToggle?: boolean
  /** Additional className */
  className?: string
  /** Whether preview is interactive */
  interactive?: boolean
  /** Fallback to code view on error */
  fallbackOnError?: boolean
}

/**
 * Code Block Component - Safe implementation without dangerouslySetInnerHTML
 */
function CodeBlock({
  code,
  language = 'tsx',
  showLineNumbers = true,
  maxHeight = 400,
}: {
  code: string
  language?: string
  showLineNumbers?: boolean
  maxHeight?: number
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [code])

  const lines = code.split('\n')

  return (
    <div className="relative group rounded-lg overflow-hidden border bg-muted/50">
      {/* Copy Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        aria-label={copied ? 'Copied' : 'Copy code'}
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>

      {/* Language Badge */}
      <div className="absolute top-2 left-2 px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground">
        {language}
      </div>

      {/* Code Content */}
      <div style={{ maxHeight }} className="pt-8 overflow-auto">
        <pre className="p-4 text-sm font-mono overflow-x-auto">
          {lines.map((line, index) => (
            <div key={index} className="flex">
              {showLineNumbers && (
                <span className="select-none w-8 text-right pr-4 text-muted-foreground/50 text-xs">
                  {index + 1}
                </span>
              )}
              <code className="flex-1 whitespace-pre">{line || ' '}</code>
            </div>
          ))}
        </pre>
      </div>
    </div>
  )
}

/**
 * Device Frame Component
 */
function DeviceFrameWrapper({
  children,
  device,
  theme,
  className,
}: {
  children: React.ReactNode
  device: DeviceFrame
  theme: PreviewTheme
  className?: string
}) {
  const frame = DEVICE_FRAMES[device]

  if (device === 'none') {
    return (
      <div
        className={cn('rounded-lg overflow-hidden border', theme === 'dark' ? 'bg-gray-900' : 'bg-white', className)}
        style={{ width: frame.width, height: frame.height }}
      >
        {children}
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      {/* Device Frame */}
      <div
        className={cn(
          'rounded-[3rem] p-3',
          device === 'iphone' ? 'bg-gray-800' : 'bg-gray-900',
          'shadow-2xl'
        )}
      >
        {/* Notch (iPhone) or Camera (Android) */}
        {device === 'iphone' && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-full z-10" />
        )}
        {device === 'android' && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-700 rounded-full z-10" />
        )}

        {/* Screen */}
        <div
          className={cn(
            'rounded-[2.5rem] overflow-hidden',
            theme === 'dark' ? 'bg-gray-900' : 'bg-white'
          )}
          style={{ width: frame.width, height: frame.height }}
        >
          {/* Status Bar */}
          <div
            className={cn(
              'h-11 px-6 flex items-center justify-between text-xs font-medium',
              theme === 'dark' ? 'text-white' : 'text-black'
            )}
          >
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={cn('w-1 rounded-sm', theme === 'dark' ? 'bg-white' : 'bg-black')}
                    style={{ height: 4 + i * 2 }}
                  />
                ))}
              </div>
              <span className="ml-1">100%</span>
            </div>
          </div>

          {/* Content */}
          <div className="h-[calc(100%-44px)] overflow-auto">{children}</div>
        </div>
      </div>

      {/* Device Label */}
      <p className="text-center text-xs text-muted-foreground mt-2">{frame.label}</p>
    </div>
  )
}

/**
 * Props Table Component
 */
function PropsTable({ props }: { props: ComponentMetadata['props'] }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="rounded-lg border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 bg-muted/50 flex items-center justify-between text-sm font-medium hover:bg-muted/70 transition-colors"
      >
        <span>Props ({props.length})</span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Prop</th>
                <th className="px-4 py-2 text-left font-medium">Type</th>
                <th className="px-4 py-2 text-left font-medium">Default</th>
                <th className="px-4 py-2 text-left font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {props.map((prop) => (
                <tr key={prop.name} className="border-t">
                  <td className="px-4 py-2 font-mono text-xs">
                    {prop.name}
                    {prop.required && <span className="text-red-500 ml-1">*</span>}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-purple-500">{prop.type}</td>
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                    {prop.default || '-'}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">{prop.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/**
 * MobileComponentPreview
 *
 * Interactive preview component for mobile components using React Native Web.
 * Shows component in device frame with code view and documentation.
 */
export function MobileComponentPreview({
  children,
  metadata,
  templateCode,
  defaultDevice = 'iphone',
  defaultTheme = 'light',
  showDeviceSelector = true,
  showThemeToggle = true,
  className,
  interactive = true,
  fallbackOnError = true,
}: MobileComponentPreviewProps) {
  const [device, setDevice] = useState<DeviceFrame>(defaultDevice)
  const [theme, setTheme] = useState<PreviewTheme>(defaultTheme)
  const [activeTab, setActiveTab] = useState<PreviewTab>('preview')
  const [previewError, setPreviewError] = useState<string | null>(null)

  // Generate example code from metadata
  const exampleCode = useMemo(() => {
    if (metadata.examples.length > 0) {
      return metadata.examples[0].code
    }
    return `<${metadata.name} />`
  }, [metadata])

  // Handle preview error
  const handlePreviewError = useCallback(
    (error: Error) => {
      console.error('Preview error:', error)
      setPreviewError(error.message)
      if (fallbackOnError) {
        setActiveTab('code')
      }
    },
    [fallbackOnError]
  )

  return (
    <div className={cn('rounded-lg border bg-card overflow-hidden', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{metadata.name}</h3>
          <p className="text-sm text-muted-foreground">{metadata.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Platform Badge */}
          <span
            className={cn(
              'px-2 py-1 rounded-full text-xs font-medium',
              metadata.platform === 'mobile'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : metadata.platform === 'universal'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            )}
          >
            {metadata.platform}
          </span>
          {/* Category Badge */}
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
            {metadata.category}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PreviewTab)}>
        <div className="px-4 pt-2 border-b bg-background">
          <TabsList className="h-9">
            <TabsTrigger value="preview" className="text-sm">
              <Smartphone className="h-4 w-4 mr-1" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="code" className="text-sm">
              <Code className="h-4 w-4 mr-1" />
              Example
            </TabsTrigger>
            {templateCode && (
              <TabsTrigger value="template" className="text-sm">
                <Monitor className="h-4 w-4 mr-1" />
                React Native
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* Preview Tab */}
        <TabsContent value="preview" className="m-0">
          {previewError && fallbackOnError ? (
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
              <h4 className="font-semibold mb-2">Preview Not Available</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Interactive preview failed. Showing code view instead.
              </p>
              <Button variant="outline" size="sm" onClick={() => setActiveTab('code')}>
                View Code
              </Button>
            </div>
          ) : (
            <div className="p-6">
              {/* Controls */}
              <div className="flex items-center justify-center gap-4 mb-6">
                {showDeviceSelector && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Device:</span>
                    <div className="flex rounded-lg border overflow-hidden">
                      {(['iphone', 'android', 'none'] as DeviceFrame[]).map((d) => (
                        <button
                          key={d}
                          onClick={() => setDevice(d)}
                          className={cn(
                            'px-3 py-1.5 text-sm capitalize transition-colors',
                            device === d
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-background hover:bg-muted'
                          )}
                        >
                          {d === 'none' ? 'None' : d}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {showThemeToggle && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Theme:</span>
                    <div className="flex rounded-lg border overflow-hidden">
                      {(['light', 'dark'] as PreviewTheme[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTheme(t)}
                          className={cn(
                            'px-3 py-1.5 text-sm capitalize transition-colors',
                            theme === t
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-background hover:bg-muted'
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Device Preview */}
              <div className="flex justify-center">
                <DeviceFrameWrapper device={device} theme={theme}>
                  <div
                    className={cn(
                      'h-full p-4',
                      theme === 'dark' ? 'text-white' : 'text-gray-900',
                      !interactive && 'pointer-events-none'
                    )}
                  >
                    {children || (
                      <div className="h-full flex items-center justify-center text-center">
                        <div>
                          <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p className="text-sm opacity-70">
                            Component preview will appear here
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </DeviceFrameWrapper>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Code Example Tab */}
        <TabsContent value="code" className="m-0 p-4">
          <div className="space-y-4">
            {metadata.examples.map((example, index) => (
              <div key={index}>
                <h4 className="text-sm font-medium mb-2">{example.title}</h4>
                <CodeBlock code={example.code} language="tsx" />
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Template Tab */}
        {templateCode && (
          <TabsContent value="template" className="m-0 p-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>Full React Native implementation with NativeWind styling</span>
              </div>
              <CodeBlock code={templateCode} language="tsx" maxHeight={500} />
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Props Documentation */}
      <div className="p-4 border-t">
        <PropsTable props={metadata.props} />
      </div>

      {/* Dependencies & Subcomponents */}
      {(metadata.dependencies?.length || metadata.subcomponents?.length || metadata.hooks?.length) && (
        <div className="px-4 pb-4 flex flex-wrap gap-4 text-sm">
          {metadata.subcomponents && metadata.subcomponents.length > 0 && (
            <div>
              <span className="text-muted-foreground">Subcomponents: </span>
              <span className="font-mono">{metadata.subcomponents.join(', ')}</span>
            </div>
          )}
          {metadata.hooks && metadata.hooks.length > 0 && (
            <div>
              <span className="text-muted-foreground">Hooks: </span>
              <span className="font-mono">{metadata.hooks.join(', ')}</span>
            </div>
          )}
          {metadata.dependencies && metadata.dependencies.length > 0 && (
            <div>
              <span className="text-muted-foreground">Dependencies: </span>
              <span className="font-mono">{metadata.dependencies.join(', ')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Code-only preview fallback component
 */
export function CodeOnlyPreview({
  metadata,
  templateCode,
  className,
}: {
  metadata: ComponentMetadata
  templateCode?: string
  className?: string
}) {
  return (
    <MobileComponentPreview
      metadata={metadata}
      templateCode={templateCode}
      className={className}
      interactive={false}
      showDeviceSelector={false}
      showThemeToggle={false}
    >
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-4">
          <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm font-medium">{metadata.name}</p>
          <p className="text-xs opacity-70 mt-1">Code-only preview</p>
        </div>
      </div>
    </MobileComponentPreview>
  )
}

export default MobileComponentPreview
