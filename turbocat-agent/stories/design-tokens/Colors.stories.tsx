import type { Meta, StoryObj } from '@storybook/react'
import { colors } from '@/lib/design-tokens'

const ColorPalette = ({ palette, name }: { palette: Record<string, string>; name: string }) => (
  <div className="space-y-4">
    <h3 className="text-xl font-semibold capitalize">{name}</h3>
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {Object.entries(palette).map(([shade, hex]) => (
        <div key={shade} className="space-y-2">
          <div className="h-16 w-full rounded-lg border border-border" style={{ backgroundColor: hex }} />
          <div className="text-sm">
            <p className="font-medium">{shade}</p>
            <p className="text-muted-foreground font-mono text-xs">{hex}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
)

const AllColors = () => (
  <div className="space-y-8 p-6">
    <h2 className="text-2xl font-bold">Color Palette</h2>
    <ColorPalette palette={colors.orange} name="orange (primary)" />
    <ColorPalette palette={colors.blue} name="blue (secondary)" />
    <ColorPalette palette={colors.gray} name="gray (neutral)" />
    <ColorPalette palette={colors.semantic} name="semantic" />
  </div>
)

const meta: Meta = {
  title: 'Design Tokens/Colors',
  component: AllColors,
}

export default meta
type Story = StoryObj

export const Default: Story = {}
