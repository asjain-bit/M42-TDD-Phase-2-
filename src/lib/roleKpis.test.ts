import { describe, it, expect } from 'vitest'
import {
  adminKpis,
  directorKpis,
  internalInterestKpis,
  sponsorKpis,
  strategyLeadKpis,
} from './roleKpis'
import {
  DEFAULT_INTERNAL_INTERESTS,
  INITIAL_PARTNERSHIP_REQUESTS,
  type PartnershipRequest,
} from '@/types/partnership.types'

const base = INITIAL_PARTNERSHIP_REQUESTS[0]
const withReviewer = (status: string, decision: string): PartnershipRequest => ({
  ...base,
  internalInterests: DEFAULT_INTERNAL_INTERESTS.map((m, i) =>
    i === 0 ? { ...m, status, decision } : m
  ),
})
const approval = (status: 'approved' | 'declined') => ({ status, by: 'x', date: 'y' })
const values = (kpis: { value: number }[]) => kpis.map((k) => k.value)

const NOW = new Date('2026-10-23T10:00:00Z')
const breachedCase = (over: Partial<PartnershipRequest> = {}): PartnershipRequest => ({
  ...base,
  slaStatus: 'Breached',
  ...over,
})

describe('role KPIs', () => {
  it('counts the Internal Interest reviewer own responses, completions and SLA breaches', () => {
    // Cases the Director sent to the team, in the Internal Canvas stage
    const sent = (status: string, decision: string): PartnershipRequest => ({
      ...withReviewer(status, decision),
      status: 'In Progress',
      decision: { status: 'proceeded', date: 'x' },
      sent: { internal: true },
    })
    const cases = [
      sent('Pending', '-'),
      sent('Completed', 'Proceed'),
      sent('Completed', 'Proceed'),
      sent('Completed', 'Reject'),
      {
        ...sent('Pending', '-'),
        slaStatus: 'Breached' as const,
        value: { sponsoredOn: '12 Oct 2026' },
      },
      { ...sent('Pending', '-'), slaStatus: 'Breached' as const, status: 'Closed' as const },
    ]
    const kpis = internalInterestKpis(cases, NOW)
    expect(kpis.map((k) => k.title)).toEqual(['Pending', 'Completed', 'Proceeded', 'SLA Breached'])
    // Pending: only the case still waiting on the reviewer; closed cases are not counted as breached
    expect(values(kpis)).toEqual([1, 1, 2, 1])
    expect(kpis[2].caption).toBe('Requests you responded to with Proceed.')
  })

  it('counts the Strategy Lead proceed verdicts, completions and SLA breaches', () => {
    const cases: PartnershipRequest[] = [
      { ...base, stageApprovals: {} },
      { ...base, stageApprovals: { strategy: approval('approved') } },
      { ...base, stageApprovals: { strategy: approval('declined') } },
      { ...base, stageApprovals: { strategy: approval('approved') } },
      { ...breachedCase(), value: { sponsoredOn: '3 Oct 2026' } },
    ]
    const kpis = strategyLeadKpis(cases, NOW)
    expect(kpis.map((k) => k.title)).toEqual(['Pending', 'Completed', 'Proceeded', 'SLA Breached'])
    expect(values(kpis)).toEqual([0, 1, 2, 1])
  })

  it('counts the sponsor cases: pending, completed this month, SLA breached and closed', () => {
    const atValue = (over: Partial<PartnershipRequest> = {}): PartnershipRequest => ({
      ...base,
      status: 'In Progress',
      decision: { status: 'proceeded', date: 'x' },
      stageApprovals: {
        internal: approval('approved'),
        strategy: approval('approved'),
      },
      alignmentPackOn: 'x',
      nda: {
        versions: [
          { version: 1, signed: true, fileName: 'NDA.pdf', uploadedOn: 'x', uploadedBy: 'x' },
        ],
      },
      discovery: { notes: [], recordings: [], proceededOn: 'x' },
      ...over,
    })
    const cases: PartnershipRequest[] = [
      atValue({ value: { sponsoredOn: '22 Oct 2026' } }),
      atValue({ value: { sponsoredOn: '22 Sep 2026' } }),
      atValue({ slaStatus: 'Breached' }),
      atValue(),
      { ...base, status: 'Closed' },
    ]
    const kpis = sponsorKpis(cases, NOW)
    expect(kpis.map((k) => k.title)).toEqual(['Pending', 'Completed', 'SLA Breached', 'Closed'])
    expect(values(kpis)).toEqual([2, 1, 1, 1])
  })

  it('counts the Partnership Admin queue, decisions this month, forwarded and closed cases', () => {
    const now = new Date('2026-10-23T10:00:00Z')
    const decision = (action: 'proceed' | 'reject', decidedAt?: string) => ({
      action,
      reason: '',
      date: 'Just now',
      decidedAt,
    })
    const cases: PartnershipRequest[] = [
      { ...base, queue: 'admin', adminDecision: undefined },
      { ...base, queue: 'admin', adminDecision: undefined },
      { ...base, queue: 'director', adminDecision: decision('proceed', '2026-10-02T09:00:00Z') },
      { ...base, queue: 'closed', adminDecision: decision('reject', '2026-10-21T09:00:00Z') },
      { ...base, queue: 'closed', adminDecision: decision('reject', '2026-09-30T09:00:00Z') },
    ]
    expect(values(adminKpis(cases, now))).toEqual([2, 2, 1, 2])
  })

  it('counts the Director cases: pending, completed this month, SLA breached and closed', () => {
    const ok = approval('approved')
    const mk = (over: Partial<PartnershipRequest>): PartnershipRequest => ({
      ...base,
      queue: 'director',
      status: 'In Progress',
      decision: { status: 'proceeded', date: 'x' },
      ...over,
    })
    const cases: PartnershipRequest[] = [
      // Initial review waiting on the Director
      mk({ status: 'Pending', decision: undefined }),
      // Internal Canvas sent: waiting on the team, not the Director
      mk({ sent: { internal: true } }),
      // NDA stage: the Director's work
      mk({ stageApprovals: { internal: ok, strategy: ok } }),
      // Completed this month, and last month
      mk({
        stageApprovals: { internal: ok, strategy: ok },
        alignmentPackOn: 'x',
        discovery: { notes: [], recordings: [], proceededOn: 'x' },
        value: { sponsoredOn: '5 Oct 2026' },
      }),
      mk({ value: { sponsoredOn: '5 Sep 2026' } }),
      mk({ slaStatus: 'Breached' }),
      mk({ status: 'Closed' }),
      mk({ status: 'Exited' }),
    ]
    const kpis = directorKpis(cases, NOW)
    expect(kpis.map((k) => k.title)).toEqual(['Pending', 'Completed', 'SLA Breached', 'Closed'])
    expect(values(kpis)).toEqual([3, 1, 1, 2])
  })
})
