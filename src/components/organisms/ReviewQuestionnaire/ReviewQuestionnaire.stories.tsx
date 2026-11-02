import type { Meta, StoryObj } from '@storybook/react'
import { ReviewQuestionnaire } from '@/components/organisms/ReviewQuestionnaire'
import { getQuestionnaire } from '@/types/questionnaires'

const questions = getQuestionnaire('technical').questions.slice(0, 2)
const submitted = [
  {
    questionId: questions[0].id,
    question: questions[0].text,
    cue: questions[0].cue,
    answer: 'Turnaround for chest CT is slow at both sites.',
  },
  {
    questionId: questions[1].id,
    question: questions[1].text,
    cue: questions[1].cue,
    answer: 'Report turnaround time.',
    edits: [
      {
        answer: 'Report turnaround time, today 52 hours on average.',
        reason: 'Added the baseline from the Q3 report.',
        by: 'Mariam Al-Zaabi',
        on: '24 Oct 2026',
      },
    ],
  },
]
const asQuestions = submitted.map((a) => ({
  id: a.questionId,
  text: a.question,
  cue: a.cue,
  mandatory: true,
}))

const meta: Meta<typeof ReviewQuestionnaire> = {
  title: 'Organisms/ReviewQuestionnaire',
  component: ReviewQuestionnaire,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ReviewQuestionnaire>

/** Answering for the first time */
export const Default: Story = {
  args: { questions, answers: {}, onChange: () => {}, onSubmit: () => {} },
}

/** Submitted: read-only cards, each with Edit answer and its history */
export const Submitted: Story = {
  args: {
    questions: asQuestions,
    submission: { answers: submitted, submittedOn: '22 Oct 2026' },
    onEditAnswer: () => {},
  },
}

/** The Director's View member response popup: current answers and history, no editing */
export const ReadOnlyResponse: Story = {
  args: {
    questions: asQuestions,
    readOnly: true,
    submission: { answers: submitted, submittedOn: '22 Oct 2026' },
  },
}

export const EdgeCases: Story = {
  args: {
    questions: asQuestions,
    submission: { answers: [{ ...submitted[0], answer: '' }, submitted[1]] },
    onEditAnswer: () => {},
  },
}
