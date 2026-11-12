'use client'

import React, { useRef, useState } from 'react'
import {
  Building2,
  Calendar,
  ChevronDown,
  Globe,
  GripVertical,
  Link2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Sparkles,
  Target,
  Trash2,
  Type,
  X,
} from 'lucide-react'
import {
  ANSWER_TYPE_LABELS,
  describeFieldEdit,
  isChoiceType,
  validateQuestion,
  type CompanyField,
  type CompanyFieldKey,
  type FormQuestion,
  type FormVersion,
} from './partnershipForm.data'
import {
  Checkbox,
  FIELD_CLASS,
  LIGHT_PRIMARY_BUTTON,
  SECONDARY_BUTTON,
} from './PartnershipFormParts'
import { QuestionFields, tidyQuestion, TYPE_ICONS } from './PartnershipQuestionFields'

const FIELD_ICONS: Record<CompanyFieldKey, React.ElementType> = {
  vendorId: Type,
  vendorName: Type,
  jobTitle: Type,
  companyName: Type,
  phone: Phone,
  email: Mail,
  yearFounded: Calendar,
  website: Link2,
  country: Globe,
}

const FIELD_TYPE_LABEL: Record<CompanyFieldKey, string> = {
  vendorId: 'Short text',
  vendorName: 'Short text',
  jobTitle: 'Short text',
  companyName: 'Short text',
  phone: 'Phone number',
  email: 'Email address',
  yearFounded: 'Year',
  website: 'Website address',
  country: 'Country list',
}

type Selection = { kind: 'field'; key: CompanyFieldKey } | { kind: 'question'; id: string } | null

interface QuestionsTabProps {
  version: FormVersion
  readOnly: boolean
  onAdd: () => void
  onSaveField: (before: CompanyField, after: CompanyField) => void
  onSaveQuestion: (before: FormQuestion, after: FormQuestion) => void
  onRemove: (question: FormQuestion) => void
  onReorder: (questions: FormQuestion[], movedLabel: string, position: number) => void
}

export const PartnershipFormQuestionsTab: React.FC<QuestionsTabProps> = ({
  version,
  readOnly,
  onAdd,
  onSaveField,
  onSaveQuestion,
  onRemove,
  onReorder,
}) => {
  const [selected, setSelected] = useState<Selection>(null)
  // null follows the selection; a click on the chevron overrides it
  const [companyOpen, setCompanyOpen] = useState<boolean | null>(null)

  const field =
    selected?.kind === 'field'
      ? version.companyFields.find((f) => f.key === selected.key)
      : undefined
  const question =
    selected?.kind === 'question' ? version.questions.find((q) => q.id === selected.id) : undefined

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-5 items-start">
      <div className="flex flex-col gap-5 min-w-0">
        <CompanySection
          version={version}
          selectedKey={selected?.kind === 'field' ? selected.key : null}
          onSelect={(key) => {
            setCompanyOpen(null)
            setSelected({ kind: 'field', key })
          }}
          // Editing an assessment question folds the company information away
          open={companyOpen ?? selected?.kind !== 'question'}
          onOpenChange={setCompanyOpen}
        />
        <AssessmentSection
          version={version}
          readOnly={readOnly}
          selectedId={selected?.kind === 'question' ? selected.id : null}
          onSelect={(id) => {
            setCompanyOpen(null)
            setSelected({ kind: 'question', id })
          }}
          onAdd={onAdd}
          onRemove={(q) => {
            if (selected?.kind === 'question' && selected.id === q.id) setSelected(null)
            onRemove(q)
          }}
          onReorder={onReorder}
        />
      </div>

      <aside
        aria-label="Edit question"
        className="rounded-2xl border border-[#e2e8f0] bg-white shadow-xs lg:sticky lg:top-4 flex flex-col max-h-[calc(100vh-2rem)]"
      >
        {field ? (
          <FieldPanel
            key={field.key}
            field={field}
            readOnly={readOnly}
            onClose={() => setSelected(null)}
            onSave={(after) => onSaveField(field, after)}
          />
        ) : question ? (
          <QuestionPanel
            key={question.id}
            question={question}
            readOnly={readOnly}
            onClose={() => setSelected(null)}
            onSave={(after) => onSaveQuestion(question, after)}
          />
        ) : (
          <div className="px-6 py-12 flex flex-col items-center gap-2 text-center">
            <span className="w-10 h-10 rounded-xl bg-[#f1f5f9] text-[#64748b] flex items-center justify-center">
              <Pencil className="w-4 h-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-bold">Edit question</span>
            <span className="text-xs text-[#64748b]">
              Select a question on the left to see and change its settings.
            </span>
          </div>
        )}
      </aside>
    </div>
  )
}

/* ---------- Sections ---------- */

