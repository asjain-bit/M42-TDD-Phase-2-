import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SendInternalModal } from './SendInternalModal'
import { DEFAULT_INTERNAL_INTERESTS } from '@/types/partnership.types'

const renderModal = () => {
  const onSend = vi.fn()
  const onClose = vi.fn()
  render(
    <SendInternalModal members={DEFAULT_INTERNAL_INTERESTS} onSend={onSend} onClose={onClose} />
  )
  return { onSend, onClose }
}

const next = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Next' }))

describe('SendInternalModal', () => {
  it('shows the questionnaire first, without the reviewers', () => {
    renderModal()
    expect(screen.getByRole('dialog', { name: 'Select questionnaire' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Version')).not.toBeInTheDocument()
    expect(screen.getByText(/Step 1 of 2/)).toBeInTheDocument()
    expect(screen.getByLabelText('Questionnaire')).toHaveValue('internal-evaluation')
    expect(
      screen.getByLabelText('Questionnaire').parentElement?.parentElement?.className
    ).toContain('w-full')
    expect(screen.getByText('(5 questions)')).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Riza Sayeed' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Send Request' })).not.toBeInTheDocument()
  })

  it('scrolls inside the popup instead of growing it', () => {
    renderModal()
    const dialog = screen.getByRole('dialog')
    expect(dialog.className).toContain('max-h-[90vh]')
    expect(dialog.querySelector('.overflow-y-auto')).not.toBeNull()
  })

  it('titles step 2 Select reviewers', async () => {
    const user = userEvent.setup()
    renderModal()
    await next(user)
    expect(screen.getByRole('dialog', { name: 'Select reviewers' })).toBeInTheDocument()
  })

  it('swaps to the reviewers once the questions are set, with no note', async () => {
    const user = userEvent.setup()
    renderModal()
    await next(user)
    expect(screen.getByText(/Step 2 of 2/)).toBeInTheDocument()
    expect(screen.getByText('(5 selected)')).toBeInTheDocument()
    expect(screen.queryByLabelText('Questionnaire')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Note to Internal Interest')).not.toBeInTheDocument()
    expect(
      screen.getByText(/^Responses due by .+\. Late responses are still accepted\.$/)
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByLabelText('Questionnaire')).toBeInTheDocument()
  })

  it('sends straight away with no extra confirmation, with the chosen reviewers and questions', async () => {
    const user = userEvent.setup()
    const { onSend } = renderModal()
    await user.selectOptions(screen.getByLabelText('Questionnaire'), 'technical')
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.click(screen.getByRole('button', { name: 'Delete question 3' }))
    await next(user)
    await user.click(screen.getByRole('checkbox', { name: 'Riza Sayeed' }))

    await user.click(screen.getByRole('button', { name: 'Send Request' }))
    expect(screen.queryByRole('dialog', { name: 'Send to Internal Interest?' })).toBeNull()

    expect(onSend).toHaveBeenCalledTimes(1)
    const payload = onSend.mock.calls[0][0]
    expect(payload.memberIds).toHaveLength(4)
    expect(payload.memberIds).not.toContain('int-1')
    expect(payload.questionnaire.name).toBe('Technical Questionnaire')
    expect(payload.questionnaire.questions).toHaveLength(2)
    // Deleting a question saved a second version
    expect(payload.questionnaire.version).toBe(2)
  })

  it('cannot move on without questions or send without reviewers', async () => {
    const user = userEvent.setup()
    renderModal()
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    for (let i = 5; i >= 1; i--) {
      await user.click(screen.getByRole('button', { name: `Delete question ${i}` }))
    }
    expect(screen.getByText('Add at least one question.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add question' }))
    const dialog = screen.getByRole('dialog', { name: 'Add new question' })
    await user.type(within(dialog).getByLabelText(/Question text/), 'Is it safe?')
    await user.type(within(dialog).getByLabelText(/Response cue/), 'Yes or no')
    await user.click(within(dialog).getByRole('button', { name: 'Save question' }))
    await next(user)

    for (const m of DEFAULT_INTERNAL_INTERESTS) {
      await user.click(screen.getByRole('checkbox', { name: m.name }))
    }
    expect(screen.getByRole('button', { name: 'Send Request' })).toBeDisabled()
    expect(screen.getByText('Select at least one reviewer.')).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: 'Riza Sayeed' }))
    expect(screen.getByRole('button', { name: 'Send Request' })).toBeEnabled()
  })

  it('toggles a reviewer with the keyboard and closes with the X and Cancel', async () => {
    const user = userEvent.setup()
    const { onClose } = renderModal()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await next(user)
    const box = screen.getByRole('checkbox', { name: 'Parag Agarwal' })
    box.focus()
    await user.keyboard(' ')
    expect(box).toHaveAttribute('aria-checked', 'false')
    await user.keyboard('{Enter}')
    expect(box).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('button', { name: 'Close send to Internal Interest' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
