import { describe, it, expect } from 'vitest'
import { runVendorFormCheck } from './vendorFormCheck'
import { EMPTY_VENDOR_FORM, missingVendorFields, type VendorFormValues } from '@/types/vendorForm'

const strong: VendorFormValues = {
  name: 'Sarah',
  jobTitle: 'CEO',
  company: 'Acme',
  vendorId: '',
  phone: '',
  email: 's@acme.com',
  yearFounded: '2018',
  stageAndExperience:
    'Founded in 2018, we launched our platform in 2022 and expanded to the UAE in 2023 through a partnership with two hospital groups, serving over 30 clinicians.',
  proposal:
    'We propose to deploy our diagnostic platform across three M42 hospitals over twelve months, starting with radiology and expanding to oncology.',
  focusAreas: ['AI & Diagnostics'],
  maturityAndRegulatory:
    'The platform is in pilot with three hospitals and holds CE Mark and FDA clearance, with a DoH Abu Dhabi submission under way.',
  relevantApprovals: 'CE, FDA, ISO 13485',
  novelty:
    'Our model reaches 96% sensitivity in a peer-reviewed study of 20,000 scans and holds two patents on its multi-modal architecture.',
  developmentApproach: 'Developed entirely by our team',
  resources:
    'We would like access to de-identified imaging data, two pilot sites and technical integration support with the M42 EHR.',
  populations: ['Adult patients'],
}

describe('runVendorFormCheck', () => {
  it('finds nothing to improve in a detailed form', () => {
    expect(runVendorFormCheck(strong)).toEqual([])
  })

  it('flags thin answers and says what to add', () => {
    const vague: VendorFormValues = {
      ...strong,
      stageAndExperience: 'We are a young company.',
      proposal: 'Deploy our model.',
      maturityAndRegulatory: 'Pilot stage.',
      relevantApprovals: 'In progress',
      novelty: 'Our model is better.',
      resources: 'Support.',
      populations: [],
      focusAreas: ['a', 'b', 'c', 'd', 'e'],
    }
    const fields = runVendorFormCheck(vague).map((s) => s.field)
    expect(fields).toEqual([
      'stageAndExperience',
      'proposal',
      'focusAreas',
      'maturityAndRegulatory',
      'relevantApprovals',
      'novelty',
      'resources',
      'populations',
    ])
    runVendorFormCheck(vague).forEach((s) => {
      expect(s.label.length).toBeGreaterThan(3)
      expect(s.message.length).toBeGreaterThan(20)
    })
  })

  it('accepts "Not applicable" as an approvals answer', () => {
    const fields = runVendorFormCheck({ ...strong, relevantApprovals: 'Not applicable.' }).map(
      (s) => s.field
    )
    expect(fields).not.toContain('relevantApprovals')
  })

  it('does not nag about empty required fields: that is validation', () => {
    const fields = runVendorFormCheck({ ...EMPTY_VENDOR_FORM, populations: ['Adult patients'] })
    expect(fields).toEqual([])
  })
})

describe('missingVendorFields', () => {
  it('lists the required fields still empty', () => {
    expect(missingVendorFields(EMPTY_VENDOR_FORM)).toContain('company')
    expect(missingVendorFields(EMPTY_VENDOR_FORM)).toContain('focusAreas')
    expect(missingVendorFields(EMPTY_VENDOR_FORM)).not.toContain('phone')
    expect(missingVendorFields(strong)).toEqual([])
  })
})
