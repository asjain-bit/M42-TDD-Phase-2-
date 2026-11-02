export interface HighlightEditorProps {
  /** Note HTML to start from (text and <mark data-tone> only) */
  initialHtml?: string
  /** Called with the sanitised HTML; Save stays disabled while the note is empty */
  onSave: (html: string) => void
  onCancel: () => void
  /** Accessible name of the editable area */
  label?: string
  className?: string
}
