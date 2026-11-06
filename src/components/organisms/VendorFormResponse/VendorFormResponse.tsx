'use client'

/**
 * VendorFormResponse — Organism
 * Large read-only dialog showing the vendor's original submission form, question by question,
 * exactly as it was filled in before the agent reviewed it.
 * Used in: PartnershipDetail
 */

import React, { useEffect } from 'react'
import { CheckSquare, ChevronDown, FileText, Lock, Square, X } from 'lucide-react'
import type { VendorFormResponseProps } from './VendorFormResponse.types'

const POPULATION_OPTIONS = ['Adult patients', 'Pediatric patients', "Women's health"]

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-sm font-semibold text-[#0d212c]">
    {children}
  </h3>
)

const Question: React.FC<{
  label: string
  helper?: string
  required?: boolean
  children: React.ReactNode
}> = ({ label, helper, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <div className="text-xs font-semibold text-[#0d212c] leading-snug">
      {label}
      {required && <span className="text-red-500 font-semibold"> *</span>}
    </div>
    {helper && <div className="text-[11px] text-[#64748b] leading-relaxed">{helper}</div>}
    {children}
  </div>
)

const AnswerBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3.5 py-3 text-xs sm:text-[13px] text-[#0d212c] leading-relaxed">
    {children}
  </div>
)

const SelectBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] pl-3.5 pr-10 py-2.5 text-xs sm:text-[13px] text-[#0d212c] relative min-h-[42px] flex items-center">
    {children}
    <ChevronDown
      aria-hidden="true"
      className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2"
    />
  </div>
)

const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="px-2.5 py-0.5 rounded-lg bg-white text-[#0f766e] text-xs font-medium border border-[#ccfbf1]">
    {children}
  </span>
)

