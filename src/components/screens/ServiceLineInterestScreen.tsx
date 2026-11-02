'use client'

/**
 * ServiceLineInterestScreen — Screen
 * Service line teams raise a requirement, see similar earlier ones while they type, and get the
 * vendors from every partnership request that could meet it.
 * Used in: HomePage (Service Line Team)
 */

import React, { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ClipboardList, Send } from 'lucide-react'
import { Badge } from '@/components/atoms/Badge'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { Textarea } from '@/components/atoms/Textarea'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { FocusAreaSelect } from '@/components/molecules/FocusAreaSelect'
import { RecommendedVendors } from '@/components/organisms/RecommendedVendors'
import { matchVendors, rankSimilarInterests } from '@/lib/serviceLineMatch'
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

  const ranked = useMemo(
    () => rankSimilarInterests({ title: draft.title, focusAreas: draft.focusAreas }, interests),
    [draft.title, draft.focusAreas, interests]
  )
  const firstSimilar = ranked.find((r) => r.similar)?.interest

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
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 animate-in fade-in duration-200">
        <div className="rounded-2xl border border-border-default bg-bg-default shadow-xs p-8 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-status-success-bg text-status-success-text flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" strokeWidth={2} aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold text-text-primary">Interest submitted</h1>
            <p className="text-sm text-text-secondary leading-relaxed">
              Thank you. The partnerships team will review your requirement.
            </p>
          </div>
          <div className="w-full max-w-sm rounded-xl border border-status-success-border bg-status-success-bg py-4 flex flex-col gap-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
              Your interest ID
            </span>
            <span className="text-3xl font-semibold tracking-tight text-status-success-text">
              {submitted.code}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={reset}>
            Submit another interest
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

        {firstSimilar && (
          <div
            role="status"
            className="flex items-start gap-2 px-3 py-2 rounded-lg border border-status-warning-border bg-status-warning-bg text-xs text-status-warning-text"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden="true" />
            <span>Looks similar to {firstSimilar.code}. Check it before submitting.</span>
          </div>
        )}

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
            Submit
          </Button>
        </div>
      </section>

      {/* Right: earlier submissions, similar ones first */}
      <aside
        aria-labelledby="sl-earlier-heading"
        className="rounded-2xl border border-border-default bg-bg-default shadow-xs p-5 flex flex-col gap-3 lg:sticky lg:top-20"
      >
        <div className="flex items-center gap-2">
          <ClipboardList
            className="w-4 h-4 text-text-secondary"
            strokeWidth={2}
            aria-hidden="true"
          />
          <h2 id="sl-earlier-heading" className="text-sm font-semibold text-text-primary">
            Earlier submissions
          </h2>
        </div>
        <ul className="flex flex-col gap-2">
          {ranked.map(({ interest: i, similar }) => (
            <li
              key={i.code}
              className={`rounded-lg border p-3 flex flex-col gap-1 ${
                similar
                  ? 'border-status-warning-border bg-status-warning-bg'
                  : 'border-border-subtle bg-bg-surface-1'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-text-tertiary">{i.code}</span>
                <span className="flex items-center gap-1.5">
                  {similar && (
                    <Badge size="sm" variant="warning">
                      Similar
                    </Badge>
                  )}
                  <Badge
                    size="sm"
                    variant={
                      i.status === 'Approved'
                        ? 'success'
                        : i.status === 'Declined'
                          ? 'error'
                          : 'info'
                    }
                  >
                    {i.status}
                  </Badge>
                </span>
              </div>
              <span className="text-sm font-medium text-text-primary leading-snug">{i.title}</span>
              <span className="text-xs text-text-secondary">
                {i.serviceLine} · {i.on}
              </span>
            </li>
          ))}
        </ul>
      </aside>

      {confirming && (
        <ConfirmDialog
          title="Submit your interest?"
          description={
            <>
              Your requirement will be sent to the partnerships team.
              {firstSimilar && ` It looks similar to ${firstSimilar.code}.`}
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
