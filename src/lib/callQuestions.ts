import type { PartnershipRequest } from '@/types/partnership.types'

/** A question the host could ask on the call, and why the agent suggests it */
export interface CallQuestion {
  id: string
  text: string
  reason: string
  source: 'strategy' | 'open' | 'gap'
}

const CALL_DEFAULTS: Record<'discovery' | 'value', { text: string; reason: string }[]> = {
  discovery: [
    {
      text: 'Which hospital or site would pilot first, and who is the clinical owner there?',
      reason: 'No pilot site on the case yet',
    },
    {
      text: 'Which baseline KPIs should the pilot be measured against?',
      reason: 'No success measures on the case yet',
    },
  ],
  value: [
    {
      text: 'What would the pilot cost, and what would scale-up cost after it?',
      reason: 'No pricing on the case yet',
    },
    {
      text: 'How much time would M42 teams need to give during the pilot?',
      reason: 'Effort for M42 teams is not on the case yet',
    },
  ],
}

const stripTags = (html: string) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .trim()

/**
 * Questions for the call, from the case: the Strategy Team's conditions, open points (critical or
 * attention highlights in the case notes, an unclear regulatory status, and what each call
 * usually settles) and the optional vendor form fields left blank.
 */
export const buildCallQuestions = (
  r: PartnershipRequest,
  callType: 'discovery' | 'value'
): CallQuestion[] => {
  const list: Omit<CallQuestion, 'id'>[] = []

  ;(r.strategyTeamMembers ?? []).forEach((m) => {
    const note = m.strategyResponse?.finalDecisionNote ?? ''
    const condition = note.match(/conditions?\s+(?:that|of)\s+(.+?)\.?$/i)?.[1]
    if (condition) {
      list.push({
        text: `Can you meet the Strategy Team's condition: ${condition}?`,
        reason: `Strategy condition from ${m.name}`,
        source: 'strategy',
      })
    }
  })

  const marks = [
    ...(r.summaryNote?.html ?? '').matchAll(
      /<mark data-tone="(critical|attention)">([\s\S]*?)<\/mark>/g
    ),
  ]
  marks.forEach(([, tone, inner]) => {
    const point = stripTags(inner ?? '').replace(/\.$/, '')
    if (point) {
      list.push({
        text: `${point}. What is the plan here?`,
        reason: `Flagged as ${tone} in the case notes`,
        source: 'open',
      })
    }
  })

  if ((r.overviewCards?.regulatory ?? '').toLowerCase().includes('unclear')) {
    list.push({
      text: 'What is your regulatory status in the UAE, and when do you expect approval?',
      reason: 'Regulatory status is unclear on the case',
      source: 'open',
    })
  }

  CALL_DEFAULTS[callType].forEach((q) => list.push({ ...q, source: 'open' }))

  const a = r.assessmentAreas
  const gaps: [boolean, string, string][] = [
    [
      !a?.relevantApprovals && !a?.regulatoryApprovalList?.length,
      'Which approvals do you already hold, and which are still pending?',
      'Approvals',
    ],
    [
      !a?.developmentApproach,
      'How is the product built and validated, and who gives clinical input?',
      'Development approach',
    ],
    [
      !a?.impactedPatientPopulations?.length,
      'Which patient groups would this reach at M42, and roughly how many people?',
      'Impacted patient populations',
    ],
    [
      !a?.growthJourneyAndRegionalExperience,
      'Where in the region is this live today, and with whom?',
      'Growth journey and regional experience',
    ],
    [
      !r.companyInfo?.location,
      'Where is your team based, and do you have a UAE entity?',
      'Location',
    ],
  ]
  gaps.forEach(([missing, text, field]) => {
    if (missing) list.push({ text, reason: `${field} left blank in the vendor form`, source: 'gap' })
  })

  return list
    .filter((q, i) => list.findIndex((x) => x.text === q.text) === i)
    .map((q, i) => ({ ...q, id: `q${i + 1}` }))
}
