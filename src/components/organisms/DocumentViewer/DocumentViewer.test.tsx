import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { DocumentViewer } from './DocumentViewer'

describe('DocumentViewer', () => {
  it('shows the document with its download, and closes with X or Esc', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <DocumentViewer
        fileName="summary.pdf"
        downloadHref="/x.txt"
        downloadName="summary.txt"
        contentLabel="Meeting summary"
        onClose={onClose}
      >
        <p>Key points</p>
      </DocumentViewer>
    )
    expect(screen.getByRole('dialog', { name: 'summary.pdf' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Download/ })).toHaveAttribute(
      'download',
      'summary.txt'
    )
    expect(screen.getByLabelText('Meeting summary')).toHaveTextContent('Key points')
    await user.click(screen.getByRole('button', { name: 'Close preview' }))
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
