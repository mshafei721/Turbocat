/**
 * Mobile Component Preview Tests - Task 5.8
 * Phase 4: Mobile Development
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  MobileComponentPreview,
  CodeOnlyPreview,
  type ComponentMetadata,
} from '@/components/mobile-component-preview'

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
}
Object.assign(navigator, { clipboard: mockClipboard })

// Sample component metadata for testing
const sampleMetadata: ComponentMetadata = {
  name: 'Button',
  description: 'A customizable button component for React Native',
  category: 'Input',
  platform: 'mobile',
  props: [
    {
      name: 'variant',
      type: "'primary' | 'secondary' | 'outline'",
      required: false,
      default: "'primary'",
      description: 'Button style variant',
    },
    {
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
      required: false,
      default: "'md'",
      description: 'Button size',
    },
    {
      name: 'onPress',
      type: '() => void',
      required: true,
      description: 'Press handler',
    },
  ],
  subcomponents: ['ButtonIcon', 'ButtonText'],
  hooks: [],
  dependencies: ['nativewind'],
  examples: [
    {
      title: 'Basic Button',
      code: '<Button onPress={() => console.log("pressed")}>Click Me</Button>',
    },
    {
      title: 'Secondary Button',
      code: '<Button variant="secondary">Secondary</Button>',
    },
  ],
}

const sampleTemplateCode = `import { Pressable, Text } from 'react-native';

export function Button({ children, onPress, variant = 'primary' }) {
  return (
    <Pressable onPress={onPress} className="px-4 py-2 rounded-lg">
      <Text>{children}</Text>
    </Pressable>
  );
}`

describe('MobileComponentPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders component name and description', () => {
    render(<MobileComponentPreview metadata={sampleMetadata} />)

    expect(screen.getByText('Button')).toBeInTheDocument()
    expect(screen.getByText('A customizable button component for React Native')).toBeInTheDocument()
  })

  it('displays platform badge', () => {
    render(<MobileComponentPreview metadata={sampleMetadata} />)

    expect(screen.getByText('mobile')).toBeInTheDocument()
  })

  it('displays category badge', () => {
    render(<MobileComponentPreview metadata={sampleMetadata} />)

    expect(screen.getByText('Input')).toBeInTheDocument()
  })

  it('shows Preview tab by default', () => {
    render(<MobileComponentPreview metadata={sampleMetadata} />)

    const previewTab = screen.getByRole('tab', { name: /preview/i })
    expect(previewTab).toHaveAttribute('data-state', 'active')
  })

  it('renders device frame selector when showDeviceSelector is true', () => {
    render(<MobileComponentPreview metadata={sampleMetadata} showDeviceSelector={true} />)

    expect(screen.getByText('Device:')).toBeInTheDocument()
    expect(screen.getByText('iphone')).toBeInTheDocument()
    expect(screen.getByText('android')).toBeInTheDocument()
    expect(screen.getByText('None')).toBeInTheDocument()
  })

  it('renders theme toggle when showThemeToggle is true', () => {
    render(<MobileComponentPreview metadata={sampleMetadata} showThemeToggle={true} />)

    expect(screen.getByText('Theme:')).toBeInTheDocument()
    expect(screen.getByText('light')).toBeInTheDocument()
    expect(screen.getByText('dark')).toBeInTheDocument()
  })

  it('hides device selector when showDeviceSelector is false', () => {
    render(<MobileComponentPreview metadata={sampleMetadata} showDeviceSelector={false} />)

    expect(screen.queryByText('Device:')).not.toBeInTheDocument()
  })

  it('hides theme toggle when showThemeToggle is false', () => {
    render(<MobileComponentPreview metadata={sampleMetadata} showThemeToggle={false} />)

    expect(screen.queryByText('Theme:')).not.toBeInTheDocument()
  })

  it('switches device frame when clicking device buttons', async () => {
    const user = userEvent.setup()
    render(<MobileComponentPreview metadata={sampleMetadata} defaultDevice="iphone" />)

    const androidButton = screen.getByText('android')
    await user.click(androidButton)

    // Check that Pixel 7 label appears (Android device)
    expect(screen.getByText('Pixel 7')).toBeInTheDocument()
  })

  it('switches theme when clicking theme buttons', async () => {
    const user = userEvent.setup()
    render(<MobileComponentPreview metadata={sampleMetadata} defaultTheme="light" />)

    const darkButton = screen.getByText('dark')
    await user.click(darkButton)

    // Dark button should now be active (has primary background)
    expect(darkButton).toHaveClass('bg-primary')
  })

  it('displays props table', () => {
    render(<MobileComponentPreview metadata={sampleMetadata} />)

    expect(screen.getByText('Props (3)')).toBeInTheDocument()
    expect(screen.getByText('variant')).toBeInTheDocument()
    expect(screen.getByText('size')).toBeInTheDocument()
    expect(screen.getByText('onPress')).toBeInTheDocument()
  })

  it('displays required indicator for required props', () => {
    render(<MobileComponentPreview metadata={sampleMetadata} />)

    // Find the onPress row which has required: true
    const onPressCell = screen.getByText('onPress')
    const row = onPressCell.closest('tr')
    expect(row).toContainHTML('*')
  })

  it('displays subcomponents when available', () => {
    render(<MobileComponentPreview metadata={sampleMetadata} />)

    expect(screen.getByText('Subcomponents:')).toBeInTheDocument()
    expect(screen.getByText('ButtonIcon, ButtonText')).toBeInTheDocument()
  })

  it('displays dependencies when available', () => {
    render(<MobileComponentPreview metadata={sampleMetadata} />)

    expect(screen.getByText('Dependencies:')).toBeInTheDocument()
    expect(screen.getByText('nativewind')).toBeInTheDocument()
  })

  it('switches to code tab when clicked', async () => {
    const user = userEvent.setup()
    render(<MobileComponentPreview metadata={sampleMetadata} />)

    const codeTab = screen.getByRole('tab', { name: /example/i })
    await user.click(codeTab)

    expect(codeTab).toHaveAttribute('data-state', 'active')
    expect(screen.getByText('Basic Button')).toBeInTheDocument()
  })

  it('shows template tab when templateCode is provided', () => {
    render(<MobileComponentPreview metadata={sampleMetadata} templateCode={sampleTemplateCode} />)

    expect(screen.getByRole('tab', { name: /react native/i })).toBeInTheDocument()
  })

  it('does not show template tab when templateCode is not provided', () => {
    render(<MobileComponentPreview metadata={sampleMetadata} />)

    expect(screen.queryByRole('tab', { name: /react native/i })).not.toBeInTheDocument()
  })

  it('displays template code when template tab is clicked', async () => {
    const user = userEvent.setup()
    render(<MobileComponentPreview metadata={sampleMetadata} templateCode={sampleTemplateCode} />)

    const templateTab = screen.getByRole('tab', { name: /react native/i })
    await user.click(templateTab)

    expect(screen.getByText(/Full React Native implementation/)).toBeInTheDocument()
  })

  it('shows copy button on code blocks', async () => {
    const user = userEvent.setup()
    render(<MobileComponentPreview metadata={sampleMetadata} />)

    // Switch to code tab
    const codeTab = screen.getByRole('tab', { name: /example/i })
    await user.click(codeTab)

    // Wait for code blocks to render
    await waitFor(() => {
      expect(screen.getByText('Basic Button')).toBeInTheDocument()
    })

    // Copy button should be present (hidden until hover, but in DOM)
    const copyButtons = screen.getAllByLabelText('Copy code')
    expect(copyButtons.length).toBeGreaterThan(0)
  })

  it('renders children in preview area', () => {
    render(
      <MobileComponentPreview metadata={sampleMetadata}>
        <div data-testid="preview-content">Test Content</div>
      </MobileComponentPreview>
    )

    expect(screen.getByTestId('preview-content')).toBeInTheDocument()
  })

  it('toggles props table when header is clicked', async () => {
    const user = userEvent.setup()
    render(<MobileComponentPreview metadata={sampleMetadata} />)

    // Props table should be expanded by default
    expect(screen.getByText('variant')).toBeInTheDocument()

    // Click to collapse
    const propsHeader = screen.getByText('Props (3)')
    await user.click(propsHeader)

    // Props should be hidden
    expect(screen.queryByText('Button style variant')).not.toBeInTheDocument()
  })

  it('displays correct device label for iPhone', () => {
    render(<MobileComponentPreview metadata={sampleMetadata} defaultDevice="iphone" />)

    expect(screen.getByText('iPhone 14')).toBeInTheDocument()
  })

  it('displays correct device label for Android', () => {
    render(<MobileComponentPreview metadata={sampleMetadata} defaultDevice="android" />)

    expect(screen.getByText('Pixel 7')).toBeInTheDocument()
  })

  it('does not display device label when no frame selected', () => {
    render(<MobileComponentPreview metadata={sampleMetadata} defaultDevice="none" />)

    expect(screen.queryByText('iPhone 14')).not.toBeInTheDocument()
    expect(screen.queryByText('Pixel 7')).not.toBeInTheDocument()
    // When device is 'none', there's no device label shown below the frame
    // The "None" button is visible in the device selector
    expect(screen.getByText('None')).toBeInTheDocument()
  })
})

describe('CodeOnlyPreview', () => {
  it('renders component name', () => {
    render(<CodeOnlyPreview metadata={sampleMetadata} />)

    // Component name appears in header and code-only message
    const nameElements = screen.getAllByText('Button')
    expect(nameElements.length).toBeGreaterThan(0)
  })

  it('shows code-only preview message', () => {
    render(<CodeOnlyPreview metadata={sampleMetadata} />)

    expect(screen.getByText('Code-only preview')).toBeInTheDocument()
  })

  it('hides device selector', () => {
    render(<CodeOnlyPreview metadata={sampleMetadata} />)

    expect(screen.queryByText('Device:')).not.toBeInTheDocument()
  })

  it('hides theme toggle', () => {
    render(<CodeOnlyPreview metadata={sampleMetadata} />)

    expect(screen.queryByText('Theme:')).not.toBeInTheDocument()
  })

  it('still displays code examples', async () => {
    const user = userEvent.setup()
    render(<CodeOnlyPreview metadata={sampleMetadata} />)

    const codeTab = screen.getByRole('tab', { name: /example/i })
    await user.click(codeTab)

    expect(screen.getByText('Basic Button')).toBeInTheDocument()
  })
})

describe('Platform Badge Colors', () => {
  it('displays green badge for mobile platform', () => {
    render(<MobileComponentPreview metadata={{ ...sampleMetadata, platform: 'mobile' }} />)

    const badge = screen.getByText('mobile')
    expect(badge).toHaveClass('bg-green-100')
  })

  it('displays purple badge for universal platform', () => {
    render(<MobileComponentPreview metadata={{ ...sampleMetadata, platform: 'universal' }} />)

    const badge = screen.getByText('universal')
    expect(badge).toHaveClass('bg-purple-100')
  })

  it('displays blue badge for web platform', () => {
    render(<MobileComponentPreview metadata={{ ...sampleMetadata, platform: 'web' }} />)

    const badge = screen.getByText('web')
    expect(badge).toHaveClass('bg-blue-100')
  })
})
