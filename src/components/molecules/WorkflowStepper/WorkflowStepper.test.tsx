import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { WorkflowStepper } from './WorkflowStepper'
import type { WorkflowStep } from './WorkflowStepper.types'

const steps: WorkflowStep[] = [
  { id: 'a', label: 'Agent Actions', state: 'completed' },
  { id: 'b', label: 'Initial Assessment Brief', state: 'current', caption: 'To review' },
  { id: 'c', label: 'Internal Review', state: 'upcoming' },
  { id: 'd', label: 'Approval', state: 'closed' },
]

describe('WorkflowStepper', () => {
  it('shows each step with its state caption', () => {
    render(<WorkflowStepper steps={steps} activeId="b" onSelect={vi.fn()} />)
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('To review')).toBeInTheDocument()
    expect(screen.getByText('Upcoming')).toBeInTheDocument()
    expect(screen.getByText('Closed')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Initial Assessment Brief/ })).toHaveAttribute(
      'aria-current',
      'step'
    )
  })

  it('lets completed and current steps be opened', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<WorkflowStepper steps={steps} activeId="b" onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: /Agent Actions/ }))
    await user.click(screen.getByRole('button', { name: /Initial Assessment Brief/ }))
    expect(onSelect).toHaveBeenNthCalledWith(1, 'a')
    expect(onSelect).toHaveBeenNthCalledWith(2, 'b')
  })

  it('keeps upcoming and closed steps locked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<WorkflowStepper steps={steps} activeId="b" onSelect={onSelect} />)
    const upcoming = screen.getByRole('button', { name: /Internal Review/ })
    const closed = screen.getByRole('button', { name: /Approval/ })
    expect(upcoming).toBeDisabled()
    expect(closed).toBeDisabled()
    await user.click(upcoming)
    await user.click(closed)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('falls back to a default caption and numbers the open step', () => {
    render(
      <WorkflowStepper
        steps={[{ id: 'x', label: 'Only step', state: 'current' }]}
        activeId="x"
        onSelect={vi.fn()}
      />
    )
    expect(screen.getByText('Current')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('shows who did a completed or current step on hover, and nothing for later steps', async () => {
    const user = userEvent.setup()
    const withActors: WorkflowStep[] = [
      {
        id: 'a',
        label: 'Initial Assessment Brief',
        state: 'completed',
        actors: [{ action: 'Approved by', role: 'Director', name: 'Zaid Al Ali' }],
      },
      {
        id: 'b',
        label: 'Internal Canvas',
        state: 'current',
        actors: [{ action: 'Awaiting', role: 'Internal Interest team', name: 'Riza Sayeed' }],
      },
      { id: 'c', label: 'Strategic Alignment', state: 'upcoming' },
    ]
    render(<WorkflowStepper steps={withActors} activeId="b" onSelect={vi.fn()} />)
    await user.hover(screen.getByRole('button', { name: /Initial Assessment Brief/ }))
    const tip = screen.getByRole('tooltip')
    expect(tip).toHaveTextContent('Approved by')
    expect(tip).toHaveTextContent('Zaid Al Ali')
    expect(tip).toHaveTextContent('Director')
    await user.unhover(screen.getByRole('button', { name: /Initial Assessment Brief/ }))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    await user.hover(screen.getByRole('button', { name: /Internal Canvas/ }))
    expect(screen.getByRole('tooltip')).toHaveTextContent('Riza Sayeed')
    await user.unhover(screen.getByRole('button', { name: /Internal Canvas/ }))

    await user.hover(screen.getByRole('button', { name: /Strategic Alignment/ }))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
