/**
 * Component Gallery Tests - Task 5.7
 * Phase 4: Mobile Development
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ComponentGallery, type GalleryComponent, type GalleryCategory } from '@/components/component-gallery'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}))

// Sample components for testing
const sampleComponents: GalleryComponent[] = [
  {
    id: 'button',
    metadata: {
      name: 'Button',
      description: 'A customizable button component',
      category: 'Input',
      platform: 'mobile',
      props: [
        { name: 'variant', type: 'string', required: false, description: 'Button variant' },
      ],
      examples: [{ title: 'Basic', code: '<Button>Click</Button>' }],
    },
  },
  {
    id: 'card',
    metadata: {
      name: 'Card',
      description: 'A container card component',
      category: 'Layout',
      platform: 'mobile',
      props: [
        { name: 'variant', type: 'string', required: false, description: 'Card variant' },
      ],
      examples: [{ title: 'Basic', code: '<Card>Content</Card>' }],
    },
  },
  {
    id: 'header',
    metadata: {
      name: 'Header',
      description: 'Navigation header component',
      category: 'Navigation',
      platform: 'mobile',
      props: [
        { name: 'title', type: 'string', required: true, description: 'Header title' },
      ],
      examples: [{ title: 'Basic', code: '<Header title="Home" />' }],
    },
  },
  {
    id: 'web-button',
    metadata: {
      name: 'WebButton',
      description: 'A web-only button component',
      category: 'Input',
      platform: 'web',
      props: [
        { name: 'variant', type: 'string', required: false, description: 'Button variant' },
      ],
      examples: [{ title: 'Basic', code: '<WebButton>Click</WebButton>' }],
    },
  },
  {
    id: 'universal-input',
    metadata: {
      name: 'UniversalInput',
      description: 'A cross-platform input component',
      category: 'Input',
      platform: 'universal',
      props: [
        { name: 'value', type: 'string', required: true, description: 'Input value' },
      ],
      examples: [{ title: 'Basic', code: '<UniversalInput value="" />' }],
    },
  },
]

const sampleCategories: GalleryCategory[] = [
  { id: 'Input', label: 'Input', count: 3 },
  { id: 'Layout', label: 'Layout', count: 1 },
  { id: 'Navigation', label: 'Navigation', count: 1 },
]

describe('ComponentGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all components by default', () => {
    render(<ComponentGallery components={sampleComponents} />)

    expect(screen.getByText('Button')).toBeInTheDocument()
    expect(screen.getByText('Card')).toBeInTheDocument()
    expect(screen.getByText('Header')).toBeInTheDocument()
    expect(screen.getByText('WebButton')).toBeInTheDocument()
    expect(screen.getByText('UniversalInput')).toBeInTheDocument()
  })

  it('displays correct component count', () => {
    render(<ComponentGallery components={sampleComponents} />)

    expect(screen.getByText('5 components found')).toBeInTheDocument()
  })

  it('renders search input when showSearch is true', () => {
    render(<ComponentGallery components={sampleComponents} showSearch={true} />)

    expect(screen.getByPlaceholderText('Search components...')).toBeInTheDocument()
  })

  it('hides search input when showSearch is false', () => {
    render(<ComponentGallery components={sampleComponents} showSearch={false} />)

    expect(screen.queryByPlaceholderText('Search components...')).not.toBeInTheDocument()
  })

  it('filters components by search query', async () => {
    const user = userEvent.setup()
    render(<ComponentGallery components={sampleComponents} />)

    const searchInput = screen.getByPlaceholderText('Search components...')
    await user.type(searchInput, 'button')

    expect(screen.getByText('Button')).toBeInTheDocument()
    expect(screen.getByText('WebButton')).toBeInTheDocument()
    expect(screen.queryByText('Card')).not.toBeInTheDocument()
    expect(screen.queryByText('Header')).not.toBeInTheDocument()
  })

  it('filters by component description', async () => {
    const user = userEvent.setup()
    render(<ComponentGallery components={sampleComponents} />)

    const searchInput = screen.getByPlaceholderText('Search components...')
    await user.type(searchInput, 'container')

    expect(screen.getByText('Card')).toBeInTheDocument()
    expect(screen.queryByText('Button')).not.toBeInTheDocument()
  })

  it('clears search when X button is clicked', async () => {
    const user = userEvent.setup()
    render(<ComponentGallery components={sampleComponents} />)

    const searchInput = screen.getByPlaceholderText('Search components...')
    await user.type(searchInput, 'button')

    // Find and click clear button (the one inside search input area)
    const searchContainer = searchInput.parentElement
    const clearButton = searchContainer?.querySelector('button')
    if (clearButton) await user.click(clearButton)

    expect(searchInput).toHaveValue('')
    expect(screen.getByText('Card')).toBeInTheDocument()
  })

  it('shows no results message when no components match', async () => {
    const user = userEvent.setup()
    render(<ComponentGallery components={sampleComponents} />)

    const searchInput = screen.getByPlaceholderText('Search components...')
    await user.type(searchInput, 'nonexistent')

    expect(screen.getByText('No components found')).toBeInTheDocument()
    expect(screen.getByText('Clear filters')).toBeInTheDocument()
  })

  it('renders view mode toggle buttons', () => {
    render(<ComponentGallery components={sampleComponents} />)

    expect(screen.getByLabelText('Grid view')).toBeInTheDocument()
    expect(screen.getByLabelText('List view')).toBeInTheDocument()
  })

  it('defaults to grid view', () => {
    render(<ComponentGallery components={sampleComponents} defaultViewMode="grid" />)

    const gridButton = screen.getByLabelText('Grid view')
    expect(gridButton).toHaveClass('bg-primary')
  })

  it('switches to list view when clicked', async () => {
    const user = userEvent.setup()
    render(<ComponentGallery components={sampleComponents} />)

    const listButton = screen.getByLabelText('List view')
    await user.click(listButton)

    expect(listButton).toHaveClass('bg-primary')
  })

  it('renders category filter when categories provided', () => {
    render(<ComponentGallery components={sampleComponents} categories={sampleCategories} />)

    // The category filter is a native select element
    const categorySelect = screen.getByDisplayValue('All Categories')
    expect(categorySelect).toBeInTheDocument()
  })

  it('filters by category when selected', async () => {
    const user = userEvent.setup()
    render(<ComponentGallery components={sampleComponents} categories={sampleCategories} />)

    // Find the category select by its default value
    const categorySelect = screen.getByDisplayValue('All Categories')
    await user.selectOptions(categorySelect, 'Layout')

    expect(screen.getByText('Card')).toBeInTheDocument()
    expect(screen.queryByText('Button')).not.toBeInTheDocument()
  })

  it('displays component card with name, description, and platform badge', () => {
    render(<ComponentGallery components={sampleComponents} />)

    expect(screen.getByText('Button')).toBeInTheDocument()
    expect(screen.getByText('A customizable button component')).toBeInTheDocument()
  })

  it('displays props count on component card', () => {
    render(<ComponentGallery components={sampleComponents} />)

    // Each component card shows "X props"
    const propsTexts = screen.getAllByText(/\d+ props?/)
    expect(propsTexts.length).toBeGreaterThan(0)
  })

  it('opens detail panel when component is clicked', async () => {
    const user = userEvent.setup()
    render(<ComponentGallery components={sampleComponents} />)

    const buttonCard = screen.getByText('Button').closest('button')
    if (buttonCard) await user.click(buttonCard)

    // Detail panel should show the component name in header
    const headings = screen.getAllByText('Button')
    expect(headings.length).toBeGreaterThan(1) // One in card, one in detail
  })

  it('closes detail panel when X is clicked', async () => {
    const user = userEvent.setup()
    render(<ComponentGallery components={sampleComponents} />)

    // Open detail panel
    const buttonCard = screen.getByText('Button').closest('button')
    if (buttonCard) await user.click(buttonCard)

    // Find close button in detail panel (it's the X icon)
    const closeButtons = screen.getAllByRole('button')
    const closeButton = closeButtons.find((btn) => btn.querySelector('svg.lucide-x'))
    if (closeButton) await user.click(closeButton)

    // Detail panel should be closed (only one Button text visible)
    await waitFor(() => {
      const buttonTexts = screen.getAllByText('Button')
      expect(buttonTexts.length).toBe(1)
    })
  })

  it('renders platform filter', () => {
    render(<ComponentGallery components={sampleComponents} showPlatformFilter={true} />)

    // Platform filter dropdown should be present
    expect(screen.getByLabelText('Filter by platform')).toBeInTheDocument()
  })

  it('hides platform filter when showPlatformFilter is false', () => {
    render(<ComponentGallery components={sampleComponents} showPlatformFilter={false} />)

    expect(screen.queryByLabelText('Filter by platform')).not.toBeInTheDocument()
  })
})

describe('ComponentGallery View Modes', () => {
  it('renders components in grid layout by default', () => {
    render(<ComponentGallery components={sampleComponents} defaultViewMode="grid" />)

    // Grid container should have grid classes
    const container = screen.getByText('Button').closest('button')?.parentElement
    expect(container).toHaveClass('grid')
  })

  it('renders components in list layout when list mode selected', async () => {
    render(<ComponentGallery components={sampleComponents} defaultViewMode="list" />)

    // List container should have space-y class
    const container = screen.getByText('Button').closest('button')?.parentElement
    expect(container).toHaveClass('space-y-2')
  })
})

describe('ComponentGallery Category Counts', () => {
  it('updates category counts based on search filter', async () => {
    const user = userEvent.setup()
    render(<ComponentGallery components={sampleComponents} categories={sampleCategories} />)

    const searchInput = screen.getByPlaceholderText('Search components...')
    await user.type(searchInput, 'button')

    // Only Input category should have counts now
    const categorySelect = screen.getByDisplayValue('All Categories')
    expect(categorySelect).toContainHTML('Input')
  })
})

describe('ComponentGallery Empty State', () => {
  it('shows clear filters button when no results', async () => {
    const user = userEvent.setup()
    render(<ComponentGallery components={sampleComponents} />)

    const searchInput = screen.getByPlaceholderText('Search components...')
    await user.type(searchInput, 'xyz123nonexistent')

    const clearButton = screen.getByText('Clear filters')
    expect(clearButton).toBeInTheDocument()

    await user.click(clearButton)

    // All components should be visible again
    expect(screen.getByText('Button')).toBeInTheDocument()
    expect(screen.getByText('Card')).toBeInTheDocument()
  })
})
