import type { Meta, StoryObj } from '@storybook/react'
import { Skeleton } from '@/components/atoms/Skeleton'

const meta: Meta<typeof Skeleton> = {
  title: 'Atoms/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Skeleton>

export const Default: Story = { args: { className: 'h-3 w-40' } }

export const Block: Story = { args: { className: 'h-12 w-64 rounded-xl' } }

export const EdgeCases: Story = { args: { className: 'h-1 w-full' } }
