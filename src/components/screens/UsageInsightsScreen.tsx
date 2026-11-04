'use client'

/**
 * UsageInsightsScreen — Screen
 * Value and ROI Insights: weekly usage of the assessment agent (KPI cards, plus the Partnership
 * Admin's own KPIs), the cost without AI vs cost using AI chart with the four figures beside it,
 * a side drawer with the inputs behind them (read-only until the Admin edits them), and
 * assessments grouped by status.
 * Used in: HomePage
 */

import React, { useEffect, useId, useRef, useState } from 'react'
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Coins,
  Info,
  Pencil,
  Plus,
  Sigma,
  Trash2,
  X,
  PhoneCall,
  Search,
  Hash,
} from 'lucide-react'
import {
  aiCost,
  DEFAULT_ASSUMPTIONS,
  DEFAULT_WEEK_INDEX,
  formatUsd,
  groupAssessmentsByStatus,
  manualCost,
  USAGE_WEEKS,
  type UsageAssumptions,
} from '@/lib/usageInsights'
import { INITIAL_PARTNERSHIP_REQUESTS, type PartnershipRequest } from '@/types/partnership.types'
import { Button } from '@/components/atoms/Button'
import { WORKFLOW_STAGES, getStageLabel } from '@/lib/caseActions'
import { CreateKpiModal } from '@/components/organisms/CreateKpiModal'
import {
  describeCustomKpi,
  evaluateCustomKpi,
  formatKpiValue,
  kpiValuesFor,
  type CustomKpi,
} from '@/lib/customKpi'

const TEAL = '#36c0c9'
// The dark navy of the M42 logo
const DARK = '#0d212c'

const INPUT_ROWS: {
  key: keyof UsageAssumptions
  label: string
  hint?: string
  prefix?: string
  unit: string
  step: string
}[] = [
  {
    key: 'hoursPerAssessment',
    label: 'Manual hours per output',
    hint: '(per report or SOW)',
    unit: 'hours',
    step: '1',
  },
  {
    key: 'costPerHour',
    label: 'Resource cost per hour',
    hint: '(cost of the person doing it manually)',
    prefix: '$',
    unit: 'USD',
    step: '1',
  },
  {
    key: 'inputTokenPrice',
    label: 'Input token price',
    hint: '(per 1M input tokens)',
    prefix: '$',
    unit: 'USD',
    step: '0.01',
  },
  {
    key: 'outputTokenPrice',
    label: 'Output token price',
    hint: '(per 1M output tokens)',
    prefix: '$',
    unit: 'USD',
    step: '0.01',
  },
  {
    key: 'embeddingTokenPrice',
    label: 'Embedding token price',
    hint: '(per 1M tokens · uploaded files)',
    prefix: '$',
    unit: 'USD',
    step: '0.01',
  },
  {
    key: 'searchCreditPrice',
    label: 'Price per search credit',
    hint: '(web search)',
    prefix: '$',
    unit: 'USD',
    step: '0.001',
  },
]

/** What each figure in the summary means */
const TIPS = {
  withoutAi:
    'What it would cost for people to produce the same results by hand: outputs × hours per output × hourly cost of the employee.',
  usingAi:
    'What the AI actually cost to produce these results: tokens used × price per 1M tokens, plus embedding tokens and web search credits.',
  roi: 'How many times cheaper using AI was: cost without AI ÷ cost using AI.',
  savings: 'Money saved by using AI: cost without AI − cost using AI.',
}

/** Info icon with a tooltip on hover and keyboard focus */
const InfoTip: React.FC<{ label: string; text: string }> = ({ label, text }) => {
  const id = useId()
  return (
    <span className="relative inline-flex group">
      <button
        type="button"
        aria-label={`About ${label}`}
        aria-describedby={id}
        className="inline-flex rounded-full text-text-tertiary hover:text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus cursor-help"
      >
        <Info className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
      </button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute left-1/2 bottom-full mb-2 -translate-x-1/2 z-20 w-64 rounded-lg bg-bg-tooltip px-3 py-2 text-xs font-normal leading-relaxed text-text-inverse shadow-lg opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  )
}

