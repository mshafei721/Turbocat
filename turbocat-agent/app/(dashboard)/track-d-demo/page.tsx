/**
 * Track D Demo Page
 *
 * Demonstrates all Track D components:
 * - Command Palette
 * - Form components (FormField, FormLabel, FormMessage)
 * - RichTextEditor
 * - MarkdownRenderer
 * - Additional UI components
 */

import { ExampleFormUsage } from '@/components/forms/example-usage'

export default function TrackDDemoPage() {
  return (
    <div className="container mx-auto py-12">
      <div className="mb-12 space-y-4">
        <h1 className="text-4xl font-semibold">Track D: Navigation, Forms & Rich Text</h1>
        <p className="text-lg text-muted-foreground">
          AI Native components with terracotta and sage green accents
        </p>
      </div>

      {/* Command Palette Demo */}
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-medium">Command Palette</h2>
        <p className="mb-4 text-muted-foreground">
          Press <kbd className="rounded border bg-muted px-2 py-1 font-mono text-sm">⌘K</kbd> or{' '}
          <kbd className="rounded border bg-muted px-2 py-1 font-mono text-sm">Ctrl+K</kbd> to open the command
          palette
        </p>
        <div className="rounded-xl border bg-card p-6">
          <ul className="space-y-2 text-sm">
            <li>✓ Keyboard-driven navigation</li>
            <li>✓ Recent commands tracking</li>
            <li>✓ Theme switching</li>
            <li>✓ Quick page navigation</li>
          </ul>
        </div>
      </section>

      {/* Form Demo */}
      <section>
        <h2 className="mb-4 text-2xl font-medium">Forms with React Hook Form & Zod</h2>
        <ExampleFormUsage />
      </section>

      {/* Component List */}
      <section className="mt-16">
        <h2 className="mb-4 text-2xl font-medium">Available Components</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Navigation */}
          <div className="rounded-xl border bg-card p-6">
            <h3 className="mb-2 font-medium">Navigation</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• CommandPalette</li>
              <li>• Breadcrumb</li>
              <li>• Sheet</li>
            </ul>
          </div>

          {/* Forms */}
          <div className="rounded-xl border bg-card p-6">
            <h3 className="mb-2 font-medium">Forms</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• FormField</li>
              <li>• FormLabel</li>
              <li>• FormMessage</li>
              <li>• RichTextEditor</li>
              <li>• MarkdownRenderer</li>
            </ul>
          </div>

          {/* UI Components */}
          <div className="rounded-xl border bg-card p-6">
            <h3 className="mb-2 font-medium">UI Components</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• DatePicker</li>
              <li>• Calendar</li>
              <li>• Slider</li>
              <li>• Popover</li>
              <li>• ScrollArea</li>
              <li>• Separator</li>
              <li>• Skeleton</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
