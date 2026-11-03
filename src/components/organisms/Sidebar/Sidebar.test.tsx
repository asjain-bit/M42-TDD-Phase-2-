import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Sidebar } from './Sidebar'

describe('Sidebar', () => {
  it('renders navigation item Dashboard and user designation Director', () => {
    render(
      <Sidebar
        activeTab="dashboard"
        onTabChange={vi.fn()}
        collapsed={false}
        onToggleCollapse={vi.fn()}
        userName="Zaid Al Ali"
        userDesignation="Director"
      />
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Zaid Al Ali')).toBeInTheDocument()
    expect(screen.getByText('Director')).toBeInTheDocument()
  })

  it('calls onTabChange when tab is clicked', async () => {
    const handleTabChange = vi.fn()
    const user = userEvent.setup()

    render(
      <Sidebar
        activeTab=""
        onTabChange={handleTabChange}
        collapsed={false}
        onToggleCollapse={vi.fn()}
      />
    )

    await user.click(screen.getByText('Dashboard'))
    expect(handleTabChange).toHaveBeenCalledWith('dashboard')
  })

  it('has a Value & ROI item that opens its page', async () => {
    const handleTabChange = vi.fn()
    const user = userEvent.setup()
    render(
      <Sidebar
        activeTab="dashboard"
        onTabChange={handleTabChange}
        collapsed={false}
        onToggleCollapse={vi.fn()}
      />
    )
    await user.click(screen.getByText('Value & ROI'))
    expect(handleTabChange).toHaveBeenCalledWith('usage')
  })

  it('opens and cancels logout modal in expanded state', async () => {
    const handleSignOut = vi.fn()
    const user = userEvent.setup()

    render(
      <Sidebar
        activeTab="dashboard"
        onTabChange={vi.fn()}
        collapsed={false}
        onToggleCollapse={vi.fn()}
        onSignOut={handleSignOut}
      />
    )

    await user.click(screen.getByTitle('Sign out'))
    expect(screen.getByText('Confirm Logout')).toBeInTheDocument()

    await user.click(screen.getByText('Cancel'))
    expect(screen.queryByText('Confirm Logout')).not.toBeInTheDocument()
  })

  it('triggers onSignOut on confirm logout', async () => {
    const handleSignOut = vi.fn()
    const user = userEvent.setup()

    render(
      <Sidebar
        activeTab="dashboard"
        onTabChange={vi.fn()}
        collapsed={false}
        onToggleCollapse={vi.fn()}
        onSignOut={handleSignOut}
      />
    )

    await user.click(screen.getByTitle('Sign out'))
    const logoutButtons = screen.getAllByRole('button', { name: 'Logout' })
    await user.click(logoutButtons[logoutButtons.length - 1])
    expect(handleSignOut).toHaveBeenCalled()
  })

  it('handles collapsed state and triggers toggle collapse', async () => {
    const handleToggle = vi.fn()
    const user = userEvent.setup()

    const { rerender } = render(
      <Sidebar
        activeTab="dashboard"
        onTabChange={vi.fn()}
        collapsed={false}
        onToggleCollapse={handleToggle}
      />
    )

    await user.click(screen.getByTitle('Collapse sidebar'))
    expect(handleToggle).toHaveBeenCalled()

    rerender(
      <Sidebar
        activeTab="dashboard"
        onTabChange={vi.fn()}
        collapsed={true}
        onToggleCollapse={handleToggle}
      />
    )

    // In collapsed state, Dashboard text is displayed below icon
    expect(screen.getByText('Dashboard')).toBeInTheDocument()

    await user.click(screen.getByTitle('Expand sidebar'))
    expect(handleToggle).toHaveBeenCalledTimes(2)

    // In collapsed state, avatar button opens user overlay
    const avatarButton = screen.getByLabelText('User profile options')
    await user.click(avatarButton)

    // Popover overlay is shown with Logout option
    const signoutBtn = screen.getByRole('button', { name: /Logout/i })
    expect(signoutBtn).toBeInTheDocument()
    await user.click(signoutBtn)
    expect(screen.getByText('Confirm Logout')).toBeInTheDocument()
  })
})