export const SectionCard: React.FC<{
  icon: React.ElementType
  title: string
  subtitle: string
  count: number
  action?: React.ReactNode
  /** Open or collapsed; the section opens by default */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}> = ({ icon: Icon, title, subtitle, count, action, open = true, onOpenChange, children }) => {
  return (
    <section
      aria-label={title}
      className="rounded-2xl border border-[#e2e8f0] bg-white shadow-xs overflow-hidden"
    >
      <div className="flex items-center gap-4 px-6 py-5">
        <span className="w-11 h-11 rounded-xl bg-[#e6f7f8] text-[#0d7280] flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-bold text-[#0d212c]">{title}</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-[#f1f5f9] text-[11px] font-bold text-[#475569] shrink-0">
              {count} {count === 1 ? 'question' : 'questions'}
            </span>
          </div>
          <p className="text-xs text-[#64748b]">{subtitle}</p>
        </div>
        {action}
        <button
          type="button"
          aria-label={`${open ? 'Collapse' : 'Expand'} ${title}`}
          aria-expanded={open}
          onClick={() => onOpenChange?.(!open)}
          className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:text-[#0d212c] cursor-pointer bg-transparent border-0 shrink-0"
        >
          <ChevronDown className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && <div className="px-6 pb-6 flex flex-col gap-3">{children}</div>}
    </section>
  )
}

export const Row: React.FC<{
  icon?: React.ElementType
  label: string
  helper?: string
  required: boolean
  hidden: boolean
  selected: boolean
  onSelect: () => void
  handle?: React.ReactNode
  actions: React.ReactNode
  extra?: React.ReactNode
}> = ({
  icon: Icon,
  label,
  helper,
  required,
  hidden,
  selected,
  onSelect,
  handle,
  actions,
  extra,
}) => (
  <div
    className={`group flex items-center gap-3 rounded-xl border px-4 py-4 transition ${
      selected
        ? 'border-[#36c0c9] bg-[#f0fbfc]'
        : 'border-[#e2e8f0] bg-white hover:border-[#cbd5e1]'
    } ${hidden ? 'opacity-60' : ''}`}
  >
    {handle}
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer bg-transparent border-0 p-0"
    >
      {Icon && (
        <span className="w-9 h-9 rounded-lg bg-[#e6f7f8] text-[#0d7280] flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" aria-hidden="true" />
        </span>
      )}
      <span className="flex flex-col gap-1 min-w-0">
        <span
          data-testid="row-label"
          className={`text-sm font-semibold leading-snug ${hidden ? 'text-[#64748b]' : 'text-[#0d212c]'}`}
        >
          {label}
          {required && (
            <span className="text-red-500" aria-label="required">
              {' '}
              *
            </span>
          )}
        </span>
        {helper && (
          <span className="text-xs text-[#64748b] leading-relaxed line-clamp-2">{helper}</span>
        )}
        {extra}
      </span>
    </button>
    {hidden && (
      <span className="px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[10px] font-semibold text-[#64748b] shrink-0">
        Hidden from vendors
      </span>
    )}
    <div className="flex items-center gap-1 shrink-0">{actions}</div>
  </div>
)

const CompanySection: React.FC<{
  version: FormVersion
  selectedKey: CompanyFieldKey | null
  onSelect: (key: CompanyFieldKey) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}> = ({ version, selectedKey, onSelect, open, onOpenChange }) => (
  <SectionCard
    open={open}
    onOpenChange={onOpenChange}
    icon={Building2}
    title="Company information"
    subtitle="Basic details about the vendor and their company."
    count={version.companyFields.length}
  >
    {version.companyFields.map((f) => (
      <Row
        key={f.key}
        icon={FIELD_ICONS[f.key]}
        label={f.label}
        helper={f.helper}
        required={f.required}
        hidden={!f.visible}
        selected={selectedKey === f.key}
        onSelect={() => onSelect(f.key)}
        actions={null}
      />
    ))}
  </SectionCard>
)

const AssessmentSection: React.FC<{
  version: FormVersion
  readOnly: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  onAdd: () => void
  onRemove: (question: FormQuestion) => void
  onReorder: (questions: FormQuestion[], movedLabel: string, position: number) => void
}> = ({ version, readOnly, selectedId, onSelect, onAdd, onRemove, onReorder }) => {
  const [open, setOpen] = useState(true)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  // A row only drags from its handle, so its text stays selectable
  const fromHandle = useRef(false)
  const reset = () => {
    setDragId(null)
    setOverId(null)
    fromHandle.current = false
  }

  const moveBefore = (fromId: string, toId: string) => {
    const from = version.questions.findIndex((q) => q.id === fromId)
    const to = version.questions.findIndex((q) => q.id === toId)
    if (from < 0 || to < 0 || from === to) return
    const next = [...version.questions]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onReorder(next, moved.label, to + 1)
  }
  const shift = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= version.questions.length) return
    moveBefore(version.questions[index].id, version.questions[target].id)
  }

  return (
    <SectionCard
      icon={Target}
      title="Key assessment areas"
      subtitle="Questions to assess the proposal and strategic fit."
      count={version.questions.length}
      open={open}
      onOpenChange={setOpen}
      action={
        !readOnly && (
          <button
            type="button"
            onClick={onAdd}
            className="h-9 px-3 rounded-lg border border-[#36c0c9] bg-white text-xs font-semibold text-[#0d7280] hover:bg-[#f0fbfc] inline-flex items-center gap-1.5 cursor-pointer transition shrink-0"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Add question
          </button>
        )
      }
    >
      {version.questions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#cbd5e1] px-6 py-8 flex flex-col items-center gap-1.5 text-center">
          <span className="text-sm font-bold">No assessment questions yet</span>
          <span className="text-xs text-[#64748b]">
            Vendors would only fill in the company information.
          </span>
        </div>
      ) : (
        version.questions.map((q, index) => (
          <div
            key={q.id}
            data-testid="question-card"
            draggable={!readOnly}
            onDragStart={(e) => {
              if (!fromHandle.current) {
                e.preventDefault()
                return
              }
              setDragId(q.id)
              if (e.dataTransfer) {
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', q.id)
              }
            }}
            onDragOver={(e) => {
              if (!dragId) return
              e.preventDefault()
              if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
              if (overId !== q.id) setOverId(q.id)
            }}
            onDrop={(e) => {
              e.preventDefault()
              if (dragId) moveBefore(dragId, q.id)
              reset()
            }}
            onDragEnd={reset}
            className={`rounded-xl ${dragId === q.id ? 'opacity-40' : ''} ${
              overId === q.id && dragId !== q.id ? 'ring-2 ring-[#36c0c9]' : ''
            }`}
          >
            <Row
              label={q.label}
              helper={q.helper}
              required={q.required}
              hidden={!q.visible}
              selected={selectedId === q.id}
              onSelect={() => onSelect(q.id)}
              extra={
                <span className="flex items-center gap-2 pt-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[10px] font-semibold text-[#475569]">
                    {ANSWER_TYPE_LABELS[q.type]}
                    {isChoiceType(q.type) && ` · ${q.options.length} options`}
                  </span>
                  {q.aiCheck && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#f3e8ff] text-[10px] font-semibold text-[#7e22ce]">
                      <Sparkles className="w-3 h-3" aria-hidden="true" />
                      AI check
                    </span>
                  )}
                </span>
              }
              handle={
                !readOnly && (
                  <button
                    type="button"
                    aria-label={`Reorder question ${index + 1}`}
                    title="Drag to reorder, or press the up and down arrow keys"
                    onMouseDown={() => {
                      fromHandle.current = true
                    }}
                    onTouchStart={() => {
                      fromHandle.current = true
                    }}
                    onMouseUp={() => {
                      fromHandle.current = false
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                        e.preventDefault()
                        shift(index, e.key === 'ArrowUp' ? -1 : 1)
                      }
                    }}
                    className="w-5 h-7 -ml-1 shrink-0 flex items-center justify-center text-[#94a3b8] hover:text-[#0d212c] cursor-grab active:cursor-grabbing bg-transparent border-0 p-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>
                )
              }
              actions={
                <>
                  {!readOnly && (
                    <button
                      type="button"
                      aria-label={`Remove question ${index + 1}`}
                      title="Remove question"
                      onClick={() => onRemove(q)}
                      className="w-8 h-8 flex items-center justify-center text-red-500 cursor-pointer bg-transparent border-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </>
              }
            />
          </div>
        ))
      )}
    </SectionCard>
  )
}

