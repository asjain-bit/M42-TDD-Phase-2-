import type { CaseAction } from '@/lib/caseActions'
import type { PartnershipRequest } from '@/types/partnership.types'

export interface NdaStageProps {
  request: PartnershipRequest
  /** Only the Director sees the NDA template and uploads the signed copy */
  role: 'director' | 'sponsor' | 'viewer'
  onAction: (action: CaseAction) => void
  /** Moves on to the Discovery Call stage from the alignment pack */
  onNext: () => void
  /** Shown under the upload when the Director tried to move on without the signed NDA */
  gateError?: string
  className?: string
}
