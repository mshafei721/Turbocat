/**
 * SuggestedPrompts Component Tests
 *
 * Tests for the SuggestedPrompts component:
 * - Rendering with suggestions
 * - API fetch behavior
 * - Loading and empty states
 * - Click handlers
 * - Authentication via credentials
 *
 * @module components/turbocat/__tests__/SuggestedPrompts.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SuggestedPrompts } from '../SuggestedPrompts'

// Mock fetch API
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('SuggestedPrompts', () => {
  const mockProjectId = 'test-project-123'
  const mockOnSelect = vi.fn()

  const mockSuggestions = [
    { id: 's1', text: 'Add dark mode', category: 'contextual' },
    { id: 's2', text: 'Add authentication', category: 'contextual' },
    { id: 's3', text: 'Improve color scheme', category: 'design' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('should render null while loading', () => {
      mockFetch.mockImplementation(
        () =>
          new Promise(() => {
            /* never resolves */
          }),
      )

      const { container } = render(<SuggestedPrompts projectId={mockProjectId} onSelect={mockOnSelect} />)

      expect(container.firstChild).toBeNull()
    })

    it('should render null when suggestions array is empty', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { suggestions: [] },
        }),
      })

      const { container } = render(<SuggestedPrompts projectId={mockProjectId} onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(container.firstChild).toBeNull()
      })
    })

    it('should render suggestions when loaded', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { suggestions: mockSuggestions },
        }),
      })

      render(<SuggestedPrompts projectId={mockProjectId} onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(screen.getByText('Suggested:')).toBeInTheDocument()
      })

      expect(screen.getByText('Add dark mode')).toBeInTheDocument()
      expect(screen.getByText('Add authentication')).toBeInTheDocument()
      expect(screen.getByText('Improve color scheme')).toBeInTheDocument()
    })

    it('should render sparkle icon', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { suggestions: mockSuggestions },
        }),
      })

      const { container } = render(<SuggestedPrompts projectId={mockProjectId} onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(screen.getByText('Suggested:')).toBeInTheDocument()
      })

      // Sparkle icon is SVG from @phosphor-icons/react
      const svgElements = container.querySelectorAll('svg')
      expect(svgElements.length).toBeGreaterThan(0)
    })

    it('should render all suggestion chips as buttons', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { suggestions: mockSuggestions },
        }),
      })

      render(<SuggestedPrompts projectId={mockProjectId} onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(screen.getByText('Add dark mode')).toBeInTheDocument()
      })

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(3)
    })
  })

  describe('API Integration', () => {
    it('should call fetch with correct URL and credentials', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { suggestions: mockSuggestions },
        }),
      })

      render(<SuggestedPrompts projectId={mockProjectId} onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })

      const expectedUrl = `http://localhost:3001/api/v1/projects/${mockProjectId}/suggestions`
      expect(mockFetch).toHaveBeenCalledWith(expectedUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    })

    it('should use NEXT_PUBLIC_API_URL env variable when available', async () => {
      const originalEnv = process.env.NEXT_PUBLIC_API_URL
      process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com'

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { suggestions: mockSuggestions },
        }),
      })

      render(<SuggestedPrompts projectId={mockProjectId} onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled()
      })

      const expectedUrl = `https://api.example.com/api/v1/projects/${mockProjectId}/suggestions`
      expect(mockFetch).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        }),
      )

      process.env.NEXT_PUBLIC_API_URL = originalEnv
    })

    it('should refetch when projectId changes', async () => {
      // Ensure env var is set for this test
      process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001'

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { suggestions: mockSuggestions },
        }),
      })

      const { rerender } = render(<SuggestedPrompts projectId="project-1" onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })

      rerender(<SuggestedPrompts projectId="project-2" onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2)
      })

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        `${backendUrl}/api/v1/projects/project-2/suggestions`,
        expect.any(Object),
      )
    })

    it('should handle fetch errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockFetch.mockRejectedValue(new Error('Network error'))

      const { container } = render(<SuggestedPrompts projectId={mockProjectId} onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch suggestions:', expect.any(Error))
      })

      // Component should return null on error
      expect(container.firstChild).toBeNull()

      consoleErrorSpy.mockRestore()
    })

    it('should handle non-ok response gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      })

      const { container } = render(<SuggestedPrompts projectId={mockProjectId} onSelect={mockOnSelect} />)

      await waitFor(() => {
        // Component should still set loading to false
        expect(container.firstChild).toBeNull()
      })
    })
  })

  describe('Click Handlers', () => {
    it('should call onSelect with suggestion text when chip is clicked', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { suggestions: mockSuggestions },
        }),
      })

      render(<SuggestedPrompts projectId={mockProjectId} onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(screen.getByText('Add dark mode')).toBeInTheDocument()
      })

      const darkModeButton = screen.getByText('Add dark mode')
      await user.click(darkModeButton)

      expect(mockOnSelect).toHaveBeenCalledWith('Add dark mode')
      expect(mockOnSelect).toHaveBeenCalledTimes(1)
    })

    it('should call onSelect with correct text for each suggestion', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { suggestions: mockSuggestions },
        }),
      })

      render(<SuggestedPrompts projectId={mockProjectId} onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(screen.getByText('Add authentication')).toBeInTheDocument()
      })

      const authButton = screen.getByText('Add authentication')
      await user.click(authButton)

      expect(mockOnSelect).toHaveBeenCalledWith('Add authentication')
    })

    it('should handle multiple clicks', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { suggestions: mockSuggestions },
        }),
      })

      render(<SuggestedPrompts projectId={mockProjectId} onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(screen.getByText('Add dark mode')).toBeInTheDocument()
      })

      const darkModeButton = screen.getByText('Add dark mode')
      await user.click(darkModeButton)
      await user.click(darkModeButton)
      await user.click(darkModeButton)

      expect(mockOnSelect).toHaveBeenCalledTimes(3)
    })
  })

  describe('Styling and Accessibility', () => {
    it('should have horizontal scroll container', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { suggestions: mockSuggestions },
        }),
      })

      const { container } = render(<SuggestedPrompts projectId={mockProjectId} onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(screen.getByText('Suggested:')).toBeInTheDocument()
      })

      const scrollContainer = container.querySelector('.overflow-x-auto')
      expect(scrollContainer).toBeInTheDocument()
    })

    it('should have proper button styling classes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { suggestions: mockSuggestions },
        }),
      })

      const { container } = render(<SuggestedPrompts projectId={mockProjectId} onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(screen.getByText('Add dark mode')).toBeInTheDocument()
      })

      const button = screen.getByText('Add dark mode')
      expect(button).toHaveClass('chip')
      expect(button).toHaveClass('rounded-full')
      expect(button).toHaveClass('bg-secondary')
    })

    it('should render buttons that are keyboard accessible', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { suggestions: mockSuggestions },
        }),
      })

      render(<SuggestedPrompts projectId={mockProjectId} onSelect={mockOnSelect} />)

      await waitFor(() => {
        expect(screen.getByText('Add dark mode')).toBeInTheDocument()
      })

      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        expect(button.tagName).toBe('BUTTON')
      })
    })
  })
})
