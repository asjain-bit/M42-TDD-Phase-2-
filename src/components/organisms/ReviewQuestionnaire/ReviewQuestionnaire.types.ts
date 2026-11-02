import type { QuestionAnswer, QuestionnaireQuestion } from '@/types/partnership.types'

export interface QuestionAnswerValue {
  answer: string
}

export interface ReviewQuestionnaireProps {
  questions: QuestionnaireQuestion[]
  /** Draft answers while answering (not used once submitted) */
  answers?: Record<string, QuestionAnswerValue>
  onChange?: (questionId: string, patch: Partial<QuestionAnswerValue>) => void
  /** View-only mode: same layout, every field locked, no submit */
  readOnly?: boolean
  /**
   * A submitted response. Each card shows the current answer, the Edited chip and the history of
   * changes; the original answer is always kept.
   */
  submission?: { answers: QuestionAnswer[]; submittedOn?: string }
  /** Lets the reviewer change a submitted answer, one card at a time, with a reason */
  onEditAnswer?: (questionId: string, answer: string, reason: string) => void
  /** The page shows its own fixed submit bar, so this one is left out */
  hideSubmit?: boolean
  onSubmit?: () => void
  className?: string
}