export const VendorFormResponse: React.FC<VendorFormResponseProps> = ({
  request,
  onClose,
  hideContact = false,
}) => {
  const { companyInfo: c, assessmentAreas: a } = request

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const populations = a.impactedPatientPopulations ?? []

  return (
    <div className="fixed inset-0 z-50 bg-[#0d212c]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vendor-form-title"
        className="relative bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] shadow-2xl border border-[#e2e8f0] flex flex-col animate-in fade-in zoom-in-95"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 sm:px-8 py-5 border-b border-[#d3dbe4] shrink-0">
          <div className="flex flex-col gap-1">
            <h2 id="vendor-form-title" className="text-lg font-semibold text-[#0d212c]">
              Vendor Submission
            </h2>
            <p className="text-xs text-[#64748b]">
              {request.companyName} · Submitted on {request.submittedOn}
            </p>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-[#64748b] pt-1">
              <Lock className="w-3 h-3" aria-hidden="true" />
              Read-only. Shown exactly as the vendor filled it in.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close vendor submission"
            className="text-[#94a3b8] hover:text-[#0d212c] p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 flex flex-col gap-8 overscroll-contain">
          {/* Company Information */}
          <section className="flex flex-col gap-4">
            <SectionTitle>Company Information</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {!hideContact && (
                <Question label="Name" required>
                  <AnswerBox>{c.name}</AnswerBox>
                </Question>
              )}
              {!hideContact && (
                <Question label="Job Title" required>
                  <AnswerBox>{c.jobTitle}</AnswerBox>
                </Question>
              )}
              <Question label="Company" required>
                <AnswerBox>{c.company}</AnswerBox>
              </Question>
              {c.vendorId && (
                <Question label="Vendor ID">
                  <AnswerBox>{c.vendorId}</AnswerBox>
                </Question>
              )}
              {!hideContact && (
                <Question label="Phone Number">
                  <AnswerBox>{c.phoneNumber || 'Not provided'}</AnswerBox>
                </Question>
              )}
              {!hideContact && (
                <Question label="Email Address" required>
                  <AnswerBox>{c.email}</AnswerBox>
                </Question>
              )}
              <Question label="Year Company Was Founded" required>
                <AnswerBox>{c.yearFounded}</AnswerBox>
              </Question>
            </div>
          </section>

          {/* Key Assessment Areas */}
          <section className="flex flex-col gap-5">
            <SectionTitle>Key Assessment Areas</SectionTitle>

            <Question
              label="How would you describe your company's stage of maturity and experience?"
              helper="Company's growth journey and regional experience. Include relevant milestones such as product launches, market entries or partnerships in UAE or other healthcare systems."
              required
            >
              <AnswerBox>
                <p>{a.stageOfMaturityAndExperience}</p>
                <p className="mt-2">{a.growthJourneyAndRegionalExperience}</p>
                {a.milestones && a.milestones.length > 0 && (
                  <ul className="list-disc pl-5 mt-2 space-y-0.5">
                    {a.milestones.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                )}
              </AnswerBox>
            </Question>

            <Question
              label="Briefly describe your proposal of collaboration."
              helper="Details about the product, platform or service you are submitting for consideration."
              required
            >
              <AnswerBox>
                <p>{a.proposalOfCollaboration}</p>
                <p className="mt-2">{a.productPlatformServiceDetails}</p>
              </AnswerBox>
            </Question>

            <Question
              label="Which Focus Area does your solution address?"
              helper="Select the primary area your solution addresses. These focus areas align with M42 transformation and innovation priorities. Select all that apply."
              required
            >
              <SelectBox>
                <div className="flex flex-wrap gap-1.5">
                  {a.focusAreas.map((f) => (
                    <Chip key={f}>{f}</Chip>
                  ))}
                </div>
              </SelectBox>
            </Question>

            <Question
              label="What is the current maturity level of your solution and have you secured any regulatory approvals or certifications (if applicable)?"
              helper="Briefly describe the solution's current stage of maturity, any deployments to date and regulatory clearances obtained (e.g. CE, FDA, DoH Abu Dhabi)."
              required
            >
              <AnswerBox>{a.solutionMaturityLevelAndRegulatory}</AnswerBox>
            </Question>

            <Question label='Please list any relevant approvals (e.g. CE, FDA, ISO, UAE MOHAP, DOH) or state "Not applicable."'>
              <AnswerBox>{a.relevantApprovals || 'Not applicable'}</AnswerBox>
            </Question>

            <Question
              label="How novel or differentiated is your solution compared to others in the market?"
              helper="Assess the innovation potential, uniqueness and whether the solution brings new intellectual property or care modules to M42."
              required
            >
              <AnswerBox>{a.noveltyAndDifferentiation}</AnswerBox>
            </Question>

            <Question
              label="If applicable, was the solution developed entirely by your team or in collaboration with external partners?"
              helper="Understand whether the solution was developed internally, co-developed with partners or built using third-party technologies or platforms. Indicate the primary development approach."
            >
              <SelectBox>{a.developmentApproach || 'Not specified'}</SelectBox>
            </Question>

            <Question
              label="What specific resources, input, or partnerships are you seeking from M42?"
              helper="Outline the type of support expected, such as data, access, clinical collaboration, technical integration, funding or pilot sites."
              required
            >
              <AnswerBox>{a.requestedM42Resources}</AnswerBox>
            </Question>

            <Question
              label="If applicable, which patient populations, clinical areas, or operational workflows will be impacted?"
              helper="Identify who or what will be directly affected by your solution (patients, clinical teams, care pathways or administrative workflows) to help assess relevance and scope."
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {POPULATION_OPTIONS.map((pop) => {
                  const checked = populations.some((p) => p.toLowerCase() === pop.toLowerCase())
                  return (
                    <div
                      key={pop}
                      role="checkbox"
                      aria-checked={checked}
                      aria-label={pop}
                      className={`px-3.5 py-2.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium ${
                        checked
                          ? 'bg-[#f0fdfa] border-[#ccfbf1] text-[#0d212c]'
                          : 'bg-[#f8fafc] border-[#e2e8f0] text-slate-400'
                      }`}
                    >
                      {checked ? (
                        <CheckSquare
                          className="w-4 h-4 text-[#0f766e] shrink-0"
                          aria-hidden="true"
                        />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0" aria-hidden="true" />
                      )}
                      <span>{pop}</span>
                    </div>
                  )
                })}
              </div>
              {a.clinicalAreas && a.clinicalAreas.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-[#64748b] mr-1">Clinical areas:</span>
                  {a.clinicalAreas.map((area) => (
                    <Chip key={area}>{area}</Chip>
                  ))}
                </div>
              )}
            </Question>
          </section>

          {/* Attachments */}
          {request.uploadedDocuments.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionTitle>Attachments</SectionTitle>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {request.uploadedDocuments.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center gap-3 rounded-xl border border-[#e2e8f0] bg-white px-3.5 py-2.5"
                  >
                    <FileText className="w-4 h-4 text-[#36c0c9] shrink-0" aria-hidden="true" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium text-[#0d212c] truncate">
                        {doc.name}
                      </span>
                      <span className="text-[11px] text-[#94a3b8]">{doc.size}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 sm:px-8 py-4 border-t border-[#d3dbe4] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-[#e2e8f0] text-xs font-semibold text-[#0d212c] hover:bg-slate-50 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
