'use client'

import React, { useState } from 'react'
import {
  AlertCircle,
  AlignLeft,
  ChevronDown,
  ChevronDownSquare,
  EyeOff,
  ListChecks,
  Plus,
  Sparkles,
  Type,
  X,
} from 'lucide-react'
import {
  ANSWER_TYPE_LABELS,
  isChoiceType,
  validateQuestion,
  type AnswerType,
  type FormQuestion,
} from './partnershipForm.data'
import { Checkbox, FIELD_CLASS, SECONDARY_BUTTON, Switch } from './PartnershipFormParts'

export const TYPE_ICONS: Record<AnswerType, React.ElementType> = {
  short: Type,
  long: AlignLeft,
  dropdown: ChevronDownSquare,
  multi: ListChecks,
}

const TYPE_OPTIONS: { type: AnswerType; hint: string }[] = [
  { type: 'short', hint: 'One line' },
  { type: 'long', hint: 'A paragraph' },
  { type: 'dropdown', hint: 'Pick one' },
  { type: 'multi', hint: 'Pick many' },
]

interface QuestionFieldsProps {
  value: FormQuestion
  onChange: (next: FormQuestion) => void
  showErrors: boolean
  /** Fields are shown but cannot be changed (a live or archived version) */
  readOnly?: boolean
}