/* ---------- Side panel ---------- */

const PanelShell: React.FC<{
  icon: React.ElementType
  readOnly: boolean
  dirty: boolean
  saveLabel: string
  onClose: () => void
  onCancel: () => void
  onSave: () => void
  children: React.ReactNode
}> = ({ icon: Icon, readOnly, dirty, saveLabel, onClose, onCancel, onSave, children }) => (
  <>
    <div className="flex items-center gap-3 px-5 py-4 border-b border-[#f1f5f9] shrink-0">
      <span className="w-9 h-9 rounded-lg bg-[#e6f7f8] text-[#0d7280] flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" aria-hidden="true" />
      </span>
      <div className="flex flex-col flex-1 min-w-0">
        <h3 className="text-base font-bold text-[#0d212c]">Edit question</h3>
        {readOnly && (
          <span className="text-[11px] text-[#64748b]">This version cannot be edited.</span>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close panel"
        className="text-[#94a3b8] hover:text-[#0d212c] cursor-pointer bg-transparent border-0 p-1"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
    <div className="px-5 py-5 overflow-y-auto flex flex-col gap-5">{children}</div>
    {!readOnly && (
      <div className="px-5 py-3.5 flex items-center justify-end gap-3 border-t border-[#f1f5f9] shrink-0">
        <button
          type="button"
          onClick={onCancel}
          disabled={!dirty}
          className={`${SECONDARY_BUTTON} disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          Cancel
        </button>
        <button type="button" onClick={onSave} disabled={!dirty} className={LIGHT_PRIMARY_BUTTON}>
          {saveLabel}
        </button>
      </div>
    )}
  </>
)

const FieldPanel: React.FC<{
  field: CompanyField
  readOnly: boolean
  onClose: () => void
  onSave: (after: CompanyField) => void
}> = ({ field, readOnly, onClose, onSave }) => {
  const [draft, setDraft] = useState(field)
  const dirty = describeFieldEdit(field, draft).length > 0
  const Icon = FIELD_ICONS[field.key]
  return (
    <PanelShell
      icon={Icon}
      readOnly={readOnly}
      dirty={dirty && draft.label.trim().length > 0}
      saveLabel="Save changes"
      onClose={onClose}
      onCancel={() => setDraft(field)}
      onSave={() => {
        const next = { ...draft, label: draft.label.trim() }
        setDraft(next)
        onSave(next)
      }}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="pf-field-label" className="text-xs font-bold text-[#0d212c]">
          Question <span className="text-red-500">*</span>
        </label>
        <input
          id="pf-field-label"
          type="text"
          disabled={readOnly}
          value={draft.label}
          onChange={(e) => setDraft({ ...draft, label: e.target.value })}
          className={FIELD_CLASS}
        />
      </div>
      {field.helper !== undefined && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pf-field-helper" className="text-xs font-bold text-[#0d212c]">
            Help text
          </label>
          <input
            id="pf-field-helper"
            type="text"
            disabled={readOnly}
            value={draft.helper ?? ''}
            onChange={(e) => setDraft({ ...draft, helper: e.target.value })}
            className={FIELD_CLASS}
          />
        </div>
      )}
      <div className="flex items-center gap-3">
        {!field.neverRequired && (
          <>
            <Checkbox
              checked={field.locked ? true : draft.required}
              label="Required question"
              ariaLabel={`Require ${field.label}`}
              disabled={readOnly || Boolean(field.locked) || !draft.visible}
              tooltip={field.locked ? 'Always required' : undefined}
              onChange={(next) => setDraft({ ...draft, required: next })}
            />
            <span aria-hidden="true" className="self-stretch w-px bg-[#e2e8f0]" />
          </>
        )}
        <Checkbox
          checked={field.locked ? true : draft.visible}
          label="Show"
          ariaLabel={`Show ${field.label}`}
          disabled={readOnly || Boolean(field.locked)}
          tooltip={field.locked ? 'Always shown' : undefined}
          onChange={(next) =>
            setDraft({ ...draft, visible: next, required: next ? draft.required : false })
          }
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold text-[#0d212c]">Question type</span>
        <div className="h-10 px-3 rounded-md border border-[#e2e8f0] bg-[#f8fafc] flex items-center gap-2 text-sm text-[#475569]">
          <Icon className="w-4 h-4" aria-hidden="true" />
          {FIELD_TYPE_LABEL[field.key]}
          <span className="ml-auto text-[11px] text-[#94a3b8]">Fixed</span>
        </div>
      </div>
    </PanelShell>
  )
}

export const QuestionPanel: React.FC<{
  question: FormQuestion
  readOnly: boolean
  onClose: () => void
  onSave: (after: FormQuestion) => void
}> = ({ question, readOnly, onClose, onSave }) => {
  const [draft, setDraft] = useState(question)
  const [showErrors, setShowErrors] = useState(false)
  const dirty = JSON.stringify(draft) !== JSON.stringify(question)
  const save = () => {
    setShowErrors(true)
    const errors = validateQuestion(draft)
    if (errors.label || errors.options) return
    const next = tidyQuestion(draft)
    setDraft(next)
    onSave(next)
  }
  return (
    <PanelShell
      icon={TYPE_ICONS[draft.type]}
      readOnly={readOnly}
      dirty={dirty}
      saveLabel="Save question"
      onClose={onClose}
      onCancel={() => {
        setDraft(question)
        setShowErrors(false)
      }}
      onSave={save}
    >
      <QuestionFields
        value={draft}
        onChange={setDraft}
        showErrors={showErrors}
        readOnly={readOnly}
      />
    </PanelShell>
  )
}
