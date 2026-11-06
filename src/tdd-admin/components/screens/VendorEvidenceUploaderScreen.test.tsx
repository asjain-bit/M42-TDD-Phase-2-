import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VendorEvidenceUploaderScreen } from './VendorEvidenceUploaderScreen'

const enter = (name: string, email: string) => {
  fireEvent.change(screen.getByLabelText(/Vendor Name/), { target: { value: name } })
  fireEvent.change(screen.getByLabelText(/Vendor Email ID/), { target: { value: email } })
  fireEvent.click(screen.getByRole('button', { name: 'Send OTP' }))
}

describe('VendorEvidenceUploaderScreen access gate', () => {
  it('blocks an email that is not on the recipient list', () => {
    render(<VendorEvidenceUploaderScreen onExit={() => {}} />)
    enter('Presight AI', 'other@vendor.com')
    expect(screen.getByRole('alert')).toHaveTextContent(/not added to the recipient list/)
    expect(screen.queryByText('Follow-up questions')).not.toBeInTheDocument()
  })

  it('opens the form after the test email and the OTP are verified', () => {
    render(<VendorEvidenceUploaderScreen onExit={() => {}} />)
    enter('Presight AI', 'zaidm42@gmail.com')
    expect(screen.getByText('Enter OTP Code')).toBeInTheDocument()
    ;[0, 1, 2, 3].forEach((i) =>
      fireEvent.change(screen.getByLabelText(`OTP digit ${i + 1}`), { target: { value: `${i + 1}` } })
    )
    fireEvent.click(screen.getByRole('button', { name: /Verify/ }))
    expect(screen.getByText('Follow-up questions')).toBeInTheDocument()
  })
})
