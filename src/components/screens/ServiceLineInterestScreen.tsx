'use client'

/**
 * ServiceLineInterestScreen — Screen
 * New interest: a service line owner raises a requirement, sees similar earlier submissions as
 * they type, and after submitting gets the vendors M42 already knows that may meet it.
 * Used in: HomePage (Service Line Owner)
 */

import React, { useMemo, useState } from 'react'
import { ClipboardList, Send } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { Textarea } from '@/components/atoms/Textarea'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { FocusAreaSelect } from '@/components/molecules/FocusAreaSelect'
import { InterestDrawer } from '@/components/organisms/InterestDrawer'
import { RecommendedVendors } from '@/components/organisms/RecommendedVendors'
import { compareInterest, matchVendors } from '@/lib/serviceLineMatch'
import type {
  PartnershipRequest,
  ServiceLineInterest,
  ServiceLineUrgency,
} from '@/types/partnership.types'

export type ServiceLineDraft = Pick<
  ServiceLineInterest,
  'serviceLine' | 'title' | 'problem' | 'focusAreas' | 'outcome' | 'urgency'
>

export interface ServiceLineInterestScreenProps {
  interests: ServiceLineInterest[]
  /** Every partnership request, whatever its status, to recommend vendors from */
  requests: PartnershipRequest[]
  /** Saves the interest and returns its new code */
  onSubmit: (draft: ServiceLineDraft) => string
}

const EMPTY: ServiceLineDraft = {
  serviceLine: '',
  title: '',
  problem: '',
  focusAreas: [],
  outcome: '',
  urgency: 'Medium',
}

const URGENCY_OPTIONS = (['Low', 'Medium', 'High'] as const).map((u) => ({ value: u, label: u }))

