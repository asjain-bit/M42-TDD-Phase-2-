import type { Meta, StoryObj } from '@storybook/react'
import { StageChip } from '@/components/molecules/StageChip'
import { WORKFLOW_STAGES, type StageProgress } from '@/lib/caseActions'

const active = (index: number): StageProgress => ({
  label: WORKFLOW_STAGES[index - 1],
  index,
  total: 6,
  kind: 'active',
  reached: index,
})

const meta: Meta<typeof StageChip> = {
  title: 'Molecules/StageChip',
  component: StageChip,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof StageChip>

export const Default: Story = { args: { progress: active(3) } }

/** Each of the six active stages */
export const ActiveStages: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <StageChip key={i} progress={active(i)} />
      ))}
    </div>
  ),
}

export const Closed: Story = {
  args: { progress: { label: 'Closed', index: null, total: 6, kind: 'closed', reached: 2 } },
}

export const Exited: Story = {
  args: { progress: { label: 'Exited', index: null, total: 6, kind: 'exited', reached: 1 } },
}

export const Routed: Story = {
  render: () => (
    <div className="flex flex-col gap-5">
      <StageChip
        progress={{
          label: 'Routed to Procurement',
          index: null,
          total: 6,
          kind: 'routed',
          reached: 1,
        }}
      />
      <StageChip
        progress={{
          label: 'Routed to Corporate Development',
          index: null,
          total: 6,
          kind: 'routed',
          reached: 1,
        }}
      />
    </div>
  ),
}

/** Stretched to its container, as in the Case notes panel */
export const FullWidth: Story = {
  render: () => (
    <div className="w-[32rem] flex flex-col gap-5">
      <StageChip progress={active(5)} fullWidth />
      <StageChip
        progress={{ label: 'Exited', index: null, total: 6, kind: 'exited', reached: 1 }}
        fullWidth
      />
    </div>
  ),
}

/** Every kind side by side, as in the table */
export const EdgeCases: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6 items-start">
      <StageChip progress={active(6)} />
      <StageChip
        progress={{ label: 'Closed', index: null, total: 6, kind: 'closed', reached: 6 }}
      />
      <StageChip
        progress={{ label: 'Exited', index: null, total: 6, kind: 'exited', reached: 1 }}
      />
      <StageChip
        progress={{
          label: 'Routed to Procurement',
          index: null,
          total: 6,
          kind: 'routed',
          reached: 1,
        }}
      />
    </div>
  ),
}
