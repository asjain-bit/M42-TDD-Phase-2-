import type { PartnershipRequest } from '@/types/partnership.types'
import type { DisplayStatus } from '@/lib/caseStatus'

export interface CaseNotesProps {
  request: PartnershipRequest
  /** The case status as the current profile sees it */
  status: DisplayStatus
  /** Show the composer; earlier notes are never edited */
  canAddNotes?: boolean
  /** Called with the sanitised HTML of a new note */
  onAddNote?: (html: string) => void
  /** X, Esc, a click outside, or the opening icon clicked again (after the closing motion) */
  onClose: () => void
  /** The Notes icon or button it opened from; the box points at it */
  anchor?: HTMLElement | null
}
