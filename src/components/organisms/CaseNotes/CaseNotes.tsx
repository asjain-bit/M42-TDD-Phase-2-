'use client'

/**
 * CaseNotes — Organism
 * One-slide use case brief for a partnership request, docked to the right over the page.
 * Used in: DashboardScreen, PartnershipDetail
 */

import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  Copy,
  Maximize2,
  Minimize2,
  NotebookPen,
  NotebookText,
  Pencil,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { HighlightLegend } from '@/components/atoms/HighlightLegend'
import { Icon } from '@/components/atoms/Icon'
import { StatusChip } from '@/components/atoms/StatusChip'
import { HighlightEditor } from '@/components/molecules/HighlightEditor'
import { StageChip } from '@/components/molecules/StageChip'
import { Toast } from '@/components/molecules/Toast'
import { ConfidenceBadge } from '@/components/organisms/AgentActions'
import type { DisplayStatus } from '@/lib/caseStatus'
import { buildNotesText, getCaseNotesData, stageText } from './caseNotes.data'
import type { CaseNotesProps } from './CaseNotes.types'

const STATUS_CATEGORY: Record<DisplayStatus, 'warning' | 'info' | 'success' | 'error' | 'neutral'> =
  {
    Pending: 'warning',
    'In Progress': 'info',
    Completed: 'success',
    Closed: 'error',
    RFI: 'neutral',
  }

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [contenteditable="true"], [tabindex]:not([tabindex="-1"])'

const Section: React.FC<{ title: string; action?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  action,
  children,
}) => (
  <section className="flex flex-col gap-2 pt-5 border-t border-border-subtle">
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
        {title}
      </h3>
      {action}
    </div>
    {children}
  </section>
)

const ToolbarButton: React.FC<{
  icon: LucideIcon
  label: string
  onClick: () => void
  hideLabel?: boolean
  pressed?: boolean
}> = ({ icon: Glyph, label, onClick, hideLabel = false, pressed }) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onClick}
    aria-label={hideLabel ? label : undefined}
    aria-expanded={pressed}
    title={label}
    className="!px-2 gap-1.5 text-text-secondary hover:text-text-primary"
  >
    <Glyph className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
    {!hideLabel && <span className="hidden sm:inline">{label}</span>}
  </Button>
)

