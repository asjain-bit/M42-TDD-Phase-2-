'use client'

/**
 * TddReport — Organism
 * The generated technical due diligence report: six sections, each with a verdict and the
 * points behind it. Read-only.
 * Used in: ValueDueDiligenceStage
 */

import React from 'react'
import { buildTddReport } from '@/lib/tddReport'
import type { TddReportProps } from './TddReport.types'

export const TddReport: React.FC<TddReportProps> = ({ request, className = '' }) => (
  <ol
    aria-label="TDD report"
    className={`flex flex-col divide-y divide-[#d3dbe4] ${className}`.trim()}
  >
    {buildTddReport(request).map((section, i) => (
      <li key={section.id} className="py-6 first:pt-0 last:pb-0 flex flex-col gap-3">
        <div className="flex items-start gap-3 flex-wrap">
          <span className="w-6 h-6 rounded-full bg-[#e0f2fe] text-[#0369a1] flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
            {i + 1}
          </span>
          <h4 className="text-base font-semibold text-[#0d212c]">{section.title}</h4>
          <span
            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              section.verdict === 'Satisfactory'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {section.verdict}
          </span>
        </div>
        <div className="pl-9 flex flex-col gap-2">
          <p className="text-sm text-[#0d212c] leading-relaxed">{section.summary}</p>
          <ul className="flex flex-col gap-1.5 list-disc pl-4 marker:text-slate-300">
            {section.points.map((p) => (
              <li key={p} className="text-sm text-[#475569] leading-relaxed">
                {p}
              </li>
            ))}
          </ul>
        </div>
      </li>
    ))}
  </ol>
)
