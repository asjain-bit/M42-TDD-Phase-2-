export interface FocusAreaSelectProps {
  /** Id of the trigger button, for the field label */
  id: string
  value: string[]
  onChange: (next: string[]) => void
  /** What to choose from (the M42 focus areas by default) */
  options?: readonly string[]
  /** Shown when nothing is chosen */
  placeholder?: string
  /** Accessible name of the list */
  listLabel?: string
  /** Red border when the field is required and empty */
  error?: boolean
  className?: string
}
