import type { QuestionnaireDraft } from '@/types/questionnaires'

export interface QuestionnaireFormProps {
  /** The questionnaire being edited; leave out to start a new one */
  initial?: QuestionnaireDraft
  submitLabel: string
  onSubmit: (draft: QuestionnaireDraft) => void
  onCancel?: () => void
  className?: string
}
