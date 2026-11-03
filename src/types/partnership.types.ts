import type { StageProgress } from '@/lib/caseActions'

export type PartnershipStatus =
  'Pending' | 'In Progress' | 'At Risk' | 'Exited' | 'Information Requested' | 'Closed'

/** How the Partnership Admin routes a case */
export type CaseType = 'Partnership' | 'Procure' | 'M&A'

/** Which team's list a case currently sits in */
export type CaseQueue = 'admin' | 'director' | 'routed' | 'closed'

export type SlaStatus = 'On track' | 'At risk' | 'Breached'

/** Colour coding for the audit log */
export type AuditKind = 'critical' | 'agent' | 'approval' | 'user'

export interface AuditEvent {
  id: string
  title: string
  description: string
  actor: string
  kind: AuditKind
  /** Display time, e.g. 22 Oct 2026, 06:50 PM */
  timestamp: string
}

/** One question the Director sends to the Internal Interest team */
export interface QuestionnaireQuestion {
  id: string
  text: string
  /** Guidance shown to the person answering */
  cue: string
  /** Mandatory questions must be answered before the reviewer can submit */
  mandatory: boolean
}

/** A change to a submitted answer. The original answer is never overwritten. */
export interface AnswerEdit {
  answer: string
  reason: string
  by: string
  /** Display date, e.g. 22 Oct 2026 */
  on: string
}

export interface QuestionAnswer {
  questionId: string
  question: string
  cue: string
  /** The answer as first submitted; edits are kept separately */
  answer: string
  /** Later changes, oldest first. The last one is the current answer. */
  edits?: AnswerEdit[]
}

/** What the Internal Interest team did, as simulated in the prototype */
export type InternalScenario = 'none' | 'not-ready' | 'single' | 'multiple'

export interface SponsorAssignment {
  lead: string
  co: string[]
}

export interface NdaVersion {
  version: number
  /** False for the unsigned template copy that version 1 keeps */
  signed: boolean
  fileName: string
  uploadedOn: string
  uploadedBy: string
}

export interface CaseFile {
  name: string
  uploadedOn: string
  uploadedBy: string
  /** Display size, e.g. 340 KB */
  size?: string
}

/** Someone on a call held on the platform: an M42 colleague or an external email */
export interface CallAttendee {
  name: string
  email?: string
  internal: boolean
  role?: string
}

/** What the listening agent writes after a call held on the platform */
export interface MeetingSummary {
  attendees: string[]
  keyPoints: string[]
  vendorCommitments: string[]
  openQuestions: string[]
  risks: string[]
  nextSteps: string[]
  /** Questions the host ticked off on the call, and the suggested ones left unasked */
  questionsAsked?: string[]
  questionsNotAsked?: string[]
}

/** A discovery or value call held on the platform, with the agent's summary */
export interface PlatformCall {
  format: 'platform'
  attendees: CallAttendee[]
  summary: MeetingSummary
  /** Display date, e.g. 22 Oct 2026 */
  on: string
}

export interface StageApproval {
  status: 'approved' | 'declined'
  by: string
  date: string
}

export type StageStatus = 'completed' | 'in_progress' | 'not_started'

export interface WorkflowStage {
  id: number
  title: string
  subheading: string
  status: StageStatus
}

export interface OverviewCards {
  evidence: string
  deployment: string
  regulatory: string
  duplicateCheck: string
}

export interface CompanyInfo {
  name: string // Submitter Name *
  jobTitle: string // Job Title *
  company: string // Company *
  /** VND-123, given when the vendor raised a request before */
  vendorId?: string
  phoneNumber?: string // Phone Number (optional)
  email: string // Email Address *
  yearFounded: string // Year Founded *
  location?: string // Location (e.g. UAE, Dubai)
}

export interface KeyAssessmentAreas {
  stageOfMaturityAndExperience: string // *
  growthJourneyAndRegionalExperience?: string
  milestones?: string[]
  proposalOfCollaboration: string // *
  productPlatformServiceDetails: string // *
  focusAreas: string[] // *
  solutionMaturityLevelAndRegulatory: string // *
  relevantApprovals?: string // optional
  regulatoryApprovalList?: string[]
  noveltyAndDifferentiation: string // *
  developmentApproach?: string // optional
  requestedM42Resources: string // *
  impactedPatientPopulations?: string[] // optional
  clinicalAreas?: string[]
}

export interface UploadedDoc {
  id: string
  name: string
  size: string
  type: string
}

/** The Strategy Team's call on the pre-read summary */
export type StrategyDecision = 'Proceed' | 'Reject'

export interface StrategyMemberResponse {
  /** Knowledge base files the reviewer added before the pre-read was generated */
  documents?: string[]
  finalDecision?: StrategyDecision
  /** The reviewer's reason (optional for Proceed, mandatory for Reject) */
  finalDecisionNote?: string
  submittedAt?: string
}

export interface InternalInterestStakeholder {
  id: string
  name: string
  initials: string
  role: string
  department: string
  expertise: string
  whySuggested?: string
  avatarColorBg: string
  avatarColorText: string
  status?: string
  /** Strategy Team response window, e.g. 2-3 days */
  deadline?: string
  /** Internal Interest: the date the response is due (ISO yyyy-mm-dd). Late answers are still accepted. */
  dueOn?: string
  decision?: string
  /** Whether the reviewer is ready to sponsor the partnership */
  sponsor?: 'Yes' | 'No'
  /** When the response was captured */
  responseDate?: string
  source?: 'ai' | 'manual'
  answers?: QuestionAnswer[]
  strategyResponse?: StrategyMemberResponse
}

export interface AgentRecommendation {
  status: 'proceed' | 'reject'
  label: string
  confidence: number
  rationale: string
}

export type SponsorPreference = 'Lead' | 'Co-sponsor' | 'Either'

/** Someone offering to sponsor the partnership, at any stage */
export interface SponsorInterest {
  name: string
  team: string
  preference: SponsorPreference
  note: string
  /** The workflow stage when the interest was expressed */
  stage: string
  /** Display date, e.g. 22 Oct 2026 */
  on: string
}

/** Use case summary note. html holds only text and <mark data-tone="critical|attention|positive"> */
export interface SummaryNote {
  html: string
  updatedBy: string
  updatedOn: string
}

/** One entry in the case notes log. html holds only text and <mark data-tone="critical|neutral|positive"> */
export interface CaseNote {
  id: string
  author: string
  role: string
  /** ISO timestamp */
  at: string
  html: string
}

