import type { VendorMatch } from '@/lib/serviceLineMatch'

export interface RecommendedVendorsProps {
  /** From matchVendors, best match first */
  matches: VendorMatch[]
  className?: string
}
