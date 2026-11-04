/**
 * UsageInsightsScreen — Screen
 * Usage insights, weekly AI output metrics, ROI calculator, and Assessments by Status breakdown.
 * Styled according to M42 Tech Due Diligence brand guidelines.
 */

'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  DollarSign,
  BarChart3,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Info,
  Check,
  PhoneCall,
  ChartLine,
  List,
} from 'lucide-react'

interface MonthWeek {
  id: string
  label: string
  shortLabel: string
  monday: Date
  sunday: Date
  isCurrent?: boolean
}

// All weeks for October 2026 (Monday to Sunday)
const OCTOBER_WEEKS: MonthWeek[] = [
  {
    id: 'w1',
    label: 'Sep 28 – Oct 4, 2026',
    shortLabel: 'Sep 28 – Oct 4',
    monday: new Date(2026, 8, 28),
    sunday: new Date(2026, 9, 4),
  },
  {
    id: 'w2',
    label: 'Oct 5 – Oct 11, 2026',
    shortLabel: 'Oct 5 – 11',
    monday: new Date(2026, 9, 5),
    sunday: new Date(2026, 9, 11),
  },
  {
    id: 'w3',
    label: 'Oct 12 – Oct 18, 2026',
    shortLabel: 'Oct 12 – 18',
    monday: new Date(2026, 9, 12),
    sunday: new Date(2026, 9, 18),
    isCurrent: true,
  },
  {
    id: 'w4',
    label: 'Oct 19 – Oct 25, 2026',
    shortLabel: 'Oct 19 – 25',
    monday: new Date(2026, 9, 19),
    sunday: new Date(2026, 9, 25),
  },
  {
    id: 'w5',
    label: 'Oct 26 – Nov 1, 2026',
    shortLabel: 'Oct 26 – Nov 1',
    monday: new Date(2026, 9, 26),
    sunday: new Date(2026, 10, 1),
  },
]

// Weekly usage per week of OCTOBER_WEEKS; token counts are in millions
interface WeekUsage {
  calls: number
  inputTokens: number
  outputTokens: number
  voiceInputTokens: number
  voiceOutputTokens: number
  embeddingTokens: number
  searchCredits: number
}

const WEEKLY_USAGE: WeekUsage[] = [
  {
    calls: 17,
    inputTokens: 7.0,
    outputTokens: 5.4,
    voiceInputTokens: 2.1,
    voiceOutputTokens: 1.3,
    embeddingTokens: 10.4,
    searchCredits: 2100,
  },
  {
    calls: 19,
    inputTokens: 7.7,
    outputTokens: 6.0,
    voiceInputTokens: 2.3,
    voiceOutputTokens: 1.4,
    embeddingTokens: 11.2,
    searchCredits: 2300,
  },
  {
    calls: 20,
    inputTokens: 8.2,
    outputTokens: 6.4,
    voiceInputTokens: 2.5,
    voiceOutputTokens: 1.5,
    embeddingTokens: 12.0,
    searchCredits: 2500,
  }, // Oct 12 - 18, 2026
  {
    calls: 22,
    inputTokens: 8.9,
    outputTokens: 7.0,
    voiceInputTokens: 2.7,
    voiceOutputTokens: 1.6,
    embeddingTokens: 13.1,
    searchCredits: 2700,
  },
  {
    calls: 21,
    inputTokens: 8.6,
    outputTokens: 6.7,
    voiceInputTokens: 2.6,
    voiceOutputTokens: 1.6,
    embeddingTokens: 12.6,
    searchCredits: 2600,
  },
]

// Text and voice tokens shown as "Tokens Consumed" (embeddings are counted separately)
const getTokensConsumed = (week: WeekUsage) =>
  week.inputTokens + week.outputTokens + week.voiceInputTokens + week.voiceOutputTokens

interface RoiInputs {
  hours: number
  costPerHour: number
  inputTokenPrice: number
  outputTokenPrice: number
  voiceInputTokenPrice: number
  voiceOutputTokenPrice: number
  embeddingTokenPrice: number
  searchCreditPrice: number
}

const DEFAULT_ROI_INPUTS: RoiInputs = {
  hours: 4,
  costPerHour: 30,
  inputTokenPrice: 1.25,
  outputTokenPrice: 10,
  voiceInputTokenPrice: 10,
  voiceOutputTokenPrice: 20,
  embeddingTokenPrice: 0.13,
  searchCreditPrice: 0.008,
}

const ROI_FIELDS: {
  key: keyof RoiInputs
  label: string
  hint: string
  unit: string
  prefix?: string
  step: number
  min: number
  max: number
  decimals: number
}[] = [
  {
    key: 'hours',
    label: 'Manual hours per output',
    hint: '(per assessment)',
    unit: 'hours',
    step: 1,
    min: 1,
    max: 100,
    decimals: 0,
  },
  {
    key: 'costPerHour',
    label: 'Resource cost per hour',
    hint: '(cost of the person doing it manually)',
    unit: 'USD',
    prefix: '$',
    step: 1,
    min: 1,
    max: 1000,
    decimals: 0,
  },
  {
    key: 'inputTokenPrice',
    label: 'Input token price',
    hint: '(per 1M input tokens)',
    unit: 'USD',
    prefix: '$',
    step: 0.25,
    min: 0,
    max: 100,
    decimals: 2,
  },
  {
    key: 'outputTokenPrice',
    label: 'Output token price',
    hint: '(per 1M output tokens)',
    unit: 'USD',
    prefix: '$',
    step: 0.5,
    min: 0,
    max: 100,
    decimals: 2,
  },
  {
    key: 'voiceInputTokenPrice',
    label: 'Input token (voice)',
    hint: '(per 1M voice tokens)',
    unit: 'USD',
    prefix: '$',
    step: 0.5,
    min: 0,
    max: 100,
    decimals: 2,
  },
  {
    key: 'voiceOutputTokenPrice',
    label: 'Output token (voice)',
    hint: '(per 1M voice tokens)',
    unit: 'USD',
    prefix: '$',
    step: 0.5,
    min: 0,
    max: 100,
    decimals: 2,
  },
  {
    key: 'embeddingTokenPrice',
    label: 'Embedding token price',
    hint: '(per 1M tokens · uploaded files)',
    unit: 'USD',
    prefix: '$',
    step: 0.01,
    min: 0,
    max: 100,
    decimals: 2,
  },
  {
    key: 'searchCreditPrice',
    label: 'Price per search credit',
    hint: '(web search)',
    unit: 'USD',
    prefix: '$',
    step: 0.001,
    min: 0,
    max: 10,
    decimals: 3,
  },
]

