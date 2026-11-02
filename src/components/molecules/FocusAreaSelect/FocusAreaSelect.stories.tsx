import type { Meta, StoryObj } from '@storybook/react'
import { FocusAreaSelect } from '@/components/molecules/FocusAreaSelect'

const meta: Meta<typeof FocusAreaSelect> = {
  title: 'Molecules/FocusAreaSelect',
  component: FocusAreaSelect,
  tags: ['autodocs'],
  args: { id: 'focus', onChange: () => {} },
}

export default meta
type Story = StoryObj<typeof FocusAreaSelect>

export const Default: Story = { args: { value: [] } }

export const Selected: Story = { args: { value: ['AI & Diagnostics', 'Medical Imaging'] } }

export const EdgeCases: Story = {
  args: {
    value: ['Cardiology & Precision Health', 'Virtual Care & Remote Monitoring', 'Rare Diseases'],
    error: true,
  },
}
