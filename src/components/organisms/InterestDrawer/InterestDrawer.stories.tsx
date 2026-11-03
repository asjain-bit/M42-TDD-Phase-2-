import type { Meta, StoryObj } from '@storybook/react'
import { InterestDrawer } from '@/components/organisms/InterestDrawer'
import {
  INITIAL_PARTNERSHIP_REQUESTS,
  INITIAL_SERVICE_LINE_INTERESTS,
} from '@/types/partnership.types'

const meta: Meta<typeof InterestDrawer> = {
  title: 'Organisms/InterestDrawer',
  component: InterestDrawer,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { requests: INITIAL_PARTNERSHIP_REQUESTS, onClose: () => {} },
}

export default meta
type Story = StoryObj<typeof InterestDrawer>

export const Default: Story = { args: { interest: INITIAL_SERVICE_LINE_INTERESTS[1] } }

/** An interest no vendor matches */
export const EdgeCases: Story = {
  args: {
    interest: {
      ...INITIAL_SERVICE_LINE_INTERESTS[0],
      title: 'Staff rota planning',
      problem: 'Rotas are built by hand.',
      outcome: 'Rotas out a week earlier.',
      focusAreas: [],
    },
  },
}
