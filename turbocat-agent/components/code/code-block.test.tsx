/**
 * CodeBlock Component Tests
 *
 * @file D:/009_Projects_AI/Personal_Projects/Turbocat/turbocat-agent/components/code/code-block.test.tsx
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CodeBlock } from './code-block'

describe('CodeBlock', () => {
  it('renders code block with language badge', () => {
    const code = 'const x = 42;'
    render(<CodeBlock code={code} language="typescript" />)

    // Check for language badge
    expect(screen.getByText('typescript')).toBeInTheDocument()
  })

  it('renders filename when provided', () => {
    const code = 'const x = 42;'
    render(<CodeBlock code={code} language="typescript" filename="example.ts" />)

    // Check for filename
    expect(screen.getByText('example.ts')).toBeInTheDocument()
  })
})
