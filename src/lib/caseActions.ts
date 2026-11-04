import {
  DEFAULT_INTERNAL_INTERESTS,
  DEFAULT_STRATEGY_MEMBERS,
  INITIAL_PARTNERSHIP_REQUESTS,
  type AuditEvent,
  type CaseType,
  type InternalInterestStakeholder,
  type InternalScenario,
  type PartnershipRequest,
  type QuestionAnswer,
  type CallAttendee,
  type MeetingSummary,
  type QuestionnaireQuestion,
  type SponsorPreference,
  type StrategyMemberResponse,
  type WorkflowStage,
} from '@/types/partnership.types'
import { SAMPLE_VENDOR_FORM, isVendorIdValid, type VendorFormValues } from '@/types/vendorForm'
import { DEFAULT_QUESTIONNAIRE_ID, getQuestionnaire } from '@/types/questionnaires'
import { sampleAnswersFor } from '@/lib/sampleAnswers'
import { escapeNoteText, markNote, noteToText, sanitiseNoteHtml } from '@/lib/summaryNote'

const DIRECTOR_NAME = 'Zaid Al Ali'
const ADMIN_NAME = 'Nadia Al-Farsi'
const DIRECTOR_ACTOR = `${DIRECTOR_NAME} (Director)`
const ADMIN_ACTOR = `${ADMIN_NAME} (Partnership Admin)`
const INTERNAL_ACTOR = 'Mariam Al-Zaabi (Internal Interest)'
const SPONSOR_NAME = 'Rashid Al-Nuaimi'
const SPONSOR_ACTOR = `${SPONSOR_NAME} (Sponsor)`
const AGENT_ACTOR = 'Triage Agent'

/** The Strategy Team reviewer the Director picked for this case */
const strategyReviewer = (r: PartnershipRequest) => r.strategyTeamMembers?.[0]?.name

/** Audit actor for Strategy Team actions: the picked reviewer, or the team when none is known */
export const strategyActor = (r: PartnershipRequest) => {
  const name = strategyReviewer(r)
  return name ? `${name} (Strategy Team)` : 'Strategy Team'
}

export const CASE_TYPE_OWNER: Record<CaseType, string> = {
  Partnership: DIRECTOR_NAME,
  Procure: 'Procurement team',
  'M&A': 'Corporate Development team',
}

const todayLabel = (date = new Date()) =>
  date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

/** 22 Oct 2026, 06:50 PM */
export const formatTimestamp = (date = new Date()) =>
  `${todayLabel(date)}, ${date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })}`

/* ---------- Internal Interest due dates ---------- */

/** Internal Interest reviewers are asked to answer within this many days; late answers still count */
export const INTERNAL_RESPONSE_DAYS = 4

const DAY_MS = 24 * 60 * 60 * 1000
const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const fromIso = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** The due date for a request sent now (ISO yyyy-mm-dd) */
export const internalDueOn = (sentOn = new Date()) =>
  isoDate(new Date(sentOn.getTime() + INTERNAL_RESPONSE_DAYS * DAY_MS))

/** 16 Oct 2026 */
export const formatDueDate = (iso: string) => todayLabel(fromIso(iso))

/** Whole days a pending response is past its due date; 0 when on time, answered or without a date */
export const getOverdueDays = (
  dueOn: string | undefined,
  status: string | undefined,
  today = new Date()
) => {
  if (!dueOn || status !== 'Pending') return 0
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const days = Math.round((start.getTime() - fromIso(dueOn).getTime()) / DAY_MS)
  return days > 0 ? days : 0
}

export type AuditInput = Omit<AuditEvent, 'id' | 'timestamp'> & { key?: string }

/** Adds an event to the case's audit log. An event with an existing key is only logged once. */
export const appendAudit = (r: PartnershipRequest, event: AuditInput): PartnershipRequest => {
  const log = r.auditLog ?? []
  const { key, ...rest } = event
  const id = key ?? `${r.id}-${log.length + 1}-${Date.now()}`
  if (key && log.some((e) => e.id === key)) return r
  return { ...r, auditLog: [...log, { ...rest, id, timestamp: formatTimestamp() }] }
}

/** The six workflow stages on the case page, in order */
export const WORKFLOW_STAGES = [
  'Initial Assessment Brief',
  'Internal Canvas',
  'Strategic Alignment',
  'NDA',
  'Discovery Call',
  'Value & Due Diligence',
] as const

/** True only once a vendor-signed copy of the NDA has been uploaded; acknowledging is not enough */
export const hasSignedNda = (r: PartnershipRequest): boolean =>
  Boolean(r.nda?.versions?.some((v) => v.signed === true))

/** Actions that belong to the Discovery Call and later; they need the signed NDA */
const AFTER_NDA: CaseAction['type'][] = [
  'platformCall',
  'discoveryFile',
  'discoverySummary',
  'proceedToValue',
  'confirmValueCall',
  'businessCase',
  'valueDecision',
  'generateTdd',
  'finalSponsor',
]

/**
 * The furthest workflow stage (1-6) the case has got to, whether or not it has since left the
 * workflow. A brief that was rejected or routed still counts as the brief stage.
 */
const furthestStage = (r: PartnershipRequest): number => {
  // A case is only closed after its brief was approved (rejected briefs exit instead)
  const briefApproved =
    r.decision?.status === 'proceeded' ||
    r.status === 'In Progress' ||
    r.status === 'At Risk' ||
    r.status === 'Closed'
  if (r.queue === 'admin' || r.queue === 'routed' || !briefApproved) return 1
  if (r.stageApprovals?.internal?.status !== 'approved') return 2
  if (r.stageApprovals?.strategy?.status !== 'approved') return 3
  if (!r.alignmentPackOn || !hasSignedNda(r)) return 4
  if (!r.discovery?.proceededOn) return 5
  return 6
}

/**
 * Where the case is right now, named after the workflow stages on the case page. Closed, Exited
 * and routed cases have left the workflow, so they keep their outcome as the label.
 */
export const getStageLabel = (r: PartnershipRequest): string => {
  if (r.status === 'Closed') return 'Closed'
  if (r.queue === 'closed' || r.status === 'Exited') return 'Exited'
  if (r.queue === 'routed') {
    return r.caseType === 'Procure' ? 'Routed to Procurement' : 'Routed to Corporate Development'
  }
  return WORKFLOW_STAGES[furthestStage(r) - 1]
}

export type StageKind = 'active' | 'closed' | 'exited' | 'routed'

export interface StageProgress {
  /** Same as getStageLabel */
  label: string
  /** Current stage (1-6) while the case is in the workflow; null once it has left */
  index: number | null
  total: number
  kind: StageKind
  /** Furthest stage the case got to (1-6); for closed and exited cases, where it stopped */
  reached: number
}

