'use client'

/**
 * FocusAreaSelect — Molecule
 * Multi-select of the M42 focus areas: chips in the trigger, a checkbox list below.
 * Used in: VendorWebForm, ServiceLineInterestScreen (New interest)
 */

import React, { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { FOCUS_AREA_OPTIONS } from '@/types/vendorForm'
import type { FocusAreaSelectProps } from './FocusAreaSelect.types'

const FIELD =
  'w-full rounded-lg border border-[#d6dee6] bg-white text-sm text-[#0d212c] placeholder:text-[#9aa8b5] shadow-2xs transition focus:outline-none hover:border-[#bcc7d3] focus:border-[#a3b1c2] focus:ring-0'
const FIELD_ERROR = 'border-red-300'

export const FocusAreaSelect: React.FC<FocusAreaSelectProps> = ({
  id,
  value,
  onChange,
  error = false,
  className = '',
}) => {
  const [open, setOpen] = useState(false)
  return (
    <div className={`relative ${className}`.trim()}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`${FIELD} min-h-10 pl-3 pr-10 py-1.5 text-left flex flex-wrap items-center gap-1.5 cursor-pointer ${
          error ? FIELD_ERROR : ''
        }`}
      >
        {value.length === 0 ? (
          <span className="text-[#9aa8b5]">Select focus areas</span>
        ) : (
          value.map((f) => (
            <span
              key={f}
              className="px-2.5 py-0.5 rounded-lg bg-[#f0fdfa] text-[#0f766e] text-xs font-medium border border-[#ccfbf1]"
            >
              {f}
            </span>
          ))
        )}
        <ChevronDown
          aria-hidden="true"
          className={`w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Focus areas"
          aria-multiselectable="true"
          className="absolute z-20 mt-1.5 w-full max-h-64 overflow-y-auto rounded-lg border border-[#e2e8f0] bg-white shadow-lg py-1.5 animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {FOCUS_AREA_OPTIONS.map((opt) => {
            const selected = value.includes(opt)
            return (
              <li key={opt} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() =>
                    onChange(selected ? value.filter((f) => f !== opt) : [...value, opt])
                  }
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-left hover:bg-slate-50 cursor-pointer"
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      selected ? 'bg-[#36c0c9] border-[#36c0c9] text-white' : 'border-slate-300'
                    }`}
                  >
                    {selected && <Check className="w-3 h-3 stroke-[3]" aria-hidden="true" />}
                  </span>
                  {opt}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
