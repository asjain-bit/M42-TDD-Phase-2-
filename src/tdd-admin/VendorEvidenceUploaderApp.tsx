/**
 * VendorEvidenceUploaderApp — Template
 * Vendor Evidence Uploader profile view: the vendor follow-up answers and evidence upload flow from the M42 Tech Due Diligence repo, entered from the shared login.
 * Used in: HomePage
 */

'use client'

import React from 'react'
import { VendorEvidenceUploaderScreen } from '@/tdd-admin/components/screens/VendorEvidenceUploaderScreen'
import './tdd-admin.css'

interface VendorEvidenceUploaderAppProps {
  onSignOut: () => void
}

export const VendorEvidenceUploaderApp: React.FC<VendorEvidenceUploaderAppProps> = ({
  onSignOut,
}) => (
  <div className="tdd-admin">
    <VendorEvidenceUploaderScreen onExit={onSignOut} />
  </div>
)
