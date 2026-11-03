import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { InterestEditModal } from './InterestEditModal'
import { INITIAL_SERVICE_LINE_INTERESTS } from '@/types/partnership.types'

describe('InterestEditModal', () => {
  it('saves the edited fields and the status', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    const interest = INITIAL_SERVICE_LINE_INTERESTS[0]
    render(<InterestEditModal interest={interest} onSave={onSave} onClose={vi.fn()} />)
    await user.clear(screen.getByLabelText(/Requirement title/))
    await user.type(screen.getByLabelText(/Requirement title/), 'New title')
    await user.selectOptions(screen.getByLabelText(/Status/), 'Approved')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'New title', status: 'Approved' })
    )
  })
})
