import type { NoteTone } from '@/lib/summaryNote'

export interface HighlightEditorProps {
  /** Note HTML to start from (text and <mark data-tone> only) */
  initialHtml?: string
  /** Called with the sanitised HTML; Save stays disabled while the note is empty */
  onSave: (html: string) => void
  /** Leave out to show no Cancel button */
  onCancel?: () => void
  /** Accessible name of the editable area */
  label?: string
  /** The highlight pills, in order (Critical, Needs attention, Positive by default) */
  tones?: { tone: NoteTone; label: string }[]
  /** Shown in the empty editable area */
  placeholder?: string
  /** Text next to the pills; null hides it */
  hint?: string | null
  /** Label of the save button (Save by default) */
  saveLabel?: string
  /** Empties the editor after each save, for adding one note after another */
  resetOnSave?: boolean
  /** A 2-line area that grows to 4, with a small save button */
  compact?: boolean
  /** Focus the editable area on mount (default true) */
  autoFocus?: boolean
  className?: string
}
