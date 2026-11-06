import React from 'react'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { DiscoveryCallStage } from './DiscoveryCallStage'
import { INITIAL_PARTNERSHIP_REQUESTS, type PartnershipRequest } from '@/types/partnership.types'

const base: PartnershipRequest = {
  ...INITIAL_PARTNERSHIP_REQUESTS[2],
  discovery: undefined,
}
const file = (name: string) => new File(['x'], name)

const renderStage = (
  request: PartnershipRequest,
  role: 'director' | 'sponsor' | 'viewer',
  extra: { onAction?: () => void; onNext?: () => void } = {}
) =>
  render(
    <DiscoveryCallStage
      request={request}
      role={role}
      onAction={extra.onAction ?? vi.fn()}
      onNext={extra.onNext ?? vi.fn()}
    />
  )

describe('DiscoveryCallStage', () => {
  it('takes transcripts, then writes the meeting summary from them', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const onAction = vi.fn()
    renderStage(base, 'director', { onAction })
    expect(screen.getByRole('heading', { name: 'Discovery Call' })).toBeInTheDocument()
    expect(
      screen.getByText(/Hold the call on Teams or elsewhere, then confirm it has been completed/)
    ).toBeInTheDocument()
    // No in-app call any more
    expect(screen.queryByRole('radiogroup', { name: 'Call format' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Start call/ })).not.toBeInTheDocument()

    // Nothing can be uploaded until the Director acknowledges the call took place
    expect(screen.queryByLabelText('Upload transcripts')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
    await user.click(
      screen.getByRole('checkbox', {
        name: 'I acknowledge that the discovery call has been completed',
      })
    )
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    // Generate summary is available from the start
    expect(screen.getByRole('button', { name: /Generate summary/ })).toBeEnabled()
    expect(screen.getByText('0 transcripts ready.')).toBeInTheDocument()
    await user.upload(screen.getByLabelText('Upload transcripts'), [
      file('call.vtt'),
      file('notes.pdf'),
    ])
    const list = screen.getByRole('list', { name: 'Transcripts to upload' })
    expect(list).toHaveTextContent('call.vtt')
    expect(list).toHaveTextContent('notes.pdf')
    expect(screen.getByText('2 transcripts ready.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove notes.pdf' }))
    expect(screen.getByText('1 transcript ready.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Generate summary/ }))
    expect(screen.getByRole('status', { name: 'Writing the meeting summary' })).toHaveTextContent(
      'Reading 1 transcript · Pulling out key points · Listing next steps'
    )
    act(() => vi.advanceTimersByTime(2100))
    vi.useRealTimers()
    expect(onAction).toHaveBeenCalledWith({
      type: 'discoverySummary',
      files: [{ name: 'call.vtt', size: '1 KB' }],
    })
  })

  it('skips straight to the sponsor', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    const onNext = vi.fn()
    renderStage(base, 'director', { onAction, onNext })
    await user.click(
      screen.getByRole('checkbox', {
        name: 'I acknowledge that the discovery call has been completed',
      })
    )
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Skip' }))
    expect(onAction).toHaveBeenCalledWith({ type: 'proceedToValue' })
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('shows the summary as a file with a preview, and only Proceed', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    const withSummary: PartnershipRequest = {
      ...base,
      discovery: {
        notes: [],
        recordings: [],
        transcripts: [
          { name: 'call.vtt', size: '12 KB', uploadedOn: '2 Oct 2026', uploadedBy: 'Zaid Al Ali' },
        ],
        summary: {
          fileName: 'Discovery-call-summary.pdf',
          generatedOn: '2 Oct 2026',
          transcriptCount: 1,
          content: {
            attendees: [],
            keyPoints: ['A key point'],
            vendorCommitments: ['A commitment'],
            openQuestions: [],
            risks: [],
            nextSteps: ['A next step'],
          },
        },
      },
    }
    renderStage(withSummary, 'director', { onAction })
    expect(screen.getByText('Discovery-call-summary.pdf')).toBeInTheDocument()
    expect(
      screen.getByText('Meeting summary · from 1 transcript · generated 2 Oct 2026')
    ).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Transcripts' })).toHaveTextContent('call.vtt')
    expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Generate summary/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Preview/ }))
    const viewer = screen.getByRole('dialog', { name: 'Discovery-call-summary.pdf' })
    expect(within(viewer).getByRole('heading', { name: 'Key points' })).toBeInTheDocument()
    expect(within(viewer).getByText('A next step')).toBeInTheDocument()
    expect(within(viewer).getByRole('link', { name: /Download/ })).toBeInTheDocument()
    await user.click(within(viewer).getByRole('button', { name: 'Close preview' }))

    await user.click(screen.getByRole('button', { name: 'Proceed' }))
    expect(onAction).toHaveBeenCalledWith({ type: 'proceedToValue' })
  })

  it('has the sponsor wait, with no uploader, until the Director has handed on', async () => {
    const user = userEvent.setup()
    const onNext = vi.fn()
    const { rerender } = renderStage(base, 'sponsor', { onNext })
    expect(screen.queryByLabelText('Upload transcripts')).toBeNull()
    expect(
      screen.getByText(/Waiting for the Director to hold the discovery call/)
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    rerender(
      <DiscoveryCallStage
        request={{
          ...base,
          discovery: {
            notes: [{ name: 'notes.docx', uploadedOn: '2 Oct', uploadedBy: 'Zaid' }],
            recordings: [],
            proceededOn: '3 Oct 2026',
          },
        }}
        role="sponsor"
        onAction={vi.fn()}
        onNext={onNext}
      />
    )
    expect(screen.getByRole('list', { name: 'Meeting notes' })).toHaveTextContent('notes.docx')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(onNext).toHaveBeenCalled()
  })
})
