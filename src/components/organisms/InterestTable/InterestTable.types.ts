import type { ServiceLineInterest } from '@/types/partnership.types'

export interface InterestTableProps {
  interests: ServiceLineInterest[]
  /** Row click: opens the interest drawer */
  onOpen: (code: string) => void
  /** Rows submitted by this person get a Yours tag */
  mineName?: string
  /**
   * Internal Interest Team's All interests: the code under the title, plus Raised by (name and
   * role) and Status columns
   */
  detailed?: boolean
  /** The row whose drawer is open */
  selectedCode?: string | null
  emptyText?: string
  className?: string
}
