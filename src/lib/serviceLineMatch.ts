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

/**
 * Earlier interests that look like the one being written: a shared focus area or two shared
 * title words. Similar ones come first; the rest keep their order.
 */
export const rankSimilarInterests = (
  draft: { title: string; focusAreas: string[] },
  interests: ServiceLineInterest[]
): { interest: ServiceLineInterest; similar: boolean }[] => {
  const words = keywords(draft.title)
  const ranked = interests.map((interest, index) => {
    const sharedFocus = interest.focusAreas.filter((f) => draft.focusAreas.includes(f)).length
    const sharedWords = [...keywords(interest.title)].filter((w) => words.has(w)).length
    const score = sharedFocus * 2 + sharedWords
    return { interest, index, score, similar: sharedFocus > 0 || sharedWords >= 2 }
  })
  return ranked
    .sort((a, b) => Number(b.similar) - Number(a.similar) || b.score - a.score || a.index - b.index)
    .map(({ interest, similar }) => ({ interest, similar }))
}

/** SL-005 after SL-004 */
export const nextInterestCode = (interests: ServiceLineInterest[]) => {
  const max = interests.reduce((m, i) => Math.max(m, Number(i.code.replace(/\D/g, '')) || 0), 0)
  return `SL-${String(max + 1).padStart(3, '0')}`
}
