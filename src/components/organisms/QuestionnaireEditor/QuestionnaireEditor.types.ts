import type { QuestionnaireQuestion } from '@/types/partnership.types'

export interface QuestionnaireVersion {
  version: number
  /** What changed, e.g. "Edited question 2" */
  label: string
  questions: QuestionnaireQuestion[]
}

export interface QuestionnaireEditorProps {
  questionnaireId: string
  onQuestionnaireChange: (id: string) => void
  questions: QuestionnaireQuestion[]
  /** Called on every change with a short description used for the version history */
  onQuestionsChange: (questions: QuestionnaireQuestion[], label: string) => void
  /** Saved versions, oldest first. Only shown once the questionnaire has been edited. */
  versions?: QuestionnaireVersion[]
  /** The version being shown */
  currentVersion?: number
  /** Switches to another saved version */
  onSelectVersion?: (version: number) => void
  /** Only list the questions: no Edit, Add question or versions */
  readOnly?: boolean
  className?: string
}
