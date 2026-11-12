'use client'

/**
 * CountrySelect — Molecule
 * Single-select of every country: flag and name in the trigger, a searchable list below.
 * Same dropdown look as the country picker in the TDD admin Vendors screen.
 * Used in: VendorWebForm, PartnershipFormPreview
 */

import React, { useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { COUNTRIES } from '@/lib/countries'
import { CountryFlag } from '@/tdd-admin/components/atoms/CountryFlag'
import type { CountrySelectProps } from './CountrySelect.types'

const FIELD =
  'w-full rounded-lg border border-[#d6dee6] bg-white text-sm text-[#0d212c] shadow-2xs transition focus:outline-none hover:border-[#bcc7d3] focus:border-[#a3b1c2] focus:ring-0'
const FIELD_ERROR = 'border-red-300'

export const CountrySelect: React.FC<CountrySelectProps> = ({
  id,
  value,
  onChange,
  placeholder = 'Select country',
  error = false,
  disabled = false,
  className = '',
}) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const selected = COUNTRIES.find((c) => c.name === value)
  const shown = COUNTRIES.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()))

  const close = () => {
    setOpen(false)
    setQuery('')
  }

  return (
    <div className={`relative ${className}`.trim()}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        className={`${FIELD} h-10 pl-3 pr-10 text-left flex items-center gap-2 cursor-pointer ${
          error ? FIELD_ERROR : ''
        }`}
      >
        {selected && <CountryFlag country={selected.name} code={selected.code} size="md" />}
        <span className={`truncate ${selected ? '' : 'text-[#9aa8b5]'}`}>
          {selected?.name ?? placeholder}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} aria-hidden="true" />
          <div className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-white p-1.5 rounded-2xl border border-[#e2e8f0] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="relative p-1">
              <Search
                aria-hidden="true"
                className="w-3.5 h-3.5 text-[#94a3b8] absolute left-4 top-1/2 -translate-y-1/2"
              />
              <input
                type="text"
                autoFocus
                aria-label="Search countries"
                placeholder="Search countries"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-9 pl-8 pr-3 rounded-lg border border-[#e2e8f0] text-xs text-[#0d212c] outline-none focus:border-[#cbd5e1]"
              />
            </div>
            <ul role="listbox" aria-label="Countries" className="max-h-56 overflow-y-auto">
              {shown.map((c) => {
                const isSelected = c.name === value
                return (
                  <li key={c.code} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      aria-label={c.name}
                      onClick={() => {
                        onChange(c.name)
                        close()
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs text-left cursor-pointer transition ${
                        isSelected
                          ? 'bg-[#f1f5f9] font-bold text-[#0d212c]'
                          : 'hover:bg-[#f8fafc] text-[#0d212c]'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <CountryFlag country={c.name} code={c.code} />
                        <span className="truncate">{c.name}</span>
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#36c0c9] shrink-0" />}
                    </button>
                  </li>
                )
              })}
              {shown.length === 0 && (
                <li className="px-3 py-3 text-xs text-[#64748b]">No country matches.</li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
