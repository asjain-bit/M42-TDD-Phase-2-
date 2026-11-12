import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SendInternalModal } from './SendInternalModal'
import { DEFAULT_INTERNAL_INTERESTS } from '@/types/partnership.types'

const renderModal = (members = DEFAULT_INTERNAL_INTERESTS) => {
  const onSend = vi.fn()
  const onClose = vi.fn()
  render(<SendInternalModal members={members} onSend={onSend} onClose={onClose} />)
  return { onSend, onClose }
}

describe('SendInternalModal', () => {
  it('shows the questionnaire, with Send Request instead of Next', () => {
    renderModal()
    expect(screen.getByRole('dialog', { name: 'Select questionnaire' })).toBeInTheDocument()
    expect(screen.getByLabelText('Questionnaire')).toHaveValue('internal-evaluation')
    expect(screen.getByText('(5 questions)')).toBeInTheDocument()
    expect(screen.queryByText(/Step 1 of 2/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Riza Sayeed' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send Request' })).toBeEnabled()
    expect(
      screen.getByText(/^Responses due by .+\. Late responses are still accepted\.$/)
    ).toBeInTheDocument()
  })

  it('scrolls inside the popup instead of growing it', () => {
    renderModal()
    const dialog = screen.getByRole('dialog')
    expect(dialog.className).toContain('max-h-[90vh]')
    expect(dialog.querySelector('.overflow-y-auto')).not.toBeNull()
  })

  it('sends to everyone listed, with the chosen questions', async () => {
    const user = userEvent.setup()
    const { onSend } = renderModal()
    await user.selectOptions(screen.getByLabelText('Questionnaire'), 'technical')
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.click(screen.getByRole('button', { name: 'Delete question 3' }))

    await user.click(screen.getByRole('button', { name: 'Send Request' }))
    expect(onSend).toHaveBeenCalledTimes(1)
    const payload = onSend.mock.calls[0][0]
    expect(payload.memberIds).toHaveLength(5)
    expect(payload.questionnaire.name).toBe('Technical Questionnaire')
    expect(payload.questionnaire.questions).toHaveLength(2)
    // Deleting a question saved a second version
    expect(payload.questionnaire.version).toBe(2)
  })

  it('cannot send without questions, or without anyone to send to', async () => {
    const user = userEvent.setup()
    renderModal()
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    for (let i = 5; i >= 1; i--) {
      await user.click(screen.getByRole('button', { name: `Delete question ${i}` }))
    }
    expect(screen.getByText('Add at least one question.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send Request' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Add question' }))
    const dialog = screen.getByRole('dialog', { name: 'Add new question' })
    await user.type(within(dialog).getByLabelText(/Question text/), 'Is it safe?')
    await user.type(within(dialog).getByLabelText(/Response cue/), 'Yes or no')
    await user.click(within(dialog).getByRole('button', { name: 'Save question' }))
    expect(screen.getByRole('button', { name: 'Send Request' })).toBeEnabled()
  })

  it('closes with the X and Cancel', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.click(screen.getByRole('button', { name: 'Close send to Internal Interest' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
