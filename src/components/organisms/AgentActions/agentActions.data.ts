import type { PartnershipRequest } from '@/types/partnership.types'
import type { CaseType } from '@/types/partnership.types'
import type { AgentAction, ConfidenceLevel } from './AgentActions.types'

interface RequestProfile {
  route: string
  selfDeclaredRoute: string
  routeReason: string
  kpi: string
  kpiConfidence: number
  kpiWhy: string
  baseline: string
  coe: string
  estate: string
  commodityVerdict: string
  commodityIsRisk: boolean
  comparables: string
  differentiator: string
  changeFactors: [string, string, string]
  types: Record<CaseType, ConfidenceLevel>
}

const PROFILES: Record<string, RequestProfile> = {
  'req-001': {
    route: 'Partner',
    selfDeclaredRoute: 'Buy (licence the platform)',
    routeReason:
      'The vendor also asks for a clinical sandbox and joint research, which is a partnership, not a licence.',
    kpi: 'Time from scan to diagnosis',
    kpiConfidence: 91,
    kpiWhy:
      'The vendor claims earlier detection from imaging. Turnaround time is the KPI radiology and oncology already track.',
    baseline:
      'Median scan-to-report time is 26 hours today. We need three months of historical scans and reports at two sites to test the claim.',
    coe: 'No. Multi-modal imaging models would take the CoE well beyond the same window.',
    estate: 'No. The deployed estate has no pathology or imaging AI.',
    commodityVerdict: 'Hard to replace',
    commodityIsRisk: false,
    comparables:
      'Two regional imaging-AI vendors found. Neither covers pathology slides or clinical telemetry.',
    differentiator: 'One multi-modal engine across imaging, pathology and telemetry.',
    changeFactors: [
      'Clinical validation not reproduced on M42 patient data',
      'Regulatory documents found to be out of date or incomplete',
      'A reviewer finds an overlap with a planned roadmap item',
    ],
    types: { Partnership: 'High', Procure: 'Low', 'M&A': 'Low' },
  },
  'req-002': {
    route: 'Partner',
    selfDeclaredRoute: 'Buy (licence the platform)',
    routeReason:
      'Only one live customer so far. A joint validation partnership fits better than a straight purchase.',
    kpi: 'Time to heart-failure detection',
    kpiConfidence: 82,
    kpiWhy:
      'The proposal targets automated detection in primary care. Days from first ECG to specialist referral is the closest measurable KPI.',
    baseline:
      'Median 9 days from first ECG to specialist referral. We need 14,000 labelled ECG records to test the accuracy claim.',
    coe: 'Partly. The CoE could build a basic ECG model in the same window, but not the echo Doppler support.',
    estate: 'Partly. An ECG module in the deployed estate covers basic reads only.',
    commodityVerdict: 'Partly replaceable',
    commodityIsRisk: true,
    comparables: 'ECG interpretation AI is widely available. Echo Doppler support is rarer.',
    differentiator: 'Transformer-based waveform model with cross-lead attention.',
    changeFactors: [
      'Regulatory status stays unconfirmed after the vendor is asked',
      'Accuracy falls below 94% on M42 ECG data',
      'The CoE shows it can match the model in the same window',
    ],
    types: { Partnership: 'High', Procure: 'Medium', 'M&A': 'Low' },
  },
  'req-003': {
    route: 'Buy',
    selfDeclaredRoute: 'Buy (licence the platform)',
    routeReason:
      'Cleared product with a mature commercial offer. The claim holds up, so licensing is the right route.',
    kpi: 'Rate of unclassified variants',
    kpiConfidence: 93,
    kpiWhy:
      'The product exists to resolve variants of unknown significance. That rate directly measures its value in rare-disease cases.',
    baseline:
      '38% of variants are unclassified today. We need 500 closed rare-disease cases to test the claim.',
    coe: 'No. A curated MENA variant database cannot be built inside the same window.',
    estate: 'No. No variant interpretation tool is deployed today.',
    commodityVerdict: 'Hard to replace',
    commodityIsRisk: false,
    comparables:
      'Several global variant tools exist. None hold a curated MENA-specific non-coding variant set.',
    differentiator: 'Largest curated MENA non-coding variant database.',
    changeFactors: [
      'Unclassified variant reduction is under 35% on M42 cases',
      'Patient data cannot stay in the UAE',
      'The vendor cannot match the stated sequencing throughput',
    ],
    types: { Partnership: 'Medium', Procure: 'High', 'M&A': 'Low' },
  },
  'req-004': {
    route: 'Partner',
    selfDeclaredRoute: 'Buy (licence the platform)',
    routeReason:
      'The vendor wants joint clinical pathways with M42 virtual health centres, which goes beyond a licence.',
    kpi: '30-day readmission rate',
    kpiConfidence: 89,
    kpiWhy:
      'Remote monitoring after discharge is meant to catch deterioration early. Readmission within 30 days is the standard outcome measure.',
    baseline:
      '30-day readmission is 14.2% today. We need discharge lists and 90-day readmissions for a 300-patient cohort.',
    coe: 'Partly. The CoE could build the escalation dashboard, but not the cellular hub.',
    estate: 'Partly. The estate already has a remote monitoring module for a smaller cohort.',
    commodityVerdict: 'Easy to replace',
    commodityIsRisk: true,
    comparables:
      'Remote monitoring hubs are offered by many vendors. Cellular zero-pairing is the main difference.',
    differentiator: 'Cellular hub that needs no smartphone or Wi-Fi at the patient home.',
    changeFactors: [
      'Readmissions drop by less than 2 points in the pilot',
      'The existing remote monitoring module can be extended at lower cost',
      'DoH licence or data security certification lapses',
    ],
    types: { Partnership: 'High', Procure: 'Medium', 'M&A': 'Low' },
  },
}

