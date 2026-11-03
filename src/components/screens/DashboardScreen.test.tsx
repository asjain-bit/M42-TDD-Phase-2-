import React, { useState } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from '@testing-library/react'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { DashboardScreen } from './DashboardScreen'
import { INITIAL_PARTNERSHIP_REQUESTS, type PartnershipRequest } from '@/types/partnership.types'

const directorProfile = {
  id: 'director',
  name: 'Zaid Al Ali',
  designation: 'Director',
  email: 'zaid.alali@m42.ae',
  roleTitle: 'Director',
}
const adminProfile = {
  id: 'partnership-admin',
  name: 'Nadia Al-Farsi',
  designation: 'Partnership Admin',
  email: 'nadia.alfarsi@m42.ae',
  roleTitle: 'Partnership Admin',
}

const internalProfile = {
  id: 'evaluator',
  name: 'Mariam Al-Zaabi',
  designation: 'Internal Interest Team',
  email: 'mariam.alzaabi@m42.ae',
  roleTitle: 'Internal Interest Team',
}
const strategyProfile = {
  id: 'strategy-fit',
  name: 'Omar Al-Hashemi',
  designation: 'Strategy Team',
  email: 'omar.alhashemi@m42.ae',
  roleTitle: 'Strategy Team',
}

/** The agent thinks for a few seconds when a case is opened: step through it */
const finishThinking = () => {
  for (let i = 0; i < 8; i++) {
    act(() => {
      vi.advanceTimersByTime(1500)
    })
  }
}

const setup = () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
}

