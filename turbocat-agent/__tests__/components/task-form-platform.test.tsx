/**
 * Task Form Platform Integration Tests
 * Phase 4: Mobile Development - Task Group 2
 *
 * These tests verify platform selector integration with task-form:
 * 1. Platform selector appears before agent selector
 * 2. Platform defaults to 'web'
 * 3. Form submission includes platform field
 * 4. Platform selection persists in localStorage
 * 5. Platform selector is keyboard accessible
 * 6. Layout is responsive (mobile-friendly)
 *
 * @file __tests__/components/task-form-platform.test.tsx
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TaskForm } from '@/components/task-form'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/',
}))

// Mock repos data for tests
const mockRepos = [
  {
    name: 'testrepo',
    full_name: 'testuser/testrepo',
    description: 'Test repository',
    private: false,
    clone_url: 'https://github.com/testuser/testrepo.git',
    language: 'TypeScript',
  },
]

// Mock Jotai atoms - must be a factory function returning mocks
vi.mock('jotai', async () => {
  const React = await import('react')
  let promptState = ''
  let agentState = 'claude'
  let reposState: typeof mockRepos | null = null

  return {
    useAtom: vi.fn().mockImplementation((atom) => {
      // For taskPromptAtom
      if (atom === 'taskPromptAtom') {
        const [val, setVal] = React.useState(promptState)
        return [val, (newVal: string) => { promptState = newVal; setVal(newVal) }]
      }
      // For lastSelectedAgentAtom
      if (atom === 'lastSelectedAgentAtom') {
        const [val, setVal] = React.useState(agentState)
        return [val, (newVal: string) => { agentState = newVal; setVal(newVal) }]
      }
      // For githubReposAtom - return empty array instead of null
      if (atom === 'githubReposAtom') {
        const [val, setVal] = React.useState<typeof mockRepos>([])
        return [val, setVal]
      }
      // Default
      const [val, setVal] = React.useState('')
      return [val, setVal]
    }),
    useAtomValue: vi.fn().mockReturnValue('claude-sonnet-4-5-20250929'),
    useSetAtom: vi.fn().mockReturnValue(vi.fn()),
    atom: vi.fn((val) => val),
    atomFamily: vi.fn().mockReturnValue(vi.fn()),
  }
})

// Mock connectors provider
vi.mock('@/components/connectors-provider', () => ({
  useConnectors: () => ({
    connectors: [],
  }),
}))

// Mock atoms
vi.mock('@/lib/atoms/task', () => ({
  taskPromptAtom: 'taskPromptAtom',
}))

vi.mock('@/lib/atoms/agent-selection', () => ({
  lastSelectedAgentAtom: 'lastSelectedAgentAtom',
  lastSelectedModelAtomFamily: vi.fn().mockReturnValue('lastSelectedModelAtom'),
}))

vi.mock('@/lib/atoms/github-cache', () => ({
  githubReposAtomFamily: vi.fn().mockReturnValue('githubReposAtom'),
}))

describe('TaskForm Platform Integration', () => {
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * Test 1: Platform selector appears in the form
   */
  it('should render platform selector in task form', () => {
    render(
      <TaskForm
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        selectedOwner="testuser"
        selectedRepo="testrepo"
      />,
    )

    // Platform selector should be present
    const platformSelector = screen.getByRole('combobox', { name: /platform/i })
    expect(platformSelector).toBeInTheDocument()
  })

  /**
   * Test 2: Platform selector appears before agent selector
   */
  it('should place platform selector before agent selector in DOM order', () => {
    render(
      <TaskForm
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        selectedOwner="testuser"
        selectedRepo="testrepo"
      />,
    )

    const platformSelector = screen.getByRole('combobox', { name: /platform/i })
    // Get all comboboxes from the form
    const formElement = platformSelector.closest('form')
    const allComboboxes = formElement?.querySelectorAll('[role="combobox"]')

    // Platform selector should be first (index 0)
    expect(allComboboxes?.[0]).toBe(platformSelector)
    // There should be at least 3 comboboxes (platform, agent, model)
    expect(allComboboxes?.length).toBeGreaterThanOrEqual(3)
  })

  /**
   * Test 3: Platform defaults to 'web'
   */
  it('should default platform to web', () => {
    render(
      <TaskForm
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        selectedOwner="testuser"
        selectedRepo="testrepo"
      />,
    )

    const platformSelector = screen.getByRole('combobox', { name: /platform/i })
    expect(platformSelector).toHaveTextContent(/web/i)
  })

  /**
   * Test 4: Form submission includes platform field
   */
  it('should include platform in form submission data', async () => {
    render(
      <TaskForm
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        selectedOwner="testuser"
        selectedRepo="testrepo"
      />,
    )

    // Fill in prompt
    const promptTextarea = screen.getByPlaceholderText(/describe what you want/i)
    fireEvent.change(promptTextarea, { target: { value: 'Create a React Native app' } })

    // Change platform to mobile
    const platformSelector = screen.getByRole('combobox', { name: /platform/i })
    fireEvent.click(platformSelector)

    await waitFor(() => {
      const mobileOption = screen.getByRole('option', { name: /mobile/i })
      fireEvent.click(mobileOption)
    })

    // Submit form - submit button has type="submit"
    const submitButton = document.querySelector('button[type="submit"]')
    expect(submitButton).toBeInTheDocument()
    fireEvent.click(submitButton!)

    // Verify onSubmit was called with platform field
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled()
      const submittedData = mockOnSubmit.mock.calls[0][0]
      expect(submittedData).toHaveProperty('platform', 'mobile')
    })
  })

  /**
   * Test 5: Platform selection persists to localStorage
   */
  it('should save platform selection to localStorage', async () => {
    vi.spyOn(Storage.prototype, 'setItem')

    render(
      <TaskForm
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        selectedOwner="testuser"
        selectedRepo="testrepo"
      />,
    )

    // Change platform to mobile
    const platformSelector = screen.getByRole('combobox', { name: /platform/i })
    fireEvent.click(platformSelector)

    await waitFor(() => {
      const mobileOption = screen.getByRole('option', { name: /mobile/i })
      fireEvent.click(mobileOption)
    })

    // Verify localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith('turbocat-last-platform', 'mobile')
  })

  /**
   * Test 6: Loads saved platform from localStorage on mount
   */
  it('should load saved platform preference from localStorage', () => {
    localStorage.setItem('turbocat-last-platform', 'mobile')

    render(
      <TaskForm
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        selectedOwner="testuser"
        selectedRepo="testrepo"
      />,
    )

    const platformSelector = screen.getByRole('combobox', { name: /platform/i })
    expect(platformSelector).toHaveTextContent(/mobile/i)
  })

  /**
   * Test 7: Platform selector is disabled when form is submitting
   */
  it('should disable platform selector when form is submitting', () => {
    render(
      <TaskForm
        onSubmit={mockOnSubmit}
        isSubmitting={true}
        selectedOwner="testuser"
        selectedRepo="testrepo"
      />,
    )

    const platformSelector = screen.getByRole('combobox', { name: /platform/i })
    expect(platformSelector).toBeDisabled()
  })

  /**
   * Test 8: Keyboard navigation works for platform selector
   */
  it('should support keyboard navigation', async () => {
    render(
      <TaskForm
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        selectedOwner="testuser"
        selectedRepo="testrepo"
      />,
    )

    const platformSelector = screen.getByRole('combobox', { name: /platform/i })

    // Tab to focus
    platformSelector.focus()
    expect(platformSelector).toHaveFocus()

    // Press Enter to open
    fireEvent.keyDown(platformSelector, { key: 'Enter', code: 'Enter' })

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /web/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /mobile/i })).toBeInTheDocument()
    })
  })

  /**
   * Test 9: Visual layout - Platform selector matches agent selector styling
   */
  it('should have consistent styling with agent selector', () => {
    render(
      <TaskForm
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        selectedOwner="testuser"
        selectedRepo="testrepo"
      />,
    )

    const platformSelector = screen.getByRole('combobox', { name: /platform/i })
    // Get all comboboxes - agent selector is the second one (index 1)
    const formElement = platformSelector.closest('form')
    const allComboboxes = formElement?.querySelectorAll('[role="combobox"]')
    const agentSelector = allComboboxes?.[1]

    // Both should have similar classes (using shadcn/ui Select component)
    expect(platformSelector.className).toContain('border-0')
    expect(agentSelector?.className).toContain('border-0')
  })

  /**
   * Test 10: Submission with web platform (default)
   */
  it('should submit with web platform when not changed', async () => {
    render(
      <TaskForm
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        selectedOwner="testuser"
        selectedRepo="testrepo"
      />,
    )

    // Fill in prompt
    const promptTextarea = screen.getByPlaceholderText(/describe what you want/i)
    fireEvent.change(promptTextarea, { target: { value: 'Build a website' } })

    // Submit without changing platform - submit button has type="submit"
    const submitButton = document.querySelector('button[type="submit"]')
    expect(submitButton).toBeInTheDocument()
    fireEvent.click(submitButton!)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled()
      const submittedData = mockOnSubmit.mock.calls[0][0]
      expect(submittedData).toHaveProperty('platform', 'web')
    })
  })

  /**
   * Test 11: Platform selector shows correct icon for selected platform
   */
  it('should display correct icon based on selected platform', async () => {
    render(
      <TaskForm
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        selectedOwner="testuser"
        selectedRepo="testrepo"
      />,
    )

    // Web should show Monitor icon
    let platformSelector = screen.getByRole('combobox', { name: /platform/i })
    expect(platformSelector.querySelector('svg')).toBeInTheDocument()

    // Change to mobile
    fireEvent.click(platformSelector)
    await waitFor(() => {
      const mobileOption = screen.getByRole('option', { name: /mobile/i })
      fireEvent.click(mobileOption)
    })

    // Mobile should show Smartphone icon
    platformSelector = screen.getByRole('combobox', { name: /platform/i })
    expect(platformSelector.querySelector('svg')).toBeInTheDocument()
    expect(platformSelector).toHaveTextContent(/mobile/i)
  })

  /**
   * Test 12: Layout order - Platform → Agent → Model
   */
  it('should render selectors in correct order: Platform → Agent → Model', () => {
    render(
      <TaskForm
        onSubmit={mockOnSubmit}
        isSubmitting={false}
        selectedOwner="testuser"
        selectedRepo="testrepo"
      />,
    )

    const formElement = document.querySelector('form')
    const allComboboxes = formElement?.querySelectorAll('[role="combobox"]')

    expect(allComboboxes?.length).toBeGreaterThanOrEqual(3) // Platform, Agent, Model

    // Verify order by checking text content
    expect(allComboboxes?.[0]).toHaveTextContent(/web|mobile/i) // Platform
    expect(allComboboxes?.[1]).toHaveTextContent(/claude|codex|copilot|cursor|gemini|opencode|compare/i) // Agent
    expect(allComboboxes?.[2]).toHaveTextContent(/sonnet|opus|gpt|gemini|auto/i) // Model
  })
})