/** The stage as a position among the six, for progress displays */
export const getStageProgress = (r: PartnershipRequest): StageProgress => {
  const label = getStageLabel(r)
  const reached = furthestStage(r)
  const kind: StageKind =
    label === 'Closed'
      ? 'closed'
      : label === 'Exited'
        ? 'exited'
        : r.queue === 'routed'
          ? 'routed'
          : 'active'
  return {
    label,
    index: kind === 'active' ? reached : null,
    total: WORKFLOW_STAGES.length,
    kind,
    reached,
  }
}

/** Director has made a decision, so the Partnership Admin can no longer change the type */
export const hasDirectorDecided = (r: PartnershipRequest) =>
  r.queue === 'director' &&
  (Boolean(r.decision) ||
    r.status === 'In Progress' ||
    r.status === 'At Risk' ||
    r.status === 'Closed' ||
    r.status === 'Exited')

const setStages = (
  stages: WorkflowStage[],
  completedUpTo: number,
  inProgressId?: number
): WorkflowStage[] =>
  stages.map((s) => {
    if (s.id <= completedUpTo) return { ...s, status: 'completed', subheading: 'Completed' }
    if (s.id === inProgressId) return { ...s, status: 'in_progress', subheading: 'In Progress' }
    return { ...s, status: 'not_started', subheading: 'Not Started' }
  })

/** Director approves the brief: the case moves on to the review stages */
export const proceedRequest = (r: PartnershipRequest, reason: string): PartnershipRequest =>
  appendAudit(
    {
      ...r,
      status: 'In Progress',
      workflowStages: r.workflowStages.map((stage) => {
        if (stage.id === 3) return { ...stage, status: 'completed', subheading: 'Completed' }
        if (stage.id === 4) return { ...stage, status: 'in_progress', subheading: 'In Progress' }
        return stage
      }),
      daysInStage: 0,
      decision: {
        status: 'proceeded',
        reason: reason || 'Approved to proceed to next stage.',
        date: 'Just now',
      },
    },
    {
      title: 'Approved to proceed',
      description: reason || 'Approved to proceed to the next stage.',
      actor: DIRECTOR_ACTOR,
      kind: 'approval',
    }
  )

export const rejectRequest = (r: PartnershipRequest, reason: string): PartnershipRequest =>
  appendAudit(
    {
      ...r,
      status: 'Exited',
      daysInStage: 0,
      decision: { status: 'rejected', reason, date: 'Just now' },
    },
    { title: 'Request rejected', description: reason, actor: DIRECTOR_ACTOR, kind: 'critical' }
  )

/** Starting point for the email the Director sends when more information is needed */
export const buildInfoEmail = (r: PartnershipRequest, senderName: string) => ({
  to: r.companyInfo.email,
  subject: `More information needed: ${r.requestCode} ${r.companyName}`,
  body: [
    `Hi ${r.companyInfo.name},`,
    '',
    `Thank you for your partnership request (${r.requestCode}) for "${r.solution}". Before we can take it forward, we need a little more information:`,
    '',
    '• [Describe the information you need]',
    '',
    'Please reply to this email with the details. Your request stays marked as Information Requested until we hear from you.',
    '',
    'Kind regards,',
    senderName,
    'Director, Partnerships',
    'M42',
  ].join('\n'),
})

/** Starting point for the email the Director sends the partner when closing the request */
export const buildCloseEmail = (r: PartnershipRequest, directorName: string, reason: string) => ({
  to: r.companyInfo.email,
  subject: `Update on your partnership request ${r.requestCode}`,
  body: [
    `Hi ${r.companyInfo.name},`,
    '',
    `Thank you for your partnership request (${r.requestCode}) for "${r.solution}" and for the time your team has given us.`,
    '',
    `After careful review, we have decided not to take the request further at this stage. ${reason.trim()}`,
    '',
    'We appreciate your interest in working with M42 and would be glad to hear from you again in the future.',
    '',
    'Kind regards,',
    directorName,
    'Director, Partnerships',
    'M42',
  ].join('\n'),
})

/** Director asks the vendor for more information: the case waits until it arrives */
export const holdRequest = (
  r: PartnershipRequest,
  email: { to: string; subject: string; body: string }
): PartnershipRequest =>
  appendAudit(
    {
      ...r,
      status: 'Information Requested',
      daysInStage: 0,
      holdInfo: { requestedOn: todayLabel(), ...email },
    },
    {
      title: 'More information requested',
      description: `Email sent to ${email.to}: ${email.subject}`,
      actor: DIRECTOR_ACTOR,
      kind: 'user',
    }
  )

/** Vendor information has arrived: the case goes back to the Director's brief */
export const resumeRequest = (r: PartnershipRequest): PartnershipRequest => {
  const { holdInfo: _holdInfo, ...rest } = r
  void _holdInfo
  return appendAudit(
    { ...rest, status: 'Pending', daysInStage: 0 },
    {
      title: 'Vendor information received',
      description: 'The case is back with the Director.',
      actor: DIRECTOR_ACTOR,
      kind: 'user',
    }
  )
}

export interface AdminRouting {
  action: 'proceed' | 'reject'
  type?: CaseType
  reason: string
}

/** Partnership Admin routes the case. Only Partnership cases reach the Director. */
export const routeRequest = (r: PartnershipRequest, routing: AdminRouting): PartnershipRequest => {
  const adminDecision = {
    action: routing.action,
    type: routing.type,
    reason: routing.reason,
    date: 'Just now',
    decidedAt: new Date().toISOString(),
  }

  if (routing.action === 'reject') {
    return appendAudit(
      {
        ...r,
        adminDecision,
        caseType: undefined,
        queue: 'closed',
        status: 'Exited',
        owner: ADMIN_NAME,
        daysInStage: 0,
      },
      {
        title: 'Rejected by Partnership Admin',
        description: routing.reason,
        actor: ADMIN_ACTOR,
        kind: 'critical',
      }
    )
  }

  const type = routing.type ?? 'Partnership'
  const reason = routing.reason || 'No reason added.'
  if (type === 'Partnership') {
    return appendAudit(
      {
        ...r,
        adminDecision,
        caseType: type,
        queue: 'director',
        status: 'Pending',
        owner: DIRECTOR_NAME,
        daysInStage: 0,
        workflowStages: setStages(r.workflowStages, 2, 3),
      },
      {
        title: 'Routed as Partnership',
        description: `Sent to the Director. ${reason}`,
        actor: ADMIN_ACTOR,
        kind: 'approval',
      }
    )
  }

  return appendAudit(
    {
      ...r,
      adminDecision,
      caseType: type,
      queue: 'routed',
      status: 'In Progress',
      owner: CASE_TYPE_OWNER[type],
      daysInStage: 0,
      workflowStages: setStages(r.workflowStages, 2, 3),
    },
    {
      title: `Routed as ${type}`,
      description: `Not in the Director's list. ${reason}`,
      actor: ADMIN_ACTOR,
      kind: 'approval',
    }
  )
}

