'use client'

import React, { useMemo, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  History,
  Globe,
  ListChecks,
  Pencil,
  Trash2,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import {
  blankQuestion,
  describeChanges,
  describeFieldEdit,
  describeQuestionEdit,
  formatDate,
  makeAudit,
  type CompanyField,
  newSection,
  totalQuestions,
  type FormQuestion,
  type FormSection,
  type FormVersion,
} from './partnershipForm.data'
import {
  FIELD_CLASS,
  LIGHT_PRIMARY_BUTTON,
  Modal,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  TERTIARY_BUTTON,
  VersionStatusChip,
  WORKFLOW_CHIP,
} from './PartnershipFormParts'
import { PartnershipFormAuditLog } from './PartnershipFormAuditLog'
import { PartnershipFormPreview } from './PartnershipFormPreview'
import { PartnershipFormPublicTab } from './PartnershipFormPublicTab'
import { PartnershipFormQuestionsTab } from './PartnershipFormQuestionsTab'
import { PartnershipFormSectionsTab } from './PartnershipFormSectionsTab'
import { PartnershipQuestionDialog } from './PartnershipQuestionDialog'

type Tab = 'questions' | 'public' | 'audit'

interface PartnershipFormEditorProps {
  version: FormVersion
  /** All versions, to tell what is live and whether a draft already exists */
  versions: FormVersion[]
  onBack: () => void
  onChange: (version: FormVersion) => void
  onPublish: (version: FormVersion, note: string) => void
  onDiscard: (version: FormVersion) => void
  onOpenDraft: () => void
  /** Whether vendors can submit the live form */
  accepting: boolean
  onAcceptingChange: (next: boolean) => void
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
  accepting,
  onAcceptingChange,
  onToast,
}) => {
  const [tab, setTab] = useState<Tab>('questions')
  const [adding, setAdding] = useState<{
    question: FormQuestion
    section?: FormSection
    company?: boolean
  } | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [discarding, setDiscarding] = useState(false)
  const [removingSection, setRemovingSection] = useState<FormSection | null>(null)
  // Removing a question asks first; the pending removal runs once the admin confirms
  const [removingQuestion, setRemovingQuestion] = useState<{
    label: string
    remove: () => void
  } | null>(null)
  const [publishNote, setPublishNote] = useState('')

  const isDraft = version.status === 'draft'
  const isLive = version.status === 'live'
  const activeTab: Tab = tab === 'public' && !isLive ? 'questions' : tab
  const sameWorkflow = versions.filter((v) => v.workflow === version.workflow)
  const live = sameWorkflow.find((v) => v.status === 'live')
  const openDraft = sameWorkflow.find((v) => v.status === 'draft')
  const changes = useMemo(() => describeChanges(live, version), [live, version])

  /** Saves a change and writes it to the version's audit log */
  const update = (patch: Partial<FormVersion>, event?: { title: string; description: string }) =>
    onChange({
      ...version,
      ...patch,
      editedAt: formatDate(),
      auditLog: event
        ? [...version.auditLog, makeAudit(event.title, event.description)]
        : version.auditLog,
    })

  const saveField = (before: CompanyField, after: CompanyField) => {
    update(
      { companyFields: version.companyFields.map((f) => (f.key === after.key ? after : f)) },
      {
        title: 'Edited a company field',
        description: `${before.label}: ${describeFieldEdit(before, after).join(', ')}.`,
      }
    )
    onToast('Field updated.')
  }

  const addCompanyQuestion = (question: FormQuestion) => {
    update(
      { companyQuestions: [...version.companyQuestions, question] },
      {
        title: 'Added a company field',
        description: `"${question.label}" was added to the company information.`,
      }
    )
    onToast('Field added.')
  }

  const saveCompanyQuestion = (before: FormQuestion, after: FormQuestion) => {
    update(
      { companyQuestions: version.companyQuestions.map((q) => (q.id === after.id ? after : q)) },
      {
        title: 'Edited a company field',
        description: `"${after.label}": ${describeQuestionEdit(before, after).join(', ')}.`,
      }
    )
    onToast('Field updated.')
  }

  const removeCompanyQuestion = (question: FormQuestion) => {
    const before = version
    update(
      { companyQuestions: version.companyQuestions.filter((q) => q.id !== question.id) },
      {
        title: 'Removed a company field',
        description: `"${question.label}" was removed from the company information.`,
      }
    )
    onToast('Field removed.', () => onChange(before))
  }

  const saveQuestion = (before: FormQuestion, after: FormQuestion) => {
    update(
      { questions: version.questions.map((q) => (q.id === after.id ? after : q)) },
      {
        title: 'Edited a question',
        description: `"${after.label}": ${describeQuestionEdit(before, after).join(', ')}.`,
      }
    )
    onToast('Question updated.')
  }

  /** Replaces the sections of a custom form and logs it */
  const updateSections = (sections: FormSection[], event: { title: string; description: string }) =>
    update({ sections }, event)

  const addSection = (title: string) => {
    updateSections([...version.sections, newSection(title)], {
      title: 'Created a section',
      description: `The section "${title}" was created.`,
    })
    onToast('Section created.')
  }

  const renameSection = (section: FormSection, title: string) =>
    updateSections(
      version.sections.map((s) => (s.id === section.id ? { ...s, title } : s)),
      {
        title: 'Renamed a section',
        description: `"${section.title}" is now "${title}".`,
      }
    )

  const removeSection = (section: FormSection) => {
    const before = version
    updateSections(
      version.sections.filter((s) => s.id !== section.id),
      {
        title: 'Removed a section',
        description: `The section "${section.title}" and its ${section.questions.length} questions were removed.`,
      }
    )
    onToast('Section removed.', () => onChange(before))
  }

  const mapSection = (id: string, fn: (questions: FormQuestion[]) => FormQuestion[]) =>
    version.sections.map((s) => (s.id === id ? { ...s, questions: fn(s.questions) } : s))

  const addQuestionToSection = (section: FormSection, question: FormQuestion) => {
    updateSections(
      mapSection(section.id, (qs) => [...qs, question]),
      {
        title: 'Added a question',
        description: `"${question.label}" was added to "${section.title}".`,
      }
    )
    onToast('Question added.')
  }

  const saveSectionQuestion = (before: FormQuestion, after: FormQuestion) => {
    updateSections(
      version.sections.map((s) => ({
        ...s,
        questions: s.questions.map((q) => (q.id === after.id ? after : q)),
      })),
      {
        title: 'Edited a question',
        description: `"${after.label}": ${describeQuestionEdit(before, after).join(', ')}.`,
      }
    )
    onToast('Question updated.')
  }

  const removeSectionQuestion = (section: FormSection, question: FormQuestion) => {
    const before = version
    updateSections(
      mapSection(section.id, (qs) => qs.filter((q) => q.id !== question.id)),
      {
        title: 'Removed a question',
        description: `"${question.label}" was removed from "${section.title}".`,
      }
    )
    onToast('Question removed.', () => onChange(before))
  }

  const reorderSection = (
    section: FormSection,
    questions: FormQuestion[],
    movedLabel: string,
    position: number
  ) =>
    updateSections(
      mapSection(section.id, () => questions),
      {
        title: 'Reordered the questions',
        description: `"${movedLabel}" moved to position ${position} in "${section.title}".`,
      }
    )

  const addQuestion = (question: FormQuestion) => {
    update(
      { questions: [...version.questions, question] },
      { title: 'Added a question', description: `"${question.label}" was added.` }
    )
    setAdding(null)
    onToast('Question added.')
  }

  const removeQuestion = (question: FormQuestion) => {
    const before = version
    update(
      { questions: version.questions.filter((q) => q.id !== question.id) },
      { title: 'Removed a question', description: `"${question.label}" was removed.` }
    )
    onToast('Question removed.', () => onChange(before))
  }

  const reorder = (questions: FormQuestion[], movedLabel: string, position: number) =>
    update(
      { questions },
      {
        title: 'Reordered the questions',
        description: `"${movedLabel}" moved to position ${position}.`,
      }
    )

  const openPublish = () => {
    setPublishNote(version.note)
    setPublishing(true)
  }

  const tabButton = (key: Tab, label: string, Icon: React.ElementType) => (
    <button
      key={key}
      type="button"
      role="tab"
      aria-selected={activeTab === key}
      onClick={() => setTab(key)}
      className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition cursor-pointer bg-transparent ${
        activeTab === key
          ? 'border-[#36c0c9] text-[#0d212c]'
          : 'border-transparent text-[#64748b] hover:text-[#0d212c]'
      }`}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
      {label}
    </button>
  )

  return (
    <div className="flex flex-col gap-5 w-full p-6 text-[#0d212c]">
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
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${WORKFLOW_CHIP[version.workflow]}`}
            >
              {version.workflow}
            </span>
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
                ? `Published ${version.publishedAt}. This is the form vendors see now. It cannot be edited.`
                : `Published ${version.publishedAt}, now archived. It cannot be edited.`}
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

      <div
        role="tablist"
        aria-label="Form sections"
        className="flex items-center gap-1 border-b border-[#e2e8f0]"
      >
        {tabButton('questions', 'Questions', ListChecks)}
        {isLive && tabButton('public', 'Public form', Globe)}
        {tabButton('audit', 'Audit log', History)}
      </div>

      {activeTab === 'questions' && version.layout === 'custom' && (
        <PartnershipFormSectionsTab
          version={version}
          readOnly={!isDraft}
          onAddSection={addSection}
          onRenameSection={renameSection}
          onRemoveSection={setRemovingSection}
          onAddQuestion={(section) => setAdding({ question: blankQuestion(), section })}
          onSaveQuestion={saveSectionQuestion}
          onRemoveQuestion={(section, question) =>
            setRemovingQuestion({
              label: question.label,
              remove: () => removeSectionQuestion(section, question),
            })
          }
          onReorder={reorderSection}
        />
      )}

      {activeTab === 'questions' && version.layout === 'standard' && (
        <PartnershipFormQuestionsTab
          version={version}
          readOnly={!isDraft}
          onAdd={() => setAdding({ question: blankQuestion() })}
          onAddCompany={() => setAdding({ question: blankQuestion(), company: true })}
          onSaveCompanyQuestion={saveCompanyQuestion}
          onRemoveCompany={(question) =>
            setRemovingQuestion({
              label: question.label,
              remove: () => removeCompanyQuestion(question),
            })
          }
          onSaveField={saveField}
          onSaveQuestion={saveQuestion}
          onRemove={(question) =>
            setRemovingQuestion({
              label: question.label,
              remove: () => removeQuestion(question),
            })
          }
          onReorder={reorder}
        />
      )}

      {activeTab === 'public' && (
        <PartnershipFormPublicTab
          version={version}
          accepting={accepting}
          onAcceptingChange={onAcceptingChange}
          onViewPublic={() => setPreviewing(true)}
          onToast={onToast}
        />
      )}

      {activeTab === 'audit' && <PartnershipFormAuditLog version={version} />}

      {previewing && (
        <PartnershipFormPreview
          version={version}
          closed={isLive && !accepting}
          onClose={() => setPreviewing(false)}
        />
      )}

      {adding && (
        <PartnershipQuestionDialog
          question={adding.question}
          onSave={(q) => {
            if (adding.section) addQuestionToSection(adding.section, q)
            else if (adding.company) addCompanyQuestion(q)
            else addQuestion(q)
            setAdding(null)
          }}
          onClose={() => setAdding(null)}
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
              {totalQuestions(version)} questions in total after publishing.
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

      {removingQuestion && (
        <ConfirmDialog
          title="Delete this question?"
          description={`"${removingQuestion.label}" will be removed from this draft. Vendors are not affected.`}
          icon={Trash2}
          danger
          confirmLabel="Delete question"
          cancelLabel="Keep question"
          onCancel={() => setRemovingQuestion(null)}
          onConfirm={() => {
            removingQuestion.remove()
            setRemovingQuestion(null)
          }}
        />
      )}

      {removingSection && (
        <ConfirmDialog
          title="Delete this section?"
          description={`"${removingSection.title}" and its ${removingSection.questions.length} ${
            removingSection.questions.length === 1 ? 'question' : 'questions'
          } will be removed from this draft. Vendors are not affected.`}
          icon={Trash2}
          danger
          confirmLabel="Delete section"
          cancelLabel="Keep section"
          onCancel={() => setRemovingSection(null)}
          onConfirm={() => {
            removeSection(removingSection)
            setRemovingSection(null)
          }}
        />
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
