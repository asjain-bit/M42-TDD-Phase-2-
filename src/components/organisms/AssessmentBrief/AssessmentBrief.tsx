'use client'

/**
 * AssessmentBrief — Organism
 * The initial assessment brief, split into sections with a side panel to jump between them.
 * Content comes from what the vendor filled in, with the assessment summary first.
 * Used in: PartnershipDetail
 */

import React, { useEffect, useState } from 'react'
import {
  Activity,
  Award,
  Building2,
  CheckSquare,
  ChevronRight,
  HeartHandshake,
  Layers,
  Scale,
  ShieldCheck,
  Sparkles,
  Square,
  Target,
  User,
  Users,
} from 'lucide-react'
import {
  ConfidenceBadge,
  confidenceLevel,
  getChangeFactors,
} from '@/components/organisms/AgentActions'
import type { AssessmentBriefProps } from './AssessmentBrief.types'

const POPULATIONS = ['Adult patients', 'Pediatric patients', "Women's health"]

const NAV = [
  { id: 'summary', label: 'Assessment Summary', icon: Sparkles },
  { id: 'company-info', label: 'Company Information', icon: Building2 },
  { id: 'company-experience', label: 'Company Experience', icon: Award },
  { id: 'collaboration-proposal', label: 'Collaboration Proposal', icon: HeartHandshake },
  { id: 'focus-area', label: 'Focus Area', icon: Target },
  { id: 'solution-maturity', label: 'Solution Maturity', icon: Activity },
  { id: 'regulatory-approvals', label: 'Regulatory Approvals', icon: ShieldCheck },
  { id: 'innovation-differentiation', label: 'Innovation & Differentiation', icon: Sparkles },
  { id: 'development-approach', label: 'Development Approach', icon: Layers },
  { id: 'support-from-m42', label: 'Support from M42', icon: HeartHandshake },
  { id: 'target-population', label: 'Target Population & Impact', icon: Users },
]

const DECISION_NAV = { id: 'decision', label: 'Your Decision', icon: Scale }

const Section: React.FC<{
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}> = ({ id, title, icon: Icon, children }) => (
  <section id={`brief-${id}`} className="scroll-mt-6 py-8 first:pt-0 flex flex-col gap-4">
    <div className="flex items-center gap-2.5">
      <Icon className="w-5 h-5 text-[#36c0c9]" />
      <h3 className="text-base font-semibold text-[#0d212c]">{title}</h3>
    </div>
    {children}
  </section>
)

const Chip: React.FC<{ children: React.ReactNode; muted?: boolean }> = ({ children, muted }) => (
  <span
    className={`px-3 py-1 rounded-xl text-xs font-medium border ${
      muted
        ? 'bg-slate-50 text-slate-500 border-slate-200'
        : 'bg-[#f0fdfa] text-[#0f766e] border-[#ccfbf1]'
    }`}
  >
    {children}
  </span>
)

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <div className="text-xs font-medium text-[#64748b]">{label}</div>
    <div className="text-sm font-medium text-[#0d212c] mt-1">{children}</div>
  </div>
)

const Body: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm text-[#475569] leading-relaxed">{children}</p>
)

const Callout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm flex flex-col gap-1">
    <div className="text-xs font-semibold text-[#0d212c]">{title}</div>
    <p className="text-[#475569] leading-relaxed">{children}</p>
  </div>
)

