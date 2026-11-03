import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { RowActionsMenu } from './RowActionsMenu'

describe('RowActionsMenu', () => {
  it('opens Edit and Delete, and runs the one picked', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(<RowActionsMenu label="Project A" onEdit={onEdit} onDelete={onDelete} />)
    const button = screen.getByRole('button', { name: 'Actions for Project A' })
    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }))
    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    await user.click(button)
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }))
    expect(onEdit).toHaveBeenCalledTimes(1)
  })

  it('closes with Esc', async () => {
    const user = userEvent.setup()
    render(<RowActionsMenu label="Project A" onEdit={vi.fn()} onDelete={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Actions for Project A' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