export interface PartnershipRequest {
  id: string
  /** Human-readable request ID shown in tables, e.g. PR-124 */
  requestCode: string
  /** The vendor's ID across their requests, e.g. VND-012 */
  vendorId?: string
  companyName: string
  vendorName: string
  referredBy?: string | null
  solution: string
  focusArea: string
  solutionMaturity: string
  status: PartnershipStatus
  submittedOn: string
  deadline: string
  submittedRelative?: string
  headline?: string
  tags?: string[]
  workflowStages: WorkflowStage[]
  overviewCards: OverviewCards
  sowDetails: {
    sowName: string
    sowDeadline: string
    tokenConsumption: string
  }
  uploadedDocuments: UploadedDoc[]
  companyInfo: CompanyInfo
  assessmentAreas: KeyAssessmentAreas
  internalInterests?: InternalInterestStakeholder[]
  strategyTeamMembers?: InternalInterestStakeholder[]
  agentRecommendation?: AgentRecommendation
  /** The case notes log, oldest first. Notes are only ever added, never edited. */
  notes?: CaseNote[]
  decision?: {
    status: 'proceeded' | 'rejected'
    reason?: string
    date?: string
    decidedBy?: string
  }
  /** Route chosen by the Partnership Admin */
  caseType?: CaseType
  queue: CaseQueue
  daysInStage: number
  owner: string
  slaStatus: SlaStatus
  /** Set while the Director waits for more information from the vendor */
  holdInfo?: {
    requestedOn: string
    to: string
    subject: string
    body: string
  }
  adminDecision?: {
    action: 'proceed' | 'reject'
    type?: CaseType
    reason: string
    date: string
    /** ISO timestamp of the decision, used for period counts */
    decidedAt?: string
  }
  auditLog: AuditEvent[]
  /** Which review requests the Director has sent */
  sent?: { internal?: boolean; strategy?: boolean }
  /** Approval from each reviewing team; the next stage opens once a team has approved */
  stageApprovals?: { internal?: StageApproval; strategy?: StageApproval }
  /** The questionnaire the Director sent to the Internal Interest team */
  sentQuestionnaire?: { name: string; version?: number; questions: QuestionnaireQuestion[] }
  /** Set once the Internal Interest outcome is known (or simulated) */
  internalOutcome?: { scenario: InternalScenario }
  /** Set on a duplicate case created when several sponsors were assigned: the original case id */
  splitFrom?: string
  /** Who sponsors the partnership internally; set when the Internal Canvas stage ends */
  sponsors?: SponsorAssignment
  /** People who offered to sponsor, newest last */
  sponsorInterests?: SponsorInterest[]
  /** Why the case was closed after the brief was approved */
  closedReason?: string
  /** The email the Director sent the partner when closing the request (nothing is really sent) */
  closedEmail?: { to: string; subject: string; body: string; sentOn: string }
  /** The email the Director sent the partner when rejecting the brief (nothing is really sent) */
  rejectionEmail?: { to: string; subject: string; body: string; sentOn: string }
  /** Signed NDA copies, oldest first */
  nda?: { versions: NdaVersion[] }
  /** Generated when the first signed NDA is uploaded */
  alignmentPackOn?: string
  discovery?: {
    notes: CaseFile[]
    transcripts?: CaseFile[]
    recordings: CaseFile[]
    /** When the Director handed the case to the sponsor for Value & Due Diligence */
    proceededOn?: string
    /** Set when the discovery call was held on the platform */
    platformCall?: PlatformCall
    /** The agent's meeting summary, written from the uploaded transcripts */
    summary?: {
      fileName: string
      generatedOn: string
      transcriptCount: number
      content: MeetingSummary
    }
  }
  value?: {
    callConfirmedOn?: string
    businessCase?: CaseFile
    decision?: { status: 'proceeded' | 'rejected'; reason?: string; date: string }
    /** When the agent filled in the TDD report */
    tddGeneratedOn?: string
    /** The sponsor's final answer after the TDD report */
    finalDecision?: { status: 'sponsored' | 'declined'; date: string }
    /** Set when the sponsor confirms: completes the case */
    sponsoredOn?: string
    /** Set when the value assessment call was held on the platform */
    platformCall?: PlatformCall
  }
}

export const DEFAULT_INTERNAL_INTERESTS: InternalInterestStakeholder[] = [
  {
    id: 'int-1',
    name: 'Riza Sayeed',
    initials: 'RS',
    role: 'Head of AI & Analytics',
    department: 'AI & Analytics',
    expertise: 'AI Strategy',
    whySuggested: 'Evaluated high-scoring diagnostic algorithms and data infrastructure alignment',
    avatarColorBg: '#dbeafe',
    avatarColorText: '#1e40af',
    status: 'Completed',
    dueOn: '2026-10-16',
    decision: 'Proceed',
    sponsor: 'Yes',
    responseDate: '12 Oct 2026',
    source: 'ai',
    answers: [
      {
        questionId: 'q1',
        question: 'Is this a real problem for you today, and what do you do about it now?',
        cue: 'Describe the current clinical or operational problem and existing workarounds.',
        answer:
          'Sepsis is still recognised late on our wards, and patients often reach ICU after the best window for antibiotics.',
      },
      {
        questionId: 'q2',
        question: 'Which KPI would move, what is the baseline today, and what change would matter?',
        cue: 'Name the KPI, today’s baseline and the change that would matter.',
        answer:
          'ICU sepsis mortality. Baseline is 21% over 12 months. A 3 point drop in 12 months would matter.',
      },
      {
        questionId: 'q3',
        question:
          'Would you sponsor a pilot, who would the named sponsor be, and what capacity can you commit?',
        cue: 'Say yes or no, name the sponsor and the capacity you can commit.',
        answer: 'Yes, we would sponsor.',
      },
      {
        questionId: 'q4',
        question: 'Is there a budget line, or would it need central funding?',
        cue: 'State whether an existing budget line covers it.',
        answer: 'Existing budget line.',
      },
      {
        questionId: 'q5',
        question: 'What would make you say no?',
        cue: 'Identify dealbreakers, clinical blockers, integration risks or IT hurdles.',
        answer:
          'High latency in EHR synchronization or high false positive alarm fatigue among nursing staff.',
      },
    ],
  },
  {
    id: 'int-2',
    name: 'Parag Agarwal',
    initials: 'PA',
    role: 'Radiology & Imaging Lead',
    department: 'Medical Imaging',
    expertise: 'Imaging',
    whySuggested: 'Direct expertise in radiology workflow integration and clinical PACS validation',
    avatarColorBg: '#f3e8ff',
    avatarColorText: '#6b21a8',
    status: 'Pending',
    dueOn: '2026-10-16',
    decision: '-',
    source: 'ai',
  },
  {
    id: 'int-3',
    name: 'Najla Al Mansoori',
    initials: 'NA',
    role: 'Clinical Innovation Lead',
    department: 'Clinical Innovation',
    expertise: 'Clinical Validation',
    whySuggested: 'Leads clinical protocol assessment and clinical trial readiness',
    avatarColorBg: '#d1fae5',
    avatarColorText: '#065f46',
    status: 'Pending',
    dueOn: '2026-10-16',
    decision: '-',
    source: 'ai',
  },
  {
    id: 'int-4',
    name: 'Khalid Al Zaabi',
    initials: 'KA',
    role: 'Operations Transformation Lead',
    department: 'Operations',
    expertise: 'Operations',
    whySuggested: 'Assesses operational feasibility and clinical IT deployment readiness',
    avatarColorBg: '#ffedd5',
    avatarColorText: '#9a3412',
    status: 'Pending',
    dueOn: '2026-10-16',
    decision: '-',
    source: 'ai',
  },
  {
    id: 'int-5',
    name: 'Sara Malik',
    initials: 'SM',
    role: 'HealthTech Partnerships',
    department: 'Strategic Partnerships',
    expertise: 'Partnerships',
    whySuggested: 'Oversees ecosystem synergy and commercial healthtech alliance fit',
    avatarColorBg: '#fce7f3',
    avatarColorText: '#9d174d',
    status: 'Pending',
    dueOn: '2026-10-16',
    decision: '-',
    source: 'ai',
  },
]

/**
 * No one is the Strategy Team by default: the Director picks the reviewer for each case from the
 * + Add Member list.
 */
export const DEFAULT_STRATEGY_MEMBERS: InternalInterestStakeholder[] = []

/** Seed cases: Leena Thomas reviewed GenomicX and has AlphaHealth still to review */
const SEED_STRATEGY_REVIEW: InternalInterestStakeholder = {
  id: 'strat-2',
  name: 'Leena Thomas',
  initials: 'LT',
  role: 'Senior Strategy Manager',
  department: 'Strategy',
  expertise: 'Growth & Expansion',
  whySuggested: 'Assesses overall strategic alignment and healthcare market expansion',
  avatarColorBg: '#fce7f3',
  avatarColorText: '#9d174d',
  status: 'Completed',
  deadline: '2-3 days',
  decision: 'Proceed',
  source: 'manual',
  strategyResponse: {
    documents: ['MedTech_Innovations_Pitch_Deck.pptx', 'Vendor_Security_Questionnaire.docx'],
    finalDecision: 'Proceed',
    finalDecisionNote:
      'Proceed on the condition that the vendor commits to UAE hosting and registers a local entity.',
    submittedAt: 'Yesterday at 4:30 PM',
  },
}

const SEED_STRATEGY_PENDING: InternalInterestStakeholder = {
  ...SEED_STRATEGY_REVIEW,
  status: 'Pending',
  decision: '-',
  strategyResponse: undefined,
}

