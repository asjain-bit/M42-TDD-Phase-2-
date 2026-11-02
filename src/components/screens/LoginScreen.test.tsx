import React from 'react'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { LoginScreen, AVAILABLE_PROFILES } from './LoginScreen'

const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

const profileById = (id: string) => AVAILABLE_PROFILES.find((p) => p.id === id)

describe('LoginScreen', () => {
  it('renders SSO welcome view with Tech Due Diligence branding', () => {
    renderWithTheme(<LoginScreen onLogin={vi.fn()} />)
    expect(screen.getByText('Tech Due Diligence')).toBeInTheDocument()
    expect(screen.getByText('Sign in with SSO')).toBeInTheDocument()
    expect(screen.getByText('Sign in with your organisational account')).toBeInTheDocument()
  })

  it('transitions to profile selection view when clicking Sign in with SSO', async () => {
    const user = userEvent.setup()
    renderWithTheme(<LoginScreen onLogin={vi.fn()} />)

    await user.click(screen.getByText('Sign in with SSO'))
    expect(screen.getByText('Select Profile')).toBeInTheDocument()

    // Vendor Web Form and Partnership Admin come first, Legal Team stays hidden
    expect(screen.getByText('Vendor Web Form')).toBeInTheDocument()
    expect(screen.getByText('Partnership Admin')).toBeInTheDocument()
    const order = screen.getAllByRole('button').map((b) => b.textContent ?? '')
    expect(order.findIndex((t) => t.includes('Vendor Web Form'))).toBeLessThan(
      order.findIndex((t) => t.includes('Partnership Admin'))
    )
    expect(order.findIndex((t) => t.includes('Partnership Admin'))).toBeLessThan(
      order.findIndex((t) => t.includes('Director'))
    )
    expect(screen.getByText('Director')).toBeInTheDocument()
    expect(screen.getByText('Internal Interest Team')).toBeInTheDocument()
    expect(screen.getByText('Strategy Team')).toBeInTheDocument()
    expect(screen.getByText('Sponsor')).toBeInTheDocument()
    expect(screen.queryByText('Legal Team')).not.toBeInTheDocument()
    // Assert prototype navigation tooltip
    expect(
      screen.getByText(
        'This is for the prototype navigation purpose not to be included in the actual developed application.'
      )
    ).toBeInTheDocument()
  })

  it('allows navigating back to welcome screen', async () => {
    const user = userEvent.setup()
    renderWithTheme(<LoginScreen onLogin={vi.fn()} />)

    await user.click(screen.getByText('Sign in with SSO'))
    expect(screen.getByText('Select Profile')).toBeInTheDocument()

    await user.click(screen.getByText('Back to sign in'))
    expect(screen.getByText('Sign in with SSO')).toBeInTheDocument()
  })

  it('selects Director profile and triggers onLogin', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const handleLogin = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    renderWithTheme(<LoginScreen onLogin={handleLogin} />)

    await user.click(screen.getByText('Sign in with SSO'))
    await user.click(screen.getByText('Director'))

    expect(screen.getByText('Setting up your workspace...')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(800)
    })

    expect(handleLogin).toHaveBeenCalledWith(profileById('director'))
    vi.useRealTimers()
  })

  it('selects Internal Interest Team profile and triggers onLogin', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const handleLogin = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    renderWithTheme(<LoginScreen onLogin={handleLogin} />)

    await user.click(screen.getByText('Sign in with SSO'))
    await user.click(screen.getByText('Internal Interest Team'))

    expect(screen.getByText('Setting up your workspace...')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(800)
    })

    expect(handleLogin).toHaveBeenCalledWith(profileById('evaluator'))
    vi.useRealTimers()
  })

  it('selects Strategy Team profile and triggers onLogin', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const handleLogin = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    renderWithTheme(<LoginScreen onLogin={handleLogin} />)

    await user.click(screen.getByText('Sign in with SSO'))
    await user.click(screen.getByText('Strategy Team'))

    expect(screen.getByText('Setting up your workspace...')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(800)
    })

    expect(handleLogin).toHaveBeenCalledWith(profileById('strategy-fit'))
    vi.useRealTimers()
  })

  it('selects the Sponsor profile and triggers onLogin', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const handleLogin = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    renderWithTheme(<LoginScreen onLogin={handleLogin} />)

    await user.click(screen.getByText('Sign in with SSO'))
    await user.click(screen.getByText('Sponsor'))

    act(() => {
      vi.advanceTimersByTime(800)
    })

    expect(handleLogin).toHaveBeenCalledWith(profileById('sponsor'))
    vi.useRealTimers()
  })

  it('does not offer the Legal Team profile', async () => {
    const user = userEvent.setup()
    renderWithTheme(<LoginScreen onLogin={vi.fn()} />)
    await user.click(screen.getByText('Sign in with SSO'))
    expect(screen.queryByText('Legal Team')).not.toBeInTheDocument()
  })

  it('renders all profile icon branches correctly', async () => {
    const user = userEvent.setup()
    renderWithTheme(<LoginScreen onLogin={vi.fn()} />)

    await user.click(screen.getByText('Sign in with SSO'))
    AVAILABLE_PROFILES.filter((p) => p.id !== 'legal-director').forEach((p) => {
      expect(screen.getByText(p.roleTitle)).toBeInTheDocument()
    })
  })

  it.each([
    ['Vendor Web Form', 'vendor'],
    ['Partnership Admin', 'partnership-admin'],
  ])('selects the %s profile and triggers onLogin', async (label, id) => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const handleLogin = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    renderWithTheme(<LoginScreen onLogin={handleLogin} />)

    await user.click(screen.getByText('Sign in with SSO'))
    await user.click(screen.getByText(label))
    act(() => {
      vi.advanceTimersByTime(800)
    })

    expect(handleLogin).toHaveBeenCalledWith(profileById(id))
    vi.useRealTimers()
  })

  it('has the Strategy Team as a role, with no personal name', () => {
    const lead = AVAILABLE_PROFILES.find((pr) => pr.id === 'strategy-fit')!
    expect(lead.name).toBe('Strategy Team')
    expect(lead.designation).toBe('Strategy Team')
    expect(lead.email).toBe('strategy@m42.ae')
    expect(lead.avatarUrl).toBeUndefined()
  })
})
