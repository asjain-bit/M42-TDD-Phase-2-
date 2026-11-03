import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Skeleton } from './Skeleton'

describe('Skeleton', () => {
  it('renders a hidden pulsing block with the given size', () => {
    const { container } = render(<Skeleton className="h-3 w-40" />)
    const block = container.firstChild as HTMLElement
    expect(block).toHaveAttribute('aria-hidden', 'true')
    expect(block.className).toContain('animate-pulse')
    expect(block.className).toContain('h-3 w-40')
  })
})
