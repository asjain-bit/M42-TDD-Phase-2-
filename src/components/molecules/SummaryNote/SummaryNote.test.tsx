import React from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { SummaryNote } from './SummaryNote'

const note = {
  html: 'Pilot in two hospitals. <mark data-tone="critical">Hosting not confirmed.</mark>',
  updatedBy: 'Zaid Al Ali',
  updatedOn: '22 Oct 2026',
}

const region = () => screen.getByRole('region', { name: 'Case notes' })

/** Selects the given text inside the editor, as a user dragging over it would */
const selectText = (editor: HTMLElement, text: string) => {
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode()
  while (node && !node.textContent?.includes(text)) node = walker.nextNode()
  if (!node) throw new Error(`"${text}" not found`)
  const start = node.textContent!.indexOf(text)
  const range = document.createRange()
  range.setStart(node, start)
  range.setEnd(node, start + text.length)
  const selection = window.getSelection()!
  selection.removeAllRanges()
  selection.addRange(range)
}

describe('SummaryNote', () => {
  it('is collapsed to one line by default and expands with the chevron', async () => {
    const user = userEvent.setup()
    render(<SummaryNote note={note} />)
    const toggle = screen.getByRole('button', { name: 'Case notes' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(region().querySelectorAll('p')).toHaveLength(1)
    expect(region().querySelector('p')).toHaveClass('truncate')
    expect(screen.getByText('Updated by Zaid Al Ali · 22 Oct 2026')).toBeInTheDocument()

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const full = region().querySelector('p')!
    expect(full).not.toHaveClass('truncate')
    expect(full.querySelector('mark[data-tone="critical"]')).toHaveTextContent(
      'Hosting not confirmed.'
    )
  })

  it('is read-only without edit rights', () => {
    render(<SummaryNote note={note} defaultExpanded />)
    expect(screen.queryByRole('button', { name: /Edit notes/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('shows an empty state and offers to add a summary', () => {
    render(<SummaryNote canEdit />)
    expect(screen.getByText('No notes yet.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add notes' })).toBeInTheDocument()
  })

  it('edits with a highlight toolbar and legend, and saves sanitised HTML', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<SummaryNote note={note} canEdit onSave={onSave} />)
    await user.click(screen.getByRole('button', { name: 'Edit notes' }))

    const toolbar = screen.getByRole('toolbar', { name: 'Highlight' })
    ;[
      'Highlight as critical',
      'Highlight as needs attention',
      'Highlight as positive',
      'Clear highlight',
    ].forEach((name) => expect(within(toolbar).getByRole('button', { name })).toBeInTheDocument())
    const legend = screen.getByRole('list', { name: 'Highlight legend' })
    expect(
      within(legend)
        .getAllByRole('listitem')
        .map((li) => li.textContent)
    ).toEqual(['Critical', 'Needs attention', 'Positive'])

    const editor = screen.getByRole('textbox', { name: 'Edit case notes' })
    expect(editor.innerHTML).toBe(note.html)

    selectText(editor, 'two hospitals')
    await user.click(within(toolbar).getByRole('button', { name: 'Highlight as positive' }))
    expect(editor.querySelector('mark[data-tone="positive"]')).toHaveTextContent('two hospitals')

    selectText(editor, 'Hosting')
    await user.click(within(toolbar).getByRole('button', { name: 'Clear highlight' }))
    expect(editor.querySelector('mark[data-tone="critical"]')).toHaveTextContent('not confirmed.')

    // Anything else that gets into the editor is dropped on save
    editor.insertAdjacentHTML('beforeend', '<img src="x" onerror="alert(1)"><b>!</b>')
    fireEvent.input(editor)
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith(
      'Pilot in <mark data-tone="positive">two hospitals</mark>. Hosting<mark data-tone="critical"> not confirmed.</mark>!'
    )
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('cancels without saving, and cannot save an empty note', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<SummaryNote note={note} canEdit onSave={onSave} />)
    await user.click(screen.getByRole('button', { name: 'Edit notes' }))
    const editor = screen.getByRole('textbox')
    editor.innerHTML = ''
    fireEvent.input(editor)
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onSave).not.toHaveBeenCalled()
    expect(region().querySelector('mark')).toHaveTextContent('Hosting not confirmed.')
  })

  it('pastes as plain text', async () => {
    const user = userEvent.setup()
    render(<SummaryNote canEdit onSave={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Add notes' }))
    const editor = screen.getByRole('textbox')
    const range = document.createRange()
    range.selectNodeContents(editor)
    range.collapse(false)
    window.getSelection()!.removeAllRanges()
    window.getSelection()!.addRange(range)
    fireEvent.paste(editor, {
      clipboardData: { getData: (type: string) => (type === 'text/plain' ? '<b>Hi</b>' : '') },
    })
    expect(editor.innerHTML).toBe('&lt;b&gt;Hi&lt;/b&gt;')
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })
})
