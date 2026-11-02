import { getDisplayStatus, type StatusRole } from '@/lib/caseStatus'
import { DEFAULT_INTERNAL_INTERESTS, type PartnershipRequest } from '@/types/partnership.types'

export interface RoleKpi {
  title: string
  caption: string
  value: number
}

const isTerminal = (r: PartnershipRequest) => r.status === 'Closed' || r.status === 'Exited'

/** Completed means the sponsor confirmed; the date is the day it happened (e.g. 27 Oct 2026) */
const completedThisMonth = (r: PartnershipRequest, now: Date) => {
  const done = r.value?.sponsoredOn ? new Date(r.value.sponsoredOn) : null
  return (
    done !== null &&
    !Number.isNaN(done.getTime()) &&
    done.getFullYear() === now.getFullYear() &&
    done.getMonth() === now.getMonth()
  )
}

/** Open cases past their SLA */
const breached = (requests: PartnershipRequest[]) =>
  requests.filter((r) => !isTerminal(r) && r.slaStatus === 'Breached').length

const pendingFor = (requests: PartnershipRequest[], role: StatusRole) =>
  requests.filter((r) => getDisplayStatus(r, role) === 'Pending').length

/** The logged-in Internal Interest reviewer is the first reviewer on every case sent to the team */
const internalReviewer = (r: PartnershipRequest) =>
  (r.internalInterests?.length ? r.internalInterests : DEFAULT_INTERNAL_INTERESTS)[0]

/** Counts for the logged-in reviewer; pass the cases sent to the Internal Interest team */
export const internalInterestKpis = (
  requests: PartnershipRequest[],
  now = new Date()
): RoleKpi[] => [
  {
    title: 'Pending',
    caption: 'Assigned questionnaires awaiting submission.',
    value: pendingFor(requests, 'internal'),
  },
  {
    title: 'Completed',
    caption: 'Completed this month.',
    value: requests.filter((r) => completedThisMonth(r, now)).length,
  },
  {
    title: 'Proceeded',
    caption: 'Requests you responded to with Proceed.',
    value: requests.filter(
      (r) =>
        internalReviewer(r)?.status === 'Completed' && internalReviewer(r).decision === 'Proceed'
    ).length,
  },
  {
    title: 'SLA Breached',
    caption: 'Requests past their SLA.',
    value: breached(requests),
  },
]

/** Counts for the Strategy Lead; pass the cases sent to the Strategy team */
export const strategyLeadKpis = (requests: PartnershipRequest[], now = new Date()): RoleKpi[] => [
  {
    title: 'Pending',
    caption: 'Strategic assessments awaiting your decision.',
    value: pendingFor(requests, 'strategy'),
  },
  {
    title: 'Completed',
    caption: 'Completed this month.',
    value: requests.filter((r) => completedThisMonth(r, now)).length,
  },
  {
    title: 'Proceeded',
    caption: 'Requests you responded to with Proceed.',
    value: requests.filter((r) => r.stageApprovals?.strategy?.status === 'approved').length,
  },
  {
    title: 'SLA Breached',
    caption: 'Requests past their SLA.',
    value: breached(requests),
  },
]

/** Sponsor: pass the cases the sponsor owns */
export const sponsorKpis = (requests: PartnershipRequest[], now = new Date()): RoleKpi[] => [
  {
    title: 'Pending',
    caption: 'Waiting on your action.',
    value: pendingFor(requests, 'sponsor'),
  },
  {
    title: 'Completed',
    caption: 'Sponsored this month.',
    value: requests.filter((r) => completedThisMonth(r, now)).length,
  },
  {
    title: 'SLA Breached',
    caption: 'Requests past their SLA.',
    value: breached(requests),
  },
  {
    title: 'Closed',
    caption: 'Closed or exited requests.',
    value: requests.filter((r) => getDisplayStatus(r, 'sponsor') === 'Closed').length,
  },
]

/** Director: pass the cases in the Director's queue */
export const directorKpis = (requests: PartnershipRequest[], now = new Date()): RoleKpi[] => [
  {
    title: 'Pending',
    caption: 'Waiting on your action.',
    value: pendingFor(requests, 'director'),
  },
  {
    title: 'Completed',
    caption: 'Completed this month.',
    value: requests.filter((r) => completedThisMonth(r, now)).length,
  },
  {
    title: 'SLA Breached',
    caption: 'Requests past their SLA.',
    value: breached(requests),
  },
  {
    title: 'Closed',
    caption: 'Closed or exited requests.',
    value: requests.filter((r) => getDisplayStatus(r, 'director') === 'Closed').length,
  },
]

/**
 * Partnership Admin: pass every case. Decisions only carry a timestamp (`decidedAt`) when they were
 * taken in the app, so earlier seeded decisions cannot be placed in a month.
 */
export const adminKpis = (requests: PartnershipRequest[], now = new Date()): RoleKpi[] => {
  const decidedThisMonth = requests.filter((r) => {
    const at = r.adminDecision?.decidedAt ? new Date(r.adminDecision.decidedAt) : null
    return at !== null && at.getFullYear() === now.getFullYear() && at.getMonth() === now.getMonth()
  })
  return [
    {
      title: 'Pending',
      caption: 'New requests to assess.',
      value: requests.filter((r) => r.queue === 'admin' && !r.adminDecision).length,
    },
    {
      title: 'Reviewed',
      caption: 'Decisions recorded this month.',
      value: decidedThisMonth.length,
    },
    {
      title: 'Proceeded',
      caption: 'Forwarded to Director.',
      value: requests.filter((r) => r.queue === 'director').length,
    },
    {
      title: 'Closed',
      caption: 'Closed at admin review.',
      value: requests.filter((r) => r.adminDecision?.action === 'reject').length,
    },
  ]
}
