import React from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StageChip, stageStates } from './StageChip'
import type { StageProgress } from '@/lib/caseActions'

const strategic: StageProgress = {
  label: 'Strategic Alignment',
  index: 3,
  total: 6,
  kind: 'active',
  reached: 3,
}

const segments = (el: HTMLElement) =>
  Array.from(el.querySelectorAll('[data-state]')).map((s) => s.getAttribute('data-state'))

describe('StageChip', () => {
  it('names the stage and its position, with six segments and a count', () => {
    render(<StageChip progress={strategic} />)
    const chip = screen.getByRole('group', { name: 'Stage 3 of 6: Strategic Alignment' })
    // Plain text like the other table cells: no pill, background or border
    const name = within(chip).getByText('Strategic Alignment')
    expect(name).toHaveClass('text-xs', 'font-normal', 'text-text-primary')
    expect(name.className).not.toMatch(/rounded|border|bg-/)
    // A compact bar in table cells by default
    expect(chip).not.toHaveClass('w-full')
    expect(chip.querySelector('[data-state]')?.parentElement).toHaveClass('w-[120px]')
    expect(within(chip).getByText('3/6')).toBeInTheDocument()
    expect(segments(chip)).toEqual([
      'Completed',
      'Completed',
      'Current',
      'Upcoming',
      'Upcoming',
      'Upcoming',
    ])
  })

  it('lists every stage with its state in a tooltip on hover and focus', () => {
    render(<StageChip progress={strategic} />)
    const chip = screen.getByRole('group')
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    fireEvent.focus(chip)
    const tip = screen.getByRole('tooltip')
    expect(chip).toHaveAttribute('aria-describedby', tip.id)
    expect(
      within(tip)
        .getAllByRole('listitem')
        .map((li) => li.textContent)
    ).toEqual([
      '1. Initial Assessment BriefCompleted',
      '2. Internal CanvasCompleted',
      '3. Strategic AlignmentCurrent',
      '4. NDAUpcoming',
      '5. Discovery CallUpcoming',
      '6. Value & Due DiligenceUpcoming',
    ])
    fireEvent.blur(chip)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    fireEvent.mouseEnter(chip)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('greys out the stages a closed case never reached', () => {
    render(
      <StageChip
        progress={{ label: 'Closed', index: null, total: 6, kind: 'closed', reached: 2 }}
      />
    )
    const chip = screen.getByRole('group', {
      name: 'Closed at stage 2 of 6: Internal Canvas',
    })
    expect(within(chip).getByText('Closed')).toHaveClass('text-text-error')
    expect(within(chip).getByText('2/6')).toBeInTheDocument()
    expect(segments(chip)).toEqual([
      'Completed',
      'Completed',
      'Not reached',
      'Not reached',
      'Not reached',
      'Not reached',
    ])
    // Reached segments are muted grey rather than teal
    expect(chip.querySelector('[data-state="Completed"]')).toHaveClass('bg-border-strong')
  })

  it('shows a routed case in muted text with no progress bar', () => {
    render(
      <StageChip
        progress={{
          label: 'Routed to Corporate Development',
          index: null,
          total: 6,
          kind: 'routed',
          reached: 1,
        }}
      />
    )
    const chip = screen.getByRole('group', { name: 'Routed to Corporate Development' })
    expect(within(chip).getByText('Routed · Corp Dev')).toHaveClass('text-text-tertiary')
    expect(segments(chip)).toEqual([])
  })

  it('stretches the bar to its container with fullWidth', () => {
    render(<StageChip progress={strategic} fullWidth />)
    const chip = screen.getByRole('group')
    expect(chip).toHaveClass('w-full')
    expect(chip.querySelector('[data-state]')?.parentElement).toHaveClass('flex-1')
  })

  it('works out the six stage states', () => {
    expect(stageStates({ ...strategic, index: 6, reached: 6 }).at(-1)).toBe('Current')
    expect(
      stageStates({ label: 'Exited', index: null, total: 6, kind: 'exited', reached: 1 })
    ).toEqual([
      'Completed',
      'Not reached',
      'Not reached',
      'Not reached',
      'Not reached',
      'Not reached',
    ])
  })
})
