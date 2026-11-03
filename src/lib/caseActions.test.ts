import { describe, it, expect } from 'vitest'
import {
  appendAudit,
  buildCaseFromForm,
  formatTimestamp,
  getStageLabel,
  getStageProgress,
  closeRequest,
  hasDirectorDecided,
  buildInfoEmail,
  addDiscoveryFile,
  applyInternalScenario,
  assignSponsors,
  buildSplitCases,
  finalizeSponsorship,
  generateTddReport,
  applyCaseAction,
  proceedToValue,
  uploadSignedNda,
  holdRequest,
  nextCaseCode,
  proceedRequest,
  rejectRequest,
  resumeRequest,
  routeRequest,
  sendReview,
  submitReview,
  updateSummaryNote,
  currentAnswer,
  editInternalAnswer,
  buildCloseEmail,
  expressSponsorInterest,
  getOverdueDays,
  hasSignedNda,
} from './caseActions'
import { INITIAL_PARTNERSHIP_REQUESTS } from '@/types/partnership.types'
import type { VendorFormValues } from '@/types/vendorForm'

const [pending, inProgress, , exited, adminCase] = INITIAL_PARTNERSHIP_REQUESTS

const form: VendorFormValues = {
  name: ' Dr. Omar ',
  jobTitle: 'CEO',
  company: 'PulseAI Health',
  phone: '',
  email: 'omar@pulseai.health',
  yearFounded: '2021',
  stageAndExperience: 'Launched in 2022.',
  proposal: 'Deploy our triage model in M42 emergency departments. We would start in Abu Dhabi.',
  focusAreas: ['AI & Diagnostics', 'Medical Imaging'],
  maturityAndRegulatory: 'Clinical validation completed. CE Mark and FDA cleared.',
  relevantApprovals: 'CE, FDA',
  novelty: 'Better triage accuracy.',
  developmentApproach: 'Developed entirely by our team',
  resources: 'Pilot sites and data.',
  populations: ['Adult patients'],
}

describe('case codes', () => {
  it('numbers the next case after the highest existing one', () => {
    expect(nextCaseCode(INITIAL_PARTNERSHIP_REQUESTS)).toBe('PR-126')
    expect(nextCaseCode([])).toBe('PR-1')
  })
})

describe('getStageLabel', () => {
  it('describes where a case is', () => {
    expect(getStageLabel(adminCase)).toBe('Initial Assessment Brief')
    expect(getStageLabel(pending)).toBe('Initial Assessment Brief')
    expect(getStageLabel(exited)).toBe('Exited')
    expect(getStageLabel({ ...pending, status: 'Information Requested' })).toBe(
      'Initial Assessment Brief'
    )
    expect(getStageLabel({ ...pending, queue: 'routed', caseType: 'Procure' })).toBe(
      'Routed to Procurement'
    )
    expect(getStageLabel({ ...pending, queue: 'routed', caseType: 'M&A' })).toBe(
      'Routed to Corporate Development'
    )
    // Later stages follow the same names as the case page
    const approved = { status: 'approved' as const, by: 'x', date: 'y' }
    const inProgress = { ...pending, status: 'In Progress' as const }
    expect(getStageLabel(inProgress)).toBe('Internal Canvas')
    const afterInternal = { ...inProgress, stageApprovals: { internal: approved } }
    expect(getStageLabel(afterInternal)).toBe('Strategic Alignment')
    const afterStrategy = {
      ...afterInternal,
      stageApprovals: { internal: approved, strategy: approved },
    }
    expect(getStageLabel(afterStrategy)).toBe('NDA')
    // The alignment pack alone does not move it on: the signed NDA has to be in too
    const packOnly = { ...afterStrategy, alignmentPackOn: 'today' }
    expect(getStageLabel(packOnly)).toBe('NDA')
    const withPack = {
      ...packOnly,
      nda: {
        versions: [
          { version: 1, signed: true, fileName: 'NDA.pdf', uploadedOn: 'today', uploadedBy: 'x' },
        ],
      },
    }
    expect(getStageLabel(withPack)).toBe('Discovery Call')
    expect(
      getStageLabel({
        ...withPack,
        discovery: { notes: [], recordings: [], proceededOn: 'today' },
      })
    ).toBe('Value & Due Diligence')
  })
})

