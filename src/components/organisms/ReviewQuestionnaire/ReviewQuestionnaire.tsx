'use client'

/**
 * ReviewQuestionnaire — Organism
 * The questions the Director sent, one answer box each. Same layout to answer them
 * (editable), to read a submitted response (readOnly or submission), and to change a submitted
 * answer with a reason (submission with onEditAnswer).
 * Used in: PartnershipDetail
 */

import React, { useEffect, useRef, useState } from 'react'
import { Info, Pencil } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Textarea } from '@/components/atoms/Textarea'
import { AnswerHistory, EditedChip } from '@/components/molecules/AnswerHistory'
import { currentAnswer } from '@/lib/caseActions'
import type { QuestionAnswer } from '@/types/partnership.types'
import type { ReviewQuestionnaireProps } from './ReviewQuestionnaire.types'

const MAX = 600
const REASON_MAX = 300

/** Every mandatory question has an answer */
export const isQuestionnaireComplete = (
  questions: ReviewQuestionnaireProps['questions'],
  answers: NonNullable<ReviewQuestionnaireProps['answers']>
) =>
  questions.length > 0 &&
  questions.filter((q) => q.mandatory).every((q) => Boolean(answers[q.id]?.answer.trim()))

/** Questions rebuilt from submitted answers, for views that only have the answers */
export const questionsFromAnswers = (answers: QuestionAnswer[]) =>
  answers.map((a) => ({ id: a.questionId, text: a.question, cue: a.cue, mandatory: true }))

/** One submitted answer being changed: answer, reason, Cancel and Save change */
const AnswerEditor: React.FC<{
  questionId: string
  current: string
  onCancel: () => void
  onSave: (answer: string, reason: string) => void
}> = ({ questionId, current, onCancel, onSave }) => {
  const [answer, setAnswer] = useState(current)
  const [reason, setReason] = useState('')
  const answerRef = useRef<HTMLTextAreaElement>(null)
  const canSave = answer !== current && reason.trim() !== ''

  useEffect(() => {
    answerRef.current?.focus()
  }, [])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Textarea
          ref={answerRef}
          id={`answer-${questionId}`}
          rows={3}
          maxLength={MAX}
          resize="none"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="leading-relaxed"
        />
        <span className="text-[11px] text-text-tertiary self-end">
          {answer.length}/{MAX}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`reason-${questionId}`}
          className="text-xs font-semibold text-text-secondary"
        >
          Reason for change <span className="text-text-error">*</span>
        </label>
        <Textarea
          id={`reason-${questionId}`}
          rows={2}
          maxLength={REASON_MAX}
          resize="none"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why are you changing this answer?"
        />
        <span className="text-[11px] text-text-tertiary self-end">
          {reason.length}/{REASON_MAX}
        </span>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={!canSave}
          onClick={() => onSave(answer, reason.trim())}
        >
          Save change
        </Button>
      </div>
    </div>
  )
}

