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
  companyFields: CompanyField[]
  questions: FormQuestion[]
}

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
    companyFields: defaultCompanyFields(),
    questions: seedQuestions(),
  },
  {
    id: 'fv-1',
    number: 1,
    status: 'archived',
    note: 'Initial form',
    publishedAt: '6 Nov 2026',
    editedAt: '6 Nov 2026',
    requests: 1,
    companyFields: defaultCompanyFields(),
    questions: seedQuestions(),
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
  aiCheck: false,
  aiGuidance: '',
})

export const countRequired = (version: Pick<FormVersion, 'questions'>) =>
  version.questions.filter((q) => q.required).length

export const countAiChecked = (version: Pick<FormVersion, 'questions'>) =>
  version.questions.filter((q) => q.aiCheck).length

export type DraftSource = 'live' | 'older' | 'blank'

/** A new draft numbered after the highest version, started from a version or a blank form */
export const createDraft = (
  versions: FormVersion[],
  source: DraftSource,
  fromVersionId: string | undefined,
  note: string
): FormVersion => {
  const from =
    source === 'live'
      ? versions.find((v) => v.status === 'live')
      : source === 'older'
        ? versions.find((v) => v.id === fromVersionId)
        : undefined
  // Question IDs carry over so the draft can be compared with the live version
  const questions = (from?.questions ?? []).map((q) => ({ ...q, options: [...q.options] }))
  return {
    id: `fv-${Date.now().toString(36)}`,
    number: Math.max(0, ...versions.map((v) => v.number)) + 1,
    status: 'draft',
    note: note.trim(),
    editedAt: formatDate(),
    requests: 0,
    companyFields: (from?.companyFields ?? defaultCompanyFields()).map((f) => ({ ...f })),
    questions,
  }
}

const clip = (value: string) => (value.length > 48 ? `${value.slice(0, 45).trimEnd()}...` : value)

const sameQuestion = (a: FormQuestion, b: FormQuestion) =>
  a.label === b.label &&
  a.helper === b.helper &&
  a.placeholder === b.placeholder &&
  a.type === b.type &&
  a.required === b.required &&
  a.aiCheck === b.aiCheck &&
  a.aiGuidance === b.aiGuidance &&
  a.options.join('\n') === b.options.join('\n')

/** What publishing the draft would change for vendors, compared with the live version */
export const describeChanges = (live: FormVersion | undefined, draft: FormVersion): string[] => {
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
