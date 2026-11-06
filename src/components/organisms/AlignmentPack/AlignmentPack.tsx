'use client'

/**
 * AlignmentPack — Organism
 * Generated once the signed NDA is uploaded. One continuous document that pulls together everything known about the case so far: the brief,
 * the Director's decision, the Internal Interest summary, the Strategy assessment, the NDA and the
 * open questions.
 * Used in: NdaStage
 */

import React, { useMemo } from 'react'
import {
  Activity,
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  FileSignature,
  HeartHandshake,
  HelpCircle,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'
import { AnswerHistory } from '@/components/molecules/AnswerHistory'
import { buildAgentActions } from '@/components/organisms/AgentActions'
import { currentAnswer } from '@/lib/caseActions'
import { buildPreRead } from '@/lib/preRead'
import {
  DEFAULT_INTERNAL_INTERESTS,
  DEFAULT_STRATEGY_MEMBERS,
  type PartnershipRequest,
} from '@/types/partnership.types'
import type { AlignmentPackProps } from './AlignmentPack.types'

const strategyResponseOf = (request: PartnershipRequest) =>
  (request.strategyTeamMembers?.length ? request.strategyTeamMembers : DEFAULT_STRATEGY_MEMBERS)[0]
    ?.strategyResponse

/** Questions still open after the brief, the internal answers and the strategy conditions */
export const buildOpenQuestions = (request: PartnershipRequest): string[] => {
  const questions: string[] = []
  const conditions = strategyResponseOf(request)?.finalDecisionNote
  if (conditions) questions.push(`Has the vendor confirmed this condition? ${conditions}`)
  if (request.overviewCards.regulatory.toLowerCase().includes('unclear')) {
    questions.push('Which regulatory approvals are in place for the target markets?')
  }
  questions.push(
    'Which hospital or site will pilot first, and who is the clinical owner there?',
    'Which baseline KPIs will the pilot be measured against?',
    'Who owns models that are tuned on M42 data?'
  )
  return questions
}

const Section: React.FC<{
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}> = ({ id, title, icon: Icon, children }) => (
  <section id={`pack-${id}`} className="py-8 first:pt-0 flex flex-col gap-4">
    <div className="flex items-center gap-2.5">
      <Icon className="w-5 h-5 text-[#36c0c9]" />
      <h3 className="text-base font-semibold text-[#0d212c]">{title}</h3>
    </div>
    {children}
  </section>
)

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <div className="text-xs font-medium text-[#64748b]">{label}</div>
    <div className="text-sm font-medium text-[#0d212c] mt-1">{children || '—'}</div>
  </div>
)

const Body: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm text-[#475569] leading-relaxed">{children}</p>
)

const Chip: React.FC<{
  children: React.ReactNode
  tone?: 'teal' | 'green' | 'amber' | 'slate' | 'red'
}> = ({ children, tone = 'teal' }) => {
  const tones = {
    teal: 'bg-[#f0fdfa] text-[#0f766e] border-[#ccfbf1]',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
  }
  return (
    <span className={`inline-flex px-3 py-1 rounded-xl text-xs font-medium border ${tones[tone]}`}>
      {children}
    </span>
  )
}

