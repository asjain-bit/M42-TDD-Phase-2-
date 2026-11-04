import React from 'react'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { INITIAL_PARTNERSHIP_REQUESTS } from '@/types/partnership.types'
import { UsageInsightsScreen } from './UsageInsightsScreen'
import { aiCost, DEFAULT_ASSUMPTIONS, manualCost, USAGE_WEEKS } from '@/lib/usageInsights'

describe('usage maths', () => {
  it('reproduces the reference week', () => {
    const week = USAGE_WEEKS[2]
    expect(Math.round(manualCost(week, DEFAULT_ASSUMPTIONS))).toBe(4200)
    expect(Math.round(aiCost(week, DEFAULT_ASSUMPTIONS))).toBe(155)
  })
})

describe('UsageInsightsScreen', () => {
  it('shows the three KPI cards for the selected week', () => {
    render(<UsageInsightsScreen />)
    expect(screen.getByText('Output Generated')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('20 assessment calls')).toBeInTheDocument()
    expect(screen.getByText('18.6M')).toBeInTheDocument()
    // On the cost card, and again as Cost using AI in the figures column
    expect(screen.getAllByText('$155')).toHaveLength(2)
    expect(screen.getByLabelText('Week')).toHaveValue('2')
    expect(screen.getByText('Web Search Credits')).toBeInTheDocument()
    expect(screen.getByText('2,500')).toBeInTheDocument()
    expect(screen.getByText('Search, extract & page reads')).toBeInTheDocument()
  })

  it('moves between weeks with the arrows and the selector', async () => {
    const user = userEvent.setup()
    render(<UsageInsightsScreen />)
    await user.click(screen.getByRole('button', { name: 'Next week' }))
    expect(screen.getByText('22')).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Week'), '0')
    expect(screen.getByText('14')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous week' })).toBeDisabled()
  })

  it('lets only the Partnership Admin recalculate, using the inputs they set', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<UsageInsightsScreen />)
    // Everyone else sees the inputs in the drawer, read-only, and cannot edit them
    await user.click(screen.getByRole('button', { name: /How costs are calculated/ }))
    expect(screen.getByLabelText(/Manual hours per output/)).toBeDisabled()
    expect(screen.getByText('Only an admin can edit the inputs.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Edit inputs' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Recalculate/i })).not.toBeInTheDocument()
    unmount()

    render(<UsageInsightsScreen canRecalculate />)
    expect(screen.getByText('$4,200')).toBeInTheDocument()
    expect(screen.getByText('27x')).toBeInTheDocument()
    expect(screen.getByText('$4,045')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /How costs are calculated/ }))
    // The six inputs of the calculation, read-only until Edit inputs
    const inputs = screen.getAllByRole('spinbutton') as HTMLInputElement[]
    expect(inputs.map((i) => i.value)).toEqual(['6', '35', '1.25', '10', '0.13', '0.008'])
    inputs.forEach((i) => expect(i).toBeDisabled())
    expect(screen.queryByRole('button', { name: /Recalculate/i })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Edit inputs' }))
    const hours = screen.getByLabelText(/Manual hours per output/)
    expect(hours).toBeEnabled()
    expect(hours).toHaveValue(6)
    expect(screen.getByLabelText(/Resource cost per hour/)).toHaveValue(35)
    // Nothing to recalculate until something changes, and an emptied field stays empty
    expect(screen.getByRole('button', { name: /Recalculate/i })).toBeDisabled()
    await user.clear(hours)
    expect(hours).toHaveValue(null)
    expect(screen.getByRole('button', { name: /Recalculate/i })).toBeDisabled()
    await user.type(hours, '2')
    expect(screen.getByRole('button', { name: /Recalculate/i })).toBeEnabled()
    // Nothing changes until Recalculate
    expect(screen.getByText('$4,200')).toBeInTheDocument()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    await user.click(screen.getByRole('button', { name: /Recalculate/i }))
    // A circular progress runs on the cost card before the new numbers show
    expect(screen.getByRole('status', { name: 'Recalculating' })).toBeInTheDocument()
    expect(screen.getByText('$4,200')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1600))
    vi.useRealTimers()
    expect(screen.queryByRole('status', { name: 'Recalculating' })).not.toBeInTheDocument()
    expect(screen.getByText('$1,400')).toBeInTheDocument()
    expect(screen.getByText('40 hours at $35/h')).toBeInTheDocument()
    // The inputs lock again
    expect(screen.getByLabelText(/Manual hours per output/)).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Edit inputs' })).toBeInTheDocument()
  })

  it('shows the four figures beside the chart, with the drawer in the card footer', async () => {
    const user = userEvent.setup()
    render(<UsageInsightsScreen />)
    ;['Cost without AI', 'Cost using AI', 'Estimated ROI', 'Estimated savings'].forEach((label) =>
      expect(screen.getAllByText(label).length).toBeGreaterThan(0)
    )
    // There is no chart / summary switch any more
    expect(screen.queryByRole('button', { name: 'Summary' })).not.toBeInTheDocument()
    expect(
      screen.getByText(`Week of ${USAGE_WEEKS[2].full} · based on 6 inputs`)
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /How costs are calculated/ }))
    expect(screen.getByRole('dialog', { name: 'How costs are calculated' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close how costs are calculated' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /How costs are calculated/ }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('lists Completed and Closed cases with their case ID, and In Progress by stage', () => {
    const base = INITIAL_PARTNERSHIP_REQUESTS[2]
    const cases = [
      { ...base, id: 'a', companyName: 'Done Co', value: { sponsoredOn: 'x' } },
      ...Array.from({ length: 5 }, (_, i) => ({ ...base, id: `p${i}`, companyName: `Live ${i}` })),
      { ...base, id: 'c', companyName: 'Ended Co', status: 'Closed' as const },
    ]
    render(<UsageInsightsScreen requests={cases} />)
    expect(screen.getByRole('heading', { name: 'Assessments by Status' })).toBeInTheDocument()
    const titles = screen
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent)
      .filter((t) => ['Completed', 'In Progress', 'Closed'].includes(t ?? ''))
    expect(titles).toEqual(['Completed', 'In Progress', 'Closed'])
    expect(
      within(screen.getByRole('list', { name: 'Completed' })).getByText('Done Co')
    ).toBeVisible()
    expect(
      within(screen.getByRole('list', { name: 'Closed' })).getByText(base.requestCode)
    ).toBeVisible()
    // In Progress lists the six stages with how many assessments are at each, plus the total
    const inProgress = within(screen.getByRole('list', { name: 'In Progress' }))
    expect(inProgress.getAllByRole('listitem')).toHaveLength(6)
    expect(inProgress.queryByText('Live 0')).not.toBeInTheDocument()
    expect(inProgress.getByText('Discovery Call').nextSibling).toHaveTextContent('5')
    expect(screen.getByLabelText('5 in progress')).toBeInTheDocument()
    expect(screen.getByLabelText('1 completed')).toBeInTheDocument()
    expect(screen.queryByText('Exited')).not.toBeInTheDocument()
    // Nothing to expand: Completed and Closed have fewer than five each
    expect(screen.queryByRole('button', { name: /See more/ })).not.toBeInTheDocument()
  })
})
