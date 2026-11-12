import { formatTimestamp } from '@/lib/caseActions'
import type { AuditEvent, AuditKind } from '@/types/partnership.types'

/**
 * Partnership request form configuration: the versions the TDD admin edits and publishes, and the
 * helpers that create drafts and describe what changed. The seed mirrors the vendor web form.
 */

export type AnswerType = 'short' | 'long' | 'dropdown' | 'multi'

export const ANSWER_TYPE_LABELS: Record<AnswerType, string> = {
  short: 'Short text',
  long: 'Long text',
  dropdown: 'Dropdown',
  multi: 'Multi-select',
}

export const isChoiceType = (type: AnswerType) => type === 'dropdown' || type === 'multi'

export interface FormQuestion {
  id: string
  label: string
  helper: string
  placeholder: string
  type: AnswerType
  /** The choices of a dropdown or multi-select */
  options: string[]
  required: boolean
  /** Whether vendors see the question; a hidden one stays in the list, greyed out */
  visible: boolean
  /** Whether the vendor's "Run AI check" reviews this answer */
  aiCheck: boolean
  /** The "Q for AI": only the AI check reads it, vendors never see it */
  aiGuidance: string
}

export type CompanyFieldKey =
  | 'vendorId'
  | 'vendorName'
  | 'jobTitle'
  | 'companyName'
  | 'phone'
  | 'email'
  | 'yearFounded'
  | 'website'
  | 'country'

export interface CompanyField {
  key: CompanyFieldKey
  label: string
  helper?: string
  visible: boolean
  required: boolean
  /** Always shown and required: they create the vendor record and enforce the AI check limits */
  locked?: boolean
  /** Can never be required (the Vendor ID is empty on a first request) */
  neverRequired?: boolean
}

export type VersionStatus = 'draft' | 'live' | 'archived'

/** The workflows a request form can belong to */
export const FORM_WORKFLOWS = ['Partnership', 'Procure', 'M&A'] as const
export type FormWorkflow = (typeof FORM_WORKFLOWS)[number]

/** A group of input fields that the admin creates on a form started from scratch */
export interface FormSection {
  id: string
  title: string
  questions: FormQuestion[]
}

export interface FormVersion {
  id: string
  number: number
  status: VersionStatus
  /** What the admin said they were changing; shown in the version list */
  note: string
  publishedAt?: string
  editedAt: string
  /** Requests submitted on this version */
  requests: number
  workflow: FormWorkflow
  /**
   * standard: the fixed company fields and the key assessment questions.
   * custom: a form started from a blank page, made only of the sections the admin creates.
   */
  layout: 'standard' | 'custom'
  companyFields: CompanyField[]
  questions: FormQuestion[]
  /** The sections of a custom form */
  sections: FormSection[]
  /** Everything done to this version, oldest first */
  auditLog: AuditEvent[]
}

/** The admin the audit log names (the prototype has one TDD Admin) */
export const FORM_ACTOR = 'TDD Admin'

let auditCounter = 0
export const makeAudit = (
  title: string,
  description: string,
  kind: AuditKind = 'user'
): AuditEvent => ({
  id: `fa-${Date.now().toString(36)}-${auditCounter++}`,
  title,
  description,
  actor: FORM_ACTOR,
  kind,
  timestamp: formatTimestamp(),
})

export const AI_CHECKS_TODAY = { used: 5, limit: 300, perVendor: 3 }

let idCounter = 0
export const newQuestionId = () => `q-${Date.now().toString(36)}-${idCounter++}`

export const formatDate = (date: Date = new Date()) =>
  date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

const DEFAULT_COMPANY_FIELDS: CompanyField[] = [
  {
    key: 'vendorId',
    label: 'Vendor ID (if a request was raised before)',
    helper: 'Leave empty if this is your first request.',
    visible: true,
    required: false,
    neverRequired: true,
  },
  { key: 'vendorName', label: 'Vendor Name', visible: true, required: true },
  { key: 'jobTitle', label: 'Job Title', visible: true, required: true },
  { key: 'companyName', label: 'Company Name', visible: true, required: true, locked: true },
  { key: 'phone', label: 'Phone Number', visible: true, required: false },
  { key: 'email', label: 'Email Address', visible: true, required: true, locked: true },
  { key: 'yearFounded', label: 'Year Company Was Founded', visible: true, required: true },
  { key: 'website', label: 'Website URL', visible: true, required: true, locked: true },
  { key: 'country', label: 'Country', visible: true, required: true, locked: true },
]

export const defaultCompanyFields = (): CompanyField[] =>
  DEFAULT_COMPANY_FIELDS.map((field) => ({ ...field }))

