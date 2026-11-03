'use client'

/**
 * SummaryNote — Molecule
 * One-line case notes bar with an inline highlight editor; can open the full CaseNotes panel.
 * Used in: PartnershipDetail
 */

import React, { useState } from 'react'
import { ChevronRight, NotebookText, Pencil } from 'lucide-react'
import { HighlightEditor } from '@/components/molecules/HighlightEditor'
import { noteToText, sanitiseNoteHtml } from '@/lib/summaryNote'
import type { SummaryNoteProps } from './SummaryNote.types'

export const SummaryNote: React.FC<SummaryNoteProps> = ({
  note,
  canEdit = false,
  onSave,
  onOpen,
  defaultExpanded = false,
  className = '',
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [editing, setEditing] = useState(false)
  const html = note ? sanitiseNoteHtml(note.html) : ''
  const hasNote = noteToText(html) !== ''
  // With onOpen the chevron opens the CaseNotes panel instead of expanding in place
  const showFull = expanded && !onOpen

  const startEditing = () => {
    if (!onOpen) setExpanded(true)
    setEditing(true)
  }

  return (
    <section
      aria-label="Case notes"
      className={`summary-note rounded-xl border border-border-default bg-bg-default px-4 py-3 flex flex-col gap-2.5 ${className}`.trim()}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={(e) => (onOpen ? onOpen(e.currentTarget) : setExpanded((v) => !v))}
          {...(onOpen ? { 'aria-haspopup': 'dialog' as const } : { 'aria-expanded': expanded })}
          disabled={editing}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-primary shrink-0 cursor-pointer disabled:cursor-default"
        >
          <ChevronRight
            className={`w-4 h-4 text-text-tertiary transition-transform ${showFull ? 'rotate-90' : ''}`}
            aria-hidden="true"
          />
          <NotebookText className="w-4 h-4 text-text-accent" aria-hidden="true" />
          Case notes
        </button>

        {!showFull && !editing && (
          <p
            className={`flex-1 min-w-0 truncate text-xs ${hasNote ? 'text-text-secondary' : 'text-text-tertiary'}`}
            {...(hasNote
              ? { dangerouslySetInnerHTML: { __html: html } }
              : { children: 'No notes yet.' })}
          />
        )}

        <div className="ml-auto flex items-center gap-3 shrink-0">
          {note && hasNote && (
            <span className="hidden sm:inline text-[11px] text-text-tertiary whitespace-nowrap">
              Updated by {note.updatedBy} · {note.updatedOn}
            </span>
          )}
          {canEdit && !editing && (
            <button
              type="button"
              onClick={startEditing}
              className="inline-flex items-center gap-1 text-xs font-medium text-text-accent hover:underline cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
              {hasNote ? 'Edit notes' : 'Add notes'}
            </button>
          )}
        </div>
      </div>

      {showFull && !editing && (
        <p
          className={`pl-6 text-sm leading-relaxed whitespace-pre-wrap ${hasNote ? 'text-text-secondary' : 'text-text-tertiary'}`}
          {...(hasNote
            ? { dangerouslySetInnerHTML: { __html: html } }
            : { children: 'No notes yet.' })}
        />
      )}

      {editing && (
        <HighlightEditor
          className="pl-6"
          initialHtml={html}
          onCancel={() => setEditing(false)}
          onSave={(next) => {
            onSave?.(next)
            setEditing(false)
          }}
        />
      )}
    </section>
  )
}
