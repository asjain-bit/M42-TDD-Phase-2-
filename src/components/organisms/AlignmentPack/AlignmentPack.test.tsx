import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'
import { AlignmentPack, buildOpenQuestions } from './AlignmentPack'
import { INITIAL_PARTNERSHIP_REQUESTS } from '@/types/partnership.types'

const request = INITIAL_PARTNERSHIP_REQUESTS[2]

describe('AlignmentPack', () => {
  it('is one continuous document, with no side navigation and no recipients', () => {
    render(<AlignmentPack request={request} />)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.queryByText('Sent to')).not.toBeInTheDocument()
    expect(screen.queryByText(/Sponsors: /)).not.toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Executive Summary',
      'Company Information',
      'Collaboration Proposal',
      'Solution Maturity',
      'Agent Checks',
      'Director Decision',
      'Internal Interest',
      'Strategy Assessment',
      'NDA',
      'Open Questions',
      'Key Dates',
    ])
  })

  it('fills the sections with what happened so far', () => {
    render(<AlignmentPack request={request} />)
    expect(screen.getAllByText(request.companyName).length).toBeGreaterThan(0)
    expect(screen.getByText(request.assessmentAreas.proposalOfCollaboration)).toBeInTheDocument()
    expect(
      screen.getByText(/Parag Agarwal is the lead sponsor, with Najla Al Mansoori/)
    ).toBeInTheDocument()
    expect(screen.getByText('Conditions to proceed')).toBeInTheDocument()
    // The NDA section names the latest signed copy, not the unsigned template
    expect(screen.getByText('GenomicX_Signed_NDA_v1.pdf')).toBeInTheDocument()
    expect(screen.getByText('v2')).toBeInTheDocument()
    expect(screen.getByText('Agent: Proceed')).toBeInTheDocument()
    expect(screen.getByRole('table')).toHaveTextContent('Response date')
  })

  it('adds an extra section at the end', () => {
    render(
      <AlignmentPack
        request={request}
        extraSection={{ id: 'context', label: 'Meeting Notes', content: <p>Extra content</p> }}
      />
    )
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(headings[headings.length - 1]).toBe('Meeting Notes')
    expect(screen.getByText('Extra content')).toBeInTheDocument()
  })

  it('turns strategy conditions into an open question', () => {
    // The seeded case whose Strategy reviewer proceeded with a condition
    const withCondition = INITIAL_PARTNERSHIP_REQUESTS.find((r) =>
      r.strategyTeamMembers?.some((m) => m.strategyResponse?.finalDecisionNote)
    )!
    const questions = buildOpenQuestions(withCondition)
    expect(questions[0]).toMatch(/Has the vendor confirmed this condition/)
    expect(questions.length).toBeGreaterThanOrEqual(4)
  })

  it('shows the current internal answer, with its history', async () => {
    const [first, ...rest] = request.internalInterests!
    const answers = first.answers!.map((a, i) =>
      i === 0
        ? {
            ...a,
            edits: [
              { answer: 'Revised answer', reason: 'New data', by: first.name, on: '25 Oct 2026' },
            ],
          }
        : a
    )
    render(
      <AlignmentPack
        request={{ ...request, internalInterests: [{ ...first, answers }, ...rest] }}
      />
    )
    expect(screen.getByText('Revised answer')).toBeInTheDocument()
    expect(screen.getByText('Edited')).toBeInTheDocument()
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'View original and changes (1)' }))
    expect(screen.getByText('Reason: New data')).toBeInTheDocument()
  })
})
