'use client'

/**
 * AdminActionModal — Organism
 * Popup for the Partnership Admin's decision. Proceed asks for the request type (with the
 * agent's confidence) and an optional reason; reject needs a reason.
 * Used in: PartnershipDetail
 */

import React, { useEffect, useId, useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { ConfidenceBadge } from '@/components/organisms/AgentActions'
import type { CaseType } from '@/types/partnership.types'
import type { AdminActionModalProps } from './AdminActionModal.types'

const TYPES: { value: CaseType; hint: string }[] = [
  { value: 'Partnership', hint: 'Pilot or co-develop with M42. Goes to the Director.' },
  { value: 'Procure', hint: 'Buy or license the solution. Goes to Procurement.' },
  { value: 'M&A', hint: 'Acquire or invest in the vendor. Goes to Corporate Development.' },
]

const LEVEL_RANK: Record<string, number> = { High: 3, Medium: 2, Low: 1 }

const FIELD =
  'w-full rounded-lg border border-[#d6dee6] bg-white text-sm text-[#0d212c] placeholder:text-[#9aa8b5] transition hover:border-[#bcc7d3] focus:outline-none focus:border-[#a3b1c2]'

export const AdminActionModal: React.FC<AdminActionModalProps> = ({
  mode,
  typeConfidence,
  initialType,
  initialReason = '',
  onConfirm,
  onClose,
}) => {
  const isReassign = mode === 'reassign'
  const isProceed = mode === 'proceed' || isReassign
  // Proceed starts on the type the agent recommends; the Admin can change it
  const recommended = TYPES.map((t) => t.value).reduce((best, t) =>
    LEVEL_RANK[typeConfidence[t]] > LEVEL_RANK[typeConfidence[best]] ? t : best
  )
  const [type, setType] = useState<CaseType | null>(
    initialType ?? (mode === 'proceed' ? recommended : null)
  )
  const [reason, setReason] = useState(initialReason)
  const [open, setOpen] = useState(false)
  const titleId = useId()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (open) setOpen(false)
        else onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, open])

  // Reassigning only makes sense once a different type has been picked
  const canConfirm = isReassign
    ? Boolean(type) && type !== initialType
    : isProceed
      ? Boolean(type)
      : reason.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 bg-[#0d212c]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#e2e8f0]">
          <h3 id={titleId} className="text-xl font-semibold text-[#0d212c]">
            {isReassign
              ? 'Reassign request type'
              : isProceed
                ? 'Proceed with this case'
                : 'Reject this case'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close decision"
            className="text-[#94a3b8] hover:text-[#0d212c] p-1 rounded-lg hover:bg-slate-100 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isProceed && (
          <div className="flex flex-col gap-1.5">
            <span id="request-type-label" className="text-sm font-semibold text-[#0d212c]">
              Request type <span className="text-red-500">*</span>
            </span>
            <div className="relative">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-labelledby="request-type-label"
                onClick={() => setOpen((o) => !o)}
                className={`${FIELD} relative h-11 px-3.5 pr-10 text-left flex items-center gap-2 cursor-pointer`}
              >
                {type ? (
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{type}</span>
                    <ConfidenceBadge level={typeConfidence[type]} label={`${type} confidence`} />
                  </span>
                ) : (
                  <span className="text-[#9aa8b5]">Select request type</span>
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
                  aria-label="Request type"
                  className="absolute left-0 right-0 top-full mt-1.5 z-10 rounded-lg border border-[#e2e8f0] bg-white shadow-xl py-1.5 animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  {TYPES.map((t) => (
                    <li key={t.value} role="option" aria-selected={type === t.value}>
                      <button
                        type="button"
                        onClick={() => {
                          setType(t.value)
                          setOpen(false)
                        }}
                        className="w-full flex items-start justify-between gap-3 px-3.5 py-2.5 text-left hover:bg-slate-50 cursor-pointer"
                      >
                        <span className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-[#0d212c]">
                            {t.value}
                            {t.value === recommended && (
                              <span className="ml-2 text-[11px] font-semibold text-[#0f766e]">
                                Recommended
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-[#64748b]">{t.hint}</span>
                        </span>
                        <span className="flex items-center gap-2 shrink-0">
                          <ConfidenceBadge
                            level={typeConfidence[t.value]}
                            label={`${t.value} confidence`}
                          />
                          {type === t.value && (
                            <Check className="w-4 h-4 text-[#36c0c9]" aria-hidden="true" />
                          )}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {!isReassign && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="admin-action-reason" className="text-sm font-semibold text-[#0d212c]">
              Reason{!isProceed && <span className="text-red-500"> *</span>}
            </label>
            <textarea
              id="admin-action-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isProceed
                  ? 'Add a note for the next team...'
                  : 'Explain why this case is being rejected...'
              }
              className={`${FIELD} p-3.5 resize-none leading-relaxed`}
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e2e8f0]">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-6 rounded-lg border border-[#e2e8f0] bg-white text-sm font-semibold text-[#0d212c] hover:bg-slate-50 cursor-pointer transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={() =>
              onConfirm({
                action: isProceed ? 'proceed' : 'reject',
                type: isProceed ? (type ?? undefined) : undefined,
                reason: reason.trim(),
              })
            }
            className={`h-11 px-6 rounded-lg text-white text-sm font-semibold transition cursor-pointer disabled:bg-slate-400 disabled:cursor-not-allowed ${
              isProceed ? 'bg-[#36c0c9] hover:bg-[#2fb0b9]' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isReassign ? 'Reassign' : isProceed ? 'Proceed' : 'Reject request'}
          </button>
        </div>
      </div>
    </div>
  )
}
