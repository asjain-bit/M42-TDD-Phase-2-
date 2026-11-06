'use client'

/**
 * ServiceLineAllInterestsScreen — Screen
 * The All interests tab of Internal interests: one table of every requirement, with who raised
 * it and its status; a row opens the interest drawer, and a just-submitted one opens by itself.
 * Used in: ServiceLineInterestScreen (Internal Interest Team)
 */

import React, { useEffect, useMemo, useState } from 'react'
import { SearchBar } from '@/components/molecules/SearchBar'
import { StatusFilterChips } from '@/components/molecules/StatusFilterChips'
import { InterestDrawer } from '@/components/organisms/InterestDrawer'
import { InterestTable } from '@/components/organisms/InterestTable'
import type {
  InterestStatus,
  PartnershipRequest,
  ServiceLineInterest,
} from '@/types/partnership.types'

const STATUSES: InterestStatus[] = ['Pending review', 'Approved', 'Declined']

export interface ServiceLineAllInterestsScreenProps {
  interests: ServiceLineInterest[]
  requests: PartnershipRequest[]
  /** A just-submitted interest: its row is highlighted and its drawer opens */
  focusCode?: string | null
}

export const ServiceLineAllInterestsScreen: React.FC<ServiceLineAllInterestsScreenProps> = ({
  interests,
  requests,
  focusCode,
}) => {
  const [openCode, setOpenCode] = useState<string | null>(null)
  useEffect(() => {
    if (focusCode) setOpenCode(focusCode)
  }, [focusCode])
  const open = interests.find((i) => i.code === openCode) ?? null
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const chips = [
    { key: 'all', label: 'All interests', count: interests.length },
    ...STATUSES.map((s) => ({
      key: s,
      label: s,
      count: interests.filter((i) => i.status === s).length,
    })),
  ]
  const term = search.trim().toLowerCase()
  const rows = useMemo(
    () =>
      interests.filter(
        (i) =>
          (filter === 'all' || i.status === filter) &&
          (!term ||
            [i.code, i.title, i.serviceLine, ...i.focusAreas].some((v) =>
              v.toLowerCase().includes(term)
            ))
      ),
    [interests, filter, term]
  )

  return (
    <div className="flex flex-col gap-6 w-full text-text-primary">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-text-secondary">
          Requirements raised by every service line. Open one to see the need and the vendors that
          may meet it.
        </p>
      </div>
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <StatusFilterChips chips={chips} selected={filter} onSelect={setFilter} />
        <div className="w-full sm:w-72 shrink-0">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search interests..."
            showButton={false}
          />
        </div>
      </div>
      <InterestTable
        interests={rows}
        onOpen={setOpenCode}
        selectedCode={openCode}
        detailed
        emptyText={
          interests.length === 0
            ? 'No interests have been raised yet.'
            : 'No interests match your search or filter.'
        }
      />
      {open && (
        <InterestDrawer
          key={open.code}
          interest={open}
          requests={requests}
          onClose={() => setOpenCode(null)}
        />
      )}
    </div>
  )
}
