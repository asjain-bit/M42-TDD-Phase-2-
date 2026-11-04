/**
 * FilterMenu — Molecule
 * Filter button with an active count that opens a popover of dropdown filters.
 * Used in: DashboardScreen, VendorsScreen
 */

'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { Select } from '@/tdd-admin/components/atoms/Select'
import { FilterMenuProps } from './FilterMenu.types'

export const FilterMenu: React.FC<FilterMenuProps> = ({
  fields,
  values,
  onChange,
  className = '',
}) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const activeCount = fields.filter((field) => values[field.key]).length

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={containerRef} className={['relative shrink-0', className].filter(Boolean).join(' ')}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`h-full min-h-9 inline-flex items-center gap-2 px-3.5 rounded-lg border bg-white text-xs font-semibold text-[#0d212c] shadow-xs transition cursor-pointer ${
          activeCount > 0 ? 'border-[#cbd5e1]' : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
        }`}
      >
        <SlidersHorizontal className="w-4 h-4 text-[#64748b]" />
        <span>Filter</span>
        {activeCount > 0 && (
          <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-[#36c0c9] text-white text-[10px] font-bold flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-40 w-72 bg-white rounded-2xl border border-[#e2e8f0] shadow-xl p-4 flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#0d212c]">Filters</span>
            <button
              type="button"
              onClick={() => onChange({})}
              disabled={activeCount === 0}
              className="text-xs font-semibold text-[#36c0c9] hover:text-[#2baab3] bg-transparent border-0 p-0 cursor-pointer disabled:text-[#cbd5e1] disabled:cursor-not-allowed"
            >
              Clear all
            </button>
          </div>

          {fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <label
                htmlFor={`filter-${field.key}`}
                className="text-[11px] font-bold text-[#64748b]"
              >
                {field.label}
              </label>
              <div className="relative">
                <Select
                  id={`filter-${field.key}`}
                  value={values[field.key] || ''}
                  onChange={(e) => onChange({ ...values, [field.key]: e.target.value })}
                  options={[
                    { value: '', label: 'All' },
                    ...field.options.map((option) => ({ value: option, label: option })),
                  ]}
                  className="pr-9 cursor-pointer"
                />
                <ChevronDown className="w-3.5 h-3.5 text-[#94a3b8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
