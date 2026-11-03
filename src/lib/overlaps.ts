/**
 * Who sees which internal interests, and the overlap check: whether an interest or an existing
 * project overlaps a partnership request, another project or another interest.
 */

import { getStageProgress } from '@/lib/caseActions'
import type { StatusRole } from '@/lib/caseStatus'
import { keywords, matchVendors } from '@/lib/serviceLineMatch'
import type {
  ExistingProject,
  Overlap,
  PartnershipRequest,
  ServiceLineInterest,
} from '@/types/partnership.types'

/**
 * The Strategy Team reviews every interest; the Partnership Admin and the Director only see the
 * approved ones. Nobody else sees the list.
 */
export const visibleInterests = (
  list: ServiceLineInterest[],
  role: StatusRole | 'service-line'
): ServiceLineInterest[] => {
  if (role === 'strategy') return list
  if (role === 'admin' || role === 'director') return list.filter((i) => i.status === 'Approved')
  return []
}

/** A focus area counts 3, each shared word 1; below this the items are not flagged */
export const OVERLAP_MIN_SCORE = 4
const MAX_OVERLAPS = 3

type Item = ServiceLineInterest | ExistingProject

const isProject = (item: Item): item is ExistingProject => 'vendors' in item

const profile = (item: Item) =>
  isProject(item)
    ? { ref: item.id, text: `${item.name} ${item.team}`, focus: [item.focusArea] }
    : {
        ref: item.code,
        text: `${item.title} ${item.problem} ${item.outcome}`,
        focus: item.focusAreas,
      }

/** Shared focus areas and words between two items */
const compare = (a: ReturnType<typeof profile>, b: ReturnType<typeof profile>) => {
  const focusMatches = a.focus.filter((f) => b.focus.includes(f))
  const bWords = keywords(b.text)
  const keywordMatches = [...keywords(a.text)].filter((w) => bWords.has(w))
  return { focusMatches, keywordMatches, score: focusMatches.length * 3 + keywordMatches.length }
}

const reasonsFor = (focusMatches: string[], keywordMatches: string[]) =>
  [
    focusMatches.length > 0 && `Same focus area: ${focusMatches.join(', ')}`,
    keywordMatches.length > 0 && `Shared words: ${keywordMatches.slice(0, 5).join(', ')}`,
  ].filter(Boolean) as string[]

/** ongoing, closed, exited, routed or completed */
const requestState = (r: PartnershipRequest) =>
  r.value?.sponsoredOn
    ? 'completed'
    : getStageProgress(r).kind === 'active'
      ? 'ongoing'
      : getStageProgress(r).kind

/**
 * Overlaps for one interest or project, strongest first (at most three). Partnership requests are
 * scored with the same rules as matchVendors; an item never overlaps itself.
 */
export const findOverlaps = (
  item: Item,
  interests: ServiceLineInterest[],
  projects: ExistingProject[],
  requests: PartnershipRequest[]
): Overlap[] => {
  const me = profile(item)

  const fromRequests: Overlap[] = matchVendors(
    { title: me.text, problem: '', outcome: '', focusAreas: me.focus },
    requests
  )
    .filter((m) => m.score >= OVERLAP_MIN_SCORE)
    .map((m) => ({
      kind: 'request',
      ref: m.request.requestCode,
      label: `Overlaps ${m.request.requestCode} (${requestState(m.request)})`,
      title: `${m.request.companyName}: ${m.request.headline ?? m.request.solution}`,
      status: requestState(m.request),
      stage: getStageProgress(m.request),
      reasons: reasonsFor(m.focusMatches, m.keywordMatches),
      score: m.score,
    }))

  const fromProjects: Overlap[] = projects
    .filter((p) => p.id !== me.ref)
    .map((p) => ({ p, c: compare(me, profile(p)) }))
    .filter(({ c }) => c.score >= OVERLAP_MIN_SCORE)
    .map(({ p, c }) => ({
      kind: 'project',
      ref: p.id,
      label: `Similar to ${p.name} (${p.status.toLowerCase()})`,
      title: `${p.name} · ${p.team}`,
      status: p.status,
      reasons: reasonsFor(c.focusMatches, c.keywordMatches),
      score: c.score,
    }))

  const fromInterests: Overlap[] = interests
    .filter((i) => i.code !== me.ref)
    .map((i) => ({ i, c: compare(me, profile(i)) }))
    .filter(({ c }) => c.score >= OVERLAP_MIN_SCORE)
    .map(({ i, c }) => ({
      kind: 'interest',
      ref: i.code,
      label: `Possible duplicate of ${i.code}`,
      title: i.title,
      status: i.status,
      reasons: reasonsFor(c.focusMatches, c.keywordMatches),
      score: c.score,
    }))

  return [...fromRequests, ...fromProjects, ...fromInterests]
    .sort((a, b) => b.score - a.score || a.ref.localeCompare(b.ref))
    .slice(0, MAX_OVERLAPS)
}
