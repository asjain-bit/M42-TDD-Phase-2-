import { describe, it, expect } from 'vitest'
import { markNote, noteToText, sanitiseNoteHtml } from './summaryNote'

describe('sanitiseNoteHtml', () => {
  it('keeps text and highlights with a known tone', () => {
    const html =
      'A <mark data-tone="critical">b</mark> <mark data-tone="attention">c</mark> <mark data-tone="positive">d</mark>'
    expect(sanitiseNoteHtml(html)).toBe(html)
  })

  it('drops other tags, attributes and script content, and escapes text', () => {
    expect(
      sanitiseNoteHtml(
        '<b onclick="x()">Bold</b> <a href="javascript:x">link</a><script>alert(1)</script><style>p{}</style> 1 &lt; 2 & 3'
      )
    ).toBe('Bold link 1 &lt; 2 &amp; 3')
  })

  it('drops highlight attributes other than the tone, and unknown tones', () => {
    expect(
      sanitiseNoteHtml('<mark data-tone="positive" style="color:red" onclick="x">ok</mark>')
    ).toBe('<mark data-tone="positive">ok</mark>')
    expect(sanitiseNoteHtml('<mark data-tone="purple">plain</mark> <mark>bare</mark>')).toBe(
      'plain bare'
    )
  })

  it('lets the innermost highlight win and clears with the none tone', () => {
    expect(
      sanitiseNoteHtml('<mark data-tone="critical">a<mark data-tone="positive">b</mark>c</mark>')
    ).toBe(
      '<mark data-tone="critical">a</mark><mark data-tone="positive">b</mark><mark data-tone="critical">c</mark>'
    )
    expect(
      sanitiseNoteHtml('<mark data-tone="critical">a<mark data-tone="none">b</mark></mark>')
    ).toBe('<mark data-tone="critical">a</mark>b')
  })

  it('merges runs with the same tone', () => {
    expect(
      sanitiseNoteHtml('<mark data-tone="positive">a</mark><mark data-tone="positive">b</mark>')
    ).toBe('<mark data-tone="positive">ab</mark>')
  })

  it('turns editor line breaks into newlines and trims trailing blank lines', () => {
    expect(sanitiseNoteHtml('One<div>Two</div><div><br></div>')).toBe('One\nTwo')
    expect(sanitiseNoteHtml('A<br>B')).toBe('A\nB')
  })

  it('reads the plain text of a note', () => {
    expect(noteToText(` ${markNote('critical', 'x < y')} done `)).toBe('x < y done')
    expect(noteToText('<mark data-tone="none"></mark>')).toBe('')
  })
})
