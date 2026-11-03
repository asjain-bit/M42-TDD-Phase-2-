export interface FilePickerProps {
  /** Accessible name and visible title, e.g. "Upload signed copy" */
  label: string
  /** Supporting line under the title */
  hint?: string
  /** Comma-separated extensions, e.g. ".pdf,.docx" */
  accept: string
  /** Called with the picked file names */
  onPick?: (names: string[]) => void
  /** Called with the picked files themselves (name and size), when more than the name is needed */
  onPickFiles?: (files: File[]) => void
  /** Largest file allowed, in MB; bigger ones are refused with a message */
  maxSizeMb?: number
  multiple?: boolean
  className?: string
}