describe('director actions', () => {
  it('moves an approved case on and records the reason', () => {
    const next = proceedRequest(pending, 'Strong fit')
    expect(next.status).toBe('In Progress')
    expect(next.decision).toEqual({ status: 'proceeded', reason: 'Strong fit', date: 'Just now' })
    expect(next.workflowStages.find((s) => s.id === 3)?.status).toBe('completed')
    expect(next.workflowStages.find((s) => s.id === 4)?.status).toBe('in_progress')
    expect(next.daysInStage).toBe(0)
    expect(proceedRequest(pending, '').decision?.reason).toBe('Approved to proceed to next stage.')
  })

  it('rejects a case with a reason', () => {
    const next = rejectRequest(pending, 'Duplicate')
    expect(next.status).toBe('Exited')
    expect(next.decision?.status).toBe('rejected')
  })

  it('marks a case Information Requested with the email, and resumes it', () => {
    const held = holdRequest(pending, { to: 'a@b.com', subject: 'S', body: 'B' })
    expect(held.status).toBe('Information Requested')
    expect(held.holdInfo).toMatchObject({ to: 'a@b.com', subject: 'S', body: 'B' })
    const back = resumeRequest(held)
    expect(back.status).toBe('Pending')
    expect(back.holdInfo).toBeUndefined()
  })
})

describe('hasDirectorDecided', () => {
  it('is true only once the Director has acted on a case in their queue', () => {
    expect(hasDirectorDecided(pending)).toBe(false)
    expect(hasDirectorDecided(inProgress)).toBe(true)
    expect(hasDirectorDecided(exited)).toBe(true)
    expect(hasDirectorDecided({ ...pending, decision: { status: 'rejected' } })).toBe(true)
    // routed elsewhere with an In Progress status: the Director never saw it
    expect(hasDirectorDecided({ ...pending, queue: 'routed', status: 'In Progress' })).toBe(false)
    expect(hasDirectorDecided(adminCase)).toBe(false)
  })
})

describe('routeRequest', () => {
  it('sends a Partnership case to the Director', () => {
    const next = routeRequest(adminCase, { action: 'proceed', type: 'Partnership', reason: 'Fit' })
    expect(next.queue).toBe('director')
    expect(next.caseType).toBe('Partnership')
    expect(next.owner).toBe('Zaid Al Ali')
    expect(next.status).toBe('Pending')
    expect(next.adminDecision).toMatchObject({
      action: 'proceed',
      type: 'Partnership',
      reason: 'Fit',
    })
    expect(next.workflowStages.find((s) => s.id === 2)?.status).toBe('completed')
    expect(next.workflowStages.find((s) => s.id === 3)?.status).toBe('in_progress')
  })

  it('takes Procure and M&A cases out of the Director list', () => {
    const procure = routeRequest(pending, { action: 'proceed', type: 'Procure', reason: 'Buy' })
    expect(procure.queue).toBe('routed')
    expect(procure.owner).toBe('Procurement team')
    const ma = routeRequest(pending, { action: 'proceed', type: 'M&A', reason: 'Acquire' })
    expect(ma.owner).toBe('Corporate Development team')
  })

  it('treats a proceed without a type as Partnership', () => {
    expect(routeRequest(adminCase, { action: 'proceed', reason: 'ok' }).caseType).toBe(
      'Partnership'
    )
  })

  it('closes a rejected case', () => {
    const next = routeRequest(pending, { action: 'reject', reason: 'Out of scope' })
    expect(next.queue).toBe('closed')
    expect(next.status).toBe('Exited')
    expect(next.caseType).toBeUndefined()
  })
})

describe('buildCaseFromForm', () => {
  const when = new Date('2026-10-22T09:00:00Z')

  it('turns the vendor form into a case waiting for the Partnership Admin', () => {
    const c = buildCaseFromForm(form, 'PR-126', when)
    expect(c.requestCode).toBe('PR-126')
    expect(c.queue).toBe('admin')
    expect(c.status).toBe('Pending')
    expect(c.owner).toBe('Nadia Al-Farsi')
    expect(c.companyName).toBe('PulseAI Health')
    expect(c.vendorName).toBe('Dr. Omar')
    expect(c.solution).toBe('Deploy our triage model in M42 emergency departments.')
    expect(c.focusArea).toBe('AI & Diagnostics')
    expect(c.solutionMaturity).toBe('Clinical Validation')
    expect(c.submittedOn).toBe('22 Oct 2026')
    expect(c.deadline).toBe('05 Nov 2026')
    expect(c.companyInfo.phoneNumber).toBeUndefined()
    expect(c.assessmentAreas.regulatoryApprovalList).toEqual(['FDA', 'CE'])
    expect(c.workflowStages[0].status).toBe('completed')
    expect(c.workflowStages[1].status).toBe('in_progress')
  })

  it('infers maturity and approvals from the answers', () => {
    const maturity = (text: string) =>
      buildCaseFromForm({ ...form, maturityAndRegulatory: text }, 'PR-1', when).solutionMaturity
    expect(maturity('Live customers across the region')).toBe('Commercial')
    expect(maturity('Running a pilot in two hospitals')).toBe('Pilot')
    expect(maturity('An idea on paper')).toBe('Concept')
    const approvals = buildCaseFromForm({ ...form, relevantApprovals: 'In progress' }, 'PR-1', when)
    expect(approvals.assessmentAreas.regulatoryApprovalList).toEqual(['Not applicable'])
  })

  it('keeps long headlines short and falls back when no focus area is chosen', () => {
    const long = buildCaseFromForm(
      {
        ...form,
        proposal: `${'word '.repeat(60)}end`,
        focusAreas: [],
        phone: ' +971 50 ',
        developmentApproach: '',
      },
      'PR-2',
      when
    )
    expect(long.solution.length).toBeLessThanOrEqual(110)
    expect(long.solution.endsWith('…')).toBe(true)
    expect(long.focusArea).toBe('General')
    expect(long.companyInfo.phoneNumber).toBe('+971 50')
    expect(long.assessmentAreas.developmentApproach).toBeUndefined()
  })
})