/** The settings of one assessment question, in the Add question dialog and the side panel */
export const QuestionFields: React.FC<QuestionFieldsProps> = ({
  value: draft,
  onChange,
  showErrors,
  readOnly = false,
}) => {
  const [optionInput, setOptionInput] = useState('')
  const errors = validateQuestion(draft)
  const set = <K extends keyof FormQuestion>(key: K, next: FormQuestion[K]) =>
    onChange({ ...draft, [key]: next })

  const addOption = () => {
    const option = optionInput.trim()
    setOptionInput('')
    if (!option || draft.options.includes(option)) return
    set('options', [...draft.options, option])
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="pf-question" className="text-xs font-bold text-[#0d212c]">
          Question <span className="text-red-500">*</span>
        </label>
        <textarea
          id="pf-question"
          rows={2}
          disabled={readOnly}
          value={draft.label}
          onChange={(e) => set('label', e.target.value)}
          aria-invalid={showErrors && errors.label ? true : undefined}
          placeholder="e.g. Do you store patient data outside the UAE?"
          className={`${FIELD_CLASS} resize-none ${
            showErrors && errors.label ? 'border-red-400 focus:border-red-500' : ''
          }`}
        />
        {showErrors && errors.label && (
          <p
            role="alert"
            className="flex items-center gap-1.5 text-[11px] text-red-600 font-medium"
          >
            <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
            {errors.label}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          checked={draft.required}
          onChange={(next) => set('required', next)}
          label="Required question"
          disabled={readOnly || !draft.visible}
        />
        <span aria-hidden="true" className="self-stretch w-px bg-[#e2e8f0]" />
        <Checkbox
          checked={draft.visible}
          onChange={(next) =>
            onChange({ ...draft, visible: next, required: next ? draft.required : false })
          }
          label="Show"
          ariaLabel="Show to vendors"
          disabled={readOnly}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="pf-helper" className="text-xs font-bold text-[#0d212c]">
          Help text <span className="font-normal text-[#94a3b8]">(shown under the question)</span>
        </label>
        <input
          id="pf-helper"
          type="text"
          disabled={readOnly}
          value={draft.helper}
          onChange={(e) => set('helper', e.target.value)}
          placeholder="Tell vendors what a good answer includes"
          className={FIELD_CLASS}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="pf-answer-type" className="text-xs font-bold text-[#0d212c]">
          Answer type
        </label>
        <div className="relative">
          <select
            id="pf-answer-type"
            disabled={readOnly}
            value={draft.type}
            onChange={(e) => set('type', e.target.value as AnswerType)}
            className={`${FIELD_CLASS} appearance-none pr-10 cursor-pointer`}
          >
            {TYPE_OPTIONS.map(({ type, hint }) => (
              <option key={type} value={type}>
                {ANSWER_TYPE_LABELS[type]} ({hint.toLowerCase()})
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          />
        </div>
      </div>

      {isChoiceType(draft.type) ? (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-[#0d212c]">Options</span>
          {draft.options.length > 0 && (
            <ul className="flex flex-col gap-1.5 max-h-44 overflow-y-auto">
              {draft.options.map((option) => (
                <li
                  key={option}
                  className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-md border border-[#e2e8f0] bg-[#f8fafc] text-sm text-[#0d212c]"
                >
                  <span className="min-w-0 break-words">{option}</span>
                  {!readOnly && (
                    <button
                      type="button"
                      aria-label={`Remove option ${option}`}
                      onClick={() =>
                        set(
                          'options',
                          draft.options.filter((o) => o !== option)
                        )
                      }
                      className="shrink-0 text-[#94a3b8] hover:text-red-600 transition cursor-pointer bg-transparent border-0 p-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!readOnly && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                aria-label="New option"
                value={optionInput}
                onChange={(e) => setOptionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addOption()
                  }
                }}
                placeholder="Type an option and press Enter"
                className={FIELD_CLASS}
              />
              <button
                type="button"
                onClick={addOption}
                disabled={!optionInput.trim()}
                className={`${SECONDARY_BUTTON} shrink-0 disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          )}
          {showErrors && errors.options && (
            <p
              role="alert"
              className="flex items-center gap-1.5 text-[11px] text-red-600 font-medium"
            >
              <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
              {errors.options}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pf-placeholder" className="text-xs font-bold text-[#0d212c]">
            Placeholder <span className="font-normal text-[#94a3b8]">(optional)</span>
          </label>
          <input
            id="pf-placeholder"
            type="text"
            disabled={readOnly}
            value={draft.placeholder}
            onChange={(e) => set('placeholder', e.target.value)}
            placeholder="Example text shown inside the empty answer box"
            className={FIELD_CLASS}
          />
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1.5 text-xs font-bold text-[#0d212c]">
              <Sparkles className="w-3.5 h-3.5 text-[#36c0c9]" aria-hidden="true" />
              AI check
            </span>
            <span className="text-[11px] text-[#64748b] leading-relaxed">
              When on, the vendor&apos;s &quot;Run AI check&quot; reviews this answer. Leave it off
              for questions that need no review.
            </span>
          </div>
          <Switch
            checked={draft.aiCheck}
            onChange={(next) => set('aiCheck', next)}
            label="AI check"
            disabled={readOnly}
          />
        </div>
        {draft.aiCheck && (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="pf-ai-guidance"
              className="flex items-center gap-1.5 text-xs font-bold text-[#0d212c]"
            >
              <EyeOff className="w-3.5 h-3.5 text-[#64748b]" aria-hidden="true" />
              AI guidance <span className="font-normal text-[#94a3b8]">(hidden from vendors)</span>
            </label>
            <textarea
              id="pf-ai-guidance"
              rows={3}
              disabled={readOnly}
              value={draft.aiGuidance}
              onChange={(e) => set('aiGuidance', e.target.value)}
              placeholder="What should the AI look for in a good answer?"
              className={`${FIELD_CLASS} resize-none`}
            />
          </div>
        )}
      </div>
    </>
  )
}

/** Cleans a question before it is saved */
export const tidyQuestion = (draft: FormQuestion): FormQuestion => ({
  ...draft,
  label: draft.label.trim(),
  helper: draft.helper.trim(),
  options: isChoiceType(draft.type) ? draft.options : [],
  placeholder: isChoiceType(draft.type) ? '' : draft.placeholder,
  aiGuidance: draft.aiCheck ? draft.aiGuidance.trim() : '',
})
