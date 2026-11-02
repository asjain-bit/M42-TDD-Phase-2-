import type { QuestionAnswer } from '@/types/partnership.types'

export interface AnswerHistoryProps {
  /** A submitted answer; nothing shows until it has edits */
  answer: QuestionAnswer
  /** When the original answer was submitted */
  originalOn?: string
  /** Leave out the Edited chip when the card shows it elsewhere (next to the question number) */
  hideChip?: boolean
  className?: string
}