const KpiCard: React.FC<{
  title: string
  value: string
  caption: string
  icon: React.ReactNode
}> = ({ title, value, caption, icon }) => (
  <div className="bg-white/90 backdrop-blur-xs p-4 sm:p-5 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between gap-3">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-[0.06em]">
        {title}
      </span>
      <div className="flex items-center justify-center shrink-0">{icon}</div>
    </div>
    <div className="text-4xl font-medium text-[#0d212c] leading-none my-1">{value}</div>
    <div className="h-[1px] bg-slate-100 w-full" />
    <div className="text-xs font-medium text-[#64748b]">{caption}</div>
  </div>
)

/** The cost chart keeps this height whatever its width */
/** The chart area is at least this tall; otherwise it fills the card below the header */
const CHART_MIN_HEIGHT = 220

/** Width of an element, kept up to date as it resizes */
/** The element's measured size, kept up to date as it resizes */
const useSize = <T extends HTMLElement>() => {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    setSize({ width: el.clientWidth, height: el.clientHeight })
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return [ref, size] as const
}

const CostChart: React.FC<{
  manual: number[]
  ai: number[]
  selected: number
  labels: string[]
  /** Measured size of the chart area: the chart is drawn at that size, one unit per pixel */
  width: number
  height: number
}> = ({ manual, ai, selected, labels, width, height }) => {
  const W = Math.max(width, 320)
  const H = Math.max(height, CHART_MIN_HEIGHT)
  const left = 44
  const right = 124
  const top = 16
  // Room for the week labels, which sit on the chart's bottom edge
  const bottom = 28
  const max = Math.max(3000, Math.ceil(Math.max(...manual) / 1000) * 1000)
  const x = (i: number) => left + (i * (W - left - right)) / (manual.length - 1)
  const y = (v: number) => top + (1 - v / max) * (H - top - bottom)
  const line = (values: number[]) => values.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  const ticks = Array.from({ length: max / 1000 + 1 }, (_, i) => i * 1000)
  const last = manual.length - 1

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Cost without AI versus cost using AI by week"
      className="absolute inset-0 w-full h-full"
    >
      {ticks.map((t) => (
        <g key={t}>
          <line x1={left} x2={W - right} y1={y(t)} y2={y(t)} stroke="#eef2f6" />
          <text x={left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#94a3b8">
            {t === 0 ? '$0' : `$${t / 1000}K`}
          </text>
        </g>
      ))}
      <line
        x1={x(selected)}
        x2={x(selected)}
        y1={top}
        y2={H - bottom}
        stroke="#cbd5e1"
        strokeDasharray="3 3"
      />
      <polyline points={line(manual)} fill="none" stroke={TEAL} strokeWidth="2.5" />
      <polyline points={line(ai)} fill="none" stroke={DARK} strokeWidth="2.5" />
      {manual.map((v, i) => (
        <circle key={`m${i}`} cx={x(i)} cy={y(v)} r={i === selected ? 5 : 3.5} fill={TEAL} />
      ))}
      {ai.map((v, i) => (
        <circle key={`a${i}`} cx={x(i)} cy={y(v)} r={i === selected ? 5 : 3.5} fill={DARK} />
      ))}
      <text x={x(last) + 12} y={y(manual[last]) + 4} fontSize="12" fontWeight="600" fill="#0d212c">
        Without AI {formatUsd(manual[last])}
      </text>
      <text x={x(last) + 12} y={y(ai[last]) + 4} fontSize="12" fontWeight="600" fill="#0d212c">
        Using AI {formatUsd(ai[last])}
      </text>
      {labels.map((label, i) => (
        <text
          key={label}
          x={x(i)}
          y={H - 4}
          textAnchor="middle"
          fontSize="11"
          fontWeight={i === selected ? 700 : 400}
          fill={i === selected ? '#0d212c' : '#94a3b8'}
        >
          {label}
        </text>
      ))}
    </svg>
  )
}