const text = (
  id: string,
  type: 'short' | 'long',
  label: string,
  helper: string,
  placeholder: string,
  aiGuidance: string
): FormQuestion => ({
  id,
  label,
  helper,
  placeholder,
  type,
  options: [],
  required: true,
  visible: true,
  aiCheck: true,
  aiGuidance,
})

const seedQuestions = (): FormQuestion[] => [
  text(
    'q-stage',
    'long',
    "How would you describe your company's stage of maturity and experience?",
    "Company's growth journey and regional experience. Include relevant milestones such as product launches, market entries or partnerships in UAE or other healthcare systems.",
    'Describe your journey, regional experience and key milestones...',
    'Look for dated milestones and named healthcare systems, not general claims.'
  ),
  text(
    'q-proposal',
    'long',
    'Briefly describe your proposal of collaboration.',
    'Details about the product, platform or service you are submitting for consideration.',
    'What are you proposing, and what would M42 do with you?',
    'The answer should name the product and what M42 would do with it.'
  ),
  {
    id: 'q-focus',
    label: 'Which Focus Area does your solution address?',
    helper:
      'Select the primary area your solution addresses. These focus areas align with M42 transformation and innovation priorities. Select all that apply.',
    placeholder: '',
    type: 'multi',
    options: [
      'AI & Diagnostics',
      'Medical Imaging',
      'Clinical Decision Support',
      'Cardiology & Precision Health',
      'Clinical Workflow Automation',
      'Genomics & Oncology',
      'Precision Health & Diagnostics',
      'Rare Diseases',
      'Virtual Care & Remote Monitoring',
      'Preventative Healthcare',
      'Neurology & Digital Health',
    ],
    required: true,
    visible: true,
    aiCheck: false,
    aiGuidance: '',
  },
  text(
    'q-maturity',
    'long',
    'What is the current maturity level of your solution and have you secured any regulatory approvals or certifications (if applicable)?',
    "Briefly describe the solution's current stage of maturity, any deployments to date and regulatory clearances obtained (e.g. CE, FDA, DoH Abu Dhabi).",
    'Maturity, deployments to date and clearances obtained...',
    'Flag answers that claim approvals without naming the regulator.'
  ),
  text(
    'q-approvals',
    'short',
    'Please list any relevant approvals (e.g. CE, FDA, ISO, UAE MOHAP, DOH) or state "Not applicable."',
    '',
    'e.g. CE Mark, FDA cleared, ISO 13485',
    'Accept a list of approvals or "Not applicable".'
  ),
  text(
    'q-novelty',
    'long',
    'How novel or differentiated is your solution compared to others in the market?',
    'Assess the innovation potential, uniqueness and whether the solution brings new intellectual property or care modules to M42.',
    'What sets it apart from alternatives?',
    'Look for a comparison with named alternatives.'
  ),
  {
    id: 'q-development',
    label:
      'If applicable, was the solution developed entirely by your team or in collaboration with external partners?',
    helper:
      'Understand whether the solution was developed internally, co-developed with partners or built using third-party technologies or platforms. Indicate the primary development approach.',
    placeholder: '',
    type: 'dropdown',
    options: [
      'Developed entirely by our team',
      'Co-developed with external partners',
      'Built on third-party technologies or platforms',
    ],
    required: false,
    visible: true,
    aiCheck: false,
    aiGuidance: '',
  },
  text(
    'q-resources',
    'long',
    'What specific resources, input, or partnerships are you seeking from M42?',
    'Outline the type of support expected, such as data, access, clinical collaboration, technical integration, funding or pilot sites.',
    'The support you expect from M42...',
    'The answer should say what kind of support and for how long.'
  ),
  {
    id: 'q-populations',
    label:
      'If applicable, which patient populations, clinical areas, or operational workflows will be impacted?',
    helper:
      'Identify who or what will be directly affected by your solution (patients, clinical teams, care pathways or administrative workflows) to help assess relevance and scope.',
    placeholder: '',
    type: 'multi',
    options: ['Adult patients', 'Pediatric patients', "Women's health"],
    required: false,
    visible: true,
    aiCheck: false,
    aiGuidance: '',
  },
]

