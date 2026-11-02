'use client'

/**
 * StageChip — Molecule
 * Workflow stage name over a six-step progress bar, with a tooltip listing every stage.
 * Used in: DashboardScreen, CaseNotes
 */

import React, { useId, useState } from 'react'
import { WORKFLOW_STAGES, type StageKind } from '@/lib/caseActions'
import type { StageChipProps, StageState } from './StageChip.types'

/** Plain text, like the other text cells in the table row */
const LABEL_BASE = 'text-xs font-normal whitespace-nowrap'

const LABEL_TONE: Record<StageKind, string> = {
  active: 'text-text-primary',
  closed: 'text-text-error',
  exited: 'text-text-error',
  routed: 'text-text-tertiary',
}

const SEGMENT_TONE: Record<StageState, string> = {
  Completed: 'bg-[var(--app-accent)]',
  Current: 'bg-[var(--app-accent-hover)]',
  Upcoming: 'bg-border-default',
  'Not reached': 'bg-border-default',
}

/** Where a closed or exited case got to, shown in grey */
const STOPPED_SEGMENT = 'bg-border-strong'

/** State of each of the six stages for this case */
export const stageStates = ({ kind, index, reached }: StageChipProps['progress']): StageState[] =>
  WORKFLOW_STAGES.map((_, i) => {
    const step = i + 1
    if (kind === 'active' && index !== null) {
      return step < index ? 'Completed' : step === index ? 'Current' : 'Upcoming'
    }
    // A closed or exited case finished the stage it stopped at; later ones never happened
    return step <= reached ? 'Completed' : 'Not reached'
  })

const chipText = ({ kind, label }: StageChipProps['progress']) =>
  kind === 'routed'
    ? label.includes('Procurement')
      ? 'Routed · Procurement'
      : 'Routed · Corp Dev'
    : label

const accessibleName = (p: StageChipProps['progress']) => {
  if (p.kind === 'active' && p.index !== null) return `Stage ${p.index} of ${p.total}: ${p.label}`
  if (p.kind === 'routed') return p.label
  return `${p.label} at stage ${p.reached} of ${p.total}: ${WORKFLOW_STAGES[p.reached - 1]}`
}

export const StageChip: React.FC<StageChipProps> = ({
  progress,
  fullWidth = false,
  className = '',
}) => {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const tooltipId = useId()
  const states = stageStates(progress)
  const showBar = progress.kind !== 'routed'
  const stopped = progress.kind === 'closed' || progress.kind === 'exited'
  const count =
    progress.kind === 'active' && progress.index !== null ? progress.index : progress.reached

  const show = (el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    setPos({ left: Math.min(r.left, window.innerWidth - 272), top: r.bottom + 6 })
  }

  return (
    <>
      <div
        role="group"
        tabIndex={0}
        aria-label={accessibleName(progress)}
        aria-describedby={pos ? tooltipId : undefined}
        onMouseEnter={(e) => show(e.currentTarget)}
        onMouseLeave={() => setPos(null)}
        onFocus={(e) => show(e.currentTarget)}
        onBlur={() => setPos(null)}
        className={`${fullWidth ? 'flex w-full' : 'inline-flex'} flex-col items-start gap-1.5 rounded-md outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus ${className}`.trim()}
      >
        <span className={`${LABEL_BASE} ${LABEL_TONE[progress.kind]}`} aria-hidden="true">
          {chipText(progress)}
        </span>
        {showBar && (
          <span
            className={`flex items-center gap-2 ${fullWidth ? 'w-full' : ''}`}
            aria-hidden="true"
          >
            <span className={`flex gap-[2px] ${fullWidth ? 'flex-1' : 'w-[120px]'}`}>
              {states.map((state, i) => (
                <span
                  key={WORKFLOW_STAGES[i]}
                  data-state={state}
                  className={`h-[3px] flex-1 rounded-full ${
                    stopped && state === 'Completed' ? STOPPED_SEGMENT : SEGMENT_TONE[state]
                  }`}
                />
              ))}
            </span>
            <span className="text-[11px] font-medium text-text-tertiary tabular-nums">
              {count}/{progress.total}
            </span>
          </span>
        )}
      </div>

      {pos && (
        <div
          id={tooltipId}
          role="tooltip"
          style={{ left: pos.left, top: pos.top }}
          className="fixed z-50 w-64 rounded-lg bg-bg-tooltip text-text-inverse px-3 py-2.5 shadow-xl pointer-events-none animate-in fade-in duration-150"
        >
          <ol className="flex flex-col gap-1">
            {WORKFLOW_STAGES.map((name, i) => (
              <li key={name} className="flex items-center justify-between gap-3 text-[11px]">
                <span
                  className={`whitespace-nowrap ${states[i] === 'Current' ? 'font-semibold' : 'opacity-90'}`}
                >
                  {i + 1}. {name}
                </span>
                <span
                  className={
                    states[i] === 'Current' ? 'font-semibold' : 'opacity-70 whitespace-nowrap'
                  }
                >
                  {states[i]}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  )
}