type ReviewTeam = 'internal' | 'strategy'

/** Director sends a review request: reviewers are notified and the stage waits for approval */
export const sendReview = (
  r: PartnershipRequest,
  team: ReviewTeam,
  payload: {
    members: InternalInterestStakeholder[]
    questionnaire?: { name: string; questions: QuestionnaireQuestion[] }
  }
): PartnershipRequest => {
  const members = payload.members.map((m) => ({
    ...m,
    status: 'Pending',
    ...(team === 'internal'
      ? { dueOn: internalDueOn(), deadline: undefined }
      : { deadline: '2-3 days' }),
    decision: '-',
    sponsor: undefined,
    responseDate: undefined,
    answers: undefined,
    strategyResponse: undefined,
  }))
  const next: PartnershipRequest = {
    ...r,
    sent: { ...r.sent, [team]: true },
    daysInStage: 0,
    ...(team === 'internal'
      ? { internalInterests: members, sentQuestionnaire: payload.questionnaire }
      : { strategyTeamMembers: members }),
  }
  return appendAudit(next, {
    key: `${r.id}-sent-${team}`,
    title:
      team === 'internal'
        ? 'Request sent to Internal Interest team'
        : 'Request sent to Strategy Team',
    description:
      team === 'internal'
        ? `${members.length} ${members.length === 1 ? 'reviewer' : 'reviewers'} asked to answer ${
            payload.questionnaire?.questions.length ?? 0
          } questions.`
        : `${members.length} ${members.length === 1 ? 'reviewer' : 'reviewers'} asked to review the pre-read summary.`,
    actor: DIRECTOR_ACTOR,
    kind: 'user',
  })
}

/** A reviewing team answers: the answer is recorded and counts as that stage's approval */
export const submitReview = (
  r: PartnershipRequest,
  team: ReviewTeam,
  payload: { answers?: QuestionAnswer[]; response?: StrategyMemberResponse }
): PartnershipRequest => {
  if (team === 'internal') {
    const people = r.internalInterests?.length ? r.internalInterests : DEFAULT_INTERNAL_INTERESTS
    const answers = payload.answers ?? []
    return appendAudit(
      {
        ...r,
        internalInterests: people.map((m, i) =>
          i === 0
            ? {
                ...m,
                status: 'Completed',
                decision: 'Proceed',
                sponsor: 'Yes',
                responseDate: todayLabel(),
                answers,
              }
            : m
        ),
        sponsors: r.sponsors ?? { lead: people[0].name, co: [] },
        stageApprovals: {
          ...r.stageApprovals,
          internal: { status: 'approved', by: 'Mariam Al-Zaabi', date: 'Just now' },
        },
      },
      {
        title: 'Internal Interest approved',
        description: `${answers.length} ${answers.length === 1 ? 'question' : 'questions'} answered.`,
        actor: INTERNAL_ACTOR,
        kind: 'approval',
      }
    )
  }

  const response = payload.response ?? {}
  const declined = response.finalDecision === 'Reject'
  const people = r.strategyTeamMembers?.length
    ? r.strategyTeamMembers
    : DEFAULT_STRATEGY_MEMBERS.slice(0, 1)
  return appendAudit(
    {
      ...r,
      strategyTeamMembers: people.map((m, i) =>
        i === 0
          ? {
              ...m,
              status: 'Completed',
              decision: response.finalDecision,
              strategyResponse: response,
            }
          : m
      ),
      workflowStages: declined ? r.workflowStages : setStages(r.workflowStages, 3, 4),
      stageApprovals: {
        ...r.stageApprovals,
        strategy: {
          status: declined ? 'declined' : 'approved',
          by: strategyReviewer(r) ?? 'Strategy Team',
          date: 'Just now',
        },
      },
    },
    {
      title: declined ? 'Strategy Team declined' : 'Strategy Team approved',
      description: response.finalDecision ?? 'Decision submitted.',
      actor: strategyActor(r),
      kind: declined ? 'critical' : 'approval',
    }
  )
}

export const nextCaseCode = (requests: PartnershipRequest[]) => {
  const highest = requests.reduce((max, r) => {
    const n = Number(r.requestCode.replace(/\D/g, ''))
    return Number.isFinite(n) ? Math.max(max, n) : max
  }, 0)
  return `PR-${highest + 1}`
}

const inferMaturity = (text: string) => {
  const t = text.toLowerCase()
  if (/commercial|fully deployed|live customers|scaled/.test(t)) return 'Commercial'
  if (/validat|trial|study/.test(t)) return 'Clinical Validation'
  if (/pilot/.test(t)) return 'Pilot'
  return 'Concept'
}

const parseApprovals = (text: string) => {
  const found = ['FDA', 'CE', 'ISO', 'UAE MOHAP', 'DoH'].filter((a) =>
    new RegExp(`\\b${a.replace(' ', '\\s')}\\b`, 'i').test(text)
  )
  return found.length > 0 ? found : ['Not applicable']
}

const summarise = (text: string, max = 110) => {
  const first = text.trim().split(/(?<=[.!?])\s/)[0]
  return first.length > max ? `${first.slice(0, max - 1).trimEnd()}…` : first
}

/** Starting use case summary for a new case, built from the vendor form */
const buildSummaryNote = (values: VendorFormValues, solution: string, maturity: string) => {
  const approvals = parseApprovals(values.relevantApprovals).filter((a) => a !== 'Not applicable')
  const areas =
    values.focusAreas.length > 0 ? values.focusAreas.join(', ') : 'no focus area selected'
  const lead = /[.!?…]$/.test(solution) ? solution : `${solution}.`
  return [
    escapeNoteText(`${values.company.trim()}: ${lead} Focus: ${areas}. Maturity: ${maturity}.`),
    approvals.length > 0
      ? markNote('positive', `Approvals listed: ${approvals.join(', ')}.`)
      : markNote('critical', 'No regulatory approvals listed.'),
  ].join(' ')
}

/** VND-013: the next vendor number after the highest one on the cases */
export const nextVendorId = (requests: PartnershipRequest[]) =>
  `VND-${String(
    Math.max(0, ...requests.map((r) => Number(r.vendorId?.replace(/^VND-/i, '')) || 0)) + 1
  ).padStart(3, '0')}`

/**
 * Turns a submitted vendor form into a new case waiting for the Partnership Admin. The vendor
 * keeps the Vendor ID they gave (when well formed); otherwise they get the next new one.
 */
