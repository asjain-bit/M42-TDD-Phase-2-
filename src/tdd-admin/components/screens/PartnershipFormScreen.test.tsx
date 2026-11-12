import React, { useState } from 'react'
import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PartnershipFormScreen } from './PartnershipFormScreen'
import {
  createDraft,
  describeChanges,
  seedFormVersions,
  validateQuestion,
  blankQuestion,
  type FormVersion,
} from './partnershipForm.data'

const Harness: React.FC = () => {
  const [versions, setVersions] = useState<FormVersion[]>(seedFormVersions)
  return <PartnershipFormScreen versions={versions} onVersionsChange={setVersions} />
}

const startDraft = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'New draft' }))
  await user.click(screen.getByRole('button', { name: 'Create draft' }))
}

describe('partnership form data', () => {
  it('a draft copied from the live version has no changes', () => {
    const versions = seedFormVersions()
    const draft = createDraft(versions, 'live', undefined, '')
    expect(draft.number).toBe(3)
    expect(describeChanges(versions[0], draft)).toEqual([])
  })

  it('describes added, removed, edited and reordered questions', () => {
    const versions = seedFormVersions()
    const draft = createDraft(versions, 'live', undefined, '')
    draft.questions = [draft.questions[1], draft.questions[0], ...draft.questions.slice(2, 8)]
    draft.questions[2] = { ...draft.questions[2], required: false }
    draft.questions.push({ ...blankQuestion(), label: 'Where is data stored?' })
    const changes = describeChanges(versions[0], draft)
    expect(changes).toContain('Added "Where is data stored?"')
    expect(changes.some((c) => c.startsWith('Removed'))).toBe(true)
    expect(changes.some((c) => c.startsWith('Edited'))).toBe(true)
    expect(changes).toContain('Changed the order of the questions')
  })

  it('needs a question, and two options for a choice question', () => {
    expect(validateQuestion(blankQuestion()).label).toBeTruthy()
    const choice = { ...blankQuestion(), label: 'Pick', type: 'dropdown' as const, options: ['A'] }
    expect(validateQuestion(choice).options).toBeTruthy()
    expect(validateQuestion({ ...choice, options: ['A', 'B'] })).toEqual({})
  })
})

