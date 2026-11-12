'use client'

/**
 * AssessmentBriefShimmer — Organism
 * Stands in for the Initial Assessment Brief for a couple of seconds while it is "generated":
 * grey blocks in the shape of the brief with a light shimmer running across them.
 * Used in: PartnershipDetail
 */

import React, { useEffect, useRef } from 'react'

/** How long the placeholder shows before the brief appears */
export const BRIEF_SHIMMER_MS = 2500

const Block: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    aria-hidden="true"
    className={`relative overflow-hidden rounded-lg bg-slate-100 after:absolute after:inset-0 after:-translate-x-full after:bg-gradient-to-r after:from-transparent after:via-white/80 after:to-transparent after:animate-[shimmer-slide_1.4s_infinite] ${className}`.trim()}
  />
)

export const AssessmentBriefShimmer: React.FC<{ onComplete: () => void; durationMs?: number }> = ({
  onComplete,
  durationMs = BRIEF_SHIMMER_MS,
}) => {
  const done = useRef(onComplete)
  done.current = onComplete
  useEffect(() => {
    const timer = setTimeout(() => done.current(), durationMs)
    return () => clearTimeout(timer)
  }, [durationMs])

  return (
    <div
      role="status"
      aria-label="Generating the initial assessment brief"
      className="flex flex-col gap-5"
    >
      <div className="flex items-center gap-3">
        <Block className="w-10 h-10 rounded-xl" />
        <Block className="h-5 w-56" />
      </div>
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="w-full lg:w-64 shrink-0 rounded-xl border border-[#e2e8f0]/60 bg-slate-50/70 p-2 flex flex-col gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Block key={i} className="h-9 w-full" />
          ))}
        </div>
        <div className="flex-1 min-w-0 w-full flex flex-col gap-4">
          <Block className="h-5 w-48" />
          <div className="rounded-xl border border-[#e2e8f0] p-5 flex flex-col gap-3">
            <Block className="h-4 w-40" />
            <div className="flex gap-2">
              <Block className="h-7 w-32 rounded-full" />
              <Block className="h-7 w-40 rounded-full" />
            </div>
            <Block className="h-4 w-full" />
            <Block className="h-4 w-11/12" />
            <Block className="h-4 w-2/3" />
          </div>
          <Block className="h-5 w-44 mt-4" />
          <Block className="h-24 w-full" />
        </div>
      </div>
    </div>
  )
}
