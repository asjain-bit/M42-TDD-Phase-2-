export interface FocusAreaSelectProps {
  /** Id of the trigger button, for the field label */
  id: string
  value: string[]
  onChange: (next: string[]) => void
  /** Red border when the field is required and empty */
  error?: boolean
  className?: string
}
