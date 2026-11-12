'use client'

/**
 * QuestionnaireForm — Organism
 * The title of a questionnaire, and its questions: each has the question text, a response
 * cue and is required or optional. Used to add a new questionnaire and to edit an existing one.
 * Used in: ManageQuestionnairesModal
 */

import React, { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { AddQuestionModal } from '@/components/organisms/AddQuestionModal'
import { newQuestionId, type QuestionnaireDraft } from '@/types/questionnaires'
import type { QuestionnaireQuestion } from '@/types/partnership.types'
import type { QuestionnaireFormProps } from './QuestionnaireForm.types'

const FIELD =
  'w-full h-10 px-3 rounded-lg border border-[#d6dee6] bg-white text-sm text-[#0d212c] placeholder:text-[#9aa8b5] transition hover:border-[#bcc7d3] focus:outline-none focus:border-[#a3b1c2]'

export const QuestionnaireForm: React.FC<QuestionnaireFormProps> = ({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  className = '',
}) => {
  const [title, setTitle] = useState(initial?.title ?? initial?.name ?? '')
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>(initial?.questions ?? [])
  const [adding, setAdding] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [showErrors, setShowErrors] = useState(false)

  const valid = title.trim() && questions.length > 0
  const submit = () => {
    if (!valid) return setShowErrors(true)
    // The title is the only name a questionnaire has
    const draft: QuestionnaireDraft = { name: title.trim(), title: title.trim(), questions }
    onSubmit(draft)
  }
  const editing = editingIndex === null ? null : questions[editingIndex]

  return (
    <div className={`flex flex-col flex-1 min-h-0 ${className}`.trim()}>
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-5 pb-4 pr-1">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="questionnaire-title" className="text-xs font-semibold text-[#475569]">
            Questionnaire title <span className="text-red-500">*</span>
          </label>
          <input
            id="questionnaire-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Procurement review"
            className={FIELD}
          />
          {showErrors && !title.trim() && (
            <span className="text-[11px] text-red-600">Enter a questionnaire title.</span>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold text-[#0d212c]">
              Questions{' '}
              <span className="font-normal text-[#64748b]">
                ({questions.length} {questions.length === 1 ? 'question' : 'questions'})
              </span>
            </h4>
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#008a8a] hover:text-[#006e6e] cursor-pointer transition"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Add question
            </button>
          </div>
          {questions.length === 0 ? (
            <p
              className={`text-sm text-center py-8 border border-dashed rounded-xl ${
                showErrors ? 'border-red-300 text-red-600' : 'border-[#e2e8f0] text-[#64748b]'
              }`}
            >
              No questions yet. Add at least one question.
            </p>
          ) : (
            <ol aria-label="Questions" className="flex flex-col gap-2.5">
              {questions.map((q, index) => (
                <li
                  key={q.id}
                  className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-3 flex items-start gap-3"
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <span className="text-sm font-semibold text-[#0d212c]">
                      Question {index + 1}
                      <span
                        className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold align-middle ${
                          q.mandatory
                            ? 'bg-[#fee2e2] text-[#b91c1c]'
                            : 'bg-[#f1f5f9] text-[#64748b]'
                        }`}
                      >
                        {q.mandatory ? 'Required' : 'Optional'}
                      </span>
                    </span>
                    <p className="text-sm text-[#0d212c] leading-relaxed">{q.text}</p>
                    <p className="text-xs text-[#64748b] leading-relaxed">{q.cue}</p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Edit question ${index + 1}`}
                    onClick={() => setEditingIndex(index)}
                    className="p-1.5 rounded-lg text-[#64748b] hover:text-[#0d212c] cursor-pointer shrink-0"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete question ${index + 1}`}
                    onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== index))}
                    className="p-1.5 rounded-lg text-red-500 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e2e8f0] shrink-0">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-10 px-4 rounded-lg border border-[#cbd5e1] bg-white text-sm font-semibold text-[#0d212c] hover:bg-slate-50 transition cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={submit}
          className="h-10 px-5 rounded-lg font-semibold text-sm transition bg-[#36c0c9] hover:bg-[#2fb0b9] text-white cursor-pointer"
        >
          {submitLabel}
        </button>
      </div>

      {adding && (
        <AddQuestionModal
          onClose={() => setAdding(false)}
          onSave={(q) => {
            setQuestions((prev) => [...prev, { ...q, id: newQuestionId() }])
            setAdding(false)
          }}
        />
      )}
      {editing && editingIndex !== null && (
        <AddQuestionModal
          initial={{ text: editing.text, cue: editing.cue, mandatory: editing.mandatory }}
          onClose={() => setEditingIndex(null)}
          onSave={(q) => {
            setQuestions((prev) => prev.map((e, i) => (i === editingIndex ? { ...e, ...q } : e)))
            setEditingIndex(null)
          }}
        />
      )}
    </div>
  )
}
