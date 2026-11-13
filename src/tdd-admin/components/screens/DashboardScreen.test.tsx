import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardScreen, computeDashboardKpis } from './DashboardScreen'

const card = (title: string) => screen.getByText(title).closest('div.bg-white') as HTMLElement
const total = (title: string) => card(title).querySelector('.text-2xl')?.textContent

describe('computeDashboardKpis', () => {
  const row = (
    id: string,
    vendorId: string,
    score: string,
    status: string,
    created: string,
    past = 0
  ) =>
    ({
      id,
      caseId: id,
      vendorId,
      vendor: vendorId,
      questionnaire: 'Technical Questionnaire',
      round: 'Round 1',
      status,
      score,
      createdDate: created,
      pastRounds: Array.from({ length: past }, (_, i) => ({ id: `${id}-${i}` })),
    }) as unknown as Parameters<typeof computeDashboardKpis>[0][number]

  it('counts vendors by confidence, rounds per vendor and the evidence backlog by age', () => {
    const now = new Date('2026-10-01T12:00:00')
    const kpis = computeDashboardKpis(
      [
        row('a', 'V1', 'High', 'awaiting_evidence', '25 Sept 2026, 10:00 AM'),
        row('b', 'V2', 'Low', 'awaiting_evidence', '10 Sep 2026, 10:00 AM', 1),
        row('c', 'V3', 'Medium', 'awaiting_evidence', '01 Aug 2026, 10:00 AM', 2),
        row('d', 'V3', 'Medium', 'completed', '01 Aug 2026, 10:00 AM'),
      ],
      now
    )
    expect(kpis.vendors).toEqual({ total: 3, high: 1, medium: 1, low: 1 })
    // V1 has 1 round, V2 has 2, V3 has 3 + 1 = 4
    expect(kpis.rounds).toEqual({ average: 2.3, one: 1, two: 1, threePlus: 1 })
    expect(kpis.backlog).toEqual({ total: 3, fresh: 1, mid: 1, old: 1 })
  })

  it('is all zeros with nothing to count', () => {
    expect(computeDashboardKpis([]).vendors.total).toBe(0)
    expect(computeDashboardKpis([]).rounds.average).toBe(0)
  })
})

describe('DashboardScreen KPI cards', () => {
  it('update when the assessments are filtered by vendor, confidence or questionnaire', async () => {
    const user = userEvent.setup()
    render(<DashboardScreen />)
    const allVendors = Number(total('Total Vendors'))
    expect(allVendors).toBeGreaterThan(1)

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    const vendorSelect = screen.getByLabelText('Vendor name')
    const firstVendor = within(vendorSelect).getAllByRole('option')[1].textContent as string
    await user.selectOptions(vendorSelect, firstVendor)
    expect(total('Total Vendors')).toBe('1')
    const high = within(card('Total Vendors')).getByText('High confidence').previousElementSibling
    const medium = within(card('Total Vendors')).getByText(
      'Medium confidence'
    ).previousElementSibling
    const low = within(card('Total Vendors')).getByText('Low confidence').previousElementSibling
    expect(
      Number(high?.textContent) + Number(medium?.textContent) + Number(low?.textContent)
    ).toBeLessThanOrEqual(1)

    // Clearing the filters brings every vendor back
    await user.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(Number(total('Total Vendors'))).toBe(allVendors)

    await user.selectOptions(screen.getByLabelText('Confidence'), 'High')
    const highOnly = Number(total('Total Vendors'))
    expect(highOnly).toBeLessThan(allVendors)
    expect(
      within(card('Total Vendors')).getByText('Medium confidence').previousElementSibling
    ).toHaveTextContent('0')
  })
})
