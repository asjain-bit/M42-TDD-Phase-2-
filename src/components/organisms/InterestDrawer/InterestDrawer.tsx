'use client'

/**
 * InterestDrawer — Organism
 * Right side drawer with one interest: the need and the vendors M42 already knows for it. No
 * overlay: the page stays usable; only a shadow and a thin border set it apart.
 * Used in: ServiceLineInterestScreen, ServiceLineAllInterestsScreen, InternalInterestsScreen
 */

import React, { useEffect, useId, useMemo, useRef } from 'react'
import { X } from 'lucide-react'
import { matchVendors } from '@/lib/serviceLineMatch'
import type { InterestDrawerProps } from './InterestDrawer.types'

const Detail: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <dt className="text-xs font-medium text-text-tertiary">{label}</dt>
    <dd className="text-sm text-text-primary leading-relaxed">{children}</dd>
  </div>
)

export const InterestDrawer: React.FC<InterestDrawerProps> = ({ interest, requests, onClose }) => {
  const titleId = useId()
  const panelRef = useRef<HTMLElement>(null)
  const vendors = useMemo(() => matchVendors(interest, requests), [interest, requests])

  const close = useRef(onClose)
  close.current = onClose

  // Focus moves in and back to the opener; Esc closes
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close.current()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      opener?.focus?.()
    }
  }, [])

  return (
    <aside
      ref={panelRef}
      role="dialog"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-bg-default border-l border-border-default shadow-2xl flex flex-col outline-none"
    >
      <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border-subtle shrink-0">
        <div className="flex flex-col gap-1 min-w-0">
          <h2 id={titleId} className="text-base font-semibold text-text-primary leading-snug">
            {interest.title}
          </h2>
          <p className="text-xs text-text-tertiary">
            {interest.code} · {interest.serviceLine} · {interest.submittedBy} · {interest.on}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close interest"
          className="text-text-tertiary hover:text-text-primary p-1.5 rounded-lg hover:bg-bg-hover transition cursor-pointer shrink-0"
        >
          <X className="w-5 h-5" strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6 overscroll-contain">
        <section aria-labelledby={`${titleId}-need`} className="flex flex-col gap-3">
          <h3 id={`${titleId}-need`} className="text-sm font-semibold text-text-primary">
            The need
          </h3>
          <dl className="flex flex-col gap-4">
            <Detail label="Problem">{interest.problem}</Detail>
            <Detail label="Outcome">{interest.outcome}</Detail>
            <Detail label="Focus area">{interest.focusAreas.join(', ')}</Detail>
            <Detail label="Urgency">{interest.urgency}</Detail>
          </dl>
        </section>

        <section aria-labelledby={`${titleId}-vendors`} className="flex flex-col gap-3">
          <h3 id={`${titleId}-vendors`} className="text-sm font-semibold text-text-primary">
            Recommended vendors
          </h3>
          {vendors.length === 0 ? (
            <p className="text-xs text-text-tertiary">
              No vendor in the requests matches this yet.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border-subtle border-y border-border-subtle">
              {vendors.map(({ request: r }) => (
                <li key={r.id} className="py-2.5 text-sm text-text-primary">
                  {r.companyName} <span className="text-text-tertiary">· {r.requestCode}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </aside>
  )
}
