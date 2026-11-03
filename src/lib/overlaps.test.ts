import { describe, it, expect } from 'vitest'
import { OVERLAP_MIN_SCORE, findOverlaps, visibleInterests } from './overlaps'
import {
  INITIAL_PARTNERSHIP_REQUESTS,
  type ExistingProject,
  type PartnershipRequest,
  type ServiceLineInterest,
} from '@/types/partnership.types'

const interest = (code: string, patch: Partial<ServiceLineInterest> = {}): ServiceLineInterest => ({
  code,
  serviceLine: 'Radiology',
  title: 'AI triage for chest imaging backlog',
  problem: 'Chest scans wait two days to be read.',
  focusAreas: ['Medical Imaging'],
  outcome: 'Urgent findings reported within 4 hours.',
  urgency: 'High',
  submittedBy: 'Hamad Al Suwaidi',
  on: '13 Oct 2026',
  status: 'Pending review',
  ...patch,
})

const project = (id: string, patch: Partial<ExistingProject> = {}): ExistingProject => ({
  id,
  name: 'Chest imaging AI triage',
  description: 'Flags urgent findings on chest scans.',
  team: 'Radiology',
  owner: 'Parag Agarwal',
  focusArea: 'Medical Imaging',
  status: 'Completed',
  started: 'Feb 2026',
  vendors: ['Lumen Imaging Labs'],
  ...patch,
})

const base = INITIAL_PARTNERSHIP_REQUESTS[0]
const request = (
  code: string,
  solution: string,
  focusAreas: string[],
  patch: Partial<PartnershipRequest> = {}
) => ({
  ...base,
  id: code,
  requestCode: code,
  companyName: `${code} Ltd`,
  solution,
  headline: solution,
  focusArea: focusAreas[0] ?? 'General',
  tags: focusAreas,
  assessmentAreas: { ...base.assessmentAreas, focusAreas, productPlatformServiceDetails: solution },
  ...patch,
})

describe('visibleInterests', () => {
  const list = [
    interest('SL-1', { status: 'Pending review' }),
    interest('SL-2', { status: 'Approved' }),
    interest('SL-3', { status: 'Declined' }),
  ]

  it('shows the Strategy Team every interest', () => {
    expect(visibleInterests(list, 'strategy').map((i) => i.code)).toEqual(['SL-1', 'SL-2', 'SL-3'])
  })

  it('shows the Partnership Admin and Director only approved ones', () => {
    expect(visibleInterests(list, 'admin').map((i) => i.code)).toEqual(['SL-2'])
    expect(visibleInterests(list, 'director').map((i) => i.code)).toEqual(['SL-2'])
  })

  it('shows nobody else anything', () => {
    expect(visibleInterests(list, 'internal')).toEqual([])
    expect(visibleInterests(list, 'sponsor')).toEqual([])
    expect(visibleInterests(list, 'service-line')).toEqual([])
  })
})

describe('findOverlaps', () => {
  it('flags an ongoing request, a similar project and a duplicate interest, strongest first', () => {
    const me = interest('SL-9')
    const overlaps = findOverlaps(
      me,
      [me, interest('SL-2', { title: 'Chest imaging triage backlog' })],
      [project('PRJ-1')],
      [request('PR-123', 'Chest imaging AI triage', ['Medical Imaging'], { status: 'In Progress' })]
    )
    expect(overlaps.map((o) => o.label).sort()).toEqual([
      'Overlaps PR-123 (ongoing)',
      'Possible duplicate of SL-2',
      'Similar to Chest imaging AI triage (completed)',
    ])
    overlaps.forEach((o) => {
      expect(o.score).toBeGreaterThanOrEqual(OVERLAP_MIN_SCORE)
      expect(o.reasons[0]).toBe('Same focus area: Medical Imaging')
      expect(o.reasons[1]).toMatch(/^Shared words: /)
    })
    expect([...overlaps].sort((a, b) => b.score - a.score)).toEqual(overlaps)
  })

  it('never matches an item with itself, and ignores weak matches', () => {
    const me = interest('SL-9')
    expect(
      findOverlaps(
        me,
        [me],
        [project('PRJ-2', { name: 'Diabetes coaching', focusArea: 'Preventative Healthcare' })],
        [request('PR-1', 'Variant interpreter', ['Rare Diseases'])]
      )
    ).toEqual([])
  })

  it('names the state of a closed or exited request', () => {
    const [closed] = findOverlaps(
      interest('SL-9'),
      [],
      [],
      [
        request('PR-5', 'Chest imaging AI', ['Medical Imaging'], {
          status: 'Exited',
          queue: 'closed',
        }),
      ]
    )
    expect(closed.label).toBe('Overlaps PR-5 (exited)')
  })

  it('checks an existing project too, without flagging the project itself', () => {
    const p = project('PRJ-1', { status: 'Live' })
    const overlaps = findOverlaps(p, [interest('SL-2')], [p], [])
    expect(overlaps.map((o) => o.label)).toEqual(['Possible duplicate of SL-2'])
  })

  it('keeps at most three', () => {
    const many = Array.from({ length: 5 }, (_, i) =>
      request(`PR-${i}`, 'Chest imaging AI triage', ['Medical Imaging'])
    )
    expect(findOverlaps(interest('SL-9'), [], [], many)).toHaveLength(3)
  })
})
