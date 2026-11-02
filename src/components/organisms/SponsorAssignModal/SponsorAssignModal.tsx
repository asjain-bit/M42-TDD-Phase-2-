'use client'

/**
 * SponsorAssignModal — Organism
 * Shown when more than one reviewer is ready to sponsor: the Director picks the lead sponsor
 * and which of the others join as co-sponsors.
 * Also opened from the Sponsor interest card, pre-filled with the person being assigned.
 * Used in: PartnershipDetail
 */

import React, { useEffect, useId, useState } from 'react'
import { X } from 'lucide-react'
import { Radio } from '@/components/atoms/Radio'
import { Checkbox } from '@/components/atoms/Checkbox'
import type { SponsorAssignModalProps } from './SponsorAssignModal.types'

export const SponsorAssignModal: React.FC<SponsorAssignModalProps> = ({
  candidates,
  onConfirm,
  onClose,
  initial,
}) => {
  const [lead, setLead] = useState(initial?.lead ?? '')
  const [co, setCo] = useState<string[]>(initial?.co ?? [])
  const titleId = useId()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const chooseLead = (name: string) => {
    setLead(name)
    setCo((prev) => prev.filter((n) => n !== name))
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0d212c]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between gap-3 px-6 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-[#e2e8f0] shrink-0">
          <div>
            <h3 id={titleId} className="text-xl font-semibold text-[#0d212c]">
              Assign sponsors
            </h3>
            <p className="text-xs text-[#64748b] mt-0.5">
              {candidates.length} people are ready to sponsor. Choose the lead and any co-sponsors.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close assign sponsors"
            className="text-[#94a3b8] hover:text-[#0d212c] p-1 rounded-lg hover:bg-slate-100 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-5 flex flex-col gap-5">
          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-semibold text-[#475569] mb-1">
              Lead sponsor <span className="text-red-500">*</span>
            </legend>
            {candidates.map((c) => (
              <Radio
                key={c.id}
                name="lead-sponsor"
                checked={lead === c.name}
                onChange={() => chooseLead(c.name)}
                className="p-3 rounded-xl border border-[#d6dee6] hover:bg-slate-50 transition"
                label={
                  <span className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-[#0d212c]">{c.name}</span>
                    <span className="text-xs text-[#64748b] truncate">{c.role}</span>
                  </span>
                }
              />
            ))}
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-semibold text-[#475569] mb-1">Co-sponsors</legend>
            {candidates
              .filter((c) => c.name !== lead)
              .map((c) => (
                <Checkbox
                  key={c.id}
                  label={c.name}
                  checked={co.includes(c.name)}
                  onChange={(checked) =>
                    setCo((prev) =>
                      checked ? [...prev, c.name] : prev.filter((n) => n !== c.name)
                    )
                  }
                />
              ))}
            {lead === '' && (
              <p className="text-xs text-[#64748b]">Choose the lead sponsor first.</p>
            )}
          </fieldset>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t border-[#e2e8f0] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-6 rounded-xl border border-[#e2e8f0] bg-white text-sm font-semibold text-[#0d212c] hover:bg-slate-50 cursor-pointer transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={lead === ''}
            onClick={() => onConfirm({ lead, co })}
            className="h-11 px-6 rounded-xl bg-[#36c0c9] hover:bg-[#2fb0b9] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold transition cursor-pointer"
          >
            Assign sponsors
          </button>
        </div>
      </div>
    </div>
  )
}
