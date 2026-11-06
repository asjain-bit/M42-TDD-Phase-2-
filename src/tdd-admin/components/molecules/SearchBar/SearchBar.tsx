/**
 * SearchBar — Molecule
 * Single modern search field pattern with left search icon, enter-key trigger, and clear reset action.
 * Hover & clicked focus state use subtle grey color without increasing stroke weight.
 */

import React, { useState } from 'react'
import { Icon } from '@/tdd-admin/components/atoms/Icon'
import { SearchBarProps } from './SearchBar.types'

export const SearchBar: React.FC<SearchBarProps> = ({
  value: controlledValue,
  onChange,
  onSearch,
  placeholder = 'Search...',
  className = '',
}) => {
  const [internalValue, setInternalValue] = useState('')
  const isControlled = controlledValue !== undefined
  const currentValue = isControlled ? controlledValue : internalValue

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (!isControlled) {
      setInternalValue(val)
    }
    onChange?.(val)
  }

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue('')
    }
    onChange?.('')
    onSearch?.('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSearch?.(currentValue)
    }
  }

  return (
    <div className={['relative w-full max-w-md', className].filter(Boolean).join(' ')}>
      {/* Left Search Icon (Subtle, non-button style) */}
      <Icon
        name="search"
        size={18}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none shrink-0"
      />

      <input
        type="text"
        value={currentValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full h-10 pl-10 pr-9 text-xs bg-white text-[#0d212c] border border-[#e2e8f0] hover:border-[#cbd5e1] focus:border-[#cbd5e1] rounded-md transition-all placeholder:text-[#94a3b8] focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:bg-[#f8fafc] disabled:text-[#94a3b8]"
      />

      {/* Right Clear Icon (Visible when input has value) */}
      {currentValue.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0d212c] transition p-0.5 rounded-full"
        >
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  )
}
