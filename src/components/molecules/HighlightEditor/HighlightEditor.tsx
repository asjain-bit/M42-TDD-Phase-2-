'use client'

/**
 * HighlightEditor — Molecule
 * Small rich-text editor for a note: labelled highlight pills (critical, needs attention,
 * positive, clear), editable area, Save and Cancel.
 * Used in: SummaryNote, CaseNotes
 */

import React, { useEffect, useRef, useState } from 'react'
import { Eraser, Highlighter } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import {
  CLEAR_TONE,
  NOTE_TONE_CLASSES,
  NOTE_TONES,
  noteToText,
  sanitiseNoteHtml,
  type NoteTone,
} from '@/lib/summaryNote'
import type { HighlightEditorProps } from './HighlightEditor.types'

/** Wraps the selected text in the editor with a highlight, or clears it */
const highlightSelection = (editor: HTMLElement, tone: NoteTone | typeof CLEAR_TONE) => {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return false
  const range = selection.getRangeAt(0)
  if (range.collapsed || !editor.contains(range.commonAncestorContainer)) return false
  const fragment = range.extractContents()
  // The new highlight replaces any highlight inside the selection
  fragment.querySelectorAll('mark').forEach((m) => m.replaceWith(...Array.from(m.childNodes)))
  const mark = document.createElement('mark')
  mark.dataset.tone = tone
  mark.appendChild(fragment)
  range.insertNode(mark)
  editor.innerHTML = sanitiseNoteHtml(editor.innerHTML)
  selection.removeAllRanges()
  return true
}

/** Labelled pill for the highlight toolbar: icon and text, in the tone's own colours */
const PILL =
  'h-8 px-2.5 rounded-lg border inline-flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap cursor-pointer transition'

export const HighlightEditor: React.FC<HighlightEditorProps> = ({
  initialHtml = '',
  onSave,
  onCancel,
  label = 'Edit case notes',
  className = '',
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const [draftEmpty, setDraftEmpty] = useState(noteToText(initialHtml) === '')

  // The editor is uncontrolled so the caret stays put while typing
  useEffect(() => {
    if (!editorRef.current) return
    editorRef.current.innerHTML = sanitiseNoteHtml(initialHtml)
    editorRef.current.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshDraft = () => setDraftEmpty(noteToText(editorRef.current?.innerHTML ?? '') === '')

  const applyTone = (tone: NoteTone | typeof CLEAR_TONE) => {
    if (editorRef.current && highlightSelection(editorRef.current, tone)) refreshDraft()
  }

  // Pasted content comes in as plain text, so no outside formatting gets in
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    const selection = window.getSelection()
    if (!text || !selection || selection.rangeCount === 0) return
    const range = selection.getRangeAt(0)
    range.deleteContents()
    const node = document.createTextNode(text)
    range.insertNode(node)
    range.setStartAfter(node)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
    refreshDraft()
  }

  const save = () => {
    const next = sanitiseNoteHtml(editorRef.current?.innerHTML ?? '')
    if (!noteToText(next)) return
    onSave(next)
  }

  // Keep toolbar clicks from taking the selection away from the editor
  const keepSelection = (e: React.MouseEvent) => e.preventDefault()

  return (
    <div className={`summary-note flex flex-col gap-2.5 ${className}`.trim()}>
      <div role="toolbar" aria-label="Highlight" className="flex items-center gap-2 flex-wrap">
        {NOTE_TONES.map(({ tone, label: toneLabel }) => (
          <button
            key={tone}
            type="button"
            onMouseDown={keepSelection}
            onClick={() => applyTone(tone)}
            aria-label={toneLabel}
            className={`${PILL} hover:opacity-80 ${NOTE_TONE_CLASSES[tone]}`}
          >
            <Highlighter className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
            {toneLabel}
          </button>
        ))}
        <button
          type="button"
          onMouseDown={keepSelection}
          onClick={() => applyTone(CLEAR_TONE)}
          aria-label="Clear highlight"
          className={`${PILL} bg-bg-default border-border-default text-text-secondary hover:bg-bg-hover`}
        >
          <Eraser className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
          Clear
        </button>
        <span className="text-[13px] leading-8 text-text-tertiary sm:whitespace-nowrap">
          Select text, then pick a colour.
        </span>
      </div>

      <div
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        contentEditable
        suppressContentEditableWarning
        onInput={refreshDraft}
        onPaste={handlePaste}
        className="min-h-24 max-h-64 overflow-y-auto rounded-lg border border-border-default bg-bg-input px-3 py-2.5 text-sm leading-relaxed text-text-primary whitespace-pre-wrap outline-none focus:border-border-focus"
      />

      <div className="flex items-center justify-end gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="md" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={save} disabled={draftEmpty}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