const FALLBACK: RequestProfile = {
  route: 'Partner',
  selfDeclaredRoute: 'Buy (licence the platform)',
  routeReason: 'The agent could not confirm the vendor claim, so it chose the safer route.',
  kpi: 'Primary clinical outcome KPI',
  kpiConfidence: 75,
  kpiWhy: 'The agent matched the proposal to the closest outcome KPI M42 already tracks.',
  baseline: 'The baseline needs to be measured at the pilot site before the test starts.',
  coe: 'Not assessed yet.',
  estate: 'Not assessed yet.',
  commodityVerdict: 'Needs review',
  commodityIsRisk: true,
  comparables: 'Comparable offerings not yet confirmed.',
  differentiator: 'To be confirmed with the vendor.',
  changeFactors: [
    'Vendor claims cannot be verified',
    'A reviewer finds a duplicate or roadmap overlap',
    'Baseline data cannot be obtained for the test',
  ],
  types: { Partnership: 'High', Procure: 'Medium', 'M&A': 'Low' },
}

const PHASE_BY_MATURITY: Record<string, string> = {
  Pilot: 'Phase 2: Pilot-ready',
  'Clinical Validation': 'Phase 2: Clinical validation',
  Commercial: 'Phase 3: Ready to scale',
}

const profileFor = (request: PartnershipRequest) => PROFILES[request.id] ?? FALLBACK

export const confidenceLevel = (c: number): ConfidenceLevel =>
  c >= 80 ? 'High' : c >= 50 ? 'Medium' : 'Low'

export const getChangeFactors = (request: PartnershipRequest): [string, string, string] =>
  profileFor(request).changeFactors

