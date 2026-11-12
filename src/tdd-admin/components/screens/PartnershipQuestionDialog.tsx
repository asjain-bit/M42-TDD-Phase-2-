'use client'

import React, { useState } from 'react'
import {
  AlertCircle,
  AlignLeft,
  EyeOff,
  ListChecks,
  Plus,
  Sparkles,
  Type,
  ChevronDownSquare,
  X,
} from 'lucide-react'
import {
  ANSWER_TYPE_LABELS,
  isChoiceType,
  validateQuestion,
  type AnswerType,
  type FormQuestion,
} from './partnershipForm.data'
import {
  Checkbox,
  FIELD_CLASS,
  LIGHT_PRIMARY_BUTTON,
  Modal,
  SECONDARY_BUTTON,
  Switch,
} from './PartnershipFormParts'

const TYPE_OPTIONS: { type: AnswerType; icon: React.ElementType; hint: string }[] = [
  { type: 'short', icon: Type, hint: 'One line' },
  { type: 'long', icon: AlignLeft, hint: 'A paragraph' },
  { type: 'dropdown', icon: ChevronDownSquare, hint: 'Pick one' },
  { type: 'multi', icon: ListChecks, hint: 'Pick many' },
]

interface PartnershipQuestionDialogProps {
  /** The question being edited, or a blank one for a new question */
  question: FormQuestion
  isNew: boolean
  onSave: (question: FormQuestion) => void
  onClose: () => void
}

export const PartnershipQuestionDialog: React.FC<PartnershipQuestionDialogProps> = ({
  question,
  isNew,
  onSave,
  onClose,
}) => {
  const [draft, setDraft] = useState<FormQuestion>(question)
  const [optionInput, setOptionInput] = useState('')
  const [showErrors, setShowErrors] = useState(false)

  const errors = validateQuestion(draft)
  const set = <K extends keyof FormQuestion>(key: K, value: FormQuestion[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }))

  const addOption = () => {
    const value = optionInput.trim()
    if (!value || draft.options.includes(value)) {
      setOptionInput('')
      return
    }
    set('options', [...draft.options, value])
    setOptionInput('')
  }

  const save = () => {
    setShowErrors(true)
    if (errors.label || errors.options) return
    onSave({
      ...draft,
      label: draft.label.trim(),
      helper: draft.helper.trim(),
      options: isChoiceType(draft.type) ? draft.options : [],
      placeholder: isChoiceType(draft.type) ? '' : draft.placeholder,
      aiGuidance: draft.aiCheck ? draft.aiGuidance.trim() : '',
    })
  }

  return (
    <Modal
      title={isNew ? 'Add question' : 'Edit question'}
      description="Vendors answer this question on the partnership request form."
      onClose={onClose}
      maxWidth="max-w-2xl"
      footer={
        <>
          <button type="button" onClick={onClose} className={SECONDARY_BUTTON}>
            Cancel
          </button>
          <button type="button" onClick={save} className={LIGHT_PRIMARY_BUTTON}>
            {isNew ? 'Add question' : 'Save question'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="pf-question" className="text-xs font-bold text-[#0d212c]">
          Question <span className="text-red-500">*</span>
        </label>
        <textarea
          id="pf-question"
          autoFocus
          rows={2}
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

      <Checkbox
        checked={draft.required}
        onChange={(next) => set('required', next)}
        label="Required question"
        hint="Vendors cannot submit the form without answering it."
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="pf-helper" className="text-xs font-bold text-[#0d212c]">
          Help text <span className="font-normal text-[#94a3b8]">(shown under the question)</span>
        </label>
        <input
          id="pf-helper"
          type="text"
          value={draft.helper}
          onChange={(e) => set('helper', e.target.value)}
          placeholder="Tell vendors what a good answer includes"
          className={FIELD_CLASS}
        />
      </div>

      <fieldset className="flex flex-col gap-2 border-0 p-0 m-0 min-w-0">
        <legend className="text-xs font-bold text-[#0d212c] mb-2">Answer type</legend>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {TYPE_OPTIONS.map(({ type, icon: Icon, hint }) => {
            const selected = draft.type === type
            return (
              <button
                key={type}
                type="button"
                aria-pressed={selected}
                onClick={() => set('type', type)}
                className={`px-3 py-2.5 rounded-lg border text-left flex flex-col gap-1 transition cursor-pointer bg-white ${
                  selected
                    ? 'border-[#36c0c9] ring-1 ring-[#36c0c9]'
                    : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${selected ? 'text-[#0d7280]' : 'text-[#64748b]'}`}
                  aria-hidden="true"
                />
                <span className="text-xs font-bold text-[#0d212c]">{ANSWER_TYPE_LABELS[type]}</span>
                <span className="text-[11px] text-[#64748b]">{hint}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

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
                </li>
              ))}
            </ul>
          )}
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
              value={draft.aiGuidance}
              onChange={(e) => set('aiGuidance', e.target.value)}
              placeholder="What should the AI look for in a good answer?"
              className={`${FIELD_CLASS} resize-none`}
            />
          </div>
        )}
      </div>
    </Modal>
  )
}
