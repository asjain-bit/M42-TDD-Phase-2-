import type { StageProgress } from '@/lib/caseActions'

/** How each of the six stages reads in the tooltip */
export type StageState = 'Completed' | 'Current' | 'Upcoming' | 'Not reached'

export interface StageChipProps {
  /** From getStageProgress */
  progress: StageProgress
  /** Stretch the bar to the container width (default: a compact 120px bar for table cells) */
  fullWidth?: boolean
  className?: string
}
