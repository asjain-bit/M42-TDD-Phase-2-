import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { PartnerEmailFields } from './PartnerEmailFields'

const email = { to: 'jane@vendor.com', subject: 'Update', body: 'Hello' }

describe('PartnerEmailFields', () => {
  it('shows the recipient read-only and edits the subject and message', () => {
    const onChange = vi.fn()
    render(<PartnerEmailFields email={email} onChange={onChange} idPrefix="t" />)
    expect(screen.getByRole('group', { name: 'Email to the partner' })).toBeInTheDocument()
    expect(screen.getByText('jane@vendor.com')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('jane@vendor.com')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'New subject' } })
    expect(onChange).toHaveBeenLastCalledWith({ ...email, subject: 'New subject' })
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'New body' } })
    expect(onChange).toHaveBeenLastCalledWith({ ...email, body: 'New body' })
  })
})
