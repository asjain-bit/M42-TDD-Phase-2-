'use client'

import React, { useState } from 'react'
import { AlertTriangle, CheckCircle2, ShieldCheck, Upload, X } from 'lucide-react'

interface VendorEvidenceUploaderScreenProps {
  onExit: () => void
}

interface EvidenceFile {
  name: string
  size: string
  type: string
  date: string
}

interface FollowUpQuestion {
  id: number
  category: string
  question: string
  answer: string
}

// Follow-up questions the agent emailed to the vendor
const FOLLOW_UP_QUESTIONS: FollowUpQuestion[] = [
  {
    id: 3,
    category: 'Security',
    question: 'Provide your current ISO/IEC 27001 certificate.',
    answer:
      'The uploaded document states completion of Stage 1 readiness review for ISO/IEC 27001 with Stage 2 certification audit scheduled.',
  },
  {
    id: 4,
    category: 'Security',
    question: 'Describe your identity and access management controls (SSO, MFA, least privilege).',
    answer: '',
  },
  {
    id: 6,
    category: 'Assurance',
    question: 'Provide your most recent penetration test summary or SOC 2 Type II report.',
    answer: '',
  },
  {
    id: 7,
    category: 'Data',
    question: 'Where is customer data stored, and can data residency be restricted to a region?',
    answer: '',
  },
]

