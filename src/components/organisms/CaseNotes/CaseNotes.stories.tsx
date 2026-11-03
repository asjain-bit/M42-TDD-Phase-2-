import type { Meta, StoryObj } from '@storybook/react'
import { CaseNotes } from '@/components/organisms/CaseNotes'
import { INITIAL_PARTNERSHIP_REQUESTS } from '@/types/partnership.types'

const [medTech, , genomicX, carePulse] = INITIAL_PARTNERSHIP_REQUESTS

const meta: Meta<typeof CaseNotes> = {
  title: 'Organisms/CaseNotes',
  component: CaseNotes,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { onClose: () => {}, onAddNote: () => {} },
  argTypes: {
    canAddNotes: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof CaseNotes>

/** The composer and the notes log, newest first */
export const Default: Story = {
  args: { request: medTech, status: 'Pending' },
}

/** Three notes, one of them by the Triage Agent */
export const ManyNotes: Story = {
  args: { request: genomicX, status: 'In Progress' },
}

/** Read-only, and a case with no notes yet */
export const EdgeCases: Story = {
  args: { request: { ...carePulse, notes: undefined }, status: 'Closed', canAddNotes: false },
}
