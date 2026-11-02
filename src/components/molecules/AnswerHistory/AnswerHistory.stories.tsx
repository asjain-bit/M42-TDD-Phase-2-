import type { Meta, StoryObj } from '@storybook/react'
import { AnswerHistory } from '@/components/molecules/AnswerHistory'

const edited = {
  questionId: 'q1',
  question: 'What is the real problem today?',
  cue: '',
  answer: 'Radiology turnaround is slow for chest CT.',
  edits: [
    {
      answer: 'Radiology turnaround averages 52 hours for chest CT.',
      reason: 'Added the baseline from the Q3 report.',
      by: 'Mariam Al-Zaabi',
      on: '24 Oct 2026',
    },
    {
      answer: 'Radiology turnaround averages 52 hours for chest CT at two sites.',
      reason: 'Scope is two sites, not the whole network.',
      by: 'Mariam Al-Zaabi',
      on: '26 Oct 2026',
    },
  ],
}

const meta: Meta<typeof AnswerHistory> = {
  title: 'Molecules/AnswerHistory',
  component: AnswerHistory,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof AnswerHistory>

export const Default: Story = { args: { answer: edited, originalOn: '22 Oct 2026' } }

export const WithoutChip: Story = {
  args: { answer: edited, originalOn: '22 Oct 2026', hideChip: true },
}

/** An answer with no edits renders nothing */
export const EdgeCases: Story = {
  args: { answer: { ...edited, edits: [] } },
}