export const AlignmentPack: React.FC<AlignmentPackProps> = ({
  request,
  extraSection,
  className = '',
}) => {
  const a = request.assessmentAreas
  const info = request.companyInfo
  const rec = request.agentRecommendation
  const reviewers = request.internalInterests?.length
    ? request.internalInterests
    : DEFAULT_INTERNAL_INTERESTS
  const responded = reviewers.filter((r) => r.status === 'Completed')
  const strategy = strategyResponseOf(request)
  const sponsors = request.sponsors
  const versions = request.nda?.versions ?? []
  const signed = [...versions].reverse().find((v) => v.signed)
  const actions = useMemo(() => buildAgentActions(request), [request])
  const sections = useMemo(
    () => buildPreRead(request, strategy?.documents ?? []),
    [request, strategy?.documents]
  )
  const answers = responded.flatMap((r) =>
    (r.answers ?? []).map((x) => ({ ...x, by: r.name, on: r.responseDate }))
  )
  return (
    <section
      aria-labelledby="alignment-pack-heading"
      className={`flex flex-col gap-6 ${className}`.trim()}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-10 h-10 rounded-xl bg-[#e6fffa] text-[#36c0c9] flex items-center justify-center shrink-0">
            <FileSignature className="w-5 h-5" aria-hidden="true" />
          </div>
          <h2 id="alignment-pack-heading" className="text-base font-semibold text-[#0d212c]">
            Alignment Pack
          </h2>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#e0f2fe] text-[#0369a1]">
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            Generated {request.alignmentPackOn ?? 'today'}
          </span>
        </div>
      </div>

      <div className="w-full">
        <div className="flex flex-col divide-y divide-[#d3dbe4]">
          <Section id="summary" title="Executive Summary" icon={Sparkles}>
            <div className="rounded-xl border border-[#e2e8f0] p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Chip tone={rec?.status === 'reject' ? 'red' : 'green'}>
                  Agent: {rec?.status === 'reject' ? 'Reject' : 'Proceed'}
                </Chip>
                <Chip tone={request.decision?.status === 'rejected' ? 'red' : 'green'}>
                  Director: {request.decision?.status === 'rejected' ? 'Rejected' : 'Approved'}
                </Chip>
                <Chip tone={strategy?.finalDecision === 'Reject' ? 'red' : 'green'}>
                  Strategy: {strategy?.finalDecision ?? 'Pending'}
                </Chip>
                <Chip tone="teal">NDA signed</Chip>
              </div>
              <Body>
                {request.headline ?? request.solution}. {rec?.rationale}
              </Body>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 pt-2">
                <Field label="Case ID">{request.requestCode}</Field>
                <Field label="Request type">{request.caseType ?? 'Partnership'}</Field>
                <Field label="Submitted on">{request.submittedOn}</Field>
                <Field label="Focus area">{request.focusArea}</Field>
                <Field label="Solution maturity">{request.solutionMaturity}</Field>
                <Field label="Lead sponsor">{sponsors?.lead}</Field>
              </div>
            </div>
          </Section>

          <Section id="company" title="Company Information" icon={Building2}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <Field label="Company name">{request.companyName}</Field>
              <Field label="Year company was founded">{info.yearFounded}</Field>
              <Field label="Location">{info.location}</Field>
              <Field label="Referred by">{request.referredBy}</Field>
              <Field label="Vendor contact">{info.name}</Field>
              <Field label="Job title">{info.jobTitle}</Field>
              <Field label="Email">{info.email}</Field>
              <Field label="Phone">{info.phoneNumber}</Field>
            </div>
            <Body>{a.stageOfMaturityAndExperience}</Body>
          </Section>

          <Section id="proposal" title="Collaboration Proposal" icon={HeartHandshake}>
            <Body>{a.proposalOfCollaboration}</Body>
            <Field label="What the vendor asks of M42">
              <span className="font-normal text-[#475569] leading-relaxed">
                {a.requestedM42Resources}
              </span>
            </Field>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#64748b]">Focus areas:</span>
              {a.focusAreas.map((f) => (
                <Chip key={f}>{f}</Chip>
              ))}
            </div>
          </Section>

          <Section id="maturity" title="Solution Maturity" icon={Activity}>
            <Body>{a.solutionMaturityLevelAndRegulatory}</Body>
            {a.regulatoryApprovalList && a.regulatoryApprovalList.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#64748b]">Approvals:</span>
                {a.regulatoryApprovalList.map((r) => (
                  <Chip key={r}>{r}</Chip>
                ))}
              </div>
            )}
            <Field label="What makes it different">
              <span className="font-normal text-[#475569] leading-relaxed">
                {a.noveltyAndDifferentiation}
              </span>
            </Field>
          </Section>

          <Section id="checks" title="Agent Checks" icon={ShieldCheck}>
            <ul className="flex flex-col divide-y divide-[#d3dbe4] rounded-xl border border-[#e2e8f0] bg-white">
              {actions.map((action) => (
                <li key={action.id} className="flex items-start gap-3 px-4 py-3">
                  {action.status === 'attention' ? (
                    <AlertCircle
                      className="w-4 h-4 text-amber-500 mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                  ) : (
                    <CheckCircle2
                      className="w-4 h-4 text-[#10b981] mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-semibold text-[#0d212c]">{action.title}</span>
                    <span className="text-xs text-[#64748b] leading-relaxed">
                      {action.headline}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="decision" title="Director Decision" icon={Scale}>
            <div className="flex items-center gap-2 flex-wrap">
              <Chip tone={request.decision?.status === 'rejected' ? 'red' : 'green'}>
                {request.decision?.status === 'rejected' ? 'Rejected' : 'Approved to proceed'}
              </Chip>
              <span className="text-xs text-[#64748b]">
                {request.decision?.date ?? request.submittedOn}
              </span>
            </div>
            <Body>
              {request.decision?.reason ?? 'Approved to proceed to the Internal Interest stage.'}
            </Body>
          </Section>

          <Section id="interest" title="Internal Interest" icon={Users}>
            <Body>
              {responded.length} of {reviewers.length} reviewers responded.
              {sponsors &&
                ` ${sponsors.lead} is the lead sponsor${
                  sponsors.co.length ? `, with ${sponsors.co.join(', ')} as co-sponsors` : ''
                }.`}
            </Body>
            <div className="rounded-xl border border-[#e2e8f0] overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] text-[#64748b] text-[11px] font-medium uppercase tracking-wider">
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Decision</th>
                    <th className="py-2.5 px-4">Sponsor</th>
                    <th className="py-2.5 px-4">Response date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d3dbe4] text-sm text-[#0d212c]">
                  {reviewers.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2.5 px-4 font-medium">
                        {r.name}
                        <span className="block text-xs font-normal text-[#64748b]">{r.role}</span>
                      </td>
                      <td className="py-2.5 px-4">
                        {r.status === 'Completed' ? 'Completed' : 'Pending'}
                      </td>
                      <td className="py-2.5 px-4">
                        {r.decision && r.decision !== '-' ? r.decision : '—'}
                      </td>
                      <td className="py-2.5 px-4">{r.sponsor ?? '—'}</td>
                      <td className="py-2.5 px-4">{r.responseDate ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {answers.length > 0 && (
              <ul className="flex flex-col gap-3">
                {answers.slice(0, 3).map((x) => (
                  <li
                    key={`${x.by}-${x.questionId}`}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1"
                  >
                    <span className="text-xs font-semibold text-[#0d212c]">{x.question}</span>
                    <p className="text-sm text-[#475569] leading-relaxed">{currentAnswer(x)}</p>
                    <span className="text-xs text-[#64748b]">{x.by}</span>
                    <AnswerHistory answer={x} originalOn={x.on} className="pt-1" />
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section id="strategy" title="Strategy Assessment" icon={Target}>
            <div className="flex items-center gap-2 flex-wrap">
              <Chip tone={strategy?.finalDecision === 'Reject' ? 'red' : 'green'}>
                {strategy?.finalDecision ?? 'Pending'}
              </Chip>
              {strategy?.submittedAt && (
                <span className="text-xs text-[#64748b]">{strategy.submittedAt}</span>
              )}
            </div>
            {strategy?.finalDecisionNote && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm flex flex-col gap-1">
                <div className="text-xs font-semibold text-[#0d212c]">Conditions to proceed</div>
                <p className="text-[#475569] leading-relaxed">{strategy.finalDecisionNote}</p>
              </div>
            )}
            <ul className="flex flex-col divide-y divide-[#d3dbe4] rounded-xl border border-[#e2e8f0] bg-white">
              {sections.map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-4 px-4 py-3">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-semibold text-[#0d212c]">{s.title}</span>
                    <span className="text-xs text-[#64748b] leading-relaxed">{s.summary}</span>
                  </div>
                  <Chip
                    tone={
                      s.tone === 'positive' ? 'green' : s.tone === 'caution' ? 'amber' : 'slate'
                    }
                  >
                    {s.verdict}
                  </Chip>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="nda" title="NDA" icon={FileSignature}>
            {signed ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <Field label="Signed copy">{signed.fileName}</Field>
                <Field label="Version">v{signed.version}</Field>
                <Field label="Uploaded by">{signed.uploadedBy}</Field>
                <Field label="Uploaded on">{signed.uploadedOn}</Field>
              </div>
            ) : (
              <Body>The signed NDA has not been uploaded yet.</Body>
            )}
          </Section>

          <Section id="questions" title="Open Questions" icon={HelpCircle}>
            <ul className="flex flex-col gap-1.5 list-disc pl-4 marker:text-slate-300">
              {buildOpenQuestions(request).map((q) => (
                <li key={q} className="text-sm text-[#475569] leading-relaxed">
                  {q}
                </li>
              ))}
            </ul>
          </Section>

          <Section id="timeline" title="Key Dates" icon={Clock}>
            <ol className="flex flex-col divide-y divide-[#d3dbe4] rounded-xl border border-[#e2e8f0] bg-white">
              {[...(request.auditLog ?? [])].slice(-8).map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-4 px-4 py-2.5">
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-[#0d212c]">{e.title}</span>
                    <span className="text-xs text-[#64748b]">{e.actor}</span>
                  </div>
                  <span className="text-xs text-[#64748b] whitespace-nowrap">{e.timestamp}</span>
                </li>
              ))}
            </ol>
          </Section>

          {extraSection && (
            <Section id={extraSection.id} title={extraSection.label} icon={Users}>
              {extraSection.content}
            </Section>
          )}
        </div>
      </div>
    </section>
  )
}
