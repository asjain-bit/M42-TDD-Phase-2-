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
    expect(screen.getByText('$155')).toBeInTheDocument()
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
    // Everyone else sees the inputs, read-only, and no Recalculate button
    expect(screen.queryByRole('button', { name: /Recalculate/i })).not.toBeInTheDocument()
    expect(screen.getByLabelText(/Manual hours per output/)).toBeDisabled()
    unmount()

    render(<UsageInsightsScreen canRecalculate />)
    // The six inputs of the calculation
    expect(screen.getAllByRole('spinbutton').map((i) => (i as HTMLInputElement).value)).toEqual([
      '6',
      '35',
      '1.25',
      '10',
      '0.13',
      '0.008',
    ])
    expect(screen.getByText('Cost using AI includes model + web search')).toBeInTheDocument()
    const hours = screen.getByLabelText(/Manual hours per output/)
    expect(hours).toHaveValue(6)
    expect(screen.getByLabelText(/Resource cost per hour/)).toHaveValue(35)
    await user.click(screen.getByRole('button', { name: 'Summary' }))
    expect(screen.getByText('$4,200')).toBeInTheDocument()
    expect(screen.getByText('27x')).toBeInTheDocument()
    expect(screen.getByText('$4,045')).toBeInTheDocument()
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
    expect(screen.getByText('Total hours 40 | Cost per hour $35')).toBeInTheDocument()
    expect(screen.queryByText(/Last recalculated/)).not.toBeInTheDocument()
  })

  it('switches between the chart and the summary', async () => {
    const user = userEvent.setup()
    render(<UsageInsightsScreen />)
    expect(screen.getByRole('img', { name: /Cost without AI versus cost using AI/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Summary' }))
    expect(
      screen.queryByRole('img', { name: /Cost without AI versus cost using AI/ })
    ).not.toBeInTheDocument()
    expect(screen.getByText('Estimated savings')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Chart' }))
    expect(screen.getByRole('img', { name: /Cost without AI versus cost using AI/ })).toBeInTheDocument()
  })

  it('lists the cases as Completed, In Progress and Closed, with their case ID', async () => {
    const user = userEvent.setup()
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
    expect(
      within(screen.getByRole('list', { name: 'In Progress' })).getAllByRole('listitem')
    ).toHaveLength(4)
    await user.click(screen.getByRole('button', { name: /See more/ }))
    expect(
      within(screen.getByRole('list', { name: 'In Progress' })).getAllByRole('listitem')
    ).toHaveLength(5)
  })
})