const computeManualCost = (week: WeekUsage, inputs: RoiInputs) =>
  Math.max(0, Math.round(week.calls * inputs.hours * inputs.costPerHour))

const computeAiCost = (week: WeekUsage, inputs: RoiInputs) =>
  Math.max(
    1,
    Math.round(
      week.inputTokens * inputs.inputTokenPrice +
        week.outputTokens * inputs.outputTokenPrice +
        week.voiceInputTokens * inputs.voiceInputTokenPrice +
        week.voiceOutputTokens * inputs.voiceOutputTokenPrice +
        week.embeddingTokens * inputs.embeddingTokenPrice +
        week.searchCredits * inputs.searchCreditPrice
    )
  )

// Space kept around the plot for axis labels and the end-of-line value labels
const CHART_PADDING = { left: 56, right: 130, top: 16, bottom: 40 }

interface CostChartProps {
  manual: number[]
  ai: number[]
  selectedIndex: number
}

// Weekly manual cost vs AI cost line chart; the selected week is highlighted
function CostChart({ manual, ai, selectedIndex }: CostChartProps) {
  // The chart is drawn at the container's size so it fills the card height
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 640, height: 300 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) setSize({ width, height })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const CHART_PLOT = {
    left: CHART_PADDING.left,
    right: size.width - CHART_PADDING.right,
    top: CHART_PADDING.top,
    bottom: size.height - CHART_PADDING.bottom,
  }
  const maxValue = Math.max(...manual, ...ai, 1)
  const tickStep = maxValue <= 6000 ? 1000 : Math.ceil(maxValue / 5000) * 1000
  const yMax = Math.ceil(maxValue / tickStep) * tickStep
  const ticks = Array.from({ length: yMax / tickStep + 1 }, (_, i) => i * tickStep)

  const x = (i: number) =>
    CHART_PLOT.left + ((CHART_PLOT.right - CHART_PLOT.left) * i) / (manual.length - 1)
  const y = (v: number) => CHART_PLOT.bottom - ((CHART_PLOT.bottom - CHART_PLOT.top) * v) / yMax
  const points = (values: number[]) => values.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  const last = manual.length - 1

  const series = [
    { key: 'manual', values: manual, color: '#36c0c9', label: 'Manual' },
    { key: 'ai', values: ai, color: '#0d212c', label: 'AI' },
  ]

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[260px]">
      <svg
        viewBox={`0 0 ${size.width} ${size.height}`}
        className="absolute inset-0 w-full h-full"
        role="img"
        aria-label="Weekly manual cost vs AI cost"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={CHART_PLOT.left}
              x2={CHART_PLOT.right}
              y1={y(t)}
              y2={y(t)}
              stroke="#f1f5f9"
              strokeWidth={1}
            />
            <text
              x={CHART_PLOT.left - 12}
              y={y(t) + 4}
              textAnchor="end"
              fontSize={12}
              fill="#94a3b8"
            >
              ${t / 1000 === 0 ? 0 : `${t / 1000}K`}
            </text>
          </g>
        ))}

        <line
          x1={x(selectedIndex)}
          x2={x(selectedIndex)}
          y1={CHART_PLOT.top}
          y2={CHART_PLOT.bottom}
          stroke="#cbd5e1"
          strokeDasharray="4 4"
          strokeWidth={1}
        />

        {series.map((s) => (
          <g key={s.key}>
            <polyline
              points={points(s.values)}
              fill="none"
              stroke={s.color}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {s.values.map((v, i) => (
              <circle
                key={i}
                cx={x(i)}
                cy={y(v)}
                r={i === selectedIndex ? 6 : 4}
                fill={s.color}
                stroke="#ffffff"
                strokeWidth={i === selectedIndex ? 2 : 0}
              />
            ))}
            <text
              x={x(last) + 14}
              y={y(s.values[last]) + 5}
              fontSize={14}
              fontWeight={600}
              fill="#0d212c"
            >
              {s.label} ${s.values[last].toLocaleString()}
            </text>
          </g>
        ))}

        {OCTOBER_WEEKS.map((w, i) => (
          <text
            key={w.id}
            x={x(i)}
            y={CHART_PLOT.bottom + 28}
            textAnchor="middle"
            fontSize={12}
            fontWeight={i === selectedIndex ? 700 : 400}
            fill={i === selectedIndex ? '#0d212c' : '#94a3b8'}
          >
            {w.shortLabel}
          </text>
        ))}
      </svg>
    </div>
  )
}

