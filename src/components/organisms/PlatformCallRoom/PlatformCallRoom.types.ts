import type { CallAttendee, PlatformCall } from '@/types/partnership.types'

export interface PlatformCallRoomProps {
  /** Discovery is hosted by the Director, the value assessment call by the sponsor */
  callType: 'discovery' | 'value'
  /** For the share link and the room title */
  caseCode: string
  /** Who is hosting; shown as "(you)" in the room */
  hostName: string
  /** Only the host sets up, runs and ends the call; everyone else waits for the summary */
  canHost: boolean
  /** Once the call has been held, its summary is shown instead of the room */
  saved?: PlatformCall
  /** End call, after the summary animation: the attendees invited, without the host */
  onComplete: (attendees: CallAttendee[]) => void
  className?: string
}
