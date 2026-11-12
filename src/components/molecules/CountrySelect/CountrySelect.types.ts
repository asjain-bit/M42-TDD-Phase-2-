export interface CountrySelectProps {
  id?: string
  value: string
  onChange: (country: string) => void
  placeholder?: string
  error?: boolean
  disabled?: boolean
  className?: string
}
