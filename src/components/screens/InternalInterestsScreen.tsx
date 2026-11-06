'use client'

/**
 * InternalInterestsScreen — Screen
 * Service line interests for the Strategy Team (all, to approve or decline, with the overlap
 * check, and a menu to edit or delete each one) and for the Partnership Admin and Director
 * (approved only, read-only, in the same table and drawer as the Service Line Owner's All
 * interests).
 * Used in: HomePage (Strategy Team, Partnership Admin, Director)
 */

import React, { useEffect, useMemo, useState } from 'react'
import { Check, Inbox, Plus, Radar, Trash2, X } from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { StatusChip } from '@/components/atoms/StatusChip'
import { Textarea } from '@/components/atoms/Textarea'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { RowActionsMenu } from '@/components/molecules/RowActionsMenu'
import { SearchBar } from '@/components/molecules/SearchBar'
import { StatusFilterChips } from '@/components/molecules/StatusFilterChips'
import { Toast } from '@/components/molecules/Toast'
import { InterestDrawer } from '@/components/organisms/InterestDrawer'
import { InterestEditModal, type InterestEdit } from '@/components/organisms/InterestEditModal'
import { InterestTable } from '@/components/organisms/InterestTable'
import { OverlapDrawer } from '@/components/organisms/OverlapDrawer'
import { RecommendedVendors } from '@/components/organisms/RecommendedVendors'
import { ThinkingMode } from '@/components/organisms/ThinkingMode'
import type { StatusRole } from '@/lib/caseStatus'
import { visibleInterests } from '@/lib/overlaps'
import { matchVendors } from '@/lib/serviceLineMatch'
import type {
  InterestStatus,
  Overlap,
  PartnershipRequest,
  ServiceLineInterest,
} from '@/types/partnership.types'

export interface InternalInterestsScreenProps {
  /** Every interest; the screen shows what this role may see */
  interests: ServiceLineInterest[]
  requests: PartnershipRequest[]
  role: StatusRole
  /** Strategy Team only */
  onDecide?: (code: string, decision: 'Approved' | 'Declined', reason?: string) => void
  /** Runs the overlap check over every interest and stores the results */
  onRunOverlaps: () => void
  /** Strategy Team only: add an interest from their own scouting (approved straight away) */
  onAdd?: (draft: InterestEdit) => void
  /** Strategy Team only: change an interest, or delete it */
  onEdit?: (code: string, edit: InterestEdit) => void
  onDelete?: (code: string) => void
}

const STATUSES: InterestStatus[] = ['Pending review', 'Approved', 'Declined']
const STATUS_TONE = { 'Pending review': 'warning', Approved: 'success', Declined: 'error' } as const

export const OVERLAP_MESSAGES = [
  'Comparing with partnership requests',
  'Checking existing M42 projects',
  'Looking for duplicate interests',
]

/** Overlap flag in a table row: the strongest one, and how many more */
export const OverlapFlag: React.FC<{ overlaps: Overlap[]; onOpen: () => void }> = ({
  overlaps,
  onOpen,
}) =>
  overlaps.length === 0 ? (
    <span className="text-xs text-text-tertiary">-</span>
  ) : (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onOpen()
      }}
      aria-label={`${overlaps.map((o) => o.label).join('; ')}. Show details`}
      className="inline-flex items-center gap-1 cursor-pointer"
    >
      <Badge size="sm" variant="warning" className="whitespace-nowrap hover:underline">
        {overlaps[0].label}
        {overlaps.length > 1 && ` +${overlaps.length - 1}`}
      </Badge>
    </button>
  )

const Detail: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <dt className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
      {label}
    </dt>
    <dd className="text-sm text-text-primary leading-relaxed">{children}</dd>
  </div>
)

