import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, beforeEach } from 'vitest'
import { ThemeToggle } from '@/components/atoms/ThemeToggle'
import { ThemeProvider } from '@/contexts/ThemeContext'

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('renders and stays light when clicked', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button).toBeInTheDocument()
    // The app is light only, so clicking never leaves the light theme
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('light'))
    await user.click(button)
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('light'))
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('applies size classes', () => {
    const { rerender } = render(
      <ThemeProvider>
        <ThemeToggle size="sm" />
      </ThemeProvider>
    )
    expect(screen.getByRole('button')).toHaveClass('h-8 w-8')

    rerender(
      <ThemeProvider>
        <ThemeToggle size="lg" />
      </ThemeProvider>
    )
    expect(screen.getByRole('button')).toHaveClass('h-12 w-12')
  })
})