const Field: React.FC<{
  id: string
  label: string
  required?: boolean
  error?: boolean
  children: React.ReactNode
}> = ({ id, label, required, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-xs font-semibold text-text-primary leading-snug">
      {label}
      {required && <span className="text-text-error font-semibold"> *</span>}
    </label>
    {children}
    {error && <span className="text-[11px] text-text-error">This field is required</span>}
  </div>
)

export const ServiceLineInterestScreen: React.FC<ServiceLineInterestScreenProps> = ({
  interests,
  requests,
  onSubmit,
}) => {
  const [draft, setDraft] = useState<ServiceLineDraft>(EMPTY)
  const [showErrors, setShowErrors] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [submitted, setSubmitted] = useState<{ code: string; draft: ServiceLineDraft } | null>(null)

  const set = <K extends keyof ServiceLineDraft>(key: K, value: ServiceLineDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const missing = (['serviceLine', 'title', 'problem', 'outcome'] as const).filter(
    (k) => !draft[k].trim()
  )
  const incomplete = missing.length > 0 || draft.focusAreas.length === 0
  const isMissing = (k: keyof ServiceLineDraft) =>
    showErrors &&
    (k === 'focusAreas' ? draft.focusAreas.length === 0 : missing.includes(k as never))

  // Earlier interests that look like this one, most similar first; updates as the user types
  const similar = useMemo(
    () =>
      interests
        .map((interest) => ({ interest, ...compareInterest(draft, interest) }))
        .filter((m) => m.level !== null)
        .sort((a, b) => b.matches.length - a.matches.length),
    [draft, interests]
  )
  const [viewing, setViewing] = useState<ServiceLineInterest | null>(null)

  const matches = useMemo(
    () => (submitted ? matchVendors(submitted.draft, requests) : []),
    [submitted, requests]
  )

  const handleSubmit = () => {
    if (incomplete) {
      setShowErrors(true)
      return
    }
    setConfirming(true)
  }

  const confirm = () => {
    const code = onSubmit(draft)
    setSubmitted({ code, draft })
    setConfirming(false)
  }

  const reset = () => {
    setDraft(EMPTY)
    setShowErrors(false)
    setSubmitted(null)
  }

  if (submitted) {
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 animate-in fade-in duration-200">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold text-text-primary">Interest submitted</h1>
            <p className="text-sm text-text-tertiary">
              {submitted.code} · {submitted.draft.title} · sent to the Partnership Admin and
              Director
            </p>
          </div>
          <Button variant="outline" size="md" onClick={reset}>
            Raise another
          </Button>
        </div>
        <RecommendedVendors matches={matches} />
      </div>
    )
  }

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] gap-6 items-start">
      {/* Left: the form */}
      <section
        aria-labelledby="sl-form-heading"
        className="rounded-2xl border border-border-default bg-bg-default shadow-xs p-6 sm:p-8 flex flex-col gap-5"
      >
        <div className="flex flex-col gap-1">
          <h1 id="sl-form-heading" className="text-lg font-semibold text-text-primary">
            Express interest in a requirement
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            Describe what your service line needs. We match it with vendors who have already
            approached M42.
          </p>
        </div>

        <Field id="sl-service-line" label="Service line" required error={isMissing('serviceLine')}>
          <Input
            id="sl-service-line"
            value={draft.serviceLine}
            onChange={(e) => set('serviceLine', e.target.value)}
            placeholder="e.g. Radiology"
            hasError={isMissing('serviceLine')}
          />
        </Field>
        <Field id="sl-title" label="Requirement title" required error={isMissing('title')}>
          <Input
            id="sl-title"
            value={draft.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="A short name for the requirement"
            hasError={isMissing('title')}
          />
        </Field>
        <Field id="sl-problem" label="Problem to solve" required error={isMissing('problem')}>
          <Textarea
            id="sl-problem"
            rows={3}
            value={draft.problem}
            onChange={(e) => set('problem', e.target.value)}
            placeholder="What happens today, and why it is a problem"
            hasError={isMissing('problem')}
          />
        </Field>
        <Field id="sl-focus" label="Focus area(s)" required error={isMissing('focusAreas')}>
          <FocusAreaSelect
            id="sl-focus"
            value={draft.focusAreas}
            onChange={(next) => set('focusAreas', next)}
            error={isMissing('focusAreas')}
          />
        </Field>
        <Field id="sl-outcome" label="Desired outcome / KPI" required error={isMissing('outcome')}>
          <Textarea
            id="sl-outcome"
            rows={2}
            value={draft.outcome}
            onChange={(e) => set('outcome', e.target.value)}
            placeholder="The result you want, and how you would measure it"
            hasError={isMissing('outcome')}
          />
        </Field>
        <Field id="sl-urgency" label="Urgency">
          <Select
            id="sl-urgency"
            value={draft.urgency}
            onChange={(e) => set('urgency', e.target.value as ServiceLineUrgency)}
            options={URGENCY_OPTIONS}
          />
        </Field>

        <div className="flex justify-end pt-2">
          <Button variant="primary" size="md" onClick={handleSubmit} className="gap-1.5">
            <Send className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
            Submit interest
          </Button>
        </div>
      </section>

      {/* Right: earlier submissions that look like this one */}
      <aside
        aria-labelledby="sl-similar-heading"
        className="rounded-2xl border border-border-default bg-bg-default shadow-xs flex flex-col lg:sticky lg:top-20"
      >
        <div className={`flex flex-col gap-1 px-5 pt-5 ${similar.length > 0 ? 'pb-3' : 'pb-5'}`}>
          <div className="flex items-center gap-2">
            <ClipboardList
              className="w-4 h-4 text-text-secondary"
              strokeWidth={2}
              aria-hidden="true"
            />
            <h2 id="sl-similar-heading" className="text-sm font-semibold text-text-primary">
              Similar earlier submissions
            </h2>
          </div>
          <p className="text-xs text-text-secondary">
            Earlier submissions like yours show here as you type. You can still submit.
          </p>
        </div>
        {similar.length > 0 && (
          <ul className="flex flex-col divide-y divide-border-subtle border-t border-border-subtle">
            {similar.map(({ interest: i, level, matches: fields }) => (
              <li key={i.code} className="px-5 py-3 flex flex-col gap-1">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-semibold text-text-primary leading-snug">
                    {i.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => setViewing(i)}
                    aria-label={`View ${i.code}`}
                    className="text-xs font-medium text-text-link hover:underline cursor-pointer shrink-0"
                  >
                    View
                  </button>
                </div>
                <span className="text-xs text-text-tertiary">
                  {i.code} · {i.submittedBy} · {i.on}
                </span>
                <span className="text-xs">
                  <span
                    className={`font-medium ${level === 'Very similar' ? 'text-text-error' : 'text-text-warning'}`}
                  >
                    {level}
                  </span>
                  <span className="text-text-tertiary"> · same {fields.join(', ')}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {viewing && (
        <InterestDrawer interest={viewing} requests={requests} onClose={() => setViewing(null)} />
      )}

      {confirming && (
        <ConfirmDialog
          title="Submit your interest?"
          description={
            <>
              Your requirement will be sent to the Partnership Admin and Director.
              {similar[0]?.level === 'Very similar' &&
                ` It is very similar to ${similar[0].interest.code}.`}
            </>
          }
          cancelLabel="Review again"
          confirmLabel="Submit interest"
          icon={Send}
          onConfirm={confirm}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  )
}
