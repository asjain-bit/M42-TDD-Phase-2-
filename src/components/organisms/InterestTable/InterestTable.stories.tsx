import type { Meta, StoryObj } from '@storybook/react'
import { InterestTable } from '@/components/organisms/InterestTable'
import { INITIAL_SERVICE_LINE_INTERESTS } from '@/types/partnership.types'

const meta: Meta<typeof InterestTable> = {
  title: 'Organisms/InterestTable',
  component: InterestTable,
  tags: ['autodocs'],
  args: { interests: INITIAL_SERVICE_LINE_INTERESTS, onOpen: () => {} },
}

export default meta
type Story = StoryObj<typeof InterestTable>

export const Default: Story = {}

/** The Internal Interest Team sees their own rows tagged Yours */
export const WithMine: Story = { args: { mineName: 'Hamad Al Suwaidi', selectedCode: 'SL-002' } }

export const EdgeCases: Story = { args: { interests: [] } }
