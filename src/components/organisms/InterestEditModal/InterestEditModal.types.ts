import type { ServiceLineInterest } from '@/types/partnership.types'

/** What the Strategy Team can change on an interest: the service line form fields and the status */
export type InterestEdit = Pick<
  ServiceLineInterest,
  'serviceLine' | 'title' | 'problem' | 'focusAreas' | 'outcome' | 'urgency' | 'status'
>

export interface InterestEditModalProps {
  /** The interest to edit; leave out to add one (Strategy scouting, approved straight away) */
  interest?: ServiceLineInterest
  onSave: (edit: InterestEdit) => void
  onClose: () => void
}
