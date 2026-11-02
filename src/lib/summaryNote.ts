/**
 * Use case summary notes: the highlight tones and a sanitiser that keeps only text and
 * <mark data-tone="..."> highlights. Line breaks are kept as newline characters.
 */

export type NoteTone = 'critical' | 'attention' | 'positive'

export const NOTE_TONES: { tone: NoteTone; label: string }[] = [
  { tone: 'critical', label: 'Critical' },
  { tone: 'attention', label: 'Needs attention' },
  { tone: 'positive', label: 'Positive' },
]

/** Swatch colours for each tone, from the status tokens (editor toolbar and legend) */
export const NOTE_TONE_CLASSES: Record<NoteTone, string> = {
  critical: 'bg-status-error-bg border-status-error-border text-status-error-text',
  attention: 'bg-status-warning-bg border-status-warning-border text-status-warning-text',
  positive: 'bg-status-success-bg border-status-success-border text-status-success-text',
}

/** Marks the editor uses to clear a highlight; never kept in a saved note */
export const CLEAR_TONE = 'none'

const isNoteTone = (t: string): t is NoteTone =>
  t === 'critical' || t === 'attention' || t === 'positive'

export const escapeNoteText = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

const decodeEntities = (text: string) =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
    if (code[0] === '#') {
      const n =
        code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : Number(code.slice(1))
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : ''
    }
    return ENTITIES[code.toLowerCase()] ?? whole
  })

const BLOCK_TAG = /^(div|p|li|ul|ol|h[1-6]|blockquote|section|article)$/
const SKIP_TAG = /^(script|style|template|iframe|object|noscript|textarea|select)$/

type Segment = { text: string; tone: NoteTone | null }

/** Splits note HTML into text runs, each with the highlight that applies to it */
const toSegments = (html: string): Segment[] => {
  const segments: Segment[] = []
  // Each open mark pushes the tone it sets; the innermost one applies
  const stack: (NoteTone | typeof CLEAR_TONE | null)[] = []
  let skipping: string | null = null
  const tone = (): NoteTone | null => {
    const top = stack[stack.length - 1]
    return top && top !== CLEAR_TONE ? top : null
  }
  const push = (text: string) => {
    if (!text) return
    segments.push({ text, tone: tone() })
  }
  const lastChar = () => {
    for (let i = segments.length - 1; i >= 0; i--) {
      const t = segments[i].text
      if (t) return t[t.length - 1]
    }
    return ''
  }

  for (const part of html.split(/(<[^>]*>)/)) {
    if (!part) continue
    const tag = /^<\s*(\/?)\s*([a-z0-9]+)([^>]*)>$/i.exec(part)
    if (!tag) {
      if (skipping) continue
      // A stray "<" that is not a tag is plain text
      push(decodeEntities(part).replace(/\r\n?/g, '\n'))
      continue
    }
    const [, closing, rawName, attrs] = tag
    const name = rawName.toLowerCase()
    if (skipping) {
      if (closing && name === skipping) skipping = null
      continue
    }
    if (SKIP_TAG.test(name)) {
      if (!closing && !/\/\s*$/.test(attrs)) skipping = name
      continue
    }
    if (name === 'mark') {
      if (closing) {
        stack.pop()
      } else {
        const t = /\bdata-tone\s*=\s*["']?([a-z]+)/i.exec(attrs)?.[1]?.toLowerCase() ?? ''
        // A mark without a known tone keeps whatever highlight is already around it
        stack.push(
          isNoteTone(t) || t === CLEAR_TONE
            ? (t as NoteTone | typeof CLEAR_TONE)
            : (stack[stack.length - 1] ?? null)
        )
      }
      continue
    }
    if (name === 'br') {
      push('\n')
      continue
    }
    if (BLOCK_TAG.test(name) && !closing && segments.length > 0 && lastChar() !== '\n') {
      push('\n')
    }
  }
  return segments
}

/** Keeps only text and <mark data-tone> highlights, with adjacent runs of the same tone merged */
export const sanitiseNoteHtml = (html: string): string => {
  const merged: Segment[] = []
  for (const s of toSegments(html)) {
    const prev = merged[merged.length - 1]
    if (prev && prev.tone === s.tone) prev.text += s.text
    else merged.push({ ...s })
  }
  // Drop trailing blank lines left over from the editor
  while (merged.length > 0) {
    const last = merged[merged.length - 1]
    last.text = last.text.replace(/\s+$/, '')
    if (last.text) break
    merged.pop()
  }
  return merged
    .map(({ text, tone }) =>
      tone ? `<mark data-tone="${tone}">${escapeNoteText(text)}</mark>` : escapeNoteText(text)
    )
    .join('')
}

/** The note as plain text, without highlights */
export const noteToText = (html: string) =>
  toSegments(html)
    .map((s) => s.text)
    .join('')
    .trim()

/** Wraps text in a highlight, for building notes in code */
export const markNote = (tone: NoteTone, text: string) =>
  `<mark data-tone="${tone}">${escapeNoteText(text)}</mark>`
