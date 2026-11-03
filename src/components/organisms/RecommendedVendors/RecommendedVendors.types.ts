import type { VendorMatch } from '@/lib/serviceLineMatch'

export interface RecommendedVendorsProps {
  /** From matchVendors, best match first */
  matches: VendorMatch[]
  /** Leave out the heading and intro, when the container has its own */
  hideHeader?: boolean
  /** One line for why each may fit, and no headline: for the side pane while typing */
  compact?: boolean
  /** Request codes ticked "Suggest to team"; with onToggle each row gets the checkbox */
  selected?: string[]
  onToggle?: (requestCode: string) => void
  /** Request codes the person who raised the interest suggested; tagged on their rows */
  suggested?: string[]
  /** Shown when nothing matches; null shows nothing */
  emptyText?: string | null
  className?: string
}
