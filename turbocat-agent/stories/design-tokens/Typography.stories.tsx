import type { Meta, StoryObj } from '@storybook/react'

const TypographyShowcase = () => (
  <div className="space-y-8 p-6">
    <h2 className="text-2xl font-bold">Typography Scale</h2>

    <div className="space-y-4">
      <p className="text-9xl font-bold tracking-tighter">text-9xl</p>
      <p className="text-8xl font-bold tracking-tighter">text-8xl</p>
      <p className="text-7xl font-bold tracking-tighter">text-7xl</p>
      <p className="text-6xl font-bold tracking-tight">text-6xl</p>
      <p className="text-5xl font-bold tracking-tight">text-5xl</p>
      <p className="text-4xl font-semibold">text-4xl</p>
      <p className="text-3xl font-semibold">text-3xl</p>
      <p className="text-2xl font-semibold">text-2xl</p>
      <p className="text-xl font-medium">text-xl</p>
      <p className="text-lg">text-lg</p>
      <p className="text-base">text-base (default)</p>
      <p className="text-sm">text-sm</p>
      <p className="text-xs">text-xs</p>
    </div>

    <h3 className="text-xl font-bold mt-8">Font Weights</h3>
    <div className="space-y-2">
      <p className="font-thin">font-thin (100)</p>
      <p className="font-extralight">font-extralight (200)</p>
      <p className="font-light">font-light (300)</p>
      <p className="font-normal">font-normal (400)</p>
      <p className="font-medium">font-medium (500)</p>
      <p className="font-semibold">font-semibold (600)</p>
      <p className="font-bold">font-bold (700)</p>
      <p className="font-extrabold">font-extrabold (800)</p>
      <p className="font-black">font-black (900)</p>
    </div>

    <h3 className="text-xl font-bold mt-8">Font Families</h3>
    <div className="space-y-4">
      <p className="font-sans">Sans-serif (Geist Sans, Inter) - The quick brown fox jumps over the lazy dog</p>
      <p className="font-mono">Monospace (Geist Mono) - const turbocat = {'{ power: 9000 }'}</p>
    </div>
  </div>
)

const meta: Meta = {
  title: 'Design Tokens/Typography',
  component: TypographyShowcase,
}

export default meta
type Story = StoryObj

export const Default: Story = {}