export const AssessmentBrief: React.FC<AssessmentBriefProps> = ({
  request,
  onOpenAnalysis,
  hideContact = false,
  showSummary = false,
  decision,
  footer,
  className = '',
}) => {
  const { assessmentAreas: a, companyInfo: info } = request
  const rec = request.agentRecommendation
  const isReject = rec?.status === 'reject'
  const baseNav = showSummary ? NAV : NAV.filter((item) => item.id !== 'summary')
  const nav = decision ? [...baseNav, DECISION_NAV] : baseNav
  const [active, setActive] = useState(nav[0].id)
  const populations = a.impactedPatientPopulations ?? []
  const milestones = a.milestones ?? []

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((x, y) => x.boundingClientRect.top - y.boundingClientRect.top)[0]
        if (top) setActive(top.target.id.replace('brief-', ''))
      },
      { rootMargin: '-10% 0px -70% 0px' }
    )
    nav.forEach((item) => {
      const el = document.getElementById(`brief-${item.id}`)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(decision), showSummary])

  const scrollTo = (id: string) => {
    setActive(id)
    const el = document.getElementById(`brief-${id}`)
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <section
      aria-labelledby="assessment-brief-heading"
      className={`flex flex-col gap-5 ${className}`.trim()}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-10 h-10 rounded-xl bg-[#e6fffa] text-[#36c0c9] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 id="assessment-brief-heading" className="text-base font-semibold text-[#0d212c]">
            Initial Assessment Brief
          </h2>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#e0f2fe] text-[#0369a1]">
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            Triage Agent Analysis
          </span>
        </div>
        <div className="rounded-xl border border-[#e2e8f0] bg-white pl-3 pr-4 py-2 flex items-center gap-2.5 w-fit">
          <Sparkles className="w-4 h-4 text-[#36c0c9]" aria-hidden="true" />
          <button
            type="button"
            onClick={onOpenAnalysis}
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#0d212c] hover:text-[#36c0c9] cursor-pointer transition"
          >
            Agent Actions
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Side panel and sections */}
      <div className="flex flex-col lg:flex-row gap-8 w-full items-start">
        <nav
          aria-label="Brief sections"
          className="w-full lg:w-64 shrink-0 bg-slate-50/70 rounded-xl p-2 flex flex-col gap-1 border border-[#e2e8f0]/60 lg:sticky lg:top-4"
        >
          {nav.map((item) => {
            const Icon = item.icon
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                type="button"
                aria-current={isActive ? 'true' : undefined}
                onClick={() => scrollTo(item.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition flex items-center gap-2.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#36c0c9]/10 text-[#0f766e] font-semibold border border-[#36c0c9]/30'
                    : 'border border-transparent text-[#64748b] hover:bg-white/60 hover:text-[#0d212c]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#36c0c9]' : 'text-slate-400'}`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="flex-1 min-w-0 w-full flex flex-col divide-y divide-[#f1f5f9]">
          {rec && showSummary && (
            <Section id="summary" title="Assessment Summary" icon={Sparkles}>
              <div className="rounded-xl border border-[#e2e8f0] p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${
                      isReject
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {isReject ? 'Points to reject' : 'Points to proceed'}
                  </span>
                  <ConfidenceBadge level={confidenceLevel(rec.confidence)} />
                </div>
                <Body>{rec.rationale}</Body>
                <div className="flex flex-col gap-2 pt-3 border-t border-[#e2e8f0]">
                  <span className="text-xs font-semibold text-[#0d212c]">
                    What would change this assessment
                  </span>
                  <ol className="flex flex-col gap-1.5">
                    {getChangeFactors(request).map((factor, i) => (
                      <li key={factor} className="flex items-start gap-2.5 text-sm text-[#475569]">
                        <span className="w-5 h-5 rounded-full border border-[#e2e8f0] text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {factor}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </Section>
          )}

          <Section id="company-info" title="Company Information" icon={Building2}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Company Name">{info.company}</Field>
              {!hideContact && (
                <>
                  <Field label="Contact Person Name">{info.name}</Field>
                  <Field label="Job Title">{info.jobTitle}</Field>
                  <Field label="Email Address">{info.email}</Field>
                  <Field label="Phone Number">{info.phoneNumber || 'Not provided'}</Field>
                </>
              )}
              <Field label="Year Company Was Founded">{info.yearFounded}</Field>
              {info.location && <Field label="Location">{info.location}</Field>}
              {!hideContact && <Field label="Referred By">{request.referredBy || '—'}</Field>}
            </div>
          </Section>

          <Section
            id="company-experience"
            title="Company's Stage of Maturity and Experience"
            icon={Award}
          >
            <Body>{a.stageOfMaturityAndExperience}</Body>
            {a.growthJourneyAndRegionalExperience && (
              <Body>{a.growthJourneyAndRegionalExperience}</Body>
            )}
            {milestones.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="text-xs font-semibold text-[#0d212c]">Key milestones</div>
                <ul className="flex flex-col gap-1.5">
                  {milestones.map((m) => (
                    <li key={m} className="flex items-start gap-2.5 text-sm text-[#475569]">
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-[#36c0c9] mt-2 shrink-0"
                        aria-hidden="true"
                      />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Section>

          <Section
            id="collaboration-proposal"
            title="Proposal of Collaboration"
            icon={HeartHandshake}
          >
            <Body>{a.proposalOfCollaboration}</Body>
            {a.productPlatformServiceDetails !== a.proposalOfCollaboration && (
              <Callout title="Product, Platform & Service Details">
                {a.productPlatformServiceDetails}
              </Callout>
            )}
          </Section>

          <Section id="focus-area" title="Focus Area(s)" icon={Target}>
            <div className="flex flex-wrap gap-2">
              {a.focusAreas.map((f) => (
                <Chip key={f}>{f}</Chip>
              ))}
            </div>
          </Section>

          <Section
            id="solution-maturity"
            title="Solution Maturity & Regulatory Approvals"
            icon={Activity}
          >
            <Body>{a.solutionMaturityLevelAndRegulatory}</Body>
            {a.relevantApprovals && (
              <Callout title="Regulatory Clearances">{a.relevantApprovals}</Callout>
            )}
          </Section>

          <Section
            id="regulatory-approvals"
            title="Regulatory Approvals Checklist"
            icon={ShieldCheck}
          >
            <div className="flex flex-wrap gap-2">
              {(a.regulatoryApprovalList ?? ['Not applicable']).map((appr) => (
                <Chip key={appr} muted={appr === 'Not applicable'}>
                  {appr}
                </Chip>
              ))}
            </div>
          </Section>

          <Section
            id="innovation-differentiation"
            title="Innovation & Differentiation"
            icon={Sparkles}
          >
            <Body>{a.noveltyAndDifferentiation}</Body>
          </Section>

          <Section id="development-approach" title="Development Approach" icon={Layers}>
            <Body>{a.developmentApproach || 'Not specified'}</Body>
          </Section>

          <Section
            id="support-from-m42"
            title="Specific Resources & Support from M42"
            icon={HeartHandshake}
          >
            <Body>{a.requestedM42Resources}</Body>
          </Section>

          <Section id="target-population" title="Target Patient Population & Impact" icon={User}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {POPULATIONS.map((pop) => {
                const checked = populations.some((p) => p.toLowerCase() === pop.toLowerCase())
                return (
                  <div
                    key={pop}
                    className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                      checked
                        ? 'bg-[#f0fdfa] border-[#ccfbf1] text-[#0d212c]'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    {checked ? (
                      <CheckSquare className="w-4 h-4 text-[#0f766e] shrink-0" aria-hidden="true" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" aria-hidden="true" />
                    )}
                    <span className="text-xs font-medium">{pop}</span>
                  </div>
                )
              })}
            </div>
            {a.clinicalAreas && a.clinicalAreas.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#64748b]">Clinical areas:</span>
                {a.clinicalAreas.map((c) => (
                  <Chip key={c}>{c}</Chip>
                ))}
              </div>
            )}
          </Section>

          {decision && (
            <Section id="decision" title="Your Decision" icon={Scale}>
              {decision}
            </Section>
          )}

          {footer && <div className="pt-8">{footer}</div>}
        </div>
      </div>
    </section>
  )
}
