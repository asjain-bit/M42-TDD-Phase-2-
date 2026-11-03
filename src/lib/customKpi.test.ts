import { describe, it, expect } from 'vitest'
import { evaluateCustomKpi, type KpiValues } from './customKpi'

const values: KpiValues = {
  outputs: 20,
  tokens: 18_600_000,
  searchCredits: 2500,
  costWithoutAi: 4200,
  costUsingAi: 155,
  savings: 4045,
  roi: 27,
}

describe('evaluateCustomKpi', () => {
  it('works the formula out left to right, mixing system figures and own values, and refuses to divide by zero', () => {
    // (4200 − 155) ÷ 20 × 100 = 20225, not 4200 − 155 ÷ 20 × 100
    expect(
      evaluateCustomKpi(
        {
          operands: [
            { kind: 'system', source: 'costWithoutAi' },
            { kind: 'system', source: 'costUsingAi' },
            { kind: 'system', source: 'outputs' },
            { kind: 'custom', value: 100, label: 'Scale' },
          ],
          operators: ['−', '÷', '×'],
        },
        values
      )
    ).toEqual({ value: 20225 })

    expect(
      evaluateCustomKpi(
        {
          operands: [
            { kind: 'system', source: 'savings' },
            { kind: 'custom', value: 0, label: 'Head count' },
          ],
          operators: ['÷'],
        },
        values
      )
    ).toEqual({ error: 'Input 2 is 0 this week, so it cannot be divided by.' })
  })
})
