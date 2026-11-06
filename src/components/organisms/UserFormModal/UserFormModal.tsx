'use client'

/**
 * UserFormModal — Organism
 * Popup to add or edit a platform user: full name, email address and one assigned role.
 * Used in: UsersScreen (Partnership Admin)
 */

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { AppDialog } from '@/components/molecules/AppDialog'
import { USER_ROLES, type UserRole } from '@/types/platformUsers'
import type { UserFormModalProps } from './UserFormModal.types'

/** The same soft hover and focus as the other popups' fields */
const SOFT = '!border-[#d6dee6] hover:!border-[#bcc7d3] focus:!border-[#a3b1c2]'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const Field: React.FC<{
  id: string
  label: string
  error?: string
  children: React.ReactNode
}> = ({ id, label, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-sm font-semibold text-text-primary">
      {label}
      <span className="text-text-error"> *</span>
    </label>
    {children}
    {error && <span className="text-[11px] text-text-error">{error}</span>}
  </div>
)

export const UserFormModal: React.FC<UserFormModalProps> = ({
  initial,
  takenEmails,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(initial?.name ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [role, setRole] = useState<UserRole>(initial?.role ?? 'Evaluator')
  const [showErrors, setShowErrors] = useState(false)

  const nameError = showErrors && !name.trim() ? 'This field is required' : undefined
  const trimmedEmail = email.trim()
  const emailError = !showErrors
    ? undefined
    : !trimmedEmail
      ? 'This field is required'
      : !EMAIL.test(trimmedEmail)
        ? 'Enter a valid email address'
        : takenEmails.some((e) => e.toLowerCase() === trimmedEmail.toLowerCase())
          ? 'A user with this email already exists'
          : undefined

  const save = () => {
    const valid =
      name.trim() &&
      EMAIL.test(trimmedEmail) &&
      !takenEmails.some((e) => e.toLowerCase() === trimmedEmail.toLowerCase())
    if (!valid) return setShowErrors(true)
    onSave({ name: name.trim(), email: trimmedEmail, role })
  }

  return (
    <AppDialog
      isOpen
      title={initial ? 'Edit User' : 'Add New User'}
      description="Create a user profile and assign a role."
      onClose={onClose}
      actions={
        <>
          <Button variant="outline" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={save}>
            {initial ? 'Save' : 'Add User'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field id="user-name" label="Full Name" error={nameError}>
          <Input
            id="user-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sarah Jenkins"
            hasError={Boolean(nameError)}
            className={SOFT}
          />
        </Field>
        <Field id="user-email" label="Email Address" error={emailError}>
          <Input
            id="user-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. sjenkins@m42.ae"
            hasError={Boolean(emailError)}
            className={SOFT}
          />
        </Field>
        <Field id="user-role" label="Assigned Role">
          <div className="relative">
            <Select
              id="user-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className={`h-10 !py-0 !pr-8 appearance-none ${SOFT}`}
              options={USER_ROLES.map((r) => ({ value: r, label: r }))}
            />
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary"
              strokeWidth={2}
              aria-hidden="true"
            />
          </div>
        </Field>
      </div>
    </AppDialog>
  )
}
