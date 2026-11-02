import type { Meta, StoryObj } from '@storybook/react'
import { PlatformCallRoom } from '@/components/organisms/PlatformCallRoom'
import { buildCallSummary } from '@/lib/caseActions'
import { INITIAL_PARTNERSHIP_REQUESTS, M42_PEOPLE } from '@/types/partnership.types'

const request = INITIAL_PARTNERSHIP_REQUESTS[2]
const attendees = M42_PEOPLE.slice(0, 16).map((p) => ({
  name: p.name,
  email: p.email,
  internal: true,
  role: p.role,
}))

const meta: Meta<typeof PlatformCallRoom> = {
  title: 'Organisms/PlatformCallRoom',
  component: PlatformCallRoom,
  tags: ['autodocs'],
  args: {
    callType: 'discovery',
    caseCode: request.requestCode,
    hostName: 'Zaid Al Ali',
    canHost: true,
    onComplete: () => {},
  },
}

export default meta
type Story = StoryObj<typeof PlatformCallRoom>

/** Set-up: Start now, attendees and the share link */
export const Default: Story = {}

export const ValueCall: Story = {
  args: { callType: 'value', hostName: 'Rashid Al-Nuaimi' },
}

/** After End call: the listening agent's summary */
export const Summary: Story = {
  args: {
    saved: {
      format: 'platform',
      attendees,
      summary: buildCallSummary(request, 'discovery', attendees),
      on: '22 Oct 2026',
    },
  },
}

/** Someone who is not hosting waits for the summary */
export const EdgeCases: Story = { args: { canHost: false } }
