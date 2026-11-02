import type { Meta, StoryObj } from '@storybook/react'
import { StatusFilterChips } from '@/components/molecules/StatusFilterChips'

const chips = [
  { key: 'all', label: 'All', count: 4 },
  { key: 'Pending review', label: 'Pending review', count: 1 },
  { key: 'Approved', label: 'Approved', count: 2 },
  { key: 'Declined', label: 'Declined', count: 1 },
]

const meta: Meta<typeof StatusFilterChips> = {
  title: 'Molecules/StatusFilterChips',
  component: StatusFilterChips,
  tags: ['autodocs'],
  args: { onSelect: () => {} },
}

export default meta
type Story = StoryObj<typeof StatusFilterChips>

export const Default: Story = { args: { chips, selected: 'all' } }

export const EdgeCases: Story = {
  args: {
    chips: [...chips, { key: 'x', label: 'A very long status label', count: 0 }],
    selected: 'x',
  },
}