export const InternalInterestsScreen: React.FC<InternalInterestsScreenProps> = ({
  interests,
  requests,
  role,
  onDecide,
  onRunOverlaps,
  onAdd,
  onEdit,
  onDelete,
}) => {
  const isStrategy = role === 'strategy'
  const visible = useMemo(() => visibleInterests(interests, role), [interests, role])
  const visibleCodes = new Set(visible.map((i) => i.code))
  // Never point Admin or Director at interests they cannot see
  const overlapsOf = (i: ServiceLineInterest) =>
    (i.overlaps ?? []).filter((o) => o.kind !== 'interest' || visibleCodes.has(o.ref))

  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [checking, setChecking] = useState(false)
  const [openCode, setOpenCode] = useState<string | null>(null)
  const [overlapCode, setOverlapCode] = useState<string | null>(null)
  const [declining, setDeclining] = useState(false)
  const [reason, setReason] = useState('')
  // Strategy Team: the interest being edited, and the one waiting for delete confirmation
  const [editing, setEditing] = useState<ServiceLineInterest | null>(null)
  const [adding, setAdding] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])
  const [deleting, setDeleting] = useState<ServiceLineInterest | null>(null)
  const canManage = isStrategy && Boolean(onEdit && onDelete)

  const open = visible.find((i) => i.code === openCode) ?? null
  const overlapFor = visible.find((i) => i.code === overlapCode) ?? null
  const matches = useMemo(() => (open ? matchVendors(open, requests) : []), [open, requests])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenCode(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const chips = [
    { key: 'all', label: 'All interests', count: visible.length },
    ...(isStrategy ? STATUSES : (['Approved'] as InterestStatus[])).map((s) => ({
      key: s,
      label: s,
      count: visible.filter((i) => i.status === s).length,
    })),
  ]
  const term = search.trim().toLowerCase()
  const rows = visible.filter(
    (i) =>
      (filter === 'all' || i.status === filter) &&
      (!term ||
        [i.code, i.title, i.serviceLine, ...i.focusAreas].some((v) =>
          v.toLowerCase().includes(term)
        ))
  )

  const closeDrawer = () => {
    setOpenCode(null)
    setDeclining(false)
    setReason('')
  }

  const decide = (decision: 'Approved' | 'Declined') => {
    if (!open) return
    onDecide?.(open.code, decision, decision === 'Declined' ? reason.trim() : undefined)
    setDeclining(false)
    setReason('')
  }

  // Partnership Admin and Director: approved interests, in the shared table and drawer
  if (!isStrategy) {
    return (
      <div className="flex flex-col gap-6 w-full text-text-primary">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Internal Interests</h2>
            <p className="text-sm text-text-secondary">
              Requirements raised by service lines and approved by the Strategy Team.
            </p>
          </div>
          <div className="w-full sm:w-72">
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
          emptyText={
            visible.length === 0
              ? 'No interests have been approved yet.'
              : 'No interests match your search.'
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

  return (
    <div className="flex flex-col gap-6 w-full text-text-primary">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Internal Interests</h2>
          <p className="text-sm text-text-secondary">
            {isStrategy
              ? 'Requirements raised by service lines. Approve them to share them with the Partnership Admin and Director.'
              : 'Requirements raised by service lines and approved by the Strategy Team.'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="md"
            onClick={() => setChecking(true)}
            disabled={checking}
            className="gap-1.5"
          >
            <Radar className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
            Run overlap check
          </Button>
          {onAdd && (
            <Button variant="primary" size="md" onClick={() => setAdding(true)} className="gap-1.5">
              <Plus className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
              Add interest
            </Button>
          )}
        </div>
      </div>

      {checking && (
        <ThinkingMode
          inline
          eyebrow="ANALYZING"
          title="Checking for overlaps"
          description="The agent is comparing each interest with partnership requests, existing projects and other interests."
          messages={OVERLAP_MESSAGES}
          stepMs={650}
          onComplete={() => {
            onRunOverlaps()
            setChecking(false)
          }}
        />
      )}

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <StatusFilterChips chips={chips} selected={filter} onSelect={setFilter} />
        <div className="w-full sm:w-72">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search interests..."
            showButton={false}
          />
        </div>
      </div>

      <div className="bg-bg-default rounded-2xl border border-border-default shadow-xs overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-surface-1 border-b border-border-default text-text-tertiary text-[11px] font-medium uppercase tracking-wider">
                <th className="py-4 px-4">Code</th>
                <th className="py-4 px-4">Title</th>
                <th className="py-4 px-4">Service line</th>
                <th className="py-4 px-4">Focus area</th>
                <th className="py-4 px-4">Submitted</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Overlap</th>
                {canManage && (
                  <th className="py-4 px-4 w-12">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="py-16 text-center text-text-tertiary">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="w-6 h-6" aria-hidden="true" />
                      <span className="text-xs">No interests match your search or filter.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((i) => (
                  <tr
                    key={i.code}
                    onClick={() => setOpenCode(i.code)}
                    className="hover:bg-bg-hover transition-colors cursor-pointer group"
                  >
                    <td className="py-4.5 px-4 text-xs font-medium text-text-tertiary whitespace-nowrap">
                      {i.code}
                    </td>
                    <td className="py-4.5 px-4 text-xs font-medium text-text-primary group-hover:text-[var(--app-accent)]">
                      <span className="inline-flex items-center gap-2 flex-wrap">
                        {i.title}
                        {i.source === 'Strategy scouting' && (
                          <Badge size="sm" variant="info" title="Added by the Strategy Team">
                            Strategy
                          </Badge>
                        )}
                      </span>
                    </td>
                    <td className="py-4.5 px-4 text-xs text-text-primary whitespace-nowrap">
                      {i.serviceLine}
                    </td>
                    <td className="py-4.5 px-4">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {i.focusAreas.map((f) => (
                          <span
                            key={f}
                            className="inline-flex px-2 py-0.5 rounded-md bg-bg-surface-2 text-text-secondary text-xs whitespace-nowrap"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4.5 px-4 text-xs text-text-tertiary whitespace-nowrap">
                      {i.on}
                    </td>
                    <td className="py-4.5 px-4">
                      <StatusChip label={i.status} status={STATUS_TONE[i.status]} />
                    </td>
                    <td className="py-4.5 px-4">
                      <OverlapFlag overlaps={overlapsOf(i)} onOpen={() => setOverlapCode(i.code)} />
                    </td>
                    {canManage && (
                      <td className="py-4.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <RowActionsMenu
                          label={`${i.code} ${i.title}`}
                          onEdit={() => setEditing(i)}
                          onDelete={() => setDeleting(i)}
                        />
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            aria-hidden="true"
            onClick={closeDrawer}
            className="absolute inset-0 bg-bg-overlay backdrop-blur-xs animate-in fade-in duration-200"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="interest-drawer-title"
            className="relative h-full w-full max-w-2xl bg-bg-modal shadow-2xl border-l border-border-default flex flex-col animate-in slide-in-from-right duration-300"
          >
            <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border-subtle shrink-0">
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                  {open.code} · {open.serviceLine}
                </span>
                <h2 id="interest-drawer-title" className="text-lg font-semibold text-text-primary">
                  {open.title}
                </h2>
                <span className="pt-1">
                  <StatusChip label={open.status} status={STATUS_TONE[open.status]} />
                </span>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Close interest"
                className="text-text-tertiary hover:text-text-primary p-1.5 rounded-lg hover:bg-bg-hover transition cursor-pointer"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6 overscroll-contain">
              {open.decidedBy && open.status !== 'Pending review' && (
                <p
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    open.status === 'Approved'
                      ? 'border-status-success-border bg-status-success-bg text-status-success-text'
                      : 'border-status-error-border bg-status-error-bg text-status-error-text'
                  }`}
                >
                  {open.status} by {open.decidedBy} on {open.decidedOn}
                  {open.declineReason && `. Reason: ${open.declineReason}`}
                </p>
              )}
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <Detail label="Problem to solve">{open.problem}</Detail>
                </div>
                <div className="sm:col-span-2">
                  <Detail label="Desired outcome / KPI">{open.outcome}</Detail>
                </div>
                <Detail label="Focus areas">
                  <span className="flex flex-wrap gap-1.5 pt-0.5">
                    {open.focusAreas.map((f) => (
                      <Badge key={f} size="sm">
                        {f}
                      </Badge>
                    ))}
                  </span>
                </Detail>
                <Detail label="Urgency">{open.urgency}</Detail>
                <Detail label="Submitted by">{open.submittedBy}</Detail>
                <Detail label="Submitted on">{open.on}</Detail>
              </dl>
              {overlapsOf(open).length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                    Overlap check
                  </span>
                  <OverlapFlag
                    overlaps={overlapsOf(open)}
                    onOpen={() => setOverlapCode(open.code)}
                  />
                </div>
              )}
              <RecommendedVendors matches={matches} suggested={open.suggestedVendors} />
            </div>

            {isStrategy && onDecide && open.status === 'Pending review' && (
              <div className="border-t border-border-subtle px-6 py-4 flex flex-col gap-3 shrink-0">
                {declining && (
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="decline-reason"
                      className="text-xs font-semibold text-text-secondary"
                    >
                      Reason <span className="text-text-error">*</span>
                    </label>
                    <Textarea
                      id="decline-reason"
                      rows={2}
                      maxLength={300}
                      resize="none"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Why is this interest declined?"
                    />
                  </div>
                )}
                <div className="flex items-center justify-end gap-2">
                  {declining ? (
                    <>
                      <Button variant="outline" size="md" onClick={() => setDeclining(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="md"
                        disabled={!reason.trim()}
                        onClick={() => decide('Declined')}
                      >
                        Decline interest
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="md" onClick={() => setDeclining(true)}>
                        Decline
                      </Button>
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => decide('Approved')}
                        className="gap-1.5"
                      >
                        <Check className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                        Approve
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {adding && (
        <InterestEditModal
          onClose={() => setAdding(false)}
          onSave={(draft) => {
            onAdd?.(draft)
            setAdding(false)
            setToast('Interest added.')
          }}
        />
      )}

      {toast && (
        <Toast
          title={toast}
          variant="success"
          onClose={() => setToast(null)}
          className="fixed top-5 right-5 z-[60] animate-in slide-in-from-top-4 duration-200"
        />
      )}

      {editing && (
        <InterestEditModal
          interest={editing}
          onClose={() => setEditing(null)}
          onSave={(edit) => {
            onEdit?.(editing.code, edit)
            setEditing(null)
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete this interest?"
          description={`${deleting.code} ${deleting.title} will be removed from Internal Interests and from the overlap checks.`}
          icon={Trash2}
          cancelLabel="Cancel"
          confirmLabel="Delete"
          danger
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            onDelete?.(deleting.code)
            if (openCode === deleting.code) closeDrawer()
            setDeleting(null)
          }}
        />
      )}

      {/* Above the interest drawer when opened from it */}
      {overlapFor && (
        <OverlapDrawer
          subject={`${overlapFor.code} ${overlapFor.title}`}
          overlaps={overlapsOf(overlapFor)}
          onClose={() => setOverlapCode(null)}
        />
      )}
    </div>
  )
}
