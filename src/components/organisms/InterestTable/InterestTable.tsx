/**
 * InterestTable — Organism
 * Service line interests in the Dashboard table style: requirement title with its code and owner
 * under it, service line and submitted date; the detailed layout adds Raised by and Status. A row
 * opens the interest drawer.
 * Used in: ServiceLineAllInterestsScreen, InternalInterestsScreen
 */

import React from 'react'
import { Inbox } from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { StatusChip } from '@/components/atoms/StatusChip'
import { M42_PEOPLE } from '@/types/partnership.types'
import type { InterestTableProps } from './InterestTable.types'

const STATUS_TONE = { 'Pending review': 'warning', Approved: 'success', Declined: 'error' } as const

/** The person's role, from the M42 directory; a scouting interest came from the Strategy Team */
const roleOf = (name: string, source?: string) =>
  M42_PEOPLE.find((p) => p.name === name)?.role ??
  (source === 'Strategy scouting' ? 'Strategy Team' : undefined)

export const InterestTable: React.FC<InterestTableProps> = ({
  interests,
  onOpen,
  mineName,
  selectedCode,
  detailed = false,
  emptyText = 'No interests match your search or filter.',
  className = '',
}) => (
  <div
    className={`bg-bg-default rounded-2xl border border-border-default shadow-xs overflow-hidden w-full ${className}`.trim()}
  >
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-bg-surface-1 border-b border-border-default text-text-tertiary text-[11px] font-medium uppercase tracking-wider">
            <th className="py-4 px-4">Requirement title</th>
            {detailed && <th className="py-4 px-4">Raised by</th>}
            <th className="py-4 px-4">Service line</th>
            {detailed && <th className="py-4 px-4">Status</th>}
            <th className="py-4 px-4">Submitted</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {interests.length === 0 ? (
            <tr>
              <td colSpan={detailed ? 5 : 3} className="py-16 text-center text-text-tertiary">
                <div className="flex flex-col items-center gap-2">
                  <Inbox className="w-6 h-6" strokeWidth={2} aria-hidden="true" />
                  <span className="text-xs">{emptyText}</span>
                </div>
              </td>
            </tr>
          ) : (
            interests.map((i) => (
              <tr
                key={i.code}
                onClick={() => onOpen(i.code)}
                aria-selected={selectedCode === i.code}
                className={`transition-colors cursor-pointer group ${
                  selectedCode === i.code ? 'bg-bg-selected' : 'hover:bg-bg-hover'
                }`}
              >
                <td className="py-4 px-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-text-primary group-hover:text-[var(--app-accent)]">
                        {i.title}
                      </span>
                      {mineName && i.submittedBy === mineName && (
                        <Badge size="sm" variant="info">
                          Yours
                        </Badge>
                      )}
                    </span>
                    <span className="text-[11px] text-text-tertiary">
                      {detailed ? i.code : `${i.code} · ${i.submittedBy}`}
                    </span>
                  </div>
                </td>
                {detailed && (
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-text-primary whitespace-nowrap">
                        {i.submittedBy}
                      </span>
                      {roleOf(i.submittedBy, i.source) && (
                        <span className="text-[11px] text-text-tertiary whitespace-nowrap">
                          {roleOf(i.submittedBy, i.source)}
                        </span>
                      )}
                    </div>
                  </td>
                )}
                <td className="py-4 px-4 text-xs text-text-primary whitespace-nowrap">
                  {i.serviceLine}
                </td>
                {detailed && (
                  <td className="py-4 px-4">
                    <StatusChip label={i.status} status={STATUS_TONE[i.status]} />
                  </td>
                )}
                <td className="py-4 px-4 text-xs text-text-tertiary whitespace-nowrap">{i.on}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
)