export const buildAgentActions = (request: PartnershipRequest): AgentAction[] => {
  const p = profileFor(request)
  const rec = request.agentRecommendation
  const recWord = rec?.status === 'reject' ? 'Reject' : 'Proceed'
  const recConfidence = rec?.confidence ?? 90
  const cards = request.overviewCards
  const duplicateClear = cards.duplicateCheck.toLowerCase() === 'clear'
  const regulatoryUnclear = cards.regulatory.toLowerCase().includes('unclear')
  const phase = PHASE_BY_MATURITY[request.solutionMaturity] ?? 'Phase 2: Pilot-ready'
  const info = request.companyInfo
  const people = request.internalInterests ?? []
  const spread = [2, -4, -9, -14, -18]

  return [
    {
      id: 'duplicate',
      icon: 'duplicate',
      title: 'Duplicate check',
      check: 'Against live cases, the deployed estate and prior declines',
      status: duplicateClear ? 'passed' : 'attention',
      headline: duplicateClear
        ? 'No duplicate found'
        : 'Possible duplicate. Review before deciding',
      findings: [
        { label: 'Live cases compared', value: '24' },
        { label: 'Deployed estate solutions compared', value: '38' },
        { label: 'Prior declines compared', value: '12' },
        { label: 'Matches found', value: duplicateClear ? 'None' : '1 possible match' },
      ],
      output: duplicateClear
        ? `${request.companyName} and ${request.solution} do not match any live case, deployed solution or prior decline.`
        : `${request.companyName} resembles an existing case. Confirm it is not the same offering.`,
    },
    {
      id: 'classification',
      icon: 'classification',
      title: 'Classification',
      check: "Into one of four routes. The vendor's own label is treated as a claim",
      status: 'complete',
      headline: `Route: ${p.route}`,
      findings: [
        { label: 'Routes considered', value: 'Buy, Partner, Build with the Agentic CoE, Decline' },
        { label: 'Vendor self-declared', value: `${p.selfDeclaredRoute} (treated as a claim)` },
        { label: 'Agent classification', value: p.route },
        { label: 'Why', value: p.routeReason },
        { label: 'Focus area', value: request.focusArea },
      ],
      output: `Classified as ${p.route}. The vendor's label of "${p.selfDeclaredRoute}" was not accepted as given.`,
    },
    {
      id: 'maturity',
      icon: 'maturity',
      title: 'Maturity research',
      check: 'Evidence, deployment, regulatory, corporate, defensibility and duplication',
      status: regulatoryUnclear ? 'attention' : 'complete',
      headline: `${request.solutionMaturity}. ${phase}`,
      findings: [
        { label: 'Evidence', value: cards.evidence },
        { label: 'Deployment', value: cards.deployment },
        { label: 'Regulatory', value: cards.regulatory },
        {
          label: 'Corporate',
          value: `Founded ${info.yearFounded}${info.location ? `, ${info.location}` : ''}`,
        },
        { label: 'Defensibility', value: p.differentiator },
        { label: 'Duplication', value: duplicateClear ? 'No overlap found' : 'Possible overlap' },
        { label: 'Phase placement', value: phase },
      ],
      output: regulatoryUnclear
        ? `Placed in ${phase}, but regulatory status could not be confirmed. Ask the vendor for proof.`
        : `Vendor claims were checked against the evidence. Placed in ${phase}.`,
    },
    {
      id: 'kpi',
      icon: 'kpi',
      title: 'KPI mapping',
      check: 'Which service line KPIs the claim would move, and the baseline needed to test it',
      status: 'complete',
      confidence: confidenceLevel(p.kpiConfidence),
      headline: `${p.kpi}`,
      findings: [
        { label: 'KPI the claim would move', value: p.kpi },
        { label: 'Confidence', value: confidenceLevel(p.kpiConfidence) },
        { label: 'Why this KPI', value: p.kpiWhy },
        { label: 'Baseline needed to test it', value: p.baseline },
      ],
      stakeholders: people.slice(0, 5).map((person, i) => ({
        name: person.name,
        role: person.role,
        reason: person.whySuggested ?? 'Relevant domain expertise.',
        confidence: confidenceLevel(Math.max(50, p.kpiConfidence + (spread[i] ?? -20))),
      })),
      output: `Mapped to "${p.kpi}" with ${confidenceLevel(p.kpiConfidence).toLowerCase()} confidence. The reviewers below are suggested for Internal Review.`,
    },
    {
      id: 'commodity',
      icon: 'commodity',
      title: 'Commodity test',
      check: 'Could the Agentic CoE or the existing estate deliver this inside the same window',
      status: p.commodityIsRisk ? 'attention' : 'passed',
      headline: p.commodityVerdict,
      findings: [
        { label: 'Could the Agentic CoE deliver it?', value: p.coe },
        { label: 'Could the existing estate deliver it?', value: p.estate },
        { label: 'Comparable offerings', value: p.comparables },
        { label: 'What sets it apart', value: p.differentiator },
      ],
      output: p.commodityIsRisk
        ? `Partly replaceable. Value depends on: ${p.differentiator}`
        : `Not replaceable in the same window. Key difference: ${p.differentiator}`,
    },
    {
      id: 'brief',
      icon: 'brief',
      title: 'Initial assessment brief',
      check: 'Two pages, including the three things that would change its recommendation',
      status: recWord === 'Proceed' ? 'passed' : 'attention',
      confidence: confidenceLevel(recConfidence),
      headline: `Recommends ${recWord}`,
      findings: [
        { label: 'Recommendation', value: recWord },
        { label: 'Confidence', value: confidenceLevel(recConfidence) },
        { label: 'Reasoning', value: rec?.rationale ?? 'See the brief.' },
        { label: 'Would change the recommendation', value: p.changeFactors.join('. ') },
      ],
      output:
        recWord === 'Proceed'
          ? 'Brief drafted. The agent recommends proceed. The decision is yours.'
          : 'Brief drafted. The agent recommends not taking this further: use Close request. The decision is yours.',
    },
  ]
}

