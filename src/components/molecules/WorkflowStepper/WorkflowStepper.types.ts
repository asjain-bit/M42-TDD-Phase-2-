export type WorkflowStepState = 'completed' | 'current' | 'upcoming' | 'closed'

export interface WorkflowStep {
  id: string
  label: string
  state: WorkflowStepState
  /** Optional override for the line under the label */
  caption?: string
  /**
   * Why a locked step is locked. The step then stays clickable (aria-disabled) so the page can
   * explain it, and shows this as its tooltip.
   */
  lockedHint?: string
}

export interface WorkflowStepperProps {
  steps: WorkflowStep[]
  /** Step currently on screen */
  activeId: string
  /** Only completed and current steps can be selected */
  onSelect: (id: string) => void
  className?: string
}
