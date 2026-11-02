import { describe, it, expect } from 'vitest'
import { MAX_VENDOR_MATCHES, matchVendors } from './serviceLineMatch'
import { INITIAL_PARTNERSHIP_REQUESTS, type PartnershipRequest } from '@/types/partnership.types'

const base = INITIAL_PARTNERSHIP_REQUESTS[0]

/** A case with only the fields matching reads */
const vendor = (
  code: string,
  focusAreas: string[],
  solution: string,
  patch: Partial<PartnershipRequest> = {}
): PartnershipRequest => ({
  ...base,
  id: code,
  requestCode: code,
  companyName: `${code} Ltd`,
  solution,
  headline: solution,
  focusArea: focusAreas[0] ?? 'General',
  tags: focusAreas,
  decision: undefined,
  adminDecision: undefined,
  assessmentAreas: {
    ...base.assessmentAreas,
    focusAreas,
    productPlatformServiceDetails: solution,
  },
  ...patch,
})

const interest = {
  title: 'AI triage for chest imaging backlog',
  problem: 'Chest scans wait two days to be read.',
  outcome: 'Urgent findings reported within 4 hours.',
  focusAreas: ['Medical Imaging'],
}

describe('matchVendors', () => {
  it('ranks a shared focus area above shared words, best match first', () => {
    const matches = matchVendors(interest, [
      vendor('PR-1', ['Rare Diseases'], 'Triage of chest images'),
      vendor('PR-2', ['Medical Imaging'], 'Imaging AI for chest triage'),
      vendor('PR-3', ['Medical Imaging'], 'PACS viewer'),
    ])
    expect(matches.map((m) => m.request.requestCode)).toEqual(['PR-2', 'PR-3', 'PR-1'])
    expect(matches[0]).toMatchObject({
      focusMatches: ['Medical Imaging'],
      keywordMatches: expect.arrayContaining(['chest', 'triage', 'imaging']),
    })
    expect(matches[0].why).toMatch(/^Same focus area: Medical Imaging\. Mentions .+\.$/)
    expect(matches[2].why).toMatch(/^Mentions /)
  })

  it('leaves out cases with nothing in common', () => {
    expect(
      matchVendors(interest, [vendor('PR-9', ['Rare Diseases'], 'Variant interpreter')])
    ).toEqual([])
  })

  it('includes closed, exited and rejected cases, with the rejection reason', () => {
    const matches = matchVendors(interest, [
      vendor('PR-4', ['Medical Imaging'], 'Chest imaging AI', {
        status: 'Exited',
        decision: { status: 'rejected', reason: 'Too early for the imaging roadmap.' },
      }),
      vendor('PR-5', ['Medical Imaging'], 'Imaging triage', {
        queue: 'closed',
        status: 'Exited',
        adminDecision: { action: 'reject', reason: 'Out of scope.', date: '01 Oct 2026' },
      }),
      vendor('PR-6', ['Medical Imaging'], 'Imaging workflow', { status: 'Closed' }),
    ])
    expect(matches).toHaveLength(3)
    const byCode = Object.fromEntries(matches.map((m) => [m.request.requestCode, m]))
    expect(byCode['PR-4'].rejectionReason).toBe('Too early for the imaging roadmap.')
    expect(byCode['PR-5'].rejectionReason).toBe('Out of scope.')
    expect(byCode['PR-6'].rejectionReason).toBeUndefined()
  })

  it('returns at most six matches', () => {
    const many = Array.from({ length: 9 }, (_, i) =>
      vendor(`PR-${10 + i}`, ['Medical Imaging'], 'Imaging')
    )
    expect(matchVendors(interest, many)).toHaveLength(MAX_VENDOR_MATCHES)
    expect(MAX_VENDOR_MATCHES).toBe(6)
  })

  it('matches words regardless of case and plurals, ignoring short and common words', () => {
    const [m] = matchVendors({ ...interest, focusAreas: [] }, [
      vendor('PR-20', [], 'SCANS of the CHEST with a model'),
    ])
    expect(m.keywordMatches.sort()).toEqual(['chest', 'scan'])
  })
})