export const buildCaseFromForm = (
  values: VendorFormValues,
  code: string,
  now = new Date(),
  existing: PartnershipRequest[] = INITIAL_PARTNERSHIP_REQUESTS
): PartnershipRequest => {
  const givenId = values.vendorId.trim().toUpperCase()
  const vendorId = givenId && isVendorIdValid(givenId) ? givenId : nextVendorId(existing)
  const submittedOn = todayLabel(now)
  const deadline = todayLabel(new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000))
  const solution = summarise(values.proposal)
  const maturity = inferMaturity(values.maturityAndRegulatory)

  return {
    id: `req-${code.toLowerCase().replace(/\D/g, '')}-${now.getTime()}`,
    requestCode: code,
    vendorId,
    queue: 'admin',
    daysInStage: 0,
    owner: ADMIN_NAME,
    slaStatus: 'On track',
    companyName: values.company.trim(),
    vendorName: values.name.trim(),
    referredBy: null,
    solution,
    headline: solution,
    focusArea: values.focusAreas[0] ?? 'General',
    solutionMaturity: maturity,
    status: 'Pending',
    submittedOn,
    deadline,
    submittedRelative: 'Just now',
    tags: values.focusAreas,
    agentRecommendation: {
      status: 'proceed',
      label: 'Assessment points to proceed',
      confidence: 72,
      rationale:
        'The submission is complete and aligns with M42 focus areas. Regulatory evidence and baselines still need to be confirmed.',
    },
    // The Triage Agent writes the first entry in the notes log
    notes: [
      {
        id: `note-${now.getTime()}`,
        author: AGENT_ACTOR,
        role: 'AI agent',
        at: now.toISOString(),
        html: buildSummaryNote(values, solution, maturity),
      },
    ],
    workflowStages: [
      { id: 1, title: 'Submission', subheading: submittedOn, status: 'completed' },
      { id: 2, title: 'Intake & Triage', subheading: 'In Progress', status: 'in_progress' },
      { id: 3, title: 'Screening & Fit', subheading: 'Not Started', status: 'not_started' },
      { id: 4, title: 'NDA & Discovery', subheading: 'Not Started', status: 'not_started' },
      { id: 5, title: 'Value Assessment', subheading: 'Not Started', status: 'not_started' },
      { id: 6, title: 'Due Diligence', subheading: 'Not Started', status: 'not_started' },
      { id: 7, title: 'Term Sheet & Pilot', subheading: 'Not Started', status: 'not_started' },
    ],
    overviewCards: {
      evidence: 'Not yet assessed',
      deployment: 'Not yet assessed',
      regulatory: values.relevantApprovals.trim() || 'Not provided',
      duplicateCheck: 'Clear',
    },
    sowDetails: {
      sowName: `${values.company.trim()} — ${solution}`,
      sowDeadline: deadline,
      tokenConsumption: '0',
    },
    uploadedDocuments: [],
    auditLog: [
      {
        id: `${code}-submitted`,
        title: 'Partnership request submitted',
        description: `Vendor form received from ${values.company.trim()}.`,
        actor: `${values.name.trim()} (Vendor)`,
        kind: 'user',
        timestamp: formatTimestamp(now),
      },
    ],
    companyInfo: {
      name: values.name.trim(),
      jobTitle: values.jobTitle.trim(),
      company: values.company.trim(),
      vendorId: values.vendorId.trim().toUpperCase() || undefined,
      phoneNumber: values.phone.trim() || undefined,
      email: values.email.trim(),
      yearFounded: values.yearFounded.trim(),
    },
    assessmentAreas: {
      stageOfMaturityAndExperience: values.stageAndExperience.trim(),
      proposalOfCollaboration: values.proposal.trim(),
      productPlatformServiceDetails: values.proposal.trim(),
      focusAreas: values.focusAreas,
      solutionMaturityLevelAndRegulatory: values.maturityAndRegulatory.trim(),
      relevantApprovals: values.relevantApprovals.trim(),
      regulatoryApprovalList: parseApprovals(values.relevantApprovals),
      noveltyAndDifferentiation: values.novelty.trim(),
      developmentApproach: values.developmentApproach || undefined,
      requestedM42Resources: values.resources.trim(),
      impactedPatientPopulations: values.populations,
    },
  }
}

/* ---------- Internal Interest outcome, sponsors and closing a case ---------- */

/** Closes a case that was already approved at the brief, with the reason recorded */
export const closeRequest = (r: PartnershipRequest, reason: string): PartnershipRequest =>
  appendAudit(
    { ...r, status: 'Closed', daysInStage: 0, closedReason: reason },
    {
      title: 'Request closed by Director',
      description: reason,
      actor: DIRECTOR_ACTOR,
      kind: 'critical',
    }
  )

/** The Director closes the request and emails the partner. Nothing is really emailed. */
export const closeWithEmail = (
  r: PartnershipRequest,
  reason: string,
  email: { to: string; subject: string; body: string }
): PartnershipRequest =>
  appendAudit(
    { ...closeRequest(r, reason), closedEmail: { ...email, sentOn: todayLabel() } },
    {
      title: 'Closure email sent',
      description: `Email sent to ${email.to}: ${email.subject}`,
      actor: DIRECTOR_ACTOR,
      kind: 'user',
    }
  )

/**
 * Close request while the case is still at the Initial Assessment Brief: the brief is rejected
 * (Exited, stepper Closed) and the email to the partner is kept on the case
 */
export const rejectWithEmail = (
  r: PartnershipRequest,
  reason: string,
  email: { to: string; subject: string; body: string }
): PartnershipRequest => {
  const rejected = appendAudit(
    {
      ...r,
      status: 'Exited',
      daysInStage: 0,
      decision: { status: 'rejected', reason, date: 'Just now' },
      rejectionEmail: { ...email, sentOn: todayLabel() },
    },
    {
      title: 'Rejected at Initial Assessment',
      description: reason,
      actor: DIRECTOR_ACTOR,
      kind: 'critical',
    }
  )
  return appendAudit(rejected, {
    title: 'Closure email sent',
    description: `Email sent to ${email.to}: ${email.subject}`,
    actor: DIRECTOR_ACTOR,
    kind: 'user',
  })
}

const approveInternal = (r: PartnershipRequest, sponsors: { lead: string; co: string[] }) =>
  appendAudit(
    {
      ...r,
      sponsors,
      stageApprovals: {
        ...r.stageApprovals,
        internal: { status: 'approved', by: sponsors.lead, date: 'Just now' },
      },
    },
    {
      title: 'Internal Interest approved',
      description:
        sponsors.co.length > 0
          ? `${sponsors.lead} is lead sponsor with ${sponsors.co.join(', ')} as co-sponsors.`
          : `${sponsors.lead} is ready to sponsor.`,
      actor: INTERNAL_ACTOR,
      kind: 'approval',
    }
  )

