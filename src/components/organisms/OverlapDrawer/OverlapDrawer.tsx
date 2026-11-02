'use client'

/**
 * OverlapDrawer — Organism
 * Side drawer with what an interest or project overlaps: each related item and why.
 * Used in: InternalInterestsScreen, ExistingProjectsScreen
 */

import React, { useEffect } from 'react'
import { FolderKanban, Lightbulb, Handshake, X } from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import type { OverlapDrawerProps } from './OverlapDrawer.types'

const KIND = {
  request: { label: 'Partnership request', icon: Handshake },
  project: { label: 'Existing project', icon: FolderKanban },
  interest: { label: 'Internal interest', icon: Lightbulb },
} as const

export const OverlapDrawer: React.FC<OverlapDrawerProps> = ({ subject, overlaps, onClose }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-bg-overlay backdrop-blur-xs animate-in fade-in duration-200"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="overlap-drawer-title"
        className="relative h-full w-full max-w-xl bg-bg-modal shadow-2xl border-l border-border-default flex flex-col animate-in slide-in-from-right duration-300"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border-subtle shrink-0">
          <div className="flex flex-col gap-1">
            <h2 id="overlap-drawer-title" className="text-lg font-semibold text-text-primary">
              Possible overlaps
            </h2>
            <p className="text-xs text-text-secondary">
              What the agent found for {subject}, strongest first.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close overlaps"
            className="text-text-tertiary hover:text-text-primary p-1.5 rounded-lg hover:bg-bg-hover transition cursor-pointer"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-3 overscroll-contain">
          {overlaps.map((o) => {
            const { label, icon: Icon } = KIND[o.kind]
            return (
              <li
                key={`${o.kind}-${o.ref}`}
                className="rounded-xl border border-border-default bg-bg-default p-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                    <Icon className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                    {label} · {o.ref}
                  </span>
                  <Badge size="sm" variant="warning">
                    {o.status}
                  </Badge>
                </div>
                <span className="text-sm font-medium text-text-primary">{o.title}</span>
                <ul className="flex flex-col gap-1">
                  {o.reasons.map((r) => (
                    <li key={r} className="text-xs text-text-secondary">
                      {r}
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ul>
      </aside>
    </div>
  )
}
