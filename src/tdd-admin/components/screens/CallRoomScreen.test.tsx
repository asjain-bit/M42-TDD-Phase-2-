import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CallRoomScreen } from './CallRoomScreen'

const vendor = {
  id: 'v1',
  caseId: 'PR-126',
  name: 'Presight AI',
  sublabel: 'AI Platform',
  domain: 'AI',
  country: 'UAE',
  flag: '',
  email: 'zaidm42@gmail.com',
}

const openVendorForm = () =>
  render(
    <CallRoomScreen
      vendor={vendor}
      onBack={() => {}}
      initialRole="vendor"
      initialFlowStep="vendor_input"
    />
  )

describe('CallRoomScreen vendor join request', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('shows a loader after the join request and acknowledges the approval', () => {
    openVendorForm()
    fireEvent.change(screen.getByPlaceholderText('Enter vendor name...'), {
      target: { value: 'Other Vendor' },
    })
    fireEvent.change(screen.getByPlaceholderText('e.g. contact@vendor.com'), {
      target: { value: 'someone@other.com' },
    })
    fireEvent.click(screen.getByText(/I acknowledge I am speaking with an AI agent/))
    fireEvent.click(screen.getByRole('button', { name: 'Send join request' }))

    expect(screen.getByText(/Waiting for the admin to approve it/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Awaiting approval/ })).toBeDisabled()
    expect(screen.queryByText(/not on the invite list/)).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(4100)
    })

    expect(screen.getByText(/The admin has approved your request/)).toBeInTheDocument()
    expect(screen.queryByText(/not on the invite list/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Send OTP' }))
    expect(screen.getByText('Enter OTP Code')).toBeInTheDocument()
  })
})