/** M42 colleagues who can be invited to a call held on the platform */
export const M42_PEOPLE: { name: string; role: string; email: string }[] = [
  { name: 'Zaid Al Ali', role: 'Director, Partnerships', email: 'zaid.alali@m42.ae' },
  { name: 'Nadia Al-Farsi', role: 'Partnership Admin', email: 'nadia.alfarsi@m42.ae' },
  { name: 'Rashid Al-Nuaimi', role: 'Sponsor', email: 'rashid.alnuaimi@m42.ae' },
  { name: 'Mariam Al-Zaabi', role: 'Internal Interest Team', email: 'mariam.alzaabi@m42.ae' },
  { name: 'Leena Thomas', role: 'Senior Strategy Manager', email: 'leena.thomas@m42.ae' },
  {
    name: 'Omar Al-Hashemi',
    role: 'Director of Healthcare Strategy',
    email: 'omar.alhashemi@m42.ae',
  },
  { name: 'Riza Sayeed', role: 'Head of AI & Analytics', email: 'riza.sayeed@m42.ae' },
  { name: 'Parag Agarwal', role: 'Radiology & Imaging Lead', email: 'parag.agarwal@m42.ae' },
  { name: 'Najla Al Mansoori', role: 'Clinical Innovation Lead', email: 'najla.almansoori@m42.ae' },
  {
    name: 'Khalid Al Zaabi',
    role: 'Operations Transformation Lead',
    email: 'khalid.alzaabi@m42.ae',
  },
  { name: 'Sara Malik', role: 'HealthTech Partnerships', email: 'sara.malik@m42.ae' },
  {
    name: 'Dr. Mona Al Hashimi',
    role: 'Chief Medical Information Officer',
    email: 'mona.alhashimi@m42.ae',
  },
  {
    name: 'Dr. Tariq Al Nuaimi',
    role: 'Head of Clinical Research',
    email: 'tariq.alnuaimi@m42.ae',
  },
  {
    name: 'Hessa Al Marzooqi',
    role: 'Information Security Lead',
    email: 'hessa.almarzooqi@m42.ae',
  },
  { name: 'Sultan Al Mehairi', role: 'Enterprise Architect', email: 'sultan.almehairi@m42.ae' },
  {
    name: 'Fatima Al Zaabi',
    role: 'Lead Clinical Bioinformatician',
    email: 'fatima.alzaabi@m42.ae',
  },
  { name: 'Hamad Al Suwaidi', role: 'Service Line Owner', email: 'hamad.alsuwaidi@m42.ae' },
  { name: 'Aisha Al Dhaheri', role: 'Procurement Lead', email: 'aisha.aldhaheri@m42.ae' },
]

/* ---------- Service line interests ---------- */

export type ServiceLineUrgency = 'Low' | 'Medium' | 'High'

/** A requirement a service line raises, so it can be matched with vendors */
export interface ServiceLineInterest {
  /** SL-001, SL-002, ... */
  code: string
  serviceLine: string
  title: string
  problem: string
  focusAreas: string[]
  outcome: string
  urgency: ServiceLineUrgency
  submittedBy: string
  /** Display date, e.g. 22 Oct 2026 */
  on: string
  status: InterestStatus
  /** Who approved or declined it, and when (Strategy Team) */
  decidedBy?: string
  decidedOn?: string
  declineReason?: string
  /** Set when the Strategy Team added it themselves rather than a service line */
  source?: 'Strategy scouting'
  /** Request codes of the vendors the person raising it suggested to the team */
  suggestedVendors?: string[]
  /** Result of the last overlap check */
  overlaps?: Overlap[]
}

/** Strategy reviews every interest; only approved ones reach the Partnership Admin and Director */
export type InterestStatus = 'Pending review' | 'Approved' | 'Declined'

export type ProjectStatus = 'Live' | 'Pilot' | 'Completed' | 'Paused'

/** A project M42 already runs, checked for overlap with new interests and requests */
export interface ExistingProject {
  id: string
  name: string
  /** One or two sentences on what the project does */
  description: string
  team: string
  /** The person who runs it */
  owner: string
  focusArea: string
  status: ProjectStatus
  /** Display date, e.g. Mar 2025 */
  started: string
  vendors: string[]
}

/** Something an interest or project overlaps with, found by the overlap check */
export interface Overlap {
  kind: 'request' | 'project' | 'interest'
  /** Case code, project id or interest code */
  ref: string
  /** Short flag text, e.g. Overlaps PR-123 (ongoing) */
  label: string
  /** Name of the related item */
  title: string
  /** Its status as shown elsewhere */
  status: string
  /** A partnership request's current stage, for the stage chip */
  stage?: StageProgress
  reasons: string[]
  score: number
}

export const INITIAL_SERVICE_LINE_INTERESTS: ServiceLineInterest[] = [
  {
    code: 'SL-001',
    serviceLine: 'Cardiology',
    title: 'Earlier detection of heart failure in outpatients',
    problem:
      'Heart failure is often picked up only at admission. Clinics have echo and ECG data but no tool flags patients at risk early.',
    focusAreas: ['Cardiology & Precision Health', 'AI & Diagnostics'],
    outcome: 'Cut unplanned heart failure admissions by 15% within a year.',
    urgency: 'High',
    submittedBy: 'Dr. Tariq Al Nuaimi',
    on: '06 Oct 2026',
    status: 'Approved',
    decidedBy: 'Leena Thomas',
    decidedOn: '08 Oct 2026',
  },
  {
    code: 'SL-002',
    serviceLine: 'Radiology',
    title: 'AI triage for chest imaging backlog',
    problem:
      'Chest CT and X-ray reads queue for up to two days at peak times, and urgent findings wait with the routine ones.',
    focusAreas: ['Medical Imaging', 'AI & Diagnostics'],
    outcome: 'Urgent chest findings reported within 4 hours; report turnaround under 24 hours.',
    urgency: 'High',
    submittedBy: 'Parag Agarwal',
    on: '13 Oct 2026',
    status: 'Pending review',
  },
  {
    code: 'SL-003',
    serviceLine: 'Neurology',
    title: 'Home seizure monitoring after discharge',
    problem:
      'Epilepsy patients go home without monitoring, and seizures between clinic visits are reported late or not at all.',
    focusAreas: ['Neurology & Digital Health', 'Virtual Care & Remote Monitoring'],
    outcome: 'Seizure events captured at home for 80% of enrolled patients.',
    urgency: 'Medium',
    submittedBy: 'Hamad Al Suwaidi',
    on: '20 Oct 2026',
    status: 'Approved',
    decidedBy: 'Leena Thomas',
    decidedOn: '22 Oct 2026',
  },
  {
    code: 'SL-004',
    serviceLine: 'Genetics',
    title: 'Faster rare disease variant reporting',
    problem:
      'Variant interpretation for suspected rare disease takes weeks, delaying diagnosis for children and their families.',
    focusAreas: ['Genomics & Oncology', 'Rare Diseases'],
    outcome: 'Median time to a variant report under 10 working days.',
    urgency: 'Low',
    submittedBy: 'Fatima Al Zaabi',
    on: '24 Oct 2026',
    status: 'Declined',
    decidedBy: 'Leena Thomas',
    decidedOn: '25 Oct 2026',
    declineReason: 'Already covered by the genomics programme roadmap for 2027.',
  },
]

