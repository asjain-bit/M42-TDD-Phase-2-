'use client'

/**
 * BriefDecisionModal — Organism
 * Popup where the Director records a decision on the initial assessment brief. Approving
 * makes the reason optional, rejecting makes it mandatory, and requesting more information
 * shows the email template in the same popup, with a copy button on each field. The body scrolls inside the popup.
 * Used in: PartnershipDetail
 */

import React, { useEffect, useId, useState } from 'react'
import { X } from 'lucide-react'
import { Radio } from '@/components/atoms/Radio'
import { CopyButton } from '@/components/molecules/CopyButton'
import type { BriefDecisionChoice, BriefDecisionModalProps } from './BriefDecisionModal.types'

const MAX = 500

const OPTIONS: {
  value: BriefDecisionChoice
  label: string
  reasonPlaceholder: string
  /** The agent recommendation this option matches */
  recommends?: 'proceed' | 'reject'
}[] = [
  {
    value: 'approve',
    label: 'Proceed',
    recommends: 'proceed',
    reasonPlaceholder: 'Add a note for the record...',
  },
  {
    value: 'reject',
    label: 'Reject',
    recommends: 'reject',
    reasonPlaceholder: 'Explain the key reasons for rejecting...',
  },
  { value: 'request_info', label: 'Request more info', reasonPlaceholder: '' },
]

export const BriefDecisionModal: React.FC<BriefDecisionModalProps> = ({
  agentRecommendation,
  email,
  onSubmit,
  onRequestInfo,
  onClose,
}) => {
  const [choice, setChoice] = useState<BriefDecisionChoice | ''>('')
  const [reason, setReason] = useState('')
  const [subject, setSubject] = useState(email.subject)
  const [body, setBody] = useState(email.body)
  const titleId = useId()
  const current = OPTIONS.find((o) => o.value === choice)
  const reasonRequired = choice === 'reject'
  const isInfo = choice === 'request_info'
  const actionLabel =
    choice === 'reject' ? 'Reject request' : isInfo ? 'Mark information requested' : 'Proceed'
  const canSubmit = isInfo
    ? subject.trim().length > 0 && body.trim().length > 0
    : choice !== '' && (!reasonRequired || reason.trim().length > 0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 bg-[#0d212c]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between gap-3 px-6 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-[#e2e8f0] shrink-0">
          <h3 id={titleId} className="text-xl font-semibold text-[#0d212c]">
            Your decision
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

        <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-5 flex flex-col gap-5">
          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-semibold text-[#475569] mb-1">
              Decision <span className="text-red-500 font-semibold">*</span>
            </legend>
            {OPTIONS.map((o) => (
              <Radio
                key={o.value}
                name="brief-decision"
                checked={choice === o.value}
                onChange={() => setChoice(o.value)}
                label={
                  <span className="flex items-center gap-2">
                    {o.label}
                    {agentRecommendation === o.recommends && (
                      <span className="px-2 py-0.5 rounded-full bg-[#e0f2fe] text-[#0369a1] text-[11px] font-medium">
                        Suggested by assessment
                      </span>
                    )}
                  </span>
                }
                className={`px-3.5 py-3 rounded-xl border transition ${
                  choice === o.value
                    ? 'border-[#36c0c9] bg-[#f0fdfa]'
                    : 'border-[#d6dee6] hover:bg-slate-50'
                }`}
              />
            ))}
          </fieldset>

          {choice === '' ? null : isInfo ? (
            <div className="flex flex-col gap-4" aria-label="Email to the vendor" role="group">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#475569]">To</span>
                  <CopyButton text={email.to} label="recipient" />
                </div>
                <div className="px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-slate-50 text-sm text-[#0d212c]">
                  {email.to}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="info-subject" className="text-xs font-semibold text-[#475569]">
                    Subject
                  </label>
                  <CopyButton text={subject} label="subject" />
                </div>
                <input
                  id="info-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-[#d6dee6] bg-white text-sm text-[#0d212c] shadow-2xs transition focus:outline-none hover:border-[#bcc7d3] focus:border-[#a3b1c2] focus:ring-0"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="info-body" className="text-xs font-semibold text-[#475569]">
                    Message
                  </label>
                  <CopyButton text={body} label="message" />
                </div>
                <textarea
                  id="info-body"
                  rows={10}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-[#d6dee6] bg-white text-sm text-[#0d212c] leading-relaxed resize-none shadow-2xs transition focus:outline-none hover:border-[#bcc7d3] focus:border-[#a3b1c2] focus:ring-0"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="brief-decision-reason"
                className="text-xs font-semibold text-[#475569]"
              >
                Reason
                {reasonRequired && <span className="text-red-500 font-semibold"> *</span>}
              </label>
              <textarea
                id="brief-decision-reason"
                rows={4}
                maxLength={MAX}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={current?.reasonPlaceholder}
                className="w-full p-3.5 rounded-xl border border-[#d6dee6] bg-white text-sm text-[#0d212c] placeholder:text-[#9aa8b5] leading-relaxed resize-none shadow-2xs transition focus:outline-none hover:border-[#bcc7d3] focus:border-[#a3b1c2] focus:ring-0"
              />
              <span className="text-[11px] text-[#94a3b8] self-end">
                {reason.length} / {MAX}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-4 border-t border-[#e2e8f0] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-lg border border-[#cbd5e1] bg-white text-sm font-semibold text-[#0d212c] hover:bg-slate-50 cursor-pointer transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() =>
              choice === 'request_info'
                ? onRequestInfo({ to: email.to, subject: subject.trim(), body })
                : choice !== '' && onSubmit(choice, reason.trim())
            }
            className={`h-10 px-5 rounded-lg text-sm font-semibold text-white shadow-xs transition disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer ${
              choice === 'reject'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#36c0c9] hover:bg-[#2fb0b9]'
            }`}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
