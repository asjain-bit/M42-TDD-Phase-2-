'use client'

/**
 * KpiMultiSelect — Molecule
 * Dropdown of the Service Line Owner KPIs with a checkbox on each, and the chosen ones as chips
 * in the trigger. The list opens as an overlay, so it never makes the popup taller.
 * Used in: UserFormModal
 */

import React, { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { SERVICE_LINE_KPIS } from '@/types/platformUsers'

interface KpiMultiSelectProps {
  id?: string
  value: string[]
  onChange: (next: string[]) => void
  error?: boolean
}

export const KpiMultiSelect: React.FC<KpiMultiSelectProps> = ({
  id,
  value,
  onChange,
  error = false,
}) => {
  const [at, setAt] = useState<{ top: number; left: number; width: number } | null>(null)
  const open = Boolean(at)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!at) return
    const close = () => setAt(null)
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (listRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      close()
    }
    // Scrolling the list itself must not close it
    const onScroll = (e: Event) => {
      if (!listRef.current?.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', close)
    }
  }, [at])

  const toggleOpen = () => {
    if (open) return setAt(null)
    const box = triggerRef.current?.getBoundingClientRect()
    if (!box) return
    // Opens upward when there is not enough room below
    const height = 280
    const top =
      box.bottom + height > window.innerHeight - 8
        ? Math.max(8, box.top - height - 6)
        : box.bottom + 6
    setAt({ top, left: box.left, width: box.width })
  }
  const toggle = (name: string) =>
    onChange(value.includes(name) ? value.filter((v) => v !== name) : [...value, name])

  return (
    <div className="relative">
      <button
        id={id}
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggleOpen}
        className={`w-full min-h-10 pl-3 pr-10 py-1.5 rounded-lg border bg-white text-sm text-left flex flex-wrap items-center gap-1.5 cursor-pointer transition hover:border-[#bcc7d3] focus:outline-none focus:border-[#a3b1c2] ${
          error ? 'border-red-300' : 'border-[#d6dee6]'
        }`}
      >
        {value.length === 0 ? (
          <span className="text-[#9aa8b5]">Select KPIs</span>
        ) : (
          value.map((name) => (
            <span
              key={name}
              className="px-2.5 py-0.5 rounded-lg bg-[#f0fdfa] text-[#0f766e] text-xs font-medium border border-[#ccfbf1]"
            >
              {name}
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
          ref={listRef}
          style={{ top: at?.top, left: at?.left, width: at?.width }}
          role="listbox"
          aria-multiselectable="true"
          aria-label="KPIs"
          className="fixed z-[70] rounded-xl border border-[#e2e8f0] bg-white shadow-lg p-1.5 max-h-64 overflow-y-auto"
        >
          {SERVICE_LINE_KPIS.map((kpi) => {
            const checked = value.includes(kpi)
            return (
              <li key={kpi} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={checked}
                  aria-label={kpi}
                  onClick={() => toggle(kpi)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-[#f8fafc] cursor-pointer transition"
                >
                  <span
                    aria-hidden="true"
                    className={`w-[18px] h-[18px] rounded-md border flex items-center justify-center shrink-0 ${
                      checked
                        ? 'bg-[#36c0c9] border-[#36c0c9] text-white'
                        : 'bg-white border-slate-300'
                    }`}
                  >
                    {checked && <Check className="w-3 h-3 stroke-[3]" />}
                  </span>
                  <span className="text-sm font-medium text-[#0d212c]">{kpi}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
