import type { PlatformUser, UserRole } from '@/types/platformUsers'

/** A user as the form edits it; the id and activity are given by the page */
export interface UserDraft {
  name: string
  email: string
  role: UserRole
  /** Only given for a Service Line Owner */
  department?: string
  kpis?: string[]
  domainExpertise?: string
}

export interface UserFormModalProps {
  /** The user to edit; leave out to add a new one */
  initial?: PlatformUser
  /** Emails already in use by other users */
  takenEmails: string[]
  onSave: (draft: UserDraft) => void
  onClose: () => void
}
