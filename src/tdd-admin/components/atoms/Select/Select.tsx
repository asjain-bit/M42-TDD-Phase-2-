import React from 'react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[]
  error?: boolean
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', options, error, disabled, ...props }, ref) => {
    return (
      <select
        ref={ref}
        disabled={disabled}
        className={[
          'w-full rounded-md border bg-white px-3.5 py-2.5 text-xs text-[#0d212c] transition-all outline-none appearance-none',
          'focus:border-[#cbd5e1] focus:ring-1 focus:ring-[#cbd5e1]',
          error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[#e2e8f0]',
          disabled ? 'bg-[#f8fafc] text-[#94a3b8] cursor-not-allowed opacity-60' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  }
)
Select.displayName = 'Select'
