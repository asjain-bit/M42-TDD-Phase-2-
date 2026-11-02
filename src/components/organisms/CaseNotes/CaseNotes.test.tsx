import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { CaseNotes } from './CaseNotes'
import { buildNotesText, getCaseNotesData } from './caseNotes.data'
import { INITIAL_PARTNERSHIP_REQUESTS } from '@/types/partnership.types'

const [medTech, , genomicX, carePulse] = INITIAL_PARTNERSHIP_REQUESTS

const renderCard = (props: Partial<React.ComponentProps<typeof CaseNotes>> = {}) => {
  const onClose = vi.fn()
  const onSaveNote = vi.fn()
  render(
    <CaseNotes
      request={genomicX}
      status="Pending"
      showAssessment
      onClose={onClose}
      onSaveNote={onSaveNote}
      {...props}
    />
  )
  return {
    onClose,
    onSaveNote,
    card: screen.getByRole('dialog', { name: (props.request ?? genomicX).companyName }),
  }
}

const sectionTitles = (card: HTMLElement) =>
  within(card)
    .queryAllByRole('heading', { level: 3 })
    .map((h) => h.textContent)

describe('CaseNotes', () => {
  it('opens collapsed with the header, headline and four facts', () => {
    const { card } = renderCard()
    expect(card).toHaveAttribute('aria-modal', 'true')
    expect(within(card).getByText('Case notes')).toBeInTheDocument()
    expect(within(card).getByText('PR-122')).toBeInTheDocument()
    expect(within(card).getByText('Pending')).toBeInTheDocument()
    expect(within(card).getByText(genomicX.headline!)).toBeInTheDocument()
    const facts = within(card)
      .getAllByRole('term')
      .map((dt) => `${dt.textContent}: ${dt.nextElementSibling?.textContent}`)
    expect(facts).toEqual([
      'Stage: Discovery Call (5 of 6)',
      `Owner: ${genomicX.owner}`,
      `Focus area: ${genomicX.focusArea}`,
      `Maturity: ${genomicX.solutionMaturity}`,
    ])
    expect(sectionTitles(card)).toEqual([])
    expect(within(card).getByRole('button', { name: 'Expand notes' })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  })

  it('expands into every section, with the current stage marked', async () => {
    const user = userEvent.setup()
    const { card } = renderCard()
    await user.click(within(card).getByRole('button', { name: 'Expand notes' }))
    expect(within(card).getByRole('button', { name: 'Collapse notes' })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
    expect(card.className).toContain('h-[85vh]')
    expect(sectionTitles(card)).toEqual([
      'Solution description',
      'Proposal of collaboration',
      'Focus areas',
      'Solution maturity & approvals',
      'Stage progress',
      'Sponsors',
      'Assessment summary',
      'Key notes',
    ])
    // The same StageChip as the table, stretched to the section width
    const stage = within(card).getByRole('group', { name: 'Stage 5 of 6: Discovery Call' })
    expect(stage).toHaveClass('w-full')
    expect(within(stage).getByText('5/6')).toBeInTheDocument()
    expect(stage.querySelectorAll('[data-state]')).toHaveLength(6)
    expect(within(card).getByText('Parag Agarwal')).toBeInTheDocument()
    expect(within(card).getByText('Points to proceed')).toBeInTheDocument()
    expect(within(card).getByRole('list', { name: 'Highlight legend' })).toBeInTheDocument()
    expect(card.querySelector('mark[data-tone="critical"]')).toHaveTextContent(/UAE data hosting/)
    expect(within(card).getByText(/Last updated by/)).toHaveTextContent(
      'Last updated by Triage Agent on 01 Oct 2026'
    )
  })

  it('leaves out sections with no data, and the assessment when not allowed', async () => {
    const user = userEvent.setup()
    renderCard({
      request: { ...carePulse, sponsors: undefined, summaryNote: undefined },
      showAssessment: false,
      canEditNotes: false,
    })
    const card = screen.getByRole('dialog')
    await user.click(within(card).getByRole('button', { name: 'Expand notes' }))
    const titles = sectionTitles(card)
    expect(titles).not.toContain('Sponsors')
    expect(titles).not.toContain('Assessment summary')
    expect(titles).not.toContain('Key notes')
    expect(within(card).queryByText(/Last updated by/)).not.toBeInTheDocument()
    expect(
      within(card).getByRole('group', { name: 'Exited at stage 1 of 6: Initial Assessment Brief' })
    ).toBeInTheDocument()
    expect(within(card).queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
  })

  it('edits the key notes in place from the toolbar, and only those', async () => {
    const user = userEvent.setup()
    const { card, onSaveNote } = renderCard()
    await user.click(within(card).getByRole('button', { name: 'Edit' }))
    expect(within(card).getAllByRole('textbox')).toHaveLength(1)
    const editor = within(card).getByRole('textbox', { name: 'Edit key notes' })
    expect(within(card).getByRole('toolbar', { name: 'Highlight' })).toBeInTheDocument()
    editor.innerHTML = 'New <mark data-tone="positive">note</mark><script>x()</script>'
    await user.click(within(card).getByRole('button', { name: 'Save' }))
    expect(onSaveNote).toHaveBeenCalledWith('New <mark data-tone="positive">note</mark>')
    expect(within(card).queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('closes with X, Esc and a click outside; Esc leaves the editor first', async () => {
    const user = userEvent.setup()
    const { card, onClose } = renderCard()
    await user.click(within(card).getByRole('button', { name: 'Close notes' }))
    await user.click(screen.getByTestId('case-notes-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(2)

    await user.click(within(card).getByRole('button', { name: 'Edit' }))
    await user.keyboard('{Escape}')
    expect(within(card).queryByRole('textbox')).not.toBeInTheDocument()
    expect(onClose).toHaveBeenCalledTimes(2)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(3)
  })

  it('takes focus, keeps Tab inside, and gives focus back on close', async () => {
    const user = userEvent.setup()
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    const { unmount } = render(<CaseNotes request={medTech} status="Pending" onClose={vi.fn()} />)
    const card = screen.getByRole('dialog')
    expect(card).toHaveFocus()
    const buttons = within(card).getAllByRole('button')
    buttons[buttons.length - 1].focus()
    await user.tab()
    expect(buttons[0]).toHaveFocus()
    await user.tab({ shift: true })
    expect(buttons[buttons.length - 1]).toHaveFocus()
    unmount()
    expect(opener).toHaveFocus()
    opener.remove()
  })

  it('copies plain-text notes and shows a toast', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    const { card } = renderCard()
    await user.click(within(card).getByRole('button', { name: 'Copy notes' }))
    expect(writeText).toHaveBeenCalledWith(
      buildNotesText(getCaseNotesData(genomicX), 'Pending', true)
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Notes copied to the clipboard.')
  })

  it('says so when the clipboard is blocked', async () => {
    const user = userEvent.setup()
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('blocked'))
    const { card } = renderCard()
    await user.click(within(card).getByRole('button', { name: 'Copy notes' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Could not copy the notes.')
  })
})

describe('buildNotesText', () => {
  it('writes the card as clean plain text, without highlight markup', () => {
    const text = buildNotesText(getCaseNotesData(genomicX), 'Pending', true)
    expect(text).toMatch(/^CASE NOTES\nGenomicX MENA FZ-LLC · PR-122 · Pending\n/)
    expect(text).toContain('Stage: Discovery Call (5 of 6)')
    expect(text).toContain('Sponsors\nLead: Parag Agarwal\nCo-sponsors: Najla Al Mansoori')
    expect(text).toContain('Assessment summary\nPoints to proceed')
    expect(text).toContain('Key notes\nRare disease variant interpreter')
    expect(text).toContain('Last updated by Triage Agent on 01 Oct 2026')
    expect(text).not.toMatch(/<|&lt;|&amp;/)
  })

  it('leaves out the assessment when it is not shown', () => {
    expect(buildNotesText(getCaseNotesData(genomicX), 'Pending', false)).not.toContain(
      'Assessment summary'
    )
  })
})