export interface UsageInsightsScreenProps {
  /** KPIs the Partnership Admin built, kept by the page; shown as extra Overview cards */
  customKpis?: CustomKpi[]
  /** Save a new or edited KPI (Partnership Admin) */
  onSaveKpi?: (kpi: CustomKpi) => void
  onDeleteKpi?: (id: string) => void
  /** The cases behind the assessments by status; the seed cases when omitted */
  requests?: PartnershipRequest[]
  /** Only the Partnership Admin can change the Value/ROI inputs and recalculate */
  canRecalculate?: boolean
  /** The inputs the numbers are calculated from, kept by the page so every profile sees them */
  assumptions?: UsageAssumptions
  onRecalculate?: (assumptions: UsageAssumptions) => void
  /** Shown under the inputs when they cannot be edited */
  readOnlyNote?: string
  /** Replaces the Assessments by Status section, e.g. with TDD Admin's own assessments */
  renderStatusSection?: (weekIndex: number) => React.ReactNode
}

export const UsageInsightsScreen: React.FC<UsageInsightsScreenProps> = ({
  requests = INITIAL_PARTNERSHIP_REQUESTS,
  canRecalculate = false,
  customKpis = [],
  onSaveKpi,
  onDeleteKpi,
  assumptions: sharedAssumptions,
  onRecalculate,
  readOnlyNote = 'Only an admin can edit the inputs.',
  renderStatusSection,
}) => {
  const [weekIndex, setWeekIndex] = useState(DEFAULT_WEEK_INDEX)
  const [ownAssumptions, setOwnAssumptions] = useState<UsageAssumptions>(DEFAULT_ASSUMPTIONS)
  // The numbers use the last recalculated inputs; the Admin edits a draft until then
  const assumptions = sharedAssumptions ?? ownAssumptions
  // The inputs are edited as text, so a field can be emptied; the numbers only use applied values
  const toDraft = (a: UsageAssumptions) =>
    Object.fromEntries(Object.entries(a).map(([k, v]) => [k, String(v)])) as Record<
      keyof UsageAssumptions,
      string
    >
  const [draft, setDraft] = useState(() => toDraft(assumptions))
  useEffect(() => setDraft(toDraft(assumptions)), [assumptions])
  const parsed = Object.fromEntries(
    Object.entries(draft).map(([k, v]) => [k, v.trim() === '' ? NaN : Number(v)])
  ) as unknown as UsageAssumptions
  const valid = Object.values(parsed).every((v) => Number.isFinite(v) && v >= 0)
  // Recalculate only once something has changed, and every field has a value
  const changed =
    valid &&
    (Object.keys(parsed) as (keyof UsageAssumptions)[]).some((k) => parsed[k] !== assumptions[k])
  // The inputs start collapsed and read-only; the Partnership Admin unlocks them with Edit inputs
  // How costs are calculated: a side drawer with the inputs, read-only until the Admin edits them
  const [inputsOpen, setInputsOpen] = useState(false)
  const [editingInputs, setEditingInputs] = useState(false)
  const cancelEdit = () => {
    setDraft(toDraft(assumptions))
    setEditingInputs(false)
  }
  const closeInputs = () => {
    cancelEdit()
    setInputsOpen(false)
  }
  const latestClose = useRef(closeInputs)
  latestClose.current = closeInputs
  useEffect(() => {
    if (!inputsOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && latestClose.current()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [inputsOpen])
  const [chartRef, chartSize] = useSize<HTMLDivElement>()
  const [showAll, setShowAll] = useState(false)

  const week = USAGE_WEEKS[weekIndex]
  const manualSeries = USAGE_WEEKS.map((w) => manualCost(w, assumptions))
  const aiSeries = USAGE_WEEKS.map((w) => aiCost(w, assumptions))
  const manual = manualSeries[weekIndex]
  const ai = aiSeries[weekIndex]
  const roi = ai > 0 ? manual / ai : 0

  const setValue = (key: keyof UsageAssumptions, raw: string) =>
    setDraft((prev) => ({ ...prev, [key]: raw }))

  // A short circular progress runs on the cost card, then the updated numbers show
  const [recalculating, setRecalculating] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => (timer.current ? clearTimeout(timer.current) : undefined), [])
  const recalculate = () => {
    setRecalculating(true)
    timer.current = setTimeout(() => {
      if (onRecalculate) onRecalculate(parsed)
      else {
        setOwnAssumptions(parsed)
      }
      setRecalculating(false)
      setEditingInputs(false)
    }, 1500)
  }

  // Custom KPIs: the popup, and the selected week's figures they are worked out from
  const [kpiModal, setKpiModal] = useState<{ kpi?: CustomKpi } | null>(null)
  const kpiValues = kpiValuesFor(week, assumptions)

  const groups = groupAssessmentsByStatus(requests)
  // In Progress is shown per workflow stage: how many assessments are at each of the six stages
  const stageCounts = (items: { name: string; code: string }[]) =>
    WORKFLOW_STAGES.map((stage) => ({
      stage,
      count: items.filter((item) => {
        const r = requests.find((c) => c.requestCode === item.code && c.companyName === item.name)
        return r && getStageLabel(r) === stage
      }).length,
    }))

  const shown = showAll ? 6 : 4

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Overview */}
      <section aria-labelledby="usage-overview" className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 id="usage-overview" className="text-lg font-semibold text-[#0d212c]">
            Overview
          </h2>
          <div className="flex items-center gap-2">
            {canRecalculate && onSaveKpi && (
              <button
                type="button"
                onClick={() => setKpiModal({})}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border-default bg-bg-default text-xs font-medium text-text-primary hover:bg-bg-hover cursor-pointer transition"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                Create KPI
              </button>
            )}
            <button
              type="button"
              aria-label="Previous week"
              disabled={weekIndex === 0}
              onClick={() => setWeekIndex((i) => i - 1)}
              className="w-9 h-9 rounded-lg border border-[#e2e8f0] bg-white flex items-center justify-center text-[#475569] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="relative">
              <Calendar
                className="w-4 h-4 text-[#36c0c9] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <select
                aria-label="Week"
                value={weekIndex}
                onChange={(e) => setWeekIndex(Number(e.target.value))}
                className="h-9 appearance-none pl-9 pr-9 rounded-lg border border-[#e2e8f0] bg-white text-sm font-medium text-[#0d212c] hover:border-[#bcc7d3] focus:outline-none focus:border-[#a3b1c2] cursor-pointer"
              >
                {USAGE_WEEKS.map((w, i) => (
                  <option key={w.full} value={i}>
                    {w.full}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
            </div>
            <button
              type="button"
              aria-label="Next week"
              disabled={weekIndex === USAGE_WEEKS.length - 1}
              onClick={() => setWeekIndex((i) => i + 1)}
              className="w-9 h-9 rounded-lg border border-[#e2e8f0] bg-white flex items-center justify-center text-[#475569] hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Output Generated"
            value={String(week.calls)}
            caption={`${week.calls} assessment calls`}
            icon={<PhoneCall className="w-5 h-5 text-[#0284c7] stroke-[2]" />}
          />
          <KpiCard
            title="Tokens Consumed"
            value={`${week.tokensM.toFixed(1)}M`}
            caption={`week of ${week.full}`}
            icon={<Hash className="w-5 h-5 text-[#6366f1] stroke-[2]" />}
          />
          <KpiCard
            title="Estimated cost using AI"
            value={formatUsd(ai)}
            caption={`week of ${week.short}, 2026 · Text & Voice tokens`}
            icon={<Coins className="w-5 h-5 text-[#d97706] stroke-[2]" />}
          />
          <KpiCard
            title="Web Search Credits"
            value={week.searchCredits.toLocaleString('en-US')}
            caption="Search, extract & page reads"
            icon={<Search className="w-5 h-5 text-[#d97706] stroke-[2]" />}
          />
          {customKpis.map((kpi) => {
            const result = evaluateCustomKpi(kpi, kpiValues)
            return (
              <div
                key={kpi.id}
                className="relative bg-bg-default p-4 sm:p-5 rounded-2xl border border-border-default shadow-xs flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-[0.06em] truncate">
                    {kpi.name}
                  </span>
                  {canRecalculate ? (
                    <span className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setKpiModal({ kpi })}
                        aria-label={`Edit ${kpi.name}`}
                        className="p-1 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-hover cursor-pointer transition"
                      >
                        <Pencil className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteKpi?.(kpi.id)}
                        aria-label={`Delete ${kpi.name}`}
                        className="p-1 rounded-lg text-text-tertiary hover:text-text-error hover:bg-bg-hover cursor-pointer transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                      </button>
                    </span>
                  ) : (
                    <Sigma
                      className="w-5 h-5 text-text-tertiary shrink-0"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="text-4xl font-medium text-text-primary leading-none my-1">
                  {'value' in result ? formatKpiValue(result.value, kpi.unit) : '-'}
                </div>
                <div className="h-[1px] bg-border-subtle w-full" />
                <div
                  className={`text-xs font-medium ${'value' in result ? 'text-text-secondary' : 'text-text-error'}`}
                >
                  {'value' in result ? describeCustomKpi(kpi) : result.error}
                </div>
              </div>
            )
          })}
        </div>
        {kpiModal && onSaveKpi && (
          <CreateKpiModal
            initial={kpiModal.kpi}
            values={kpiValues}
            weekLabel={week.full}
            onSave={(kpi) => {
              onSaveKpi(kpi)
              setKpiModal(null)
            }}
            onClose={() => setKpiModal(null)}
          />
        )}
      </section>

      {/* Value / ROI */}
      <section aria-labelledby="usage-roi" className="flex flex-col gap-4">
        <h2 id="usage-roi" className="text-lg font-semibold text-[#0d212c]">
          Value/ROI
        </h2>
        {/* The page's 4-column grid: the chart under the first three Overview cards, the figures
            under the fourth. Stacked below 1024px. */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-stretch">
          <div className="lg:col-span-3 min-w-0 bg-white rounded-2xl border border-[#e2e8f0] shadow-xs p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 flex-wrap shrink-0">
              <div className="flex items-center gap-4 flex-wrap">
                <h3 className="text-base font-semibold text-[#0d212c]">
                  Cost without AI vs cost using AI
                </h3>
                <div className="flex items-center gap-3 text-xs text-[#64748b]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-0.5" style={{ backgroundColor: TEAL }} />
                    Cost without AI
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-0.5" style={{ backgroundColor: DARK }} />
                    Cost using AI
                  </span>
                </div>
              </div>
              <span className="text-xs text-text-tertiary">
                Week of {week.full} · based on {INPUT_ROWS.length} inputs
              </span>
            </div>
            {/* Fills the rest of the card, so the week labels sit on the card's bottom padding.
                The chart is drawn over it, so its size never feeds back into the measurement. */}
            <div
              ref={chartRef}
              className="relative flex-1 min-w-0"
              style={{ minHeight: CHART_MIN_HEIGHT }}
            >
              {chartSize.width > 0 && (
                <CostChart
                  manual={manualSeries}
                  ai={aiSeries}
                  selected={weekIndex}
                  labels={USAGE_WEEKS.map((w) => w.short)}
                  width={chartSize.width}
                  height={chartSize.height}
                />
              )}
            </div>
          </div>

          <div className="relative min-w-0 bg-white rounded-2xl border border-[#e2e8f0] shadow-xs p-5 sm:p-6 flex flex-col gap-4">
            {recalculating && (
              <div
                role="status"
                aria-label="Recalculating"
                className="absolute inset-0 z-10 rounded-2xl bg-white/90 flex flex-col items-center justify-center gap-3"
              >
                <svg viewBox="0 0 48 48" className="w-12 h-12 animate-spin" aria-hidden="true">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke={TEAL}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="42 126"
                  />
                </svg>
                <span className="text-sm font-medium text-[#475569]">Recalculating…</span>
              </div>
            )}
            <dl className="flex flex-col divide-y divide-border-subtle">
              {[
                {
                  label: 'Cost without AI',
                  value: formatUsd(manual),
                  tip: TIPS.withoutAi,
                  note: `${week.calls * assumptions.hoursPerAssessment} hours at ${formatUsd(assumptions.costPerHour)}/h`,
                },
                {
                  label: 'Cost using AI',
                  value: formatUsd(ai),
                  tip: TIPS.usingAi,
                  note: `${week.tokensM.toFixed(1)}M tokens · Text & Voice`,
                },
                {
                  label: 'Estimated ROI',
                  value: `${Math.round(roi)}x`,
                  tip: TIPS.roi,
                  accent: true,
                },
                {
                  label: 'Estimated savings',
                  value: formatUsd(manual - ai),
                  tip: TIPS.savings,
                  accent: true,
                  note: week.full,
                },
              ].map((f) => (
                <div key={f.label} className="flex flex-col gap-0.5 py-2.5 first:pt-0 last:pb-0">
                  <dt className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                    {f.label}
                    <InfoTip label={f.label} text={f.tip} />
                  </dt>
                  <dd
                    className={`text-xl font-semibold ${f.accent ? 'text-[var(--app-accent)]' : 'text-text-primary'}`}
                  >
                    {f.value}
                  </dd>
                  {f.note && <span className="text-[11px] text-text-tertiary">{f.note}</span>}
                </div>
              ))}
            </dl>
            {/* Footer: the drawer that explains the figures */}
            <div className="mt-auto pt-3 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setInputsOpen(true)}
                aria-haspopup="dialog"
                aria-expanded={inputsOpen}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-text-link hover:underline cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                How costs are calculated
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How costs are calculated: right side drawer, no overlay */}
      {inputsOpen && (
        <aside
          role="dialog"
          aria-labelledby="usage-inputs-title"
          className="fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-bg-default border-l border-border-default shadow-2xl flex flex-col"
        >
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border-subtle shrink-0">
            <div className="flex flex-col gap-1">
              <h2 id="usage-inputs-title" className="text-base font-semibold text-text-primary">
                How costs are calculated
              </h2>
              <p className="text-xs text-text-secondary">Inputs behind the cost and ROI numbers.</p>
            </div>
            <button
              type="button"
              onClick={closeInputs}
              aria-label="Close how costs are calculated"
              className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-hover cursor-pointer transition"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6 overscroll-contain">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {INPUT_ROWS.map((row) => (
                <div key={row.key} className="flex flex-col gap-1.5">
                  <label htmlFor={`usage-${row.key}`} className="flex flex-col">
                    <span className="text-xs font-semibold text-text-primary">{row.label}</span>
                    {row.hint && <span className="text-[11px] text-text-tertiary">{row.hint}</span>}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      {row.prefix && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary">
                          {row.prefix}
                        </span>
                      )}
                      <input
                        id={`usage-${row.key}`}
                        type="number"
                        min="0"
                        step={row.step}
                        value={draft[row.key]}
                        disabled={!canRecalculate || !editingInputs}
                        onChange={(e) => setValue(row.key, e.target.value)}
                        className={`w-full h-10 rounded-lg border border-border-default bg-bg-input text-sm font-semibold text-text-primary px-3 transition focus:outline-none focus:border-border-focus disabled:bg-bg-surface-1 disabled:text-text-secondary disabled:cursor-not-allowed ${
                          row.prefix ? 'pl-6' : ''
                        }`}
                      />
                    </div>
                    {row.unit && (
                      <span className="text-xs text-text-tertiary w-10">{row.unit}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-border-subtle bg-bg-surface-1 px-4 py-3 flex flex-col gap-1.5 text-xs text-text-secondary">
              <span>
                <span className="font-semibold text-text-primary">Cost without AI</span> = outputs ×
                hours × hourly cost
              </span>
              <span>
                <span className="font-semibold text-text-primary">Cost using AI</span> = tokens ×
                price + embeddings + search credits
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border-subtle shrink-0 flex-wrap">
            <span className="text-[11px] text-text-tertiary">
              {canRecalculate
                ? editingInputs
                  ? 'Recalculate to apply your changes.'
                  : 'Read-only until you edit the inputs.'
                : readOnlyNote}
            </span>
            {canRecalculate &&
              (editingInputs ? (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="md" onClick={cancelEdit} disabled={recalculating}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={recalculate}
                    disabled={recalculating || !changed}
                  >
                    Recalculate
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setEditingInputs(true)}
                  className="gap-1.5"
                >
                  <Pencil className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                  Edit inputs
                </Button>
              ))}
          </div>
        </aside>
      )}

      {/* Assessments by status */}
      {renderStatusSection ? (
        renderStatusSection(weekIndex)
      ) : (
        <section aria-labelledby="usage-status" className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 id="usage-status" className="text-lg font-semibold text-[#0d212c]">
              Assessments by Status
            </h2>
            <span className="text-sm text-[#64748b]">Week of {week.full}</span>
          </div>
          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs p-5 sm:p-6 flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:divide-x md:divide-[#f1f5f9]">
              {groups.map((group) => (
                <div
                  key={group.title}
                  className="flex flex-col gap-3 md:first:pl-0 md:pl-6 md:pr-6 md:last:pr-0"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-base font-semibold text-[#0d212c]">{group.title}</h3>
                    <span
                      className="text-base font-semibold text-[#0d212c]"
                      aria-label={`${group.items.length} ${group.title.toLowerCase()}`}
                    >
                      {group.items.length}
                    </span>
                  </div>
                  {group.title === 'In Progress' ? (
                    <ul
                      aria-label={group.title}
                      className="flex flex-col divide-y divide-[#f1f5f9]"
                    >
                      {stageCounts(group.items).map(({ stage, count }) => (
                        <li
                          key={stage}
                          className="flex items-center justify-between gap-4 py-3 text-sm"
                        >
                          <span className="text-[#0d212c] truncate" title={stage}>
                            {stage}
                          </span>
                          <span className="text-[#36c0c9] font-medium whitespace-nowrap pl-3 shrink-0">
                            {count}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <ul
                      aria-label={group.title}
                      className="flex flex-col divide-y divide-[#f1f5f9]"
                    >
                      {group.items.length === 0 && (
                        <li className="py-3 text-sm text-[#94a3b8]">No assessments</li>
                      )}
                      {group.items.slice(0, shown).map((item) => (
                        <li
                          key={`${item.name}-${item.code}`}
                          className="flex items-center justify-between gap-4 py-3 text-sm"
                        >
                          <span className="text-[#0d212c] truncate" title={item.name}>
                            {item.name}
                          </span>
                          <span className="text-[#36c0c9] font-medium whitespace-nowrap pl-3 shrink-0">
                            {item.code}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            {/* Only Completed and Closed list cases, so See more is needed only when they run long */}
            {groups.some((g) => g.title !== 'In Progress' && g.items.length > 4) && (
              <button
                type="button"
                onClick={() => setShowAll((s) => !s)}
                className="self-center inline-flex items-center gap-1 text-sm font-medium text-[#36c0c9] hover:text-[#2fb0b9] cursor-pointer transition"
              >
                {showAll ? 'See less' : 'See more'}
                {showAll ? (
                  <ChevronUp className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
