import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { DocumentFileCard } from './DocumentFileCard'

describe('DocumentFileCard', () => {
  it('shows the file and opens the preview', async () => {
    const user = userEvent.setup()
    const onPreview = vi.fn()
    render(<DocumentFileCard fileName="summary.pdf" meta="Meeting summary" onPreview={onPreview} />)
    expect(screen.getByText('summary.pdf')).toBeInTheDocument()
    expect(screen.getByText('Meeting summary')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Preview/ }))
    expect(onPreview).toHaveBeenCalled()
  })
})