describe('audit log', () => {
  it('formats timestamps like 22 Oct 2026, 06:50 PM', () => {
    expect(formatTimestamp(new Date(2026, 9, 22, 18, 50))).toBe('22 Oct 2026, 06:50 PM')
  })

  it('appends an event with an id and timestamp', () => {
    const next = appendAudit(pending, {
      title: 'Something happened',
      description: 'Details',
      actor: 'Someone',
      kind: 'user',
    })
    expect(next.auditLog).toHaveLength(pending.auditLog.length + 1)
    expect(next.auditLog.at(-1)).toMatchObject({ title: 'Something happened', kind: 'user' })
    expect(next.auditLog.at(-1)?.timestamp).toMatch(/^\d{2} \w{3} \d{4}, \d{2}:\d{2} (AM|PM)$/)
  })

  it('logs an event with a key only once', () => {
    const event = {
      key: 'once',
      title: 'Once',
      description: '',
      actor: 'A',
      kind: 'agent' as const,
    }
    const first = appendAudit(pending, event)
    const second = appendAudit(first, event)
    expect(second).toBe(first)
    expect(second.auditLog.filter((e) => e.id === 'once')).toHaveLength(1)
  })

  it('records every Director and admin action with the right colour', () => {
    const kinds = (r: typeof pending) => r.auditLog.at(-1)?.kind
    const titles = (r: typeof pending) => r.auditLog.at(-1)?.title
    expect(kinds(proceedRequest(pending, 'ok'))).toBe('approval')
    expect(kinds(rejectRequest(pending, 'no'))).toBe('critical')
    const held = holdRequest(pending, { to: 'a@b.com', subject: 'More info', body: 'B' })
    expect(titles(held)).toBe('More information requested')
    expect(kinds(held)).toBe('user')
    expect(titles(resumeRequest(held))).toBe('Vendor information received')
    expect(
      titles(routeRequest(adminCase, { action: 'proceed', type: 'Partnership', reason: '' }))
    ).toBe('Routed as Partnership')
    expect(titles(routeRequest(adminCase, { action: 'proceed', type: 'M&A', reason: 'x' }))).toBe(
      'Routed as M&A'
    )
    const rejected = routeRequest(adminCase, { action: 'reject', reason: 'No' })
    expect(titles(rejected)).toBe('Rejected by Partnership Admin')
    expect(kinds(rejected)).toBe('critical')
  })

  it('starts a new case with its submission logged', () => {
    const c = buildCaseFromForm(form, 'PR-126', new Date(2026, 9, 22, 9, 5))
    expect(c.auditLog).toHaveLength(1)
    expect(c.auditLog[0]).toMatchObject({
      title: 'Partnership request submitted',
      actor: 'Dr. Omar (Vendor)',
      kind: 'user',
      timestamp: '22 Oct 2026, 09:05 AM',
    })
  })
})

