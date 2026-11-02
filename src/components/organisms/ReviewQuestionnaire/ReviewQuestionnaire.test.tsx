import React, { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ReviewQuestionnaire } from './ReviewQuestionnaire'
import type { QuestionAnswerValue } from './ReviewQuestionnaire.types'
import { getQuestionnaire } from '@/types/questionnaires'

const questions = getQuestionnaire('technical').questions

const Harness = ({ onSubmit = vi.fn() }: { onSubmit?: () => void }) => {
  const [answers, setAnswers] = useState<Record<string, QuestionAnswerValue>>({})
  return (
    <ReviewQuestionnaire
      questions={questions}
      answers={answers}
      onChange={(id, patch) =>
        setAnswers((p) => ({
          ...p,
          [id]: { ...({ answer: '' } as QuestionAnswerValue), ...p[id], ...patch },
        }))
      }
      onSubmit={onSubmit}
    />
  )
}

describe('ReviewQuestionnaire', () => {
  it('shows each question with its response cue and no attachment controls', () => {
    render(<Harness />)
    expect(screen.getByText(questions[0].text)).toBeInTheDocument()
    expect(screen.getByText(questions[0].cue)).toBeInTheDocument()
    expect(screen.getByText('0 of 3 mandatory answered')).toBeInTheDocument()
    expect(screen.queryByText(/Attachment|Attach file/)).not.toBeInTheDocument()
  })

  it('needs every mandatory answer before submitting', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<Harness onSubmit={onSubmit} />)
    const submit = screen.getByRole('button', { name: 'Submit' })
    expect(submit).toBeDisabled()

    const boxes = screen.getAllByRole('textbox')
    await user.type(boxes[0], 'Clinical decision support')
    await user.type(boxes[1], 'Yes, a hazard analysis was done')
    expect(screen.getByText('2 of 3 mandatory answered')).toBeInTheDocument()
    expect(submit).toBeDisabled()
    await user.type(boxes[2], 'AES-256 with per-tenant keys')
    expect(submit).toBeEnabled()
    await user.click(submit)
    expect(onSubmit).toHaveBeenCalled()
  })

  it('lets an optional question stay blank', async () => {
    const user = userEvent.setup()
    const mixed = questions.map((q, i) => ({ ...q, mandatory: i !== 2 }))
    render(
      <ReviewQuestionnaire
        questions={mixed}
        answers={{ [mixed[0].id]: { answer: 'a' }, [mixed[1].id]: { answer: 'b' } }}
        onSubmit={vi.fn()}
      />
    )
    expect(screen.queryByText(/optional/i)).not.toBeInTheDocument()
    expect(screen.getAllByText('*')).toHaveLength(2)
    expect(screen.getByText('2 of 2 mandatory answered')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Submit' }))
  })

  it('shows a submitted response read-only in the same layout', () => {
    render(
      <ReviewQuestionnaire
        readOnly
        questions={questions}
        answers={{ [questions[0].id]: { answer: 'Clinical decision support' } }}
      />
    )
    expect(screen.getByDisplayValue('Clinical decision support')).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument()
    expect(screen.queryByText(/answered/)).not.toBeInTheDocument()
  })
})

describe('ReviewQuestionnaire after submitting', () => {
  const submitted = [
    { questionId: 'a', question: 'Problem?', cue: 'Describe it.', answer: 'Original A' },
    {
      questionId: 'b',
      question: 'KPI?',
      cue: 'Baseline.',
      answer: 'Original B',
      edits: [{ answer: 'Edited B', reason: 'Baseline', by: 'Mariam Al-Zaabi', on: '24 Oct 2026' }],
    },
  ]
  const qs = [
    { id: 'a', text: 'Problem?', cue: 'Describe it.', mandatory: true },
    { id: 'b', text: 'KPI?', cue: 'Baseline.', mandatory: true },
  ]

  it('shows each current answer read-only, with the Edited chip on changed ones', () => {
    render(
      <ReviewQuestionnaire
        questions={qs}
        submission={{ answers: submitted, submittedOn: '22 Oct 2026' }}
        readOnly
      />
    )
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByText('Original A')).toBeInTheDocument()
    expect(screen.getByText('Edited B')).toBeInTheDocument()
    expect(screen.queryByText('Original B')).not.toBeInTheDocument()
    expect(screen.getAllByText('Edited')).toHaveLength(1)
    // Read-only: no banner and no Edit answer
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit answer' })).not.toBeInTheDocument()
  })

  it('saves a change only when the answer differs and a reason is given', async () => {
    const user = userEvent.setup()
    const onEditAnswer = vi.fn()
    render(
      <ReviewQuestionnaire
        questions={qs}
        submission={{ answers: submitted, submittedOn: '22 Oct 2026' }}
        onEditAnswer={onEditAnswer}
      />
    )
    expect(screen.getByRole('status')).toHaveTextContent('Submitted on 22 Oct 2026.')
    await user.click(screen.getAllByRole('button', { name: 'Edit answer' })[1])
    const answer = screen.getByRole('textbox', { name: 'KPI?' })
    expect(answer).toHaveValue('Edited B')
    const save = screen.getByRole('button', { name: 'Save change' })
    await user.type(answer, '!')
    expect(save).toBeDisabled()
    await user.type(screen.getByRole('textbox', { name: 'Reason for change *' }), '  Typo  ')
    await user.click(save)
    expect(onEditAnswer).toHaveBeenCalledWith('b', 'Edited B!', 'Typo')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})
