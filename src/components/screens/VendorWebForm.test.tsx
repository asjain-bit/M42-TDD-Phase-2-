import React from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { VendorWebForm } from './VendorWebForm'
import { SAMPLE_VENDOR_FORM } from '@/types/vendorForm'

const fill = (label: RegExp | string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

/** Fills the form with deliberately thin answers, without clicking (which would prefill) */
const fillThin = async (user: ReturnType<typeof userEvent.setup>) => {
  fill(/^Vendor Name/, 'Dr. Omar Rahman')
  fill(/^Job Title/, 'CEO')
  fill(/^Company Name \*/, 'PulseAI Health')
  fill(/^Email Address/, 'omar@pulseai.health')
  fill(/^Year Company/, '2021')
  fill(
    /stage of maturity and experience/i,
    'We are a young company with some experience in healthcare AI.'
  )
  fill(/proposal of collaboration/i, 'Deploy our triage model in M42 emergency departments.')
  fill(/current maturity level of your solution/i, 'Pilot stage.')
  fill(/relevant approvals/i, 'In progress')
  fill(/novel or differentiated/i, 'Our model is better than others.')
  fill(/specific resources, input/i, 'Support from M42.')
  await user.click(screen.getByLabelText(/Which Focus Area/))
  await user.click(screen.getByRole('button', { name: 'AI & Diagnostics' }))
}

const runChecking = (steps = 5) => {
  for (let i = 0; i < steps; i++) {
    act(() => {
      vi.advanceTimersByTime(700)
    })
  }
}

describe('VendorWebForm', () => {
  afterEach(() => vi.useRealTimers())

  it('shows every field of the vendor submission form in a wide layout', () => {
    render(<VendorWebForm onSubmitCase={vi.fn()} onSignOut={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Partnership request form' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveClass('max-w-[1400px]')
    ;[
      /^Vendor Name/,
      /^Job Title/,
      /^Company Name \*/,
      /^Phone Number/,
      /^Email Address/,
      /^Year Company/,
    ].forEach((label) => expect(screen.getByLabelText(label)).toBeInTheDocument())
    ;[
      /stage of maturity and experience/i,
      /proposal of collaboration/i,
      /Which Focus Area does your solution address/i,
      /current maturity level of your solution/i,
      /relevant approvals/i,
      /novel or differentiated/i,
      /developed entirely by your team/i,
      /specific resources, input/i,
      /patient populations, clinical areas/i,
    ].forEach((q) => expect(screen.getAllByText(q).length).toBeGreaterThan(0))
    expect(screen.getByRole('group', { name: 'Patient populations' })).toBeInTheDocument()
  })

  it('uses standard corners and a subtle grey focus state on inputs', () => {
    render(<VendorWebForm onSubmitCase={vi.fn()} />)
    const input = screen.getByLabelText(/^Vendor Name/)
    expect(input.className).toContain('rounded-lg')
    expect(input.className).not.toContain('rounded-xl')
    expect(input.className).toContain('focus:border-[#a3b1c2]')
    expect(input.className).toContain('hover:border-[#bcc7d3]')
    expect(input.className).not.toContain('#36c0c9')
    expect(screen.getByLabelText(/stage of maturity and experience/i).className).toContain(
      'rounded-lg'
    )
  })

  it('fills the whole form with typical vendor data when any field is first clicked', async () => {
    const user = userEvent.setup()
    render(<VendorWebForm onSubmitCase={vi.fn()} />)
    expect(screen.getByLabelText(/^Company Name \*/)).toHaveValue('')
    await user.click(screen.getByLabelText(/^Phone Number/))
    expect(screen.getByLabelText(/^Vendor Name/)).toHaveValue(SAMPLE_VENDOR_FORM.name)
    expect(screen.getByLabelText(/^Company Name \*/)).toHaveValue(SAMPLE_VENDOR_FORM.company)
    expect(screen.getByLabelText(/stage of maturity and experience/i)).toHaveValue(
      SAMPLE_VENDOR_FORM.stageAndExperience
    )
    expect(screen.getByLabelText(/Which Focus Area/)).toHaveTextContent('AI & Diagnostics')
    expect(screen.getByRole('checkbox', { name: 'Adult patients' })).toBeChecked()

    // Edits stick: clicking again does not refill
    await user.clear(screen.getByLabelText(/^Company Name \*/))
    await user.click(screen.getByLabelText(/^Job Title/))
    expect(screen.getByLabelText(/^Company Name \*/)).toHaveValue('')
  })

  it('keeps Submit disabled until every required field is filled', async () => {
    const user = userEvent.setup()
    const onSubmitCase = vi.fn()
    render(<VendorWebForm onSubmitCase={onSubmitCase} />)
    expect(screen.getByRole('button', { name: /Submit request/i })).toBeDisabled()
    await fillThin(user)
    expect(screen.getByRole('button', { name: /Submit request/i })).toBeEnabled()
  })

  it('selects several focus areas from the dropdown', async () => {
    const user = userEvent.setup()
    render(<VendorWebForm onSubmitCase={vi.fn()} />)
    const trigger = screen.getByLabelText(/Which Focus Area/)
    expect(trigger).toHaveTextContent('Select focus areas')
    await user.click(trigger) // the first click also prefills the sample
    const list = screen.getByRole('listbox', { name: 'Focus areas' })
    await user.click(within(list).getByRole('button', { name: 'Medical Imaging' }))
    expect(trigger).toHaveTextContent('Medical Imaging')
    await user.click(within(list).getByRole('button', { name: 'Medical Imaging' }))
    expect(trigger).not.toHaveTextContent('Medical Imaging')
  })

  it('shows a loader while the AI check runs, then the suggestions', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<VendorWebForm onSubmitCase={vi.fn()} />)
    await fillThin(user)

    await user.click(screen.getByRole('button', { name: /Run AI check/i }))
    const loader = screen.getByRole('status')
    expect(within(loader).getByText('Running AI check')).toBeInTheDocument()
    expect(within(loader).getByText('Reading your answers')).toBeInTheDocument()
    expect(screen.queryAllByRole('note')).toHaveLength(0)

    runChecking(2)
    const rows = within(loader).getAllByRole('listitem')
    expect(rows[0]).toHaveAttribute('data-state', 'done')
    expect(rows[1]).toHaveAttribute('data-state', 'done')
    expect(rows[2]).toHaveAttribute('data-state', 'active')

    runChecking(4)
    expect(screen.queryByText('Running AI check')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('AI check found 7 suggestions')
    const notes = screen.getAllByRole('note')
    expect(notes.length).toBe(7)
    // Once per session: the button stays disabled afterwards
    expect(screen.getByRole('button', { name: /Run AI check/i })).toBeDisabled()

    // Suggestions cannot be ignored
    expect(within(notes[0]).queryByRole('button')).not.toBeInTheDocument()
  })

  it('reports when the AI check finds nothing to improve', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<VendorWebForm onSubmitCase={vi.fn()} />)
    await fillThin(user)
    fill(
      /stage of maturity and experience/i,
      'Founded in 2018, we launched our platform in 2022 and expanded to the UAE in 2023 through a partnership with two hospital groups serving over 30 clinicians.'
    )
    fill(
      /proposal of collaboration/i,
      'We propose to deploy our diagnostic platform across three M42 hospitals over the next twelve months, starting with radiology and then expanding to oncology.'
    )
    fill(
      /current maturity level of your solution/i,
      'The platform is in pilot with three hospitals and holds CE Mark and FDA clearance, with a DoH Abu Dhabi submission under way.'
    )
    fill(/relevant approvals/i, 'CE, FDA')
    fill(
      /novel or differentiated/i,
      'Our model reaches 96% sensitivity in a peer-reviewed study of 20,000 scans and holds two granted patents on its architecture and training method.'
    )
    fill(
      /specific resources, input/i,
      'We would like access to de-identified imaging data, two pilot sites and integration support with the EHR.'
    )
    await user.click(screen.getByRole('checkbox', { name: 'Adult patients' }))

    await user.click(screen.getByRole('button', { name: /Run AI check/i }))
    runChecking(6)
    expect(screen.getByRole('status')).toHaveTextContent('AI check found nothing to improve')
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
  })

  it('asks for confirmation in the shared popup, captures the response and gives a case ID', async () => {
    const user = userEvent.setup()
    const onSubmitCase = vi.fn().mockReturnValue({ caseId: 'PR-126', vendorId: 'VND-013' })
    render(<VendorWebForm onSubmitCase={onSubmitCase} />)
    await user.click(screen.getByLabelText(/^Vendor Name/)) // prefill

    await user.click(screen.getByRole('button', { name: /Submit request/i }))
    const dialog = screen.getByRole('dialog', { name: 'Submit your request?' })
    expect(dialog).toHaveTextContent('You will not be able to edit them after submitting')
    expect(onSubmitCase).not.toHaveBeenCalled()

    // Going back keeps the answers
    await user.click(within(dialog).getByRole('button', { name: 'Review again' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/^Company Name \*/)).toHaveValue(SAMPLE_VENDOR_FORM.company)

    await user.click(screen.getByRole('button', { name: /Submit request/i }))
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Submit request' })
    )
    expect(onSubmitCase).toHaveBeenCalledWith(
      expect.objectContaining({
        company: SAMPLE_VENDOR_FORM.company,
        email: SAMPLE_VENDOR_FORM.email,
        focusAreas: SAMPLE_VENDOR_FORM.focusAreas,
      })
    )
    expect(screen.getByRole('heading', { name: 'Request submitted' })).toBeInTheDocument()
    expect(screen.getByText('PR-126')).toBeInTheDocument()
    expect(screen.getByText('Your case ID')).toBeInTheDocument()
    expect(screen.getByText('VND-013')).toBeInTheDocument()
    expect(screen.getByText('Your Vendor ID')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Submit another request/i }))
    expect(screen.getByRole('heading', { name: 'Partnership request form' })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Company Name \*/)).toHaveValue('')
  })

  it('mentions open AI suggestions in the confirmation and closes it with the X', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<VendorWebForm onSubmitCase={vi.fn()} />)
    await user.click(screen.getByLabelText(/^Vendor Name/)) // prefill with two thin answers
    await user.click(screen.getByRole('button', { name: /Run AI check/i }))
    runChecking(6)
    expect(screen.getByRole('status')).toHaveTextContent('AI check found 2 suggestions')
    await user.click(screen.getByRole('button', { name: /Submit request/i }))
    expect(screen.getByRole('dialog')).toHaveTextContent('2 AI suggestions are still open')
    await user.click(screen.getByRole('button', { name: 'Close dialog' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows a red, text-only Sign out only after the request is submitted', async () => {
    const user = userEvent.setup()
    const onSignOut = vi.fn()
    render(
      <VendorWebForm
        onSubmitCase={vi.fn().mockReturnValue({ caseId: 'PR-126', vendorId: 'VND-013' })}
        onSignOut={onSignOut}
      />
    )
    // Not while the vendor is filling the form in
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument()

    await user.click(screen.getByLabelText(/^Vendor Name/)) // prefill
    await user.click(screen.getByRole('button', { name: /Submit request/i }))
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Submit request' })
    )
    const signOut = screen.getByRole('button', { name: 'Sign out' })
    expect(signOut).toHaveClass('text-red-600')
    expect(signOut).toHaveAccessibleDescription(/Prototype only/)
    await user.click(signOut)
    expect(onSignOut).toHaveBeenCalled()
  })

  it('stacks vendor name, job title and company name in their own rows with placeholders', () => {
    render(<VendorWebForm onSubmitCase={vi.fn()} />)
    const fields = ['Vendor Name', 'Job Title', 'Company Name'].map((l) =>
      screen.getByLabelText(new RegExp(`^${l}`))
    )
    expect(fields.map((f) => f.getAttribute('placeholder'))).toEqual([
      'Enter your full name',
      'e.g. Chief Executive Officer',
      'Enter your company name',
    ])
    fields.forEach((f) => expect(f.closest('.grid')).toBeNull())
    expect(screen.queryByLabelText(/^Name \*/)).not.toBeInTheDocument()
  })

  it('keeps the actions in a footer outside the scrolling form', () => {
    render(<VendorWebForm onSubmitCase={vi.fn()} />)
    const footer = screen.getByRole('contentinfo')
    expect(within(footer).getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(within(footer).getByRole('button', { name: /Submit request/ })).toBeInTheDocument()
    expect(screen.getByRole('main').parentElement?.className).toContain('overflow-y-auto')
    expect(footer.contains(screen.getByRole('main'))).toBe(false)
  })

  it('keeps Run AI check disabled until the required fields are filled, and explains it in a tooltip', async () => {
    const user = userEvent.setup()
    render(<VendorWebForm onSubmitCase={vi.fn()} />)
    const run = screen.getByRole('button', { name: /Run AI check/i })
    expect(run).toBeDisabled()
    expect(screen.getByRole('tooltip')).toHaveTextContent('once per session')
    await fillThin(user)
    expect(run).toBeEnabled()
  })

  it('asks before cancelling and then exits', async () => {
    const user = userEvent.setup()
    const onSignOut = vi.fn()
    render(<VendorWebForm onSubmitCase={vi.fn()} onSignOut={onSignOut} />)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    const dialog = screen.getByRole('dialog', { name: 'Cancel this request?' })
    await user.click(within(dialog).getByRole('button', { name: 'Keep editing' }))
    expect(onSignOut).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    const confirm = within(screen.getByRole('dialog', { name: 'Cancel this request?' })).getByRole(
      'button',
      { name: 'Yes, cancel' }
    )
    // A destructive choice is red, not the primary colour
    expect(confirm.className).toContain('bg-red-600')
    await user.click(confirm)
    expect(onSignOut).toHaveBeenCalled()
  })
})