describe('review stages', () => {
  const questions = [
    { id: 'q1', text: 'Q1?', cue: 'Cue', mandatory: true },
    { id: 'q2', text: 'Q2?', cue: 'Cue', mandatory: false },
  ]
  const people = INITIAL_PARTNERSHIP_REQUESTS[0].internalInterests!

  it('sends the Internal Interest request with the questions and resets reviewer status', () => {
    const next = sendReview(pending, 'internal', {
      members: people.slice(0, 3),
      questionnaire: { name: 'Technical Questionnaire', questions },
    })
    expect(next.sent).toEqual({ internal: true })
    expect(next.sentQuestionnaire?.questions).toHaveLength(2)
    // Everyone starts as Pending, with no decision, sponsor answer or response date
    expect(next.internalInterests?.map((m) => m.status)).toEqual(['Pending', 'Pending', 'Pending'])
    expect(
      next.internalInterests?.every(
        (m) =>
          m.answers === undefined &&
          m.decision === '-' &&
          m.sponsor === undefined &&
          m.responseDate === undefined
      )
    ).toBe(true)
    expect(next.auditLog.at(-1)).toMatchObject({
      title: 'Request sent to Internal Interest team',
      description: '3 reviewers asked to answer 2 questions.',
    })
  })

  it('sends the Strategy request and keeps the earlier send flag', () => {
    const first = sendReview(pending, 'internal', {
      members: people,
      questionnaire: { name: 'N', questions },
    })
    const next = sendReview(first, 'strategy', { members: [people[0]] })
    expect(next.sent).toEqual({ internal: true, strategy: true })
    expect(next.strategyTeamMembers).toHaveLength(1)
    expect(next.auditLog.at(-1)?.description).toBe(
      '1 reviewer asked to review the pre-read summary.'
    )
  })

  it('sends only once per team in the log', () => {
    const once = sendReview(pending, 'internal', {
      members: people,
      questionnaire: { name: 'N', questions },
    })
    const twice = sendReview(once, 'internal', {
      members: people,
      questionnaire: { name: 'N', questions },
    })
    expect(
      twice.auditLog.filter((e) => e.title.startsWith('Request sent to Internal'))
    ).toHaveLength(1)
  })

  it('records the Internal Interest answers and approves that stage', () => {
    const sent = sendReview(pending, 'internal', {
      members: people,
      questionnaire: { name: 'N', questions },
    })
    const answers = [
      { questionId: 'q1', question: 'Q1?', cue: 'Cue', answer: 'Yes' },
      { questionId: 'q2', question: 'Q2?', cue: 'Cue', answer: 'No' },
    ]
    const next = submitReview(sent, 'internal', { answers })
    expect(next.stageApprovals?.internal?.status).toBe('approved')
    expect(next.internalInterests?.[0]).toMatchObject({
      status: 'Completed',
      decision: 'Proceed',
      answers,
    })
    expect(next.internalInterests?.[1].status).toBe('Pending')
    expect(next.auditLog.at(-1)).toMatchObject({
      title: 'Internal Interest approved',
      kind: 'approval',
    })
    expect(next.auditLog.at(-1)?.description).toBe('2 questions answered.')
  })

  it('falls back to the default reviewers when none were stored (Strategy has none)', () => {
    const bare = { ...pending, internalInterests: undefined, strategyTeamMembers: undefined }
    const internal = submitReview(bare, 'internal', {})
    expect(internal.internalInterests).toHaveLength(5)
    expect(internal.auditLog.at(-1)?.description).toBe('0 questions answered.')
    const strategy = submitReview(bare, 'strategy', {})
    expect(strategy.strategyTeamMembers).toHaveLength(0)
    expect(strategy.auditLog.at(-1)?.description).toBe('Decision submitted.')
  })

  it('approves the Strategy stage unless the decision is Reject', () => {
    // There are no default Strategy reviewers, so the case brings its own
    const reviewer = INITIAL_PARTNERSHIP_REQUESTS.flatMap((r) => r.strategyTeamMembers ?? [])[0]!
    const approved = submitReview({ ...pending, strategyTeamMembers: [reviewer] }, 'strategy', {
      response: { finalDecision: 'Proceed', finalDecisionNote: 'If UAE hosting' },
    })
    expect(approved.stageApprovals?.strategy?.status).toBe('approved')
    expect(approved.strategyTeamMembers?.[0]).toMatchObject({
      status: 'Completed',
      decision: 'Proceed',
    })
    expect(approved.auditLog.at(-1)).toMatchObject({
      title: 'Strategy Team approved',
      kind: 'approval',
    })

    const declined = submitReview(pending, 'strategy', { response: { finalDecision: 'Reject' } })
    expect(declined.stageApprovals?.strategy?.status).toBe('declined')
    expect(declined.auditLog.at(-1)).toMatchObject({
      title: 'Strategy Team declined',
      kind: 'critical',
    })
  })
})

describe('buildInfoEmail', () => {
  it('starts an email to the vendor contact from the Director', () => {
    const email = buildInfoEmail(pending, 'Zaid Al Ali')
    expect(email.to).toBe(pending.companyInfo.email)
    expect(email.subject).toBe(
      `More information needed: ${pending.requestCode} ${pending.companyName}`
    )
    expect(email.body).toContain(`Hi ${pending.companyInfo.name},`)
    expect(email.body).toContain('Zaid Al Ali')
    expect(email.body).toContain('Information Requested')
  })
})

