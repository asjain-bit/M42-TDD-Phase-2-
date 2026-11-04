'use client'

/**
 * StrategyDecisionModal — Organism
 * Popup for the Strategy Team's decision on the pre-read. Proceed takes an optional reason,
 * reject needs one. A confirmation follows before the decision is recorded.
 * Used in: PartnershipDetail
 */

import React, { useEffect, useId, useState } from 'react'
import { X } from 'lucide-react'
import type { StrategyDecisionModalProps } from './StrategyDecisionModal.types'

const FIELD =
  'w-full rounded-lg border border-[#d6dee6] bg-white text-sm text-[#0d212c] placeholder:text-[#9aa8b5] transition hover:border-[#bcc7d3] focus:outline-none focus:border-[#a3b1c2]'

export const StrategyDecisionModal: React.FC<StrategyDecisionModalProps> = ({
  mode,
  onConfirm,
  onClose,
}) => {
  const isProceed = mode === 'proceed'
  const [reason, setReason] = useState('')
  const titleId = useId()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const canConfirm = isProceed || reason.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 bg-[#0d212c]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#e2e8f0]">
          <h3 id={titleId} className="text-xl font-semibold text-[#0d212c]">
            {isProceed ? 'Proceed with this partnership' : 'Reject this partnership'}
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

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="strategy-decision-reason"
            className="text-sm font-semibold text-[#0d212c]"
          >
            Reason{!isProceed && <span className="text-red-500"> *</span>}
          </label>
          <textarea
            id="strategy-decision-reason"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              isProceed
                ? 'Add a note for the Director...'
                : 'Explain why this partnership should not go ahead...'
            }
            className={`${FIELD} p-3.5 resize-none leading-relaxed`}
          />
        </div>

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
            onClick={() => onConfirm(reason.trim())}
            className={`h-11 px-6 rounded-lg text-white text-sm font-semibold transition cursor-pointer disabled:bg-slate-400 disabled:cursor-not-allowed ${
              isProceed ? 'bg-[#36c0c9] hover:bg-[#2fb0b9]' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isProceed ? 'Proceed' : 'Reject partnership'}
          </button>
        </div>
      </div>
    </div>
  )
}
