'use client'

/**
 * InterestEditModal — Organism
 * Popup where the Strategy Team adds or edits a service line interest: the same fields as the
 * service line's form, and (when editing) its status. An added interest comes from Strategy
 * scouting and is approved straight away.
 * Used in: InternalInterestsScreen (Strategy Team)
 */

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { Textarea } from '@/components/atoms/Textarea'
import { AppDialog } from '@/components/molecules/AppDialog'
import { FocusAreaSelect } from '@/components/molecules/FocusAreaSelect'
import type { InterestStatus, ServiceLineUrgency } from '@/types/partnership.types'
import type { InterestEdit, InterestEditModalProps } from './InterestEditModal.types'

const URGENCIES: ServiceLineUrgency[] = ['Low', 'Medium', 'High']
const STATUSES: InterestStatus[] = ['Pending review', 'Approved', 'Declined']

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

export const InterestEditModal: React.FC<InterestEditModalProps> = ({
  interest,
  onSave,
  onClose,
}) => {
  const [draft, setDraft] = useState<InterestEdit>({
    serviceLine: interest?.serviceLine ?? '',
    title: interest?.title ?? '',
    problem: interest?.problem ?? '',
    focusAreas: interest?.focusAreas ?? [],
    outcome: interest?.outcome ?? '',
    urgency: interest?.urgency ?? 'Medium',
    status: interest?.status ?? 'Approved',
  })
  const [showErrors, setShowErrors] = useState(false)
  const set = <K extends keyof InterestEdit>(key: K, value: InterestEdit[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const textFields = ['serviceLine', 'title', 'problem', 'outcome'] as const
  const missing = (k: (typeof textFields)[number] | 'focusAreas') =>
    showErrors && (k === 'focusAreas' ? draft.focusAreas.length === 0 : !draft[k].trim())
  const incomplete = textFields.some((k) => !draft[k].trim()) || draft.focusAreas.length === 0

  const save = () => {
    if (incomplete) return setShowErrors(true)
    onSave({
      ...draft,
      serviceLine: draft.serviceLine.trim(),
      title: draft.title.trim(),
      problem: draft.problem.trim(),
      outcome: draft.outcome.trim(),
    })
  }

  return (
    <AppDialog
      isOpen
      title={interest ? `Edit ${interest.code}` : 'Add interest'}
      description={
        interest
          ? `Raised by ${interest.submittedBy} on ${interest.on}.`
          : 'From Strategy scouting. It is approved straight away and checked for overlaps.'
      }
      onClose={onClose}
      actions={
        <>
          <Button variant="outline" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={save}>
            {interest ? 'Save' : 'Add interest'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto overscroll-contain -mx-1 px-1">
        <Field id="edit-service-line" label="Service line" required error={missing('serviceLine')}>
          <Input
            id="edit-service-line"
            value={draft.serviceLine}
            onChange={(e) => set('serviceLine', e.target.value)}
            placeholder="e.g. Radiology"
            hasError={missing('serviceLine')}
          />
        </Field>
        <Field id="edit-title" label="Requirement title" required error={missing('title')}>
          <Input
            id="edit-title"
            value={draft.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="A short name for the requirement"
            hasError={missing('title')}
          />
        </Field>
        <Field id="edit-problem" label="Problem to solve" required error={missing('problem')}>
          <Textarea
            id="edit-problem"
            rows={3}
            value={draft.problem}
            onChange={(e) => set('problem', e.target.value)}
            placeholder="What happens today, and why it is a problem"
            hasError={missing('problem')}
          />
        </Field>
        <Field id="edit-focus" label="Focus area(s)" required error={missing('focusAreas')}>
          <FocusAreaSelect
            id="edit-focus"
            value={draft.focusAreas}
            onChange={(next) => set('focusAreas', next)}
            error={missing('focusAreas')}
          />
        </Field>
        <Field id="edit-outcome" label="Desired outcome / KPI" required error={missing('outcome')}>
          <Textarea
            id="edit-outcome"
            rows={2}
            value={draft.outcome}
            onChange={(e) => set('outcome', e.target.value)}
            placeholder="The result you want, and how you would measure it"
            hasError={missing('outcome')}
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="edit-urgency" label="Urgency">
            <ChevronSelect
              id="edit-urgency"
              value={draft.urgency}
              onChange={(e) => set('urgency', e.target.value as ServiceLineUrgency)}
              options={URGENCIES.map((u) => ({ value: u, label: u }))}
            />
          </Field>
          {interest && (
            <Field id="edit-status" label="Status" required>
              <ChevronSelect
                id="edit-status"
                value={draft.status}
                onChange={(e) => set('status', e.target.value as InterestStatus)}
                options={STATUSES.map((st) => ({ value: st, label: st }))}
              />
            </Field>
          )}
        </div>
      </div>
    </AppDialog>
  )
}
