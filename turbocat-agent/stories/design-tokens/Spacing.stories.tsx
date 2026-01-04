import type { Meta, StoryObj } from '@storybook/react'
import { spacing } from '@/lib/design-tokens'

const SpacingShowcase = () => (
  <div className="space-y-8 p-6">
    <h2 className="text-2xl font-bold">Spacing Scale</h2>
    <div className="space-y-4">
      {Object.entries(spacing)
        .slice(0, 20)
        .map(([key, value]) => (
          <div key={key} className="flex items-center gap-4">
            <div className="w-20 text-sm font-mono text-muted-foreground">{key}</div>
            <div className="h-4 bg-orange-500 rounded" style={{ width: value }} />
            <div className="text-sm text-muted-foreground">{value}</div>
          </div>
        ))}
    </div>
  </div>
)

const meta: Meta = {
  title: 'Design Tokens/Spacing',
  component: SpacingShowcase,
}

export default meta
type Story = StoryObj

export const Default: Story = {}