function formatWeekDisplay(monday: Date, sunday: Date): string {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const mMonth = months[monday.getMonth()]
  const sMonth = months[sunday.getMonth()]
  const mDay = monday.getDate()
  const sDay = sunday.getDate()
  const year = sunday.getFullYear()

  if (monday.getMonth() === sunday.getMonth() && monday.getFullYear() === sunday.getFullYear()) {
    return `${mMonth} ${mDay} – ${sDay}, ${year}`
  }
  if (monday.getFullYear() === sunday.getFullYear()) {
    return `${mMonth} ${mDay} – ${sMonth} ${sDay}, ${year}`
  }
  return `${mMonth} ${mDay}, ${monday.getFullYear()} – ${sMonth} ${sDay}, ${year}`
}

interface NumericStepperInputProps {
  value: number
  onChange: (val: number) => void
  unit: string
  prefix?: string
  step?: number
  min?: number
  max?: number
  decimals?: number
}

function NumericStepperInput({
  value,
  onChange,
  unit,
  prefix,
  step = 1,
  min = 0,
  max = 9999999,
  decimals = 0,
}: NumericStepperInputProps) {
  const format = (num: number) => num.toFixed(decimals)
  const [localStr, setLocalStr] = useState<string>(format(value))

  useEffect(() => {
    // Keep an emptied field empty while editing instead of putting a 0 back
    setLocalStr((prev) =>
      parseFloat(prev) === value || (prev === '' && value === 0) ? prev : value.toFixed(decimals)
    )
  }, [value, decimals])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    // Drop leading zeros so typing into a 0 field gives "5", not "05"
    const filtered = raw.replace(/[^0-9.]/g, '').replace(/^0+(?=\d)/, '')
    setLocalStr(filtered)
    const num = parseFloat(filtered)
    if (!isNaN(num)) {
      onChange(Math.max(min, Math.min(max, num)))
    } else if (filtered === '') {
      onChange(0)
    }
  }

  const handleBlur = () => {
    const num = parseFloat(localStr)
    if (isNaN(num)) {
      setLocalStr(format(min))
      onChange(min)
    } else {
      const clamped = Math.max(min, Math.min(max, num))
      setLocalStr(format(clamped))
      onChange(clamped)
    }
  }

  const stepBy = (delta: number) => {
    const next = Math.max(min, Math.min(max, (value || 0) + delta))
    const rounded = parseFloat(next.toFixed(Math.max(decimals, 3)))
    setLocalStr(format(rounded))
    onChange(rounded)
  }

  const increment = () => stepBy(step)

  const decrement = () => stepBy(-step)

  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="h-[36px] flex items-center bg-white border border-[#e2e8f0] rounded-xl px-2.5 shadow-2xs hover:border-[#cbd5e1] focus-within:border-[#cbd5e1] focus-within:bg-[#f8fafc] transition-colors">
        {prefix && (
          <span className="text-xs text-[#94a3b8] font-normal mr-1 select-none">{prefix}</span>
        )}
        <input
          type="text"
          inputMode="decimal"
          value={localStr}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={(e) => e.target.select()}
          className="w-14 bg-transparent text-xs sm:text-[13px] font-semibold text-[#0d212c] text-right outline-none mr-1.5 leading-none"
        />
        <div className="flex flex-col items-center justify-center border-l border-[#f1f5f9] pl-1.5 text-[#94a3b8] -space-y-0.5">
          <button
            type="button"
            onClick={increment}
            className="p-0.5 hover:text-[#0d212c] active:scale-95 transition-colors cursor-pointer bg-transparent border-0 leading-none"
            title="Increase"
          >
            <ChevronUp className="w-3 h-3 stroke-[2.2]" />
          </button>
          <button
            type="button"
            onClick={decrement}
            className="p-0.5 hover:text-[#0d212c] active:scale-95 transition-colors cursor-pointer bg-transparent border-0 leading-none"
            title="Decrease"
          >
            <ChevronDown className="w-3 h-3 stroke-[2.2]" />
          </button>
        </div>
      </div>
      <span className="text-xs text-[#64748b] font-medium min-w-[36px] select-none">{unit}</span>
    </div>
  )
}

interface AssessmentItem {
  id: string
  name: string
  round: string
}