export const getTypeConfidence = (request: PartnershipRequest): Record<CaseType, ConfidenceLevel> =>
  profileFor(request).types

interface AdminProfile {
  reapplying: boolean
  history: string
  backlog: string
  backlogCovered: boolean
  serviceLine: string
  uae: { label: string; score: number }[]
  screening: { blacklist: string; media: string; mediaIsRisk: boolean }
}

const ADMIN_PROFILES: Record<string, AdminProfile> = {
  'req-001': {
    reapplying: false,
    history: 'No earlier application from this vendor.',
    backlog: 'No matching item in the CoE build backlog.',
    backlogCovered: false,
    serviceLine: 'Radiology and Oncology',
    uae: [
      { label: 'DoH Abu Dhabi AI in healthcare policy', score: 4 },
      { label: 'MOHAP device registration', score: 5 },
      { label: 'Data residency and ADHICS', score: 4 },
      { label: 'Clinical safety evidence', score: 4 },
    ],
    screening: { blacklist: 'Not listed', media: 'No adverse coverage found', mediaIsRisk: false },
  },
  'req-002': {
    reapplying: false,
    history: 'No earlier application from this vendor.',
    backlog: 'Partly covered by the CoE backlog item "ECG interpretation module".',
    backlogCovered: true,
    serviceLine: 'Cardiology',
    uae: [
      { label: 'DoH Abu Dhabi AI in healthcare policy', score: 3 },
      { label: 'MOHAP device registration', score: 2 },
      { label: 'Data residency and ADHICS', score: 3 },
      { label: 'Clinical safety evidence', score: 3 },
    ],
    screening: { blacklist: 'Not listed', media: 'No adverse coverage found', mediaIsRisk: false },
  },
  'req-003': {
    reapplying: true,
    history: 'Applied in March 2025 and was declined for lack of UAE data residency.',
    backlog: 'No matching item in the CoE build backlog.',
    backlogCovered: false,
    serviceLine: 'Genomics and Oncology',
    uae: [
      { label: 'DoH Abu Dhabi AI in healthcare policy', score: 4 },
      { label: 'MOHAP device registration', score: 5 },
      { label: 'Data residency and ADHICS', score: 3 },
      { label: 'Clinical safety evidence', score: 5 },
    ],
    screening: { blacklist: 'Not listed', media: 'No adverse coverage found', mediaIsRisk: false },
  },
  'req-004': {
    reapplying: false,
    history: 'No earlier application from this vendor.',
    backlog: 'Partly covered by the CoE backlog item "Remote monitoring v2".',
    backlogCovered: true,
    serviceLine: 'Chronic care and Virtual health',
    uae: [
      { label: 'DoH Abu Dhabi AI in healthcare policy', score: 5 },
      { label: 'MOHAP device registration', score: 4 },
      { label: 'Data residency and ADHICS', score: 4 },
      { label: 'Clinical safety evidence', score: 3 },
    ],
    screening: {
      blacklist: 'Not listed',
      media: 'One 2024 article on a data incident, since resolved',
      mediaIsRisk: true,
    },
  },
  'req-005': {
    reapplying: false,
    history: 'No earlier application from this vendor.',
    backlog: 'No matching item in the CoE build backlog.',
    backlogCovered: false,
    serviceLine: 'Neurology',
    uae: [
      { label: 'DoH Abu Dhabi AI in healthcare policy', score: 4 },
      { label: 'MOHAP device registration', score: 2 },
      { label: 'Data residency and ADHICS', score: 3 },
      { label: 'Clinical safety evidence', score: 4 },
    ],
    screening: { blacklist: 'Not listed', media: 'No adverse coverage found', mediaIsRisk: false },
  },
}