describe('applyInternalScenario', () => {
  const sent = sendReview(pending, 'internal', {
    members: INITIAL_PARTNERSHIP_REQUESTS[0].internalInterests!,
  })

  it('waits for the Director to close the case when no one responds', () => {
    const next = applyInternalScenario(sent, 'none')
    expect(next.status).not.toBe('Closed')
    expect(
      next.internalInterests?.every((m) => m.status === 'Pending' && m.sponsor === undefined)
    ).toBe(true)
    const closed = applyCaseAction(next, {
      type: 'closeCase',
      reason: 'No one from the Internal Interest team responded.',
    })
    expect(closed.status).toBe('Closed')
    expect(closed.closedReason).toMatch(/No one from the Internal Interest team responded/)
    expect(getStageLabel(closed)).toBe('Closed')
  })

  it('records decisions and sponsor answers separately, and waits when no one is ready', () => {
    const next = applyInternalScenario(sent, 'not-ready')
    const done = next.internalInterests!.filter((m) => m.status === 'Completed')
    expect(done).toHaveLength(2)
    expect(done.map((m) => m.decision)).toEqual(['Proceed', 'Reject'])
    expect(done.every((m) => m.sponsor === 'No' && m.responseDate)).toBe(true)
    expect(next.status).not.toBe('Closed')
    expect(next.sponsors).toBeUndefined()
  })

  it('approves the stage with that person as lead when one is ready', () => {
    const next = applyInternalScenario(sent, 'single')
    expect(next.sponsors).toEqual({ lead: next.internalInterests![0].name, co: [] })
    expect(next.stageApprovals?.internal?.status).toBe('approved')
    expect(next.internalInterests![0]).toMatchObject({ decision: 'Proceed', sponsor: 'Yes' })
    expect(next.internalInterests![1]).toMatchObject({ sponsor: 'No', status: 'Completed' })
  })

  it('leaves the lead and co-sponsors to the Director when several are ready', () => {
    const next = applyInternalScenario(sent, 'multiple')
    expect(next.internalInterests!.filter((m) => m.sponsor === 'Yes')).toHaveLength(3)
    expect(next.sponsors).toBeUndefined()
    expect(next.stageApprovals?.internal).toBeUndefined()
  })

  it('re-opens a closed case when another outcome is picked', () => {
    const closed = applyCaseAction(applyInternalScenario(sent, 'none'), {
      type: 'closeCase',
      reason: 'x',
    })
    const reopened = applyInternalScenario(closed, 'single')
    expect(reopened.status).toBe('In Progress')
    expect(reopened.closedReason).toBeUndefined()
    expect(reopened.stageApprovals?.internal?.status).toBe('approved')
  })
})

describe('signed NDA', () => {
  const awaiting = INITIAL_PARTNERSHIP_REQUESTS[1]

  it('keeps the unsigned template as version 1 and the signed copy as version 2', () => {
    const next = uploadSignedNda(awaiting, 'signed.pdf')
    expect(next.nda?.versions).toEqual([
      expect.objectContaining({ version: 1, signed: false }),
      expect.objectContaining({ version: 2, signed: true, fileName: 'signed.pdf' }),
    ])
    expect(next.alignmentPackOn).toBeDefined()
    expect(next.auditLog.map((e) => e.title).slice(-2)).toEqual([
      'Signed NDA uploaded',
      'Alignment pack generated',
    ])
  })

  it('adds later copies as new versions without generating the pack again', () => {
    const first = uploadSignedNda(awaiting, 'signed.pdf')
    const second = uploadSignedNda(first, 'signed_again.pdf')
    expect(second.nda?.versions).toHaveLength(3)
    expect(second.nda?.versions[2]).toMatchObject({ version: 3, signed: true })
    expect(second.alignmentPackOn).toBe(first.alignmentPackOn)
    expect(second.auditLog.filter((e) => e.title === 'Alignment pack generated')).toHaveLength(1)
  })
})

describe('discovery context and moving on', () => {
  const packed = uploadSignedNda(INITIAL_PARTNERSHIP_REQUESTS[1], 'signed.pdf')

  it('adds meeting notes, transcripts and recordings', () => {
    let next = addDiscoveryFile(packed, 'notes', 'notes.docx')
    next = addDiscoveryFile(next, 'transcripts', 'call.txt')
    next = addDiscoveryFile(next, 'recordings', 'call.mp4')
    expect(next.discovery?.notes[0].name).toBe('notes.docx')
    expect(next.discovery?.transcripts?.[0].name).toBe('call.txt')
    expect(next.discovery?.recordings[0].name).toBe('call.mp4')
    expect(next.auditLog.map((e) => e.title).slice(-3)).toEqual([
      'Meeting notes uploaded',
      'Transcript uploaded',
      'Recording uploaded',
    ])
  })

  it('moves on to Value & Due Diligence with or without any context, once', () => {
    const next = proceedToValue(packed)
    expect(next.discovery?.proceededOn).toBeDefined()
    expect(next.workflowStages.find((st) => st.id === 4)?.status).toBe('completed')
    expect(next.workflowStages.find((st) => st.id === 5)?.status).toBe('in_progress')
    expect(proceedToValue(next)).toBe(next)
  })
})

