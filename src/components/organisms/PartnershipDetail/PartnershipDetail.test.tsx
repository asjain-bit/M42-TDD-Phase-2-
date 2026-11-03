import React from 'react'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { PartnershipDetail } from './PartnershipDetail'
import { applyCaseAction, currentAnswer, submitReview } from '@/lib/caseActions'
import { INITIAL_PARTNERSHIP_REQUESTS, type PartnershipRequest } from '@/types/partnership.types'

const profile = (id: string, roleTitle: string) => ({
  id,
  name: roleTitle,
  designation: roleTitle,
  email: `${id}@m42.ae`,
  roleTitle,
})
const internalProfile = profile('evaluator', 'Internal Interest Team')
const strategyProfile = profile('strategy-fit', 'Strategy Team')
const adminProfile = profile('partnership-admin', 'Partnership Admin')

/** AlphaHealth once Leena Thomas has decided */
const STRATEGY_DONE: PartnershipRequest = {
  ...INITIAL_PARTNERSHIP_REQUESTS[1],
  // The seeded Strategy reviewer who answered (there is no default reviewer any more)
  strategyTeamMembers: INITIAL_PARTNERSHIP_REQUESTS.flatMap((r) => r.strategyTeamMembers ?? [])
    .filter((m) => m.strategyResponse?.finalDecision)
    .slice(0, 1),
  stageApprovals: {
    internal: { status: 'approved', by: 'Mariam Al-Zaabi', date: 'Done' },
    strategy: { status: 'approved', by: 'Leena Thomas', date: 'Done' },
  },
}

/** GenomicX once the sponsor has moved it on and the business case is in */
const AT_VALUE: PartnershipRequest = {
  ...INITIAL_PARTNERSHIP_REQUESTS[2],
  discovery: { notes: [], transcripts: [], recordings: [], proceededOn: '17 Oct 2026' },
  value: {
    callConfirmedOn: '19 Oct 2026',
    businessCase: { name: 'case.pdf', uploadedOn: '20 Oct 2026', uploadedBy: 'Parag Agarwal' },
  },
}

