/**
 * RecommendedVendors — Organism
 * Vendor cards matched to a service line interest, from every partnership request.
 * Used in: ServiceLineInterestScreen, InternalInterestsScreen
 */

import React from 'react'
import { History, Sparkles } from 'lucide-react'
import { StatusChip } from '@/components/atoms/StatusChip'
import { getDisplayStatus, type DisplayStatus } from '@/lib/caseStatus'
import type { RecommendedVendorsProps } from './RecommendedVendors.types'

/** Same colours as the Dashboard status chips */
const STATUS_CATEGORY: Record<DisplayStatus, 'warning' | 'info' | 'success' | 'error' | 'neutral'> =
  {
    Pending: 'warning',
    'In Progress': 'info',
    Completed: 'success',
    Closed: 'error',
    RFI: 'neutral',
  }

export const RecommendedVendors: React.FC<RecommendedVendorsProps> = ({
  matches,
  className = '',
}) => (
  <section
    aria-labelledby="recommended-vendors-heading"
    className={`flex flex-col gap-3 ${className}`.trim()}
  >
    <div className="flex items-center gap-2">
      <Sparkles className="w-4 h-4 text-text-secondary" strokeWidth={2} aria-hidden="true" />
      <h2 id="recommended-vendors-heading" className="text-sm font-semibold text-text-primary">
        Recommended vendors
      </h2>
    </div>
    {matches.length === 0 ? (
      <p className="text-xs text-text-tertiary">No vendor in the requests matches this yet.</p>
    ) : (
      <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {matches.map(({ request: r, why, rejectionReason }) => {
          const status = getDisplayStatus(r, 'admin')
          return (
            <li
              key={r.id}
              className="rounded-xl border border-border-default bg-bg-default p-4 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-semibold text-text-primary">{r.companyName}</span>
                <StatusChip label={status} status={STATUS_CATEGORY[status]} />
              </div>
              <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                {r.headline ?? r.solution}
              </p>
              <span className="text-[11px] font-medium text-text-tertiary">{r.requestCode}</span>
              {why && (
                <p className="text-xs text-text-primary">
                  <span className="font-medium">Why it matches:</span> {why}
                </p>
              )}
              {rejectionReason && (
                <div className="rounded-lg border border-status-warning-border bg-status-warning-bg px-3 py-2 flex items-start gap-2 text-xs text-status-warning-text">
                  <History
                    className="w-3.5 h-3.5 shrink-0 mt-0.5"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span>Rejected earlier. It may fit your requirement now.</span>
                    <span className="opacity-90">Reason: {rejectionReason}</span>
                  </span>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    )}
  </section>
)