export const seedFormVersions = (): FormVersion[] => [
  {
    id: 'fv-2',
    number: 2,
    status: 'live',
    note: '',
    publishedAt: '6 Nov 2026',
    editedAt: '6 Nov 2026',
    requests: 1,
    workflow: 'Partnership',
    layout: 'standard',
    companyFields: defaultCompanyFields(),
    questions: seedQuestions(),
    sections: [],
    auditLog: [
      {
        id: 'fa-seed-2',
        title: 'Version 2 published',
        description: 'Version 2 became the form vendors see. Version 1 was archived.',
        actor: FORM_ACTOR,
        kind: 'approval',
        timestamp: '6 Nov 2026, 11:20 AM',
      },
    ],
  },
  {
    id: 'fv-1',
    number: 1,
    status: 'archived',
    note: 'Initial form',
    publishedAt: '6 Nov 2026',
    editedAt: '6 Nov 2026',
    requests: 1,
    workflow: 'Partnership',
    layout: 'standard',
    companyFields: defaultCompanyFields(),
    questions: seedQuestions(),
    sections: [],
    auditLog: [
      {
        id: 'fa-seed-1',
        title: 'Version 1 published',
        description: 'The first version of the partnership request form went live.',
        actor: FORM_ACTOR,
        kind: 'approval',
        timestamp: '6 Nov 2026, 09:05 AM',
      },
    ],
  },
]

export const blankQuestion = (): FormQuestion => ({
  id: newQuestionId(),
  label: '',
  helper: '',
  placeholder: '',
  type: 'short',
  options: [],
  required: false,
  visible: true,
  aiCheck: false,
  aiGuidance: '',
})

export const countRequired = (version: Pick<FormVersion, 'questions'>) =>
  version.questions.filter((q) => q.required).length

export const countAiChecked = (version: Pick<FormVersion, 'questions'>) =>
  version.questions.filter((q) => q.aiCheck).length

export type DraftSource = 'live' | 'older' | 'blank'

export const newSection = (title: string): FormSection => ({
  id: `s-${Date.now().toString(36)}-${idCounter++}`,
  title,
  questions: [],
})

/** How many questions a version asks, in whichever layout it has */
export const totalQuestions = (v: Pick<FormVersion, 'layout' | 'questions' | 'sections'>) =>
  v.layout === 'custom'
    ? v.sections.reduce((sum, section) => sum + section.questions.length, 0)
    : v.questions.length

const cloneQuestion = (q: FormQuestion): FormQuestion => ({ ...q, options: [...q.options] })

/**
 * A new draft numbered after the highest version of the same workflow, started from a version
 * or, with source "blank", from an empty page: no company fields, no questions, no sections.
 */
export const createDraft = (
  versions: FormVersion[],
  source: DraftSource,
  fromVersionId: string | undefined,
  note: string,
  workflow: FormWorkflow = 'Partnership'
): FormVersion => {
  const sameWorkflow = versions.filter((v) => v.workflow === workflow)
  const from =
    source === 'live'
      ? sameWorkflow.find((v) => v.status === 'live')
      : source === 'older'
        ? versions.find((v) => v.id === fromVersionId)
        : undefined
  const custom = source === 'blank' || from?.layout === 'custom'
  return {
    id: `fv-${Date.now().toString(36)}-${idCounter++}`,
    number: Math.max(0, ...sameWorkflow.map((v) => v.number)) + 1,
    status: 'draft',
    note: note.trim(),
    editedAt: formatDate(),
    requests: 0,
    workflow,
    layout: custom ? 'custom' : 'standard',
    // Question IDs carry over so the draft can be compared with the live version
    companyFields: custom
      ? []
      : (from?.companyFields ?? defaultCompanyFields()).map((f) => ({ ...f })),
    questions: custom ? [] : (from?.questions ?? []).map(cloneQuestion),
    sections: custom
      ? (from?.sections ?? []).map((s) => ({ ...s, questions: s.questions.map(cloneQuestion) }))
      : [],
    auditLog: [
      makeAudit(
        'Draft created',
        `${
          from
            ? `Started from Version ${from.number}`
            : `Started from a blank ${workflow} form, with no sections yet`
        }${note.trim() ? `. Reason: ${note.trim()}` : '.'}`
      ),
    ],
  }
}

const clip = (value: string) => (value.length > 48 ? `${value.slice(0, 45).trimEnd()}...` : value)

const sameQuestion = (a: FormQuestion, b: FormQuestion) =>
  a.label === b.label &&
  a.helper === b.helper &&
  a.placeholder === b.placeholder &&
  a.type === b.type &&
  a.required === b.required &&
  a.visible === b.visible &&
  a.aiCheck === b.aiCheck &&
  a.aiGuidance === b.aiGuidance &&
  a.options.join('\n') === b.options.join('\n')

