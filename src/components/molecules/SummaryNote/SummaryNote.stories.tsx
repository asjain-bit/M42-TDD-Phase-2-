import type { Meta, StoryObj } from '@storybook/react'
import { SummaryNote } from '@/components/molecules/SummaryNote'

const note = {
  html: 'AI diagnostic platform that flags early signs of chronic disease, proposed as a pilot in two M42 hospitals. <mark data-tone="positive">Active regional hospital deployments.</mark> <mark data-tone="attention">Clinical validation not yet reproduced on M42 data.</mark> <mark data-tone="critical">UAE data hosting is not confirmed.</mark>',
  updatedBy: 'Zaid Al Ali',
  updatedOn: '22 Oct 2026',
}

const meta: Meta<typeof SummaryNote> = {
  title: 'Molecules/SummaryNote',
  component: SummaryNote,
  tags: ['autodocs'],
  argTypes: {
    canEdit: { control: 'boolean' },
    defaultExpanded: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof SummaryNote>

export const Default: Story = {
  args: { note, canEdit: true, onSave: () => {} },
}

export const Expanded: Story = {
  args: { note, canEdit: true, defaultExpanded: true, onSave: () => {} },
}

export const ReadOnly: Story = {
  args: { note, canEdit: false, defaultExpanded: true },
}

export const EdgeCases: Story = {
  render: () => (
    <div className="flex flex-col gap-4 max-w-2xl">
      <SummaryNote canEdit onSave={() => {}} />
      <SummaryNote />
      <SummaryNote
        defaultExpanded
        note={{
          html: 'First line of a long note.\nSecond line after a break. <mark data-tone="critical">Escaped text like &lt;script&gt; stays text.</mark> <b>Other tags</b> are dropped.',
          updatedBy: 'Nadia Al-Farsi',
          updatedOn: '24 Oct 2026',
        }}
      />
    </div>
  ),
}
