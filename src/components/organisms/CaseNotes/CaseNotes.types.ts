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
  /** X, Esc or a click on the overlay */
  onClose: () => void
  /** Open with every section showing */
  defaultExpanded?: boolean
}