describe('split cases', () => {
  it('duplicates the case for every co-sponsor, linked to the original', () => {
    const parent = assignSponsors(INITIAL_PARTNERSHIP_REQUESTS[1], {
      lead: 'Riza Sayeed',
      co: ['Parag Agarwal', 'Najla Al Mansoori'],
    })
    const children = buildSplitCases(parent)
    expect(children.map((c) => c.requestCode)).toEqual([
      `${parent.requestCode}-A`,
      `${parent.requestCode}-B`,
    ])
    expect(children.map((c) => c.sponsors)).toEqual([
      { lead: 'Parag Agarwal', co: [] },
      { lead: 'Najla Al Mansoori', co: [] },
    ])
    expect(children.every((c) => c.splitFrom === parent.id && c.id !== parent.id)).toBe(true)
    expect(children[0].companyName).toBe(parent.companyName)
    expect(buildSplitCases(assignSponsors(parent, { lead: 'Riza Sayeed', co: [] }))).toEqual([])
  })
})

describe('sponsor final answer', () => {
  const atReport = {
    ...INITIAL_PARTNERSHIP_REQUESTS[2],
    value: { decision: { status: 'proceeded' as const, date: 'x' } },
  }

  it('fills in the TDD report once, without completing the case', () => {
    const next = generateTddReport(atReport)
    expect(next.value?.tddGeneratedOn).toBeTruthy()
    expect(next.value?.sponsoredOn).toBeUndefined()
    expect(generateTddReport(next)).toBe(next)
  })

  it('completes the case when the sponsor says yes', () => {
    const next = finalizeSponsorship(generateTddReport(atReport), true)
    expect(next.value?.sponsoredOn).toBeTruthy()
    expect(next.value?.finalDecision?.status).toBe('sponsored')
    expect(next.status).not.toBe('Closed')
    expect(next.auditLog[next.auditLog.length - 1].title).toBe('Partnership sponsored')
  })

  it('closes the case when the sponsor says no', () => {
    const next = finalizeSponsorship(generateTddReport(atReport), false)
    expect(next.status).toBe('Closed')
    expect(next.value?.sponsoredOn).toBeUndefined()
    expect(next.value?.finalDecision?.status).toBe('declined')
  })
})

describe('summary note', () => {
  const when = new Date('2026-10-22T09:00:00Z')

  it('seeds a use case summary on every seed case', () => {
    INITIAL_PARTNERSHIP_REQUESTS.forEach((r) => {
      expect(r.summaryNote?.html).toBeTruthy()
      expect(r.summaryNote?.updatedBy).toBe('Triage Agent')
    })
  })

  it('writes a summary for a new case from the form, flagging missing approvals', () => {
    const c = buildCaseFromForm(form, 'PR-126', when)
    expect(c.summaryNote).toEqual({
      html: expect.stringContaining('PulseAI Health: Deploy our triage model'),
      updatedBy: 'Triage Agent',
      updatedOn: '22 Oct 2026',
    })
    expect(c.summaryNote?.html).toContain(
      '<mark data-tone="positive">Approvals listed: FDA, CE.</mark>'
    )
    const none = buildCaseFromForm({ ...form, relevantApprovals: 'In progress' }, 'PR-1', when)
    expect(none.summaryNote?.html).toContain(
      '<mark data-tone="attention">No regulatory approvals listed.</mark>'
    )
  })

  it('saves an edited note with its editor, sanitised, and logs it', () => {
    const next = updateSummaryNote(
      pending,
      'Good <mark data-tone="critical">risk</mark><script>alert(1)</script><img src=x onerror=alert(1)>',
      { name: 'Leena Thomas', role: 'Strategy Team' }
    )
    expect(next.summaryNote?.html).toBe('Good <mark data-tone="critical">risk</mark>')
    expect(next.summaryNote?.updatedBy).toBe('Leena Thomas')
    expect(next.summaryNote?.updatedOn).toMatch(/^\d{2} \w{3} \d{4}$/)
    expect(next.auditLog.at(-1)).toMatchObject({
      title: 'Summary note updated',
      actor: 'Leena Thomas (Strategy Team)',
      kind: 'user',
    })
  })

  it('is reachable as a case action', () => {
    const next = applyCaseAction(pending, {
      type: 'summaryNote',
      html: 'Plain text',
      editor: { name: 'Nadia Al-Farsi', role: 'Partnership Admin' },
    })
    expect(next.summaryNote?.html).toBe('Plain text')
  })
})