/**
 * Prototype only: simulates how the Internal Interest team responded, so every outcome can be
 * walked through. The real application would take this from the reviewers' answers.
 */
export const applyInternalScenario = (
  r: PartnershipRequest,
  scenario: InternalScenario
): PartnershipRequest => {
  const people = r.internalInterests?.length ? r.internalInterests : DEFAULT_INTERNAL_INTERESTS
  const ready = scenario === 'single' ? 1 : scenario === 'multiple' ? 3 : 0
  const answered = scenario === 'none' ? 0 : scenario === 'not-ready' ? 2 : ready + 1
  const date = todayLabel()
  const members = people.map((m, i) => {
    if (i >= answered) {
      return { ...m, status: 'Pending', decision: '-', sponsor: undefined, responseDate: undefined }
    }
    return {
      ...m,
      status: 'Completed',
      // Someone can be interested, or not, without being ready to sponsor
      decision: i === 1 && scenario === 'not-ready' ? 'Reject' : 'Proceed',
      sponsor: i < ready ? ('Yes' as const) : ('No' as const),
      responseDate: date,
    }
  })
  // Picking another outcome re-opens a case an earlier outcome had closed
  const base: PartnershipRequest = {
    ...r,
    status: r.status === 'Closed' ? 'In Progress' : r.status,
    closedReason: undefined,
    internalInterests: members,
    internalOutcome: { scenario },
    sponsors: undefined,
    stageApprovals: { ...r.stageApprovals, internal: undefined },
  }
  if (scenario === 'none') {
    // The Director closes the case from the popup that follows
    return appendAudit(base, {
      title: 'No Internal Interest response',
      description: 'No one from the Internal Interest team responded.',
      actor: INTERNAL_ACTOR,
      kind: 'user',
    })
  }
  if (scenario === 'single') {
    return approveInternal(base, { lead: members[0].name, co: [] })
  }
  return appendAudit(base, {
    title: 'Internal Interest responded',
    description:
      scenario === 'not-ready'
        ? '2 reviewers responded; none is ready to sponsor.'
        : '3 reviewers are ready to sponsor.',
    actor: INTERNAL_ACTOR,
    kind: 'user',
  })
}

export const assignSponsors = (
  r: PartnershipRequest,
  sponsors: { lead: string; co: string[] }
): PartnershipRequest => approveInternal(r, sponsors)

/**
 * With several sponsors the case is split: every co-sponsor gets a duplicate of the case that
 * carries the same details and history, and is linked back to the original.
 */
export const buildSplitCases = (parent: PartnershipRequest): PartnershipRequest[] =>
  (parent.sponsors?.co ?? []).map((sponsor, i) => {
    const code = `${parent.requestCode}-${String.fromCharCode(65 + i)}`
    return appendAudit(
      {
        ...parent,
        id: `${parent.id}-split-${i + 1}`,
        requestCode: code,
        splitFrom: parent.id,
        sponsors: { lead: sponsor, co: [] },
        daysInStage: 0,
      },
      {
        title: 'Case split',
        description: `Duplicate of ${parent.requestCode} for sponsor ${sponsor}.`,
        actor: DIRECTOR_ACTOR,
        kind: 'user',
      }
    )
  })

/* ---------- NDA & Discovery ---------- */

/** The unsigned NDA template, kept as version 1 once a signed copy replaces it */
const NDA_TEMPLATE_FILE = 'ADHDS_NDA_Execution_Form_v1.0.docx'

/**
 * Director uploads a signed NDA copy. The first one keeps the unsigned template as version 1 and
 * becomes version 2, and generates the alignment pack.
 */
export const uploadSignedNda = (r: PartnershipRequest, fileName: string): PartnershipRequest => {
  const existing = r.nda?.versions ?? []
  const first = existing.length === 0
  const today = todayLabel()
  const base = first
    ? [
        {
          version: 1,
          signed: false,
          fileName: NDA_TEMPLATE_FILE,
          uploadedOn: today,
          uploadedBy: DIRECTOR_NAME,
        },
      ]
    : existing
  const version = base.length + 1
  const logged = appendAudit(
    {
      ...r,
      nda: {
        versions: [
          ...base,
          { version, signed: true, fileName, uploadedOn: today, uploadedBy: DIRECTOR_NAME },
        ],
      },
    },
    {
      title: first ? 'Signed NDA uploaded' : `NDA version ${version} uploaded`,
      description: fileName,
      actor: DIRECTOR_ACTOR,
      kind: 'approval',
    }
  )
  if (!first) return logged
  return appendAudit(
    { ...logged, alignmentPackOn: today, daysInStage: 0 },
    {
      title: 'Alignment pack generated',
      description:
        'Brief, interest summary and strategy assessment merged with open questions, shared with the Director, sponsors and the Strategy Team.',
      actor: AGENT_ACTOR,
      kind: 'agent',
    }
  )
}

export type DiscoveryFileKind = 'notes' | 'transcripts' | 'recordings'

const DISCOVERY_AUDIT: Record<DiscoveryFileKind, string> = {
  notes: 'Meeting notes uploaded',
  transcripts: 'Transcript uploaded',
  recordings: 'Recording uploaded',
}

/**
 * The discovery call was held outside (Teams or elsewhere): its transcripts are added, and the
 * agent writes the meeting summary from them
 */
export const summariseDiscoveryTranscripts = (
  r: PartnershipRequest,
  files: { name: string; size: string }[]
): PartnershipRequest => {
  const on = todayLabel()
  const discovery = { notes: [], transcripts: [], recordings: [], ...r.discovery }
  const transcripts = files.map((f) => ({
    name: f.name,
    size: f.size,
    uploadedOn: on,
    uploadedBy: DIRECTOR_NAME,
  }))
  const withFiles = appendAudit(
    {
      ...r,
      discovery: { ...discovery, transcripts: [...(discovery.transcripts ?? []), ...transcripts] },
    },
    {
      title: 'Transcripts uploaded',
      description: `${files.length} ${files.length === 1 ? 'transcript' : 'transcripts'}: ${files
        .map((f) => f.name)
        .join(', ')}`,
      actor: DIRECTOR_ACTOR,
      kind: 'user',
    }
  )
  const count = withFiles.discovery?.transcripts?.length ?? files.length
  return appendAudit(
    {
      ...withFiles,
      discovery: {
        ...withFiles.discovery!,
        summary: {
          fileName: 'Discovery-call-summary.pdf',
          generatedOn: on,
          transcriptCount: count,
          content: buildCallSummary(r, 'discovery', []),
        },
      },
    },
    {
      title: 'Meeting summary generated',
      description: `From ${count} ${count === 1 ? 'transcript' : 'transcripts'}.`,
      actor: AGENT_ACTOR,
      kind: 'agent',
    }
  )
}

