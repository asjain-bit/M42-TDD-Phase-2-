import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { CaseNotes } from './CaseNotes'
import { INITIAL_PARTNERSHIP_REQUESTS } from '@/types/partnership.types'

const [, , genomicX, carePulse] = INITIAL_PARTNERSHIP_REQUESTS

const renderCard = (props: Partial<React.ComponentProps<typeof CaseNotes>> = {}) => {
  const onClose = vi.fn()
  const onAddNote = vi.fn()
  const { unmount } = render(
    <CaseNotes
      request={genomicX}
      status="Pending"
      onClose={onClose}
      onAddNote={onAddNote}
      {...props}
    />
  )
  return {
    onClose,
    onAddNote,
    unmountCard: unmount,
    card: screen.getByRole('dialog', { name: (props.request ?? genomicX).companyName }),
  }
}

describe('CaseNotes', () => {
  it('shows the header with the case code and status, and no expand or summary', () => {
    const { card } = renderCard()
    expect(card).toHaveAttribute('aria-modal', 'true')
    expect(within(card).getByText('Notes')).toBeInTheDocument()
    expect(within(card).getByText(genomicX.requestCode)).toBeInTheDocument()
    expect(within(card).getByText('Pending')).toBeInTheDocument()
    expect(within(card).queryByRole('button', { name: /Expand/ })).not.toBeInTheDocument()
    expect(within(card).queryByText(genomicX.headline!)).not.toBeInTheDocument()
    expect(within(card).queryByRole('term')).not.toBeInTheDocument()
  })

  it('previews the latest note, and Show all lists every note newest first', async () => {
    const user = userEvent.setup()
    const { card } = renderCard()
    const notes = genomicX.notes!
    expect(within(card).getByText(`All notes · ${notes.length}`)).toBeInTheDocument()
    // Collapsed: one line for the latest note
    expect(within(card).queryByRole('listitem')).not.toBeInTheDocument()
    expect(within(card).getByText(/^Latest ·/)).toHaveTextContent(notes[notes.length - 1].author)
    const toggle = within(card).getByRole('button', { name: /Show all/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)
    expect(within(card).getByRole('button', { name: /Hide/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    const items = within(card).getAllByRole('listitem')
    expect(items).toHaveLength(notes.length)
    expect(items[0]).toHaveTextContent(notes[notes.length - 1].author)
    expect(items[items.length - 1]).toHaveTextContent('Triage Agent · AI agent')
    expect(card.querySelector('mark[data-tone="critical"]')).toBeInTheDocument()
  })

  it('adds a note from the composer with Risk, Neutral and Positive, then clears it', async () => {
    const user = userEvent.setup()
    const { card, onAddNote } = renderCard()
    const toolbar = within(card).getByRole('toolbar', { name: 'Highlight' })
    expect(
      within(toolbar)
        .getAllByRole('button')
        .map((b) => b.textContent)
    ).toEqual(['Risk', 'Neutral', 'Positive', 'Clear'])
    const add = within(card).getByRole('button', { name: 'Add' })
    expect(add).toBeDisabled()
    const editor = within(card).getByRole('textbox', { name: 'Add a note' })
    expect(editor).toHaveAttribute(
      'data-placeholder',
      'Add a note… select text, then pick a colour.'
    )
    editor.innerHTML = 'New <mark data-tone="positive">note</mark><script>x()</script>'
    editor.dispatchEvent(new Event('input', { bubbles: true }))
    await user.click(add)
    expect(onAddNote).toHaveBeenCalledWith('New <mark data-tone="positive">note</mark>')
    expect(editor.innerHTML).toBe('')
    expect(add).toBeDisabled()
  })

  it('shows no composer when notes cannot be added, and an empty log', () => {
    const { card } = renderCard({
      request: { ...carePulse, notes: undefined },
      canAddNotes: false,
    })
    expect(within(card).queryByRole('textbox')).not.toBeInTheDocument()
    expect(within(card).getByText('All notes · 0')).toBeInTheDocument()
    expect(within(card).getByText('No notes yet.')).toBeInTheDocument()
  })

  it('closes with X, Esc and a click outside', async () => {
    const user = userEvent.setup()
    const x = renderCard()
    await user.click(within(x.card).getByRole('button', { name: 'Close notes' }))
    await waitFor(() => expect(x.onClose).toHaveBeenCalledTimes(1))
    x.unmountCard()

    const outside = renderCard()
    await user.click(document.body)
    await waitFor(() => expect(outside.onClose).toHaveBeenCalledTimes(1))
    outside.unmountCard()

    const esc = renderCard()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(esc.onClose).toHaveBeenCalledTimes(1))
  })

  it('caps the box at 75vh and the room on its side', () => {
    const { card } = renderCard()
    const maxHeight = parseFloat(card.style.maxHeight)
    expect(maxHeight).toBeGreaterThan(0)
    expect(maxHeight).toBeLessThanOrEqual(window.innerHeight * 0.75)
  })
})