const ADMIN_FALLBACK: AdminProfile = {
  reapplying: false,
  history: 'No earlier application from this vendor.',
  backlog: 'No matching item in the CoE build backlog.',
  backlogCovered: false,
  serviceLine: 'To be confirmed',
  uae: [
    { label: 'DoH Abu Dhabi AI in healthcare policy', score: 3 },
    { label: 'MOHAP device registration', score: 3 },
    { label: 'Data residency and ADHICS', score: 3 },
    { label: 'Clinical safety evidence', score: 3 },
  ],
  screening: { blacklist: 'Not listed', media: 'No adverse coverage found', mediaIsRisk: false },
}

/** Checks the Partnership Admin sees when triaging a new case */
export const buildAdminAgentActions = (
  request: PartnershipRequest,
  allRequests: PartnershipRequest[] = []
): AgentAction[] => {
  const base = buildAgentActions(request)
  const kpi = base.find((a) => a.id === 'kpi')!
  const brief = base.find((a) => a.id === 'brief')!
  const p = ADMIN_PROFILES[request.id] ?? ADMIN_FALLBACK
  const earlier = allRequests.filter(
    (o) =>
      o.id !== request.id &&
      o.companyName.trim().toLowerCase() === request.companyName.trim().toLowerCase()
  )
  const liveEarlier = earlier.filter((o) => o.status !== 'Exited')
  const reapplying = p.reapplying || earlier.length > 0
  const total = p.uae.reduce((sum, i) => sum + i.score, 0)
  const max = p.uae.length * 5
  const scoreOutOf10 = Math.round((total / max) * 10)
  const maturityWeak = total / max < 0.6

  return [
    {
      id: 'applicant',
      icon: 'history',
      title: 'Applicant history',
      check: 'Fresh application or re-applying',
      status: reapplying ? 'attention' : 'passed',
      headline: reapplying ? 'Re-applying' : 'Fresh application',
      findings: [
        { label: 'Marked as', value: reapplying ? 'Re-applying' : 'Fresh application' },
        {
          label: 'Earlier applications',
          value:
            earlier.length > 0
              ? `${earlier.length} found in the pipeline`
              : p.reapplying
                ? '1 found in pipeline history'
                : 'None',
        },
        {
          label: 'History',
          value:
            earlier.length > 0
              ? `Earlier case ${earlier[0].requestCode} for the same company.`
              : p.history,
        },
      ],
      output: reapplying
        ? `${request.companyName} has applied before. Compare with the earlier outcome before routing.`
        : `${request.companyName} is applying for the first time.`,
    },
    {
      id: 'duplicate',
      icon: 'duplicate',
      title: 'Duplicate check',
      check: 'Against live cases and prior declines',
      status: liveEarlier.length > 0 ? 'attention' : 'passed',
      headline: liveEarlier.length > 0 ? 'Possible duplicate of a live case' : 'No duplicate found',
      findings: [
        { label: 'Live cases compared', value: '24' },
        { label: 'Prior declines compared', value: '12' },
        {
          label: 'Matches found',
          value: liveEarlier.length > 0 ? `${liveEarlier.length} live case` : 'None',
        },
      ],
      output:
        liveEarlier.length > 0
          ? `A live case (${liveEarlier[0].requestCode}) exists for this company. Confirm they are different offerings.`
          : 'No live case or prior decline matches this request.',
    },
    {
      id: 'backlog',
      icon: 'backlog',
      title: 'CoE backlog check',
      check: 'Whether the Agentic CoE backlog already covers it',
      status: p.backlogCovered ? 'attention' : 'passed',
      headline: p.backlogCovered ? 'Partly covered in the backlog' : 'Not in the backlog',
      findings: [
        { label: 'Backlog items compared', value: '41' },
        { label: 'Result', value: p.backlog },
      ],
      output: p.backlogCovered
        ? 'Part of this scope is already planned in the CoE backlog. Consider whether to build or partner.'
        : 'Nothing in the CoE backlog covers this request.',
    },
    {
      id: 'service-line',
      icon: 'kpi',
      title: 'Service line and KPI mapping',
      check: 'Comparison against service lines and their KPIs',
      status: 'complete',
      confidence: kpi.confidence,
      headline: `${p.serviceLine}. ${kpi.findings[0].value}`,
      findings: [
        { label: 'Service line', value: p.serviceLine },
        ...kpi.findings.filter((f) => f.label !== 'Confidence'),
        { label: 'Confidence', value: kpi.confidence ?? 'Medium' },
      ],
      output: `Mapped to ${p.serviceLine} and the KPI "${kpi.findings[0].value}".`,
    },
    {
      id: 'uae-maturity',
      icon: 'uae',
      title: 'Solution maturity scoring',
      check: 'Across UAE rules and regulations',
      status: maturityWeak ? 'attention' : 'complete',
      headline: `${scoreOutOf10} out of 10`,
      findings: [
        ...p.uae.map((i) => ({ label: i.label, value: `${i.score} out of 5` })),
        { label: 'Overall score', value: `${scoreOutOf10} out of 10` },
      ],
      output: maturityWeak
        ? `Scored ${scoreOutOf10} out of 10. Gaps in UAE regulatory readiness need to be closed before a pilot.`
        : `Scored ${scoreOutOf10} out of 10 across UAE rules and regulations.`,
    },
    {
      id: 'screening',
      icon: 'screening',
      title: 'Vendor screening',
      check: 'Blacklist and adverse media coverage',
      status: p.screening.mediaIsRisk ? 'attention' : 'passed',
      headline: p.screening.mediaIsRisk ? 'Adverse media found' : 'No blacklist or media concerns',
      findings: [
        { label: 'Blacklist', value: p.screening.blacklist },
        { label: 'Adverse media', value: p.screening.media },
      ],
      output: p.screening.mediaIsRisk
        ? 'Not blacklisted, but adverse coverage was found. Review before routing.'
        : 'The vendor is not blacklisted and no adverse coverage was found.',
    },
    {
      ...brief,
      title: 'Initial assessment brief',
      check: 'Two pages, ready for your routing decision',
    },
  ]
}
