'use client'

/**
 * SendInternalModal — Organism
 * Popup for the Internal Interest request: pick the questionnaire and read its questions, then
 * Send Request sends it to everyone listed in the Internal Canvas. The body scrolls inside the
 * popup.
 * Used in: PartnershipDetail
 */

import React, { useEffect, useId, useState } from 'react'
import { Calendar, Send, X } from 'lucide-react'
import { QuestionnaireEditor } from '@/components/organisms/QuestionnaireEditor'
import { useQuestionnaireLibrary } from '@/lib/useQuestionnaireLibrary'
import { DEFAULT_QUESTIONNAIRE_ID, getQuestionnaire } from '@/types/questionnaires'
import { formatDueDate, internalDueOn } from '@/lib/caseActions'
import type { SendInternalModalProps } from './SendInternalModal.types'

export const SendInternalModal: React.FC<SendInternalModalProps> = ({
  members,
  onSend,
  onClose,
}) => {
  const [questionnaireId, setQuestionnaireId] = useState(DEFAULT_QUESTIONNAIRE_ID)
  // Questions are edited from Add questionnaire; here the chosen one is only listed
  const questions = useQuestionnaireLibrary().find((q) => q.id === questionnaireId)?.questions ?? []
  const titleId = useId()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const questionsValid =
    questions.length > 0 && questions.every((q) => q.text.trim() && q.cue.trim())
  const canSend = members.length > 0 && questionsValid

  const hint =
    questions.length === 0
      ? 'Add at least one question.'
      : !questionsValid
        ? 'Every question needs text and a response cue.'
        : ''

  return (
    <div className="fixed inset-0 z-50 bg-[#0d212c]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] shadow-2xl border border-[#e2e8f0] flex flex-col animate-in fade-in zoom-in-95"
      >
        <div className="flex items-start justify-between gap-3 px-6 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-[#f1f5f9] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#36c0c9]/10 text-[#36c0c9] flex items-center justify-center shrink-0">
              <Send className="w-5 h-5 -rotate-12" />
            </div>
            <div>
              <h3 id={titleId} className="text-lg font-semibold text-[#0d212c]">
                Select questionnaire
              </h3>
              <p className="text-xs text-[#64748b] mt-0.5">
                Choose the questionnaire for the Internal Interest team. Use Add questionnaire to
                create or edit one.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close send to Internal Interest"
            className="text-[#94a3b8] hover:text-[#0d212c] p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-8 py-6 flex flex-col gap-6">
          <QuestionnaireEditor
            readOnly
            questionnaireId={questionnaireId}
            onQuestionnaireChange={setQuestionnaireId}
            questions={questions}
            onQuestionsChange={() => undefined}
          />
        </div>

        <div className="flex items-center justify-between gap-3 px-6 sm:px-8 py-4 border-t border-[#f1f5f9] flex-wrap shrink-0">
          <div className="flex flex-col gap-1">
            <span className="inline-flex items-center gap-1.5 text-xs text-[#64748b]">
              <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
              Responses due by {formatDueDate(internalDueOn())}. Late responses are still accepted.
            </span>
            {hint && <span className="text-xs text-amber-700">{hint}</span>}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 rounded-lg border border-[#cbd5e1] bg-white text-sm font-semibold text-[#0d212c] hover:bg-slate-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSend}
              onClick={() =>
                onSend({
                  memberIds: members.map((m) => m.id),
                  questionnaire: {
                    name: getQuestionnaire(questionnaireId).name,
                    version: 1,
                    questions,
                  },
                })
              }
              className="h-10 px-5 rounded-lg font-semibold text-sm transition bg-[#36c0c9] hover:bg-[#2fb0b9] text-white cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              Send Request
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