describe('PartnershipFormScreen', () => {
  it('lists the live and archived versions', () => {
    render(<Harness />)
    expect(screen.getByText('Version 2')).toBeInTheDocument()
    expect(screen.getByText('Version 1')).toBeInTheDocument()
    expect(screen.getByText('No open draft')).toBeInTheDocument()
  })

  it('filters versions by status', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: /Archived/ }))
    expect(screen.queryByText('Version 2')).not.toBeInTheDocument()
    expect(screen.getByText('Version 1')).toBeInTheDocument()
  })

  it('opens a read-only live version with a way to start a draft', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Version 2' }))
    expect(screen.getByText(/cannot be edited/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add question' })).not.toBeInTheDocument()
    // New drafts start from the versions page, not from inside a version
    expect(screen.queryByRole('button', { name: /New draft from this version/ })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
  })

  it('creates a draft that cannot be published until something changes', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await startDraft(user)
    expect(screen.getByText('Version 3')).toBeInTheDocument()
    // The summary line is gone; Publish says whether anything changed
    expect(screen.queryByText(/unpublished change/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled()
  })

  it('adds a question and publishes the draft', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await startDraft(user)

    await user.click(screen.getByRole('button', { name: 'Add question' }))
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Add question' })
    )
    expect(screen.getByText('Enter the question vendors will see.')).toBeInTheDocument()

    await user.type(screen.getByLabelText(/^Question/), 'Where do you store patient data?')
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Add question' })
    )
    expect(screen.getByText('Where do you store patient data?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Publish' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Publish Version 3?')).toBeInTheDocument()
    expect(within(dialog).getByText(/keep Version 2/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Publish' }))

    expect(screen.getByText('Version 3 is now live.')).toBeInTheDocument()
    expect(screen.getByText('Version 3')).toBeInTheDocument()
    // Version 2 is archived once Version 3 is live
    const archivedRow = screen.getByText('Version 2').closest('tr') as HTMLElement
    expect(within(archivedRow).getByText('Archived')).toBeInTheDocument()
  })

  it('removes a question and can undo it', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await startDraft(user)
    await user.click(screen.getByRole('button', { name: 'Remove question 1' }))
    expect(screen.getByText('Question removed.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled()
  })

  it('lays the company fields out like the vendor form, with an asterisk on the required ones', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await startDraft(user)
    const section = screen.getByRole('region', { name: /Company information/ })
    // Labels only: there are no input previews
    expect(within(section).queryAllByRole('textbox')).toHaveLength(0)
    const labels = within(section)
      .getAllByTestId('company-label')
      .map((el) => el.textContent?.replace(/\s*\*$/, '').trim())
    expect(labels).toEqual([
      'Vendor ID (if a request was raised before)',
      'Vendor Name',
      'Job Title',
      'Company Name',
      'Phone Number',
      'Email Address',
      'Year Company Was Founded',
      'Website URL',
      'Country',
    ])
    // Required fields show a red asterisk; Phone Number and Vendor ID do not
    expect(within(section).getAllByLabelText('required')).toHaveLength(7)
    // No edit icon on each field: a single Edit button sits at the top of the section
    expect(within(section).getAllByRole('button', { name: 'Edit' })).toHaveLength(1)
    // The explanation sits behind the info icon instead of upfront
    expect(screen.getByRole('tooltip')).toHaveTextContent(/fixed and cannot be removed/)
  })

  it('edits the whole company section in place, with no popup', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await startDraft(user)
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const name = screen.getByLabelText('Name of vendorName')
    await user.clear(name)
    await user.type(name, 'Contact name')
    const phone = screen.getByRole('checkbox', { name: 'Require Phone Number' })
    expect(phone).not.toBeChecked()
    await user.click(phone)
    expect(screen.getByRole('checkbox', { name: 'Require Phone Number' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Show Phone Number' })).toBeChecked()
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.getByText('Contact name')).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Require Phone Number' })).not.toBeInTheDocument()
  })

  it('locks the fields that are always shown and required', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await startDraft(user)
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    for (const name of ['Email Address', 'Company Name', 'Website URL', 'Country']) {
      expect(screen.getByRole('checkbox', { name: `Require ${name}` })).toBeDisabled()
      expect(screen.getByRole('checkbox', { name: `Require ${name}` })).toBeChecked()
      expect(screen.getByRole('checkbox', { name: `Show ${name}` })).toBeDisabled()
    }
    // The Vendor ID has no Required checkbox at all
    expect(screen.queryByRole('checkbox', { name: /Require Vendor ID/ })).not.toBeInTheDocument()
    expect(screen.getAllByRole('tooltip').some((t) => t.textContent === 'Always required')).toBe(
      true
    )
  })

  it('greys out a hidden field and turns its Required checkbox off', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await startDraft(user)
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.click(screen.getByRole('checkbox', { name: 'Show Job Title' }))
    expect(screen.getByRole('checkbox', { name: 'Require Job Title' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Require Job Title' })).not.toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.getByText('Hidden from vendors')).toBeInTheDocument()
    expect(screen.getByText('Job Title').closest('li')).toHaveTextContent('Hidden from vendors')
  })

  it('reorders questions by dragging the handle', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await startDraft(user)
    const cards = () => screen.getAllByTestId('question-card')
    const text = (el: HTMLElement) => (el.textContent ?? '').replace(/^\d+/, '')
    const first = text(cards()[0])
    const handle = screen.getByRole('button', { name: 'Reorder question 1' })
    const dataTransfer = { setData: () => {}, effectAllowed: '', dropEffect: '' }
    fireEvent.mouseDown(handle)
    fireEvent.dragStart(cards()[0], { dataTransfer })
    fireEvent.dragOver(cards()[2], { dataTransfer })
    fireEvent.drop(cards()[2], { dataTransfer })
    expect(text(cards()[0])).not.toBe(first)
    expect(text(cards()[2])).toBe(first)
    expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled()
  })

  it('moves a question with the arrow keys on its handle', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await startDraft(user)
    const strip = (el: HTMLElement) => (el.textContent ?? '').replace(/^\d+/, '')
    const first = strip(screen.getAllByTestId('question-card')[0])
    screen.getByRole('button', { name: 'Reorder question 1' }).focus()
    await user.keyboard('{ArrowDown}')
    expect(strip(screen.getAllByTestId('question-card')[1])).toBe(first)
  })

  it('has icon-only edit and remove buttons, with the remove icon in red', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await startDraft(user)
    expect(screen.getByRole('button', { name: 'Edit question 1' })).toHaveTextContent('')
    expect(screen.getByRole('button', { name: 'Remove question 1' }).className).toContain(
      'text-red-500'
    )
  })

  it('previews the form the way vendors see it', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Version 2' }))
    const previewButton = screen.getByRole('button', { name: 'Preview as vendor' })
    // Light primary text and icon, no fill and no stroke
    expect(previewButton.className).toContain('text-[#36c0c9]')
    expect(previewButton.className).toContain('border-0')
    await user.click(previewButton)
    const preview = screen.getByRole('dialog', { name: 'Vendor form preview' })
    expect(within(preview).getByText('Partnership request form')).toBeInTheDocument()
    expect(within(preview).getByText('Company Information')).toBeInTheDocument()
    expect(within(preview).getByRole('button', { name: /Submit request/ })).toBeDisabled()
    await user.click(within(preview).getByRole('button', { name: 'Close preview' }))
    expect(screen.queryByRole('dialog', { name: 'Vendor form preview' })).not.toBeInTheDocument()
  })

  it('hides a field from the preview when it is switched off', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await startDraft(user)
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.click(screen.getByRole('checkbox', { name: 'Show Phone Number' }))
    await user.click(screen.getByRole('button', { name: 'Done' }))
    await user.click(screen.getByRole('button', { name: 'Preview as vendor' }))
    const preview = screen.getByRole('dialog', { name: 'Vendor form preview' })
    expect(within(preview).queryByText('Phone Number')).not.toBeInTheDocument()
    expect(within(preview).getByText('Email Address')).toBeInTheDocument()
    expect(within(preview).getByText('Website URL')).toBeInTheDocument()
    expect(within(preview).getByText('Country')).toBeInTheDocument()
  })

  it('starts a draft from the live version, an existing version or a blank form', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'New draft' }))
    const dialog = screen.getByRole('dialog', { name: 'New draft' })
    expect(within(dialog).getAllByRole('radio')).toHaveLength(3)
    expect(within(dialog).getByRole('radio', { name: /Live version/ })).toBeChecked()
    // The version picker is its own field and only shows once Existing version is chosen
    expect(within(dialog).queryByLabelText('Select version')).not.toBeInTheDocument()
    await user.click(within(dialog).getByRole('radio', { name: /Existing version/ }))
    const picker = within(dialog).getByLabelText('Select version')
    expect(within(picker).getAllByRole('option')).toHaveLength(1)
    await user.click(within(dialog).getByRole('radio', { name: /Blank form/ }))
    expect(within(dialog).queryByLabelText('Select version')).not.toBeInTheDocument()
    // The reason is a plain label with no "optional", in a taller box
    expect(within(dialog).getByText(/Reason for the change/)).toBeInTheDocument()
    expect(within(dialog).queryByText(/optional/i)).not.toBeInTheDocument()
    expect(within(dialog).getByLabelText(/Reason for the change/).tagName).toBe('TEXTAREA')
  })

  it('has an Actions column, no intro line and no summary strip', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument()
    expect(screen.queryByText(/Edit a draft, then publish it/)).not.toBeInTheDocument()
    await startDraft(user)
    expect(screen.queryByText(/Vendors keep seeing Version 2 until you publish\.$/)).toBeNull()
    expect(screen.queryByText(/with AI check/)).not.toBeInTheDocument()
  })

  it('archives a version only after confirming, and unarchives it again', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    // The live version cannot be archived
    await user.click(screen.getByRole('button', { name: 'Actions for Version 2' }))
    expect(screen.getByRole('menuitem', { name: 'Archive version' })).toBeDisabled()
    await user.keyboard('{Escape}')
    await user.click(screen.getByText('Actions', { selector: 'th' }))

    await startDraft(user)
    await user.click(screen.getByRole('button', { name: /Back to versions/ }))
    await user.click(screen.getByRole('button', { name: 'Actions for Version 3' }))
    await user.click(screen.getByRole('menuitem', { name: 'Archive version' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Archive Version 3?')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    const row = () =>
      screen.getByText('Version 3', { selector: 'button' }).closest('tr') as HTMLElement
    expect(within(row()).getByText('Draft')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Actions for Version 3' }))
    await user.click(screen.getByRole('menuitem', { name: 'Archive version' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Archive' }))
    expect(within(row()).getByText('Archived')).toBeInTheDocument()

    // Unarchiving needs no confirmation
    await user.click(screen.getByRole('button', { name: 'Actions for Version 3' }))
    await user.click(screen.getByRole('menuitem', { name: 'Unarchive version' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(within(row()).getByText('Draft')).toBeInTheDocument()
  })

  it('opens the live public form from the list', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'View public form' }))
    expect(screen.getByText(/Previewing Version 2 \(Live\)/)).toBeInTheDocument()
  })

  it('continues the open draft when New draft is pressed again', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await startDraft(user)
    await user.click(screen.getByRole('button', { name: /Back to versions/ }))
    await user.click(screen.getByRole('button', { name: 'New draft' }))
    expect(screen.getByText(/already a draft/)).toBeInTheDocument()
    expect(screen.getByText('Version 3')).toBeInTheDocument()
  })

  it('locks the page scroll while a dialog is open, and asks for Required with a checkbox', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await startDraft(user)
    await user.click(screen.getByRole('button', { name: 'Add question' }))
    expect(document.body.style.overflow).toBe('hidden')
    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).queryByRole('switch', { name: 'Required question' })
    ).not.toBeInTheDocument()
    await user.click(within(dialog).getByRole('checkbox', { name: /Required question/ }))
    expect(within(dialog).getByRole('checkbox', { name: /Required question/ })).toBeChecked()
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(document.body.style.overflow).toBe('')
  })

  it('discards a draft after confirming', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await startDraft(user)
    await user.click(screen.getByRole('button', { name: 'Discard draft' }))
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Discard draft' })
    )
    expect(screen.getByText('Draft Version 3 discarded.')).toBeInTheDocument()
    expect(screen.getByText('No open draft')).toBeInTheDocument()
  })
})
