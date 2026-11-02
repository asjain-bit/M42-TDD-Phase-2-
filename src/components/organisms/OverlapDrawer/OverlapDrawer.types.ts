import type { Overlap } from '@/types/partnership.types'

export interface OverlapDrawerProps {
  /** What was checked, e.g. SL-002 or a project name */
  subject: string
  overlaps: Overlap[]
  onClose: () => void
}