export const addDiscoveryFile = (
  r: PartnershipRequest,
  kind: DiscoveryFileKind,
  name: string
): PartnershipRequest => {
  const discovery = { notes: [], transcripts: [], recordings: [], ...r.discovery }
  return appendAudit(
    {
      ...r,
      discovery: {
        ...discovery,
        [kind]: [...discovery[kind], { name, uploadedOn: todayLabel(), uploadedBy: DIRECTOR_NAME }],
      },
    },
    { title: DISCOVERY_AUDIT[kind], description: name, actor: DIRECTOR_ACTOR, kind: 'user' }
  )
}

export type CallType = 'discovery' | 'value'

/** Prototype: the structured summary the listening agent writes when a call on the platform ends */
export const buildCallSummary = (
  r: PartnershipRequest,
  callType: CallType,
  attendees: CallAttendee[]
): MeetingSummary => {
  const company = r.companyName
  const proposal = r.assessmentAreas?.proposalOfCollaboration?.split(/(?<=[.!?])\s/)[0]
  const regulatoryUnclear = (r.overviewCards?.regulatory ?? '').toLowerCase().includes('unclear')
  const base = { attendees: attendees.map((a) => a.name) }
  if (callType === 'discovery') {
    return {
      ...base,
      keyPoints: [
        `${company} walked through ${r.headline ?? r.solution}.`,
        ...(proposal ? [`Proposed collaboration: ${proposal}`] : []),
        `Focus areas discussed: ${(r.assessmentAreas?.focusAreas ?? [r.focusArea]).join(', ')}.`,
      ],
      vendorCommitments: [
        'Share the security and architecture documentation pack.',
        'Confirm UAE data hosting options in writing.',
      ],
      openQuestions: [
        'Which hospital or site will pilot first, and who is the clinical owner there?',
        'Which baseline KPIs will the pilot be measured against?',
      ],
      risks: [
        ...(regulatoryUnclear ? ['Regulatory approvals for the UAE are not yet confirmed.'] : []),
        'Ownership of models tuned on M42 data is not agreed yet.',
      ],
      nextSteps: [
        'Vendor sends the documents within two weeks.',
        'Director hands the case to the sponsor for Value & Due Diligence.',
      ],
    }
  }
  return {
    ...base,
    keyPoints: [
      `Value case for ${company} reviewed against the pilot scope.`,
      'Expected benefits and the effort for M42 teams were discussed.',
    ],
    vendorCommitments: [
      'Provide pricing for the pilot and for scale-up.',
      'Share reference sites with comparable outcomes.',
    ],
    openQuestions: ['Which budget line funds the pilot?', 'What exit terms apply after the pilot?'],
    risks: ['Benefits depend on clinical adoption at the pilot site.'],
    nextSteps: [
      'Sponsor uploads the business case and records the decision.',
      'Agent prepares the technical due diligence report if the sponsor proceeds.',
    ],
  }
}

/**
 * A discovery or value call held on the platform: the attendees and the agent's summary are kept
 * on the stage, the summary is added to the meeting notes, and the value call counts as held.
 */
export const holdPlatformCall = (
  r: PartnershipRequest,
  callType: CallType,
  attendees: CallAttendee[],
  questions?: { asked: string[]; notAsked: string[] }
): PartnershipRequest => {
  const on = todayLabel()
  const host = callType === 'discovery' ? DIRECTOR_NAME : SPONSOR_NAME
  const call = {
    format: 'platform' as const,
    attendees,
    summary: {
      ...buildCallSummary(r, callType, attendees),
      ...(questions
        ? { questionsAsked: questions.asked, questionsNotAsked: questions.notAsked }
        : {}),
    },
    on,
  }
  const discovery = { notes: [], transcripts: [], recordings: [], ...r.discovery }
  const summaryFile = {
    name: `${callType === 'discovery' ? 'Discovery' : 'Value'}_call_summary_${r.requestCode}.pdf`,
    uploadedOn: on,
    uploadedBy: 'Listening agent',
  }
  const next: PartnershipRequest = {
    ...r,
    discovery: {
      ...discovery,
      notes: [...discovery.notes, summaryFile],
      ...(callType === 'discovery' ? { platformCall: call } : {}),
    },
    ...(callType === 'value'
      ? {
          value: {
            ...r.value,
            platformCall: call,
            callConfirmedOn: r.value?.callConfirmedOn ?? on,
          },
        }
      : {}),
  }
  const held = appendAudit(next, {
    title: 'Call held on platform',
    description: `${callType === 'discovery' ? 'Discovery' : 'Value assessment'} call with ${attendees.length} ${
      attendees.length === 1 ? 'attendee' : 'attendees'
    }.`,
    actor: callType === 'discovery' ? DIRECTOR_ACTOR : `${host} (Sponsor)`,
    kind: 'user',
  })
  return appendAudit(held, {
    title: 'Meeting summary generated',
    description: `${summaryFile.name} added to the meeting notes.`,
    actor: AGENT_ACTOR,
    kind: 'agent',
  })
}

/** The Director hands the case to the sponsor for Value & Due Diligence, with or without extra context */
export const proceedToValue = (r: PartnershipRequest): PartnershipRequest =>
  r.discovery?.proceededOn || !hasSignedNda(r)
    ? r
    : appendAudit(
        {
          ...r,
          daysInStage: 0,
          discovery: {
            notes: [],
            transcripts: [],
            recordings: [],
            ...r.discovery,
            proceededOn: todayLabel(),
          },
          workflowStages: setStages(r.workflowStages, 4, 5),
        },
        {
          title: 'Moved to Value & Due Diligence',
          description:
            'The Director reviewed the alignment pack and handed the case to the sponsor.',
          actor: DIRECTOR_ACTOR,
          kind: 'user',
        }
      )

/* ---------- Value & Due Diligence ---------- */

export const confirmValueCall = (r: PartnershipRequest): PartnershipRequest =>
  appendAudit(
    { ...r, value: { ...r.value, callConfirmedOn: todayLabel() } },
    {
      title: 'Value assessment call confirmed',
      description: 'The value assessment call has taken place.',
      actor: SPONSOR_ACTOR,
      kind: 'user',
    }
  )

export const uploadBusinessCase = (r: PartnershipRequest, name: string): PartnershipRequest =>
  appendAudit(
    {
      ...r,
      value: {
        ...r.value,
        businessCase: { name, uploadedOn: todayLabel(), uploadedBy: SPONSOR_NAME },
      },
    },
    { title: 'Business case uploaded', description: name, actor: SPONSOR_ACTOR, kind: 'user' }
  )

