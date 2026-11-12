export type WorkflowStepState = 'completed' | 'current' | 'upcoming' | 'closed'

/** Who did, or is to do, a step: shown in the tooltip of a completed or current step */
export interface WorkflowStepActor {
  /** What they did, e.g. "Approved by" or "Awaiting" */
  action: string
  /** Their designation, e.g. Director */
  role: string
  name: string
}

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
  /** Shown on hover for completed and current steps only */
  actors?: WorkflowStepActor[]
}

export interface WorkflowStepperProps {
  steps: WorkflowStep[]
  /** Step currently on screen */
  activeId: string
  /** Only completed and current steps can be selected */
  onSelect: (id: string) => void
  className?: string
}
