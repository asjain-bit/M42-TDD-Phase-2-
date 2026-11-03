/**
 * Matching for service line interests: vendors from every partnership request (including closed,
 * exited and rejected ones), and earlier interests that look like a new one.
 */

import type { PartnershipRequest, ServiceLineInterest } from '@/types/partnership.types'

const STOP_WORDS = new Set([
  'about',
  'after',
  'also',
  'and',
  'are',
  'between',
  'but',
  'can',
  'each',
  'from',
  'have',
  'into',
  'more',
  'need',
  'only',
  'other',
  'over',
  'that',
  'their',
  'them',
  'then',
  'there',
  'they',
  'this',
  'time',
  'under',
  'until',
  'what',
  'when',
  'with',
  'within',
  'without',
  'would',
  'year',
])

/** Lowercase words of four letters or more, with a trailing plural s removed */
export const keywords = (text: string): Set<string> =>
  new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4 && !STOP_WORDS.has(w))
      .map((w) => (w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w))
  )

const focusOf = (r: PartnershipRequest) =>
  new Set(
    r.assessmentAreas?.focusAreas?.length
      ? r.assessmentAreas.focusAreas
      : r.tags?.length
        ? r.tags
        : [r.focusArea]
  )

/** Why a case was turned down, if it was: by the Director at the brief or by the Admin at routing */
const rejectionOf = (r: PartnershipRequest): string | undefined =>
  r.decision?.status === 'rejected'
    ? (r.decision.reason ?? 'Rejected at the brief.')
    : r.adminDecision?.action === 'reject'
      ? r.adminDecision.reason
      : undefined

export interface VendorMatch {
  request: PartnershipRequest
  score: number
  /** Focus areas the interest and the case share */
  focusMatches: string[]
  /** Words from the interest found in the case's solution and headline */
  keywordMatches: string[]
  /** One line for the card */
  why: string
  /** Set when the case was turned down earlier */
  rejectionReason?: string
}

export const MAX_VENDOR_MATCHES = 6

/**
 * Vendors that could meet an interest, best match first. A shared focus area weighs more than a
 * shared word. Every case counts, whatever its status.
 */
export const matchVendors = (
  interest: Pick<ServiceLineInterest, 'title' | 'problem' | 'outcome' | 'focusAreas'>,
  requests: PartnershipRequest[]
): VendorMatch[] => {
  const words = keywords(`${interest.title} ${interest.problem} ${interest.outcome}`)
  return requests
    .map((request) => {
      const focus = focusOf(request)
      const focusMatches = interest.focusAreas.filter((f) => focus.has(f))
      const text = keywords(
        [request.solution, request.headline, request.assessmentAreas?.productPlatformServiceDetails]
          .filter(Boolean)
          .join(' ')
      )
      const keywordMatches = [...words].filter((w) => text.has(w))
      const score = focusMatches.length * 3 + keywordMatches.length
      const why = [
        focusMatches.length > 0 && `Same focus area: ${focusMatches.join(', ')}`,
        keywordMatches.length > 0 && `Mentions ${keywordMatches.slice(0, 3).join(', ')}`,
      ]
        .filter(Boolean)
        .join('. ')
      return {
        request,
        score,
        focusMatches,
        keywordMatches,
        why: why ? `${why}.` : '',
        rejectionReason: rejectionOf(request),
      }
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score || a.request.requestCode.localeCompare(b.request.requestCode))
    .slice(0, MAX_VENDOR_MATCHES)
}

export type InterestMatchField = 'title' | 'problem' | 'focus area' | 'service line'

export interface InterestComparison {
  /** What the two interests share, in a fixed order */
  matches: InterestMatchField[]
  /** 3-4 matches: Very similar; 1-2: Partly similar; none: not shown */
  level: 'Very similar' | 'Partly similar' | null
}

const sharedWords = (a: string, b: string) => {
  const bWords = keywords(b)
  return [...keywords(a)].filter((w) => bWords.has(w)).length
}

/**
 * How much a draft interest looks like an existing one, on four things: the title and the
 * problem (two shared words or more), the focus areas (any in common) and the service line
 * (the same, ignoring case).
 */
export const compareInterest = (
  draft: Pick<ServiceLineInterest, 'title' | 'problem' | 'focusAreas' | 'serviceLine'>,
  existing: Pick<ServiceLineInterest, 'title' | 'problem' | 'focusAreas' | 'serviceLine'>
): InterestComparison => {
  const matches: InterestMatchField[] = []
  if (sharedWords(draft.title, existing.title) >= 2) matches.push('title')
  if (sharedWords(draft.problem, existing.problem) >= 2) matches.push('problem')
  if (draft.focusAreas.some((f) => existing.focusAreas.includes(f))) matches.push('focus area')
  const line = draft.serviceLine.trim().toLowerCase()
  if (line && line === existing.serviceLine.trim().toLowerCase()) matches.push('service line')
  const level = matches.length >= 3 ? 'Very similar' : matches.length >= 1 ? 'Partly similar' : null
  return { matches, level }
}

/** SL-005 after SL-004 */
export const nextInterestCode = (interests: ServiceLineInterest[]) => {
  const max = interests.reduce((m, i) => Math.max(m, Number(i.code.replace(/\D/g, '')) || 0), 0)
  return `SL-${String(max + 1).padStart(3, '0')}`
}
