import type { Meta, StoryObj } from '@storybook/react'
import { OverlapDrawer } from '@/components/organisms/OverlapDrawer'
import { findOverlaps } from '@/lib/overlaps'
import {
  EXISTING_PROJECTS,
  INITIAL_PARTNERSHIP_REQUESTS,
  INITIAL_SERVICE_LINE_INTERESTS,
} from '@/types/partnership.types'

const meta: Meta<typeof OverlapDrawer> = {
  title: 'Organisms/OverlapDrawer',
  component: OverlapDrawer,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { onClose: () => {} },
}

export default meta
type Story = StoryObj<typeof OverlapDrawer>

export const Default: Story = {
  args: {
    subject: 'SL-002',
    overlaps: findOverlaps(
      INITIAL_SERVICE_LINE_INTERESTS[1],
      INITIAL_SERVICE_LINE_INTERESTS,
      EXISTING_PROJECTS,
      INITIAL_PARTNERSHIP_REQUESTS
    ),
  },
}

export const EdgeCases: Story = { args: { subject: 'PRJ-07', overlaps: [] } }
