import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { ManageQuestionnairesModal } from './ManageQuestionnairesModal'
import { getLibrary, resetLibrary } from '@/types/questionnaires'

afterEach(resetLibrary)

const addQuestion = async (
  user: ReturnType<typeof userEvent.setup>,
  text: string,
  required: boolean
) => {
  await user.click(screen.getByRole('button', { name: 'Add question' }))
  const dialog = screen.getByRole('dialog', { name: 'Add new question' })
  await user.type(within(dialog).getByLabelText(/Question text/), text)
  await user.type(within(dialog).getByLabelText(/Response cue/), 'Be specific')
  const box = within(dialog).getByRole('checkbox', { name: 'Required question' })
  if (
    box.getAttribute('aria-checked') === 'true' ||
    (box as HTMLInputElement).checked !== required
  ) {
    await user.click(box)
  }
  await user.click(within(dialog).getByRole('button', { name: 'Save question' }))
}

describe('ManageQuestionnairesModal', () => {
  it('has an Add new questionnaire tab and an All questionnaires tab', () => {
    render(<ManageQuestionnairesModal onClose={vi.fn()} />)
    expect(screen.getByRole('tab', { name: 'Add new questionnaire' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(screen.getByRole('tab', { name: 'All questionnaires' })).toBeInTheDocument()
  })

  it('needs a name, a title and a question, then adds the questionnaire', async () => {
    const user = userEvent.setup()
    render(<ManageQuestionnairesModal onClose={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Save questionnaire' }))
    expect(screen.getByText('Enter a questionnaire title.')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Questionnaire name/)).not.toBeInTheDocument()

    const before = getLibrary().length
    await user.type(screen.getByLabelText(/Questionnaire title/), 'Procurement review')
    await addQuestion(user, 'Which contract model do you prefer?', false)
    expect(screen.getByText('Optional')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save questionnaire' }))
    expect(getLibrary()).toHaveLength(before + 1)
    expect(getLibrary().at(-1)).toMatchObject({
      name: 'Procurement review',
      title: 'Procurement review',
    })
    expect(screen.getByRole('status')).toHaveTextContent('was added')
  })

  it('edits the name and adds a question to an existing questionnaire', async () => {
    const user = userEvent.setup()
    render(<ManageQuestionnairesModal onClose={vi.fn()} />)
    await user.click(screen.getByRole('tab', { name: 'All questionnaires' }))
    await user.click(screen.getByRole('button', { name: 'Edit Technical Questionnaire' }))
    const name = screen.getByLabelText(/Questionnaire title/)
    await user.clear(name)
    await user.type(name, 'Technical Review')
    await addQuestion(user, 'Where is data hosted?', true)
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    const updated = getLibrary().find((q) => q.id === 'technical')
    expect(updated?.name).toBe('Technical Review')
    expect(updated?.questions).toHaveLength(4)
  })
  it('deletes a whole questionnaire after a red confirmation', async () => {
    const user = userEvent.setup()
    render(<ManageQuestionnairesModal onClose={vi.fn()} />)
    await user.click(screen.getByRole('tab', { name: 'All questionnaires' }))
    const before = getLibrary().length
    const trash = screen.getByRole('button', { name: 'Delete Technical Questionnaire' })
    expect(trash.className).toContain('text-red-500')
    await user.click(trash)
    const confirm = screen.getByRole('dialog', { name: 'Delete this questionnaire?' })
    // Cancel keeps it
    await user.click(within(confirm).getByRole('button', { name: 'Cancel' }))
    expect(getLibrary()).toHaveLength(before)
    await user.click(trash)
    const ok = within(screen.getByRole('dialog', { name: 'Delete this questionnaire?' })).getByRole(
      'button',
      { name: 'Delete questionnaire' }
    )
    expect(ok.className).toContain('bg-red-600')
    await user.click(ok)
    expect(getLibrary()).toHaveLength(before - 1)
    expect(getLibrary().some((q) => q.id === 'technical')).toBe(false)
    expect(screen.getByRole('status')).toHaveTextContent('was deleted')
  })
})
