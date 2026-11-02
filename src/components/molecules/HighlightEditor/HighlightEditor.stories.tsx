import type { Meta, StoryObj } from '@storybook/react'
import { HighlightEditor } from '@/components/molecules/HighlightEditor'

const meta: Meta<typeof HighlightEditor> = {
  title: 'Molecules/HighlightEditor',
  component: HighlightEditor,
  tags: ['autodocs'],
  args: { onSave: () => {}, onCancel: () => {} },
}

export default meta
type Story = StoryObj<typeof HighlightEditor>

export const Default: Story = {
  args: {
    initialHtml:
      'Pilot in two hospitals. <mark data-tone="positive">Strong fit.</mark> <mark data-tone="critical">Hosting not confirmed.</mark>',
  },
}

export const Empty: Story = { args: { initialHtml: '' } }

export const EdgeCases: Story = {
  args: {
    initialHtml:
      'Line one.\nLine two with <mark data-tone="attention">a long highlight that wraps across several lines in a narrow editor</mark>.',
    className: 'max-w-xs',
  },
}
