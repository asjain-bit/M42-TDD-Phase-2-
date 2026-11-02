import React from 'react'
import { NOTE_TONE_CLASSES, NOTE_TONES } from '@/lib/summaryNote'
import type { HighlightLegendProps } from './HighlightLegend.types'

/**
 * HighlightLegend — Atom
 * Key to the note highlight colours: critical, needs attention and positive.
 * Used in: HighlightEditor, CaseNotes
 */
export const HighlightLegend: React.FC<HighlightLegendProps> = ({ className = '' }) => (
  <ul
    aria-label="Highlight legend"
    className={`flex items-center gap-3 flex-wrap ${className}`.trim()}
  >
    {NOTE_TONES.map(({ tone, label }) => (
      <li key={tone} className="inline-flex items-center gap-1.5 text-[11px] text-text-secondary">
        <span
          className={`w-3 h-3 rounded-sm border ${NOTE_TONE_CLASSES[tone]}`}
          aria-hidden="true"
        />
        {label}
      </li>
    ))}
  </ul>
)
