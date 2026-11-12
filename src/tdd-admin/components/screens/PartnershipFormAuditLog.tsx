'use client'

import React from 'react'
import { AuditLog } from '@/components/organisms/AuditLog'
import type { FormVersion } from './partnershipForm.data'

/** Everything done to this version, in the same design as the case audit log */
export const PartnershipFormAuditLog: React.FC<{ version: FormVersion }> = ({ version }) => (
  <div className="rounded-2xl border border-[#e2e8f0] bg-white shadow-xs p-6 sm:p-8">
    <AuditLog events={version.auditLog} />
  </div>
)
