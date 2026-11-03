'use client'

/**
 * ServiceLineAllInterestsScreen — Screen
 * The All interests tab of Internal interests: one table of every requirement, with who raised
 * it and its status; a row opens the interest drawer, and a just-submitted one opens by itself.
 * Used in: ServiceLineInterestScreen (Internal Interest Team)
 */

import React, { useEffect, useState } from 'react'
import { InterestDrawer } from '@/components/organisms/InterestDrawer'
import { InterestTable } from '@/components/organisms/InterestTable'
import type { PartnershipRequest, ServiceLineInterest } from '@/types/partnership.types'

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

  return (
    <div className="flex flex-col gap-6 w-full text-text-primary">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-text-secondary">
          Requirements raised by every service line. Open one to see the need and the vendors that
          may meet it.
        </p>
      </div>
      <InterestTable
        interests={interests}
        onOpen={setOpenCode}
        selectedCode={openCode}
        detailed
        emptyText="No interests have been raised yet."
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
