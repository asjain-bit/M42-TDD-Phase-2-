'use client'

/**
 * ProjectFormModal — Organism
 * Popup to add or edit an existing M42 project: name, description, team, owner, focus area,
 * status, start month and the vendors involved.
 * Used in: ExistingProjectsScreen (Strategy Team)
 */

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { Textarea } from '@/components/atoms/Textarea'
import { AppDialog } from '@/components/molecules/AppDialog'
import { FocusAreaSelect } from '@/components/molecules/FocusAreaSelect'
import { FOCUS_AREA_OPTIONS } from '@/types/vendorForm'
import type { ProjectStatus } from '@/types/partnership.types'
import type { ProjectDraft, ProjectFormModalProps } from './ProjectFormModal.types'

const STATUSES: ProjectStatus[] = ['Live', 'Pilot', 'Completed', 'Paused']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "Feb 2026" to the month input's "2026-02", and back */
const toMonthInput = (started: string) => {
  const [mon, year] = started.split(' ')
  const i = MONTHS.indexOf(mon)
  return i >= 0 && /^\d{4}$/.test(year ?? '') ? `${year}-${String(i + 1).padStart(2, '0')}` : ''
}
const fromMonthInput = (value: string) => {
  const [year, month] = value.split('-')
  return year && month ? `${MONTHS[Number(month) - 1]} ${year}` : ''
}

const EMPTY: ProjectDraft = {
  name: '',
  description: '',
  team: '',
  owner: '',
  focusArea: '',
  status: 'Pilot',
  started: '',
  vendors: [],
}

/** Keeps a value that is no longer in the list selectable, so editing never drops it */
const withCurrent = (list: readonly string[], current: string) =>
  current && !list.includes(current) ? [current, ...list] : [...list]

const Field: React.FC<{
  id: string
  label: string
  required?: boolean
  error?: boolean
  children: React.ReactNode
}> = ({ id, label, required, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-xs font-semibold text-text-secondary">
      {label}
      {required && <span className="text-text-error"> *</span>}
    </label>
    {children}
    {error && <span className="text-[11px] text-text-error">This field is required</span>}
  </div>
)

/** The shared Select with a lucide chevron in place of the native arrow */
const ChevronSelect: React.FC<React.ComponentProps<typeof Select>> = ({ className = '', ...p }) => (
  <div className="relative">
    <Select {...p} className={`h-10 !py-0 !pr-8 appearance-none ${className}`.trim()} />
    <ChevronDown
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary"
      strokeWidth={2}
      aria-hidden="true"
    />
  </div>
)

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  initial,
  owners,
  vendorOptions,
  onSave,
  onClose,
}) => {
  const [draft, setDraft] = useState<ProjectDraft>(() =>
    initial
      ? {
          name: initial.name,
          description: initial.description,
          team: initial.team,
          owner: initial.owner,
          focusArea: initial.focusArea,
          status: initial.status,
          started: initial.started,
          vendors: initial.vendors,
        }
      : EMPTY
  )
  const [showErrors, setShowErrors] = useState(false)
  const set = <K extends keyof ProjectDraft>(key: K, value: ProjectDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const required = ['name', 'description', 'team', 'owner', 'focusArea'] as const
  const missing = (k: (typeof required)[number]) => showErrors && !draft[k].trim()
  const incomplete = required.some((k) => !draft[k].trim())

  const save = () => {
    if (incomplete) return setShowErrors(true)
    onSave({
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
      team: draft.team.trim(),
    })
  }

  return (
    <AppDialog
      isOpen
      title={initial ? 'Edit project' : 'Add project'}
      description="Projects M42 already runs are checked for overlap with new requests and interests."
      onClose={onClose}
      actions={
        <>
          <Button variant="outline" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={save}>
            {initial ? 'Save' : 'Add project'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto overscroll-contain -mx-1 px-1">
        <Field id="project-name" label="Project name" required error={missing('name')}>
          <Input
            id="project-name"
            value={draft.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Chest imaging AI triage"
            hasError={missing('name')}
          />
        </Field>
        <Field id="project-description" label="Description" required error={missing('description')}>
          <Textarea
            id="project-description"
            rows={2}
            resize="none"
            value={draft.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="What the project does, in a sentence or two"
            hasError={missing('description')}
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="project-team" label="Team" required error={missing('team')}>
            <Input
              id="project-team"
              value={draft.team}
              onChange={(e) => set('team', e.target.value)}
              placeholder="e.g. Radiology"
              hasError={missing('team')}
            />
          </Field>
          <Field id="project-owner" label="Owner" required error={missing('owner')}>
            <ChevronSelect
              id="project-owner"
              value={draft.owner}
              onChange={(e) => set('owner', e.target.value)}
              hasError={missing('owner')}
              options={[
                { value: '', label: 'Select a person', disabled: true },
                ...withCurrent(owners, draft.owner).map((o) => ({ value: o, label: o })),
              ]}
            />
          </Field>
          <Field id="project-focus" label="Focus area" required error={missing('focusArea')}>
            <ChevronSelect
              id="project-focus"
              value={draft.focusArea}
              onChange={(e) => set('focusArea', e.target.value)}
              hasError={missing('focusArea')}
              options={[
                { value: '', label: 'Select a focus area', disabled: true },
                ...withCurrent(FOCUS_AREA_OPTIONS, draft.focusArea).map((f) => ({
                  value: f,
                  label: f,
                })),
              ]}
            />
          </Field>
          <Field id="project-status" label="Status" required>
            <ChevronSelect
              id="project-status"
              value={draft.status}
              onChange={(e) => set('status', e.target.value as ProjectStatus)}
              options={STATUSES.map((st) => ({ value: st, label: st }))}
            />
          </Field>
          <Field id="project-started" label="Started">
            <Input
              id="project-started"
              type="month"
              className="h-10"
              value={toMonthInput(draft.started)}
              onChange={(e) => set('started', fromMonthInput(e.target.value))}
            />
          </Field>
        </div>
        <Field id="project-vendors" label="Vendors involved">
          <FocusAreaSelect
            id="project-vendors"
            value={draft.vendors}
            onChange={(next) => set('vendors', next)}
            options={[...new Set([...draft.vendors, ...vendorOptions])]}
            placeholder="Select vendors (optional)"
            listLabel="Vendors"
          />
        </Field>
      </div>
    </AppDialog>
  )
}
