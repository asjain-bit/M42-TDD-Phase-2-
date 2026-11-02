import type { Meta, StoryObj } from '@storybook/react'
import { RecommendedVendors } from '@/components/organisms/RecommendedVendors'
import { matchVendors } from '@/lib/serviceLineMatch'
import {
  INITIAL_PARTNERSHIP_REQUESTS,
  INITIAL_SERVICE_LINE_INTERESTS,
} from '@/types/partnership.types'

const meta: Meta<typeof RecommendedVendors> = {
  title: 'Organisms/RecommendedVendors',
  component: RecommendedVendors,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof RecommendedVendors>

export const Default: Story = {
  args: { matches: matchVendors(INITIAL_SERVICE_LINE_INTERESTS[1], INITIAL_PARTNERSHIP_REQUESTS) },
}

/** Includes CarePulse, rejected at the brief */
export const WithRejected: Story = {
  args: { matches: matchVendors(INITIAL_SERVICE_LINE_INTERESTS[2], INITIAL_PARTNERSHIP_REQUESTS) },
}

export const EdgeCases: Story = { args: { matches: [] } }
