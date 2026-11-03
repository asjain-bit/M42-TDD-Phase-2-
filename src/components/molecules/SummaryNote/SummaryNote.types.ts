import type { SummaryNote } from '@/types/partnership.types'

export interface SummaryNoteProps {
  /** The saved note; empty when no summary has been written yet */
  note?: SummaryNote
  /** Show the Edit notes button */
  canEdit?: boolean
  /** Called with the sanitised HTML (text and <mark data-tone> only) */
  onSave?: (html: string) => void
  /** When given, the chevron opens the CaseNotes panel instead of expanding in place */
  onOpen?: (anchor: HTMLElement) => void
  /** Start with the full note showing instead of one line */
  defaultExpanded?: boolean
  className?: string
}