export const ReviewQuestionnaire: React.FC<ReviewQuestionnaireProps> = ({
  questions,
  answers = {},
  onChange,
  readOnly = false,
  submission,
  onEditAnswer,
  hideSubmit = false,
  onSubmit,
  className = '',
}) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const submitted = Boolean(submission)
  const editable = !readOnly && !submitted
  const submittedById = new Map((submission?.answers ?? []).map((a) => [a.questionId, a]))
  const mandatory = questions.filter((q) => q.mandatory)
  const done = mandatory.filter((q) => Boolean(answers[q.id]?.answer.trim())).length
  const canSubmit = questions.length > 0 && done === mandatory.length

  return (
    <div
      className={`bg-white rounded-2xl border border-[#e2e8f0] p-6 sm:p-8 shadow-xs flex flex-col ${className}`.trim()}
    >
      {editable && (
        <div className="flex items-center justify-between gap-3 pb-6 mb-2 border-b border-[#f1f5f9]">
          <span className="text-xs text-[#64748b]">Questions marked * are mandatory.</span>
          <span className="text-xs font-medium text-[#475569]">
            {done} of {mandatory.length} mandatory answered
          </span>
        </div>
      )}

      {submitted && onEditAnswer && (
        <div
          role="status"
          className="flex items-start gap-2 px-3 py-2 mb-6 rounded-lg border border-status-info-border bg-status-info-bg text-xs text-status-info-text leading-relaxed"
        >
          <Info className="w-4 h-4 shrink-0 mt-px" strokeWidth={2} aria-hidden="true" />
          <span>
            Submitted on {submission?.submittedOn ?? 'submission'}. You can still edit an answer;
            each change needs a reason and your original answer stays on record.
          </span>
        </div>
      )}

      <ol className="flex flex-col divide-y divide-[#f1f5f9]">
        {questions.map((q, i) => {
          const value = answers[q.id] ?? { answer: '' }
          const record = submittedById.get(q.id)
          const shown = record ? currentAnswer(record) : value.answer
          const edited = Boolean(record?.edits?.length)
          const isEditing = editingId === q.id
          return (
            <li key={q.id} className="py-7 first:pt-0 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#e0f2fe] text-[#0369a1] flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    {edited && <EditedChip />}
                    <label
                      htmlFor={`answer-${q.id}`}
                      className="text-sm font-medium text-[#0d212c] leading-relaxed"
                    >
                      {q.text}
                      {editable && q.mandatory && (
                        <span className="text-red-500 font-semibold"> *</span>
                      )}
                    </label>
                  </div>
                  <p className="text-xs text-[#64748b] leading-relaxed">{q.cue}</p>
                </div>
                {submitted && onEditAnswer && record && !isEditing && editingId === null && (
                  <button
                    type="button"
                    onClick={() => setEditingId(q.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-text-link hover:underline cursor-pointer shrink-0"
                  >
                    <Pencil className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                    Edit answer
                  </button>
                )}
              </div>

              <div className="pl-9 flex flex-col gap-3">
                {isEditing && record ? (
                  <AnswerEditor
                    questionId={q.id}
                    current={shown}
                    onCancel={() => setEditingId(null)}
                    onSave={(answer, reason) => {
                      onEditAnswer?.(q.id, answer, reason)
                      setEditingId(null)
                    }}
                  />
                ) : submitted ? (
                  <p
                    id={`answer-${q.id}`}
                    className="w-full p-3 rounded-lg border border-border-default bg-bg-surface-1 text-sm text-text-primary leading-relaxed whitespace-pre-wrap min-h-[5.25rem]"
                  >
                    {shown || <span className="text-text-tertiary">No answer given.</span>}
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <textarea
                      id={`answer-${q.id}`}
                      rows={3}
                      maxLength={MAX}
                      value={value.answer}
                      disabled={readOnly}
                      onChange={(e) => onChange?.(q.id, { answer: e.target.value })}
                      placeholder="Type your answer..."
                      className="w-full p-3 rounded-lg border border-[#d6dee6] bg-white text-sm text-[#0d212c] placeholder:text-[#9aa8b5] leading-relaxed resize-none transition hover:border-[#bcc7d3] focus:outline-none focus:border-[#a3b1c2] disabled:bg-[#f8fafc] disabled:text-[#334155] disabled:opacity-100 disabled:hover:border-[#d6dee6]"
                    />
                    {!readOnly && (
                      <span className="text-[11px] text-[#94a3b8] self-end">
                        {value.answer.length}/{MAX}
                      </span>
                    )}
                  </div>
                )}
                {record && !isEditing && (
                  <AnswerHistory answer={record} originalOn={submission?.submittedOn} hideChip />
                )}
              </div>
            </li>
          )
        })}
      </ol>

      {editable && !hideSubmit && (
        <div className="flex items-center justify-end pt-6 border-t border-[#f1f5f9]">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={onSubmit}
            className="px-6 py-2.5 rounded-lg bg-[#36c0c9] hover:bg-[#2fb0b9] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold shadow-xs cursor-pointer transition flex items-center gap-1.5"
          >
            <span>Submit</span>
          </button>
        </div>
      )}
    </div>
  )
}
