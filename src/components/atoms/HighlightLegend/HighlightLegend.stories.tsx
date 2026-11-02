import type { Meta, StoryObj } from '@storybook/react'
import { HighlightLegend } from '@/components/atoms/HighlightLegend'

const meta: Meta<typeof HighlightLegend> = {
  title: 'Atoms/HighlightLegend',
  component: HighlightLegend,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof HighlightLegend>

export const Default: Story = {}

export const EdgeCases: Story = {
  render: () => (
    <div className="w-40">
      <HighlightLegend />
    </div>
  ),
}
