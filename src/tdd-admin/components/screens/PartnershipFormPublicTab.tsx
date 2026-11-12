'use client'

import React, { useEffect, useState } from 'react'
import { Copy, ExternalLink } from 'lucide-react'
import { SECONDARY_BUTTON, Switch } from './PartnershipFormParts'
import { PartnershipFormPreviewBody } from './PartnershipFormPreview'
import type { FormVersion } from './partnershipForm.data'

interface PublicTabProps {
  version: FormVersion
  accepting: boolean
  onAcceptingChange: (next: boolean) => void
  onViewPublic: () => void
  onToast: (message: string) => void
}

/** The live form as vendors see it, with the switch that closes it and the link to share */
export const PartnershipFormPublicTab: React.FC<PublicTabProps> = ({
  version,
  accepting,
  onAcceptingChange,
  onViewPublic,
  onToast,
}) => {
  const [origin, setOrigin] = useState('')
  useEffect(() => setOrigin(window.location.origin), [])
  const link = `${origin}/partnership-request`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      onToast('Link copied.')
    } catch {
      onToast('Copy the link from the box.')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section
        aria-label="Accepting requests"
        className="rounded-2xl border border-[#e2e8f0] bg-white shadow-xs px-6 py-5 flex items-center justify-between gap-4"
      >
        <div className="flex flex-col gap-0.5">
          <h3 className="text-base font-bold text-[#0d212c]">Accepting requests</h3>
          <p className="text-xs text-[#64748b]">
            Takes effect at once. Not part of a version. When off, vendors see the closed message
            instead of the form.
          </p>
        </div>
        <Switch checked={accepting} onChange={onAcceptingChange} label="Accepting requests" />
      </section>

      <section
        aria-label="Public link"
        className="rounded-2xl border border-[#e2e8f0] bg-white shadow-xs px-6 py-5 flex flex-col gap-3"
      >
        <div className="flex flex-col gap-0.5">
          <h3 className="text-base font-bold text-[#0d212c]">Public link</h3>
          <p className="text-xs text-[#64748b]">
            Built from the deployment URL, so it is right in every environment. No login is needed.
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <code className="text-xs text-[#0d212c] break-all">{link}</code>
          <div className="flex items-center gap-2">
            <button type="button" onClick={copy} className={SECONDARY_BUTTON}>
              <Copy className="w-4 h-4 text-[#64748b]" aria-hidden="true" />
              Copy link
            </button>
            <button type="button" onClick={onViewPublic} className={SECONDARY_BUTTON}>
              <ExternalLink className="w-4 h-4 text-[#64748b]" aria-hidden="true" />
              View public form
            </button>
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] overflow-hidden">
        <PartnershipFormPreviewBody version={version} closed={!accepting} />
      </div>
    </div>
  )
}
