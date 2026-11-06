'use client'

/**
 * PreReadSummary — Organism
 * The generated strategy pre-read: six sections, each with a short verdict, its reasoning and
 * (for the roadmap) the documents it drew on. Read-only.
 * Used in: PartnershipDetail
 */

import React from 'react'
import { buildPreRead } from '@/lib/preRead'
import { FileTypeIcon } from '@/components/organisms/KnowledgeBaseUpload'
import type { PreReadSummaryProps } from './PreReadSummary.types'

const TONES = {
  positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  caution: 'bg-amber-50 text-amber-700 border-amber-200',
  neutral: 'bg-slate-50 text-slate-600 border-slate-200',
} as const

export const PreReadSummary: React.FC<PreReadSummaryProps> = ({
  request,
  documents = [],
  className = '',
}) => {
  const sections = buildPreRead(request, documents)

  return (
    <div className={`flex flex-col ${className}`.trim()}>
      <ol aria-label="Pre-read summary" className="flex flex-col divide-y divide-[#d3dbe4]">
        {sections.map((section, i) => (
          <li key={section.id} className="py-6 first:pt-0 last:pb-0 flex flex-col gap-3">
            <div className="flex items-start gap-3 flex-wrap">
              <span className="w-6 h-6 rounded-full bg-[#e0f2fe] text-[#0369a1] flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                {i + 1}
              </span>
              <h3 className="text-base font-semibold text-[#0d212c]">{section.title}</h3>
              <span
                className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${TONES[section.tone]}`}
              >
                {section.verdict}
              </span>
            </div>

            <div className="pl-9 flex flex-col gap-3">
              <p className="text-sm text-[#0d212c] leading-relaxed">{section.summary}</p>
              <ul className="flex flex-col gap-1.5 list-disc pl-4 marker:text-slate-300">
                {section.points.map((point) => (
                  <li key={point} className="text-sm text-[#475569] leading-relaxed">
                    {point}
                  </li>
                ))}
              </ul>

              {section.documents && (
                <ul
                  aria-label="Documents reviewed"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1"
                >
                  {section.documents.map((doc) => (
                    <li
                      key={doc.name}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-white"
                    >
                      <FileTypeIcon name={doc.name} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-[#0d212c] truncate">
                          {doc.name}
                        </span>
                        <span className="text-xs text-[#64748b]">{doc.source}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
