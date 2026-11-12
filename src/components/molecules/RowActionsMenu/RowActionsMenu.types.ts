import type { ComponentType } from 'react'

export interface RowActionsMenuProps {
  /** What the row is, for the button's accessible name: "Actions for {label}" */
  label: string
  onEdit: () => void
  onDelete: () => void
  /** Menu item text, "Edit" by default */
  editLabel?: string
  /** Menu item text, "Delete" by default */
  deleteLabel?: string
  /** More items between Edit and Delete, e.g. Deactivate */
  extraItems?: { label: string; icon: ComponentType<{ className?: string }>; onClick: () => void }[]
  /** Bolder, darker items, as in the other pages' row menus */
  strong?: boolean
}
