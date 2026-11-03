/**
 * Custom KPIs for Value and ROI Insights: a name, a unit and a formula of 2-5 inputs joined by
 * + − × ÷, worked out left to right. Inputs are figures the system already has, or a value the
 * Partnership Admin enters.
 */

import { aiCost, manualCost, type UsageAssumptions, type UsageWeek } from '@/lib/usageInsights'

export type KpiSource =
  'outputs' | 'tokens' | 'searchCredits' | 'costWithoutAi' | 'costUsingAi' | 'savings' | 'roi'

/** The figures a KPI can use, in the order the picker lists them */
export const KPI_SOURCES: { id: KpiSource; label: string }[] = [
  { id: 'outputs', label: 'Output Generated' },
  { id: 'tokens', label: 'Tokens Consumed' },
  { id: 'searchCredits', label: 'Web Search Credits' },
  { id: 'costWithoutAi', label: 'Cost without AI' },
  { id: 'costUsingAi', label: 'Cost using AI' },
  { id: 'savings', label: 'Savings' },
  { id: 'roi', label: 'ROI' },
]

export type KpiOperand =
  { kind: 'system'; source: KpiSource } | { kind: 'custom'; value: number; label: string }

export type KpiOperator = '+' | '−' | '×' | '÷'
export const KPI_OPERATORS: KpiOperator[] = ['+', '−', '×', '÷']

export type KpiUnit = 'number' | '$' | '%' | 'hours' | 'x'
export const KPI_UNITS: KpiUnit[] = ['number', '$', '%', 'hours', 'x']

export const MIN_KPI_INPUTS = 2
export const MAX_KPI_INPUTS = 5

export interface CustomKpi {
  id: string
  name: string
  unit: KpiUnit
  /** 2-5 inputs */
  operands: KpiOperand[]
  /** One fewer than the inputs: the operator before each input after the first */
  operators: KpiOperator[]
}

export type KpiValues = Record<KpiSource, number>

/** The system figures for one week, with the current inputs */
export const kpiValuesFor = (week: UsageWeek, assumptions: UsageAssumptions): KpiValues => {
  const withoutAi = manualCost(week, assumptions)
  const usingAi = aiCost(week, assumptions)
  return {
    outputs: week.calls,
    tokens: week.tokensM * 1_000_000,
    searchCredits: week.searchCredits,
    costWithoutAi: withoutAi,
    costUsingAi: usingAi,
    savings: withoutAi - usingAi,
    roi: usingAi > 0 ? withoutAi / usingAi : 0,
  }
}

const sourceLabel = (s: KpiSource) => KPI_SOURCES.find((k) => k.id === s)?.label ?? s

/** The formula in words, e.g. "Savings ÷ Output Generated" */
export const describeCustomKpi = (kpi: Pick<CustomKpi, 'operands' | 'operators'>) =>
  kpi.operands
    .map((o, i) => {
      const word =
        o.kind === 'system' ? sourceLabel(o.source) : `${o.label.trim() || 'Value'} (${o.value})`
      return i === 0 ? word : `${kpi.operators[i - 1]} ${word}`
    })
    .join(' ')

/**
 * Works the formula out left to right (no operator precedence), as written in the popup.
 * Dividing by zero, a missing operator or a non-number input gives an error instead of a value.
 */
export const evaluateCustomKpi = (
  kpi: Pick<CustomKpi, 'operands' | 'operators'>,
  values: KpiValues
): { value: number } | { error: string } => {
  const { operands, operators } = kpi
  if (operands.length < MIN_KPI_INPUTS || operands.length > MAX_KPI_INPUTS) {
    return { error: `Use ${MIN_KPI_INPUTS} to ${MAX_KPI_INPUTS} inputs.` }
  }
  if (operators.length !== operands.length - 1) return { error: 'Pick an operator for each input.' }
  const valueOf = (o: KpiOperand) => (o.kind === 'system' ? values[o.source] : o.value)
  let result = valueOf(operands[0])
  for (let i = 1; i < operands.length; i++) {
    const next = valueOf(operands[i])
    if (!Number.isFinite(result) || !Number.isFinite(next))
      return { error: 'Enter a number for every value.' }
    switch (operators[i - 1]) {
      case '+':
        result += next
        break
      case '−':
        result -= next
        break
      case '×':
        result *= next
        break
      case '÷':
        if (next === 0)
          return { error: `Input ${i + 1} is 0 this week, so it cannot be divided by.` }
        result /= next
        break
    }
  }
  return Number.isFinite(result) ? { value: result } : { error: 'Enter a number for every value.' }
}

/** $4,045 · 27.0x · 12.5% · 120 hours · 1,234 */
export const formatKpiValue = (value: number, unit: KpiUnit) => {
  const rounded = Math.abs(value) >= 100 ? Math.round(value) : Math.round(value * 10) / 10
  const n = rounded.toLocaleString('en-US')
  switch (unit) {
    case '$':
      return `${value < 0 ? '-' : ''}$${Math.abs(rounded).toLocaleString('en-US')}`
    case '%':
      return `${n}%`
    case 'hours':
      return `${n} hours`
    case 'x':
      return `${n}x`
    default:
      return n
  }
}
