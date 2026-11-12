'use client'

import React, { useRef, useState } from 'react'
import { GripVertical, LayoutList, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import {
  ANSWER_TYPE_LABELS,
  isChoiceType,
  type FormQuestion,
  type FormSection,
  type FormVersion,
} from './partnershipForm.data'
import { FIELD_CLASS, LIGHT_PRIMARY_BUTTON, Modal, SECONDARY_BUTTON } from './PartnershipFormParts'
import { QuestionPanel, Row, SectionCard } from './PartnershipFormQuestionsTab'

interface SectionsTabProps {
  version: FormVersion
  readOnly: boolean
  onAddSection: (title: string) => void
  onRenameSection: (section: FormSection, title: string) => void
  onRemoveSection: (section: FormSection) => void
  onAddQuestion: (section: FormSection) => void
  onSaveQuestion: (before: FormQuestion, after: FormQuestion) => void
  onRemoveQuestion: (section: FormSection, question: FormQuestion) => void
  onReorder: (
    section: FormSection,
    questions: FormQuestion[],
    movedLabel: string,
    position: number
  ) => void
}

/** A form started from scratch: first create a section, then add the input fields to it */
export const PartnershipFormSectionsTab: React.FC<SectionsTabProps> = ({
  version,
  readOnly,
  onAddSection,
  onRenameSection,
  onRemoveSection,
  onAddQuestion,
  onSaveQuestion,
  onRemoveQuestion,
  onReorder,
}) => {
  const [naming, setNaming] = useState<{ section?: FormSection } | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = version.sections.flatMap((s) => s.questions).find((q) => q.id === selectedId)

  const addSectionButton = !readOnly && (
    <button
      type="button"
      onClick={() => setNaming({})}
      className="h-9 px-3 rounded-lg border border-[#36c0c9] bg-white text-xs font-semibold text-[#0d7280] hover:bg-[#f0fbfc] inline-flex items-center gap-1.5 cursor-pointer transition"
    >
      <Plus className="w-4 h-4" aria-hidden="true" />
      Add section
    </button>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-5 items-start">
      <div className="flex flex-col gap-4 min-w-0">
        {version.sections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-white px-6 py-14 flex flex-col items-center gap-3 text-center">
            <span className="w-12 h-12 rounded-xl bg-[#e6f7f8] text-[#0d7280] flex items-center justify-center">
              <LayoutList className="w-6 h-6" aria-hidden="true" />
            </span>
            <h3 className="text-base font-bold">Start by creating a section</h3>
            <p className="text-xs text-[#64748b] max-w-sm leading-relaxed">
              A section groups related input fields, for example Company information. Create a
              section, then add its fields one by one.
            </p>
            {!readOnly && (
              <button
                type="button"
                onClick={() => setNaming({})}
                className={`${LIGHT_PRIMARY_BUTTON} mt-1`}
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                Create section
              </button>
            )}
          </div>
        ) : (
          <>
            {addSectionButton && <div className="flex justify-end">{addSectionButton}</div>}
            {version.sections.map((section) => (
              <SectionBlock
                key={section.id}
                section={section}
                readOnly={readOnly}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onRename={() => setNaming({ section })}
                onRemove={() => onRemoveSection(section)}
                onAddQuestion={() => onAddQuestion(section)}
                onRemoveQuestion={(q) => {
                  if (selectedId === q.id) setSelectedId(null)
                  onRemoveQuestion(section, q)
                }}
                onReorder={(questions, label, position) =>
                  onReorder(section, questions, label, position)
                }
              />
            ))}
          </>
        )}
      </div>

      <aside
        aria-label="Edit question"
        className="rounded-2xl border border-[#e2e8f0] bg-white shadow-xs lg:sticky lg:top-4 flex flex-col max-h-[calc(100vh-2rem)]"
      >
        {selected ? (
          <QuestionPanel
            key={selected.id}
            question={selected}
            readOnly={readOnly}
            onClose={() => setSelectedId(null)}
            onSave={(after) => onSaveQuestion(selected, after)}
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

      {naming && (
        <SectionNameDialog
          section={naming.section}
          onClose={() => setNaming(null)}
          onSave={(title) => {
            if (naming.section) onRenameSection(naming.section, title)
            else onAddSection(title)
            setNaming(null)
          }}
        />
      )}
    </div>
  )
}

const SectionNameDialog: React.FC<{
  section?: FormSection
  onSave: (title: string) => void
  onClose: () => void
}> = ({ section, onSave, onClose }) => {
  const [title, setTitle] = useState(section?.title ?? '')
  const [showError, setShowError] = useState(false)
  const save = () => {
    if (!title.trim()) return setShowError(true)
    onSave(title.trim())
  }
  return (
    <Modal
      title={section ? 'Rename section' : 'Create section'}
      description="A section groups related input fields on the form."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={SECONDARY_BUTTON}>
            Cancel
          </button>
          <button type="button" onClick={save} className={LIGHT_PRIMARY_BUTTON}>
            {section ? 'Save' : 'Create section'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="pf-section-title" className="text-xs font-bold text-[#0d212c]">
          Section name <span className="text-red-500">*</span>
        </label>
        <input
          id="pf-section-title"
          autoFocus
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          placeholder="e.g. Company information"
          className={FIELD_CLASS}
        />
        {showError && !title.trim() && (
          <p role="alert" className="text-[11px] text-red-600 font-medium">
            Enter a section name.
          </p>
        )}
      </div>
    </Modal>
  )
}

const SectionBlock: React.FC<{
  section: FormSection
  readOnly: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  onRename: () => void
  onRemove: () => void
  onAddQuestion: () => void
  onRemoveQuestion: (question: FormQuestion) => void
  onReorder: (questions: FormQuestion[], movedLabel: string, position: number) => void
}> = ({
  section,
  readOnly,
  selectedId,
  onSelect,
  onRename,
  onRemove,
  onAddQuestion,
  onRemoveQuestion,
  onReorder,
}) => {
  const [open, setOpen] = useState(true)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const fromHandle = useRef(false)
  const reset = () => {
    setDragId(null)
    setOverId(null)
    fromHandle.current = false
  }
  const moveBefore = (fromId: string, toId: string) => {
    const from = section.questions.findIndex((q) => q.id === fromId)
    const to = section.questions.findIndex((q) => q.id === toId)
    if (from < 0 || to < 0 || from === to) return
    const next = [...section.questions]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onReorder(next, moved.label, to + 1)
  }

  return (
    <SectionCard
      icon={LayoutList}
      title={section.title}
      subtitle="Input fields vendors fill in."
      count={section.questions.length}
      open={open}
      onOpenChange={setOpen}
      action={
        !readOnly && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onAddQuestion}
              className="h-9 px-3 rounded-lg border border-[#36c0c9] bg-white text-xs font-semibold text-[#0d7280] hover:bg-[#f0fbfc] inline-flex items-center gap-1.5 cursor-pointer transition"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Add question
            </button>
            <button
              type="button"
              aria-label={`Rename section ${section.title}`}
              title="Rename section"
              onClick={onRename}
              className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:text-[#0d212c] cursor-pointer bg-transparent border-0"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label={`Remove section ${section.title}`}
              title="Remove section"
              onClick={onRemove}
              className="w-8 h-8 flex items-center justify-center text-red-500 cursor-pointer bg-transparent border-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )
      }
    >
      {section.questions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#cbd5e1] px-6 py-8 flex flex-col items-center gap-1.5 text-center">
          <span className="text-sm font-bold">No questions in this section yet</span>
          <span className="text-xs text-[#64748b]">
            Add the first input field with Add question.
          </span>
        </div>
      ) : (
        section.questions.map((q, index) => (
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
                <span className="flex items-center gap-1.5 pt-1">
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
                    aria-label={`Reorder ${q.label}`}
                    title="Drag to reorder"
                    onMouseDown={() => {
                      fromHandle.current = true
                    }}
                    onMouseUp={() => {
                      fromHandle.current = false
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
                      e.preventDefault()
                      const target = index + (e.key === 'ArrowUp' ? -1 : 1)
                      if (section.questions[target]) moveBefore(q.id, section.questions[target].id)
                    }}
                    className="w-5 h-7 -ml-1 shrink-0 flex items-center justify-center text-[#94a3b8] hover:text-[#0d212c] cursor-grab active:cursor-grabbing bg-transparent border-0 p-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>
                )
              }
              actions={
                !readOnly && (
                  <button
                    type="button"
                    aria-label={`Remove ${q.label}`}
                    title="Remove question"
                    onClick={() => onRemoveQuestion(q)}
                    className="w-8 h-8 flex items-center justify-center text-red-500 cursor-pointer bg-transparent border-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )
              }
            />
          </div>
        ))
      )}
    </SectionCard>
  )
}
