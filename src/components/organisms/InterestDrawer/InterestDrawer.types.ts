import type { PartnershipRequest, ServiceLineInterest } from '@/types/partnership.types'

export interface InterestDrawerProps {
  interest: ServiceLineInterest
  /** Every partnership request, to recommend vendors from */
  requests: PartnershipRequest[]
  /** X or Esc */
  onClose: () => void
}
