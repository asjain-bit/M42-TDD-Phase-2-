import React from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { UsersScreen } from './UsersScreen'
import { INITIAL_PLATFORM_USERS } from '@/types/platformUsers'

const setup = () => {
  const handlers = { onAdd: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn(), onSetStatus: vi.fn() }
  render(<UsersScreen users={INITIAL_PLATFORM_USERS} {...handlers} />)
  return { user: userEvent.setup(), ...handlers }
}

describe('UsersScreen', () => {
  it('lists users with one role each and their assigned requests', () => {
    setup()
    expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument()
    expect(screen.getByText('Assigned requests')).toBeInTheDocument()
    expect(screen.getByText('Nadia Al-Farsi')).toBeInTheDocument()
    expect(screen.getByText('12 requests')).toBeInTheDocument()
  })

  it('searches by name or email', async () => {
    const { user } = setup()
    await user.type(screen.getByPlaceholderText(/Search users/), 'tmansoor')
    expect(screen.getByText('Tariq Mansoor')).toBeInTheDocument()
    expect(screen.queryByText('Nadia Al-Farsi')).not.toBeInTheDocument()
  })

  it('filters by role and by status', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /Filter/ }))
    await user.selectOptions(screen.getByLabelText('Role'), 'TDD Admin')
    expect(screen.getByText('David Chen')).toBeInTheDocument()
    expect(screen.queryByText('Nadia Al-Farsi')).not.toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Role'), 'Strategy')
    await user.selectOptions(screen.getByLabelText('Status'), 'Inactive')
    expect(screen.getByText('Marcus Vance')).toBeInTheDocument()
    expect(screen.queryByText('Tariq Mansoor')).not.toBeInTheDocument()
  })

  it('adds a user with a name, email and one role', async () => {
    const { user, onAdd } = setup()
    await user.click(screen.getByRole('button', { name: /Add New User/ }))
    const dialog = screen.getByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Add User' }))
    expect(onAdd).not.toHaveBeenCalled()
    await user.type(within(dialog).getByLabelText(/Full Name/), 'Lina Haddad')
    await user.type(within(dialog).getByLabelText(/Email Address/), 'lhaddad@m42.ae')
    await user.selectOptions(within(dialog).getByLabelText(/Assigned Role/), 'Director')
    await user.click(within(dialog).getByRole('button', { name: 'Add User' }))
    expect(onAdd).toHaveBeenCalledWith({
      name: 'Lina Haddad',
      email: 'lhaddad@m42.ae',
      role: 'Director',
    })
  })

  it('edits and deletes from the row menu', async () => {
    const { user, onEdit, onDelete } = setup()
    await user.click(screen.getByRole('button', { name: 'Actions for Nadia Al-Farsi' }))
    await user.click(screen.getByRole('menuitem', { name: 'Edit user' }))
    const dialog = screen.getByRole('dialog')
    const name = within(dialog).getByLabelText(/Full Name/)
    await user.clear(name)
    await user.type(name, 'Nadia Farsi')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))
    expect(onEdit).toHaveBeenCalledWith('usr-01', {
      name: 'Nadia Farsi',
      email: 'nadia.alfarsi@m42.ae',
      role: 'Partnership Admin',
    })

    await user.click(screen.getByRole('button', { name: 'Actions for Zaid Al Ali' }))
    await user.click(screen.getByRole('menuitem', { name: 'Delete user' }))
    await user.click(screen.getByRole('button', { name: 'Delete user' }))
    expect(onDelete).toHaveBeenCalledWith('usr-02')
  })

  it('names the actions column', () => {
    setup()
    expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument()
  })

  it('deactivates and reactivates a user after a confirmation', async () => {
    const { user, onSetStatus } = setup()
    await user.click(screen.getByRole('button', { name: 'Actions for Tariq Mansoor' }))
    await user.click(screen.getByRole('menuitem', { name: 'Deactivate user' }))
    // Nothing happens until the user confirms
    expect(onSetStatus).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onSetStatus).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Actions for Tariq Mansoor' }))
    await user.click(screen.getByRole('menuitem', { name: 'Deactivate user' }))
    await user.click(screen.getByRole('button', { name: 'Deactivate user' }))
    expect(onSetStatus).toHaveBeenCalledWith('usr-03', 'Inactive')

    await user.click(screen.getByRole('button', { name: 'Actions for Marcus Vance' }))
    await user.click(screen.getByRole('menuitem', { name: 'Reactivate user' }))
    await user.click(screen.getByRole('button', { name: 'Reactivate user' }))
    expect(onSetStatus).toHaveBeenCalledWith('usr-08', 'Active')
  })
})