export const EXISTING_PROJECTS: ExistingProject[] = [
  {
    id: 'PRJ-01',
    name: 'Chest imaging AI triage',
    description: 'Flags urgent findings on chest CT and X-ray so radiologists read them first.',
    team: 'Radiology',
    owner: 'Parag Agarwal',
    focusArea: 'Medical Imaging',
    status: 'Pilot',
    started: 'Feb 2026',
    vendors: ['Lumen Imaging Labs'],
  },
  {
    id: 'PRJ-02',
    name: 'Sepsis early warning on wards',
    description:
      'Scores ward patients every hour and alerts the rapid response team to early sepsis.',
    team: 'Critical Care',
    owner: 'Dr. Mona Al Hashimi',
    focusArea: 'Clinical Decision Support',
    status: 'Live',
    started: 'Jun 2025',
    vendors: ['WardWatch Analytics'],
  },
  {
    id: 'PRJ-03',
    name: 'Remote monitoring after cardiac discharge',
    description:
      'Home monitoring for 90 days after a cardiac admission, with nurse follow-up on alerts.',
    team: 'Cardiology',
    owner: 'Sara Malik',
    focusArea: 'Virtual Care & Remote Monitoring',
    status: 'Completed',
    started: 'Jan 2024',
    vendors: ['HomeBeat Health'],
  },
  {
    id: 'PRJ-04',
    name: 'Emirati Genome Programme variant pipeline',
    description:
      'Processes national genome samples into reportable variants for clinical genetics.',
    team: 'Genomics',
    owner: 'Khalid Al Zaabi',
    focusArea: 'Genomics & Oncology',
    status: 'Live',
    started: 'Sep 2023',
    vendors: ['Omics Core Systems', 'HelixWorks'],
  },
  {
    id: 'PRJ-05',
    name: 'Heart failure risk scoring in clinics',
    description: 'Predicts heart failure admissions from clinic data to plan earlier reviews.',
    team: 'Cardiology',
    owner: 'Sara Malik',
    focusArea: 'Cardiology & Precision Health',
    status: 'Paused',
    started: 'Apr 2025',
    vendors: ['CardioMetric AI'],
  },
  {
    id: 'PRJ-06',
    name: 'Discharge summary automation',
    description:
      'Drafts discharge summaries from the inpatient record for doctors to check and sign.',
    team: 'Clinical Operations',
    owner: 'Omar Al-Hashemi',
    focusArea: 'Clinical Workflow Automation',
    status: 'Live',
    started: 'Nov 2024',
    vendors: ['Scribewell'],
  },
  {
    id: 'PRJ-07',
    name: 'Diabetes prevention coaching',
    description: 'Digital coaching for people at risk of type 2 diabetes, run with primary care.',
    team: 'Population Health',
    owner: 'Mariam Al-Zaabi',
    focusArea: 'Preventative Healthcare',
    status: 'Completed',
    started: 'Mar 2023',
    vendors: ['Nudge Health'],
  },
  {
    id: 'PRJ-08',
    name: 'EEG reading support for neurology',
    description: 'Helps neurologists read long EEG recordings by marking likely seizure activity.',
    team: 'Neurology',
    owner: 'Riza Sayeed',
    focusArea: 'Neurology & Digital Health',
    status: 'Pilot',
    started: 'Aug 2026',
    vendors: ['NeuroSense Labs'],
  },
]

