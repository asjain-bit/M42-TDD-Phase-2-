import type { PartnershipRequest } from '@/types/partnership.types'
import type { DisplayStatus } from '@/lib/caseStatus'

export interface CaseNotesProps {
  request: PartnershipRequest
  /** The case status as the current profile sees it */
  status: DisplayStatus
  /** Show the agent's proceed/reject leaning (Director, Sponsor and Partnership Admin only) */
  showAssessment?: boolean
  /** Key notes can be edited in place; every other section is read-only */
  canEditNotes?: boolean
  /** Called with the sanitised key notes HTML */
  onSaveNote?: (html: string) => void
  /** X, Esc, a click outside, or the opening icon clicked again (after the closing motion) */
  onClose: () => void
  /** The Notes icon or button it opened from; the popover points at it */
  anchor?: HTMLElement | null
  /** Open with every section showing */
  defaultExpanded?: boolean
}