export const UsageInsightsScreen: React.FC = () => {
  // Week dropdown selection state (defaults to index 2: Oct 12 – Oct 18, 2026)
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(2)
  const [weekDropdownOpen, setWeekDropdownOpen] = useState(false)
  const weekDropdownRef = useRef<HTMLDivElement>(null)

  const selectedWeek = OCTOBER_WEEKS[selectedWeekIndex]

  // Single See More expansion state to load all assessments data
  const [showAllAssessments, setShowAllAssessments] = useState<boolean>(false)

  useEffect(() => {
    if (!weekDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (weekDropdownRef.current && !weekDropdownRef.current.contains(e.target as Node)) {
        setWeekDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [weekDropdownOpen])

  const goToPrevWeek = () => {
    setSelectedWeekIndex((prev) => Math.max(0, prev - 1))
  }

  const goToNextWeek = () => {
    setSelectedWeekIndex((prev) => Math.min(OCTOBER_WEEKS.length - 1, prev + 1))
  }

  // Week-based dynamic values (Week 3 aligns with 20 calls & 18.6M tokens)
  const weekUsage = WEEKLY_USAGE[selectedWeekIndex] || WEEKLY_USAGE[2]

  const weekOutputsCount = weekUsage.calls
  const weekTokensConsumed = getTokensConsumed(weekUsage).toFixed(1)

  // Assumptions Form inputs state
  const [formInputs, setFormInputs] = useState<RoiInputs>(DEFAULT_ROI_INPUTS)

  // Applied state: Right-side financial impact only recalculates when user clicks Recalculate
  const [appliedInputs, setAppliedInputs] = useState<RoiInputs>(DEFAULT_ROI_INPUTS)

  const hasPendingChanges = useMemo(() => {
    return ROI_FIELDS.some(({ key }) => formInputs[key] !== appliedInputs[key])
  }, [formInputs, appliedInputs])

  const [roiView, setRoiView] = useState<'chart' | 'list'>('chart')

  const [isRecalculating, setIsRecalculating] = useState<boolean>(false)
  const recalculateTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (recalculateTimerRef.current) clearTimeout(recalculateTimerRef.current)
    }
  }, [])

  const handleRecalculate = () => {
    if (!hasPendingChanges || isRecalculating) return

    setIsRecalculating(true)

    if (recalculateTimerRef.current) clearTimeout(recalculateTimerRef.current)

    recalculateTimerRef.current = setTimeout(() => {
      // Regenerate and update the Value & ROI data once recalculation completes
      setAppliedInputs(formInputs)
      setIsRecalculating(false)
    }, 800)
  }

  // Financial calculations
  const totalManualHours = useMemo(() => {
    return Math.max(0, Math.round(weekOutputsCount * appliedInputs.hours))
  }, [weekOutputsCount, appliedInputs])

  const totalManualCost = useMemo(() => {
    return computeManualCost(weekUsage, appliedInputs)
  }, [weekUsage, appliedInputs])

  const totalAiCost = useMemo(() => {
    return computeAiCost(weekUsage, appliedInputs)
  }, [weekUsage, appliedInputs])

  const weekAiCost = totalAiCost

  // Weekly series for the Manual cost vs AI cost chart
  const manualCostSeries = useMemo(
    () => WEEKLY_USAGE.map((week) => computeManualCost(week, appliedInputs)),
    [appliedInputs]
  )
  const aiCostSeries = useMemo(
    () => WEEKLY_USAGE.map((week) => computeAiCost(week, appliedInputs)),
    [appliedInputs]
  )

  const savedDollars = useMemo(() => {
    return Math.max(0, totalManualCost - totalAiCost)
  }, [totalManualCost, totalAiCost])

  const roiMultiple = useMemo(() => {
    if (totalAiCost <= 0) return 100
    return Math.max(1, Math.round(totalManualCost / totalAiCost))
  }, [totalManualCost, totalAiCost])

  // Week-specific assessments grouped by 3 statuses: Completed, Scheduled, Finalised
  const assessmentsByStatus = useMemo(() => {
    const weekNum = selectedWeekIndex + 1

    const completedList: AssessmentItem[] = [
      {
        id: `comp-1-${weekNum}`,
        name: 'Presight AI | Technical Questionnaire',
        round: 'Round 1',
      },
      {
        id: `comp-2-${weekNum}`,
        name: 'Directus Inc. | Data Protection & Privacy',
        round: 'Round 2',
      },
      {
        id: `comp-3-${weekNum}`,
        name: 'Pango Group LLC | Information Security',
        round: 'Initial Review',
      },
      {
        id: `comp-4-${weekNum}`,
        name: 'CloudScale AI Systems | Supply Chain Security',
        round: 'Round 3',
      },
      {
        id: `comp-5-${weekNum}`,
        name: 'CyberGuard Solutions | ISO 27001 Checklist',
        round: 'Annual Audit',
      },
      // Additional items for See More
      {
        id: `comp-6-${weekNum}`,
        name: 'PharmaTech Analytics | Clinical AI Safety',
        round: 'Pre-onboarding',
      },
      {
        id: `comp-7-${weekNum}`,
        name: 'BioHealth Analytics | Ingestion Engine Review',
        round: 'Round 1',
      },
      {
        id: `comp-8-${weekNum}`,
        name: 'Delphi AI Technologies | Architecture Discovery',
        round: 'Round 2',
      },
    ]

    const scheduledList: AssessmentItem[] = [
      {
        id: `sch-1-${weekNum}`,
        name: 'Apex Systems Advisory | Technical Assessment',
        round: 'Stage 2 Audit',
      },
      {
        id: `sch-2-${weekNum}`,
        name: 'PharmaTech Analytics | Model Governance',
        round: 'Follow-up',
      },
      {
        id: `sch-3-${weekNum}`,
        name: 'MedSec Audit Co | DOH Compliance Telemetry',
        round: 'Round 2',
      },
      {
        id: `sch-4-${weekNum}`,
        name: 'Directus Inc. | Cross-Border Data Flow',
        round: 'Round 1',
      },
      {
        id: `sch-5-${weekNum}`,
        name: 'Presight AI | API Authorization Audit',
        round: 'Round 3',
      },
      // Additional items for See More
      {
        id: `sch-6-${weekNum}`,
        name: 'BioHealth Analytics | PHI Encryption Review',
        round: 'Initial Review',
      },
      {
        id: `sch-7-${weekNum}`,
        name: 'CloudScale AI | Microservices Resilience',
        round: 'Stage 1',
      },
    ]

    const finalisedList: AssessmentItem[] = [
      {
        id: `fin-1-${weekNum}`,
        name: 'Delphi AI Technologies | SOC 2 Type II',
        round: 'Technical Final',
      },
      {
        id: `fin-2-${weekNum}`,
        name: 'HealthCloud Telemetry | Cloud Infrastructure',
        round: 'Stage 1 Discovery',
      },
      {
        id: `fin-3-${weekNum}`,
        name: 'Global Diagnostics IT | Business Continuity',
        round: 'Final Review',
      },
      {
        id: `fin-4-${weekNum}`,
        name: 'Pango Group LLC | Penetration Testing Audit',
        round: 'Final Signoff',
      },
      {
        id: `fin-5-${weekNum}`,
        name: 'BioHealth Analytics | HIPAA & Healthcare Data',
        round: 'Executive Audit',
      },
      // Additional items for See More
      {
        id: `fin-6-${weekNum}`,
        name: 'CyberGuard Solutions | BCP & ISO 22301',
        round: 'Closure Review',
      },
      {
        id: `fin-7-${weekNum}`,
        name: 'Presight AI | Comprehensive Vendor Review',
        round: 'Finalised Round',
      },
    ]

    return {
      completed: completedList,
      scheduled: scheduledList,
      finalised: finalisedList,
    }
  }, [selectedWeekIndex])

  const hasMoreAssessments = useMemo(() => {
    return (
      assessmentsByStatus.completed.length > 4 ||
      assessmentsByStatus.scheduled.length > 4 ||
      assessmentsByStatus.finalised.length > 4
    )
  }, [assessmentsByStatus])

  return (
    <div className="w-full p-4 space-y-6">
      {/* 1. Overview Section Header & Weekly Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base sm:text-lg font-semibold text-[#0d212c]">Overview</h2>

          {/* Week Selector: Arrow navigation + Dropdown + Info button */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Previous Week Arrow */}
            <button
              type="button"
              disabled={selectedWeekIndex === 0}
              onClick={goToPrevWeek}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] text-[#0d212c] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
              title="Previous week"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Week Dropdown */}
            <div className="relative" ref={weekDropdownRef}>
              <button
                type="button"
                onClick={() => setWeekDropdownOpen((o) => !o)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-[#e2e8f0] rounded-lg text-xs font-semibold text-[#0d212c] hover:border-[#cbd5e1] hover:bg-[#f8fafc] transition-all shadow-2xs cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-[#36c0c9] shrink-0" />
                <span>{selectedWeek.label}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#94a3b8] transition-transform duration-150 ${
                    weekDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {weekDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-[#e2e8f0] rounded-2xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                  <div className="px-3.5 py-2 text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider border-b border-[#f1f5f9] bg-[#f8fafc]/60 flex items-center justify-between">
                    <span>October 2026</span>
                    <span className="text-[10px] text-[#94a3b8] font-normal lowercase">
                      5 weeks
                    </span>
                  </div>
                  <div className="py-1">
                    {OCTOBER_WEEKS.map((w, idx) => {
                      const isSelected = idx === selectedWeekIndex
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => {
                            setSelectedWeekIndex(idx)
                            setWeekDropdownOpen(false)
                          }}
                          className={`w-full px-3.5 py-2 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#ddf7f9]/50 text-[#0d212c] font-semibold'
                              : 'text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0d212c] font-normal'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{w.label}</span>
                            {w.isCurrent && (
                              <span className="text-[9px] font-semibold bg-[#ddf7f9] text-[#2baab3] px-1.5 py-0.5 rounded-full">
                                Current
                              </span>
                            )}
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#36c0c9] shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Next Week Arrow */}
            <button
              type="button"
              disabled={selectedWeekIndex === OCTOBER_WEEKS.length - 1}
              onClick={goToNextWeek}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] text-[#0d212c] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
              title="Next week"
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Info Button with Tooltip */}
            <div className="relative group flex items-center">
              <button
                type="button"
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-transparent hover:border-[#e2e8f0] text-[#94a3b8] hover:text-[#0d212c] hover:bg-white transition-colors cursor-pointer"
                title="Week selection info"
                aria-label="Week selection info"
              >
                <Info className="w-4 h-4" />
              </button>
              {/* Tooltip on hover */}
              <div className="absolute right-0 top-full mt-1.5 hidden group-hover:flex z-50 whitespace-nowrap bg-[#0d212c] text-white text-[11px] font-normal px-2.5 py-1.5 rounded-lg shadow-xl pointer-events-none items-center gap-1.5 animate-in fade-in duration-150">
                <span>Week selection is valid for current month only</span>
              </div>
            </div>
          </div>
        </div>

        {/* 1. Top 3 KPI Cards — Matching Home Page KPI Card Design (110px height, horizontal line separator, 16px icon, 24px semi-bold number) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Output Generated */}
          <div className="h-[110px] p-4 bg-white rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between hover:border-[#cbd5e1] transition">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <PhoneCall className="w-4 h-4 text-[#0d212c] shrink-0" />
                <h3 className="font-semibold text-xs sm:text-sm text-[#0d212c] truncate">
                  Output Generated
                </h3>
              </div>
              <div className="text-[24px] font-semibold text-[#36c0c9] shrink-0 leading-none">
                {weekOutputsCount}
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-2 border-t border-[#e2e8f0] text-[11px] text-[#64748b]">
              <span>{weekOutputsCount} Assesment calls</span>
            </div>
          </div>

          {/* Card 2: Tokens Consumed — breakdown sits inline when the card is wide enough */}
          <div className="@container h-[110px] p-4 bg-white rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between hover:border-[#cbd5e1] transition">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <BarChart3 className="w-4 h-4 text-[#0d212c] shrink-0" />
                <h3 className="font-semibold text-xs sm:text-sm text-[#0d212c] truncate">
                  Tokens Consumed
                </h3>
              </div>
              <div className="text-[24px] font-semibold text-[#36c0c9] shrink-0 leading-none">
                {weekTokensConsumed}M
              </div>
            </div>

            <div className="flex items-center pt-2 border-t border-[#e2e8f0] text-[11px] divide-x divide-[#e2e8f0] overflow-hidden">
              {[
                { label: 'Input', value: weekUsage.inputTokens },
                { label: 'Output', value: weekUsage.outputTokens },
                { label: 'Voice Input', value: weekUsage.voiceInputTokens },
                { label: 'Voice Output', value: weekUsage.voiceOutputTokens },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col @sm:flex-row @sm:items-center @sm:gap-1 px-2.5 first:pl-0 last:pr-0 whitespace-nowrap leading-tight"
                >
                  <span className="text-[#64748b]">{item.label}</span>
                  <span className="font-semibold text-[#0d212c]">{item.value.toFixed(1)}M</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Estimated AI Cost */}
          <div className="h-[110px] p-4 bg-white rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between hover:border-[#cbd5e1] transition">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <DollarSign className="w-4 h-4 text-[#0d212c] shrink-0" />
                <h3 className="font-semibold text-xs sm:text-sm text-[#0d212c] truncate">
                  Estimated AI Cost
                </h3>
              </div>
              <div className="text-[24px] font-semibold text-[#36c0c9] shrink-0 leading-none">
                ${weekAiCost.toLocaleString()}
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-2 border-t border-[#e2e8f0] text-[11px] text-[#64748b]">
              <span className="truncate">
                week of {formatWeekDisplay(selectedWeek.monday, selectedWeek.sunday)} · text, voice
                & web search
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Value/ROI Section */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-semibold text-[#0d212c]">Value/ROI</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          {/* Left Column: Assumptions Table Card */}
          <div className="w-full bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-xs flex flex-col justify-between">
            <div className="divide-y divide-[#f1f5f9] flex-1 flex flex-col justify-between py-1">
              {ROI_FIELDS.map((field) => (
                <div
                  key={field.key}
                  className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                >
                  <div className="text-xs sm:text-[13px] text-[#0d212c] leading-tight">
                    <span className="font-semibold">{field.label}</span>
                    <span className="block text-[11px] text-[#64748b] font-normal mt-0.5">
                      {field.hint}
                    </span>
                  </div>
                  <NumericStepperInput
                    value={formInputs[field.key]}
                    onChange={(val) => setFormInputs((prev) => ({ ...prev, [field.key]: val }))}
                    unit={field.unit}
                    prefix={field.prefix}
                    step={field.step}
                    min={field.min}
                    max={field.max}
                    decimals={field.decimals}
                  />
                </div>
              ))}
            </div>

            {/* Recalculate CTA Button */}
            <div className="pt-3 border-t border-[#f1f5f9] flex items-center justify-between mt-1">
              <span className="text-[11px] text-[#94a3b8] font-normal">
                {isRecalculating
                  ? 'Recalculating metrics...'
                  : hasPendingChanges
                    ? 'Unapplied changes'
                    : 'AI cost includes text + voice tokens, embeddings and web search'}
              </span>
              <button
                type="button"
                onClick={handleRecalculate}
                disabled={!hasPendingChanges || isRecalculating}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-2xs transition-all ${
                  hasPendingChanges && !isRecalculating
                    ? 'bg-[#36c0c9] hover:bg-[#2baab3] hover:shadow-xs cursor-pointer opacity-100 scale-100 active:scale-95'
                    : 'bg-[#36c0c9] opacity-40 cursor-not-allowed pointer-events-none'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin' : ''}`} />
                <span>Recalculate</span>
              </button>
            </div>
          </div>

          {/* Right Column: Manual cost vs AI cost — chart or list view */}
          <div className="w-full bg-white rounded-2xl border border-[#e2e8f0] p-5 shadow-xs flex flex-col relative overflow-hidden transition-all duration-300">
            {/* Recalculate Rounded Circular Progress Animation & Text Overlay */}
            {isRecalculating && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] rounded-2xl z-30 flex flex-col items-center justify-center gap-2.5 p-6 animate-in fade-in duration-200">
                {/* Rounded Circular Progress Indicator */}
                <div className="relative w-9 h-9 flex items-center justify-center">
                  <svg className="w-9 h-9 animate-spin" viewBox="0 0 36 36">
                    <circle
                      className="text-[#e2e8f0]"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      cx="18"
                      cy="18"
                      r="14"
                    />
                    <path
                      className="text-[#36c0c9]"
                      strokeDasharray="45, 100"
                      strokeLinecap="round"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 4 a 14 14 0 0 1 0 28 a 14 14 0 0 1 0 -28"
                    />
                  </svg>
                </div>

                <div className="text-center">
                  <span className="text-xs font-semibold text-[#0d212c] block">
                    Recalculating Value, Cost & ROI
                  </span>
                </div>
              </div>
            )}

            {/* Header: title, legend (chart view) and view toggle */}
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-x-5 gap-y-1 flex-wrap min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-[#0d212c]">
                  Manual cost vs AI cost
                </h3>
                {roiView === 'chart' && (
                  <div className="flex items-center gap-4 text-xs text-[#64748b]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3.5 h-0.5 rounded-full bg-[#36c0c9]" />
                      Manual cost
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3.5 h-0.5 rounded-full bg-[#0d212c]" />
                      AI cost
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 p-1 rounded-xl border border-[#e2e8f0] shrink-0">
                {(
                  [
                    { view: 'chart', icon: ChartLine, label: 'Chart view' },
                    { view: 'list', icon: List, label: 'List view' },
                  ] as const
                ).map(({ view, icon: Icon, label }) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setRoiView(view)}
                    aria-label={label}
                    aria-pressed={roiView === view}
                    title={label}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer border-0 ${
                      roiView === view
                        ? 'bg-[#36c0c9] text-white'
                        : 'bg-transparent text-[#64748b] hover:text-[#0d212c] hover:bg-[#f8fafc]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            {roiView === 'chart' ? (
              <div className="flex-1 flex pt-4">
                <CostChart
                  manual={manualCostSeries}
                  ai={aiCostSeries}
                  selectedIndex={selectedWeekIndex}
                />
              </div>
            ) : (
              <>
                {/* Top Row: Manual cost vs AI cost */}
                <div className="flex-1 flex flex-col justify-center py-4 border-b border-[#f1f5f9]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#f1f5f9]">
                    {/* Manual cost */}
                    <div className="sm:pr-6 space-y-1.5 pb-3 sm:pb-0">
                      <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-[#0d212c]">
                        <span>Manual cost</span>
                        <div className="relative group/tip inline-flex items-center">
                          <button
                            type="button"
                            className="p-0.5 text-[#94a3b8] hover:text-[#0d212c] transition-colors cursor-help bg-transparent border-0"
                            aria-label="Manual cost info"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                          <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tip:block z-50 px-3 py-1.5 bg-[#0d212c] text-white text-[11px] font-normal rounded-lg shadow-xl pointer-events-none w-max max-w-xs text-left leading-relaxed animate-in fade-in duration-150">
                            <div>
                              Manual cost is the multiply of manual hours into resource cost per
                              hour.
                            </div>
                            <div className="mt-0.5">
                              Outputs × Manual hours × Resource cost per hour
                            </div>
                            <div className="absolute top-full left-2 border-4 border-transparent border-t-[#0d212c]" />
                          </div>
                        </div>
                      </div>
                      <div className="text-2xl sm:text-[28px] font-semibold text-[#0d212c] leading-tight">
                        ${totalManualCost.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-[#64748b]">
                        Total hours {totalManualHours} | Cost per hour ${appliedInputs.costPerHour}
                      </div>
                    </div>

                    {/* AI cost */}
                    <div className="sm:pl-6 space-y-1.5 pt-3 sm:pt-0">
                      <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-[#0d212c]">
                        <span>AI cost</span>
                        <div className="relative group/tip inline-flex items-center">
                          <button
                            type="button"
                            className="p-0.5 text-[#94a3b8] hover:text-[#0d212c] transition-colors cursor-help bg-transparent border-0"
                            aria-label="AI cost info"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                          <div className="absolute bottom-full left-0 sm:left-auto sm:right-0 mb-2 hidden group-hover/tip:block z-50 px-3 py-1.5 bg-[#0d212c] text-white text-[11px] font-normal rounded-lg shadow-xl pointer-events-none w-max max-w-xs text-left leading-relaxed animate-in fade-in duration-150">
                            <div>
                              AI cost adds up text, voice and embedding token costs plus web search
                              credits.
                            </div>
                            <div className="mt-0.5">
                              Tokens × Price per 1M + Search credits × Credit price
                            </div>
                            <div className="absolute top-full left-2 sm:left-auto sm:right-2 border-4 border-transparent border-t-[#0d212c]" />
                          </div>
                        </div>
                      </div>
                      <div className="text-2xl sm:text-[28px] font-semibold text-[#0d212c] leading-tight">
                        ${totalAiCost.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-[#64748b]">
                        Total tokens {weekTokensConsumed}M · Text & Voice
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Estimated ROI vs Estimated savings */}
                <div className="flex-1 flex flex-col justify-center pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#f1f5f9]">
                    {/* Estimated ROI */}
                    <div className="sm:pr-6 space-y-1.5 pb-3 sm:pb-0">
                      <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-[#0d212c]">
                        <span>Estimated ROI</span>
                        <div className="relative group/tip inline-flex items-center">
                          <button
                            type="button"
                            className="p-0.5 text-[#94a3b8] hover:text-[#0d212c] transition-colors cursor-help bg-transparent border-0"
                            aria-label="Estimated ROI info"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                          <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tip:block z-50 px-3 py-1.5 bg-[#0d212c] text-white text-[11px] font-normal rounded-lg shadow-xl pointer-events-none w-max max-w-xs text-left leading-relaxed animate-in fade-in duration-150">
                            <div>
                              Estimated ROI is calculated by dividing manual cost by AI cost.
                            </div>
                            <div className="mt-0.5">Manual cost ÷ AI cost</div>
                            <div className="absolute top-full left-2 border-4 border-transparent border-t-[#0d212c]" />
                          </div>
                        </div>
                      </div>
                      <div className="text-2xl sm:text-[28px] font-semibold text-[#36c0c9] leading-tight">
                        {roiMultiple}x
                      </div>
                    </div>

                    {/* Estimated savings */}
                    <div className="sm:pl-6 space-y-1.5 pt-3 sm:pt-0">
                      <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-[#0d212c]">
                        <span>Estimated savings</span>
                        <div className="relative group/tip inline-flex items-center">
                          <button
                            type="button"
                            className="p-0.5 text-[#94a3b8] hover:text-[#0d212c] transition-colors cursor-help bg-transparent border-0"
                            aria-label="Estimated savings info"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                          <div className="absolute bottom-full left-0 sm:left-auto sm:right-0 mb-2 hidden group-hover/tip:block z-50 px-3 py-1.5 bg-[#0d212c] text-white text-[11px] font-normal rounded-lg shadow-xl pointer-events-none w-max max-w-xs text-left leading-relaxed animate-in fade-in duration-150">
                            <div>
                              Estimated savings is calculated by subtracting AI cost from manual
                              cost.
                            </div>
                            <div className="mt-0.5">Manual cost − AI cost</div>
                            <div className="absolute top-full left-2 sm:left-auto sm:right-2 border-4 border-transparent border-t-[#0d212c]" />
                          </div>
                        </div>
                      </div>
                      <div className="text-2xl sm:text-[28px] font-semibold text-[#36c0c9] leading-tight">
                        ${savedDollars.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-[#64748b]">{selectedWeek.label}</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Bottom Section: Assessments by Status */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold text-[#0d212c]">
            Assessments by Status
          </h2>
          <span className="text-xs text-[#64748b] font-normal">
            Week of {formatWeekDisplay(selectedWeek.monday, selectedWeek.sunday)}
          </span>
        </div>

        {/* Unified Card with 3 Status Columns: Completed, Scheduled, Finalised */}
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#f1f5f9]">
            {/* Column 1: Completed */}
            <div className="space-y-3 md:pr-6 pb-6 md:pb-0 flex flex-col justify-between">
              <div>
                <div className="pb-3 border-b border-[#f1f5f9]">
                  <h3 className="text-xs sm:text-sm font-semibold text-[#0d212c]">Completed</h3>
                </div>

                <div className="divide-y divide-[#f1f5f9]">
                  {(showAllAssessments
                    ? assessmentsByStatus.completed
                    : assessmentsByStatus.completed.slice(0, 4)
                  ).map((item) => (
                    <div
                      key={item.id}
                      className="py-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="relative group/name min-w-0 flex-1">
                        <span
                          className="text-[#0d212c] font-normal truncate block cursor-default"
                          title={item.name}
                        >
                          {item.name}
                        </span>
                        {/* Tooltip on hover displaying full name */}
                        <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/name:block z-50 px-2.5 py-1 bg-[#0d212c] text-white text-[11px] font-normal rounded-lg shadow-xl pointer-events-none whitespace-nowrap animate-in fade-in duration-150">
                          {item.name}
                          <div className="absolute top-full left-3 border-4 border-transparent border-t-[#0d212c]" />
                        </div>
                      </div>
                      <span className="text-xs text-[#36c0c9] font-normal shrink-0">
                        {item.round}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2: Scheduled */}
            <div className="space-y-3 md:px-6 py-6 md:py-0 flex flex-col justify-between">
              <div>
                <div className="pb-3 border-b border-[#f1f5f9]">
                  <h3 className="text-xs sm:text-sm font-semibold text-[#0d212c]">Scheduled</h3>
                </div>

                <div className="divide-y divide-[#f1f5f9]">
                  {(showAllAssessments
                    ? assessmentsByStatus.scheduled
                    : assessmentsByStatus.scheduled.slice(0, 4)
                  ).map((item) => (
                    <div
                      key={item.id}
                      className="py-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="relative group/name min-w-0 flex-1">
                        <span
                          className="text-[#0d212c] font-normal truncate block cursor-default"
                          title={item.name}
                        >
                          {item.name}
                        </span>
                        {/* Tooltip on hover displaying full name */}
                        <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/name:block z-50 px-2.5 py-1 bg-[#0d212c] text-white text-[11px] font-normal rounded-lg shadow-xl pointer-events-none whitespace-nowrap animate-in fade-in duration-150">
                          {item.name}
                          <div className="absolute top-full left-3 border-4 border-transparent border-t-[#0d212c]" />
                        </div>
                      </div>
                      <span className="text-xs text-[#36c0c9] font-normal shrink-0">
                        {item.round}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 3: Finalised */}
            <div className="space-y-3 md:pl-6 pt-6 md:pt-0 flex flex-col justify-between">
              <div>
                <div className="pb-3 border-b border-[#f1f5f9]">
                  <h3 className="text-xs sm:text-sm font-semibold text-[#0d212c]">Finalised</h3>
                </div>

                <div className="divide-y divide-[#f1f5f9]">
                  {(showAllAssessments
                    ? assessmentsByStatus.finalised
                    : assessmentsByStatus.finalised.slice(0, 4)
                  ).map((item) => (
                    <div
                      key={item.id}
                      className="py-3 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="relative group/name min-w-0 flex-1">
                        <span
                          className="text-[#0d212c] font-normal truncate block cursor-default"
                          title={item.name}
                        >
                          {item.name}
                        </span>
                        {/* Tooltip on hover displaying full name */}
                        <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover/name:block z-50 px-2.5 py-1 bg-[#0d212c] text-white text-[11px] font-normal rounded-lg shadow-xl pointer-events-none whitespace-nowrap animate-in fade-in duration-150">
                          {item.name}
                          <div className="absolute top-full left-3 border-4 border-transparent border-t-[#0d212c]" />
                        </div>
                      </div>
                      <span className="text-xs text-[#36c0c9] font-normal shrink-0">
                        {item.round}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Centered Single See More Button to load all data */}
          {hasMoreAssessments && (
            <div className="pt-4 border-t border-[#f1f5f9] mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllAssessments((prev) => !prev)}
                className="text-xs text-[#36c0c9] hover:text-[#2baab3] font-semibold transition inline-flex items-center gap-1 cursor-pointer bg-transparent border-0 p-1"
              >
                <span>{showAllAssessments ? 'See less' : 'See more'}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    showAllAssessments ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
