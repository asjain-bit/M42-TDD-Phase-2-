export interface VendorFormValues {
  name: string
  jobTitle: string
  company: string
  /** Optional: VND-123, when the vendor raised a request before */
  vendorId: string
  phone: string
  email: string
  yearFounded: string
  website: string
  country: string
  stageAndExperience: string
  proposal: string
  focusAreas: string[]
  maturityAndRegulatory: string
  relevantApprovals: string
  novelty: string
  developmentApproach: string
  resources: string
  populations: string[]
}

export const EMPTY_VENDOR_FORM: VendorFormValues = {
  name: '',
  jobTitle: '',
  company: '',
  vendorId: '',
  phone: '',
  email: '',
  yearFounded: '',
  website: '',
  country: '',
  stageAndExperience: '',
  proposal: '',
  focusAreas: [],
  maturityAndRegulatory: '',
  relevantApprovals: '',
  novelty: '',
  developmentApproach: '',
  resources: '',
  populations: [],
}

export const FOCUS_AREA_OPTIONS = [
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
]

export const DEVELOPMENT_APPROACH_OPTIONS = [
  'Developed entirely by our team',
  'Co-developed with external partners',
  'Built on third-party technologies or platforms',
]

export const POPULATION_OPTIONS = ['Adult patients', 'Pediatric patients', "Women's health"]

/** Fields that must be filled before the form can be submitted */
export const REQUIRED_VENDOR_FIELDS: (keyof VendorFormValues)[] = [
  'name',
  'jobTitle',
  'company',
  'email',
  'yearFounded',
  'website',
  'country',
  'stageAndExperience',
  'proposal',
  'focusAreas',
  'maturityAndRegulatory',
  'relevantApprovals',
  'novelty',
  'resources',
]

export const isFieldFilled = (values: VendorFormValues, field: keyof VendorFormValues) => {
  const v = values[field]
  return Array.isArray(v) ? v.length > 0 : v.trim().length > 0
}

/** A Vendor ID is optional; when given it reads VND- and digits */
export const isVendorIdValid = (value: string) =>
  value.trim() === '' || /^VND-\d+$/i.test(value.trim())

export const missingVendorFields = (values: VendorFormValues) =>
  REQUIRED_VENDOR_FIELDS.filter((f) => !isFieldFilled(values, f))

/** What a vendor would typically fill in. Used to prefill the prototype form on first click. */
export const SAMPLE_VENDOR_FORM: VendorFormValues = {
  name: 'Dr. Rania Al Mansoori',
  jobTitle: 'Chief Executive Officer',
  company: 'Meridian Health AI',
  // Left empty: the sample is a first request
  vendorId: '',
  phone: '+971 50 987 6543',
  email: 'rania@meridianhealth.ai',
  yearFounded: '2019',
  website: 'https://www.meridianhealth.ai',
  country: 'United Arab Emirates',
  stageAndExperience:
    'Founded in 2019, we launched our clinical triage platform in 2022 and now serve 14 hospitals across the UK and Saudi Arabia. We opened a Dubai office in 2024 and completed a joint pilot with a large UAE hospital group in 2025.',
  proposal:
    'We propose to deploy our triage platform in M42 emergency departments, starting with two sites in Abu Dhabi, and expand across the network after a six month pilot with agreed clinical outcome measures.',
  focusAreas: ['AI & Diagnostics', 'Clinical Workflow Automation'],
  maturityAndRegulatory:
    'The platform is live in 14 hospitals and has completed a clinical validation study. It holds CE Mark and ISO 13485 certification, and our DoH Abu Dhabi registration is in progress.',
  relevantApprovals: 'CE Mark, ISO 13485, DoH Abu Dhabi (in progress)',
  novelty: 'Our model is more accurate than existing triage tools and needs less data to set up.',
  developmentApproach: 'Developed entirely by our team',
  resources: 'Pilot sites and access to some clinical data.',
  populations: ['Adult patients'],
}

export const isFormEmpty = (values: VendorFormValues) =>
  (Object.keys(values) as (keyof VendorFormValues)[]).every((k) => !isFieldFilled(values, k))