export const CaseNotes: React.FC<CaseNotesProps> = ({
  request,
  status,
  showAssessment = false,
  canEditNotes = true,
  onSaveNote,
  onClose,
  defaultExpanded = false,
}) => {
  const data = useMemo(() => getCaseNotesData(request), [request])
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [editing, setEditing] = useState(false)
  const [toast, setToast] = useState<{ title: string; variant: 'success' | 'error' } | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const notesRef = useRef<HTMLDivElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleId = useId()
  const latest = useRef({ editing, onClose })
  latest.current = { editing, onClose }

  // Focus moves into the card, and back to whatever opened it on close
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
      if (toastTimer.current) clearTimeout(toastTimer.current)
      opener?.focus?.()
    }
  }, [])

  // Esc leaves the editor first, then closes the card
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (latest.current.editing) setEditing(false)
      else latest.current.onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (editing) notesRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
  }, [editing])

  // Keep Tab inside the card
  const trapFocus = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !panelRef.current) return
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement
    if (e.shiftKey && (active === first || active === panelRef.current)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const notify = (title: string, variant: 'success' | 'error') => {
    setToast({ title, variant })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildNotesText(data, status, showAssessment))
      notify('Notes copied to the clipboard.', 'success')
    } catch {
      notify('Could not copy the notes.', 'error')
    }
  }

  const toggle = () => {
    setExpanded((v) => !v)
    setEditing(false)
  }

  const startEditing = () => {
    setExpanded(true)
    setEditing(true)
  }

  const facts = [
    { label: 'Stage', value: stageText(data.stage) },
    { label: 'Owner', value: data.owner },
    { label: 'Focus area', value: data.focusArea },
    { label: 'Maturity', value: data.maturity },
  ]

  const showNotes = Boolean(data.notes) || canEditNotes

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-3 sm:p-6">
      <div
        aria-hidden="true"
        data-testid="case-notes-backdrop"
        onClick={onClose}
        className="absolute inset-0 bg-bg-overlay backdrop-blur-xs animate-in fade-in duration-200"
      />

      {toast && (
        <Toast
          title={toast.title}
          variant={toast.variant}
          onClose={() => setToast(null)}
          className="fixed top-5 right-5 z-[60] animate-in slide-in-from-top-4 duration-200"
        />
      )}

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={trapFocus}
        className={`relative w-full max-w-2xl flex flex-col overflow-hidden rounded-[var(--radius-xl)] border border-border-default bg-bg-modal shadow-2xl outline-none animate-in slide-in-from-right-8 fade-in duration-300 transition-[height] ${
          expanded ? 'h-[85vh]' : 'max-h-[85vh]'
        }`}
      >
        {/* Toolbar strip */}
        <div className="flex items-center justify-end gap-1 px-3 py-1.5 border-b border-border-subtle bg-bg-surface-1 shrink-0">
          <ToolbarButton
            icon={expanded ? Minimize2 : Maximize2}
            label={expanded ? 'Collapse' : 'Expand'}
            onClick={toggle}
            pressed={expanded}
          />
          <ToolbarButton icon={Copy} label="Copy notes" onClick={copy} />
          {canEditNotes && <ToolbarButton icon={Pencil} label="Edit" onClick={startEditing} />}
          <span className="w-px h-5 bg-border-default mx-1" aria-hidden="true" />
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close notes"
            title="Close"
            className="!p-1.5 text-text-tertiary hover:text-text-primary"
          >
            <Icon name="close" size="sm" />
          </Button>
        </div>

        {/* Header */}
        <div className="flex items-start gap-4 px-6 pt-5 pb-4 shrink-0">
          <div className="w-11 h-11 rounded-[var(--radius-lg)] bg-[var(--app-accent-soft)] text-[var(--app-accent)] flex items-center justify-center shrink-0">
            <NotebookPen className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
              Case notes
            </span>
            <h2 id={titleId} className="text-xl font-semibold text-text-primary leading-tight">
              {data.company}
            </h2>
            <div className="flex items-center gap-2 flex-wrap pt-0.5">
              <span className="text-xs font-medium text-text-secondary">{data.code}</span>
              <StatusChip label={status} status={STATUS_CATEGORY[status]} dot={false} />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggle}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse notes' : 'Expand notes'}
            className="!p-1.5 shrink-0"
          >
            <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size="sm" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pb-6 flex flex-col gap-5">
          <p className="text-base font-medium text-text-primary leading-relaxed">{data.headline}</p>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {facts.map((f) => (
              <div
                key={f.label}
                className="rounded-[var(--radius-md)] border border-border-subtle bg-bg-surface-1 px-3 py-2.5 flex flex-col gap-1 min-w-0"
              >
                <dt className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
                  {f.label}
                </dt>
                <dd className="text-sm font-medium text-text-primary break-words">{f.value}</dd>
              </div>
            ))}
          </dl>

          {expanded && (
            <>
              {data.solution && (
                <Section title="Solution description">
                  <p className="text-sm text-text-secondary leading-relaxed">{data.solution}</p>
                </Section>
              )}

              {data.proposal && (
                <Section title="Proposal of collaboration">
                  <p className="text-sm text-text-secondary leading-relaxed">{data.proposal}</p>
                </Section>
              )}

              {data.focusAreas.length > 0 && (
                <Section title="Focus areas">
                  <ul className="flex flex-wrap gap-1.5">
                    {data.focusAreas.map((area) => (
                      <li key={area}>
                        <Badge size="sm">{area}</Badge>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {(data.maturityDetail || data.approvals.length > 0) && (
                <Section title="Solution maturity & approvals">
                  {data.maturityDetail && (
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {data.maturityDetail}
                    </p>
                  )}
                  {data.approvals.length > 0 && (
                    <ul aria-label="Approvals" className="flex flex-wrap gap-1.5">
                      {data.approvals.map((a) => (
                        <li key={a}>
                          <Badge size="sm" variant={a === 'Not applicable' ? 'default' : 'success'}>
                            {a}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>
              )}

              <Section title="Stage progress">
                <StageChip progress={data.stage} fullWidth />
              </Section>

              {data.sponsors && (
                <Section title="Sponsors">
                  <dl className="flex flex-col gap-1.5 text-sm">
                    <div className="flex gap-2">
                      <dt className="text-text-tertiary w-24 shrink-0">Lead</dt>
                      <dd className="text-text-primary font-medium">{data.sponsors.lead}</dd>
                    </div>
                    {data.sponsors.co.length > 0 && (
                      <div className="flex gap-2">
                        <dt className="text-text-tertiary w-24 shrink-0">Co-sponsors</dt>
                        <dd className="text-text-primary">{data.sponsors.co.join(', ')}</dd>
                      </div>
                    )}
                  </dl>
                </Section>
              )}

              {showAssessment && data.assessment && (
                <Section title="Assessment summary">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      size="sm"
                      variant={data.assessment.status === 'reject' ? 'error' : 'success'}
                    >
                      {data.assessment.status === 'reject'
                        ? 'Points to reject'
                        : 'Points to proceed'}
                    </Badge>
                    <ConfidenceBadge level={data.assessment.confidence} />
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {data.assessment.rationale}
                  </p>
                </Section>
              )}

              {showNotes && (
                <div ref={notesRef}>
                  <Section
                    title="Key notes"
                    action={
                      canEditNotes &&
                      !editing && (
                        <button
                          type="button"
                          onClick={startEditing}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--app-accent)] hover:underline cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                          {data.notes ? 'Edit key notes' : 'Add key notes'}
                        </button>
                      )
                    }
                  >
                    {editing ? (
                      <HighlightEditor
                        label="Edit key notes"
                        initialHtml={data.notes?.html ?? ''}
                        onCancel={() => setEditing(false)}
                        onSave={(html) => {
                          onSaveNote?.(html)
                          setEditing(false)
                        }}
                      />
                    ) : data.notes ? (
                      <>
                        <p
                          className="summary-note text-sm text-text-secondary leading-relaxed whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: data.notes.html }}
                        />
                        <HighlightLegend />
                      </>
                    ) : (
                      <p className="text-sm text-text-tertiary flex items-center gap-2">
                        <NotebookText className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                        No key notes yet.
                      </p>
                    )}
                  </Section>
                </div>
              )}

              {data.notes && (
                <p className="pt-4 border-t border-border-subtle text-xs text-text-tertiary">
                  Last updated by{' '}
                  <span className="font-medium text-text-secondary">{data.notes.updatedBy}</span> on{' '}
                  <span className="font-medium text-text-secondary">{data.notes.updatedOn}</span>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
