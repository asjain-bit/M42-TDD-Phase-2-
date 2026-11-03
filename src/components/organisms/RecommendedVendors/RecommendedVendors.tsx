/**
 * RecommendedVendors — Organism
 * "Vendors M42 already knows": a plain divided list of partnership requests that may meet an
 * interest, including rejected ones, with why each may fit.
 * Used in: ServiceLineInterestScreen, InternalInterestsScreen
 */

import React from 'react'
import { StatusChip } from '@/components/atoms/StatusChip'
import { StageChip } from '@/components/molecules/StageChip'
import { getStageProgress } from '@/lib/caseActions'
import type { VendorMatch } from '@/lib/serviceLineMatch'
import type { PartnershipRequest } from '@/types/partnership.types'
import type { RecommendedVendorsProps } from './RecommendedVendors.types'

const REJECTION_EVENTS = ['Request rejected', 'Rejected by Partnership Admin']

/** Oct 2026, from the rejection in the audit log, or the submission date */
const monthYear = (r: PartnershipRequest) => {
  const event = [...(r.auditLog ?? [])].reverse().find((e) => REJECTION_EVENTS.includes(e.title))
  const date = event?.timestamp ?? r.submittedOn
  const [, month, year] = date.split(',')[0].trim().split(/\s+/)
  return month && year ? `${month} ${year}` : date
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')

/** Ongoing (info), Rejected · Oct 2026 (error), Completed or Closed */
const chipFor = (m: VendorMatch) => {
  const r = m.request
  if (m.rejectionReason) return { label: `Rejected · ${monthYear(r)}`, status: 'error' as const }
  if (r.value?.sponsoredOn) return { label: 'Completed', status: 'success' as const }
  if (r.status === 'Closed' || r.status === 'Exited' || r.queue === 'closed')
    return { label: 'Closed', status: 'neutral' as const }
  return { label: 'Ongoing', status: 'info' as const }
}

export const RecommendedVendors: React.FC<RecommendedVendorsProps> = ({
  matches,
  className = '',
}) => (
  <section
    aria-labelledby="recommended-vendors-heading"
    className={`flex flex-col gap-3 ${className}`.trim()}
  >
    <div className="flex flex-col gap-1">
      <h2 id="recommended-vendors-heading" className="text-base font-semibold text-text-primary">
        Vendors M42 already knows
      </h2>
      <p className="text-sm text-text-secondary">
        From past and ongoing partnership requests, including rejected ones. These may already solve
        your need.
      </p>
    </div>
    {matches.length === 0 ? (
      <p className="text-xs text-text-tertiary">No vendor in the requests matches this yet.</p>
    ) : (
      <ul className="flex flex-col divide-y divide-border-subtle rounded-xl border border-border-default bg-bg-default">
        {matches.map((m) => {
          const r = m.request
          const chip = chipFor(m)
          return (
            <li key={r.id} className="flex items-start gap-3 px-4 py-3.5">
              <span
                aria-hidden="true"
                className="w-9 h-9 rounded-lg bg-bg-surface-2 text-text-secondary text-xs font-semibold flex items-center justify-center shrink-0"
              >
                {initialsOf(r.companyName)}
              </span>
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-text-primary">
                    {r.companyName}{' '}
                    <span className="font-normal text-text-tertiary">· {r.requestCode}</span>
                  </span>
                  <StatusChip label={chip.label} status={chip.status} />
                </div>
                {/* The same stage chip as the dashboard's Stage column */}
                <StageChip progress={getStageProgress(r)} />
                <p className="text-xs text-text-secondary leading-relaxed">
                  {r.headline ?? r.solution}
                </p>
                {m.why && <p className="text-xs text-text-primary leading-relaxed">{m.why}</p>}
                {m.rejectionReason && (
                  <p className="text-xs text-text-tertiary leading-relaxed">
                    Declined in {monthYear(r)}: {m.rejectionReason}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    )}
  </section>
)
