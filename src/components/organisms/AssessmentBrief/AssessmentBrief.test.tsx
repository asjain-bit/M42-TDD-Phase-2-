import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { AssessmentBrief } from './AssessmentBrief'
import { INITIAL_PARTNERSHIP_REQUESTS } from '@/types/partnership.types'

const request = INITIAL_PARTNERSHIP_REQUESTS[0]

const renderBrief = (props: Partial<React.ComponentProps<typeof AssessmentBrief>> = {}) =>
  render(<AssessmentBrief request={request} onOpenAnalysis={vi.fn()} {...props} />)

const nav = () => within(screen.getByRole('navigation', { name: 'Brief sections' }))

describe('AssessmentBrief', () => {
  it('labels the brief as Triage Agent Analysis', () => {
    renderBrief()
    expect(screen.getByRole('heading', { name: 'Initial Assessment Brief' })).toBeInTheDocument()
    expect(screen.getByText('Triage Agent Analysis')).toBeInTheDocument()
    expect(screen.queryByText('AI-generated')).not.toBeInTheDocument()
  })

  it('splits the brief into sections with a side panel to navigate them', () => {
    renderBrief({ showSummary: true })
    ;[
      'Assessment Summary',
      'Company Information',
      'Company Experience',
      'Collaboration Proposal',
      'Focus Area',
      'Solution Maturity',
      'Regulatory Approvals',
      'Innovation & Differentiation',
      'Development Approach',
      'Support from M42',
      'Target Population & Impact',
    ].forEach((label) => expect(nav().getByRole('button', { name: label })).toBeInTheDocument())
    expect(nav().queryByRole('button', { name: 'Your Decision' })).not.toBeInTheDocument()
  })

  it('shows plain section titles without numbers', () => {
    renderBrief()
    expect(screen.getByRole('heading', { name: 'Company Information' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Target Patient Population & Impact' })
    ).toBeInTheDocument()
    screen.getAllByRole('heading', { level: 3 }).forEach((h) => {
      expect(h.textContent).not.toMatch(/^\d+\./)
    })
  })

  it('marks the active section with a soft primary fill and a light stroke, no side stroke', async () => {
    const user = userEvent.setup()
    renderBrief()
    await user.click(nav().getByRole('button', { name: 'Focus Area' }))
    const active = nav().getByRole('button', { name: 'Focus Area' })
    expect(active).toHaveAttribute('aria-current', 'true')
    expect(active.className).toContain('bg-[#36c0c9]/10')
    expect(active.className).toContain('border-[#36c0c9]/30')
    expect(active.className).not.toContain('border-l-4')
  })

  it('shows the form answers in each section', () => {
    renderBrief()
    const a = request.assessmentAreas
    expect(screen.getByText('sarah@medtechinnovations.com')).toBeInTheDocument()
    expect(screen.getByText(a.stageOfMaturityAndExperience)).toBeInTheDocument()
    expect(screen.getByText('Product launch in 2022')).toBeInTheDocument()
    expect(screen.getByText(a.proposalOfCollaboration)).toBeInTheDocument()
    expect(screen.getByText(a.productPlatformServiceDetails)).toBeInTheDocument()
    expect(screen.getByText('Medical Imaging')).toBeInTheDocument()
    expect(
      screen.getByText('FDA cleared, CE Mark approved, UAE MOHAP registered.')
    ).toBeInTheDocument()
    expect(screen.getByText(a.noveltyAndDifferentiation)).toBeInTheDocument()
    expect(screen.getByText(a.requestedM42Resources)).toBeInTheDocument()
    expect(screen.getByText('Oncology')).toBeInTheDocument()
  })

  it('hides personal contact details for reviewers', () => {
    renderBrief({ hideContact: true })
    expect(screen.queryByText('sarah@medtechinnovations.com')).not.toBeInTheDocument()
    expect(screen.queryByText('Contact Person Name')).not.toBeInTheDocument()
    expect(screen.getByText('Year Company Was Founded')).toBeInTheDocument()
  })

  it('shows the assessment summary with its leaning and a confidence level, only when asked', () => {
    const { container, rerender } = render(
      <AssessmentBrief request={request} showSummary onOpenAnalysis={vi.fn()} />
    )
    expect(screen.getByRole('heading', { name: 'Assessment Summary' })).toBeInTheDocument()
    expect(screen.getByText('Points to proceed')).toBeInTheDocument()
    expect(screen.getByText('High confidence')).toBeInTheDocument()
    expect(screen.getByText(/What would change this assessment/)).toBeInTheDocument()
    expect(
      screen.getByText('Clinical validation not reproduced on M42 patient data')
    ).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/High · \d+%/)

    rerender(
      <AssessmentBrief
        request={{
          ...request,
          agentRecommendation: { ...request.agentRecommendation!, status: 'reject' },
        }}

        showSummary
        onOpenAnalysis={vi.fn()}
      />
    )
    expect(screen.getByText('Points to reject')).toBeInTheDocument()

    rerender(<AssessmentBrief request={request} onOpenAnalysis={vi.fn()} />)
    expect(screen.queryByRole('heading', { name: 'Assessment Summary' })).not.toBeInTheDocument()
    expect(nav().queryByRole('button', { name: 'Assessment Summary' })).not.toBeInTheDocument()
  })

  it('shows only the Agent Actions button, in the title colour, and opens it', async () => {
    const user = userEvent.setup()
    const onOpenAnalysis = vi.fn()
    renderBrief({ onOpenAnalysis })
    expect(screen.queryByText('AI analysis completed')).not.toBeInTheDocument()
    expect(screen.queryByText(/checks completed/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /View vendor response/i })).not.toBeInTheDocument()
    const button = screen.getByRole('button', { name: 'Agent Actions' })
    expect(button.className).toContain('text-[#0d212c]')
    await user.click(button)
    expect(onOpenAnalysis).toHaveBeenCalled()
  })

  it('adds a decision section and a footer when given', () => {
    renderBrief({ decision: <p>Decision form</p>, footer: <button>Step action</button> })
    expect(nav().getByRole('button', { name: 'Your Decision' })).toBeInTheDocument()
    expect(screen.getByText('Decision form')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Step action' })).toBeInTheDocument()
  })

  it('handles sparse form data', () => {
    const base = INITIAL_PARTNERSHIP_REQUESTS[1]
    renderBrief({
      request: {
        ...base,
        companyInfo: { ...base.companyInfo, location: undefined },
        assessmentAreas: {
          ...base.assessmentAreas,
          growthJourneyAndRegionalExperience: undefined,
          milestones: undefined,
          relevantApprovals: undefined,
          regulatoryApprovalList: undefined,
          developmentApproach: undefined,
          impactedPatientPopulations: undefined,
          clinicalAreas: undefined,
          productPlatformServiceDetails: base.assessmentAreas.proposalOfCollaboration,
        },
      },
    })
    expect(screen.getByText('Not applicable')).toBeInTheDocument()
    expect(screen.getByText('Not specified')).toBeInTheDocument()
    expect(screen.queryByText('Key milestones')).not.toBeInTheDocument()
    expect(screen.queryByText('Product, Platform & Service Details')).not.toBeInTheDocument()
  })
})
