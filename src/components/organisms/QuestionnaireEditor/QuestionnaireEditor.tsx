'use client'

/**
 * QuestionnaireEditor — Organism
 * Pick a questionnaire, then add questions or switch on Edit to reorder (drag), change or delete
 * them before it is sent. Every change saves a new version, picked from a dropdown once the
 * questionnaire has been edited.
 * Changes only apply to this request, never to the questionnaire library. In read-only mode
 * (the Send Request popup) it only lists the chosen questionnaire's questions.
 * Used in: SendInternalModal
 */

import React, { useState } from 'react'
import { ChevronDown, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { AddQuestionModal } from '@/components/organisms/AddQuestionModal'
import { useQuestionnaireLibrary } from '@/lib/useQuestionnaireLibrary'
import { newQuestionId } from '@/types/questionnaires'
import type { QuestionnaireQuestion } from '@/types/partnership.types'
import type { QuestionnaireEditorProps } from './QuestionnaireEditor.types'

const FIELD =
  'w-full rounded-lg border border-[#e2e8f0] bg-[#fcfdfe] text-sm text-[#0d212c] placeholder:text-[#9aa8b5] transition hover:border-[#bcc7d3] focus:outline-none focus:border-[#a3b1c2]'

const QuestionBody: React.FC<{ index: number; question: QuestionnaireQuestion }> = ({
  index,
  question,
}) => (
  <>
    <h5 className="text-sm font-semibold text-[#0d212c] whitespace-nowrap">Question {index + 1}</h5>
    <p className="text-sm text-[#0d212c] leading-relaxed">
      {question.text}
      {question.mandatory && (
        <span className="text-red-500 font-semibold" aria-label="mandatory">
          {' '}
          *
        </span>
      )}
    </p>
    <p className="text-xs text-[#64748b] leading-relaxed">{question.cue}</p>
  </>
)

export const QuestionnaireEditor: React.FC<QuestionnaireEditorProps> = ({
  questionnaireId,
  onQuestionnaireChange,
  questions,
  onQuestionsChange,
  versions,
  currentVersion,
  onSelectVersion,
  readOnly = false,
  className = '',
}) => {
  const library = useQuestionnaireLibrary()
  const [adding, setAdding] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [editMode, setEditMode] = useState(false)

  const move = (from: number, to: number) => {
    if (to < 0 || to >= questions.length || from === to) return
    const next = [...questions]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onQuestionsChange(next, `Moved question ${from + 1} to position ${to + 1}`)
  }

  const editing = editingIndex === null ? null : questions[editingIndex]

  return (
    <div className={`flex flex-col gap-4 ${className}`.trim()}>
      <div className="flex flex-col gap-1.5 w-full">
        <label htmlFor="questionnaire-select" className="text-xs font-semibold text-[#475569]">
          Questionnaire
        </label>
        <div className="relative">
          <select
            id="questionnaire-select"
            value={questionnaireId}
            onChange={(e) => onQuestionnaireChange(e.target.value)}
            className={`${FIELD} h-10 appearance-none pl-3 pr-10 cursor-pointer`}
          >
            {library.map((q) => (
              <option key={q.id} value={q.id}>
                {q.name}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h4 className="text-sm font-semibold text-[#0d212c]">
            Questions{' '}
            <span className="font-normal text-[#64748b]">
              ({questions.length} {questions.length === 1 ? 'question' : 'questions'})
            </span>
          </h4>
          {!readOnly && versions && versions.length > 1 && (
            <div className="relative">
              <select
                aria-label="Version"
                value={currentVersion}
                onChange={(e) => onSelectVersion?.(Number(e.target.value))}
                className="h-8 appearance-none pl-3 pr-8 rounded-lg border border-[#e2e8f0] bg-white text-xs font-medium text-[#0d212c] hover:border-[#bcc7d3] focus:outline-none focus:border-[#a3b1c2] cursor-pointer"
              >
                {[...versions].reverse().map((v) => (
                  <option key={v.version} value={v.version}>
                    v{v.version} · {v.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              />
            </div>
          )}
        </div>
        {!readOnly && (
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-pressed={editMode}
              onClick={() => setEditMode((m) => !m)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#008a8a] hover:text-[#006e6e] cursor-pointer transition"
            >
              <Pencil className="w-4 h-4" aria-hidden="true" />
              {editMode ? 'Save' : 'Edit'}
            </button>
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#008a8a] hover:text-[#006e6e] cursor-pointer transition"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Add question
            </button>
          </div>
        )}
      </div>

      {questions.length === 0 ? (
        <p className="text-sm text-[#64748b] text-center py-8 border border-dashed border-[#e2e8f0] rounded-xl">
          No questions yet.
        </p>
      ) : (
        <ol aria-label="Questions" className="flex flex-col gap-3">
          {questions.map((q, index) => (
            <li
              key={q.id}
              data-testid={`question-${index + 1}`}
              onDragOver={(e) => {
                if (dragIndex !== null) e.preventDefault()
              }}
              onDrop={() => {
                if (dragIndex !== null) move(dragIndex, index)
                setDragIndex(null)
              }}
              className={`rounded-xl border bg-white flex items-start gap-3 transition ${
                dragIndex === index ? 'border-[#94a3b8] opacity-60' : 'border-[#e2e8f0]'
              } ${editMode ? 'px-3 py-3 hover:border-[#bcc7d3]' : 'px-4 py-3.5'}`}
            >
              {editMode && (
                <span
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragEnd={() => setDragIndex(null)}
                  aria-hidden="true"
                  className="text-slate-400 cursor-grab active:cursor-grabbing pt-0.5"
                >
                  <GripVertical className="w-4 h-4" />
                </span>
              )}

              {editMode ? (
                <button
                  type="button"
                  onClick={() => setEditingIndex(index)}
                  aria-label={`Edit question ${index + 1}`}
                  className="flex-1 min-w-0 flex flex-col gap-1 text-left cursor-pointer"
                >
                  <QuestionBody index={index} question={q} />
                </button>
              ) : (
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <QuestionBody index={index} question={q} />
                </div>
              )}

              {editMode && (
                <button
                  type="button"
                  onClick={() =>
                    onQuestionsChange(
                      questions.filter((_, i) => i !== index),
                      `Deleted question ${index + 1}`
                    )
                  }
                  aria-label={`Delete question ${index + 1}`}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer transition shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </li>
          ))}
        </ol>
      )}

      {adding && (
        <AddQuestionModal
          onClose={() => setAdding(false)}
          onSave={(q) => {
            onQuestionsChange(
              [...questions, { ...q, id: newQuestionId() }],
              `Added question ${questions.length + 1}`
            )
            setAdding(false)
          }}
        />
      )}

      {editing && editingIndex !== null && (
        <AddQuestionModal
          initial={{ text: editing.text, cue: editing.cue, mandatory: editing.mandatory }}
          onClose={() => setEditingIndex(null)}
          onSave={(q) => {
            onQuestionsChange(
              questions.map((existing, i) =>
                i === editingIndex ? { ...existing, ...q } : existing
              ),
              `Edited question ${editingIndex + 1}`
            )
            setEditingIndex(null)
          }}
        />
      )}
    </div>
  )
}
