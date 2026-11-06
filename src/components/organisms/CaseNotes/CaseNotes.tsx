'use client'

/**
 * CaseNotes — Organism
 * The case notes log as a box anchored to the Notes icon: a composer with Risk, Positive and
 * Neutral highlights, then the latest note in one line, or with Show all every note, newest
 * first. Notes are only ever added.
 * Used in: DashboardScreen
 */

import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { ChevronDown, ChevronUp, NotebookText } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Icon } from '@/components/atoms/Icon'
import { Input } from '@/components/atoms/Input'
import { StatusChip } from '@/components/atoms/StatusChip'
import { HighlightEditor } from '@/components/molecules/HighlightEditor'
import type { DisplayStatus } from '@/lib/caseStatus'
import { NOTE_LOG_TONES, countNoteTones, sanitiseNoteHtml } from '@/lib/summaryNote'
import type { CaseNotesProps } from './CaseNotes.types'

const STATUS_CATEGORY: Record<DisplayStatus, 'warning' | 'info' | 'success' | 'error' | 'neutral'> =
  {
    Pending: 'warning',
    'In Progress': 'info',
    Completed: 'success',
    Closed: 'error',
    RFI: 'neutral',
  }

/** Box size and spacing: 600px wide, the viewport less 32px on screens under 640px */
const CARD_WIDTH = 600
const SMALL_SCREEN = 640
/** The collapsed box is at most 75vh */
const MAX_HEIGHT_SHARE = 0.75
/**
 * With All notes open it may grow to 80vh, on the side it opened. It opens below the icon only
 * when there is room for that expanded height.
 */
const ALL_NOTES_HEIGHT_SHARE = 0.8
/** Text colour of each tone's count next to All notes */
const TONE_COUNT_TEXT: Partial<Record<string, string>> = {
  critical: 'text-status-error-text',
  positive: 'text-status-success-text',
  neutral: 'text-text-secondary',
}
const VIEWPORT_MARGIN = 16
const GAP = 8
/** The notch: 16 x 9px, its base laid 1.5px over the box border so the outline runs on */
const NOTCH_WIDTH = 16
const NOTCH_HEIGHT = 9
const BORDER = 1.5
/** How far the notch sticks out of the box */
const NOTCH_OUT = NOTCH_HEIGHT - BORDER
/** Keeps the notch clear of the box's rounded corners */
const NOTCH_INSET = 14 + NOTCH_WIDTH / 2
const CLOSE_MS = 150

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [contenteditable="true"], [tabindex]:not([tabindex="-1"])'

const initialsOf = (name: string) =>
  name
    .replace(/^Dr\.\s*/, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')

/** 22 Oct 2026, 10:40 */
const formatNoteTime = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
}

