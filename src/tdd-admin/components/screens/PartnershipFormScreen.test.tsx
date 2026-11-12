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
  const [accepting, setAccepting] = useState(true)
  return (
    <PartnershipFormScreen
      versions={versions}
      onVersionsChange={setVersions}
      acceptingRequests={accepting}
      onAcceptingChange={setAccepting}
    />
  )
}

const startDraft = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Request form' }))
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
    // Version 1 of Partnership (archived), Procure and M&A
    expect(screen.getAllByText('Version 1')).toHaveLength(3)
  })

  it('shows the Live forms, Workflow stages, AI checks and Requests answered cards', () => {
    render(<Harness />)
    const card = (label: string) =>
      screen.getByText(label).parentElement?.parentElement as HTMLElement
    // Partnership, Procure and M&A are live; the Security Questionnaire has no form yet
    expect(within(card('Live forms')).getByText('3')).toBeInTheDocument()
    expect(within(card('Active Workflows')).getByText('4')).toBeInTheDocument()
    expect(card('Active Workflows')).toHaveTextContent('Number of workflows configured for use')
    expect(within(card('AI checks today')).getByText('5')).toBeInTheDocument()
    expect(card('AI checks today')).toHaveTextContent('One check per email ID')
    expect(card('AI checks today')).not.toHaveTextContent('300')
    expect(within(card('Requests answered')).getByText('2')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Request forms' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'View public form' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument()
  })

  it('filters the request forms by workflow stage', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.selectOptions(screen.getByLabelText('Workflow stage'), 'Security Questionnaire')
    expect(screen.getByText('No request forms match')).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Workflow stage'), 'Procure')
    expect(screen.getByText('Version 1')).toBeInTheDocument()
    expect(screen.queryByText('Version 2')).not.toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Workflow stage'), 'Partnership')
    expect(screen.getByText('Version 2')).toBeInTheDocument()
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

  it('shows the tabs Questions and Audit log, and two sections', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await startDraft(user)
    // A draft has no public form yet; Form preview, Form settings and Version history are gone
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['Questions', 'Audit log'])
    expect(
      screen.queryByRole('tab', { name: /Form preview|Form settings|Version history/ })
    ).toBeNull()
    expect(screen.getByRole('region', { name: 'Company information' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Key assessment areas' })).toBeInTheDocument()
    expect(
      screen.getByText('Select a question on the left to see and change its settings.')
    ).toBeInTheDocument()
  })

  it('lists the company fields like the vendor form, with no drag handle', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await startDraft(user)
    const section = screen.getByRole('region', { name: 'Company information' })
    const labels = within(section)
      .getAllByTestId('row-label')
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
    expect(within(section).getAllByLabelText('required')).toHaveLength(7)
    expect(within(section).queryByRole('button', { name: /Reorder/ })).not.toBeInTheDocument()
  })

  it('edits a company field in the side panel, called Edit question', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await startDraft(user)
    await user.click(screen.getByRole('button', { name: /^Phone Number/ }))
    const panel = screen.getByRole('complementary', { name: 'Edit question' })
    expect(within(panel).getByRole('heading', { name: 'Edit question' })).toBeInTheDocument()
    expect(within(panel).queryByRole('switch')).not.toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: 'Save changes' })).toBeDisabled()
    const required = within(panel).getByRole('checkbox', { name: 'Require Phone Number' })
    expect(required).not.toBeChecked()
    await user.click(required)
    const name = within(panel).getByLabelText(/^Question/)
    await user.clear(name)
    await user.type(name, 'Mobile number')
    await user.click(within(panel).getByRole('button', { name: 'Save changes' }))
    expect(screen.getByText('Mobile number')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled()
  })

  it('locks the fields that are always shown and required', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await startDraft(user)
    for (const name of ['Email Address', 'Company Name', 'Website URL', 'Country']) {
      await user.click(screen.getByRole('button', { name: new RegExp(`^${name}`) }))
      expect(screen.getByRole('checkbox', { name: `Require ${name}` })).toBeDisabled()
      expect(screen.getByRole('checkbox', { name: `Require ${name}` })).toBeChecked()
      expect(screen.getByRole('checkbox', { name: `Show ${name}` })).toBeDisabled()
    }
    // The Vendor ID has no Required checkbox at all
    await user.click(screen.getByRole('button', { name: /^Vendor ID/ }))
    expect(screen.queryByRole('checkbox', { name: /Require Vendor ID/ })).not.toBeInTheDocument()
    expect(screen.queryAllByRole('tooltip')).toHaveLength(0)
  })

  it('greys out a hidden field and turns its Required checkbox off', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await startDraft(user)
    await user.click(screen.getByRole('button', { name: /^Job Title/ }))
    await user.click(screen.getByRole('checkbox', { name: 'Show Job Title' }))
    expect(screen.getByRole('checkbox', { name: 'Require Job Title' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Require Job Title' })).not.toBeChecked()
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(screen.getByText('Job Title').closest('div.group')).toHaveTextContent(
      'Hidden from vendors'
    )
  })

  it('greys out a hidden assessment question too', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await startDraft(user)
    await user.click(screen.getByRole('button', { name: /stage of maturity and experience/ }))
    await user.click(screen.getByRole('checkbox', { name: 'Show to vendors' }))
    await user.click(screen.getByRole('button', { name: 'Save question' }))
    expect(screen.getAllByText('Hidden from vendors')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Preview as vendor' }))
    const preview = screen.getByRole('dialog', { name: 'Vendor form preview' })
    expect(within(preview).queryByText(/stage of maturity and experience/)).not.toBeInTheDocument()
  })

  it('shows the live version a Public form tab: accepting requests, the link and the form', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Version 2' }))
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([
      'Questions',
      'Public form',
      'Audit log',
    ])
    await user.click(screen.getByRole('tab', { name: 'Public form' }))
    expect(screen.getByRole('region', { name: 'Accepting requests' })).toHaveTextContent(
      /Takes effect at once/
    )
    expect(screen.getByRole('region', { name: 'Public link' })).toHaveTextContent(
      '/partnership-request'
    )
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'View public form' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Partnership request form' })).toBeInTheDocument()
    // Switching requests off shows vendors the closed message instead of the form
    await user.click(screen.getByRole('switch', { name: 'Accepting requests' }))
    expect(
      screen.getByRole('heading', { name: 'Partnership requests are closed' })
    ).toBeInTheDocument()
  })

  it('logs everything done to a draft in the Audit log tab', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await startDraft(user)
    await user.click(screen.getByRole('button', { name: /^Phone Number/ }))
    await user.click(screen.getByRole('checkbox', { name: 'Require Phone Number' }))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    await user.click(screen.getByRole('button', { name: 'Remove question 1' }))
    await user.click(screen.getByRole('button', { name: /proposal of collaboration/ }))
    await user.click(screen.getByRole('checkbox', { name: 'Required question' }))
    await user.click(screen.getByRole('button', { name: 'Save question' }))
    await user.click(screen.getByRole('tab', { name: 'Audit log' }))
    const log = screen.getByRole('region', { name: 'Audit Log' })
    expect(within(log).getByText('Draft created')).toBeInTheDocument()
    expect(within(log).getByText('Edited a company field')).toBeInTheDocument()
    expect(within(log).getByText(/Phone Number: now required/)).toBeInTheDocument()
    expect(within(log).getByText('Removed a question')).toBeInTheDocument()
    expect(within(log).getByText('Edited a question')).toBeInTheDocument()
    expect(within(log).getAllByText('TDD Admin').length).toBeGreaterThanOrEqual(4)
  })

  it('logs publishing in the audit log of the published version', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await startDraft(user)
    await user.click(screen.getByRole('button', { name: 'Remove question 1' }))
    await user.click(screen.getByRole('button', { name: 'Publish' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Publish' }))
    await user.click(screen.getByRole('button', { name: 'Version 3' }))
    await user.click(screen.getByRole('tab', { name: 'Audit log' }))
    expect(screen.getByText('Version 3 published')).toBeInTheDocument()
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

  it('has no edit buttons on rows, only a red remove icon on questions', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await startDraft(user)
    expect(screen.queryByRole('button', { name: /^Edit (question|Phone)/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove question 1' }).className).toContain(
      'text-red-500'
    )
    // Questions have no icon tile; the section chip sits beside the title
    const section = screen.getByRole('region', { name: 'Key assessment areas' })
    expect(within(section).getByText('9 questions')).toBeInTheDocument()
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
    await user.click(screen.getByRole('button', { name: /^Phone Number/ }))
    await user.click(screen.getByRole('checkbox', { name: 'Show Phone Number' }))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
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
    await user.click(screen.getByRole('button', { name: 'Request form' }))
    const dialog = screen.getByRole('dialog', { name: 'New request form' })
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

  it('has no archive actions: publishing archives the live version by itself', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Actions for Version 2' }))
    expect(screen.queryByRole('menuitem', { name: /archive/i })).not.toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'View version' })).toBeInTheDocument()
  })

  it('folds the company information away while an assessment question is edited', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await startDraft(user)
    expect(screen.getByRole('button', { name: /^Phone Number/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /stage of maturity and experience/ }))
    expect(screen.queryByRole('button', { name: /^Phone Number/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Expand Company information' })).toBeInTheDocument()
    // The answer type is a dropdown, not cards shown upfront
    expect(screen.getByRole('combobox', { name: 'Answer type' })).toHaveValue('long')
  })
  it('asks for the workflow first; the Security Questionnaire has no live version to start from', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Request form' }))
    const dialog = screen.getByRole('dialog', { name: 'New request form' })
    const workflow = within(dialog).getByLabelText('Workflow')
    expect(
      within(workflow)
        .getAllByRole('option')
        .map((o) => o.textContent)
    ).toEqual(['Partnership', 'Procure', 'M&A', 'Security Questionnaire'])
    expect(within(dialog).getByRole('radio', { name: /Live version/ })).toBeChecked()
    // Procure has its own live form, with the same fields as Partnership
    await user.selectOptions(workflow, 'Procure')
    expect(within(dialog).getByRole('radio', { name: /Live version/ })).toBeEnabled()
    await user.selectOptions(workflow, 'Security Questionnaire')
    expect(within(dialog).getByRole('radio', { name: /Live version/ })).toBeDisabled()
    expect(within(dialog).getByRole('radio', { name: /Existing version/ })).toBeDisabled()
    expect(within(dialog).getByRole('radio', { name: /Blank form/ })).toBeChecked()
  })

  it('shows Procure and M&A the same fields as Partnership', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    for (const workflow of ['Procure', 'M&A']) {
      const row = screen.getByText(workflow, { selector: 'span' }).closest('tr') as HTMLElement
      await user.click(within(row).getByRole('button', { name: 'Version 1' }))
      const company = screen.getByRole('region', { name: 'Company information' })
      expect(within(company).getByText('9 questions')).toBeInTheDocument()
      expect(screen.getByRole('region', { name: 'Key assessment areas' })).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /Back to versions/ }))
    }
  })

  it('restores an archived version even while a draft is open', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await startDraft(user)
    await user.click(screen.getByRole('button', { name: /Back to versions/ }))
    await user.click(screen.getByRole('button', { name: 'Request form' }))
    const dialog = screen.getByRole('dialog', { name: 'New request form' })
    await user.click(within(dialog).getByRole('radio', { name: /Existing version/ }))
    const picker = within(dialog).getByLabelText('Select version')
    expect(picker).toHaveDisplayValue(/Version 1/)
    await user.click(within(dialog).getByRole('button', { name: 'Create draft' }))
    // A new draft, Version 4, made from the archived Version 1 (not the open Version 3)
    expect(screen.getByText('Version 4')).toBeInTheDocument()
    expect(screen.getByText('Draft created.')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Audit log' }))
    expect(screen.getByText(/Started from Version 1/)).toBeInTheDocument()
  })

  it('builds a blank form from scratch: first a section, then its input fields', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Request form' }))
    const dialog = screen.getByRole('dialog', { name: 'New request form' })
    await user.selectOptions(within(dialog).getByLabelText('Workflow'), 'Security Questionnaire')
    await user.click(within(dialog).getByRole('button', { name: 'Create draft' }))

    // Nothing is filled in for them: no company fields and no assessment section
    expect(screen.getByText('Security Questionnaire', { selector: 'span' })).toBeInTheDocument()
    expect(screen.queryByRole('complementary', { name: 'Edit question' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Company information' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Key assessment areas' })).not.toBeInTheDocument()
    expect(screen.getByText('Start by creating a section')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Create section' }))
    await user.type(screen.getByLabelText(/Section name/), 'Company information')
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Create section' })
    )
    const section = screen.getByRole('region', { name: 'Company information' })
    expect(within(section).getByText('0 questions')).toBeInTheDocument()

    await user.click(within(section).getByRole('button', { name: 'Add question' }))
    await user.type(screen.getByLabelText(/^Question/), 'Vendor name')
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Add question' })
    )
    expect(
      within(screen.getByRole('region', { name: 'Company information' })).getByText('1 question')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled()

    // The preview shows the section and its field, and the audit log has it all
    await user.click(screen.getByRole('button', { name: 'Preview as vendor' }))
    const preview = screen.getByRole('dialog', { name: 'Vendor form preview' })
    expect(
      within(preview).getByRole('heading', { name: 'Company information' })
    ).toBeInTheDocument()
    expect(within(preview).getByText('Vendor name')).toBeInTheDocument()
    await user.click(within(preview).getByRole('button', { name: 'Close preview' }))
    await user.click(screen.getByRole('tab', { name: 'Audit log' }))
    const log = screen.getByRole('region', { name: 'Audit Log' })
    expect(within(log).getByText('Created a section')).toBeInTheDocument()
    expect(within(log).getByText('Added a question')).toBeInTheDocument()

    // Publishing makes it the live Procure form, and the Partnership form stays live
    await user.click(screen.getByRole('button', { name: 'Publish' }))
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Publish' }))
    expect(screen.getByText('Version 1 is now live.')).toBeInTheDocument()
    expect(screen.getByText('Live forms').parentElement?.parentElement).toHaveTextContent('4')
  })
  it('gives each workflow its own chip colour', () => {
    render(<Harness />)
    const colour = (workflow: string) =>
      screen.getAllByText(workflow, { selector: 'span' })[0].className.match(/bg-\[#\w+\]/)?.[0]
    const colours = ['Partnership', 'Procure', 'M&A'].map(colour)
    expect(new Set(colours).size).toBe(3)
  })

  it('puts the live, archived and editing notes in the subheading, in one card for the public form', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Version 2' }))
    expect(
      screen.getByText(
        /Published 6 Nov 2026\. This is the form vendors see now\. It cannot be edited\./
      )
    ).toBeInTheDocument()
    expect(screen.queryByText(/Use New draft on the versions page/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Public form' }))
    const accepting = screen.getByRole('region', { name: 'Accepting requests' })
    const link = screen.getByRole('region', { name: 'Public link' })
    expect(accepting.parentElement).toBe(link.parentElement)
    expect(link).not.toHaveTextContent('Built from the deployment URL')
    expect(within(link).getByRole('button', { name: 'Copy link' })).toBeInTheDocument()
    expect(within(link).getByRole('button', { name: 'View public form' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Back to versions/ }))
    const archivedRow = screen
      .getAllByText('Version 1', { selector: 'button' })[0]
      .closest('tr') as HTMLElement
    await user.click(within(archivedRow).getByRole('button', { name: 'Version 1' }))
    expect(screen.getByText(/now archived\. It cannot be edited\./)).toBeInTheDocument()
  })
})