/** The sponsor's call on the business case. Proceed moves to due diligence, reject closes the case. */
export const decideValue = (
  r: PartnershipRequest,
  status: 'proceeded' | 'rejected',
  reason: string
): PartnershipRequest => {
  const decision = { status, reason: reason || undefined, date: todayLabel() }
  const next: PartnershipRequest = { ...r, value: { ...r.value, decision } }
  if (status === 'rejected') {
    return appendAudit(
      {
        ...next,
        status: 'Closed',
        daysInStage: 0,
        closedReason: reason || 'Rejected by the sponsor.',
      },
      {
        title: 'Business case rejected',
        description: reason,
        actor: SPONSOR_ACTOR,
        kind: 'critical',
      }
    )
  }
  return appendAudit(
    { ...next, daysInStage: 0, workflowStages: setStages(r.workflowStages, 5, 6) },
    {
      title: 'Business case approved',
      description: reason || 'The sponsor chose to proceed to due diligence.',
      actor: SPONSOR_ACTOR,
      kind: 'approval',
    }
  )
}

/** The TDD report is filled in by the agent once the sponsor has proceeded */
export const generateTddReport = (r: PartnershipRequest): PartnershipRequest =>
  r.value?.tddGeneratedOn
    ? r
    : appendAudit(
        { ...r, value: { ...r.value, tddGeneratedOn: todayLabel() } },
        {
          title: 'TDD report generated',
          description: 'Technical due diligence report ready for the sponsor.',
          actor: AGENT_ACTOR,
          kind: 'agent',
        }
      )

/**
 * The case waits on the TDD Admin: it is at Value & Due Diligence, the sponsor has proceeded on the
 * business case, and the technical due diligence report has not been generated yet
 */
export const isAwaitingTddAdmin = (r: PartnershipRequest) =>
  getStageLabel(r) === 'Value & Due Diligence' &&
  r.value?.decision?.status === 'proceeded' &&
  !r.value?.tddGeneratedOn

/**
 * The TDD Admin marks every assessment round as completed; the agent then generates the
 * technical due diligence report for the sponsor
 */
export const completeTddAssessments = (r: PartnershipRequest, actor: string): PartnershipRequest =>
  isAwaitingTddAdmin(r)
    ? generateTddReport(
        appendAudit(r, {
          title: 'TDD assessments completed',
          description:
            'All technical due diligence assessment rounds were marked as completed. The report is being generated.',
          actor,
          kind: 'approval',
        })
      )
    : r

/** The sponsor's final answer after the TDD report: sponsor the partnership, or decline it */
export const finalizeSponsorship = (
  r: PartnershipRequest,
  sponsor: boolean
): PartnershipRequest => {
  if (r.value?.sponsoredOn || r.value?.finalDecision) return r
  const finalDecision = { status: sponsor ? 'sponsored' : 'declined', date: todayLabel() } as const
  if (!sponsor) {
    return appendAudit(
      {
        ...r,
        value: { ...r.value, finalDecision },
        status: 'Closed',
        daysInStage: 0,
        closedReason: 'The sponsor chose not to sponsor this partnership.',
      },
      {
        title: 'Sponsorship declined',
        description: 'The sponsor chose not to sponsor this partnership.',
        actor: SPONSOR_ACTOR,
        kind: 'critical',
      }
    )
  }
  return appendAudit(
    {
      ...r,
      value: { ...r.value, finalDecision, sponsoredOn: todayLabel() },
      daysInStage: 0,
      workflowStages: setStages(r.workflowStages, 7),
    },
    {
      title: 'Partnership sponsored',
      description: 'The sponsor confirmed they will sponsor this partnership.',
      actor: SPONSOR_ACTOR,
      kind: 'approval',
    }
  )
}

/* ---------- Internal Interest answers after submitting ---------- */

/** The answer as it stands now: the last edit, or the original when there are none */
export const currentAnswer = (a: QuestionAnswer): string => a.edits?.at(-1)?.answer ?? a.answer

/**
 * A reviewer changes one of their submitted answers. The original and every earlier edit stay on
 * record; a reason is required and the answer must actually change. The decision is untouched.
 */
export const editInternalAnswer = (
  r: PartnershipRequest,
  memberId: string,
  questionId: string,
  answer: string,
  reason: string,
  by: string
): PartnershipRequest => {
  const member = r.internalInterests?.find((m) => m.id === memberId)
  const index = member?.answers?.findIndex((a) => a.questionId === questionId) ?? -1
  const target = index >= 0 ? member!.answers![index] : undefined
  const why = reason.trim()
  if (!member || !target || !why || answer === currentAnswer(target)) return r
  const edit = { answer, reason: why, by, on: todayLabel() }
  return appendAudit(
    {
      ...r,
      internalInterests: r.internalInterests!.map((m) =>
        m.id === memberId
          ? {
              ...m,
              answers: m.answers!.map((a, i) =>
                i === index ? { ...a, edits: [...(a.edits ?? []), edit] } : a
              ),
            }
          : m
      ),
    },
    {
      title: 'Internal Interest answer changed',
      description: `Question ${index + 1}: ${why}`,
      actor: `${by} (Internal Interest)`,
      kind: 'user',
    }
  )
}

/* ---------- Sponsor interest ---------- */

/**
 * Someone offers to sponsor the case, at any stage. A team and a reason are required; a person
 * who already offered replaces their earlier offer.
 */
export const expressSponsorInterest = (
  r: PartnershipRequest,
  interest: { name: string; team: string; preference: SponsorPreference; note: string }
): PartnershipRequest => {
  const team = interest.team.trim()
  const note = interest.note.trim()
  if (!interest.name || !team || !note) return r
  const entry = {
    name: interest.name,
    team,
    preference: interest.preference,
    note,
    stage: getStageLabel(r),
    on: todayLabel(),
  }
  return appendAudit(
    {
      ...r,
      sponsorInterests: [
        ...(r.sponsorInterests ?? []).filter((i) => i.name !== interest.name),
        entry,
      ],
    },
    {
      title: 'Sponsor interest expressed',
      description: `${interest.preference} at ${entry.stage}: ${note}`,
      actor: `${interest.name} (${team})`,
      kind: 'user',
    }
  )
}

/* ---------- Use case summary note ---------- */

