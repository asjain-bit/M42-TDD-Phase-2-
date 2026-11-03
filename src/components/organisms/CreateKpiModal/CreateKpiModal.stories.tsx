import type { Meta, StoryObj } from '@storybook/react'
import { CreateKpiModal } from '@/components/organisms/CreateKpiModal'
import { kpiValuesFor } from '@/lib/customKpi'
import { DEFAULT_ASSUMPTIONS, DEFAULT_WEEK_INDEX, USAGE_WEEKS } from '@/lib/usageInsights'

const week = USAGE_WEEKS[DEFAULT_WEEK_INDEX]

const meta: Meta<typeof CreateKpiModal> = {
  title: 'Organisms/CreateKpiModal',
  component: CreateKpiModal,
  tags: ['autodocs'],
  args: {
    values: kpiValuesFor(week, DEFAULT_ASSUMPTIONS),
    weekLabel: week.full,
    onSave: () => {},
    onClose: () => {},
  },
}

export default meta
type Story = StoryObj<typeof CreateKpiModal>

/** New KPI: Savings ÷ Output Generated to start with */
export const Default: Story = {}

export const Editing: Story = {
  args: {
    initial: {
      id: 'kpi-1',
      name: 'Saving per analyst',
      unit: '$',
      operands: [
        { kind: 'system', source: 'savings' },
        { kind: 'custom', value: 4, label: 'Analysts' },
      ],
      operators: ['÷'],
    },
  },
}

/** Dividing by an own value of 0 shows the error */
export const EdgeCases: Story = {
  args: {
    initial: {
      id: 'kpi-2',
      name: 'Broken',
      unit: 'number',
      operands: [
        { kind: 'system', source: 'outputs' },
        { kind: 'custom', value: 0, label: 'Zero' },
      ],
      operators: ['÷'],
    },
  },
}
