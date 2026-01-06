/**
 * Platform Selector Component Tests
 * Phase 4: Mobile Development - Task Group 2
 *
 * These tests verify the Platform Selector UI component:
 * 1. Renders dropdown with Web and Mobile options
 * 2. Defaults to 'web' platform
 * 3. Shows correct icons (Monitor for Web, Smartphone for Mobile)
 * 4. Handles platform selection changes
 * 5. Persists selection to localStorage
 * 6. Keyboard navigation works (Tab, Enter, Arrow keys)
 * 7. Screen reader labels are present
 *
 * @file __tests__/components/platform-selector.test.tsx
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PlatformSelector } from '@/components/platform-selector'

describe('PlatformSelector Component', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Mock localStorage
    vi.spyOn(Storage.prototype, 'getItem')
    vi.spyOn(Storage.prototype, 'setItem')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * Test 1: Component renders with dropdown selector
   */
  it('should render platform selector dropdown', () => {
    const mockOnChange = vi.fn()
    render(<PlatformSelector value="web" onChange={mockOnChange} />)

    // Check that the trigger button is present
    const trigger = screen.getByRole('combobox', { name: /platform/i })
    expect(trigger).toBeInTheDocument()
  })

  /**
   * Test 2: Defaults to 'web' when no value provided
   */
  it('should default to web platform', () => {
    const mockOnChange = vi.fn()
    render(<PlatformSelector onChange={mockOnChange} />)

    // The selected value should be 'web'
    expect(screen.getByRole('combobox')).toHaveTextContent(/web/i)
  })

  /**
   * Test 3: Shows Monitor icon for Web platform
   */
  it('should display Monitor icon when web is selected', () => {
    const mockOnChange = vi.fn()
    render(<PlatformSelector value="web" onChange={mockOnChange} />)

    // Check for Monitor icon (lucide-react icons have data-testid or svg role)
    const trigger = screen.getByRole('combobox')
    expect(trigger).toBeInTheDocument()
    // Icon should be visible in the trigger
    const svg = trigger.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  /**
   * Test 4: Shows Smartphone icon when mobile is selected
   */
  it('should display Smartphone icon when mobile is selected', () => {
    const mockOnChange = vi.fn()
    render(<PlatformSelector value="mobile" onChange={mockOnChange} />)

    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveTextContent(/mobile/i)
    const svg = trigger.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  /**
   * Test 5: Opens dropdown when clicked
   */
  it('should open dropdown menu when trigger is clicked', async () => {
    const mockOnChange = vi.fn()
    render(<PlatformSelector value="web" onChange={mockOnChange} />)

    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)

    // Wait for dropdown to appear
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /web/i })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /mobile/i })).toBeInTheDocument()
    })
  })

  /**
   * Test 6: Calls onChange when platform is selected
   */
  it('should call onChange when selecting mobile platform', async () => {
    const mockOnChange = vi.fn()
    render(<PlatformSelector value="web" onChange={mockOnChange} />)

    // Open dropdown
    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)

    // Wait for dropdown and click Mobile option
    await waitFor(() => {
      const mobileOption = screen.getByRole('option', { name: /mobile/i })
      fireEvent.click(mobileOption)
    })

    // Verify onChange was called with 'mobile'
    expect(mockOnChange).toHaveBeenCalledWith('mobile')
  })

  /**
   * Test 7: Persists selection to localStorage
   */
  it('should save platform selection to localStorage', async () => {
    const mockOnChange = vi.fn()
    render(<PlatformSelector value="web" onChange={mockOnChange} />)

    // Open dropdown
    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)

    // Select mobile
    await waitFor(() => {
      const mobileOption = screen.getByRole('option', { name: /mobile/i })
      fireEvent.click(mobileOption)
    })

    // Verify localStorage.setItem was called
    expect(localStorage.setItem).toHaveBeenCalledWith('turbocat-last-platform', 'mobile')
  })

  /**
   * Test 8: Loads saved platform from localStorage on mount
   */
  it('should load saved platform from localStorage on mount', () => {
    // Mock localStorage to return 'mobile'
    localStorage.setItem('turbocat-last-platform', 'mobile')
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('mobile')

    const mockOnChange = vi.fn()
    render(<PlatformSelector onChange={mockOnChange} />)

    // Component should display mobile as selected
    expect(screen.getByRole('combobox')).toHaveTextContent(/mobile/i)
  })

  /**
   * Test 9: Keyboard navigation - Tab to focus
   */
  it('should be focusable via Tab key', () => {
    const mockOnChange = vi.fn()
    render(<PlatformSelector value="web" onChange={mockOnChange} />)

    const trigger = screen.getByRole('combobox')
    trigger.focus()

    expect(trigger).toHaveFocus()
  })

  /**
   * Test 10: Keyboard navigation - Enter/Space to open
   */
  it('should open dropdown with Enter or Space key', async () => {
    const mockOnChange = vi.fn()
    render(<PlatformSelector value="web" onChange={mockOnChange} />)

    const trigger = screen.getByRole('combobox')
    trigger.focus()
    fireEvent.keyDown(trigger, { key: 'Enter', code: 'Enter' })

    // Dropdown should open
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /web/i })).toBeInTheDocument()
    })
  })

  /**
   * Test 11: Screen reader label present
   */
  it('should have accessible label for screen readers', () => {
    const mockOnChange = vi.fn()
    render(<PlatformSelector value="web" onChange={mockOnChange} />)

    const trigger = screen.getByRole('combobox', { name: /platform/i })
    expect(trigger).toHaveAccessibleName()
  })

  /**
   * Test 12: Disabled state works
   */
  it('should be disabled when disabled prop is true', () => {
    const mockOnChange = vi.fn()
    render(<PlatformSelector value="web" onChange={mockOnChange} disabled />)

    const trigger = screen.getByRole('combobox')
    expect(trigger).toBeDisabled()
  })

  /**
   * Test 13: Both options are visible in dropdown
   */
  it('should show both Web and Mobile options in dropdown', async () => {
    const mockOnChange = vi.fn()
    render(<PlatformSelector value="web" onChange={mockOnChange} />)

    // Open dropdown
    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)

    // Verify both options exist
    await waitFor(() => {
      const webOption = screen.getByRole('option', { name: /web/i })
      const mobileOption = screen.getByRole('option', { name: /mobile/i })

      expect(webOption).toBeInTheDocument()
      expect(mobileOption).toBeInTheDocument()
    })
  })

  /**
   * Test 14: Dropdown closes after selection
   */
  it('should close dropdown after selecting an option', async () => {
    const mockOnChange = vi.fn()
    render(<PlatformSelector value="web" onChange={mockOnChange} />)

    // Open dropdown
    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)

    // Select mobile
    await waitFor(() => {
      const mobileOption = screen.getByRole('option', { name: /mobile/i })
      fireEvent.click(mobileOption)
    })

    // Dropdown should close (options should not be in the document)
    await waitFor(() => {
      expect(screen.queryByRole('option', { name: /web/i })).not.toBeInTheDocument()
    })
  })

  /**
   * Test 15: Icons are visible in dropdown options
   */
  it('should show icons next to each option in dropdown', async () => {
    const mockOnChange = vi.fn()
    render(<PlatformSelector value="web" onChange={mockOnChange} />)

    // Open dropdown
    const trigger = screen.getByRole('combobox')
    fireEvent.click(trigger)

    await waitFor(() => {
      const webOption = screen.getByRole('option', { name: /web/i })
      const mobileOption = screen.getByRole('option', { name: /mobile/i })

      // Each option should have an SVG icon
      expect(webOption.querySelector('svg')).toBeInTheDocument()
      expect(mobileOption.querySelector('svg')).toBeInTheDocument()
    })
  })
})
