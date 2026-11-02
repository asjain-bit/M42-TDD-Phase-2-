import type { InternalInterestStakeholder } from '@/types/partnership.types'

export interface SponsorAssignModalProps {
  /** The reviewers who said they are ready to sponsor */
  candidates: InternalInterestStakeholder[]
  onConfirm: (assignment: { lead: string; co: string[] }) => void
  /** Pre-selected lead and co-sponsors, e.g. when assigning someone who expressed interest */
  initial?: { lead: string; co: string[] }
  onClose: () => void
}