describe('PartnershipDetail', () => {
  const mockRequest = INITIAL_PARTNERSHIP_REQUESTS[0]
  const adminCase = INITIAL_PARTNERSHIP_REQUESTS[4]
  const onBack = vi.fn()
  const onProceed = vi.fn()
  const onReject = vi.fn()
  const onRequestInfo = vi.fn()
  const onResume = vi.fn()
  const onRoute = vi.fn()
  const onLog = vi.fn()
  const onSendReview = vi.fn()
  const onSubmitReview = vi.fn()
  const onCaseAction = vi.fn()

  const renderDetail = (props: Partial<React.ComponentProps<typeof PartnershipDetail>> = {}) =>
    render(
      <PartnershipDetail
        request={mockRequest}
        allRequests={INITIAL_PARTNERSHIP_REQUESTS}
        onBack={onBack}
        onProceed={onProceed}
        onReject={onReject}
        onRequestInfo={onRequestInfo}
        onResume={onResume}
        onRoute={onRoute}
        onLog={onLog}
        onSendReview={onSendReview}
        onSubmitReview={onSubmitReview}
        onCaseAction={onCaseAction}
        animateAgentRun={false}
        {...props}
      />
    )

  /** A case the Director has approved, so Internal Canvas is open */
  const approved = (patch: Partial<PartnershipRequest> = {}): PartnershipRequest => ({
    ...mockRequest,
    status: 'In Progress',
    decision: { status: 'proceeded', reason: 'Strong fit' },
    ...patch,
  })

  const approvedBy = (team: 'internal' | 'strategy') => ({
    status: 'approved' as const,
    by: team,
    date: 'Just now',
  })

  const runTimers = (ms: number, times = 1) => {
    for (let i = 0; i < times; i++) {
      act(() => {
        vi.advanceTimersByTime(ms)
      })
    }
  }

  const stepper = () => within(screen.getByRole('navigation', { name: 'Review progress' }))

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('page layout', () => {
    it('shows the tabs directly under the back link, above the header card', () => {
      renderDetail()
      const back = screen.getByRole('button', { name: 'Back to Partnership Requests' })
      const tabs = screen.getByRole('tablist')
      const title = screen.getByRole('heading', { name: 'MedTech Innovations' })
      expect(back.compareDocumentPosition(tabs) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(tabs.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      // No Overview tab on any profile
      expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Review', 'Audit Log'])
    })

    it('shows a compact header card: vendor, location, referred by and submitted on', () => {
      renderDetail()
      const card = screen
        .getByRole('heading', { name: 'MedTech Innovations' })
        .closest('.rounded-2xl') as HTMLElement
      expect(within(card).getByText('Pending')).toBeInTheDocument()
      expect(within(card).getByText('Sarah Ahmed')).toBeInTheDocument()
      expect(within(card).getByText('UAE, Dubai')).toBeInTheDocument()
      expect(within(card).getByText('Referred by:')).toBeInTheDocument()
      expect(within(card).getByText('Submitted on:')).toBeInTheDocument()
      // No phone, email, founding year or separator line
      expect(card.textContent).not.toMatch(/@|\+971|Founded in/)
      expect(card.querySelector('.border-t')).toBeNull()
    })

    it('hides the vendor name and referrer from reviewers, who still see location and date', () => {
      renderDetail({ userProfile: internalProfile })
      expect(screen.queryByText('Referred by:')).not.toBeInTheDocument()
      expect(screen.queryByText('Sarah Ahmed')).not.toBeInTheDocument()
      expect(screen.getAllByText('UAE, Dubai').length).toBeGreaterThan(0)
      expect(screen.getByText('Submitted on:')).toBeInTheDocument()
    })

    it('shows no green decision banner once a decision is recorded', () => {
      const { unmount } = renderDetail({ request: approved() })
      expect(screen.queryByText('Status: Approved to Proceed')).not.toBeInTheDocument()
      expect(screen.queryByText(/Director Notes/)).not.toBeInTheDocument()
      unmount()
      renderDetail({
        request: {
          ...mockRequest,
          status: 'Exited',
          decision: { status: 'rejected', reason: 'No' },
        },
      })
      expect(screen.queryByText('Status: Request Rejected')).not.toBeInTheDocument()
    })

    it('shows the audit log with its colour legend and the case events, newest first', async () => {
      const user = userEvent.setup()
      renderDetail()
      await user.click(screen.getByRole('tab', { name: 'Audit Log' }))
      expect(screen.getByRole('heading', { name: 'Audit Log' })).toBeInTheDocument()
      expect(
        within(screen.getByRole('list', { name: 'Colour legend' })).getAllByRole('listitem')
      ).toHaveLength(4)
      const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
      expect(titles).toEqual([
        'Routed as Partnership',
        'Initial assessment brief generated',
        'Partnership request submitted',
      ])
    })

    it('triggers onBack', async () => {
      const user = userEvent.setup()
      renderDetail()
      await user.click(screen.getByRole('button', { name: 'Back to Partnership Requests' }))
      expect(onBack).toHaveBeenCalled()
    })
  })

  describe('thinking animation', () => {
    it('plays when a case is opened, then shows the brief and logs the analysis', () => {
      vi.useFakeTimers()
      renderDetail({
        animateAgentRun: true,
        request: { ...mockRequest, auditLog: [] },
      })
      expect(screen.getByText('ANALYZING')).toBeInTheDocument()
      // Simple: one line of progress, no checklist
      expect(screen.getByRole('status')).toHaveTextContent('Reading vendor form details…')
      expect(screen.queryByRole('list')).not.toBeInTheDocument()
      // Nothing else is on screen while the agent thinks
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Back to Partnership Requests' })
      ).not.toBeInTheDocument()
      expect(onLog).not.toHaveBeenCalled()

      runTimers(1500, 8)
      expect(screen.getByRole('tablist')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Agent Actions' })).toBeInTheDocument()
      expect(onLog).toHaveBeenCalledTimes(1)
      expect(onLog).toHaveBeenCalledWith(
        mockRequest.id,
        expect.objectContaining({
          key: `${mockRequest.id}-brief-generated`,
          title: 'Initial assessment brief generated',
          actor: 'Triage Agent',
          kind: 'agent',
        })
      )
    })

    it('also logs the risks it found', () => {
      vi.useFakeTimers()
      renderDetail({
        animateAgentRun: true,
        request: {
          ...mockRequest,
          overviewCards: { ...mockRequest.overviewCards, regulatory: 'Unclear' },
        },
      })
      runTimers(1500, 8)
      expect(onLog).toHaveBeenCalledTimes(2)
      expect(onLog).toHaveBeenLastCalledWith(
        mockRequest.id,
        expect.objectContaining({
          title: 'Risks identified',
          kind: 'critical',
          actor: 'Triage Agent',
        })
      )
    })

    it('is skipped for a case the Director has already decided', () => {
      renderDetail({ animateAgentRun: true, request: approved() })
      expect(screen.queryByText('ANALYZING')).not.toBeInTheDocument()
    })
  })

  describe('Director: Initial Assessment Brief', () => {
    it('shows the assessment summary, the brief sections and a plain steps list', () => {
      renderDetail()
      expect(
        stepper()
          .getAllByRole('button')
          .map((b) => b.textContent)
      ).toEqual([
        expect.stringContaining('Initial Assessment Brief'),
        expect.stringContaining('Internal Canvas'),
        expect.stringContaining('Strategic Alignment'),
        expect.stringContaining('NDA'),
        expect.stringContaining('Discovery Call'),
        expect.stringContaining('Value & Due Diligence'),
      ])
      ;[/Internal Canvas/, /Strategic Alignment/, /^NDA/, /Value & Due Diligence/].forEach((name) =>
        expect(stepper().getByRole('button', { name })).toBeDisabled()
      )
      expect(stepper().queryByRole('button', { name: /Approval/ })).not.toBeInTheDocument()

      expect(screen.getByRole('heading', { name: 'Assessment Summary' })).toBeInTheDocument()
      expect(screen.getByText('Points to proceed')).toBeInTheDocument()
      expect(screen.getByText('Triage Agent Analysis')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Company Information' })).toBeInTheDocument()
    })

    it('opens the Agent Actions drawer from the banner', async () => {
      const user = userEvent.setup()
      renderDetail()
      await user.click(screen.getByRole('button', { name: 'Agent Actions' }))
      const drawer = screen.getByRole('dialog', { name: 'Agent Actions' })
      expect(within(drawer).getByText('Duplicate check')).toBeInTheDocument()
      expect(within(drawer).queryByText('Passed')).not.toBeInTheDocument()
      await user.click(within(drawer).getByRole('button', { name: 'Close AI analysis' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('opens the vendor response with the eye icon button', async () => {
      const user = userEvent.setup()
      renderDetail()
      await user.click(screen.getByRole('button', { name: /View vendor response/i }))
      const dialog = screen.getByRole('dialog', { name: /Vendor Submission/i })
      expect(within(dialog).getByText('sarah@medtechinnovations.com')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Close' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('keeps only Next in a bar that stays in view', () => {
      renderDetail()
      const bar = screen.getByText(/Review the brief, then record your decision/).parentElement!
      expect(bar.className).toContain('sticky')
      expect(bar.className).toContain('bottom-0')
      expect(
        within(bar)
          .getAllByRole('button')
          .map((b) => b.textContent)
      ).toEqual(['Next'])
      // The decision is taken in a popup, not a form on the page
      expect(screen.queryByLabelText(/^Decision/)).not.toBeInTheDocument()
    })

    const decide = async (user: ReturnType<typeof userEvent.setup>, option: string) => {
      await user.click(screen.getByRole('button', { name: 'Next' }))
      const dialog = screen.getByRole('dialog', { name: 'Your decision' })
      await user.click(within(dialog).getByRole('radio', { name: new RegExp(`^${option}`) }))
      return dialog
    }

    it('proceeds from the Decision dropdown with an unlabelled reason, then opens Internal Canvas', async () => {
      const user = userEvent.setup()
      renderDetail()
      const dialog = await decide(user, 'Proceed')
      expect(within(dialog).getByLabelText('Reason')).toBeInTheDocument()
      expect(within(dialog).queryByText(/optional/i)).not.toBeInTheDocument()
      await user.type(within(dialog).getByLabelText(/^Reason/), 'Strong evidence')
      await user.click(within(dialog).getByRole('button', { name: 'Proceed' }))

      expect(onProceed).toHaveBeenCalledWith(mockRequest.id, 'Strong evidence')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: 'Internal Canvas' })).toBeInTheDocument()
      expect(stepper().getByRole('button', { name: /Strategic Alignment/ })).toBeDisabled()
      expect(
        screen.queryByText(/Review the brief, then record your decision/)
      ).not.toBeInTheDocument()
    })

    it('proceeds without any reason', async () => {
      const user = userEvent.setup()
      renderDetail()
      const dialog = await decide(user, 'Proceed')
      await user.click(within(dialog).getByRole('button', { name: 'Proceed' }))
      expect(onProceed).toHaveBeenCalledWith(mockRequest.id, '')
    })

    it('rejects at the brief through Close request: reason, then the email', async () => {
      const user = userEvent.setup()
      renderDetail()
      // The decision popup has no Reject any more
      await user.click(screen.getByRole('button', { name: 'Next' }))
      const decision = screen.getByRole('dialog', { name: 'Your decision' })
      expect(within(decision).queryByRole('radio', { name: /^Reject/ })).not.toBeInTheDocument()
      await user.click(within(decision).getByRole('button', { name: 'Close decision' }))

      await user.click(screen.getByRole('button', { name: 'Close request' }))
      const reason = screen.getByRole('dialog', { name: 'Close this request?' })
      const next = within(reason).getByRole('button', { name: 'Next' })
      expect(next).toBeDisabled()
      await user.type(
        within(reason).getByLabelText(/Reason for closing/),
        'Duplicate of an existing case'
      )
      await user.click(next)
      const email = screen.getByRole('dialog', { name: 'Email to the partner' })
      expect((within(email).getByLabelText('Message') as HTMLTextAreaElement).value).toContain(
        'Duplicate of an existing case'
      )
      await user.click(within(email).getByRole('button', { name: 'Send email and close' }))
      expect(onCaseAction).toHaveBeenCalledWith(
        mockRequest.id,
        expect.objectContaining({
          type: 'rejectWithEmail',
          reason: 'Duplicate of an existing case',
        })
      )
      expect(onProceed).not.toHaveBeenCalled()
    })

    it('has no decision section or footer once the brief has been decided', async () => {
      const user = userEvent.setup()
      renderDetail({
        request: {
          ...mockRequest,
          status: 'Exited',
          decision: { status: 'rejected', reason: 'Not a fit' },
        },
      })
      await user.click(stepper().getByRole('button', { name: /Initial Assessment Brief/ }))
      expect(screen.queryByRole('heading', { name: 'Your Decision' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
      expect(screen.queryByDisplayValue('Not a fit')).not.toBeInTheDocument()
    })
  })

  describe('Director: request more information', () => {
    it('shows the email template in the same popup and reports the request', async () => {
      const user = userEvent.setup()
      renderDetail()
      await user.click(screen.getByRole('button', { name: 'Next' }))
      const decision = screen.getByRole('dialog', { name: 'Your decision' })
      await user.click(within(decision).getByRole('radio', { name: 'Request more info' }))
      // The email template is in the same popup, with a copy button on each field
      expect(within(decision).getAllByRole('button', { name: /^Copy / })).toHaveLength(3)
      expect((within(decision).getByLabelText('Message') as HTMLTextAreaElement).value).toContain(
        'Hi Sarah Ahmed,'
      )
      await user.click(within(decision).getByRole('button', { name: 'Mark information requested' }))
      expect(onRequestInfo).toHaveBeenCalledWith(
        mockRequest.id,
        expect.objectContaining({ to: 'sarah@medtechinnovations.com' })
      )
      expect(onProceed).not.toHaveBeenCalled()
      expect(onReject).not.toHaveBeenCalled()
    })

    it('shows an information-requested case waiting for the vendor and resumes it', async () => {
      const user = userEvent.setup()
      renderDetail({
        request: {
          ...mockRequest,
          status: 'Information Requested',
          holdInfo: { requestedOn: '22 Oct 2026', to: 'a@b.com', subject: 'S', body: 'B' },
        },
      })
      expect(screen.getByText('Information requested: waiting for the vendor')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
      expect(stepper().getByRole('button', { name: /Internal Canvas/ })).toBeDisabled()
      await user.click(screen.getByRole('button', { name: 'Mark info received' }))
      expect(onResume).toHaveBeenCalledWith(mockRequest.id)
    })
  })

  describe('Director: Internal Canvas', () => {
    it('shows the reviewers without a questionnaire preview link', () => {
      renderDetail({ request: approved() })
      expect(
        screen.getByText(
          'Choose the Internal Interest reviewers and the questions they will answer, then send the request.'
        )
      ).toBeInTheDocument()
      expect(screen.getByText('Riza Sayeed')).toBeInTheDocument()
      expect(screen.getByText('Sara Malik')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Preview questions/i })).not.toBeInTheDocument()
      expect(screen.queryByText(/Reviewers answer 5 short questions/)).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /View member response/i })
      ).not.toBeInTheDocument()
    })

    it('lets the Director remove a respondent and add another', async () => {
      const user = userEvent.setup()
      renderDetail({ request: approved() })
      await user.click(screen.getAllByRole('button', { name: /Delete respondent/i })[0])
      await user.click(screen.getByRole('button', { name: 'Delete' }))
      expect(screen.queryByText('Riza Sayeed')).not.toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /Add Respondant/i }))
      await user.selectOptions(screen.getByRole('combobox'), 'cand-1')
      await user.type(screen.getByPlaceholderText(/Enter reason why/i), 'Clinical expertise.')
      const adds = screen.getAllByRole('button', { name: 'Add Respondant' })
      await user.click(adds[adds.length - 1])
      expect(screen.getByText('Dr. Mona Al Hashimi')).toBeInTheDocument()
    })

    it('sends the reviewers and the chosen questions, then waits for approval', async () => {
      const user = userEvent.setup()
      renderDetail({ request: approved() })
      await user.click(screen.getByRole('button', { name: 'Send Request' }))

      const dialog = screen.getByRole('dialog', { name: 'Select questionnaire' })
      await user.selectOptions(within(dialog).getByLabelText('Questionnaire'), 'technical')
      expect(within(dialog).queryByRole('checkbox', { name: 'Sara Malik' })).not.toBeInTheDocument()
      await user.click(within(dialog).getByRole('button', { name: 'Next' }))
      await user.click(within(dialog).getByRole('checkbox', { name: 'Sara Malik' }))
      await user.click(within(dialog).getByRole('button', { name: 'Send Request' }))

      expect(onSendReview).toHaveBeenCalledTimes(1)
      const [id, team, payload] = onSendReview.mock.calls[0]
      expect(id).toBe(mockRequest.id)
      expect(team).toBe('internal')
      expect(payload.members).toHaveLength(4)
      expect(payload.questionnaire.name).toBe('Technical Questionnaire')
      expect(payload.questionnaire.questions).toHaveLength(3)
      // The popup closes once sent
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      // The stage now waits: tracking layout, the simulation dropdown where the chip used to be
      expect(
        screen.queryByText('Awaiting approval', { selector: 'span.inline-flex' })
      ).not.toBeInTheDocument()
      expect(screen.getByLabelText(/Simulate the team/)).toBeInTheDocument()
      expect(stepper().getByRole('button', { name: /Internal Canvas/ })).toHaveTextContent(
        'Awaiting approval'
      )
      expect(screen.getAllByRole('columnheader', { name: 'Status' })).toHaveLength(1)
      expect(screen.queryByRole('button', { name: 'Send Request' })).not.toBeInTheDocument()
      expect(stepper().getByRole('button', { name: /Strategic Alignment/ })).toBeDisabled()
    })

    it('shows the reviewer finding animation once', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      renderDetail({ request: approved(), animateAgentRun: true })
      expect(screen.queryByText('ANALYZING')).not.toBeInTheDocument()
      expect(screen.getByText('Finding the Internal Interest team…')).toBeInTheDocument()
      expect(screen.queryByText('Riza Sayeed')).not.toBeInTheDocument()
      runTimers(1000, 4)
      expect(screen.getByText('Riza Sayeed')).toBeInTheDocument()
    })

    it('opens Strategic Alignment once the Internal Interest team has approved', async () => {
      const user = userEvent.setup()
      renderDetail({
        request: approved({
          sent: { internal: true },
          stageApprovals: { internal: approvedBy('internal') },
        }),
      })
      expect(stepper().getByRole('button', { name: /Internal Canvas/ })).toHaveTextContent(
        'Approved'
      )
      expect(stepper().getByRole('button', { name: /Strategic Alignment/ })).toBeEnabled()
      expect(
        screen.getByRole('heading', { level: 2, name: 'Strategic Alignment' })
      ).toBeInTheDocument()

      // The earlier stage keeps its tracking table, and the simulation stays until the next
      // stage has been sent
      await user.click(stepper().getByRole('button', { name: /Internal Canvas/ }))
      expect(screen.getByLabelText(/Simulate the team/)).toBeInTheDocument()
      expect(screen.getAllByRole('columnheader', { name: 'Decision' })).toHaveLength(1)
    })
  })

  describe('Director: Strategic Alignment', () => {
    const afterInternal = (patch: Partial<PartnershipRequest> = {}) =>
      approved({
        sent: { internal: true },
        stageApprovals: { internal: approvedBy('internal') },
        ...patch,
      })

    it('has one strategy member and sends its own request', async () => {
      const user = userEvent.setup()
      // The Director has picked Leena Thomas from + Add Member; nobody is preselected
      renderDetail({
        request: afterInternal({
          strategyTeamMembers: [
            {
              id: 'strat-2',
              name: 'Leena Thomas',
              initials: 'LT',
              role: 'Senior Strategy Manager',
              department: 'Strategy',
              expertise: 'Growth & Expansion',
              avatarColorBg: '#fce7f3',
              avatarColorText: '#9d174d',
              source: 'manual' as const,
            },
          ],
        }),
      })
      expect(
        screen.getByText('Choose the Strategy Team reviewers, then send the request.')
      ).toBeInTheDocument()
      expect(screen.getByText('Leena Thomas')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Add Member/i })).toBeEnabled()
      expect(screen.getByText('You can add up to 5 members.')).toBeInTheDocument()
      // Strategy members are added by the Director, never AI recommended
      expect(screen.queryByText('AI Recommended')).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Send Request' }))
      const dialog = screen.getByRole('dialog')
      expect(within(dialog).getByText('Send to the Strategy Team')).toBeInTheDocument()
      // The reviewers are not a choice: no checkbox, and there is no note
      expect(within(dialog).queryByRole('checkbox')).not.toBeInTheDocument()
      expect(within(dialog).queryByLabelText('Note to Strategy Team')).not.toBeInTheDocument()
      await user.click(within(dialog).getByRole('button', { name: 'Send Request' }))
      expect(onSendReview).toHaveBeenCalledWith(
        mockRequest.id,
        'strategy',
        expect.objectContaining({ members: [expect.objectContaining({ name: 'Leena Thomas' })] })
      )
      expect(
        screen.getByText('Awaiting approval', { selector: 'span.inline-flex' })
      ).toBeInTheDocument()
    })

    it('lets the Director replace the only strategy member', async () => {
      const user = userEvent.setup()
      // Nobody is preselected any more, so the case starts with the reviewer the Director picked
      const picked = INITIAL_PARTNERSHIP_REQUESTS.flatMap((r) => r.strategyTeamMembers ?? [])[0]!
      renderDetail({
        request: afterInternal({ strategyTeamMembers: [{ ...picked, status: undefined }] }),
      })
      await user.click(screen.getByRole('button', { name: /Delete respondent/i }))
      await user.click(screen.getByRole('button', { name: 'Delete' }))
      expect(screen.getByRole('button', { name: 'Send Request' })).toBeDisabled()
      await user.click(screen.getByRole('button', { name: /Add Member/i }))
      await user.selectOptions(screen.getByRole('combobox'), 'strat-2')
      await user.type(screen.getByPlaceholderText(/Enter reason why/i), 'Growth expertise.')
      const adds = screen.getAllByRole('button', { name: /Add Member/i })
      await user.click(adds[adds.length - 1])
      expect(screen.getByText('Leena Thomas')).toBeInTheDocument()
    })

    it('shows the Strategy Team approval, and a declined one', () => {
      const { unmount } = renderDetail({
        request: afterInternal({
          sent: { internal: true, strategy: true },
          stageApprovals: { internal: approvedBy('internal'), strategy: approvedBy('strategy') },
        }),
      })
      expect(stepper().getAllByText('Approved')).toHaveLength(2)
      unmount()

      renderDetail({
        request: afterInternal({
          sent: { internal: true, strategy: true },
          stageApprovals: {
            internal: approvedBy('internal'),
            strategy: { status: 'declined', by: 'x', date: 'Just now' },
          },
        }),
      })
      expect(stepper().getByRole('button', { name: /Strategic Alignment/ })).toHaveTextContent(
        'Declined'
      )
      expect(screen.getByText('Declined', { selector: 'span.inline-flex' })).toBeInTheDocument()
    })

    it('shows the reviewers’ own answers and the Strategy Team decision with its pre-read', async () => {
      const user = userEvent.setup()
      renderDetail({ request: STRATEGY_DONE })
      expect(stepper().getAllByText('Approved')).toHaveLength(2)
      await user.click(stepper().getByRole('button', { name: /Strategic Alignment/ }))

      // Strategy response: the decision, the reason and the pre-read summary
      await user.click(screen.getByRole('button', { name: /View member response/i }))
      expect(screen.getAllByText('Proceed').length).toBeGreaterThan(1)
      expect(screen.getAllByText(/vendor commits to UAE hosting/).length).toBeGreaterThan(0)
      expect(
        within(screen.getByRole('list', { name: 'Pre-read summary' })).getAllByRole('heading', {
          level: 3,
        })
      ).toHaveLength(6)
      expect(screen.getByText('Vendor_Security_Questionnaire.docx')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /Close modal/i }))

      // Internal response: the questions they were asked and their answers, same layout
      await user.click(stepper().getByRole('button', { name: /Internal Canvas/ }))
      await user.click(screen.getAllByRole('button', { name: /View member response/i })[0])
      expect(screen.getByText(/Sepsis is still recognised late/)).toBeInTheDocument()
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      expect(
        screen.getByText(
          'Which KPI would move, what is the baseline today, and what change would matter?'
        )
      ).toBeInTheDocument()
      expect(screen.queryByText(/Value and Need Statement/i)).not.toBeInTheDocument()
    })
  })

  describe('Partnership Admin', () => {
    it('shows every workflow stage, opens on the brief with the assessment summary', () => {
      renderDetail({ userProfile: adminProfile, request: adminCase })
      expect(stepper().getAllByRole('button')).toHaveLength(6)
      expect(screen.getByRole('heading', { name: 'Assessment Summary' })).toBeInTheDocument()
    })

    it('can open the later stages to read them, with no way to act in them', async () => {
      const user = userEvent.setup()
      renderDetail({ userProfile: adminProfile, request: INITIAL_PARTNERSHIP_REQUESTS[2] })
      await user.click(stepper().getByRole('button', { name: /Internal Canvas/ }))
      expect(screen.queryByRole('button', { name: 'Send Request' })).not.toBeInTheDocument()
      expect(screen.queryByText('Action required: decide where this case goes.')).toBeNull()
      await user.click(stepper().getByRole('button', { name: /^NDA/ }))
      expect(screen.getByRole('heading', { level: 2, name: 'NDA' })).toBeInTheDocument()
      // Read-only: nothing to acknowledge or upload. Proceed only moves on to the next stage.
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Upload signed NDA/ })).not.toBeInTheDocument()
      onCaseAction.mockClear()
      await user.click(screen.getByRole('button', { name: 'Proceed' }))
      expect(onCaseAction).not.toHaveBeenCalled()
      expect(screen.getByRole('heading', { level: 2, name: 'Discovery Call' })).toBeInTheDocument()
    })

    it('shows the admin checks in Agent Actions', async () => {
      const user = userEvent.setup()
      renderDetail({ userProfile: adminProfile, request: INITIAL_PARTNERSHIP_REQUESTS[2] })
      await user.click(screen.getByRole('button', { name: 'Agent Actions' }))
      const drawer = screen.getByRole('dialog', { name: 'Agent Actions' })
      ;[
        'Applicant history',
        'Duplicate check',
        'CoE backlog check',
        'Service line and KPI mapping',
        'Solution maturity scoring',
        'Vendor screening',
      ].forEach((title) => expect(within(drawer).getByText(title)).toBeInTheDocument())
      expect(within(drawer).getAllByText('Re-applying').length).toBeGreaterThan(0)
    })

    it('keeps Proceed and Reject in a bar that stays in view', () => {
      renderDetail({ userProfile: adminProfile, request: adminCase })
      const bar = screen.getByText('Action required: decide where this case goes.').parentElement!
      expect(bar.className).toContain('sticky')
      expect(bar.className).toContain('bottom-0')
      expect(within(bar).getByRole('button', { name: 'Proceed' })).toBeInTheDocument()
      expect(within(bar).getByRole('button', { name: 'Reject' })).toBeInTheDocument()
    })

    it('proceeds by choosing a request type, with an optional reason', async () => {
      const user = userEvent.setup()
      renderDetail({ userProfile: adminProfile, request: adminCase })
      await user.click(screen.getByRole('button', { name: 'Proceed' }))
      const dialog = screen.getByRole('dialog', { name: 'Proceed with this case' })
      const proceed = within(dialog).getByRole('button', { name: 'Proceed' })
      // The recommended type is already chosen
      expect(within(dialog).getByRole('button', { name: /Request type/ })).toHaveTextContent(
        'Partnership'
      )
      expect(proceed).toBeEnabled()
      await user.click(within(dialog).getByRole('button', { name: /Request type/ }))
      expect(
        within(dialog).getAllByLabelText('Partnership confidence High').length
      ).toBeGreaterThan(0)
      await user.click(
        within(dialog)
          .getByRole('option', { name: /Partnership/ })
          .querySelector('button')!
      )
      await user.click(proceed)
      // First routing needs no confirmation, and no reason is needed to proceed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(onRoute).toHaveBeenCalledWith(adminCase.id, {
        action: 'proceed',
        type: 'Partnership',
        reason: '',
      })
    })

    it('needs a reason to reject', async () => {
      const user = userEvent.setup()
      renderDetail({ userProfile: adminProfile, request: adminCase })
      await user.click(screen.getByRole('button', { name: 'Reject' }))
      const dialog = screen.getByRole('dialog', { name: 'Reject this case' })
      const reject = within(dialog).getByRole('button', { name: 'Reject request' })
      expect(reject).toBeDisabled()
      await user.type(within(dialog).getByLabelText(/^Reason/), 'Out of scope')
      await user.click(reject)
      expect(onRoute).toHaveBeenCalledWith(adminCase.id, {
        action: 'reject',
        type: undefined,
        reason: 'Out of scope',
      })
    })

    const routed = (type: 'Partnership' | 'Procure'): PartnershipRequest => ({
      ...adminCase,
      queue: type === 'Partnership' ? 'director' : 'routed',
      caseType: type,
      adminDecision: { action: 'proceed', type, reason: 'Original reason', date: 'Just now' },
    })

    it('shows the status as Approved with the type, and no green status banner', () => {
      renderDetail({
        userProfile: adminProfile,
        request: {
          ...routed('Partnership'),
          decision: { status: 'proceeded', reason: 'Approved by the Director' },
          status: 'In Progress',
        },
      })
      expect(screen.getByText('Approved')).toBeInTheDocument()
      expect(screen.getByText('Partnership')).toBeInTheDocument()
      expect(screen.queryByText('Status: Approved to Proceed')).not.toBeInTheDocument()
      expect(screen.queryByText(/Director Notes/)).not.toBeInTheDocument()
    })

    it('shows the status as Rejected', () => {
      renderDetail({
        userProfile: adminProfile,
        request: {
          ...adminCase,
          queue: 'closed',
          status: 'Exited',
          adminDecision: { action: 'reject', reason: 'No', date: 'Just now' },
        },
      })
      expect(screen.getByText('Rejected')).toBeInTheDocument()
    })

    /** Edit only reassigns the request type: no Proceed or Reject buttons */
    const reassign = async (user: ReturnType<typeof userEvent.setup>, type: RegExp) => {
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      const modal = screen.getByRole('dialog', { name: 'Reassign request type' })
      expect(
        within(modal).queryByRole('button', { name: 'Reject request' })
      ).not.toBeInTheDocument()
      expect(within(modal).queryByLabelText(/^Reason/)).not.toBeInTheDocument()
      await user.click(within(modal).getByRole('button', { name: /Request type/ }))
      await user.click(within(modal).getByRole('option', { name: type }).querySelector('button')!)
      await user.click(within(modal).getByRole('button', { name: 'Reassign' }))
    }

    it('confirms in the shared popup before moving a Partnership case out of the Director list', async () => {
      const user = userEvent.setup()
      renderDetail({ userProfile: adminProfile, request: routed('Partnership') })
      await reassign(user, /Procure/)

      const dialog = screen.getByRole('dialog', { name: 'Are you sure you want to confirm?' })
      // No from/to status summary, just the question, a note and two buttons
      expect(within(dialog).queryByText('From')).not.toBeInTheDocument()
      expect(within(dialog).queryByText('To')).not.toBeInTheDocument()
      expect(onRoute).not.toHaveBeenCalled()

      await user.click(within(dialog).getByRole('button', { name: 'Go back' }))
      expect(onRoute).not.toHaveBeenCalled()
    })

    it('confirms moving a routed case to the Director, keeping the earlier reason', async () => {
      const user = userEvent.setup()
      renderDetail({ userProfile: adminProfile, request: routed('Procure') })
      await reassign(user, /Partnership/)
      await user.click(screen.getByRole('button', { name: 'Confirm' }))
      expect(onRoute).toHaveBeenCalledWith(adminCase.id, {
        action: 'proceed',
        type: 'Partnership',
        reason: 'Original reason',
      })
    })

    it('keeps Reassign disabled until a different type is chosen', async () => {
      const user = userEvent.setup()
      renderDetail({ userProfile: adminProfile, request: routed('Partnership') })
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      const modal = screen.getByRole('dialog', { name: 'Reassign request type' })
      expect(within(modal).getByRole('button', { name: /Request type/ })).toHaveTextContent(
        'Partnership'
      )
      expect(within(modal).getByRole('button', { name: 'Reassign' })).toBeDisabled()
      // Picking the type it already has changes nothing
      await user.click(within(modal).getByRole('button', { name: /Request type/ }))
      await user.click(
        within(modal)
          .getByRole('option', { name: /Partnership/ })
          .querySelector('button')!
      )
      expect(within(modal).getByRole('button', { name: 'Reassign' })).toBeDisabled()
      await user.click(within(modal).getByRole('button', { name: /Request type/ }))
      await user.click(
        within(modal)
          .getByRole('option', { name: /Procure/ })
          .querySelector('button')!
      )
      expect(within(modal).getByRole('button', { name: 'Reassign' })).toBeEnabled()
    })

    it('opens the request type list as an overlay, without growing the popup', async () => {
      const user = userEvent.setup()
      renderDetail({ userProfile: adminProfile, request: routed('Partnership') })
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      const modal = screen.getByRole('dialog', { name: 'Reassign request type' })
      await user.click(within(modal).getByRole('button', { name: /Request type/ }))
      const list = within(modal).getByRole('listbox', { name: 'Request type' })
      expect(list.className).toContain('absolute')
      expect(modal.className).not.toContain('overflow-y-auto')
    })

    it('shows Edit as a primary button, after View vendor response', () => {
      renderDetail({ userProfile: adminProfile, request: routed('Partnership') })
      const edit = screen.getByRole('button', { name: 'Edit' })
      expect(edit.className).toContain('bg-[#36c0c9]')
      expect(edit.className).toContain('text-white')
      const view = screen.getByRole('button', { name: /View vendor response/i })
      expect(view.compareDocumentPosition(edit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      // Primary buttons carry no icon
      expect(edit.querySelector('svg')).toBeNull()
    })

    it('makes a recorded decision view-only, with Edit as the only way to change it', async () => {
      const user = userEvent.setup()
      renderDetail({ userProfile: adminProfile, request: routed('Partnership') })
      expect(screen.queryByRole('button', { name: 'Proceed' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Edit' }))
      // Still no Proceed or Reject buttons behind the popup
      expect(screen.queryByRole('button', { name: 'Proceed' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    })

    it('shows neither company details nor the action bar on the audit log', async () => {
      const user = userEvent.setup()
      renderDetail({ userProfile: adminProfile, request: adminCase })
      expect(screen.getByRole('heading', { name: adminCase.companyName })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Proceed' })).toBeInTheDocument()
      await user.click(screen.getByRole('tab', { name: 'Audit Log' }))
      expect(screen.queryByRole('heading', { name: adminCase.companyName })).not.toBeInTheDocument()
      expect(screen.queryByText('Referred by:')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Proceed' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Audit Log' })).toBeInTheDocument()
    })

    it('locks the decision once the Director has decided', () => {
      renderDetail({
        userProfile: adminProfile,
        request: {
          ...routed('Partnership'),
          status: 'In Progress',
          decision: { status: 'proceeded', reason: 'Approved' },
        },
      })
      expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Proceed' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument()
    })
  })

  describe('Internal Interest Team', () => {
    it('shows the workflow progress, with Continue in a fixed footer on the brief', async () => {
      const user = userEvent.setup()
      renderDetail({ userProfile: internalProfile })
      expect(
        stepper()
          .getAllByRole('button')
          .map((b) => b.textContent)
      ).toEqual([
        expect.stringContaining('Initial Assessment Brief'),
        expect.stringContaining('Internal Canvas'),
        expect.stringContaining('Strategic Alignment'),
        expect.stringContaining('NDA'),
        expect.stringContaining('Discovery Call'),
        expect.stringContaining('Value & Due Diligence'),
      ])
      // Only their own two stages open; the later ones show progress
      await user.click(stepper().getByRole('button', { name: /^NDA/ }))
      expect(screen.getByRole('heading', { name: 'Company Information' })).toBeInTheDocument()
      // No assessment summary and no vendor contact details
      expect(screen.queryByRole('heading', { name: 'Assessment Summary' })).not.toBeInTheDocument()
      expect(screen.queryByText('sarah@medtechinnovations.com')).not.toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /View vendor response/i }))
      expect(screen.queryByText('sarah@medtechinnovations.com')).not.toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Close' }))

      const next = screen.getByRole('button', { name: /Continue to Questionnaire/i })
      expect(next.parentElement?.className).toContain('sticky')
      expect(next.parentElement?.className).toContain('bottom-0')
    })

    it('fills every answer when one is clicked, then submits from a fixed footer into a view-only form', async () => {
      const user = userEvent.setup()
      renderDetail({ userProfile: internalProfile })
      await user.click(screen.getByRole('button', { name: /Continue to Questionnaire/i }))
      expect(screen.getByText('Internal Evaluation Questionnaire')).toBeInTheDocument()
      expect(screen.queryByText(/Research needed|Attachment/)).not.toBeInTheDocument()
      // Full width: nothing narrows the questions
      expect(
        screen
          .getByRole('heading', { name: /Internal Evaluation Questionnaire/ })
          .closest('.max-w-4xl')
      ).toBeNull()

      const boxes = screen.getAllByRole('textbox')
      expect(boxes).toHaveLength(5)
      const submit = screen.getByRole('button', { name: 'Submit' })
      expect(submit.parentElement?.className).toContain('sticky')
      expect(submit).toBeDisabled()
      expect(screen.getByText('0 of 5 mandatory answered')).toBeInTheDocument()

      await user.click(boxes[2])
      boxes.forEach((b) => expect(b).not.toHaveValue(''))
      expect(screen.getByText('5 of 5 mandatory answered')).toBeInTheDocument()
      expect(submit).toBeEnabled()
      // Clearing one answer disables Submit again
      await user.clear(boxes[0])
      expect(submit).toBeDisabled()
      await user.type(boxes[0], 'Our own answer')
      await user.click(submit)

      const confirm = screen.getByRole('dialog', { name: 'Submit questionnaire?' })
      expect(confirm).toHaveTextContent('You can still change an answer afterwards, with a reason')
      await user.click(within(confirm).getByRole('button', { name: 'Submit' }))
      expect(onSubmitReview).toHaveBeenCalledWith(
        mockRequest.id,
        'internal',
        expect.objectContaining({
          answers: expect.arrayContaining([
            expect.objectContaining({ questionId: 'q1', answer: 'Our own answer' }),
            expect.objectContaining({
              questionId: 'q2',
              answer: expect.stringContaining('Time to first antibiotic dose'),
            }),
          ]),
        })
      )
    })

    /** The case as it is once the reviewer has submitted, as the Dashboard stores it */
    const submittedCase = () =>
      submitReview(
        {
          ...mockRequest,
          status: 'In Progress',
          decision: { status: 'proceeded' },
          sent: { internal: true },
        },
        'internal',
        {
          answers: [
            { questionId: 'q1', question: 'Real problem?', cue: 'Describe it.', answer: 'First' },
            { questionId: 'q2', question: 'Which KPI?', cue: 'Baseline.', answer: 'Second' },
          ],
        }
      )

    it('shows the submitted answers when the case is opened again', async () => {
      const user = userEvent.setup()
      renderDetail({ userProfile: internalProfile, request: submittedCase() })
      await user.click(stepper().getByRole('button', { name: /Internal Canvas/ }))
      expect(screen.getByRole('status')).toHaveTextContent(
        /^Submitted on \d{2} \w{3} \d{4}\. You can still edit an answer; each change needs a reason and your original answer stays on record\.$/
      )
      expect(screen.getByText('First')).toBeInTheDocument()
      expect(screen.getByText('Second')).toBeInTheDocument()
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument()
      expect(screen.getAllByRole('button', { name: 'Edit answer' })).toHaveLength(2)
    })

    it('edits one answer at a time with a reason, keeping the original on record', async () => {
      const user = userEvent.setup()
      const request = submittedCase()
      const { rerender } = renderDetail({ userProfile: internalProfile, request })
      await user.click(stepper().getByRole('button', { name: /Internal Canvas/ }))
      await user.click(screen.getAllByRole('button', { name: 'Edit answer' })[1])

      // Only this card edits; the other Edit buttons step aside
      expect(screen.queryByRole('button', { name: 'Edit answer' })).not.toBeInTheDocument()
      const answer = screen.getByRole('textbox', { name: 'Which KPI?' })
      expect(answer).toHaveFocus()
      expect(answer).toHaveValue('Second')
      expect(answer).toHaveAttribute('maxLength', '600')
      expect(screen.getByText('6/600')).toBeInTheDocument()
      const reason = screen.getByRole('textbox', { name: 'Reason for change *' })
      expect(reason).toHaveAttribute('maxLength', '300')
      expect(reason).toHaveAttribute('placeholder', 'Why are you changing this answer?')
      const save = screen.getByRole('button', { name: 'Save change' })
      expect(save).toBeDisabled()

      await user.type(reason, 'Baseline confirmed')
      expect(save).toBeDisabled()
      await user.clear(answer)
      await user.type(answer, 'Second, with a baseline')
      expect(screen.getByText('18/300')).toBeInTheDocument()
      await user.click(save)

      const member = request.internalInterests![0]
      const action = {
        type: 'editInternalAnswer' as const,
        memberId: member.id,
        questionId: 'q2',
        answer: 'Second, with a baseline',
        reason: 'Baseline confirmed',
        by: 'Internal Interest Team',
      }
      expect(onCaseAction).toHaveBeenCalledWith(mockRequest.id, action)

      // The Dashboard applies it; the card shows the new answer and its history
      const edited = applyCaseAction(request, action)
      rerender(
        <PartnershipDetail
          request={edited}
          onBack={onBack}
          onProceed={onProceed}
          onReject={onReject}
          onCaseAction={onCaseAction}
          userProfile={internalProfile}
          animateAgentRun={false}
        />
      )
      expect(currentAnswer(edited.internalInterests![0].answers![1])).toBe(
        'Second, with a baseline'
      )
      expect(screen.getByText('Second, with a baseline')).toBeInTheDocument()
      expect(screen.getByText('Edited')).toBeInTheDocument()
      const toggle = screen.getByRole('button', { name: 'View original and changes (1)' })
      await user.click(toggle)
      const timeline = screen.getByRole('list', { name: 'Original answer and changes' })
      expect(within(timeline).getAllByRole('listitem')[0]).toHaveTextContent(
        /^Original · .*Second$/
      )
      expect(within(timeline).getAllByRole('listitem')[1]).toHaveTextContent(
        'Reason: Baseline confirmed'
      )
      // The decision stays as submitted
      expect(edited.internalInterests![0].decision).toBe(member.decision)
    })

    it('cancels an edit without saving', async () => {
      const user = userEvent.setup()
      renderDetail({ userProfile: internalProfile, request: submittedCase() })
      await user.click(stepper().getByRole('button', { name: /Internal Canvas/ }))
      await user.click(screen.getAllByRole('button', { name: 'Edit answer' })[0])
      await user.click(screen.getByRole('button', { name: 'Cancel' }))
      expect(onCaseAction).not.toHaveBeenCalledWith(
        mockRequest.id,
        expect.objectContaining({ type: 'editInternalAnswer' })
      )
      expect(screen.getAllByRole('button', { name: 'Edit answer' })).toHaveLength(2)
    })

    it('shows the Director the current answer and its history, read-only', async () => {
      const user = userEvent.setup()
      const request = applyCaseAction(submittedCase(), {
        type: 'editInternalAnswer',
        memberId: submittedCase().internalInterests![0].id,
        questionId: 'q1',
        answer: 'First, revised',
        reason: 'Clearer',
        by: 'Mariam Al-Zaabi',
      })
      renderDetail({ request })
      await user.click(stepper().getByRole('button', { name: /Internal Canvas/ }))
      await user.click(screen.getAllByRole('button', { name: /View member response/i })[0])
      expect(screen.getByText('First, revised')).toBeInTheDocument()
      expect(screen.getByText('Edited')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Edit answer' })).not.toBeInTheDocument()
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'View original and changes (1)' }))
      expect(screen.getByText('Reason: Clearer')).toBeInTheDocument()
    })

    it('answers exactly the questions the Director sent, and may skip optional ones', async () => {
      const user = userEvent.setup()
      renderDetail({
        userProfile: internalProfile,
        request: {
          ...mockRequest,
          sent: { internal: true },
          sentQuestionnaire: {
            name: 'Technical Questionnaire',
            version: 2,
            questions: [
              {
                id: 'x1',
                text: 'Which hospitals use it?',
                cue: 'Name the sites.',
                mandatory: true,
              },
              { id: 'x2', text: 'Anything else?', cue: 'Optional notes.', mandatory: false },
            ],
          },
        },
      })
      await user.click(screen.getByRole('button', { name: /Continue to Questionnaire/i }))
      expect(screen.getByText('Technical Questionnaire')).toBeInTheDocument()
      expect(screen.getByText('Which hospitals use it?')).toBeInTheDocument()
      expect(screen.getAllByRole('textbox')).toHaveLength(2)
      expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()
      await user.type(screen.getAllByRole('textbox')[0], 'Three UAE sites')
      expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled()
    })
  })

  describe('Strategy Team', () => {
    it('opens on the brief, with no animation, every workflow stage and a fixed Next', () => {
      renderDetail({ userProfile: strategyProfile, animateAgentRun: true })
      expect(screen.queryByText('ANALYZING')).not.toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Company Information' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Assessment Summary' })).not.toBeInTheDocument()
      expect(screen.queryByText('sarah@medtechinnovations.com')).not.toBeInTheDocument()
      expect(
        stepper()
          .getAllByRole('button')
          .map((b) => b.textContent)
      ).toEqual([
        expect.stringContaining('Initial Assessment Brief'),
        expect.stringContaining('Internal Canvas'),
        expect.stringContaining('Strategic Alignment'),
        expect.stringContaining('NDA'),
        expect.stringContaining('Discovery Call'),
        expect.stringContaining('Value & Due Diligence'),
      ])
      // Their own work and everything after it stays locked until the brief has been read
      ;[/Strategic Alignment/, /^NDA/, /Value & Due Diligence/].forEach((name) =>
        expect(stepper().getByRole('button', { name })).toBeDisabled()
      )
      expect(stepper().getByRole('button', { name: /Internal Canvas/ })).toBeEnabled()
      const bar = screen.getByRole('button', { name: 'Next' }).parentElement!
      expect(bar.className).toContain('sticky')
      expect(bar.className).toContain('bottom-0')
    })

    it('goes from Next to the Prepare Pre-read Summary screen, with nothing pre-selected', async () => {
      const user = userEvent.setup()
      renderDetail({ userProfile: strategyProfile })
      await user.click(screen.getByRole('button', { name: 'Next' }))
      expect(screen.getByRole('heading', { name: 'Prepare Pre-read Summary' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Skip/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
      expect(stepper().getByRole('button', { name: /Strategic Alignment/ })).toHaveAttribute(
        'aria-current',
        'step'
      )
      // The brief is still one click away in the stages
      await user.click(stepper().getByRole('button', { name: /Initial Assessment Brief/ }))
      expect(screen.getByRole('heading', { name: 'Company Information' })).toBeInTheDocument()
    })

    it('generates the pre-read with the simple animation under the stages, then decides', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      renderDetail({ userProfile: strategyProfile })
      await user.click(screen.getByRole('button', { name: 'Next' }))
      // The knowledge base already holds documents, shown before anything is uploaded
      expect(
        within(screen.getByRole('list', { name: 'Knowledge base documents' })).getAllByRole(
          'listitem'
        ).length
      ).toBeGreaterThan(0)
      await user.click(screen.getByRole('button', { name: /Generate Summary/ }))

      // The tabs and workflow stages stay; the animation sits below them
      expect(screen.getByText('GENERATING')).toBeInTheDocument()
      expect(screen.getByRole('navigation', { name: 'Review progress' })).toBeInTheDocument()
      expect(screen.getByRole('tablist')).toBeInTheDocument()
      expect(screen.queryByRole('list', { name: 'Pre-read summary' })).not.toBeInTheDocument()
      runTimers(1100, 8)

      expect(
        within(screen.getByRole('list', { name: 'Pre-read summary' })).getAllByRole('heading', {
          level: 3,
        })
      ).toHaveLength(6)
      const bar = screen.getByText(/Review the pre-read, then record your decision/).parentElement!
      expect(bar.className).toContain('sticky')
      expect(
        within(bar)
          .getAllByRole('button')
          .map((b) => b.textContent)
      ).toEqual(['Reject', 'Proceed'])

      // Reject needs a reason, then it is recorded
      await user.click(within(bar).getByRole('button', { name: 'Reject' }))
      const popup = screen.getByRole('dialog', { name: 'Reject this partnership' })
      const reject = within(popup).getByRole('button', { name: 'Reject partnership' })
      expect(reject).toBeDisabled()
      await user.type(within(popup).getByLabelText(/^Reason/), 'No UAE hosting')
      await user.click(reject)
      // The reason popup is the only step
      expect(screen.queryByRole('dialog', { name: 'Submit your decision?' })).toBeNull()
      expect(onSubmitReview).toHaveBeenCalledTimes(1)

      expect(onSubmitReview).toHaveBeenCalledWith(
        mockRequest.id,
        'strategy',
        expect.objectContaining({
          response: expect.objectContaining({
            finalDecision: 'Reject',
            finalDecisionNote: 'No UAE hosting',
          }),
        })
      )
      expect(screen.queryByText(/Review the pre-read, then record/)).not.toBeInTheDocument()
      expect(screen.getByText('Rejected')).toBeInTheDocument()
    })

    it('proceeds without a reason or a second popup, and records the documents added', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      renderDetail({ userProfile: strategyProfile })
      await user.click(screen.getByRole('button', { name: 'Next' }))
      await user.click(screen.getByRole('button', { name: 'Browse files' }))
      await user.upload(screen.getByLabelText('Supporting documents'), [
        new File(['x'], 'deck.pptx'),
        new File(['x'], 'plan.pdf'),
      ])
      await user.click(screen.getByRole('button', { name: 'Add documents' }))
      await user.click(screen.getByRole('button', { name: 'Remove plan.pdf' }))
      await user.click(screen.getByRole('button', { name: 'Remove M42_Roadmap_Register.xlsx' }))
      await user.click(screen.getByRole('button', { name: /Generate Summary/ }))
      runTimers(1100, 8)

      await user.click(screen.getByRole('button', { name: 'Proceed' }))
      await user.click(
        within(screen.getByRole('dialog', { name: 'Proceed with this partnership' })).getByRole(
          'button',
          { name: 'Proceed' }
        )
      )
      // No second popup: the decision is recorded straight away
      expect(screen.queryByRole('dialog', { name: 'Submit your decision?' })).toBeNull()
      expect(onSubmitReview).toHaveBeenCalledWith(
        mockRequest.id,
        'strategy',
        expect.objectContaining({
          response: expect.objectContaining({
            finalDecision: 'Proceed',
            finalDecisionNote: '',
            documents: expect.arrayContaining(['deck.pptx']),
          }),
        })
      )
      expect(screen.getByText('Proceeded')).toBeInTheDocument()
    })

    it('keeps everything after the decision view-only and locked until the Director acts', async () => {
      const user = userEvent.setup()
      renderDetail({ userProfile: strategyProfile, request: STRATEGY_DONE })
      // Even a decided case opens on the brief first
      expect(screen.getByRole('heading', { name: 'Company Information' })).toBeInTheDocument()
      await user.click(stepper().getByRole('button', { name: /Strategic Alignment/ }))
      expect(
        within(screen.getByRole('list', { name: 'Pre-read summary' })).getAllByRole('heading', {
          level: 3,
        })
      ).toHaveLength(6)
      expect(screen.queryByRole('button', { name: 'Proceed' })).not.toBeInTheDocument()
      expect(screen.getByText('Proceeded')).toBeInTheDocument()
      // The NDA stage opens only once the Director has uploaded the signed NDA
      expect(stepper().getByRole('button', { name: /^NDA/ })).toBeDisabled()
      expect(stepper().getByRole('button', { name: /Value & Due Diligence/ })).toBeDisabled()
      // The Internal Canvas is there to read, with no way to change it
      await user.click(stepper().getByRole('button', { name: /Internal Canvas/ }))
      expect(screen.queryByLabelText(/Simulate the team/)).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Send Request' })).not.toBeInTheDocument()
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('unlocks the NDA stage for viewing once the Director has signed, never showing the template', async () => {
      const user = userEvent.setup()
      renderDetail({
        userProfile: strategyProfile,
        request: INITIAL_PARTNERSHIP_REQUESTS[2],
      })
      expect(stepper().getByRole('button', { name: /^NDA/ })).toBeEnabled()
      expect(stepper().getByRole('button', { name: /Value & Due Diligence/ })).toBeDisabled()
      await user.click(stepper().getByRole('button', { name: /^NDA/ }))
      // The signed NDA, read-only; there is no alignment pack screen
      expect(screen.getByRole('heading', { name: 'Signed NDA' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Alignment Pack' })).not.toBeInTheDocument()
      expect(screen.queryByText('ADHDS-NDA-Execution-Form-v1.0.docx')).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /Download/ })).not.toBeInTheDocument()
      expect(screen.queryByText('Upload meeting notes')).not.toBeInTheDocument()
      // Proceed shows the discovery call, which waits for the Director
      await user.click(screen.getByRole('button', { name: 'Proceed' }))
      expect(screen.getByRole('heading', { name: 'Discovery Call' })).toBeInTheDocument()
      expect(
        screen.getByText(/Waiting for the Director to hold the discovery call/)
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled()
    })
  })

  describe('Sponsor', () => {
    const sponsorProfile = profile('sponsor', 'Sponsor')

    it('follows the same six steps as the Director, opening on the discovery call, not the vendor card', () => {
      renderDetail({ userProfile: sponsorProfile, request: INITIAL_PARTNERSHIP_REQUESTS[2] })
      expect(stepper().getAllByRole('button')).toHaveLength(6)
      // Opens where the case is: the discovery call, which waits for the Director
      expect(screen.getByRole('heading', { name: 'Discovery Call' })).toBeInTheDocument()
      // The vendor card only tops the first step
      expect(screen.queryByText('Referred by:')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Send Request' })).not.toBeInTheDocument()
      // Value & Due Diligence stays locked until the sponsor moves on
      expect(stepper().getByRole('button', { name: /Value & Due Diligence/ })).toBeDisabled()
    })

    it('shows the vendor card on the brief only, with Submitted on after Referred by', async () => {
      const user = userEvent.setup()
      renderDetail({ userProfile: sponsorProfile, request: INITIAL_PARTNERSHIP_REQUESTS[2] })
      await user.click(stepper().getByRole('button', { name: /Initial Assessment Brief/ }))
      const card = screen
        .getByRole('heading', { name: INITIAL_PARTNERSHIP_REQUESTS[2].companyName })
        .closest('.rounded-2xl') as HTMLElement
      const text = card.textContent ?? ''
      expect(text.indexOf('Referred by:')).toBeGreaterThan(-1)
      expect(text.indexOf('Submitted on:')).toBeGreaterThan(text.indexOf('Referred by:'))
    })

    it('has the sponsor wait for the Director before the value stage', () => {
      renderDetail({ userProfile: sponsorProfile, request: INITIAL_PARTNERSHIP_REQUESTS[2] })
      expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled()
      expect(screen.queryByLabelText('Upload transcripts')).toBeNull()
    })

    it('has the Director add transcripts after Next, skip the summary, and hand the case on', async () => {
      const user = userEvent.setup()
      renderDetail({ request: INITIAL_PARTNERSHIP_REQUESTS[2] })
      // The signed NDA and pack are behind it: the case opens on the discovery call
      expect(screen.getByRole('heading', { name: 'Discovery Call' })).toBeInTheDocument()
      await user.upload(screen.getByLabelText('Upload transcripts'), new File(['x'], 'call.vtt'))
      expect(screen.getByRole('list', { name: 'Transcripts to upload' })).toHaveTextContent(
        'call.vtt'
      )
      await user.click(screen.getByRole('button', { name: 'Skip' }))
      expect(onCaseAction).toHaveBeenCalledWith(INITIAL_PARTNERSHIP_REQUESTS[2].id, {
        type: 'proceedToValue',
      })
    })

    it('opens on the stage the case has reached, where the sponsor decides', () => {
      renderDetail({ userProfile: sponsorProfile, request: AT_VALUE })
      expect(
        screen.getByRole('heading', { level: 2, name: 'Value & Due Diligence' })
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Proceed' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument()
    })

    it('keeps the signed NDA view-only once the sponsor has moved on', async () => {
      const user = userEvent.setup()
      renderDetail({ userProfile: sponsorProfile, request: AT_VALUE })
      await user.click(stepper().getByRole('button', { name: /^NDA/ }))
      expect(screen.getByRole('heading', { name: 'Signed NDA' })).toBeInTheDocument()
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
      // Proceed opens the discovery call, then Next the value stage
      await user.click(screen.getByRole('button', { name: 'Proceed' }))
      expect(screen.getByRole('heading', { name: 'Discovery Call' })).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /Next/ }))
      expect(
        screen.getByRole('heading', { level: 2, name: 'Value & Due Diligence' })
      ).toBeInTheDocument()
    })

    it('sends the sponsor actions through onCaseAction', async () => {
      const user = userEvent.setup()
      renderDetail({
        userProfile: sponsorProfile,
        request: { ...AT_VALUE, value: { callConfirmedOn: '19 Oct 2026' } },
      })
      await user.upload(screen.getByLabelText('Upload business case'), new File(['x'], 'case.pdf'))
      expect(onCaseAction).toHaveBeenCalledWith(AT_VALUE.id, {
        type: 'businessCase',
        name: 'case.pdf',
      })
    })

    it('shows the Director the same stages, with the NDA actions but not the sponsor ones', async () => {
      const user = userEvent.setup()
      renderDetail({ request: AT_VALUE })
      expect(
        screen.getByRole('heading', { level: 2, name: 'Value & Due Diligence' })
      ).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Proceed' })).not.toBeInTheDocument()
      await user.click(stepper().getByRole('button', { name: /^NDA/ }))
      // Signed already: the signed NDA, with the acknowledgement ticked and locked
      expect(screen.getByRole('heading', { name: 'Signed NDA' })).toBeInTheDocument()
      expect(
        screen.getByRole('checkbox', {
          name: 'I acknowledge that the document has been signed by the vendor',
        })
      ).toBeDisabled()
      // Once signed, no new copy can be uploaded
      expect(screen.queryByRole('button', { name: 'Upload new version' })).not.toBeInTheDocument()
    })
  })

  describe('Moving on once the Strategy Team approves', () => {
    it('takes the Director from Strategic Alignment to NDA & Discovery', async () => {
      const user = userEvent.setup()
      const awaiting: PartnershipRequest = {
        ...INITIAL_PARTNERSHIP_REQUESTS[1],
        stageApprovals: { internal: STRATEGY_DONE.stageApprovals!.internal },
      }
      const { rerender } = renderDetail({ request: awaiting })
      expect(
        screen.getByRole('heading', { level: 2, name: 'Strategic Alignment' })
      ).toBeInTheDocument()
      rerender(
        <PartnershipDetail
          request={STRATEGY_DONE}
          allRequests={INITIAL_PARTNERSHIP_REQUESTS}
          onBack={onBack}
          onProceed={onProceed}
          onReject={onReject}
          animateAgentRun={false}
        />
      )
      // The Director first acknowledges the Strategy team's confirmation
      const ack = screen.getByRole('dialog', { name: 'Strategy team has proceeded' })
      expect(within(ack).queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
      await user.click(within(ack).getByRole('button', { name: 'Proceed' }))
      expect(screen.getByRole('heading', { level: 2, name: 'NDA' })).toBeInTheDocument()
    })

    it('opens the Strategy Team lead on the new case, with nothing decided yet', () => {
      renderDetail({
        userProfile: strategyProfile,
        request: INITIAL_PARTNERSHIP_REQUESTS[1],
      })
      expect(screen.getByRole('heading', { name: 'Company Information' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
    })
  })

  describe('Layout across the workflow stages', () => {
    it('shows the vendor card on the first step only, and the stages take its place later', async () => {
      const user = userEvent.setup()
      renderDetail({ request: STRATEGY_DONE })
      // STRATEGY_DONE opens on NDA & Discovery: no vendor card, the stages are on top
      expect(
        screen.queryByRole('heading', { name: STRATEGY_DONE.companyName })
      ).not.toBeInTheDocument()
      expect(screen.getByRole('navigation', { name: 'Review progress' })).toBeInTheDocument()
      await user.click(stepper().getByRole('button', { name: /Internal Canvas/ }))
      expect(
        screen.queryByRole('heading', { name: STRATEGY_DONE.companyName })
      ).not.toBeInTheDocument()
      await user.click(stepper().getByRole('button', { name: /Initial Assessment Brief/ }))
      expect(screen.getByRole('heading', { name: STRATEGY_DONE.companyName })).toBeInTheDocument()
    })

    it('puts Submitted on after Referred by in the card', () => {
      renderDetail()
      const card = screen
        .getByRole('heading', { name: 'MedTech Innovations' })
        .closest('.rounded-2xl') as HTMLElement
      const text = card.textContent ?? ''
      expect(text.indexOf('Submitted on:')).toBeGreaterThan(text.indexOf('Referred by:'))
    })

    it('fills the page height on the NDA stage so only its content scrolls', () => {
      const { container } = renderDetail({ request: STRATEGY_DONE })
      expect((container.firstChild as HTMLElement).className).toContain('h-[calc(100vh-6.75rem)]')
      expect((container.firstChild as HTMLElement).className).toContain('overflow-hidden')
    })
  })
})

describe('PartnershipDetail case notes', () => {
  it('has no case notes bar on the case page; notes open from the dashboard', () => {
    render(
      <PartnershipDetail
        request={INITIAL_PARTNERSHIP_REQUESTS[0]}
        onBack={vi.fn()}
        onProceed={vi.fn()}
        onReject={vi.fn()}
        userProfile={profile('director', 'Director')}
        animateAgentRun={false}
      />
    )
    expect(screen.queryByRole('region', { name: 'Case notes' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit notes' })).not.toBeInTheDocument()
  })
})
