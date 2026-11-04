'use client'

import React, { useEffect, useState } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import type { FilterOption, TableFilterMenuProps } from './TableFilterMenu.types'

const SELECT =
  'w-full h-10 appearance-none pl-3 pr-9 rounded-lg border border-[#d6dee6] bg-white text-sm text-[#0d212c] hover:border-[#bcc7d3] focus:outline-none focus:border-[#a3b1c2] cursor-pointer'

const Row: React.FC<{
  id: string
  label: string
  value: string
  options: FilterOption[]
  onChange: (value: string) => void
}> = ({ id, label, value, options, onChange }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-xs font-semibold text-[#475569]">
      {label}
    </label>
    <div className="relative">
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={SELECT}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
      />
    </div>
  </div>
)

/**
 * TableFilterMenu — Molecule
 * A Filters button that opens a panel to filter the table by stage and SLA status and to sort it.
 * Used in: DashboardScreen
 */
export const TableFilterMenu: React.FC<TableFilterMenuProps> = ({
  stage,
  stageOptions,
  sla,
  slaOptions,
  sort,
  sortOptions,
  onStageChange,
  onSlaChange,
  onSortChange,
  activeCount,
  onClear,
}) => {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="h-10 px-4 rounded-lg border border-[#e2e8f0] bg-white text-xs font-medium text-[#0d212c] hover:bg-[#f8fafc] flex items-center gap-2 cursor-pointer transition"
      >
        <SlidersHorizontal className="w-4 h-4 text-[#64748b]" aria-hidden="true" />
        Filters
        {activeCount > 0 && (
          <span className="text-[10px] font-semibold px-1.5 rounded-full bg-[#36c0c9] text-white">
            {activeCount}
          </span>
        )}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Filter and sort"
          className="absolute right-0 top-full mt-2 z-30 w-72 bg-white rounded-2xl border border-[#e2e8f0] shadow-xl p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <Row
            id="filter-stage"
            label="Stage"
            value={stage}
            options={stageOptions}
            onChange={onStageChange}
          />
          {slaOptions && onSlaChange && (
            <Row
              id="filter-sla"
              label="SLA status"
              value={sla ?? 'all'}
              options={slaOptions}
              onChange={onSlaChange}
            />
          )}
          <Row
            id="filter-sort"
            label="Sort by"
            value={sort}
            options={sortOptions}
            onChange={onSortChange}
          />
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={onClear}
              className="text-xs font-medium text-[#008a8a] hover:text-[#006e6e] cursor-pointer"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-9 px-4 rounded-lg bg-[#36c0c9] hover:bg-[#2fb0b9] text-xs font-semibold text-white cursor-pointer transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
