'use client'

/**
 * ManageQuestionnairesModal — Organism
 * Popup behind the Internal Canvas "Add questionnaire" button, with two tabs: add a new
 * questionnaire, or pick one from all questionnaires and edit its title and questions.
 * Used in: PartnershipDetail
 */

import React, { useEffect, useId, useState } from 'react'
import { ArrowLeft, ListChecks, Pencil, Trash2, X } from 'lucide-react'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { QuestionnaireForm } from '@/components/organisms/QuestionnaireForm'
import { useQuestionnaireLibrary } from '@/lib/useQuestionnaireLibrary'
import { addQuestionnaire, deleteQuestionnaire, updateQuestionnaire } from '@/types/questionnaires'
import type { QuestionnaireTemplate } from '@/types/questionnaires'
import type { ManageQuestionnairesModalProps } from './ManageQuestionnairesModal.types'

type Tab = 'new' | 'all'

export const ManageQuestionnairesModal: React.FC<ManageQuestionnairesModalProps> = ({
  onClose,
}) => {
  const library = useQuestionnaireLibrary()
  const [tab, setTab] = useState<Tab>('new')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<QuestionnaireTemplate | null>(null)
  const [formKey, setFormKey] = useState(0)
  const titleId = useId()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const editing = library.find((q) => q.id === editingId)

  const tabButton = (key: Tab, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === key}
      onClick={() => {
        setTab(key)
        setEditingId(null)
        setToast(null)
      }}
      className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition cursor-pointer ${
        tab === key
          ? 'border-[#36c0c9] text-[#0d212c]'
          : 'border-transparent text-[#64748b] hover:text-[#0d212c]'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 bg-[#0d212c]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative bg-white rounded-2xl max-w-3xl w-full h-[80vh] max-h-[90vh] shadow-2xl border border-[#e2e8f0] flex flex-col animate-in fade-in zoom-in-95"
      >
        <div className="flex items-start justify-between gap-3 px-6 sm:px-8 pt-6 sm:pt-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#36c0c9]/10 text-[#36c0c9] flex items-center justify-center shrink-0">
              <ListChecks className="w-5 h-5" />
            </div>
            <div>
              <h3 id={titleId} className="text-lg font-semibold text-[#0d212c]">
                Add questionnaire
              </h3>
              <p className="text-xs text-[#64748b] mt-0.5">
                Create a questionnaire, or edit one you already have.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close add questionnaire"
            className="text-[#94a3b8] hover:text-[#0d212c] p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          role="tablist"
          aria-label="Questionnaires"
          className="flex items-center gap-2 px-6 sm:px-8 mt-4 border-b border-[#e2e8f0] shrink-0"
        >
          {tabButton('new', 'Add new questionnaire')}
          {tabButton('all', 'All questionnaires')}
        </div>

        <div className="flex-1 min-h-0 flex flex-col gap-4 px-6 sm:px-8 pt-5 pb-5">
          {toast && (
            <p
              role="status"
              className="rounded-lg bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d] text-xs font-medium px-3.5 py-2.5"
            >
              {toast}
            </p>
          )}
          {tab === 'new' && (
            <QuestionnaireForm
              key={formKey}
              submitLabel="Save questionnaire"
              onSubmit={(draft) => {
                addQuestionnaire(draft)
                setFormKey((k) => k + 1)
                setToast(`"${draft.title}" was added. Find it under All questionnaires.`)
              }}
              onCancel={onClose}
            />
          )}
          {tab === 'all' && !editing && (
            <ul
              aria-label="All questionnaires"
              className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#e2e8f0] border-y border-[#e2e8f0]"
            >
              {library.map((q) => {
                const title = q.title ?? q.name
                return (
                  <li key={q.id} className="flex items-center justify-between gap-3 py-3">
                    <span className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-semibold text-[#0d212c] truncate">{title}</span>
                      <span className="text-xs text-[#64748b]">
                        {q.questions.length} {q.questions.length === 1 ? 'question' : 'questions'}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(q.id)
                          setToast(null)
                        }}
                        aria-label={`Edit ${title}`}
                        title="Edit"
                        className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:text-[#0d212c] cursor-pointer bg-transparent border-0 shrink-0"
                      >
                        <Pencil className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(q)}
                        disabled={library.length <= 1}
                        aria-label={`Delete ${title}`}
                        title={
                          library.length <= 1
                            ? 'The last questionnaire cannot be deleted'
                            : 'Delete'
                        }
                        className="w-8 h-8 flex items-center justify-center text-red-500 cursor-pointer bg-transparent border-0 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          {tab === 'all' && editing && (
            <>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="inline-flex items-center gap-1.5 w-fit text-xs font-semibold text-[#64748b] hover:text-[#0d212c] transition cursor-pointer bg-transparent border-0 p-0"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                All questionnaires
              </button>
              <QuestionnaireForm
                key={editing.id}
                initial={{
                  name: editing.name,
                  title: editing.title ?? editing.name,
                  questions: editing.questions,
                }}
                submitLabel="Save changes"
                onSubmit={(draft) => {
                  updateQuestionnaire(editing.id, draft)
                  setEditingId(null)
                  setToast(`"${draft.title}" was updated.`)
                }}
                onCancel={() => setEditingId(null)}
              />
            </>
          )}
        </div>
      </div>
      {deleting && (
        <ConfirmDialog
          title="Delete this questionnaire?"
          description={`"${deleting.title ?? deleting.name}" and its ${deleting.questions.length} questions will be deleted. This cannot be undone.`}
          icon={Trash2}
          danger
          confirmLabel="Delete questionnaire"
          cancelLabel="Cancel"
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            deleteQuestionnaire(deleting.id)
            setToast(`"${deleting.title ?? deleting.name}" was deleted.`)
            setDeleting(null)
          }}
        />
      )}
    </div>
  )
}