export const VendorEvidenceUploaderScreen: React.FC<VendorEvidenceUploaderScreenProps> = ({
  onExit,
}) => {
  const [answers, setAnswers] = useState<Record<number, string>>(() =>
    Object.fromEntries(FOLLOW_UP_QUESTIONS.map((q) => [q.id, q.answer]))
  )
  const [files, setFiles] = useState<Record<number, EvidenceFile[]>>({
    3: [
      {
        name: 'ISO_27001_Readiness_Report_2026.pdf',
        size: '1.4 MB',
        type: 'PDF',
        date: '25 Aug 2026',
      },
    ],
  })
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleFileUpload = (questionId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const newFile: EvidenceFile = {
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
      date: 'Today',
    }
    setFiles((prev) => ({ ...prev, [questionId]: [...(prev[questionId] || []), newFile] }))
    e.target.value = ''
  }

  const removeFile = (questionId: number, index: number) =>
    setFiles((prev) => ({
      ...prev,
      [questionId]: (prev[questionId] || []).filter((_, i) => i !== index),
    }))

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-[#0d212c] font-sans antialiased flex flex-col">
      {/* Top bar — no navigation for the vendor */}
      <header className="h-16 bg-white border-b border-[#e2e8f0] px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <img src="/dark-logo.png" alt="M42 logo" className="h-7 w-auto object-contain" />
          <span className="font-semibold text-base text-[#0d212c] tracking-tight">
            Tech Due Diligence
          </span>
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-[#0d212c]">Presight AI | See the Future Today</div>
          <div className="text-[11px] font-bold text-[#36c0c9]">Case ID: PR-126</div>
        </div>
      </header>

      {isSubmitted ? (
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-xs p-10 max-w-md w-full flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-[#16a34a]" />
            </div>
            <h2 className="text-lg font-extrabold text-[#0d212c]">Responses submitted</h2>
            <p className="text-xs text-[#64748b] leading-relaxed">
              Thank you. Your updated answers and evidence have been shared with the M42 team for
              review.
            </p>
            <button
              onClick={onExit}
              className="mt-2 px-5 py-2.5 rounded-xl bg-[#36c0c9] hover:bg-[#2badb6] text-white text-xs font-bold transition cursor-pointer border-0"
            >
              Back to sign in
            </button>
          </div>
        </main>
      ) : (
        <>
          <main className="flex-1 w-full max-w-4xl mx-auto px-8 py-8 flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-extrabold text-[#0d212c]">Follow-up questions</h1>
              <p className="text-xs text-[#64748b]">
                Review your answers, update them where needed and upload the required evidence
                before submitting.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-xs divide-y divide-[#e2e8f0]/80">
              {FOLLOW_UP_QUESTIONS.map((q) => {
                const questionFiles = files[q.id] || []
                return (
                  <div key={q.id} className="py-6 first:pt-0 last:pb-0 flex flex-col gap-3">
                    <h4 className="font-bold text-[#0d212c] text-sm">
                      {q.id}. [{q.category}] {q.question}
                    </h4>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor={`vendor-answer-${q.id}`}
                        className="text-xs font-bold text-[#0d212c]"
                      >
                        Answer
                      </label>
                      <textarea
                        id={`vendor-answer-${q.id}`}
                        rows={3}
                        value={answers[q.id] || ''}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                        }
                        placeholder="Type your answer..."
                        className="w-full px-4 py-3 rounded-xl border border-[#cbd5e1] text-xs font-medium text-[#0d212c] outline-none focus:border-[#94a3b8] bg-white resize-none"
                      />
                    </div>

                    {/* Evidence — same layout as the admin portal */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex flex-col gap-2.5 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#0d212c]">
                          <ShieldCheck className="w-4 h-4 text-[#0d7280]" />
                          <span>
                            Evidence{questionFiles.length > 0 ? ` (${questionFiles.length})` : ''}
                          </span>
                        </div>
                        {questionFiles.length === 0 ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-[#0d212c]">
                              No evidence uploaded yet
                            </span>
                            <span className="text-[11px] text-[#64748b]">
                              Upload supporting evidence for this answer.
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-3">
                            {questionFiles.map((file, idx) => (
                              <div
                                key={`${file.name}-${idx}`}
                                className="p-3 rounded-xl border border-[#e2e8f0] bg-white inline-flex items-center justify-between gap-4 text-xs w-full sm:w-auto min-w-[280px] shadow-2xs"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="px-2.5 py-1 rounded-lg bg-[#eff6ff] text-[#2563eb] font-bold text-[10px] shrink-0">
                                    {file.type}
                                  </div>
                                  <div className="min-w-0">
                                    <h5 className="font-bold text-xs text-[#0d212c] truncate">
                                      {file.name}
                                    </h5>
                                    <span className="text-[10px] text-[#64748b] block">
                                      {file.size} • {file.date}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeFile(q.id, idx)}
                                  className="p-1 text-[#64748b] hover:text-[#dc2626] cursor-pointer bg-transparent border-0"
                                  title="Remove file"
                                  aria-label={`Remove ${file.name}`}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#0d7280] text-[#0d7280] hover:bg-[#f0fdfa] font-bold text-xs cursor-pointer transition shadow-2xs shrink-0 self-start sm:self-center">
                        <Upload className="w-3.5 h-3.5 text-[#0d7280]" />
                        <span>Upload evidence</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => handleFileUpload(q.id, e)}
                        />
                      </label>
                    </div>
                  </div>
                )
              })}
            </div>
          </main>

          <footer className="sticky bottom-0 bg-white border-t border-[#e2e8f0]">
            <div className="max-w-4xl mx-auto px-8 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="px-5 py-2.5 rounded-xl border border-[#e2e8f0] bg-white text-xs font-bold text-[#0d212c] hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsSubmitted(true)}
                className="px-5 py-2.5 rounded-xl bg-[#36c0c9] hover:bg-[#2badb6] text-white text-xs font-bold transition cursor-pointer border-0"
              >
                Submit
              </button>
            </div>
          </footer>
        </>
      )}

      {/* Cancel confirmation */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 bg-[#0d212c]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-[#e2e8f0] flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowCancelConfirm(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-[#0d212c] transition cursor-pointer bg-transparent border-0"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#fef2f2] border border-[#fecaca] flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-[#dc2626]" />
              </div>
              <h3 className="text-lg font-extrabold text-[#0d212c]">Cancel submission</h3>
              <p className="text-xs text-[#64748b] leading-relaxed">
                Are you sure you want to cancel? You will lose the answers and evidence you have
                added.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="py-3 rounded-xl border border-[#e2e8f0] bg-white text-xs font-bold text-[#0d212c] hover:bg-slate-50 transition cursor-pointer"
              >
                Keep editing
              </button>
              <button
                onClick={onExit}
                className="py-3 rounded-xl bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold transition cursor-pointer border-0"
              >
                Yes, cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