describe('getStageProgress', () => {
  const byCode = (code: string) => INITIAL_PARTNERSHIP_REQUESTS.find((r) => r.requestCode === code)!

  it('places each seed case among the six stages', () => {
    expect(
      ['PR-125', 'PR-124', 'PR-123', 'PR-122', 'PR-121'].map((code) => [
        code,
        getStageProgress(byCode(code)),
      ])
    ).toEqual([
      [
        'PR-125',
        { label: 'Initial Assessment Brief', index: 1, total: 6, kind: 'active', reached: 1 },
      ],
      [
        'PR-124',
        { label: 'Initial Assessment Brief', index: 1, total: 6, kind: 'active', reached: 1 },
      ],
      ['PR-123', { label: 'Strategic Alignment', index: 3, total: 6, kind: 'active', reached: 3 }],
      ['PR-122', { label: 'Discovery Call', index: 5, total: 6, kind: 'active', reached: 5 }],
      ['PR-121', { label: 'Exited', index: null, total: 6, kind: 'exited', reached: 1 }],
    ])
  })

  it('keeps the label in step with getStageLabel', () => {
    INITIAL_PARTNERSHIP_REQUESTS.forEach((r) =>
      expect(getStageProgress(r).label).toBe(getStageLabel(r))
    )
  })

  it('remembers where a closed case stopped', () => {
    const closed = closeRequest(byCode('PR-123'), 'No sponsor')
    expect(getStageProgress(closed)).toMatchObject({
      label: 'Closed',
      kind: 'closed',
      index: null,
      reached: 3,
    })
  })

  it('has no position for routed cases', () => {
    const routed = routeRequest(byCode('PR-125'), {
      action: 'proceed',
      type: 'Procure',
      reason: '',
    })
    expect(getStageProgress(routed)).toMatchObject({
      label: 'Routed to Procurement',
      kind: 'routed',
      index: null,
    })
  })

  it('reaches Value & Due Diligence once discovery is handed over', () => {
    const atValue = proceedToValue(byCode('PR-122'))
    expect(getStageProgress(atValue)).toMatchObject({ index: 6, kind: 'active', reached: 6 })
  })
})

describe('editInternalAnswer', () => {
  const answers = [
    { questionId: 'q1', question: 'Problem?', cue: '', answer: 'Original one' },
    { questionId: 'q2', question: 'KPI?', cue: '', answer: 'Original two' },
  ]
  const submitted = submitReview(proceedRequest(pending, ''), 'internal', { answers })
  const member = submitted.internalInterests![0]

  it('keeps the original answer and appends the change with its reason', () => {
    const once = editInternalAnswer(
      submitted,
      member.id,
      'q2',
      'Better two',
      'Got the baseline',
      'Mariam Al-Zaabi'
    )
    const twice = editInternalAnswer(once, member.id, 'q2', 'Best two', 'Typo', 'Mariam Al-Zaabi')
    const q2 = twice.internalInterests![0].answers![1]
    expect(q2.answer).toBe('Original two')
    expect(q2.edits).toEqual([
      {
        answer: 'Better two',
        reason: 'Got the baseline',
        by: 'Mariam Al-Zaabi',
        on: expect.stringMatching(/^\d{2} \w{3} \d{4}$/),
      },
      { answer: 'Best two', reason: 'Typo', by: 'Mariam Al-Zaabi', on: expect.any(String) },
    ])
    expect(currentAnswer(q2)).toBe('Best two')
    expect(currentAnswer(twice.internalInterests![0].answers![0])).toBe('Original one')
    expect(twice.auditLog.at(-1)).toMatchObject({
      title: 'Internal Interest answer changed',
      description: 'Question 2: Typo',
      actor: 'Mariam Al-Zaabi (Internal Interest)',
    })
  })

  it('leaves the decision and sponsor answer as submitted', () => {
    const next = editInternalAnswer(submitted, member.id, 'q1', 'New', 'Why', 'Mariam Al-Zaabi')
    expect(next.internalInterests![0]).toMatchObject({
      decision: member.decision,
      sponsor: member.sponsor,
      responseDate: member.responseDate,
    })
  })

  it('needs a reason and a real change', () => {
    expect(editInternalAnswer(submitted, member.id, 'q1', 'New', '   ', 'Mariam Al-Zaabi')).toBe(
      submitted
    )
    expect(
      editInternalAnswer(submitted, member.id, 'q1', 'Original one', 'Why', 'Mariam Al-Zaabi')
    ).toBe(submitted)
    expect(editInternalAnswer(submitted, 'nobody', 'q1', 'New', 'Why', 'Mariam Al-Zaabi')).toBe(
      submitted
    )
  })

  it('is reachable as a case action', () => {
    const next = applyCaseAction(submitted, {
      type: 'editInternalAnswer',
      memberId: member.id,
      questionId: 'q1',
      answer: 'New',
      reason: 'Why',
      by: 'Mariam Al-Zaabi',
    })
    expect(currentAnswer(next.internalInterests![0].answers![0])).toBe('New')
  })
})

