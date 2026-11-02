import type { PartnershipRequest } from '@/types/partnership.types'
import type { DisplayStatus } from '@/lib/caseStatus'
import { getStageProgress, type StageProgress } from '@/lib/caseActions'
import { noteToText, sanitiseNoteHtml } from '@/lib/summaryNote'
import { confidenceLevel, type ConfidenceLevel } from '@/components/organisms/AgentActions'

/** Everything the case notes panel shows, read from the case. Missing data stays undefined. */
export interface CaseNotesData {
  company: string
  code: string
  headline: string
  stage: StageProgress
  owner: string
  focusArea: string
  maturity: string
  solution?: string
  proposal?: string
  focusAreas: string[]
  maturityDetail?: string
  approvals: string[]
  sponsors?: { lead: string; co: string[] }
  assessment?: { status: 'proceed' | 'reject'; confidence: ConfidenceLevel; rationale: string }
  notes?: { html: string; text: string; updatedBy: string; updatedOn: string }
}

const filled = (text?: string) => (text && text.trim() ? text.trim() : undefined)

export const getCaseNotesData = (r: PartnershipRequest): CaseNotesData => {
  const a = r.assessmentAreas
  const html = r.summaryNote ? sanitiseNoteHtml(r.summaryNote.html) : ''
  const text = noteToText(html)
  const rec = r.agentRecommendation
  return {
    company: r.companyName,
    code: r.requestCode,
    headline: r.headline ?? r.solution,
    stage: getStageProgress(r),
    owner: r.owner,
    focusArea: r.focusArea,
    maturity: r.solutionMaturity,
    solution: filled(a?.productPlatformServiceDetails) ?? filled(r.solution),
    proposal: filled(a?.proposalOfCollaboration),
    focusAreas: a?.focusAreas?.length ? a.focusAreas : r.tags?.length ? r.tags : [r.focusArea],
    maturityDetail: filled(a?.solutionMaturityLevelAndRegulatory),
    approvals: a?.regulatoryApprovalList ?? [],
    sponsors: r.sponsors?.lead ? r.sponsors : undefined,
    assessment: rec
      ? {
          status: rec.status,
          confidence: confidenceLevel(rec.confidence),
          rationale: rec.rationale,
        }
      : undefined,
    notes:
      r.summaryNote && text
        ? { html, text, updatedBy: r.summaryNote.updatedBy, updatedOn: r.summaryNote.updatedOn }
        : undefined,
  }
}

export const stageText = (stage: CaseNotesData['stage']) =>
  stage.index ? `${stage.label} (${stage.index} of ${stage.total})` : stage.label

/** A clean plain-text version of the card, for pasting into an email or a slide */
export const buildNotesText = (
  d: CaseNotesData,
  status: DisplayStatus,
  showAssessment: boolean
): string => {
  const blocks: string[] = [
    ['CASE NOTES', `${d.company} · ${d.code} · ${status}`, d.headline].join('\n'),
    [
      `Stage: ${stageText(d.stage)}`,
      `Owner: ${d.owner}`,
      `Focus area: ${d.focusArea}`,
      `Maturity: ${d.maturity}`,
    ].join('\n'),
  ]
  const section = (title: string, body?: string) => {
    if (body) blocks.push(`${title}\n${body}`)
  }
  section('Solution description', d.solution)
  section('Proposal of collaboration', d.proposal)
  section('Focus areas', d.focusAreas.join(', '))
  section(
    'Solution maturity & approvals',
    [d.maturityDetail, d.approvals.length ? `Approvals: ${d.approvals.join(', ')}` : '']
      .filter(Boolean)
      .join('\n') || undefined
  )
  if (d.sponsors) {
    section(
      'Sponsors',
      [
        `Lead: ${d.sponsors.lead}`,
        d.sponsors.co.length ? `Co-sponsors: ${d.sponsors.co.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    )
  }
  if (showAssessment && d.assessment) {
    section(
      'Assessment summary',
      `Points to ${d.assessment.status}, ${d.assessment.confidence.toLowerCase()} confidence. ${d.assessment.rationale}`
    )
  }
  if (d.notes) {
    section('Key notes', d.notes.text)
    blocks.push(`Last updated by ${d.notes.updatedBy} on ${d.notes.updatedOn}`)
  }
  return blocks.join('\n\n')
}
