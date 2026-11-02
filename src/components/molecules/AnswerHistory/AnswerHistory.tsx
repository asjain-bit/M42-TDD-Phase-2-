'use client'

/**
 * AnswerHistory — Molecule
 * "Edited" chip and an expandable timeline of a submitted answer: the original, then each change.
 * Used in: ReviewQuestionnaire, PartnershipDetail, AlignmentPack
 */

import React, { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import type { AnswerHistoryProps } from './AnswerHistory.types'

/** Small neutral chip marking an answer that was changed after submitting */
export const EditedChip: React.FC = () => <Badge size="sm">Edited</Badge>

export const AnswerHistory: React.FC<AnswerHistoryProps> = ({
  answer,
  originalOn,
  hideChip = false,
  className = '',
}) => {
  const [open, setOpen] = useState(false)
  const timelineId = useId()
  const edits = answer.edits ?? []
  if (edits.length === 0) return null

  const entries = [
    { meta: originalOn ? `Original · ${originalOn}` : 'Original', text: answer.answer },
    ...edits.map((e, i) => ({
      meta: `Edit ${i + 1} · ${e.by} · ${e.on}`,
      text: e.answer,
      reason: e.reason,
    })),
  ]

  return (
    <div className={`flex flex-col gap-2 ${className}`.trim()}>
      <div className="flex items-center gap-2 flex-wrap">
        {!hideChip && <EditedChip />}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={timelineId}
          className="inline-flex items-center gap-1 text-xs font-medium text-text-link hover:underline cursor-pointer"
        >
          View original and changes ({edits.length})
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>
      </div>

      {open && (
        <ol
          id={timelineId}
          aria-label="Original answer and changes"
          className="ml-1 border-l border-border-default pl-4 flex flex-col gap-4"
        >
          {entries.map((e) => (
            <li key={e.meta} className="relative flex flex-col gap-1">
              <span
                aria-hidden="true"
                className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-border-strong ring-2 ring-bg-default"
              />
              <span className="text-[11px] font-medium text-text-tertiary">{e.meta}</span>
              <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                {e.text}
              </p>
              {'reason' in e && e.reason && (
                <p className="text-xs text-text-secondary leading-relaxed">Reason: {e.reason}</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
