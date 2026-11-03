'use client'

/**
 * ServiceLineAllInterestsScreen — Screen
 * All requests in Service line needs: every service line's requirements, with All and My
 * requests filters and the signed-in person's rows tagged Yours; a row opens the interest drawer.
 * Used in: ServiceLineInterestScreen (Internal Interest Team)
 */

import React, { useState } from 'react'
import { StatusFilterChips } from '@/components/molecules/StatusFilterChips'
import { InterestDrawer } from '@/components/organisms/InterestDrawer'
import { InterestTable } from '@/components/organisms/InterestTable'
import type { PartnershipRequest, ServiceLineInterest } from '@/types/partnership.types'

export interface ServiceLineAllInterestsScreenProps {
  interests: ServiceLineInterest[]
  requests: PartnershipRequest[]
  /** The signed-in person; their rows are tagged Yours */
  userName: string
}

export const ServiceLineAllInterestsScreen: React.FC<ServiceLineAllInterestsScreenProps> = ({
  interests,
  requests,
  userName,
}) => {
  const [filter, setFilter] = useState('all')
  const [openCode, setOpenCode] = useState<string | null>(null)
  const mine = interests.filter((i) => i.submittedBy === userName)
  const rows = filter === 'mine' ? mine : interests
  const open = interests.find((i) => i.code === openCode) ?? null

  return (
    <div className="flex flex-col gap-6 w-full text-text-primary">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">All requests</h2>
        <p className="text-sm text-text-secondary">
          Requirements raised by every service line. Open one to see the need and the vendors that
          may meet it.
        </p>
      </div>
      <StatusFilterChips
        chips={[
          { key: 'all', label: 'All', count: interests.length },
          { key: 'mine', label: 'My requests', count: mine.length },
        ]}
        selected={filter}
        onSelect={setFilter}
      />
      <InterestTable
        interests={rows}
        onOpen={setOpenCode}
        mineName={userName}
        selectedCode={openCode}
        emptyText={filter === 'mine' ? 'You have not raised any requests yet.' : undefined}
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