/** What publishing the draft would change for vendors, compared with the live version */
export const describeChanges = (live: FormVersion | undefined, draft: FormVersion): string[] => {
  if (draft.layout === 'custom') return describeCustomChanges(live, draft)
  const baseFields = live?.companyFields ?? defaultCompanyFields()
  const baseQuestions = live?.questions ?? []
  const changes: string[] = []

  draft.companyFields.forEach((field) => {
    const before = baseFields.find((f) => f.key === field.key)
    if (!before) return
    if (before.label !== field.label) {
      changes.push(`Renamed "${clip(before.label)}" to "${clip(field.label)}"`)
    }
    if (before.visible !== field.visible) {
      changes.push(`${clip(field.label)} is now ${field.visible ? 'shown' : 'hidden'}`)
    }
    if (before.required !== field.required) {
      changes.push(`${clip(field.label)} is now ${field.required ? 'required' : 'optional'}`)
    }
  })

  draft.questions.forEach((q) => {
    const before = baseQuestions.find((b) => b.id === q.id)
    if (!before) changes.push(`Added "${clip(q.label)}"`)
    else if (!sameQuestion(before, q)) changes.push(`Edited "${clip(q.label)}"`)
  })
  baseQuestions.forEach((b) => {
    if (!draft.questions.some((q) => q.id === b.id)) changes.push(`Removed "${clip(b.label)}"`)
  })

  const kept = (list: FormQuestion[], other: FormQuestion[]) =>
    list.filter((q) => other.some((o) => o.id === q.id)).map((q) => q.id)
  if (kept(baseQuestions, draft.questions).join() !== kept(draft.questions, baseQuestions).join()) {
    changes.push('Changed the order of the questions')
  }
  return changes
}

/** Why a question cannot be saved yet, if so */
export const validateQuestion = (q: FormQuestion): { label?: string; options?: string } => {
  const errors: { label?: string; options?: string } = {}
  if (!q.label.trim()) errors.label = 'Enter the question vendors will see.'
  if (isChoiceType(q.type) && q.options.filter((o) => o.trim()).length < 2) {
    errors.options = 'Add at least two options to choose from.'
  }
  return errors
}

/** What changed between two versions of one question, for the audit log */
export const describeQuestionEdit = (before: FormQuestion, after: FormQuestion): string[] => {
  const changes: string[] = []
  if (before.label !== after.label) changes.push('the question')
  if (before.helper !== after.helper) changes.push('the help text')
  if (before.type !== after.type)
    changes.push(`the answer type (now ${ANSWER_TYPE_LABELS[after.type]})`)
  if (before.options.join('\n') !== after.options.join('\n')) changes.push('the options')
  if (before.placeholder !== after.placeholder) changes.push('the placeholder')
  if (before.required !== after.required)
    changes.push(after.required ? 'now required' : 'now optional')
  if (before.visible !== after.visible) changes.push(after.visible ? 'now shown' : 'now hidden')
  if (before.aiCheck !== after.aiCheck) changes.push(after.aiCheck ? 'AI check on' : 'AI check off')
  if (before.aiGuidance !== after.aiGuidance) changes.push('the AI guidance')
  return changes
}

/** What changed on one company field, for the audit log */
export const describeFieldEdit = (before: CompanyField, after: CompanyField): string[] => {
  const changes: string[] = []
  if (before.label !== after.label) changes.push(`renamed from "${before.label}"`)
  if ((before.helper ?? '') !== (after.helper ?? '')) changes.push('the help text')
  if (before.visible !== after.visible) changes.push(after.visible ? 'now shown' : 'now hidden')
  if (before.required !== after.required)
    changes.push(after.required ? 'now required' : 'now optional')
  return changes
}

/** What publishing a custom form would change, section by section */
const describeCustomChanges = (live: FormVersion | undefined, draft: FormVersion): string[] => {
  const changes: string[] = []
  const base = live?.layout === 'custom' ? live.sections : []
  if (live && live.layout !== 'custom')
    changes.push('Replaced the standard form with a custom form')
  draft.sections.forEach((section) => {
    const before = base.find((b) => b.id === section.id)
    if (!before) {
      changes.push(`Added the section "${clip(section.title)}"`)
      return
    }
    if (before.title !== section.title) {
      changes.push(`Renamed the section "${clip(before.title)}" to "${clip(section.title)}"`)
    }
    section.questions.forEach((q) => {
      const old = before.questions.find((b) => b.id === q.id)
      if (!old) changes.push(`Added "${clip(q.label)}" to "${clip(section.title)}"`)
      else if (!sameQuestion(old, q)) changes.push(`Edited "${clip(q.label)}"`)
    })
    before.questions.forEach((b) => {
      if (!section.questions.some((q) => q.id === b.id)) changes.push(`Removed "${clip(b.label)}"`)
    })
    if (before.questions.map((q) => q.id).join() !== section.questions.map((q) => q.id).join()) {
      changes.push(`Changed the order of the questions in "${clip(section.title)}"`)
    }
  })
  base.forEach((b) => {
    if (!draft.sections.some((s) => s.id === b.id))
      changes.push(`Removed the section "${clip(b.title)}"`)
  })
  return changes
}