/** The four KPI cards, in order, each with its label and supporting text */
const expectKpis = (cards: [string, string][]) => {
  const titles = cards.map(([title]) =>
    screen.getAllByText(title).find((el) => el.className.includes('uppercase'))!
  )
  titles.forEach((el, i) => {
    const card = el.closest('.rounded-2xl') as HTMLElement
    expect(within(card).getByText(cards[i][1])).toBeInTheDocument()
    expect(card.querySelector('.text-4xl')).toHaveTextContent(/^\d+$/)
  })
  const order = titles.map((t) => t.compareDocumentPosition(titles[(titles.indexOf(t) + 1) % 4]))
  expect(order.slice(0, 3).every((o) => o & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true)
}

describe('DashboardScreen', () => {
  afterEach(() => vi.useRealTimers())

  it('renders all 4 KPI cards matching Image 2 design without breadcrumb', () => {
    render(<DashboardScreen />)

    // Breadcrumb removed
    expect(screen.queryByText('M42 admin')).not.toBeInTheDocument()

    expectKpis([
      ['Pending', 'Waiting on your action.'],
      ['Completed', 'Completed this month.'],
      ['SLA Breached', 'Requests past their SLA.'],
      ['Closed', 'Closed or exited requests.'],
    ])
  })

  it('shows the Director the Case ID led table with the new columns', () => {
    render(<DashboardScreen />)

    expect(screen.getByText('Partnership Requests')).toBeInTheDocument()
    const headers = screen.getAllByRole('columnheader').map((h) => h.textContent)
    expect(headers).toEqual([
      'Case ID',
      'Company',
      'Solution description',
      'Status',
      'Stage',
      'Days in stage',
      'Owner',
      'SLA status',
      'Notes',
    ])
    expect(screen.queryByRole('columnheader', { name: 'Request ID' })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Vendor Name' })).not.toBeInTheDocument()

    expect(screen.getByText('PR-124')).toBeInTheDocument()
    const row = screen.getByText('MedTech Innovations').closest('tr')!
    expect(row).toHaveTextContent('Initial Assessment Brief')
    expect(row).toHaveTextContent('3 days')
    expect(row).toHaveTextContent('Zaid Al Ali')
    expect(row).toHaveTextContent('On track')
    // SLA is coloured text, not a chip; At Risk is not a status in the table
    expect(screen.getByText('At risk')).toHaveClass('text-[#d97706]')
    expect(screen.getByText('Breached')).toHaveClass('text-[#dc2626]')
    expect(screen.getAllByText('On track')[0]).toHaveClass('text-[#16a34a]')
    expect(within(row).getByText('Pending')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /At Risk/ })).not.toBeInTheDocument()
  })

  it('clamps the solution description to two lines and shows the full text in a tooltip', async () => {
    const user = userEvent.setup()
    render(<DashboardScreen />)
    const full = INITIAL_PARTNERSHIP_REQUESTS[0].assessmentAreas.productPlatformServiceDetails
    const cell = screen.getAllByLabelText(full)[0]
    expect(cell).toHaveClass('line-clamp-2')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    await user.hover(cell)
    expect(screen.getByRole('tooltip')).toHaveTextContent(full)
    await user.unhover(cell)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    act(() => cell.focus())
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    act(() => cell.blur())
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('only shows the Director cases the Partnership Admin has sent on', () => {
    render(<DashboardScreen userProfile={directorProfile} />)
    expect(screen.queryByText('NeuroLink Diagnostics')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /All requests/ })).toHaveTextContent('4')
    expect(screen.getByRole('button', { name: /RFI/ })).toHaveTextContent('0')
  })

  it('shows the Partnership Admin every case, including ones waiting for triage', () => {
    render(<DashboardScreen userProfile={adminProfile} />)
    const row = screen.getByText('NeuroLink Diagnostics').closest('tr')!
    expect(row).toHaveTextContent('PR-125')
    expect(row).toHaveTextContent('Unassigned')
    expect(row).toHaveTextContent('Initial Assessment Brief')
    expect(row).toHaveTextContent('Nadia Al-Farsi')
    expect(screen.getByRole('button', { name: /All requests/ })).toHaveTextContent('5')
    expectKpis([
      ['Pending', 'New requests to assess.'],
      ['Reviewed', 'Decisions recorded this month.'],
      ['Proceeded', 'Forwarded to Director.'],
      ['Closed', 'Closed at admin review.'],
    ])
  })

  it('searches by Case ID', async () => {
    const user = userEvent.setup()
    render(<DashboardScreen />)
    await user.type(screen.getByPlaceholderText('Search partnership requests...'), 'pr-122')
    expect(screen.getByText('GenomicX MENA FZ-LLC')).toBeInTheDocument()
    expect(screen.queryByText('MedTech Innovations')).not.toBeInTheDocument()
  })

  it('uses shared cases when given and reports changes', async () => {
    const user = setup()
    const onRequestsChange = vi.fn()
    render(
      <DashboardScreen
        userProfile={adminProfile}
        requests={[INITIAL_PARTNERSHIP_REQUESTS[4]]}
        onRequestsChange={onRequestsChange}
      />
    )
    expect(screen.getByText('NeuroLink Diagnostics')).toBeInTheDocument()
    expect(screen.queryByText('MedTech Innovations')).not.toBeInTheDocument()

    await user.click(screen.getByText('NeuroLink Diagnostics'))
    finishThinking()
    await user.click(screen.getByRole('button', { name: 'Reject' }))
    await user.type(screen.getByLabelText(/^Reason/), 'Out of scope')
    await user.click(screen.getByRole('button', { name: 'Reject request' }))

    // the agent's own work is logged, then the rejection
    expect(onRequestsChange).toHaveBeenCalledTimes(2)
    const apply = (call: number) =>
      (
        onRequestsChange.mock.calls[call][0] as (
          prev: typeof INITIAL_PARTNERSHIP_REQUESTS
        ) => typeof INITIAL_PARTNERSHIP_REQUESTS
      )([INITIAL_PARTNERSHIP_REQUESTS[4]])[0]
    expect(apply(0).auditLog.at(-1)?.title).toBe('Initial assessment brief generated')
    expect(apply(1)).toMatchObject({ queue: 'closed', status: 'Exited' })
  })

  it('filters records via search bar and filter chips', async () => {
    const user = userEvent.setup()
    render(<DashboardScreen />)

    // Table rows
    expect(screen.getByText('MedTech Innovations')).toBeInTheDocument()
    expect(screen.getByText('GenomicX MENA FZ-LLC')).toBeInTheDocument()

    // Search filter without search button
    const searchInput = screen.getByPlaceholderText('Search partnership requests...')
    await user.type(searchInput, 'CarePulse')
    expect(screen.getByText('CarePulse Technologies')).toBeInTheDocument()
    expect(screen.queryByText('MedTech Innovations')).not.toBeInTheDocument()

    // Clear search
    await user.clear(searchInput)

    // Filter chip for In Progress
    const inProgressChip = screen.getByRole('button', { name: /In Progress/i })
    await user.click(inProgressChip)
    expect(screen.getByText('AlphaHealth BioTech')).toBeInTheDocument()
    expect(screen.queryByText('MedTech Innovations')).not.toBeInTheDocument()
  })

  it('opens the case on the thinking animation, then the brief, and navigates back', async () => {
    const user = setup()
    render(<DashboardScreen />)

    await user.click(screen.getByText('MedTech Innovations'))
    expect(screen.getByText('ANALYZING')).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Review' })).not.toBeInTheDocument()

    finishThinking()
    expect(screen.getByRole('heading', { name: 'Initial Assessment Brief' })).toBeInTheDocument()

    // No Overview tab: only Review and Audit Log
    expect(screen.queryByRole('tab', { name: 'Overview' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Review', 'Audit Log'])

    await user.click(screen.getByRole('button', { name: 'Back to Partnership Requests' }))
    expect(screen.getByText('Partnership Requests')).toBeInTheDocument()
    expect(screen.getByText('MedTech Innovations')).toBeInTheDocument()
  })

  it('logs the agent analysis in the case audit log', async () => {
    const user = setup()
    render(<DashboardScreen />)
    await user.click(screen.getByText('MedTech Innovations'))
    finishThinking()
    await user.click(screen.getByRole('tab', { name: 'Audit Log' }))
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    // The seeded case already has its analysis logged, so it is not logged twice
    expect(titles.filter((t) => t === 'Initial assessment brief generated')).toHaveLength(1)
    expect(titles).toContain('Routed as Partnership')
  })

  it('takes a Director through approval, an information request and the Internal Canvas send', async () => {
    const user = setup()
    render(<DashboardScreen userProfile={directorProfile} />)
    await user.click(screen.getByText('MedTech Innovations'))
    finishThinking()

    // Request more info marks the case RFI until it is marked as received
    await user.click(screen.getByRole('button', { name: 'Next' }))
    let decision = screen.getByRole('dialog', { name: 'Your decision' })
    await user.click(within(decision).getByRole('radio', { name: 'Request more info' }))
    await user.click(within(decision).getByRole('button', { name: 'Mark information requested' }))
    expect(screen.getByText('Information requested: waiting for the vendor')).toBeInTheDocument()
    expect(screen.getAllByText('RFI').length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: 'Mark info received' }))
    expect(
      screen.queryByText('Information requested: waiting for the vendor')
    ).not.toBeInTheDocument()

    // Approve, then send the Internal Canvas request with its questions
    await user.click(screen.getByRole('button', { name: 'Next' }))
    decision = screen.getByRole('dialog', { name: 'Your decision' })
    await user.click(within(decision).getByRole('radio', { name: /^Proceed/ }))
    await user.type(within(decision).getByLabelText(/^Reason/), 'Strong fit.')
    await user.click(within(decision).getByRole('button', { name: 'Proceed' }))
    finishThinking()
    expect(screen.getByRole('heading', { level: 2, name: 'Internal Canvas' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Send Request' }))
    const send = screen.getByRole('dialog', { name: 'Select questionnaire' })
    await user.click(within(send).getByRole('button', { name: 'Next' }))
    await user.click(within(send).getByRole('button', { name: 'Send Request' }))
    // No extra confirmation: the popup closes and the tracking table is shown
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getAllByRole('columnheader', { name: 'Status' })).toHaveLength(1)

    // The stage now waits for the Internal Interest team, and the next stage stays locked. The
    // simulation dropdown sits where the awaiting-approval chip used to be.
    expect(
      screen.queryByText('Awaiting approval', { selector: 'span.inline-flex' })
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Simulate the team/)).toBeInTheDocument()
    // Everyone starts as Pending, with Sponsor and Response Date columns
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(
      expect.arrayContaining(['Status', 'Due', 'Decision', 'Sponsor', 'Response Date'])
    )
    const table = within(screen.getByRole('table'))
    expect(table.getAllByText('Pending')).toHaveLength(5)
    expect(table.queryByText('Completed')).not.toBeInTheDocument()
    const stepper = within(screen.getByRole('navigation', { name: 'Review progress' }))
    expect(stepper.getByRole('button', { name: /Strategic Alignment/ })).toBeDisabled()
    await user.click(screen.getByRole('tab', { name: 'Audit Log' }))
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(titles).toEqual(
      expect.arrayContaining([
        'Request sent to Internal Interest team',
        'Approved to proceed',
        'More information requested',
        'Vendor information received',
      ])
    )
  })

  it('opens the next stage once the Internal Interest team has approved', async () => {
    const user = setup()
    const approved = {
      ...INITIAL_PARTNERSHIP_REQUESTS[0],
      status: 'In Progress' as const,
      decision: { status: 'proceeded' as const, reason: 'ok' },
      sent: { internal: true },
      stageApprovals: {
        internal: { status: 'approved' as const, by: 'Mariam', date: 'Just now' },
      },
    }
    render(<DashboardScreen userProfile={directorProfile} requests={[approved]} />)
    await user.click(screen.getByText('MedTech Innovations'))

    // A case that is already past the brief skips the thinking animation and goes straight to
    // finding the Strategy team for the next stage
    expect(screen.queryByText('ANALYZING')).not.toBeInTheDocument()
    expect(screen.getByText('Finding the Strategy team…')).toBeInTheDocument()
    // The animation takes the whole page: only the tabs stay
    expect(screen.getByRole('tablist')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Review progress' })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Back to Partnership Requests' })
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'MedTech Innovations' })).not.toBeInTheDocument()
    finishThinking()
    const stepper = within(screen.getByRole('navigation', { name: 'Review progress' }))
    expect(stepper.getByRole('button', { name: /Internal Canvas/ })).toHaveTextContent('Approved')
  })

  it('renders Internal Interest Team KPI cards and excludes Vendor Name column', () => {
    const internalProfile = {
      id: 'evaluator',
      name: 'Mariam Al-Zaabi',
      designation: 'Internal Interest Team',
      email: 'mariam.alzaabi@m42.ae',
      roleTitle: 'Internal Interest Team',
    }
    render(<DashboardScreen userProfile={internalProfile} />)

    // Four KPI cards, scoped to the reviewer's own questionnaires
    expectKpis([
      ['Pending', 'Assigned questionnaires awaiting submission.'],
      ['Completed', 'Completed this month.'],
      ['Proceeded', 'Requests you responded to with Proceed.'],
      ['SLA Breached', 'Requests past their SLA.'],
    ])

    // Vendor Name column should NOT be rendered in outside table
    expect(screen.queryByRole('columnheader', { name: 'Vendor Name' })).not.toBeInTheDocument()
    // Other columns remain
    expect(screen.getByRole('columnheader', { name: 'Company name' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Solution' })).not.toBeInTheDocument()
  })

  it('renders Strategy Team KPI cards and excludes Vendor Name column', () => {
    const strategyProfile = {
      id: 'strategy-fit',
      name: 'Omar Al-Hashemi',
      designation: 'Strategy Team',
      email: 'omar.alhashemi@m42.ae',
      roleTitle: 'Strategy Team',
    }
    render(<DashboardScreen userProfile={strategyProfile} />)

    expectKpis([
      ['Pending', 'Strategic assessments awaiting your decision.'],
      ['Completed', 'Completed this month.'],
      ['Proceeded', 'Requests you responded to with Proceed.'],
      ['SLA Breached', 'Requests past their SLA.'],
    ])

    // Vendor Name column should NOT be rendered in outside table
    expect(screen.queryByRole('columnheader', { name: 'Vendor Name' })).not.toBeInTheDocument()
  })

  it('only shows reviewers the cases the Director has sent to their team', () => {
    const { unmount } = render(<DashboardScreen userProfile={internalProfile} />)
    expect(screen.queryByText('MedTech Innovations')).not.toBeInTheDocument()
    expect(screen.getByText('AlphaHealth BioTech')).toBeInTheDocument()
    expect(screen.getByText('GenomicX MENA FZ-LLC')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /All requests/ })).toHaveTextContent('2')
    unmount()

    const strategyOnly = {
      ...INITIAL_PARTNERSHIP_REQUESTS[0],
      sent: { strategy: true },
    }
    render(
      <DashboardScreen
        userProfile={strategyProfile}
        requests={[INITIAL_PARTNERSHIP_REQUESTS[0], strategyOnly, INITIAL_PARTNERSHIP_REQUESTS[1]]}
      />
    )
    expect(screen.getAllByText('MedTech Innovations')).toHaveLength(1)
    expect(screen.getByText('AlphaHealth BioTech')).toBeInTheDocument()
  })

  it('hides vendor details and the assessment summary for the internal team, who see the workflow progress', async () => {
    const user = setup()
    render(<DashboardScreen userProfile={internalProfile} />)

    await user.click(screen.getByText('AlphaHealth BioTech'))
    finishThinking()

    expect(screen.queryByText(/Referred by:/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Assessment Summary' })).not.toBeInTheDocument()

    // The workflow stages show progress, with no Director decision steps
    expect(screen.getByRole('navigation', { name: 'Review progress' })).toBeInTheDocument()

    // The brief has no decision form
    expect(screen.getByRole('button', { name: /Continue to Questionnaire/i })).toBeInTheDocument()
    expect(
      screen.queryByRole('radio', { name: /Approve for internal review/i })
    ).not.toBeInTheDocument()
  })

  const openStrategyCase = () => {
    const open = INITIAL_PARTNERSHIP_REQUESTS.map((r) =>
      r.id === 'req-002' ? { ...r, stageApprovals: undefined } : r
    )
    render(<DashboardScreen userProfile={strategyProfile} requests={open} />)
  }

  it('opens the strategy team on the brief, with no animation and the workflow stages', async () => {
    const user = setup()
    openStrategyCase()
    await user.click(screen.getByText('AlphaHealth BioTech'))
    expect(screen.queryByText('ANALYZING')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Company Information' })).toBeInTheDocument()
    const stepper = within(screen.getByRole('navigation', { name: 'Review progress' }))
    expect(stepper.getAllByRole('button').map((b) => b.textContent)).toEqual([
      expect.stringContaining('Initial Assessment Brief'),
      expect.stringContaining('Internal Canvas'),
      expect.stringContaining('Strategic Alignment'),
      expect.stringContaining('NDA'),
      expect.stringContaining('Discovery Call'),
      expect.stringContaining('Value & Due Diligence'),
    ])
    expect(stepper.getByRole('button', { name: /Strategic Alignment/ })).toBeDisabled()
    expect(stepper.getByRole('button', { name: /^NDA/ })).toBeDisabled()
    // A fixed footer with a Next button
    const bar = screen.getByRole('button', { name: 'Next' }).parentElement!
    expect(bar.className).toContain('sticky')
  })

  it('walks the strategy team from the brief through the documents screen to a confirmed decision', async () => {
    const user = setup()
    openStrategyCase()
    await user.click(screen.getByText('AlphaHealth BioTech'))
    await user.click(screen.getByRole('button', { name: 'Next' }))

    // The screen before the pre-read is generated
    expect(screen.getByRole('heading', { name: 'Prepare Pre-read Summary' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Review progress' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Browse files' }))
    const popup = screen.getByRole('dialog', { name: 'Add supporting documents' })
    await user.upload(
      within(popup).getByLabelText('Supporting documents'),
      new File(['x'], 'extra.pptx')
    )
    await user.click(within(popup).getByRole('button', { name: 'Add documents' }))
    await user.click(screen.getByRole('button', { name: /Generate Summary/ }))

    // The simple animation runs with the workflow stages above it
    expect(screen.getByText('GENERATING')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Review progress' })).toBeInTheDocument()
    finishThinking()

    expect(
      within(screen.getByRole('list', { name: 'Pre-read summary' })).getAllByRole('heading', {
        level: 3,
      })
    ).toHaveLength(6)
    expect(screen.getByText('extra.pptx', { selector: 'span' })).toBeInTheDocument()
    // Workflow stages stay visible so the brief can be revisited
    expect(screen.getByRole('navigation', { name: 'Review progress' })).toBeInTheDocument()

    // Fixed bar with Reject and Proceed; both confirm before recording
    await user.click(screen.getByRole('button', { name: 'Proceed' }))
    const decision = screen.getByRole('dialog', { name: 'Proceed with this partnership' })
    expect(within(decision).queryByText(/optional/i)).not.toBeInTheDocument()
    await user.click(within(decision).getByRole('button', { name: 'Proceed' }))
    expect(screen.queryByRole('dialog', { name: 'Submit your decision?' })).toBeNull()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument()
    expect(screen.getByText('Proceeded')).toBeInTheDocument()
  })

  it('does not display Exited status or Exited filter chip to internal and strategy teams', () => {
    const internalProfile = {
      id: 'evaluator',
      name: 'Mariam Al-Zaabi',
      designation: 'Internal Interest Team',
      email: 'mariam.alzaabi@m42.ae',
      roleTitle: 'Internal Interest Team',
    }
    render(<DashboardScreen userProfile={internalProfile} />)

    // Exited filter chip should not be present
    expect(screen.queryByRole('button', { name: /^Exited/i })).not.toBeInTheDocument()
  })
})

const sponsorProfile = {
  id: 'sponsor',
  name: 'Rashid Al-Nuaimi',
  designation: 'Sponsor',
  email: 'rashid.alnuaimi@m42.ae',
  roleTitle: 'Sponsor',
}

/** Keeps the cases in state so changes made in the case view show up */
const Shared = ({
  profile,
  initial,
}: {
  profile: typeof directorProfile
  initial: PartnershipRequest[]
}) => {
  const [requests, setRequests] = useState(initial)
  return (
    <DashboardScreen userProfile={profile} requests={requests} onRequestsChange={setRequests} />
  )
}

/** MedTech approved by the Director and sent to the Internal Interest team */
const sentToInternal: PartnershipRequest = {
  ...INITIAL_PARTNERSHIP_REQUESTS[0],
  status: 'In Progress',
  decision: { status: 'proceeded', reason: 'ok' },
  sent: { internal: true },
}

/** The Strategy reviewer the Director picked from + Add Member (nobody is preselected) */
const LEENA = {
  id: 'strat-2',
  name: 'Leena Thomas',
  initials: 'LT',
  role: 'Senior Strategy Manager',
  department: 'Strategy',
  expertise: 'Growth & Expansion',
  avatarColorBg: '#fce7f3',
  avatarColorText: '#9d174d',
  source: 'manual' as const,
}

const openCase = async (user: ReturnType<typeof setup>, name = 'MedTech Innovations') => {
  await user.click(screen.getByText(name))
  finishThinking()
}

const simulate = (user: ReturnType<typeof setup>, option: string) =>
  user.selectOptions(screen.getByLabelText(/Simulate the team/), option)

/** Close request: the reason comes pre-filled, then the email to the partner is sent */
const sendCloseRequest = async (user: ReturnType<typeof setup>) => {
  const reason = screen.getByRole('dialog', { name: 'Close this request?' })
  await user.click(within(reason).getByRole('button', { name: 'Next' }))
  const email = screen.getByRole('dialog', { name: 'Email to the partner' })
  await user.click(within(email).getByRole('button', { name: 'Send email and close' }))
}

describe('Internal Interest outcomes', () => {
  afterEach(() => vi.useRealTimers())

  it('shows a prototype-only dropdown in the header, above the table', async () => {
    const user = setup()
    render(<Shared profile={directorProfile} initial={[sentToInternal]} />)
    await openCase(user)
    const select = screen.getByLabelText(/Simulate the team/)
    expect(screen.getAllByRole('option', { name: /./ }).length).toBeGreaterThanOrEqual(5)
    expect(screen.getByRole('tooltip')).toHaveTextContent(
      'only for prototype functioning and will not be included in the actual developed application'
    )
    expect(
      select.compareDocumentPosition(screen.getByRole('table')) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    // No awaiting-approval chip next to the title
    expect(
      screen.queryByText('Awaiting approval', { selector: 'span.inline-flex' })
    ).not.toBeInTheDocument()
  })

  it('asks to close the case when no one responds, and keeps the dropdown to try the others', async () => {
    const user = setup()
    render(<Shared profile={directorProfile} initial={[sentToInternal]} />)
    await openCase(user)
    await simulate(user, 'none')
    // A popup says nobody responded; Close request goes through the reason and the email
    const popup = screen.getByRole('dialog', { name: 'Nobody responded' })
    expect(within(popup).getByRole('button', { name: 'Keep open' })).toBeInTheDocument()
    await user.click(within(popup).getByRole('button', { name: 'Close request' }))
    expect(screen.getByLabelText(/reason/i)).toHaveValue(
      'No one from the Internal Interest team responded.'
    )
    await sendCloseRequest(user)
    expect(
      screen.getByText('This case was closed: No one from the Internal Interest team responded.')
    ).toBeInTheDocument()
    expect(screen.getAllByText('Closed').length).toBeGreaterThan(0)
    expect(screen.queryByText('Exited')).not.toBeInTheDocument()
    // Still available, and picking another outcome re-opens the case
    expect(screen.getByLabelText(/Simulate the team/)).toBeEnabled()
    await simulate(user, 'single')
    await user.click(
      within(screen.getByRole('dialog', { name: 'Ready to sponsor' })).getByRole('button', {
        name: 'Proceed',
      })
    )
    expect(screen.queryByText(/This case was closed/)).not.toBeInTheDocument()
  })

  it('separates the decision from the sponsor answer, with a response date', async () => {
    const user = setup()
    render(<Shared profile={directorProfile} initial={[sentToInternal]} />)
    await openCase(user)
    await simulate(user, 'not-ready')
    await user.click(
      within(screen.getByRole('dialog', { name: 'No one is ready to sponsor' })).getByRole(
        'button',
        { name: 'Keep open' }
      )
    )
    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1)
    const cells = (i: number) =>
      within(rows[i])
        .getAllByRole('cell')
        .map((c) => c.textContent)
    // Status, Due, Decision, Sponsor, Response Date
    expect(cells(0)[1]).toBe('Completed')
    expect(cells(0)[2]).not.toBe('-')
    expect(cells(0)[3]).toBe('Proceed')
    expect(cells(0)[4]).toBe('No')
    expect(cells(0)[5]).not.toBe('-')
    expect(cells(1)[3]).toBe('Reject')
    expect(cells(2)[1]).toBe('Pending')
    expect(cells(2).slice(3, 6)).toEqual(['-', '-', '-'])
  })

  it('asks before closing when someone responds but no one is ready to sponsor', async () => {
    const user = setup()
    render(<Shared profile={directorProfile} initial={[sentToInternal]} />)
    await openCase(user)
    await simulate(user, 'not-ready')
    const confirm = screen.getByRole('dialog', { name: 'No one is ready to sponsor' })
    expect(confirm).toHaveTextContent(
      'No one from the Internal Interest team is ready to sponsor this request.'
    )
    await user.click(within(confirm).getByRole('button', { name: 'Keep open' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await simulate(user, 'not-ready')
    await user.click(
      within(screen.getByRole('dialog', { name: 'No one is ready to sponsor' })).getByRole(
        'button',
        { name: 'Close request' }
      )
    )
    await sendCloseRequest(user)
    expect(
      screen.getByText(
        /This case was closed: No one from the Internal Interest team is ready to sponsor/
      )
    ).toBeInTheDocument()
  })

  it('says who is ready to sponsor, then opens Strategic Alignment whichever way the popup is closed', async () => {
    const user = setup()
    render(<Shared profile={directorProfile} initial={[sentToInternal]} />)
    await openCase(user)
    await simulate(user, 'single')
    const popup = screen.getByRole('dialog', { name: 'Ready to sponsor' })
    expect(popup).toHaveTextContent('Riza Sayeed is ready to sponsor this request.')
    expect(popup).toHaveTextContent('Moving to the Strategic Alignment stage')
    expect(within(popup).queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    await user.click(within(popup).getByRole('button', { name: 'Proceed' }))
    expect(screen.getByText('Finding the Strategy team…')).toBeInTheDocument()
    finishThinking()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Strategic Alignment' })
    ).toBeInTheDocument()
    const stepper = within(screen.getByRole('navigation', { name: 'Review progress' }))
    expect(stepper.getByRole('button', { name: /Internal Canvas/ })).toHaveTextContent('Approved')
    expect(stepper.getAllByRole('button')).toHaveLength(6)
  })

  it('also opens Strategic Alignment when the popup is closed with the X', async () => {
    const user = setup()
    render(<Shared profile={directorProfile} initial={[sentToInternal]} />)
    await openCase(user)
    await simulate(user, 'single')
    await user.click(screen.getByRole('button', { name: 'Close dialog' }))
    finishThinking()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Strategic Alignment' })
    ).toBeInTheDocument()
  })

  it('asks the Director to assign the lead and co-sponsors when several are ready', async () => {
    const user = setup()
    render(<Shared profile={directorProfile} initial={[sentToInternal]} />)
    await openCase(user)
    await simulate(user, 'multiple')
    // The response is acknowledged first, then the sponsors are assigned
    const ack = screen.getByRole('dialog', { name: 'Internal Interest has responded' })
    await user.click(within(ack).getByRole('button', { name: 'Proceed' }))
    const popup = screen.getByRole('dialog', { name: 'Assign sponsors' })
    await user.click(within(popup).getByRole('radio', { name: /Parag Agarwal/ }))
    await user.click(within(popup).getByRole('checkbox', { name: 'Riza Sayeed' }))
    await user.click(within(popup).getByRole('button', { name: 'Assign sponsors' }))
    finishThinking()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Strategic Alignment' })
    ).toBeInTheDocument()
    await user.click(
      within(screen.getByRole('navigation', { name: 'Review progress' })).getByRole('button', {
        name: /Internal Canvas/,
      })
    )
    expect(screen.getByText('Lead sponsor:').parentElement).toHaveTextContent(
      /Lead sponsor: Parag Agarwal.*Co-sponsors: Riza Sayeed/
    )
  })

  it('shows the Strategy Team approval and its conditions as soon as the request is sent', async () => {
    const user = setup()
    render(
      <Shared
        profile={directorProfile}
        initial={[{ ...sentToInternal, strategyTeamMembers: [LEENA] }]}
      />
    )
    await openCase(user)
    await simulate(user, 'single')
    await user.click(
      within(screen.getByRole('dialog', { name: 'Ready to sponsor' })).getByRole('button', {
        name: 'Proceed',
      })
    )
    finishThinking()
    await user.click(screen.getByRole('button', { name: 'Send Request' }))
    const popup = screen.getByRole('dialog', { name: 'Send to the Strategy Team' })
    // One reviewer, Leena Thomas, with nothing to tick
    expect(within(popup).getByText('Leena Thomas')).toBeInTheDocument()
    expect(within(popup).queryByRole('checkbox')).not.toBeInTheDocument()
    await user.click(within(popup).getByRole('button', { name: 'Send Request' }))
    // Approved: the Director acknowledges it, then the NDA stage follows
    await user.click(
      within(screen.getByRole('dialog', { name: 'Strategy team has proceeded' })).getByRole(
        'button',
        { name: 'Proceed' }
      )
    )
    expect(screen.getByRole('heading', { level: 2, name: 'NDA' })).toBeInTheDocument()
    await user.click(
      within(screen.getByRole('navigation', { name: 'Review progress' })).getByRole('button', {
        name: /Strategic Alignment/,
      })
    )
    expect(screen.getByText('Approval: Proceed')).toBeInTheDocument()
    expect(
      screen.getByText(/Conditions: Proceed on the condition that the vendor commits to UAE/)
    ).toBeInTheDocument()
    const stepper = within(screen.getByRole('navigation', { name: 'Review progress' }))
    expect(stepper.getByRole('button', { name: /Strategic Alignment/ })).toHaveTextContent(
      'Approved'
    )
  })
})

describe('NDA & Discovery, Value and the Sponsor profile', () => {
  afterEach(() => vi.useRealTimers())

  it('takes the Director from the NDA template, through the signed copy, to the Discovery Call', async () => {
    const user = setup()
    const approved = INITIAL_PARTNERSHIP_REQUESTS.map((r) =>
      r.id === 'req-002'
        ? {
            ...r,
            stageApprovals: {
              ...r.stageApprovals,
              strategy: { status: 'approved' as const, by: 'Leena Thomas', date: 'Done' },
            },
          }
        : r
    )
    render(<Shared profile={directorProfile} initial={approved} />)
    await openCase(user, 'AlphaHealth BioTech')
    expect(screen.getByRole('heading', { level: 2, name: 'NDA' })).toBeInTheDocument()
    // The template shows as a file card
    expect(screen.getByText('ADHDS-NDA-Execution-Form-v1.0.docx')).toBeInTheDocument()
    await user.click(
      screen.getByRole('checkbox', {
        name: 'I acknowledge that the document has been signed by the vendor',
      })
    )
    await user.click(screen.getByRole('button', { name: /Upload signed NDA/ }))
    await user.upload(screen.getByLabelText('Signed NDA file'), new File(['x'], 'signed.pdf'))
    await user.click(screen.getByRole('button', { name: 'Upload' }))

    // The signed copy is version 2, with the template kept as version 1
    expect(screen.getByRole('heading', { name: 'Signed NDA' })).toBeInTheDocument()
    expect(screen.getByLabelText('NDA version')).toHaveValue('2')
    // Proceed goes straight to the Discovery Call; there is no alignment pack screen
    await user.click(screen.getByRole('button', { name: 'Proceed' }))
    expect(screen.queryByRole('heading', { name: 'Alignment Pack' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Discovery Call' })).toBeInTheDocument()
    // The Director adds context (or skips) and hands the case to the sponsor
    await user.click(screen.getByRole('button', { name: 'Skip' }))
    expect(
      screen.getByRole('heading', { level: 2, name: 'Value & Due Diligence' })
    ).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Audit Log' }))
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(titles).toEqual(expect.arrayContaining(['Signed NDA uploaded']))
  })

  it('shows the Sponsor only the cases they sponsor, with their own KPI cards', () => {
    render(<DashboardScreen userProfile={sponsorProfile} />)
    expect(screen.getByText('AlphaHealth BioTech')).toBeInTheDocument()
    expect(screen.getByText('GenomicX MENA FZ-LLC')).toBeInTheDocument()
    expect(screen.queryByText('MedTech Innovations')).not.toBeInTheDocument()
    expectKpis([
      ['Pending', 'Waiting on your action.'],
      ['Completed', 'Sponsored this month.'],
      ['SLA Breached', 'Requests past their SLA.'],
      ['Closed', 'Closed or exited requests.'],
    ])
  })

  it('keeps the value stage locked for the Sponsor until the Director hands the case on', async () => {
    const user = setup()
    render(<Shared profile={sponsorProfile} initial={[...INITIAL_PARTNERSHIP_REQUESTS]} />)
    await user.click(screen.getByText('GenomicX MENA FZ-LLC'))
    const stepper = within(screen.getByRole('navigation', { name: 'Review progress' }))
    expect(stepper.getAllByRole('button')).toHaveLength(6)
    expect(stepper.getByRole('button', { name: /Value & Due Diligence/ })).toBeDisabled()
    // The case is at the discovery call, which is the Director's
    expect(screen.getByRole('heading', { name: 'Discovery Call' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled()
    expect(
      screen.getByText(/Waiting for the Director to hold the discovery call/)
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Upload meeting notes, transcript or recording')).toBeNull()
  })

  it('has the Sponsor decide on the business case, get the TDD report and sponsor', async () => {
    const user = setup()
    const atValue = INITIAL_PARTNERSHIP_REQUESTS.map((r) =>
      r.id === 'req-003'
        ? {
            ...r,
            discovery: { notes: [], transcripts: [], recordings: [], proceededOn: '17 Oct 2026' },
            value: {
              callConfirmedOn: '19 Oct 2026',
              businessCase: { name: 'case.pdf', uploadedOn: '20 Oct', uploadedBy: 'Parag Agarwal' },
            },
          }
        : r
    )
    render(<Shared profile={sponsorProfile} initial={atValue} />)
    await user.click(screen.getByText('GenomicX MENA FZ-LLC'))
    const stepper = within(screen.getByRole('navigation', { name: 'Review progress' }))
    expect(
      screen.getByRole('heading', { level: 2, name: 'Value & Due Diligence' })
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Proceed' }))
    await user.click(
      within(screen.getByRole('dialog', { name: 'Proceed with this partnership' })).getByRole(
        'button',
        { name: 'Proceed' }
      )
    )
    // One popup only: the decision is recorded and the agent fills in the TDD report
    expect(screen.queryByRole('dialog', { name: 'Submit your decision?' })).toBeNull()
    expect(screen.getByText('GENERATING')).toBeInTheDocument()
    finishThinking()
    expect(screen.getByRole('list', { name: 'TDD report' })).toBeInTheDocument()
    // The sponsor's final answer completes the stage
    await user.click(screen.getByRole('button', { name: 'Yes, sponsor' }))
    await user.click(
      within(screen.getByRole('dialog', { name: 'Sponsor this partnership?' })).getByRole(
        'button',
        { name: 'Yes, sponsor' }
      )
    )
    expect(stepper.getByRole('button', { name: /Value & Due Diligence/ })).toHaveTextContent(
      'Completed'
    )
  })

  it('shows the Sponsor the signed NDA read-only, with no template and no alignment pack', async () => {
    const user = setup()
    render(<Shared profile={sponsorProfile} initial={[...INITIAL_PARTNERSHIP_REQUESTS]} />)
    await user.click(screen.getByText('GenomicX MENA FZ-LLC'))
    await user.click(
      within(screen.getByRole('navigation', { name: 'Review progress' })).getByRole('button', {
        name: /^NDA/,
      })
    )
    expect(screen.queryByRole('heading', { name: 'Alignment Pack' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Signed NDA' })).toBeInTheDocument()
    expect(screen.queryByText('ADHDS-NDA-Execution-Form-v1.0.docx')).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Download/ })).not.toBeInTheDocument()
  })
})

describe('Table filters and pagination', () => {
  const many = Array.from({ length: 9 }, (_, i) => ({
    ...INITIAL_PARTNERSHIP_REQUESTS[0],
    id: `m-${i}`,
    requestCode: `PR-${200 + i}`,
    companyName: `Company ${String.fromCharCode(65 + i)}`,
    daysInStage: i,
  }))

  it('shows 7 rows a page with pagination after that', async () => {
    const user = setup()
    render(<DashboardScreen userProfile={directorProfile} requests={many} />)
    expect(screen.getAllByRole('row')).toHaveLength(8)
    expect(screen.getByText('Showing 1–7 of 9')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next page' }))
    expect(screen.getAllByRole('row')).toHaveLength(3)
    expect(screen.getByText('Showing 8–9 of 9')).toBeInTheDocument()
  })

  it('filters by stage and SLA status, and sorts', async () => {
    const user = setup()
    const mixed = many.map((r, i) =>
      i === 0 ? { ...r, status: 'In Progress' as const, slaStatus: 'Breached' as const } : r
    )
    render(<DashboardScreen userProfile={directorProfile} requests={mixed} />)
    await user.click(screen.getByRole('button', { name: /Filters/ }))
    await user.selectOptions(screen.getByLabelText('Stage'), 'Internal Canvas')
    expect(screen.getAllByRole('row')).toHaveLength(2)
    await user.selectOptions(screen.getByLabelText('Stage'), 'all')
    await user.selectOptions(screen.getByLabelText('SLA status'), 'Breached')
    expect(screen.getAllByRole('row')).toHaveLength(2)
    expect(screen.getByText('Company A')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear all' }))
    await user.selectOptions(screen.getByLabelText('Sort by'), 'days')
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Company I')
  })

  it('offers only the five statuses as chips', () => {
    render(<DashboardScreen userProfile={directorProfile} />)
    const chips = screen
      .getAllByRole('button')
      .map((b) => b.textContent ?? '')
      .filter((t) => /^(All requests|Pending|In Progress|Completed|Closed|RFI)\d/.test(t))
    expect(chips).toHaveLength(6)
  })

  it('shows a Closed request with a red chip', () => {
    const closed = { ...INITIAL_PARTNERSHIP_REQUESTS[0], status: 'Closed' as const }
    render(<DashboardScreen userProfile={directorProfile} requests={[closed]} />)
    const row = screen.getByText('MedTech Innovations').closest('tr')!
    const chips = within(row).getAllByText('Closed')
    expect(chips.some((c) => c.closest('[class*="c5221f"]') !== null)).toBe(true)
  })
})

describe('Case notes panel on the Dashboard', () => {
  const sponsorProfile = {
    id: 'sponsor',
    name: 'Rashid Al-Nuaimi',
    designation: 'Sponsor',
    email: 'rashid.alnuaimi@m42.ae',
    roleTitle: 'Sponsor',
  }

  /** The Dashboard with shared state, exposing the latest cases */
  const renderShared = (profile: typeof directorProfile) => {
    const state = { latest: INITIAL_PARTNERSHIP_REQUESTS }
    const Shared = () => {
      const [requests, setRequests] = useState<PartnershipRequest[]>(INITIAL_PARTNERSHIP_REQUESTS)
      state.latest = requests
      return (
        <DashboardScreen userProfile={profile} requests={requests} onRequestsChange={setRequests} />
      )
    }
    render(<Shared />)
    return state
  }

  it('opens the case on a row click, and the notes panel from the Notes button only', async () => {
    const user = userEvent.setup()
    renderShared(directorProfile)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open notes for MedTech Innovations' }))
    // Still on the table, with the card over it
    expect(screen.getByPlaceholderText('Search partnership requests...')).toBeInTheDocument()
    const card = screen.getByRole('dialog', { name: 'MedTech Innovations' })
    expect(within(card).getByText('PR-124')).toBeInTheDocument()

    await user.click(within(card).getByRole('button', { name: 'Close notes' }))
    // Closes after its short closing motion
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.queryByRole('region', { name: 'Case notes' })).not.toBeInTheDocument()

    // A plain row click opens the case, as before
    await user.click(screen.getByText('MedTech Innovations'))
    expect(screen.queryByPlaceholderText('Search partnership requests...')).not.toBeInTheDocument()
  })

  it('lets the Director edit the key notes in the card, with an audit event', async () => {
    const user = userEvent.setup()
    const state = renderShared(directorProfile)
    await user.click(screen.getByRole('button', { name: 'Open notes for MedTech Innovations' }))
    const card = screen.getByRole('dialog', { name: 'MedTech Innovations' })
    await user.click(within(card).getByRole('button', { name: 'Edit' }))
    const editor = within(card).getByRole('textbox', { name: 'Edit key notes' })
    editor.innerHTML = 'Pilot <mark data-tone="critical">blocked on hosting</mark>'
    await user.click(within(card).getByRole('button', { name: 'Save' }))

    expect(screen.getByText('Notes saved.')).toBeInTheDocument()
    expect(within(card).getByText('blocked on hosting')).toHaveAttribute('data-tone', 'critical')
    expect(within(card).getByText(/Last updated by/)).toHaveTextContent(
      /Last updated by Zaid Al Ali on \d{2} \w{3} \d{4}/
    )
    const saved = state.latest.find((r) => r.requestCode === 'PR-124')!
    expect(saved.auditLog.at(-1)).toMatchObject({
      title: 'Summary note updated',
      actor: 'Zaid Al Ali (Director)',
    })
  })

  it('lets every profile on the dashboard edit the key notes', async () => {
    const user = userEvent.setup()
    for (const profile of [adminProfile, internalProfile, strategyProfile, sponsorProfile]) {
      const { unmount } = render(<DashboardScreen userProfile={profile} />)
      await user.click(screen.getAllByRole('button', { name: /^Open notes for/ })[0])
      const card = screen.getByRole('dialog')
      expect(within(card).getByRole('button', { name: 'Edit' })).toBeInTheDocument()
      unmount()
    }
  })

  it('hides the assessment summary in the card from the Internal Interest team', async () => {
    const user = userEvent.setup()
    render(<DashboardScreen userProfile={internalProfile} />)
    await user.click(screen.getAllByRole('button', { name: /^Open notes for/ })[0])
    const card = screen.getByRole('dialog')
    await user.click(within(card).getByRole('button', { name: 'Expand notes' }))
    expect(within(card).getByRole('heading', { name: 'Key notes' })).toBeInTheDocument()
    expect(
      within(card).queryByRole('heading', { name: 'Assessment summary' })
    ).not.toBeInTheDocument()
  })
})

describe('Stage chips on the Dashboard', () => {
  it('shows each case stage as a chip with its position', () => {
    render(<DashboardScreen userProfile={directorProfile} />)
    const row = (company: string) => screen.getByText(company).closest('tr')!
    expect(
      within(row('MedTech Innovations')).getByRole('group', {
        name: 'Stage 1 of 6: Initial Assessment Brief',
      })
    ).toBeInTheDocument()
    expect(
      within(row('AlphaHealth BioTech')).getByRole('group', {
        name: 'Stage 3 of 6: Strategic Alignment',
      })
    ).toBeInTheDocument()
    expect(
      within(row('GenomicX MENA FZ-LLC')).getByRole('group', {
        name: 'Stage 5 of 6: Discovery Call',
      })
    ).toBeInTheDocument()
    expect(
      within(row('CarePulse Technologies')).getByRole('group', {
        name: 'Exited at stage 1 of 6: Initial Assessment Brief',
      })
    ).toBeInTheDocument()
  })

  it('adds the Stage column for the Internal Interest and Strategy teams', () => {
    for (const profile of [internalProfile, strategyProfile]) {
      const { unmount } = render(<DashboardScreen userProfile={profile} />)
      expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
        'Case ID',
        'Company name',
        'Focus Area',
        'Solution Maturity',
        'Status',
        'Stage',
        'Deadline',
        'Submitted Date',
        'Notes',
      ])
      expect(screen.getAllByRole('group', { name: /^Stage \d of 6/ }).length).toBeGreaterThan(0)
      unmount()
    }
  })

  it('shows a routed case as Routed · Procurement for the Partnership Admin', () => {
    const routed = {
      ...INITIAL_PARTNERSHIP_REQUESTS[4],
      queue: 'routed' as const,
      caseType: 'Procure' as const,
    }
    render(<DashboardScreen userProfile={adminProfile} requests={[routed]} />)
    expect(screen.getByRole('group', { name: 'Routed to Procurement' })).toHaveTextContent(
      'Routed · Procurement'
    )
  })
})
