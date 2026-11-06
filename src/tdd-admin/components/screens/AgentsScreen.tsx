/**
 * AgentsScreen — Screen
 * Admin Agents page displaying prompt core, configuration, versioning, and statuses for M42 due-diligence agents.
 * Used in: HomePage
 */

'use client'

import React from 'react'
import { AgentManagement } from '@/tdd-admin/components/organisms/AgentManagement'

export interface AgentsScreenProps {
  className?: string
  showRoleSwitch?: boolean
}

export const AgentsScreen: React.FC<AgentsScreenProps> = ({ className = '', showRoleSwitch }) => {
  return (
    <div className={`w-full ${className}`}>
      <AgentManagement showRoleSwitch={showRoleSwitch} />
    </div>
  )
}