describe('getOverdueDays', () => {
  const today = new Date(2026, 9, 20) // 20 Oct 2026

  it('counts whole days a pending response is past its due date', () => {
    expect(getOverdueDays('2026-10-16', 'Pending', today)).toBe(4)
    expect(getOverdueDays('2026-10-19', 'Pending', today)).toBe(1)
  })

  it('is 0 on or before the due date, once answered, or without a date', () => {
    expect(getOverdueDays('2026-10-20', 'Pending', today)).toBe(0)
    expect(getOverdueDays('2026-10-24', 'Pending', today)).toBe(0)
    expect(getOverdueDays('2026-10-16', 'Completed', today)).toBe(0)
    expect(getOverdueDays(undefined, 'Pending', today)).toBe(0)
  })
})

describe('expressSponsorInterest', () => {
  const offer = {
    name: 'Rashid Al-Nuaimi',
    team: 'Sponsor',
    preference: 'Co-sponsor' as const,
    note: 'Owns the cardiology budget',
  }

  it('records the offer with the current stage and logs it', () => {
    const next = expressSponsorInterest(inProgress, offer)
    expect(next.sponsorInterests).toEqual([
      {
        ...offer,
        stage: getStageLabel(inProgress),
        on: expect.stringMatching(/^\d{2} \w{3} \d{4}$/),
      },
    ])
    expect(next.auditLog.at(-1)).toMatchObject({
      title: 'Sponsor interest expressed',
      actor: 'Rashid Al-Nuaimi (Sponsor)',
      kind: 'user',
    })
  })

  it('replaces an earlier offer from the same person', () => {
    const twice = expressSponsorInterest(expressSponsorInterest(inProgress, offer), {
      ...offer,
      preference: 'Lead',
    })
    expect(twice.sponsorInterests).toHaveLength(1)
    expect(twice.sponsorInterests![0].preference).toBe('Lead')
  })

  it('needs a team and a reason', () => {
    expect(expressSponsorInterest(inProgress, { ...offer, note: '  ' })).toBe(inProgress)
    expect(expressSponsorInterest(inProgress, { ...offer, team: '' })).toBe(inProgress)
  })
})

describe('buildCloseEmail', () => {
  const email = buildCloseEmail(
    inProgress,
    'Zaid Al Ali',
    '  The capability is already on our roadmap.  '
  )

  it('goes to the vendor with the case code in the subject', () => {
    expect(email.to).toBe(inProgress.companyInfo.email)
    expect(email.subject).toBe(`Update on your partnership request ${inProgress.requestCode}`)
  })

  it('is polite, includes the reason and is signed by the Director', () => {
    expect(email.body).toMatch(new RegExp(`^Hi ${inProgress.companyInfo.name},`))
    expect(email.body).toContain(`(${inProgress.requestCode})`)
    expect(email.body).toContain('The capability is already on our roadmap.')
    expect(email.body).not.toContain('  The capability')
    expect(email.body.endsWith('Kind regards,\nZaid Al Ali\nDirector, Partnerships\nM42')).toBe(
      true
    )
  })
})

describe('hasSignedNda', () => {
  const version = (n: number, signed: boolean) => ({
    version: n,
    signed,
    fileName: `nda-v${n}.pdf`,
    uploadedOn: '20 Oct 2026',
    uploadedBy: 'Zaid Al Ali',
  })

  it('is false with no NDA or only the unsigned template', () => {
    expect(hasSignedNda({ ...pending, nda: undefined })).toBe(false)
    expect(hasSignedNda({ ...pending, nda: { versions: [] } })).toBe(false)
    expect(hasSignedNda({ ...pending, nda: { versions: [version(1, false)] } })).toBe(false)
  })

  it('is true once a signed copy is on file', () => {
    expect(
      hasSignedNda({ ...pending, nda: { versions: [version(1, false), version(2, true)] } })
    ).toBe(true)
    expect(hasSignedNda(uploadSignedNda(pending, 'signed.pdf'))).toBe(true)
  })
})
