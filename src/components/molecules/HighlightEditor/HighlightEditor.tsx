'use client'

/**
 * HighlightEditor — Molecule
 * Small rich-text editor for a note: labelled highlight pills (critical, needs attention,
 * positive, clear, or the tones passed in), editable area, Save and an optional Cancel.
 * Used in: SummaryNote, CaseNotes (the notes log composer)
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
  tones = NOTE_TONES,
  placeholder,
  hint = 'Select text, then pick a colour.',
  saveLabel = 'Save',
  resetOnSave = false,
  compact = false,
  autoFocus = true,
  className = '',
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const [draftEmpty, setDraftEmpty] = useState(noteToText(initialHtml) === '')

  // The editor is uncontrolled so the caret stays put while typing
  useEffect(() => {
    if (!editorRef.current) return
    editorRef.current.innerHTML = sanitiseNoteHtml(initialHtml)
    if (autoFocus) editorRef.current.focus()
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
    if (resetOnSave && editorRef.current) {
      editorRef.current.innerHTML = ''
      setDraftEmpty(true)
    }
  }

  // Keep toolbar clicks from taking the selection away from the editor
  const keepSelection = (e: React.MouseEvent) => e.preventDefault()

  return (
    <div className={`summary-note flex flex-col gap-2.5 ${className}`.trim()}>
      <div role="toolbar" aria-label="Highlight" className="flex items-center gap-2 flex-wrap">
        {tones.map(({ tone, label: toneLabel }) => (
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
        {hint && (
          <span className="text-[13px] leading-8 text-text-tertiary sm:whitespace-nowrap">
            {hint}
          </span>
        )}
      </div>

      <div
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        aria-label={label}
        data-placeholder={placeholder}
        contentEditable
        suppressContentEditableWarning
        onInput={refreshDraft}
        onPaste={handlePaste}
        className={`${
          // 2 lines of text-sm leading-relaxed plus padding, growing to 4
          compact ? 'min-h-[4.125rem] max-h-[7rem]' : 'min-h-24 max-h-64'
        } overflow-y-auto rounded-lg border border-border-default bg-bg-input px-3 py-2.5 text-sm leading-relaxed text-text-primary whitespace-pre-wrap outline-none focus:border-border-focus empty:before:content-[attr(data-placeholder)] empty:before:text-text-tertiary empty:before:pointer-events-none`}
      />

      <div className="flex items-center justify-end gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="outline" size="md" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            variant="primary"
            size={compact ? 'sm' : 'md'}
            onClick={save}
            disabled={draftEmpty}
          >
            {saveLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
