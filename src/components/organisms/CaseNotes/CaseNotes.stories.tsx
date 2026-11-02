import type { Meta, StoryObj } from '@storybook/react'
import { CaseNotes } from '@/components/organisms/CaseNotes'
import { INITIAL_PARTNERSHIP_REQUESTS } from '@/types/partnership.types'

const [medTech, alphaHealth, genomicX, carePulse] = INITIAL_PARTNERSHIP_REQUESTS

const meta: Meta<typeof CaseNotes> = {
  title: 'Organisms/CaseNotes',
  component: CaseNotes,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { onClose: () => {}, onSaveNote: () => {} },
  argTypes: {
    showAssessment: { control: 'boolean' },
    canEditNotes: { control: 'boolean' },
    defaultExpanded: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof CaseNotes>

/** Collapsed: header, headline and the four facts */
export const Default: Story = {
  args: { request: medTech, status: 'Pending', showAssessment: true },
}

/** Expanded into the one-slide brief */
export const Expanded: Story = {
  args: { request: genomicX, status: 'Pending', showAssessment: true, defaultExpanded: true },
}

/** Internal Interest and Strategy see no assessment summary */
export const WithoutAssessment: Story = {
  args: { request: alphaHealth, status: 'In Progress', defaultExpanded: true },
}

export const EdgeCases: Story = {
  args: {
    request: { ...carePulse, summaryNote: undefined, sponsors: undefined },
    status: 'Closed',
    showAssessment: true,
    defaultExpanded: true,
  },
}