/** Saves an edited use case summary. Only text and highlights are kept. */
/** Adds a note to the case notes log. Notes are only ever added; earlier ones never change. */
export const addCaseNote = (
  r: PartnershipRequest,
  html: string,
  author: { name: string; role: string },
  now = new Date()
): PartnershipRequest => {
  const clean = sanitiseNoteHtml(html)
  if (!noteToText(clean)) return r
  return appendAudit(
    {
      ...r,
      notes: [
        ...(r.notes ?? []),
        {
          id: `note-${now.getTime()}`,
          author: author.name,
          role: author.role,
          at: now.toISOString(),
          html: clean,
        },
      ],
    },
    {
      title: 'Note added',
      description: `${author.name} added a note.`,
      actor: `${author.name} (${author.role})`,
      kind: 'user',
    }
  )
}

/** Every change the late stages and the Internal Interest outcome can make to a case */
export type CaseAction =
  | { type: 'internalScenario'; scenario: InternalScenario }
  | { type: 'closeCase'; reason: string }
  | { type: 'closeWithEmail'; reason: string; email: { to: string; subject: string; body: string } }
  | {
      type: 'rejectWithEmail'
      reason: string
      email: { to: string; subject: string; body: string }
    }
  | { type: 'assignSponsors'; lead: string; co: string[] }
  | { type: 'uploadNda'; fileName: string }
  | { type: 'discoveryFile'; kind: DiscoveryFileKind; name: string }
  | { type: 'discoverySummary'; files: { name: string; size: string }[] }
  | {
      type: 'platformCall'
      callType: CallType
      attendees: CallAttendee[]
      questions?: { asked: string[]; notAsked: string[] }
    }
  | { type: 'proceedToValue' }
  | { type: 'confirmValueCall' }
  | { type: 'businessCase'; name: string }
  | { type: 'valueDecision'; status: 'proceeded' | 'rejected'; reason: string }
  | { type: 'generateTdd' }
  | { type: 'finalSponsor'; sponsor: boolean }
  | { type: 'addNote'; html: string; author: { name: string; role: string } }
  | {
      type: 'sponsorInterest'
      interest: { name: string; team: string; preference: SponsorPreference; note: string }
    }
  | {
      type: 'editInternalAnswer'
      memberId: string
      questionId: string
      answer: string
      reason: string
      by: string
    }

export const applyCaseAction = (r: PartnershipRequest, action: CaseAction): PartnershipRequest => {
  // Hard gate: nothing after the NDA stage happens without the signed copy
  if (AFTER_NDA.includes(action.type) && !hasSignedNda(r)) return r
  switch (action.type) {
    case 'internalScenario':
      return applyInternalScenario(r, action.scenario)
    case 'closeCase':
      return closeRequest(r, action.reason)
    case 'closeWithEmail':
      return closeWithEmail(r, action.reason, action.email)
    case 'rejectWithEmail':
      return rejectWithEmail(r, action.reason, action.email)
    case 'assignSponsors':
      return assignSponsors(r, { lead: action.lead, co: action.co })
    case 'uploadNda':
      return uploadSignedNda(r, action.fileName)
    case 'platformCall':
      return holdPlatformCall(r, action.callType, action.attendees, action.questions)
    case 'discoveryFile':
      return addDiscoveryFile(r, action.kind, action.name)
    case 'discoverySummary':
      return summariseDiscoveryTranscripts(r, action.files)
    case 'proceedToValue':
      return proceedToValue(r)
    case 'confirmValueCall':
      return confirmValueCall(r)
    case 'businessCase':
      return uploadBusinessCase(r, action.name)
    case 'valueDecision':
      return decideValue(r, action.status, action.reason)
    case 'generateTdd':
      return generateTddReport(r)
    case 'finalSponsor':
      return finalizeSponsorship(r, action.sponsor)
    case 'addNote':
      return addCaseNote(r, action.html, action.author)
    case 'sponsorInterest':
      return expressSponsorInterest(r, action.interest)
    case 'editInternalAnswer':
      return editInternalAnswer(
        r,
        action.memberId,
        action.questionId,
        action.answer,
        action.reason,
        action.by
      )
  }
}

/* ---------- Prototype: test cases that start at a chosen stage ---------- */

const TEST_VENDORS = [
  { company: 'Meridian Health AI', email: 'rania@meridianhealth.ai' },
  { company: 'Lumen Diagnostics', email: 'hello@lumendiagnostics.ai' },
  { company: 'Aster Care Analytics', email: 'team@astercare.ai' },
]

/** The Strategy reviewer the test case is sent to */
const TEST_STRATEGY_REVIEWER: InternalInterestStakeholder = {
  id: 'strat-2',
  name: 'Leena Thomas',
  initials: 'LT',
  role: 'Senior Strategy Manager',
  department: 'Strategy',
  expertise: 'Growth & Expansion',
  avatarColorBg: '#fce7f3',
  avatarColorText: '#9d174d',
  source: 'manual',
}

/**
 * Prototype navigation only: a new case from the sample vendor form that lands on the chosen
 * stage. Every earlier stage is filled by the real actions, so the audit log reads as if each
 * step had been taken.
 */
export const buildTestCase = (
  code: string,
  stage: (typeof WORKFLOW_STAGES)[number]
): PartnershipRequest => {
  const target = WORKFLOW_STAGES.indexOf(stage) + 1
  const vendor = TEST_VENDORS[(Number(code.replace(/\D/g, '')) || 0) % TEST_VENDORS.length]
  let r = buildCaseFromForm({ ...SAMPLE_VENDOR_FORM, ...vendor }, code)
  r = routeRequest(r, { action: 'proceed', type: 'Partnership', reason: 'Test case.' })
  if (target >= 2) r = proceedRequest(r, 'Test case: brief approved.')
  if (target >= 3) {
    const questionnaire = getQuestionnaire(DEFAULT_QUESTIONNAIRE_ID)
    const questions = questionnaire.questions
    r = sendReview(r, 'internal', {
      members: DEFAULT_INTERNAL_INTERESTS,
      questionnaire: { name: questionnaire.name, questions },
    })
    const samples = sampleAnswersFor(questions)
    r = submitReview(r, 'internal', {
      answers: questions.map((q) => ({
        questionId: q.id,
        question: q.text,
        cue: q.cue,
        answer: samples[q.id] ?? '',
      })),
    })
  }
  if (target >= 4) {
    r = sendReview(r, 'strategy', { members: [TEST_STRATEGY_REVIEWER] })
    r = submitReview(r, 'strategy', {
      response: {
        documents: ['M42_Roadmap_Register.xlsx'],
        finalDecision: 'Proceed',
        finalDecisionNote: 'Proceed on the condition that the vendor commits to UAE data hosting.',
        submittedAt: 'Just now',
      },
    })
  }
  if (target >= 5) r = uploadSignedNda(r, `Signed_NDA_${code}.pdf`)
  if (target >= 6) r = proceedToValue(r)
  return r
}
