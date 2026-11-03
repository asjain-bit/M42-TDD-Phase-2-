export interface RowActionsMenuProps {
  /** What the row is, for the button's accessible name: "Actions for {label}" */
  label: string
  onEdit: () => void
  onDelete: () => void
}
