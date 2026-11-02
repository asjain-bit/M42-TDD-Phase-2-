import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { AnswerHistory } from './AnswerHistory'

const answer = {
  questionId: 'q1',
  question: 'Problem?',
  cue: '',
  answer: 'First',
  edits: [
    { answer: 'Second', reason: 'More detail', by: 'Mariam Al-Zaabi', on: '24 Oct 2026' },
    { answer: 'Third', reason: 'Typo', by: 'Mariam Al-Zaabi', on: '25 Oct 2026' },
  ],
}

describe('AnswerHistory', () => {
  it('renders nothing for an answer that was never edited', () => {
    const { container } = render(<AnswerHistory answer={{ ...answer, edits: undefined }} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the Edited chip and expands the original and every change, oldest first', async () => {
    const user = userEvent.setup()
    render(<AnswerHistory answer={answer} originalOn="22 Oct 2026" />)
    expect(screen.getByText('Edited')).toBeInTheDocument()
    const toggle = screen.getByRole('button', { name: 'View original and changes (2)' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('list')).not.toBeInTheDocument()

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const timeline = screen.getByRole('list', { name: 'Original answer and changes' })
    expect(toggle).toHaveAttribute('aria-controls', timeline.id)
    const items = within(timeline).getAllByRole('listitem')
    expect(items.map((li) => li.textContent)).toEqual([
      'Original · 22 Oct 2026First',
      'Edit 1 · Mariam Al-Zaabi · 24 Oct 2026SecondReason: More detail',
      'Edit 2 · Mariam Al-Zaabi · 25 Oct 2026ThirdReason: Typo',
    ])
  })

  it('can leave the chip out', () => {
    render(<AnswerHistory answer={answer} hideChip />)
    expect(screen.queryByText('Edited')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /View original/ })).toBeInTheDocument()
  })
})