export const CaseNotes: React.FC<CaseNotesProps> = ({
  request,
  status,
  canAddNotes = true,
  onAddNote,
  onClose,
  anchor,
}) => {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const notes = useMemo(() => [...(request.notes ?? [])].reverse(), [request.notes])
  // Collapsed, the log shows only the latest note in one line
  const [showAll, setShowAll] = useState(false)
  // The composer stays open while it is focused or has text
  const [composerFocused, setComposerFocused] = useState(false)
  const [composerHasText, setComposerHasText] = useState(false)
  const oneLine = showAll && !composerFocused && !composerHasText
  const timelineId = useId()

  // Whether the timeline has more below what is shown, for the fade at its foot
  const timelineRef = useRef<HTMLOListElement>(null)
  const [more, setMore] = useState(false)
  const checkMore = useCallback(() => {
    const el = timelineRef.current
    setMore(Boolean(el && el.scrollTop + el.clientHeight < el.scrollHeight - 1))
  }, [])
  useLayoutEffect(() => {
    checkMore()
    const el = timelineRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(checkMore)
    observer.observe(el)
    return () => observer.disconnect()
  }, [checkMore, notes, showAll])

  // Motion: fade and scale in from the pointer, and the same in reverse on close
  const reducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )
  const [shown, setShown] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const requestClose = useCallback(() => {
    if (closeTimer.current) return
    if (reducedMotion) {
      onClose()
      return
    }
    setLeaving(true)
    closeTimer.current = setTimeout(onClose, CLOSE_MS)
  }, [onClose, reducedMotion])

  const latestClose = useRef(requestClose)
  latestClose.current = requestClose

  // Focus moves into the box, and back to whatever opened it on close
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    const frame = requestAnimationFrame(() => setShown(true))
    return () => {
      cancelAnimationFrame(frame)
      if (closeTimer.current) clearTimeout(closeTimer.current)
      opener?.focus?.()
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && latestClose.current()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // A click outside closes it; the page behind stays usable. Clicking the icon that opened it
  // again also closes it (its own click is handled below, so it does not reopen).
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (popoverRef.current?.contains(target) || anchor?.contains(target)) return
      latestClose.current()
    }
    const onAnchorClick = () => latestClose.current()
    document.addEventListener('mousedown', onDown, true)
    anchor?.addEventListener('click', onAnchorClick)
    return () => {
      document.removeEventListener('mousedown', onDown, true)
      anchor?.removeEventListener('click', onAnchorClick)
    }
  }, [anchor])

  // Anchored to the icon: right edges aligned and the pointer on the icon's centre. The side is
  // picked on open: below when the full height (600px) fits, otherwise above, with the box's
  // bottom edge on the icon. It never flips while open; a window resize picks again.
  const [position, setPosition] = useState<{
    top?: number
    bottom?: number
    left: number
    width: number
    pointerX: number
    placement: 'below' | 'above'
    /** Room on the chosen side, inside the 16px margin */
    room: number
    /** 75vh */
    expandedMax: number
    /** The viewport height, for the 80vh cap with All notes open */
    vh: number
  } | null>(null)
  const sideRef = useRef<'below' | 'above' | null>(null)
  const place = useCallback(
    (pickSide: boolean) => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const width =
        vw < SMALL_SCREEN
          ? vw - 2 * VIEWPORT_MARGIN
          : Math.min(CARD_WIDTH, vw - 2 * VIEWPORT_MARGIN)
      const expandedMax = vh * MAX_HEIGHT_SHARE
      const box = anchor?.getBoundingClientRect() ?? {
        top: VIEWPORT_MARGIN,
        bottom: VIEWPORT_MARGIN,
        left: vw - VIEWPORT_MARGIN,
        right: vw - VIEWPORT_MARGIN,
        width: 0,
      }
      const left = Math.min(
        Math.max(box.right - width, VIEWPORT_MARGIN),
        vw - VIEWPORT_MARGIN - width
      )
      const belowEdge = box.bottom + GAP + NOTCH_OUT
      const aboveEdge = box.top - GAP - NOTCH_OUT
      const roomBelow = vh - VIEWPORT_MARGIN - belowEdge
      const roomAbove = aboveEdge - VIEWPORT_MARGIN
      if (pickSide || !sideRef.current) {
        sideRef.current =
          roomBelow >= vh * ALL_NOTES_HEIGHT_SHARE || roomBelow >= roomAbove ? 'below' : 'above'
      }
      const placement = sideRef.current
      const pointerX = Math.min(
        Math.max(box.left + box.width / 2 - left, NOTCH_INSET),
        width - NOTCH_INSET
      )
      setPosition({
        ...(placement === 'below' ? { top: belowEdge } : { bottom: vh - aboveEdge }),
        left,
        width,
        pointerX,
        placement,
        room: Math.max(0, placement === 'below' ? roomBelow : roomAbove),
        expandedMax,
        vh,
      })
    },
    [anchor]
  )

  useLayoutEffect(() => {
    place(true)
    const onResize = () => place(true)
    // Scrolling moves the icon: the box follows it but keeps its side
    const onScroll = () => place(false)
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [place])

  // Keep Tab inside the box
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

  const pointerX = position?.pointerX ?? CARD_WIDTH - 24
  const above = position?.placement === 'above'

  return (
    <div
      ref={popoverRef}
      data-placement={position?.placement ?? 'below'}
      style={{
        top: position ? position.top : 0,
        bottom: position?.bottom,
        left: position?.left ?? 0,
        width: position?.width ?? CARD_WIDTH,
        transformOrigin: `${pointerX}px ${above ? '100%' : '0'}`,
        visibility: position ? 'visible' : 'hidden',
      }}
      className={`fixed z-50 transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none ${
        shown && !leaving ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.96]'
      }`}
    >
      {/* Notch on the Notes icon: filled in the box background, with the border drawn on its
          two sloped sides only. Its base lies over the box border, hiding the line under it, so
          the outline runs straight on into the notch. Flipped when the box opens above. */}
      <svg
        aria-hidden="true"
        width={NOTCH_WIDTH}
        height={NOTCH_HEIGHT}
        viewBox={`0 0 ${NOTCH_WIDTH} ${NOTCH_HEIGHT}`}
        overflow="visible"
        style={{
          left: pointerX - NOTCH_WIDTH / 2,
          ...(above ? { bottom: -NOTCH_OUT } : { top: -NOTCH_OUT }),
        }}
        className={`absolute z-10 ${above ? 'rotate-180' : ''}`}
      >
        <path
          d={`M0 ${NOTCH_HEIGHT} L${NOTCH_WIDTH / 2} 0 L${NOTCH_WIDTH} ${NOTCH_HEIGHT} Z`}
          fill="var(--bg-modal)"
        />
        <path
          d={`M0 ${NOTCH_HEIGHT - BORDER / 2} L${NOTCH_WIDTH / 2} ${BORDER / 2} L${NOTCH_WIDTH} ${NOTCH_HEIGHT - BORDER / 2}`}
          fill="none"
          stroke="var(--border-default)"
          strokeWidth={BORDER}
          strokeLinejoin="round"
        />
      </svg>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={trapFocus}
        style={{
          // Anchored by its top edge (below) or bottom edge (above), so it grows away from the icon
          maxHeight: position
            ? Math.min(
                showAll ? position.vh * ALL_NOTES_HEIGHT_SHARE : position.expandedMax,
                position.room
              )
            : '75vh',
        }}
        className="relative w-full flex flex-col overflow-hidden rounded-[14px] border-[1.5px] border-border-default bg-bg-modal shadow-2xl outline-none"
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-4 pb-3 border-b border-[#d3dbe4] shrink-0">
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
              Notes
            </span>
            <h2 id={titleId} className="text-base font-semibold text-text-primary truncate">
              {request.companyName}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-text-secondary">{request.requestCode}</span>
              <span className="text-xs text-text-tertiary" aria-hidden="true">
                ·
              </span>
              <StatusChip label={status} status={STATUS_CATEGORY[status]} dot={false} />
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={requestClose}
            aria-label="Close notes"
            title="Close"
            className="!p-1.5 text-text-tertiary hover:text-text-primary shrink-0"
          >
            <Icon name="close" size="sm" />
          </Button>
        </div>

        {/* Composer. With All notes open it shrinks to one line, and opens up again (pills and the
            2-4 line box) once the field is focused or has text. */}
        {canAddNotes && (
          <div
            className={`px-5 border-b border-[#d3dbe4] shrink-0 ${oneLine ? 'py-3' : 'py-4'}`}
            onFocus={() => setComposerFocused(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                setComposerFocused(false)
              }
            }}
          >
            {oneLine ? (
              <div className="flex items-center gap-2">
                <Input
                  aria-label="Add a note"
                  placeholder="Add a note…"
                  readOnly
                  onFocus={() => setComposerFocused(true)}
                  className="flex-1 h-9 cursor-text"
                />
                <Button variant="primary" size="sm" disabled>
                  Add
                </Button>
              </div>
            ) : (
              <HighlightEditor
                label="Add a note"
                tones={NOTE_LOG_TONES}
                hint={null}
                placeholder="Add a note… select text, then pick a colour."
                saveLabel="Add"
                compact
                resetOnSave
                // Opening from the one-line field carries the focus into the editor
                autoFocus={showAll}
                onEmptyChange={(empty) => setComposerHasText(!empty)}
                onSave={(html) => onAddNote?.(html)}
              />
            )}
          </div>
        )}

        {/* All notes: a one-line preview of the latest, or the whole timeline */}
        <section aria-label="All notes" className="flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-2 shrink-0">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                All notes · {notes.length}
              </h3>
              {/* How many Risk, Positive and Neutral highlights the notes hold; none hides it */}
              {countNoteTones(notes)
                .filter(({ count }) => count > 0)
                .map(({ tone, label, count }) => (
                  <span
                    key={tone}
                    className={`text-[11px] font-semibold ${TONE_COUNT_TEXT[tone] ?? 'text-text-secondary'}`}
                  >
                    {count}{' '}
                    {tone === 'critical' ? (count === 1 ? 'risk' : 'risks') : label.toLowerCase()}
                  </span>
                ))}
            </div>
            {notes.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                aria-expanded={showAll}
                aria-controls={timelineId}
                className="inline-flex items-center gap-1 text-xs font-medium text-text-link hover:underline cursor-pointer"
              >
                {showAll ? 'Hide' : 'Show all'}
                {showAll ? (
                  <ChevronUp className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                )}
              </button>
            )}
          </div>
          {notes.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-text-tertiary flex items-center gap-2">
              <NotebookText className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
              No notes yet.
            </p>
          ) : !showAll ? (
            // The latest note: who and when on one line, the note itself below (up to 4 lines)
            <div className="px-5 pb-4 flex gap-3 min-w-0">
              <span
                aria-hidden="true"
                className="w-8 h-8 shrink-0 rounded-full bg-[var(--app-accent-soft)] text-[var(--app-accent)] text-[11px] font-semibold flex items-center justify-center"
              >
                {initialsOf(notes[0].author)}
              </span>
              <div className="flex-1 min-w-0 flex flex-col gap-0.5 pt-1">
                <span className="text-xs text-text-tertiary truncate">
                  <span className="font-medium text-text-primary">{notes[0].author}</span> ·{' '}
                  {notes[0].role} ·{' '}
                  <time dateTime={notes[0].at}>{formatNoteTime(notes[0].at)}</time> · Latest
                </span>
                <p
                  className="summary-note text-[13px] leading-[1.45] text-text-secondary whitespace-pre-wrap break-words line-clamp-4"
                  dangerouslySetInnerHTML={{ __html: sanitiseNoteHtml(notes[0].html) }}
                />
              </div>
            </div>
          ) : (
            // Scrolls only once the box reaches its 80vh cap
            <div className="relative flex-1 min-h-0 flex flex-col">
              <ol
                id={timelineId}
                ref={timelineRef}
                onScroll={checkMore}
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain pl-5 pr-3 mr-1 pb-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-bg-surface-1 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb]:rounded-full"
              >
                {notes.map((n, i) => (
                  <li key={n.id} className="relative flex gap-3 pb-2.5 last:pb-0">
                    {/* Thin line down to the next note */}
                    {i < notes.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="absolute left-[15px] top-9 bottom-0 w-px bg-border-default"
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className="w-8 h-8 shrink-0 rounded-full bg-[var(--app-accent-soft)] text-[var(--app-accent)] text-[11px] font-semibold flex items-center justify-center"
                    >
                      {initialsOf(n.author)}
                    </span>
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5 pt-1">
                      <span className="text-xs text-text-tertiary">
                        <span className="font-medium text-text-primary">{n.author}</span> · {n.role}{' '}
                        · <time dateTime={n.at}>{formatNoteTime(n.at)}</time>
                      </span>
                      <p
                        className="summary-note text-[13px] leading-[1.45] text-text-secondary whitespace-pre-wrap break-words"
                        dangerouslySetInnerHTML={{ __html: sanitiseNoteHtml(n.html) }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
              {/* Fades the last visible note while there is more below */}
              {more && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 right-3 bottom-0 h-6 bg-linear-to-t from-bg-modal to-transparent"
                />
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
