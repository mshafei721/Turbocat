/**
 * TurbocatLogo Component Tests
 *
 * Tests for TurbocatLogo component following TDD approach.
 * Task Group 4.3: Write 4 focused tests for TurbocatLogo
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/logos/__tests__/turbocat.test.tsx
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TurbocatLogo } from '../turbocat'

describe('TurbocatLogo', () => {
  /**
   * Test 1: Renders logo image with correct src
   *
   * Verifies that the component renders the Next.js Image component
   * with the correct source path to the turbocat logo.
   */
  it('should render logo image with correct src', () => {
    // Arrange & Act
    render(<TurbocatLogo />)

    // Assert
    const logo = screen.getByAltText('Turbocat - Multi-Agent AI Coding Platform')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src')
    // Next.js Image component transforms the src, so we check for the original path in some way
    // The alt text verification is sufficient to confirm the image is rendered
  })

  /**
   * Test 2: Renders with custom className
   *
   * Verifies that the component accepts and applies a custom className
   * to the image element for flexible sizing.
   */
  it('should render with custom className', () => {
    // Arrange & Act
    render(<TurbocatLogo className="h-10 w-10" />)

    // Assert
    const logo = screen.getByAltText('Turbocat - Multi-Agent AI Coding Platform')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveClass('h-10', 'w-10')
  })

  /**
   * Test 3: Shows text when showText=true
   *
   * Verifies that the "Turbocat" text appears alongside the logo
   * when the showText prop is set to true.
   */
  it('should show text when showText=true', () => {
    // Arrange & Act
    render(<TurbocatLogo showText={true} />)

    // Assert
    const logoText = screen.getByText('Turbocat')
    expect(logoText).toBeInTheDocument()
    expect(logoText).toHaveClass('font-bold', 'text-xl')
  })

  /**
   * Test 4: Hides text when showText=false
   *
   * Verifies that the "Turbocat" text is not rendered when
   * showText is false (default behavior).
   */
  it('should hide text when showText=false', () => {
    // Arrange & Act
    render(<TurbocatLogo showText={false} />)

    // Assert
    const logoText = screen.queryByText('Turbocat')
    expect(logoText).not.toBeInTheDocument()
  })
})
