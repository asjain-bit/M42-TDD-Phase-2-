import type { ExistingProject } from '@/types/partnership.types'

/** A project as the form edits it; the id is given by the page */
export type ProjectDraft = Omit<ExistingProject, 'id'>

export interface ProjectFormModalProps {
  /** The project to edit; leave out to add a new one */
  initial?: ExistingProject
  /** People who can own a project */
  owners: string[]
  /** Vendors to pick from: those in the partnership requests and existing projects */
  vendorOptions: string[]
  onSave: (draft: ProjectDraft) => void
  onClose: () => void
}
