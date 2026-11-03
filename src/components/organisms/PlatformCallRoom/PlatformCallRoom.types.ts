import type { CallAttendee, PartnershipRequest, PlatformCall } from '@/types/partnership.types'

export interface PlatformCallRoomProps {
  /** Discovery is hosted by the Director, the value assessment call by the sponsor */
  callType: 'discovery' | 'value'
  /** For the share link and the room title */
  caseCode: string
  /** The case: its company name for the room title, and the questions the agent suggests */
  request?: PartnershipRequest
  /** Who is hosting; shown as "(you)" in the room */
  hostName: string
  /** Only the host sets up, runs and ends the call; everyone else waits for the summary */
  canHost: boolean
  /** Once the call has been held, its summary is shown instead of the room */
  saved?: PlatformCall
  /** Invited to start with: the Director, the lead sponsor and the vendor contact */
  defaultAttendees?: CallAttendee[]
  /**
   * End call, after the summary animation: the attendees invited (without the host) and the
   * suggested questions, split into those ticked off as asked and those left
   */
  onComplete: (
    attendees: CallAttendee[],
    questions: { asked: string[]; notAsked: string[] }
  ) => void
  className?: string
}
