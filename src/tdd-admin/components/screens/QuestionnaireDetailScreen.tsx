'use client'

import React, { useState } from 'react'
import { GripVertical, Trash2, ArrowLeft, Check, Pencil, Plus, X } from 'lucide-react'
import { Checkbox } from '@/tdd-admin/components/atoms/Checkbox'

export interface QuestionItem {
  id: number
  question: string
  responseCue: string
  researchNeeded: boolean
  attachmentRequired: boolean
  requiredQuestion?: boolean
}

export interface QuestionnaireDetailData {
  id: string
  title: string
  status: 'Ready' | 'Draft' | 'Processing'
  questionsCount: number
  initialEditMode?: boolean
  initialQuestions?: QuestionItem[]
}

interface QuestionnaireDetailScreenProps {
  questionnaire: QuestionnaireDetailData
  onBack: () => void
}

export const QuestionnaireDetailScreen: React.FC<QuestionnaireDetailScreenProps> = ({
  questionnaire,
  onBack,
}) => {
  const [status, setStatus] = useState<string>(questionnaire.status || 'Ready')
  const [isEditing, setIsEditing] = useState<boolean>(
    questionnaire.initialEditMode ?? questionnaire.status === 'Draft'
  )
  const [deletingQuestionId, setDeletingQuestionId] = useState<number | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Drag and drop state for Google Forms style reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Requirement 4: State for Add New Question Modal
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false)
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newResponseCue, setNewResponseCue] = useState('')
  const [newResearchNeeded, setNewResearchNeeded] = useState(false)
  const [newAttachmentRequired, setNewAttachmentRequired] = useState(false)
  const [newRequiredQuestion, setNewRequiredQuestion] = useState(false)

  // Questions list
  const [questions, setQuestions] = useState<QuestionItem[]>(
    questionnaire.initialQuestions ??
      (questionnaire.title === 'Presight Technical & Compliance'
        ? []
        : [
            {
              id: 1,
              question:
                'Describe the primary clinical or operational use cases supported by your solution.',
              responseCue:
                'Specify whether workflows are clinical, decision-support, operational, or administrative. State whether outputs influence patient care directly or indirectly.',
              researchNeeded: true,
              attachmentRequired: true,
            },
            {
              id: 2,
              question:
                'Has your organization performed a patient safety or clinical risk assessment for this product?',
              responseCue:
                'Provide documentation or summary of hazard analysis, risk register, or failure-mode analysis related to patient harm.',
              researchNeeded: false,
              attachmentRequired: true,
            },
            {
              id: 3,
              question:
                'Describe how customer data is encrypted in transit and at rest across cloud tenants.',
              responseCue:
                'Specify encryption algorithms (e.g. AES-256, TLS 1.3), key rotation policies, and HSM backing.',
              researchNeeded: true,
              attachmentRequired: true,
            },
            {
              id: 4,
              question: 'Provide proof of SOC 2 Type II or ISO/IEC 27001 certification compliance.',
              responseCue:
                'Attach executive summary or auditor attestation statement covering the last 12 months.',
              researchNeeded: false,
              attachmentRequired: true,
            },
            {
              id: 5,
              question:
                'Can customer data be strictly isolated within United Arab Emirates cloud regions?',
              responseCue:
                'Detail tenant deployment architecture, backup locations, and compliance with UAE Health Data Law.',
              researchNeeded: true,
              attachmentRequired: false,
            },
            {
              id: 6,
              question:
                'Outline your incident response SLA for reporting data breaches to affected healthcare entities.',
              responseCue:
                'Provide notification timeline (e.g., within 24 hours), triage workflows, and root cause analysis format.',
              researchNeeded: true,
              attachmentRequired: true,
            },
          ])
  )

  // Handle Question field edits
  const handleQuestionChange = (id: number, field: keyof QuestionItem, value: string | boolean) => {
    if (!isEditing) return
    setQuestions(questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)))
  }

  // Delete Question after confirmation popup
  const confirmDeleteQuestion = () => {
    if (deletingQuestionId !== null) {
      setQuestions(questions.filter((q) => q.id !== deletingQuestionId))
      setDeletingQuestionId(null)
      showToast('Question deleted successfully.')
    }
  }

  // Requirement 4: Add New Question Handler
  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newQuestionText.trim() || !newResponseCue.trim()) return

    const maxId = questions.reduce(
      (max, q) => (typeof q.id === 'number' && q.id > max ? q.id : max),
      0
    )
    const newQuestionObj: QuestionItem = {
      id: maxId + 1,
      question: newQuestionText.trim(),
      responseCue:
        newResponseCue.trim() ||
        'Provide explicit operational proof and supporting compliance evidence.',
      researchNeeded: newResearchNeeded,
      attachmentRequired: newAttachmentRequired,
      requiredQuestion: newRequiredQuestion,
    }

    setQuestions([...questions, newQuestionObj])
    setNewQuestionText('')
    setNewResponseCue('')
    setNewResearchNeeded(false)
    setNewAttachmentRequired(false)
    setNewRequiredQuestion(false)
    setShowAddQuestionModal(false)
    showToast('New question added successfully!')
  }

  // Google Forms style drag and drop reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!isEditing) return
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (!isEditing) return

    // Auto-scroll window when dragging near top or bottom edges of viewport
    const viewportHeight = window.innerHeight
    const edgeThreshold = 140
    if (e.clientY < edgeThreshold) {
      window.scrollBy({ top: -20, behavior: 'smooth' })
    } else if (e.clientY > viewportHeight - edgeThreshold) {
      window.scrollBy({ top: 20, behavior: 'smooth' })
    }

    if (draggedIndex === null || draggedIndex === index) return

    const updatedQuestions = [...questions]
    const itemToMove = updatedQuestions[draggedIndex]
    updatedQuestions.splice(draggedIndex, 1)
    updatedQuestions.splice(index, 0, itemToMove)

    setDraggedIndex(index)
    setQuestions(updatedQuestions)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleSaveOrEdit = () => {
    if (isEditing) {
      setIsEditing(false)
      showToast('Questionnaire changes saved successfully.')
    } else {
      setIsEditing(true)
    }
  }

  const handlePublish = () => {
    setStatus('Ready')
    setIsEditing(false)
    showToast('Questionnaire published successfully!')
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  return (
    <div className="bg-[#f8fafc] text-[#0d212c] p-4 font-sans w-full">
      {/* Toast Notification — subtle light semantic styling */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#f0fdf4] text-[#15803d] px-4 py-3 rounded-xl shadow-md border border-[#bbf7d0] flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <Check className="w-4 h-4 text-[#16a34a]" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Header */}
      <div className="w-full pb-2 text-xs font-semibold flex items-center gap-1.5 text-[#64748b]">
        <button
          onClick={onBack}
          className="hover:text-[#36c0c9] cursor-pointer flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Questionnaires</span>
        </button>
        <span>/</span>
        <span className="text-[#36c0c9] font-bold">{questionnaire.title}</span>
      </div>

      {/* Header Bar */}
      <div className="w-full py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold tracking-wider text-[#64748b] uppercase">
            QUESTIONNAIRE
          </span>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight text-[#0d212c]">
              {questionnaire.title}
            </h1>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                status === 'Draft' ? 'bg-amber-100 text-amber-800' : 'bg-[#e6f4ea] text-[#137333]'
              }`}
            >
              {status === 'Draft' ? 'Draft' : 'Ready'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {status === 'Draft' ? (
            isEditing ? (
              <>
                <button
                  onClick={() => setShowAddQuestionModal(true)}
                  className="px-4 py-2 rounded-lg border border-[#cbd5e1] hover:border-[#94a3b8] hover:bg-slate-50 text-[#0d212c] bg-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition"
                >
                  <Plus className="w-4 h-4 text-[#0d212c]" />
                  <span>Add question</span>
                </button>
                <button
                  onClick={handlePublish}
                  disabled={
                    questions.length === 0 ||
                    questions.some((q) => !q.question.trim() || !q.responseCue.trim())
                  }
                  className="bg-[#0d212c] hover:bg-[#122e3d] text-white font-bold px-6 py-2 rounded-lg text-xs shadow-xs cursor-pointer transition border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Publish questionnaire
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-[#36c0c9] hover:text-[#2cb0b9] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer bg-transparent border-0 p-0"
                >
                  <Pencil className="w-4 h-4 text-[#36c0c9]" />
                  <span>Edit questionnaire</span>
                </button>
                <button
                  onClick={handlePublish}
                  disabled={
                    questions.length === 0 ||
                    questions.some((q) => !q.question.trim() || !q.responseCue.trim())
                  }
                  className="bg-[#0d212c] hover:bg-[#122e3d] text-white font-bold px-6 py-2 rounded-lg text-xs shadow-xs cursor-pointer transition border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Publish questionnaire
                </button>
              </>
            )
          ) : isEditing ? (
            <>
              <button
                onClick={() => setShowAddQuestionModal(true)}
                className="px-4 py-2 rounded-lg border border-[#cbd5e1] hover:border-[#94a3b8] hover:bg-slate-50 text-[#0d212c] bg-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition"
              >
                <Plus className="w-4 h-4 text-[#0d212c]" />
                <span>Add question</span>
              </button>
              <button
                onClick={handleSaveOrEdit}
                disabled={
                  questions.length === 0 ||
                  questions.some((q) => !q.question.trim() || !q.responseCue.trim())
                }
                className="bg-[#36c0c9] hover:bg-[#2eb0b9] text-white font-bold px-6 py-2 rounded-lg text-xs cursor-pointer shadow-xs border-0 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </>
          ) : (
            <button
              onClick={handleSaveOrEdit}
              className="text-[#36c0c9] hover:text-[#2cb0b9] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer bg-transparent border-0 p-0"
            >
              <Pencil className="w-4 h-4 text-[#36c0c9]" />
              <span>Edit questionnaire</span>
            </button>
          )}
        </div>
      </div>

      {/* Questions List */}
      <div className="w-full mt-6 flex flex-col gap-5">
        {questions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 text-center shadow-xs flex flex-col items-center justify-center gap-3">
            <h3 className="text-[#0d212c] font-extrabold text-lg">No questions available</h3>
            <p className="text-xs text-[#64748b] leading-relaxed max-w-sm">
              Add at least one question to perform any action or publish the questionnaire.
            </p>
            <button
              onClick={() => setShowAddQuestionModal(true)}
              className="mt-2 bg-[#0d212c] hover:bg-[#122e3d] text-white font-bold py-2.5 px-6 rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer border-0"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Add question</span>
            </button>
          </div>
        ) : (
          questions.map((q, idx) => (
            /* Requirement 3: Subtle grey border for question card in edit mode (no cyan highlight) */
            <div
              key={q.id}
              draggable={isEditing}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`bg-white p-6 rounded-2xl border transition flex flex-col gap-4 ${
                draggedIndex === idx
                  ? 'border-[#cbd5e1] shadow-md opacity-70 bg-slate-50'
                  : isEditing
                    ? 'border-[#e2e8f0] hover:border-[#cbd5e1] shadow-xs'
                    : 'border-[#e2e8f0]'
              }`}
            >
              {/* Question Card Top Bar */}
              <div className="flex items-center justify-between gap-4 border-b border-[#e2e8f0]/80 pb-3">
                <div className="flex items-center gap-3 min-w-0">
                  {isEditing && (
                    <div className="relative group/drag shrink-0">
                      <div
                        className="p-1.5 rounded-lg text-[#64748b] hover:text-[#0d212c] hover:bg-slate-100 cursor-grab active:cursor-grabbing transition"
                        title="Drag and drop to change question position"
                      >
                        <GripVertical className="w-4 h-4 text-[#64748b]" />
                      </div>
                      <div className="pointer-events-none opacity-0 group-hover/drag:opacity-100 transition-opacity duration-200 absolute left-8 top-1/2 -translate-y-1/2 z-50 w-56 bg-[#0d212c] text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-xl border border-white/10 text-center leading-snug font-normal whitespace-normal">
                        Drag and drop to change the position of this question
                      </div>
                    </div>
                  )}
                  <span className="text-sm font-extrabold text-[#0d212c] tracking-tight">
                    Question {idx + 1}
                  </span>
                </div>

                {isEditing && (
                  <button
                    onClick={() => setDeletingQuestionId(q.id)}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition cursor-pointer"
                    title="Delete question"
                    aria-label="Delete question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Requirement 1: QUESTION Input Field (View-only mode has no focus/click stroke interaction) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-extrabold text-[#64748b] uppercase tracking-wider">
                  QUESTION {q.requiredQuestion && <span className="text-red-500 font-bold">*</span>}
                </label>
                <input
                  type="text"
                  value={q.question}
                  readOnly={!isEditing}
                  tabIndex={!isEditing ? -1 : 0}
                  onChange={(e) => handleQuestionChange(q.id, 'question', e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-medium text-[#0d212c] transition ${
                    isEditing
                      ? 'border-[#cbd5e1] focus:border-[#cbd5e1] focus:outline-none bg-white'
                      : 'border-[#e2e8f0] bg-slate-50/50 cursor-default outline-none select-none pointer-events-none'
                  }`}
                />
              </div>

              {/* Requirement 1: RESPONSE CUE Textarea (View-only mode has no focus/click stroke interaction) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-extrabold text-[#64748b] uppercase tracking-wider">
                  RESPONSE CUE{' '}
                  {q.requiredQuestion && <span className="text-red-500 font-bold">*</span>}
                </label>
                <textarea
                  value={q.responseCue}
                  readOnly={!isEditing}
                  tabIndex={!isEditing ? -1 : 0}
                  onChange={(e) => handleQuestionChange(q.id, 'responseCue', e.target.value)}
                  rows={2}
                  className={`w-full px-4 py-2.5 rounded-xl border text-xs font-medium text-[#0d212c] resize-y transition ${
                    isEditing
                      ? 'border-[#cbd5e1] focus:border-[#cbd5e1] focus:outline-none bg-white'
                      : 'border-[#e2e8f0] bg-slate-50/50 cursor-default outline-none select-none pointer-events-none'
                  }`}
                />
              </div>

              {/* Checkboxes: Research needed | Attachment required | Required question */}
              <div className="flex items-center gap-6 pt-2">
                <Checkbox
                  label="Research needed"
                  checked={q.researchNeeded}
                  disabled={!isEditing}
                  onChange={(e) => handleQuestionChange(q.id, 'researchNeeded', e.target.checked)}
                />
                <Checkbox
                  label="Attachment required"
                  checked={q.attachmentRequired}
                  disabled={!isEditing}
                  onChange={(e) =>
                    handleQuestionChange(q.id, 'attachmentRequired', e.target.checked)
                  }
                />
                <Checkbox
                  label="Required Question"
                  checked={Boolean(q.requiredQuestion)}
                  disabled={!isEditing}
                  onChange={(e) => handleQuestionChange(q.id, 'requiredQuestion', e.target.checked)}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Requirement 4: Add New Question Modal Popup */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-50 bg-[#0d212c]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#e2e8f0] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3 mb-4">
              <h3 className="text-base font-extrabold text-[#0d212c]">Add new question</h3>
              <button
                onClick={() => setShowAddQuestionModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-[#0d212c] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddQuestion} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0d212c] mb-1.5">
                  Question text <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Describe your identity & access management policies..."
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[#cbd5e1] text-xs font-medium text-[#0d212c] outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0d212c] mb-1.5">
                  Response cue <span className="text-red-500 font-bold">*</span>
                </label>
                <textarea
                  placeholder="Instructions or cues for the vendor to answer effectively..."
                  value={newResponseCue}
                  onChange={(e) => setNewResponseCue(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#cbd5e1] text-xs font-medium text-[#0d212c] outline-none bg-white resize-y"
                />
              </div>

              <div className="flex items-center gap-6 py-2">
                <Checkbox
                  label="Research needed"
                  checked={newResearchNeeded}
                  onChange={(e) => setNewResearchNeeded(e.target.checked)}
                />
                <Checkbox
                  label="Attachment required"
                  checked={newAttachmentRequired}
                  onChange={(e) => setNewAttachmentRequired(e.target.checked)}
                />
                <Checkbox
                  label="Required Question"
                  checked={newRequiredQuestion}
                  onChange={(e) => setNewRequiredQuestion(e.target.checked)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#e2e8f0] text-xs font-semibold text-[#0d212c] hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newQuestionText.trim() || !newResponseCue.trim()}
                  className="bg-[#0d212c] hover:bg-[#122e3d] text-white font-bold py-2 px-6 rounded-lg text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition border-0"
                >
                  Save question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Popup for Deleting Individual Question */}
      {deletingQuestionId !== null && (
        <div className="fixed inset-0 z-50 bg-[#0d212c]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#e2e8f0]">
            <h3 className="text-lg font-bold text-[#0d212c] mb-2">Confirm deletion</h3>
            <p className="text-xs text-[#64748b] mb-6">
              Are you sure you want to remove this question from the questionnaire?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingQuestionId(null)}
                className="px-3.5 py-2 rounded-lg border border-[#e2e8f0] text-xs font-semibold text-[#0d212c] hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteQuestion}
                className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                Delete question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
