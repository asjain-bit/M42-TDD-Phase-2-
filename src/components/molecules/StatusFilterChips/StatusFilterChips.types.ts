export interface StatusFilterChip {
  key: string
  label: string
  count: number
}

export interface StatusFilterChipsProps {
  chips: StatusFilterChip[]
  selected: string
  onSelect: (key: string) => void
  className?: string
}