export const INITIAL_PARTNERSHIP_REQUESTS: PartnershipRequest[] = [
  {
    id: 'req-001',
    requestCode: 'PR-124',
    vendorId: 'VND-008',
    caseType: 'Partnership',
    queue: 'director',
    daysInStage: 3,
    owner: 'Zaid Al Ali',
    slaStatus: 'On track',
    auditLog: [
      {
        id: 'seed-1',
        title: 'Partnership request submitted',
        description: 'Vendor form received from MedTech Innovations.',
        actor: 'Sarah Ahmed (Vendor)',
        kind: 'user',
        timestamp: '12 Oct 2026, 09:12 AM',
      },
      {
        id: 'req-001-brief-generated',
        title: 'Initial assessment brief generated',
        description: '7 checks run. No risks identified.',
        actor: 'Triage Agent',
        kind: 'agent',
        timestamp: '12 Oct 2026, 09:14 AM',
      },
      {
        id: 'seed-3',
        title: 'Routed as Partnership',
        description: 'Sent to the Director for review.',
        actor: 'Nadia Al-Farsi (Partnership Admin)',
        kind: 'approval',
        timestamp: '12 Oct 2026, 11:30 AM',
      },
    ],
    companyName: 'MedTech Innovations',
    vendorName: 'Sarah Ahmed',
    referredBy: 'Dr. Noura Al Ghaithi',
    solution: 'AI-powered diagnostic platform for early disease detection',
    headline: 'AI-powered diagnostic platform for early disease detection',
    focusArea: 'AI & Diagnostics',
    solutionMaturity: 'Pilot',
    status: 'Pending',
    submittedOn: '12 Oct 2026',
    deadline: '31 Oct 2026',
    submittedRelative: '3 days ago',
    tags: ['AI & Diagnostics', 'Medical Imaging', 'Clinical Decision Support'],
    internalInterests: DEFAULT_INTERNAL_INTERESTS,
    notes: [
      {
        id: 'note-1-1',
        author: 'Triage Agent',
        role: 'AI agent',
        at: '2026-10-12T08:00:00Z',
        html: 'AI diagnostic platform that flags early signs of chronic disease from routine labs and imaging, proposed as a pilot in two M42 hospitals. <mark data-tone="positive">Active regional hospital deployments and strong fit with M42 diagnostics priorities.</mark> <mark data-tone="neutral">Clinical validation has not yet been reproduced on M42 patient data.</mark>',
      },
      {
        id: 'note-1-2',
        author: 'Zaid Al Ali',
        role: 'Director',
        at: '2026-10-13T09:20:00Z',
        html: 'Strong clinical story. <mark data-tone="critical">Ask for validation on M42 data before the pilot.</mark>',
      },
      {
        id: 'note-1-3',
        author: 'Nadia Al-Farsi',
        role: 'Partnership Admin',
        at: '2026-10-14T11:05:00Z',
        html: 'Routed to the Director as a Partnership. <mark data-tone="neutral">Vendor contact replies within a day.</mark>',
      },
    ],
    agentRecommendation: {
      status: 'proceed',
      label: 'Assessment points to proceed',
      confidence: 94,
      rationale:
        'AI evaluation confirms high clinical validation maturity, active regional hospital deployments, and strong alignment with M42 strategic healthcare priorities.',
    },
    workflowStages: [
      { id: 1, title: 'Submission', subheading: '12 Oct 2026', status: 'completed' },
      { id: 2, title: 'Intake & Triage', subheading: 'Completed', status: 'completed' },
      { id: 3, title: 'Screening & Fit', subheading: 'In Progress', status: 'in_progress' },
      { id: 4, title: 'NDA & Discovery', subheading: 'Not Started', status: 'not_started' },
      { id: 5, title: 'Value Assessment', subheading: 'Not Started', status: 'not_started' },
      { id: 6, title: 'Due Diligence', subheading: 'Not Started', status: 'not_started' },
      { id: 7, title: 'Term Sheet & Pilot', subheading: 'Not Started', status: 'not_started' },
    ],
    overviewCards: {
      evidence: 'Clinical Validation Study',
      deployment: '10+ hospitals across UAE',
      regulatory: 'FDA / CE Mark',
      duplicateCheck: 'Clear',
    },
    sowDetails: {
      sowName: 'MedTech Innovations — AI-powered Diagnostic Platform',
      sowDeadline: '31/10/2026',
      tokenConsumption: '1200',
    },
    uploadedDocuments: [
      {
        id: 'doc-1',
        name: 'MedTech_Innovations_Diagnostic_RFP.pdf',
        size: '2.8 MB',
        type: 'APPLICATION/PDF',
      },
      {
        id: 'doc-2',
        name: 'Clinical_Validation_Whitepaper.pdf',
        size: '1.4 MB',
        type: 'APPLICATION/PDF',
      },
      {
        id: 'doc-3',
        name: 'Regulatory_Approval_Documentation.pdf',
        size: '920 KB',
        type: 'APPLICATION/PDF',
      },
    ],
    companyInfo: {
      name: 'Sarah Ahmed',
      jobTitle: 'Business Development Director',
      company: 'MedTech Innovations',
      phoneNumber: '+971 50 123 4567',
      email: 'sarah@medtechinnovations.com',
      yearFounded: '2018',
      location: 'UAE, Dubai',
    },
    assessmentAreas: {
      stageOfMaturityAndExperience:
        'MedTech Innovations is a growth-stage healthtech company with extensive experience in developing AI-powered diagnostic solutions. We have successfully launched our platform in multiple markets including the UAE, KSA, and the UK, and have partnerships with leading hospitals and research institutions.',
      growthJourneyAndRegionalExperience:
        'Proven regional rollout across private and public healthcare systems with over 150,000 scans interpreted to date.',
      milestones: [
        'Product launch in 2022',
        'Deployment in 10+ hospitals across UAE',
        'Strategic partnership with a leading global medical imaging provider',
        'Ongoing collaboration with academic institutions for clinical validation',
      ],
      proposalOfCollaboration:
        'Deploy our AI diagnostic platform across M42 hospitals and clinics for automated triage and early-stage chronic disease screening across radiology and oncology.',
      productPlatformServiceDetails:
        'Secure multi-modal diagnostic engine capable of processing DICOM imaging, pathology slides, and clinical telemetry with real-time accuracy scoring.',
      focusAreas: ['AI & Diagnostics', 'Medical Imaging', 'Clinical Decision Support'],
      solutionMaturityLevelAndRegulatory:
        'Operational pilot phase with clinical validation completed across 3 tertiary hospital networks.',
      relevantApprovals: 'FDA cleared, CE Mark approved, UAE MOHAP registered.',
      regulatoryApprovalList: ['FDA', 'CE', 'Not applicable'],
      noveltyAndDifferentiation:
        'Proprietary deep learning model trained on multi-ethnic clinical datasets achieving 96.4% diagnostic sensitivity, reducing false positives by 41%.',
      developmentApproach:
        'Internally Developed by specialized medical AI engineers and radiologists.',
      requestedM42Resources:
        'Clinical sandbox integration with M42 Epic EHR, pilot validation sites at Cleveland Clinic Abu Dhabi, and joint research publication.',
      impactedPatientPopulations: ['Adult Patients', 'Pediatric Patients'],
      clinicalAreas: ['Oncology', 'Radiology', 'Chronic Disease'],
    },
  },
  {
    id: 'req-002',
    requestCode: 'PR-123',
    vendorId: 'VND-009',
    caseType: 'Partnership',
    queue: 'director',
    daysInStage: 5,
    owner: 'Zaid Al Ali',
    slaStatus: 'At risk',
    auditLog: [
      {
        id: 'seed-1',
        title: 'Partnership request submitted',
        description: 'Vendor form received from AlphaHealth BioTech.',
        actor: 'Dr. Tariq Mansoor (Vendor)',
        kind: 'user',
        timestamp: '10 Oct 2026, 10:05 AM',
      },
      {
        id: 'req-002-brief-generated',
        title: 'Initial assessment brief generated',
        description: '7 checks run. 2 risks identified.',
        actor: 'Triage Agent',
        kind: 'agent',
        timestamp: '10 Oct 2026, 10:08 AM',
      },
      {
        id: 'req-002-risks-identified',
        title: 'Risks identified',
        description: 'Possible CoE backlog overlap and weak UAE regulatory readiness.',
        actor: 'Triage Agent',
        kind: 'critical',
        timestamp: '10 Oct 2026, 10:08 AM',
      },
      {
        id: 'seed-4',
        title: 'Routed as Partnership',
        description: 'Sent to the Director for review.',
        actor: 'Nadia Al-Farsi (Partnership Admin)',
        kind: 'approval',
        timestamp: '10 Oct 2026, 01:40 PM',
      },
      {
        id: 'seed-5',
        title: 'Approved to proceed',
        description: 'Documents and fit confirmed.',
        actor: 'Zaid Al Ali (Director)',
        kind: 'approval',
        timestamp: '11 Oct 2026, 09:20 AM',
      },
      {
        id: 'seed-6',
        title: 'Request sent to Internal Interest team',
        description: '5 reviewers asked to answer the questionnaire.',
        actor: 'Zaid Al Ali (Director)',
        kind: 'user',
        timestamp: '11 Oct 2026, 09:45 AM',
      },
      {
        id: 'seed-7',
        title: 'Internal Interest approved',
        description: 'Questionnaire answered with a proceed view.',
        actor: 'Mariam Al-Zaabi (Internal Interest)',
        kind: 'approval',
        timestamp: '12 Oct 2026, 02:15 PM',
      },
      {
        id: 'seed-8',
        title: 'Request sent to Strategy Team',
        description: '1 reviewer asked to review the pre-read summary.',
        actor: 'Zaid Al Ali (Director)',
        kind: 'user',
        timestamp: '12 Oct 2026, 03:00 PM',
      },
    ],
    sponsors: { lead: 'Riza Sayeed', co: [] },
    internalOutcome: { scenario: 'single' },
    sent: { internal: true, strategy: true },
    strategyTeamMembers: [SEED_STRATEGY_PENDING],
    // Waiting for Leena Thomas, so the Strategy Team has the whole review still to do
    stageApprovals: {
      internal: { status: 'approved', by: 'Mariam Al-Zaabi', date: 'Done' },
    },
    companyName: 'AlphaHealth BioTech',
    vendorName: 'Dr. Tariq Mansoor',
    referredBy: 'Ahmed Al Hosani',
    solution: 'CardioScan AI Diagnostic Platform',
    headline: 'CardioScan AI Diagnostic Platform',
    focusArea: 'Cardiology & Precision Health',
    solutionMaturity: 'Clinical Validation',
    status: 'In Progress',
    submittedOn: '10 Oct 2026',
    deadline: '24 Oct 2026',
    submittedRelative: '2 days ago',
    tags: ['Cardiology & Precision Health', 'Clinical Workflow Automation'],
    internalInterests: DEFAULT_INTERNAL_INTERESTS,
    notes: [
      {
        id: 'note-2-1',
        author: 'Triage Agent',
        role: 'AI agent',
        at: '2026-10-10T08:00:00Z',
        html: 'CardioScan AI reads ECG and echo studies to triage cardiac patients, aimed at cardiology outpatient pathways. <mark data-tone="positive">Internal Interest approved with a named lead sponsor.</mark> <mark data-tone="neutral">Overlap with the cardiology roadmap is still being checked by Strategy.</mark>',
      },
      {
        id: 'note-2-2',
        author: 'Zaid Al Ali',
        role: 'Director',
        at: '2026-10-11T08:45:00Z',
        html: '<mark data-tone="positive">Cardiology team keen to pilot.</mark> Waiting on the Strategy view before the NDA.',
      },
    ],
    agentRecommendation: {
      status: 'proceed',
      label: 'Assessment points to proceed',
      confidence: 88,
      rationale:
        'Demonstrated 94.2% diagnostic accuracy with strong primary care cardiovascular workflow alignment.',
    },
    workflowStages: [
      { id: 1, title: 'Submission', subheading: '10 Oct 2026', status: 'completed' },
      { id: 2, title: 'Intake & Triage', subheading: 'Completed', status: 'completed' },
      { id: 3, title: 'Screening & Fit', subheading: 'In Progress', status: 'in_progress' },
      { id: 4, title: 'NDA & Discovery', subheading: 'Not Started', status: 'not_started' },
      { id: 5, title: 'Value Assessment', subheading: 'Not Started', status: 'not_started' },
      { id: 6, title: 'Due Diligence', subheading: 'Not Started', status: 'not_started' },
      { id: 7, title: 'Term Sheet & Pilot', subheading: 'Not Started', status: 'not_started' },
    ],
    overviewCards: {
      evidence: 'Proof of concept',
      deployment: '1 live customer',
      regulatory: 'Unclear',
      duplicateCheck: 'Clear',
    },
    sowDetails: {
      sowName: 'AlphaHealth BioTech — CardioScan AI Diagnostic Platform',
      sowDeadline: '31/10/2026',
      tokenConsumption: '1200',
    },
    uploadedDocuments: [
      {
        id: 'doc-4',
        name: 'Digital_Transformation_RFP.pdf',
        size: '2.8 MB',
        type: 'APPLICATION/PDF',
      },
      {
        id: 'doc-5',
        name: 'Enterprise_Architecture_Specs.pdf',
        size: '1.4 MB',
        type: 'APPLICATION/PDF',
      },
      {
        id: 'doc-6',
        name: 'Workplace_Requirements_Matrix.pdf',
        size: '920 KB',
        type: 'APPLICATION/PDF',
      },
    ],
    companyInfo: {
      name: 'Dr. Tariq Mansoor',
      jobTitle: 'Chief Executive Officer & Founder',
      company: 'AlphaHealth BioTech',
      phoneNumber: '+971 50 234 5678',
      email: 'tariq.mansoor@alphahealth.ae',
      yearFounded: '2021',
      location: 'UAE, Abu Dhabi',
    },
    assessmentAreas: {
      stageOfMaturityAndExperience:
        'Series A stage clinical AI enterprise with 5 years of specialized algorithmic R&D across cardiovascular modalities.',
      growthJourneyAndRegionalExperience:
        'Launched pilot programs in 3 European academic medical centers in 2023. Established Abu Dhabi ADGM presence in 2025 and conducted retrospective validation on 14,000 regional ECG records.',
      milestones: [
        'Commercial beta launch in 2023',
        'Abu Dhabi ADGM entity setup in 2025',
        'Retrospective validation on 14,000 ECG datasets',
      ],
      proposalOfCollaboration:
        'Collaborate with M42 to integrate CardioScan AI into primary care and ambulatory cardiology pathways, enabling rapid automated detection of heart failure.',
      productPlatformServiceDetails:
        'Cloud-native and edge-deployable AI inference engine processing standard 12-lead ECG waveforms and echocardiography Doppler streams.',
      focusAreas: ['Cardiology & Precision Health', 'Clinical Workflow Automation'],
      solutionMaturityLevelAndRegulatory:
        'Demonstrated 94.2% diagnostic accuracy in retrospective multi-center trials.',
      relevantApprovals: 'ISO 13485 certified, CE Mark Stage 2 audit cleared.',
      regulatoryApprovalList: ['CE', 'ISO 13485', 'UAE MOHAP'],
      noveltyAndDifferentiation:
        'Proprietary transformer-based waveform interpretation with multi-lead cross-attention; achieves 38% reduction in false-positive referrals.',
      developmentApproach: 'Internally Developed by proprietary team',
      requestedM42Resources:
        'Clinical validation access within M42 hospital network, Epic EHR sandbox integration, and joint scientific publication sponsorship.',
      impactedPatientPopulations: ['Adult Patients', "Women's health"],
      clinicalAreas: ['Cardiology', 'Internal Medicine'],
    },
  },
  {
    id: 'req-003',
    requestCode: 'PR-122',
    vendorId: 'VND-010',
    caseType: 'Partnership',
    queue: 'director',
    daysInStage: 9,
    owner: 'Zaid Al Ali',
    slaStatus: 'Breached',
    auditLog: [
      {
        id: 'seed-1',
        title: 'Partnership request submitted',
        description: 'Vendor form received from GenomicX MENA FZ-LLC.',
        actor: 'Karim El-Sayed (Vendor)',
        kind: 'user',
        timestamp: '01 Oct 2026, 08:50 AM',
      },
      {
        id: 'req-003-brief-generated',
        title: 'Initial assessment brief generated',
        description: '7 checks run. Vendor is re-applying.',
        actor: 'Triage Agent',
        kind: 'agent',
        timestamp: '01 Oct 2026, 08:53 AM',
      },
      {
        id: 'seed-3',
        title: 'Re-applying vendor',
        description: 'Applied in March 2025 and was declined for lack of UAE data residency.',
        actor: 'Triage Agent',
        kind: 'critical',
        timestamp: '01 Oct 2026, 08:53 AM',
      },
      {
        id: 'seed-4',
        title: 'Routed as Partnership',
        description: 'Sent to the Director for review.',
        actor: 'Nadia Al-Farsi (Partnership Admin)',
        kind: 'approval',
        timestamp: '01 Oct 2026, 12:10 PM',
      },
      {
        id: 'seed-5',
        title: 'Approved to proceed',
        description: 'Strong evidence and Emirati Genome Program fit.',
        actor: 'Zaid Al Ali (Director)',
        kind: 'approval',
        timestamp: '02 Oct 2026, 10:00 AM',
      },
      {
        id: 'seed-6',
        title: 'Request sent to Internal Interest team',
        description: '5 reviewers asked to answer the questionnaire.',
        actor: 'Zaid Al Ali (Director)',
        kind: 'user',
        timestamp: '02 Oct 2026, 10:30 AM',
      },
      {
        id: 'seed-7',
        title: 'Internal Interest approved',
        description: 'Questionnaire answered with a proceed view.',
        actor: 'Mariam Al-Zaabi (Internal Interest)',
        kind: 'approval',
        timestamp: '04 Oct 2026, 11:45 AM',
      },
      {
        id: 'seed-8',
        title: 'Request sent to Strategy Team',
        description: '1 reviewer asked to review the pre-read summary.',
        actor: 'Zaid Al Ali (Director)',
        kind: 'user',
        timestamp: '04 Oct 2026, 12:20 PM',
      },
      {
        id: 'seed-9',
        title: 'Strategy Team approved',
        description: 'Proceed with a condition.',
        actor: 'Leena Thomas (Strategy Team)',
        kind: 'approval',
        timestamp: '06 Oct 2026, 03:10 PM',
      },
    ],
    sponsors: { lead: 'Parag Agarwal', co: ['Najla Al Mansoori'] },
    internalOutcome: { scenario: 'multiple' },
    nda: {
      versions: [
        {
          version: 1,
          signed: false,
          fileName: 'ADHDS_NDA_Execution_Form_v1.0.docx',
          uploadedOn: '13 Oct 2026',
          uploadedBy: 'Zaid Al Ali',
        },
        {
          version: 2,
          signed: true,
          fileName: 'GenomicX_Signed_NDA_v1.pdf',
          uploadedOn: '14 Oct 2026',
          uploadedBy: 'Zaid Al Ali',
        },
      ],
    },
    alignmentPackOn: '14 Oct 2026',
    discovery: {
      notes: [
        {
          name: 'Discovery_Call_Notes.docx',
          uploadedOn: '16 Oct 2026',
          uploadedBy: 'Parag Agarwal',
        },
      ],
      transcripts: [],
      recordings: [
        {
          name: 'Discovery_Call_Recording.mp4',
          uploadedOn: '16 Oct 2026',
          uploadedBy: 'Parag Agarwal',
        },
      ],
    },
    sent: { internal: true, strategy: true },
    strategyTeamMembers: [SEED_STRATEGY_REVIEW],
    stageApprovals: {
      internal: { status: 'approved', by: 'Mariam Al-Zaabi', date: 'Done' },
      strategy: { status: 'approved', by: 'Leena Thomas', date: 'Done' },
    },
    companyName: 'GenomicX MENA FZ-LLC',
    vendorName: 'Karim El-Sayed',
    referredBy: null,
    solution: 'Rare Disease Variant Interpreter',
    headline: 'Rare Disease Variant Interpreter',
    focusArea: 'Genomics & Oncology',
    solutionMaturity: 'Commercial',
    status: 'At Risk',
    submittedOn: '01 Oct 2026',
    deadline: '15 Oct 2026',
    submittedRelative: '11 days ago',
    tags: ['Genomics & Oncology', 'Precision Health & Diagnostics', 'Rare Diseases'],
    internalInterests: DEFAULT_INTERNAL_INTERESTS,
    notes: [
      {
        id: 'note-3-1',
        author: 'Triage Agent',
        role: 'AI agent',
        at: '2026-10-01T08:00:00Z',
        html: 'Rare disease variant interpreter that speeds up genomic reporting for clinical geneticists across the M42 network. <mark data-tone="positive">NDA signed and two sponsors assigned.</mark> <mark data-tone="critical">UAE data hosting and a local entity are conditions before go-live.</mark>',
      },
      {
        id: 'note-3-2',
        author: 'Zaid Al Ali',
        role: 'Director',
        at: '2026-10-03T10:10:00Z',
        html: '<mark data-tone="positive">NDA signed.</mark> Discovery call booked with the vendor and both sponsors.',
      },
      {
        id: 'note-3-3',
        author: 'Rashid Al-Nuaimi',
        role: 'Sponsor',
        at: '2026-10-06T14:30:00Z',
        html: '<mark data-tone="critical">Hosting must be in the UAE before any patient data is shared.</mark>',
      },
    ],
    agentRecommendation: {
      status: 'proceed',
      label: 'Assessment points to proceed',
      confidence: 96,
      rationale:
        'Mature clinical bioinformatics solution with direct synergy for Emirati Genome Program partnerships.',
    },
    workflowStages: [
      { id: 1, title: 'Submission', subheading: '01 Oct 2026', status: 'completed' },
      { id: 2, title: 'Intake & Triage', subheading: 'Completed', status: 'completed' },
      { id: 3, title: 'Screening & Fit', subheading: 'Completed', status: 'completed' },
      { id: 4, title: 'NDA & Discovery', subheading: 'In Progress', status: 'in_progress' },
      { id: 5, title: 'Value Assessment', subheading: 'Not Started', status: 'not_started' },
      { id: 6, title: 'Due Diligence', subheading: 'Not Started', status: 'not_started' },
      { id: 7, title: 'Term Sheet & Pilot', subheading: 'Not Started', status: 'not_started' },
    ],
    overviewCards: {
      evidence: 'Peer-reviewed Nature publication',
      deployment: '12 Tier-1 genomics centers',
      regulatory: 'FDA 510(k) Cleared',
      duplicateCheck: 'Clear',
    },
    sowDetails: {
      sowName: 'GenomicX MENA — Rare Disease Variant Interpreter',
      sowDeadline: '20/11/2026',
      tokenConsumption: '2100',
    },
    uploadedDocuments: [
      {
        id: 'doc-7',
        name: 'GenomicX_Validation_Study_Nature.pdf',
        size: '4.5 MB',
        type: 'APPLICATION/PDF',
      },
      {
        id: 'doc-8',
        name: 'FDA_510k_Clearance_Summary.pdf',
        size: '1.8 MB',
        type: 'APPLICATION/PDF',
      },
    ],
    companyInfo: {
      name: 'Karim El-Sayed',
      jobTitle: 'Chief Scientific Officer & Regional Director',
      company: 'GenomicX MENA FZ-LLC',
      phoneNumber: '+971 4 365 8900',
      email: 'karim.elsayed@genomicx.ae',
      yearFounded: '2018',
      location: 'UAE, Dubai',
    },
    assessmentAreas: {
      stageOfMaturityAndExperience:
        'Mature clinical bioinformatics provider specializing in whole-genome and exome sequencing analysis for hereditary and rare conditions.',
      growthJourneyAndRegionalExperience:
        'Established in Boston with EMEA headquarters in Dubai Science Park since 2021. Actively processing research cohorts for Middle Eastern population genetics.',
      milestones: [
        'Dubai Science Park hub opened in 2021',
        'Nature Genetics peer-reviewed paper in 2023',
        'Over 35,000 genomes processed',
      ],
      proposalOfCollaboration:
        'Direct pipeline integration with the Emirati Genome Program and M42 Omics Centre of Excellence.',
      productPlatformServiceDetails:
        'AI variant filtering and interpretation platform cross-referencing population-specific allele frequencies.',
      focusAreas: ['Genomics & Oncology', 'Precision Health & Diagnostics', 'Rare Diseases'],
      solutionMaturityLevelAndRegulatory:
        'Commercial platform cleared under FDA 510(k) and IVDR certified in the European Union.',
      relevantApprovals: 'FDA 510(k) Class II, CE-IVD, ISO 15189 compliance.',
      regulatoryApprovalList: ['FDA', 'CE', 'ISO 15189'],
      noveltyAndDifferentiation:
        'Contains the largest curated database of MENA-specific non-coding variants; reduces unclassified variants by 42%.',
      developmentApproach: 'Internally Developed with Harvard Medical School research affiliations',
      requestedM42Resources:
        'High-throughput sequencing pipeline integration, clinical geneticist pilot evaluation, and enterprise biobanking access.',
      impactedPatientPopulations: ['Adult Patients', 'Pediatric Patients', "Women's health"],
      clinicalAreas: ['Genomics', 'Pediatrics', 'Oncology'],
    },
  },
  {
    id: 'req-004',
    requestCode: 'PR-121',
    vendorId: 'VND-011',
    caseType: 'Partnership',
    queue: 'director',
    daysInStage: 2,
    owner: 'Zaid Al Ali',
    slaStatus: 'On track',
    auditLog: [
      {
        id: 'seed-1',
        title: 'Partnership request submitted',
        description: 'Vendor form received from CarePulse Technologies.',
        actor: 'Elena Rostova (Vendor)',
        kind: 'user',
        timestamp: '28 Sep 2026, 09:30 AM',
      },
      {
        id: 'req-004-brief-generated',
        title: 'Initial assessment brief generated',
        description: '7 checks run. 2 risks identified.',
        actor: 'Triage Agent',
        kind: 'agent',
        timestamp: '28 Sep 2026, 09:33 AM',
      },
      {
        id: 'req-004-risks-identified',
        title: 'Risks identified',
        description: 'Easy to replace and adverse media found.',
        actor: 'Triage Agent',
        kind: 'critical',
        timestamp: '28 Sep 2026, 09:33 AM',
      },
      {
        id: 'seed-4',
        title: 'Routed as Partnership',
        description: 'Sent to the Director for review.',
        actor: 'Nadia Al-Farsi (Partnership Admin)',
        kind: 'approval',
        timestamp: '28 Sep 2026, 02:00 PM',
      },
      {
        id: 'seed-5',
        title: 'Request rejected',
        description: 'Existing remote monitoring module can be extended at lower cost.',
        actor: 'Zaid Al Ali (Director)',
        kind: 'critical',
        timestamp: '05 Oct 2026, 11:00 AM',
      },
    ],
    companyName: 'CarePulse Technologies',
    vendorName: 'Elena Rostova',
    referredBy: 'Sponsor Office',
    solution: 'Remote Patient Monitoring & Triage',
    headline: 'Remote Patient Monitoring & Triage',
    focusArea: 'Virtual Care & Remote Monitoring',
    solutionMaturity: 'Commercial',
    status: 'Exited',
    submittedOn: '28 Sep 2026',
    deadline: '05 Oct 2026',
    submittedRelative: '14 days ago',
    tags: ['Virtual Care & Remote Monitoring', 'Clinical Workflow Automation'],
    internalInterests: DEFAULT_INTERNAL_INTERESTS,
    notes: [
      {
        id: 'note-4-1',
        author: 'Triage Agent',
        role: 'AI agent',
        at: '2026-09-28T08:00:00Z',
        html: 'Remote patient monitoring with automated triage for patients discharged after cardiac and respiratory admissions. <mark data-tone="critical">Rejected: the existing remote monitoring module can be extended at lower cost.</mark>',
      },
      {
        id: 'note-4-2',
        author: 'Zaid Al Ali',
        role: 'Director',
        at: '2026-09-29T09:00:00Z',
        html: 'Closed. <mark data-tone="neutral">Shared with the remote monitoring team for their roadmap.</mark>',
      },
    ],
    agentRecommendation: {
      status: 'proceed',
      label: 'Assessment points to proceed',
      confidence: 91,
      rationale:
        'Established regional footprint with 25,000+ active chronic care patients and DoH licensure.',
    },
    workflowStages: [
      { id: 1, title: 'Submission', subheading: '28 Sep 2026', status: 'completed' },
      { id: 2, title: 'Intake & Triage', subheading: 'Completed', status: 'completed' },
      { id: 3, title: 'Screening & Fit', subheading: 'In Progress', status: 'in_progress' },
      { id: 4, title: 'NDA & Discovery', subheading: 'Not Started', status: 'not_started' },
      { id: 5, title: 'Value Assessment', subheading: 'Not Started', status: 'not_started' },
      { id: 6, title: 'Due Diligence', subheading: 'Not Started', status: 'not_started' },
      { id: 7, title: 'Term Sheet & Pilot', subheading: 'Not Started', status: 'not_started' },
    ],
    overviewCards: {
      evidence: 'Real-world evidence study',
      deployment: '3 UAE health clusters',
      regulatory: 'DoH Abu Dhabi Approved',
      duplicateCheck: 'Clear',
    },
    sowDetails: {
      sowName: 'CarePulse Technologies — Remote Patient Monitoring & Triage',
      sowDeadline: '10/11/2026',
      tokenConsumption: '950',
    },
    uploadedDocuments: [
      {
        id: 'doc-10',
        name: 'CarePulse_RPM_Clinical_Outcomes.pdf',
        size: '2.4 MB',
        type: 'APPLICATION/PDF',
      },
    ],
    companyInfo: {
      name: 'Elena Rostova',
      jobTitle: 'Head of Strategic Alliances',
      company: 'CarePulse Technologies',
      phoneNumber: '+971 52 876 5432',
      email: 'elena.rostova@carepulse.io',
      yearFounded: '2020',
      location: 'UAE, Dubai',
    },
    assessmentAreas: {
      stageOfMaturityAndExperience:
        'Commercial scale RPM platform currently managing over 25,000 active chronic disease patients across the UAE.',
      growthJourneyAndRegionalExperience:
        'Bootstrapped to initial UAE traction in 2020, secured DoH telehealth licensure in 2022.',
      milestones: [
        'DoH telehealth license in 2022',
        'Active care for 25,000+ chronic disease patients',
      ],
      proposalOfCollaboration:
        'Integrate CarePulse RPM with M42 virtual health centers for post-discharge chronic disease care.',
      productPlatformServiceDetails:
        'Cellular-enabled connected devices coupled with an AI clinical escalation dashboard.',
      focusAreas: ['Virtual Care & Remote Monitoring', 'Preventative Healthcare'],
      solutionMaturityLevelAndRegulatory:
        'Fully commercialized with Department of Health Abu Dhabi telemedicine authorization.',
      relevantApprovals: 'DoH Abu Dhabi Telehealth License, CE Mark Class I, ISO 27001.',
      regulatoryApprovalList: ['DoH Abu Dhabi', 'CE'],
      noveltyAndDifferentiation:
        'Zero-pairing cellular hub requiring no patient smartphone or Wi-Fi setup.',
      developmentApproach: 'Internally Developed hardware firmware with AWS infrastructure',
      requestedM42Resources:
        'Formal partnership with M42 Ambulatory Healthcare Services and joint clinical pathways.',
      impactedPatientPopulations: ['Adult Patients', "Women's health"],
      clinicalAreas: ['Chronic Care', 'Virtual Health'],
    },
  },
  {
    id: 'req-005',
    requestCode: 'PR-125',
    vendorId: 'VND-012',
    caseType: undefined,
    queue: 'admin',
    daysInStage: 1,
    owner: 'Nadia Al-Farsi',
    slaStatus: 'On track',
    auditLog: [
      {
        id: 'seed-1',
        title: 'Partnership request submitted',
        description: 'Vendor form received from NeuroLink Diagnostics.',
        actor: 'Dr. Layla Haddad (Vendor)',
        kind: 'user',
        timestamp: '20 Oct 2026, 04:20 PM',
      },
    ],
    companyName: 'NeuroLink Diagnostics',
    vendorName: 'Dr. Layla Haddad',
    referredBy: null,
    solution: 'EEG-based seizure detection and monitoring platform',
    headline: 'EEG-based seizure detection and monitoring platform',
    focusArea: 'Neurology & Digital Health',
    solutionMaturity: 'Clinical Validation',
    status: 'Pending',
    submittedOn: '20 Oct 2026',
    deadline: '03 Nov 2026',
    submittedRelative: '2 days ago',
    tags: ['Neurology & Digital Health', 'AI & Diagnostics'],
    internalInterests: DEFAULT_INTERNAL_INTERESTS,
    notes: [
      {
        id: 'note-5-1',
        author: 'Triage Agent',
        role: 'AI agent',
        at: '2026-10-20T08:00:00Z',
        html: 'EEG-based platform that detects and monitors seizures, proposed for neurology wards and home monitoring. <mark data-tone="positive">Fills a gap in the neurology portfolio.</mark> <mark data-tone="neutral">Regulatory status for the UAE is not yet clear.</mark>',
      },
      {
        id: 'note-5-2',
        author: 'Nadia Al-Farsi',
        role: 'Partnership Admin',
        at: '2026-10-21T12:15:00Z',
        html: '<mark data-tone="critical">Ask for the UAE regulatory plan</mark> before routing.',
      },
    ],
    agentRecommendation: {
      status: 'proceed',
      label: 'Assessment points to proceed',
      confidence: 84,
      rationale:
        'Validated seizure detection accuracy in two European centres and a clear fit with M42 neurology and digital health priorities.',
    },
    workflowStages: [
      { id: 1, title: 'Submission', subheading: '20 Oct 2026', status: 'completed' },
      { id: 2, title: 'Intake & Triage', subheading: 'In Progress', status: 'in_progress' },
      { id: 3, title: 'Screening & Fit', subheading: 'Not Started', status: 'not_started' },
      { id: 4, title: 'NDA & Discovery', subheading: 'Not Started', status: 'not_started' },
      { id: 5, title: 'Value Assessment', subheading: 'Not Started', status: 'not_started' },
      { id: 6, title: 'Due Diligence', subheading: 'Not Started', status: 'not_started' },
      { id: 7, title: 'Term Sheet & Pilot', subheading: 'Not Started', status: 'not_started' },
    ],
    overviewCards: {
      evidence: 'Two-centre clinical validation',
      deployment: '2 European hospitals',
      regulatory: 'CE Mark approved',
      duplicateCheck: 'Clear',
    },
    sowDetails: {
      sowName: 'NeuroLink Diagnostics — EEG Seizure Detection Platform',
      sowDeadline: '03/11/2026',
      tokenConsumption: '900',
    },
    uploadedDocuments: [
      {
        id: 'doc-11',
        name: 'NeuroLink_Clinical_Validation.pdf',
        size: '2.1 MB',
        type: 'APPLICATION/PDF',
      },
    ],
    companyInfo: {
      name: 'Dr. Layla Haddad',
      jobTitle: 'Chief Medical Officer',
      company: 'NeuroLink Diagnostics',
      phoneNumber: '+971 55 301 2244',
      email: 'layla.haddad@neurolink.health',
      yearFounded: '2020',
      location: 'UAE, Abu Dhabi',
    },
    assessmentAreas: {
      stageOfMaturityAndExperience:
        'Clinical-stage neurotechnology company with an EEG analytics platform validated in two European epilepsy centres.',
      growthJourneyAndRegionalExperience:
        'Opened an Abu Dhabi office in 2025 and started conversations with two local neurology clinics.',
      milestones: [
        'CE Mark in 2024',
        'Validation study in two European centres',
        'Abu Dhabi office opened in 2025',
      ],
      proposalOfCollaboration:
        'Pilot continuous EEG seizure detection in M42 neurology wards and extend it to home monitoring for epilepsy patients.',
      productPlatformServiceDetails:
        'Cloud EEG analytics platform that flags seizure events in real time and prioritises clinician review.',
      focusAreas: ['Neurology & Digital Health', 'AI & Diagnostics'],
      solutionMaturityLevelAndRegulatory:
        'Clinically validated in two centres. CE Mark approved. Preparing a UAE MOHAP submission.',
      relevantApprovals: 'CE Mark approved, ISO 13485 certified, UAE MOHAP in progress.',
      regulatoryApprovalList: ['CE', 'ISO 13485', 'UAE MOHAP'],
      noveltyAndDifferentiation:
        'Detects seizures with 93% sensitivity and cuts clinician review time by 60% using a patient-specific model.',
      developmentApproach: 'Internally developed with clinical research partners',
      requestedM42Resources:
        'Neurology ward pilot sites, de-identified EEG data access, and integration with the M42 EHR.',
      impactedPatientPopulations: ['Adult Patients', 'Pediatric Patients'],
      clinicalAreas: ['Neurology', 'Epilepsy'],
    },
  },
]
