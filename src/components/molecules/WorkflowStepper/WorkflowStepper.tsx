'use client'

/**
 * WorkflowStepper — Molecule
 * Horizontal step tracker. Completed and current steps can be opened; later steps stay
 * greyed out and locked until the current one is done.
 * Used in: PartnershipDetail
 */

import React from 'react'
import { Check, Lock } from 'lucide-react'
import type { WorkflowStepState, WorkflowStepperProps } from './WorkflowStepper.types'

const DEFAULT_CAPTION: Record<WorkflowStepState, string> = {
  completed: 'Completed',
  current: 'Current',
  upcoming: 'Upcoming',
  closed: 'Closed',
}

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  steps,
  activeId,
  onSelect,
  className = '',
}) => (
  <nav aria-label="Review progress" className={`w-full overflow-x-auto ${className}`.trim()}>
    <ol className="flex items-start min-w-[560px]">
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1
        const locked = step.state === 'upcoming' || step.state === 'closed'
        const isActive = step.id === activeId
        return (
          <React.Fragment key={step.id}>
            <li className="shrink-0">
              <button
                type="button"
                disabled={locked && !step.lockedHint}
                aria-disabled={locked && step.lockedHint ? true : undefined}
                title={locked ? step.lockedHint : undefined}
                aria-current={isActive ? 'step' : undefined}
                onClick={() => onSelect(step.id)}
                className={`group flex items-start gap-3 text-left ${
                  locked ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <span
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-all duration-300 ${
                    step.state === 'completed'
                      ? `bg-[#10b981] text-white ${isActive ? 'ring-4 ring-[#10b981]/20' : ''}`
                      : step.state === 'current'
                        ? 'bg-[#36c0c9] text-white ring-4 ring-[#36c0c9]/20'
                        : 'bg-white border border-[#e2e8f0] text-[#94a3b8]'
                  }`}
                >
                  {step.state === 'completed' ? (
                    <Check
                      className="w-4 h-4 stroke-[3] animate-in zoom-in-50 duration-300"
                      aria-hidden="true"
                    />
                  ) : locked ? (
                    <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    idx + 1
                  )}
                </span>
                <span className="flex flex-col gap-0.5 pt-0.5">
                  <span
                    className={`text-sm font-semibold leading-tight transition-colors ${
                      locked ? 'text-[#94a3b8]' : 'text-[#0d212c]'
                    }`}
                  >
                    {step.label}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      step.state === 'completed'
                        ? 'text-[#10b981]'
                        : step.state === 'current'
                          ? 'text-[#36c0c9]'
                          : 'text-[#94a3b8]'
                    }`}
                  >
                    {step.caption ?? DEFAULT_CAPTION[step.state]}
                  </span>
                </span>
              </button>
            </li>

            {!isLast && (
              <li
                aria-hidden="true"
                className="flex-1 min-w-6 mx-4 mt-[17px] h-[2px] rounded-full bg-[#e2e8f0] overflow-hidden"
              >
                <div
                  className={`h-full bg-[#10b981] transition-[width] duration-700 ease-out ${
                    step.state === 'completed' ? 'w-full' : 'w-0'
                  }`}
                />
              </li>
            )}
          </React.Fragment>
        )
      })}
    </ol>
  </nav>
)
