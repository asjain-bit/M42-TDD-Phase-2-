import React from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { HighlightEditor } from './HighlightEditor'

const selectText = (editor: HTMLElement, text: string) => {
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode()
  while (node && !node.textContent?.includes(text)) node = walker.nextNode()
  const start = node!.textContent!.indexOf(text)
  const range = document.createRange()
  range.setStart(node!, start)
  range.setEnd(node!, start + text.length)
  window.getSelection()!.removeAllRanges()
  window.getSelection()!.addRange(range)
}

describe('HighlightEditor', () => {
  it('starts from the note, highlights a selection and saves sanitised HTML', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<HighlightEditor initialHtml="Alpha beta" onSave={onSave} onCancel={vi.fn()} />)
    const editor = screen.getByRole('textbox', { name: 'Edit case notes' })
    expect(editor).toHaveFocus()
    selectText(editor, 'beta')
    await user.click(screen.getByRole('button', { name: 'Highlight as needs attention' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith('Alpha <mark data-tone="attention">beta</mark>')
  })

  it('shows the legend, cancels, and cannot save an empty note', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<HighlightEditor label="Notes" onSave={vi.fn()} onCancel={onCancel} />)
    expect(
      within(screen.getByRole('list', { name: 'Highlight legend' })).getAllByRole('listitem')
    ).toHaveLength(3)
    const editor = screen.getByRole('textbox', { name: 'Notes' })
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    editor.innerHTML = 'Text'
    fireEvent.input(editor)
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalled()
  })
})
