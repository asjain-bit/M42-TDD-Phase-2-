'use client'

import React, { useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  GripVertical,
  Info,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import {
  ANSWER_TYPE_LABELS,
  blankQuestion,
  describeChanges,
  formatDate,
  isChoiceType,
  type CompanyField,
  type FormQuestion,
  type FormVersion,
} from './partnershipForm.data'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import {
  Checkbox,
  FIELD_CLASS,
  LIGHT_PRIMARY_BUTTON,
  Modal,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  TERTIARY_BUTTON,
  VersionStatusChip,
} from './PartnershipFormParts'
import { PartnershipFormPreview } from './PartnershipFormPreview'
import { PartnershipQuestionDialog } from './PartnershipQuestionDialog'

interface PartnershipFormEditorProps {
  version: FormVersion
  /** All versions, to tell what is live and whether a draft already exists */
  versions: FormVersion[]
  onBack: () => void
  onChange: (version: FormVersion) => void
  onPublish: (version: FormVersion, note: string) => void
  onDiscard: (version: FormVersion) => void
  onOpenDraft: () => void
  onToast: (message: string, undo?: () => void) => void
}

export const PartnershipFormEditor: React.FC<PartnershipFormEditorProps> = ({
  version,
  versions,
  onBack,
  onChange,
  onPublish,
  onDiscard,
  onOpenDraft,
  onToast,
}) => {
  const [editing, setEditing] = useState<{ question: FormQuestion; isNew: boolean } | null>(null)
  const [editingCompany, setEditingCompany] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [discarding, setDiscarding] = useState(false)
  const [publishNote, setPublishNote] = useState('')

  const isDraft = version.status === 'draft'
  const live = versions.find((v) => v.status === 'live')
  const openDraft = versions.find((v) => v.status === 'draft')
  const changes = useMemo(() => describeChanges(live, version), [live, version])

  const update = (patch: Partial<FormVersion>) =>
    onChange({ ...version, ...patch, editedAt: formatDate() })

  const updateField = (key: CompanyField['key'], patch: Partial<CompanyField>) =>
    update({
      companyFields: version.companyFields.map((f) => (f.key === key ? { ...f, ...patch } : f)),
    })

  const saveQuestion = (question: FormQuestion) => {
    const exists = version.questions.some((q) => q.id === question.id)
    update({
      questions: exists
        ? version.questions.map((q) => (q.id === question.id ? question : q))
        : [...version.questions, question],
    })
    setEditing(null)
    onToast(exists ? 'Question updated.' : 'Question added.')
  }

  const removeQuestion = (question: FormQuestion) => {
    const before = version
    update({ questions: version.questions.filter((q) => q.id !== question.id) })
    onToast('Question removed.', () => onChange(before))
  }

  const openPublish = () => {
    setPublishNote(version.note)
    setPublishing(true)
  }

  return (
    <div className="flex flex-col gap-5 w-full max-w-6xl mx-auto p-6 text-[#0d212c]">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 w-fit text-xs font-semibold text-[#64748b] hover:text-[#0d212c] transition cursor-pointer bg-transparent border-0 p-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to versions
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-extrabold">Version {version.number}</h2>
            <VersionStatusChip status={version.status} />
            {isDraft && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#64748b]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#16a34a]" aria-hidden="true" />
                Changes save automatically
              </span>
            )}
          </div>
          {!isDraft && (
            <p className="text-xs text-[#64748b]">
              {version.status === 'live'
                ? `Published ${version.publishedAt}. This is the form vendors see now.`
                : `Published ${version.publishedAt}, now archived.`}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button type="button" onClick={() => setPreviewing(true)} className={TERTIARY_BUTTON}>
            <Eye className="w-4 h-4" aria-hidden="true" />
            Preview as vendor
          </button>
          {isDraft ? (
            <>
              <button
                type="button"
                onClick={() => setDiscarding(true)}
                className={SECONDARY_BUTTON}
              >
                Discard draft
              </button>
              <button
                type="button"
                onClick={openPublish}
                disabled={changes.length === 0}
                title={changes.length === 0 ? 'Make a change before publishing.' : undefined}
                className={LIGHT_PRIMARY_BUTTON}
              >
                Publish
              </button>
            </>
          ) : openDraft ? (
            <button type="button" onClick={onOpenDraft} className={PRIMARY_BUTTON}>
              <Pencil className="w-4 h-4" />
              Open Version {openDraft.number} draft
            </button>
          ) : null}
        </div>
      </div>

      {!isDraft && (
        <div className="flex items-start gap-2.5 rounded-xl bg-[#f0f9ff] px-4 py-3 text-xs text-[#0c4a6e] leading-relaxed">
          <Info className="w-4 h-4 shrink-0 mt-px text-[#0369a1]" aria-hidden="true" />
          This version is {version.status === 'live' ? 'live' : 'archived'} and cannot be edited.
          Use New draft on the versions page to make changes.
        </div>
      )}

      <CompanySection
        version={version}
        readOnly={!isDraft}
        editing={editingCompany && isDraft}
        onToggleEditing={() => setEditingCompany((on) => !on)}
        onField={updateField}
      />
      <QuestionsSection
        version={version}
        readOnly={!isDraft}
        onAdd={() => setEditing({ question: blankQuestion(), isNew: true })}
        onEdit={(question) => setEditing({ question, isNew: false })}
        onReorder={(questions) => update({ questions })}
        onRemove={removeQuestion}
      />

      {previewing && (
        <PartnershipFormPreview version={version} onClose={() => setPreviewing(false)} />
      )}

      {editing && (
        <PartnershipQuestionDialog
          question={editing.question}
          isNew={editing.isNew}
          onSave={saveQuestion}
          onClose={() => setEditing(null)}
        />
      )}

      {publishing && (
        <Modal
          title={`Publish Version ${version.number}?`}
          description={`Vendors see this version as soon as you publish.${
            live ? ` Requests already submitted keep Version ${live.number}.` : ''
          }`}
          onClose={() => setPublishing(false)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setPublishing(false)}
                className={SECONDARY_BUTTON}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setPublishing(false)
                  onPublish(version, publishNote.trim())
                }}
                className={LIGHT_PRIMARY_BUTTON}
              >
                Publish
              </button>
            </>
          }
        >
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold">
              {changes.length} unpublished {changes.length === 1 ? 'change' : 'changes'}
            </span>
            <ul className="flex flex-col gap-1.5 max-h-48 overflow-y-auto rounded-lg bg-[#f8fafc] p-3 text-xs text-[#334155]">
              {changes.map((change) => (
                <li key={change} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-[#36c0c9] shrink-0" />
                  {change}
                </li>
              ))}
            </ul>
            <span className="text-[11px] text-[#64748b]">
              {version.questions.length} questions in total after publishing.
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pf-publish-note" className="text-xs font-bold">
              Version note <span className="font-normal text-[#94a3b8]">(optional)</span>
            </label>
            <input
              id="pf-publish-note"
              type="text"
              value={publishNote}
              onChange={(e) => setPublishNote(e.target.value)}
              placeholder="e.g. Added a data residency question"
              className={FIELD_CLASS}
            />
          </div>
        </Modal>
      )}

      {discarding && (
        <ConfirmDialog
          title="Discard this draft?"
          description={`Version ${version.number} has ${changes.length} ${
            changes.length === 1 ? 'unpublished change' : 'unpublished changes'
          }. They will be lost. Vendors are not affected.`}
          icon={Trash2}
          danger
          confirmLabel="Discard draft"
          cancelLabel="Keep draft"
          onCancel={() => setDiscarding(false)}
          onConfirm={() => {
            setDiscarding(false)
            onDiscard(version)
          }}
        />
      )}
    </div>
  )
}

const SectionHeading: React.FC<{
  title: string
  description?: string
  /** Shown in a tooltip behind an info icon instead of upfront */
  info?: string
  action?: React.ReactNode
}> = ({ title, description, info, action }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2">
        <h3 className="text-base font-bold">{title}</h3>
        {info && (
          <span className="relative group inline-flex">
            <button
              type="button"
              aria-label={`About ${title.toLowerCase()}`}
              aria-describedby="pf-company-info"
              className="text-[#94a3b8] hover:text-[#0d212c] transition cursor-pointer bg-transparent border-0 p-0 inline-flex"
            >
              <Info className="w-4 h-4" aria-hidden="true" />
            </button>
            <span
              id="pf-company-info"
              role="tooltip"
              className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity absolute left-0 top-full mt-2 z-30 w-72 p-2.5 bg-[#0d212c] text-white text-[11px] font-medium leading-relaxed rounded-xl shadow-xl"
            >
              {info}
            </span>
          </span>
        )}
      </div>
      {description && <p className="text-xs text-[#64748b]">{description}</p>}
    </div>
    {action}
  </div>
)

/** The company fields laid out as vendors see them: four full-width, then a row of three and a row of two */
const COMPANY_ROWS: CompanyField['key'][][] = [
  ['vendorId'],
  ['vendorName'],
  ['jobTitle'],
  ['companyName'],
  ['phone'],
  ['email'],
  ['yearFounded'],
  ['website'],
  ['country'],
]

const CompanySection: React.FC<{
  version: FormVersion
  readOnly: boolean
  /** Every field is editable in place while this is on */
  editing: boolean
  onToggleEditing: () => void
  onField: (key: CompanyField['key'], patch: Partial<CompanyField>) => void
}> = ({ version, readOnly, editing, onToggleEditing, onField }) => (
  <section className="flex flex-col gap-3" aria-labelledby="pf-company-heading">
    <div id="pf-company-heading">
      <SectionHeading
        title="Company information"
        info="These fields are fixed and cannot be removed. Edit the wording, and choose which are shown and which are required."
        action={
          !readOnly && (
            <button
              type="button"
              onClick={onToggleEditing}
              aria-pressed={editing}
              className={`${TERTIARY_BUTTON} shrink-0`}
            >
              {editing ? (
                <Check className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Pencil className="w-4 h-4" aria-hidden="true" />
              )}
              {editing ? 'Done' : 'Edit'}
            </button>
          )
        }
      />
    </div>
    <div className="rounded-2xl border border-[#e2e8f0] bg-white shadow-xs px-6 sm:px-10 lg:px-14 py-7">
      <ul className="flex flex-col gap-5">
        {COMPANY_ROWS.map((keys) => (
          <li
            key={keys.join('-')}
            className={`grid grid-cols-1 gap-x-6 gap-y-5 ${
              keys.length === 3 ? 'sm:grid-cols-3' : keys.length === 2 ? 'sm:grid-cols-2' : ''
            }`}
          >
            {keys.map((key) => {
              const field = version.companyFields.find((f) => f.key === key)
              if (!field) return null
              return (
                <div key={key} className="flex flex-col gap-1.5 min-w-0">
                  {editing ? (
                    <input
                      type="text"
                      aria-label={`Name of ${field.key}`}
                      value={field.label}
                      onChange={(e) => onField(field.key, { label: e.target.value })}
                      className={`${FIELD_CLASS} !py-1.5 !text-xs font-semibold`}
                    />
                  ) : (
                    <div className="flex items-center gap-1.5 min-h-6">
                      <span
                        data-testid="company-label"
                        className={`text-xs font-semibold leading-snug ${
                          field.visible ? 'text-[#0d212c]' : 'text-[#94a3b8]'
                        }`}
                      >
                        {field.label}
                        {field.required && (
                          <span className="text-red-500" aria-label="required">
                            {' '}
                            *
                          </span>
                        )}
                      </span>
                      {!field.visible && (
                        <span className="px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[10px] font-semibold text-[#64748b]">
                          Hidden from vendors
                        </span>
                      )}
                    </div>
                  )}
                  {field.helper && (
                    <p className="text-[11px] text-[#64748b] leading-relaxed">{field.helper}</p>
                  )}
                  {editing && (
                    <div className="flex items-center gap-3 pt-0.5">
                      {!field.neverRequired && (
                        <>
                          <Checkbox
                            checked={field.locked ? true : field.required}
                            label="Required question"
                            ariaLabel={`Require ${field.label}`}
                            disabled={Boolean(field.locked || !field.visible)}
                            tooltip={field.locked ? 'Always required' : undefined}
                            onChange={(next) => onField(field.key, { required: next })}
                          />
                          <span aria-hidden="true" className="self-stretch w-px bg-[#e2e8f0]" />
                        </>
                      )}
                      <Checkbox
                        checked={field.locked ? true : field.visible}
                        label="Show"
                        ariaLabel={`Show ${field.label}`}
                        disabled={Boolean(field.locked)}
                        tooltip={field.locked ? 'Always shown' : undefined}
                        onChange={(next) =>
                          onField(field.key, {
                            visible: next,
                            required: next ? field.required : false,
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </li>
        ))}
      </ul>
    </div>
  </section>
)

const QuestionsSection: React.FC<{
  version: FormVersion
  readOnly: boolean
  onAdd: () => void
  onEdit: (question: FormQuestion) => void
  onReorder: (questions: FormQuestion[]) => void
  onRemove: (question: FormQuestion) => void
}> = ({ version, readOnly, onAdd, onEdit, onReorder, onRemove }) => {
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  // A card only drags from its handle, so the text in it stays selectable
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
    onReorder(next)
  }

  const shift = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= version.questions.length) return
    moveBefore(version.questions[index].id, version.questions[target].id)
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="pf-questions-heading">
      <div id="pf-questions-heading">
        <SectionHeading
          title="Key assessment areas"
          description={
            readOnly
              ? 'Shown to the vendor in this order.'
              : 'Shown to the vendor in this order. Hover a question and drag the handle on its left to reorder.'
          }
          action={
            !readOnly && (
              <button type="button" onClick={onAdd} className={`${PRIMARY_BUTTON} shrink-0`}>
                <Plus className="w-4 h-4" />
                Add question
              </button>
            )
          }
        />
      </div>

      {version.questions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#cbd5e1] bg-white px-6 py-10 flex flex-col items-center gap-2 text-center">
          <span className="text-sm font-bold">No assessment questions yet</span>
          <span className="text-xs text-[#64748b]">
            Vendors would only fill in the company information.
          </span>
          {!readOnly && (
            <button type="button" onClick={onAdd} className={`${SECONDARY_BUTTON} mt-2`}>
              <Plus className="w-4 h-4" />
              Add the first question
            </button>
          )}
        </div>
      ) : (
        <ol className="flex flex-col gap-3">
          {version.questions.map((q, index) => (
            <li
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
              className={`group rounded-xl border bg-white shadow-xs px-5 py-4 flex items-start gap-3 transition ${
                dragId === q.id ? 'opacity-40' : ''
              } ${
                overId === q.id && dragId !== q.id
                  ? 'border-[#36c0c9] ring-1 ring-[#36c0c9]'
                  : 'border-[#e2e8f0]'
              }`}
            >
              {!readOnly && (
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
                  className="w-6 h-7 mt-0.5 -ml-2 shrink-0 flex items-center justify-center text-[#94a3b8] hover:text-[#0d212c] cursor-grab active:cursor-grabbing bg-transparent border-0 p-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                >
                  <GripVertical className="w-4 h-4" />
                </button>
              )}
              <span className="w-7 h-7 rounded-full bg-[#f1f5f9] text-[#64748b] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <p className="text-sm font-semibold leading-snug">
                  {q.label}
                  {q.required && (
                    <span className="text-red-500" aria-label="required">
                      {' '}
                      *
                    </span>
                  )}
                </p>
                {q.helper && (
                  <p className="text-xs text-[#64748b] leading-relaxed line-clamp-1">{q.helper}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#f1f5f9] text-[11px] font-semibold text-[#475569]">
                    {ANSWER_TYPE_LABELS[q.type]}
                    {isChoiceType(q.type) && ` · ${q.options.length} options`}
                  </span>
                  {q.aiCheck && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f3e8ff] text-[11px] font-semibold text-[#7e22ce]">
                      <Sparkles className="w-3 h-3" aria-hidden="true" />
                      AI check
                    </span>
                  )}
                  {!q.required && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#f1f5f9] text-[11px] font-semibold text-[#64748b]">
                      Optional
                    </span>
                  )}
                </div>
              </div>
              {!readOnly && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    aria-label={`Edit question ${index + 1}`}
                    title="Edit question"
                    onClick={() => onEdit(q)}
                    className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:text-[#0d212c] cursor-pointer bg-transparent border-0"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove question ${index + 1}`}
                    title="Remove question"
                    onClick={() => onRemove(q)}
                    className="w-8 h-8 flex items-center justify-center text-red-500 cursor-pointer bg-transparent border-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
