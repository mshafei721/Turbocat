/**
 * Button Component Stories
 *
 * Showcases all button variants with the Turbocat design system.
 * Primary buttons use orange (#f97316), destructive uses red.
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/stories/components/Button.stories.tsx
 */

import type { Meta, StoryObj } from '@storybook/react'
import { Button } from '@/components/ui/button'
import { Mail, Loader2, ChevronRight, Heart, Download, Trash2 } from 'lucide-react'

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'The Button component is the primary interactive element in the Turbocat design system. It uses CSS variables for theming, with orange (#f97316) as the primary action color.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      description: 'The visual style of the button',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'The size of the button',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    asChild: {
      control: 'boolean',
      description: 'Render as a child element using Radix Slot',
    },
  },
}

export default meta
type Story = StoryObj<typeof Button>

// =============================================================================
// VARIANT STORIES
// =============================================================================

/**
 * Primary Button (Default)
 *
 * Uses the orange primary color (#f97316) for main call-to-action buttons.
 * This is the most prominent button style and should be used sparingly.
 */
export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'default',
  },
}

/**
 * Secondary Button
 *
 * Uses neutral/gray styling for secondary actions.
 * Less prominent than primary buttons.
 */
export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
}

/**
 * Destructive Button
 *
 * Uses red color for dangerous or destructive actions like delete.
 */
export const Destructive: Story = {
  args: {
    children: 'Delete Account',
    variant: 'destructive',
  },
}

/**
 * Outline Button
 *
 * Transparent background with a border.
 * Good for secondary actions that need to stand out.
 */
export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
  },
}

/**
 * Ghost Button
 *
 * Minimal styling, only visible on hover.
 * Good for toolbar buttons or icon buttons.
 */
export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
}

/**
 * Link Button
 *
 * Styled as a text link with underline on hover.
 * Uses primary (orange) color.
 */
export const Link: Story = {
  args: {
    children: 'Link Button',
    variant: 'link',
  },
}

// =============================================================================
// SIZE STORIES
// =============================================================================

/**
 * Small Button
 *
 * Compact size for tight spaces or less important actions.
 */
export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'sm',
  },
}

/**
 * Default Size Button
 *
 * Standard button size for most use cases.
 */
export const DefaultSize: Story = {
  args: {
    children: 'Default Size',
    size: 'default',
  },
}

/**
 * Large Button
 *
 * Larger button for prominent CTAs or hero sections.
 */
export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'lg',
  },
}

/**
 * Icon Button
 *
 * Square button sized for single icons.
 */
export const Icon: Story = {
  args: {
    children: <Heart className="size-4" />,
    size: 'icon',
    'aria-label': 'Like',
  },
}

// =============================================================================
// STATE STORIES
// =============================================================================

/**
 * Disabled Button
 *
 * Shows the disabled state with reduced opacity and no pointer events.
 */
export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
}

/**
 * Loading Button
 *
 * Shows a loading spinner inside the button.
 */
export const Loading: Story = {
  args: {
    children: (
      <>
        <Loader2 className="animate-spin" />
        Please wait
      </>
    ),
    disabled: true,
  },
}

// =============================================================================
// WITH ICON STORIES
// =============================================================================

/**
 * Button with Left Icon
 *
 * Icon placed before the text label.
 */
export const WithLeftIcon: Story = {
  args: {
    children: (
      <>
        <Mail />
        Login with Email
      </>
    ),
  },
}

/**
 * Button with Right Icon
 *
 * Icon placed after the text label.
 */
export const WithRightIcon: Story = {
  args: {
    children: (
      <>
        Continue
        <ChevronRight />
      </>
    ),
  },
}

/**
 * Download Button
 *
 * Example of a secondary action button with icon.
 */
export const DownloadButton: Story = {
  args: {
    children: (
      <>
        <Download />
        Download
      </>
    ),
    variant: 'outline',
  },
}

/**
 * Delete Button
 *
 * Example of a destructive action with icon.
 */
export const DeleteButton: Story = {
  args: {
    children: (
      <>
        <Trash2 />
        Delete
      </>
    ),
    variant: 'destructive',
  },
}

// =============================================================================
// SHOWCASE STORIES
// =============================================================================

/**
 * All Variants
 *
 * Shows all button variants side by side for comparison.
 */
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button variant="default">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
}

/**
 * All Sizes
 *
 * Shows all button sizes side by side for comparison.
 */
export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">
        <Heart className="size-4" />
      </Button>
    </div>
  ),
}

/**
 * Button Group
 *
 * Example of buttons used together in a common pattern.
 */
export const ButtonGroup: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Button variant="outline">Cancel</Button>
      <Button>Save Changes</Button>
    </div>
  ),
}

/**
 * Theme Showcase
 *
 * Demonstrates how buttons appear with the orange primary theme.
 */
export const ThemeShowcase: Story = {
  render: () => (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Primary Actions (Orange)</h3>
        <p className="text-sm text-muted-foreground">
          Primary buttons use the brand orange color (#f97316) for main call-to-actions.
        </p>
        <div className="flex gap-2">
          <Button>Get Started</Button>
          <Button>
            <Mail className="size-4" />
            Sign Up
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Secondary Actions (Gray)</h3>
        <p className="text-sm text-muted-foreground">
          Secondary buttons use neutral gray colors for less prominent actions.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary">Learn More</Button>
          <Button variant="outline">View Details</Button>
          <Button variant="ghost">Dismiss</Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Destructive Actions (Red)</h3>
        <p className="text-sm text-muted-foreground">Destructive buttons use red to warn users of dangerous actions.</p>
        <div className="flex gap-2">
          <Button variant="destructive">
            <Trash2 className="size-4" />
            Delete
          </Button>
          <Button variant="destructive">Remove Account</Button>
        </div>
      </div>
    </div>
  ),
}
