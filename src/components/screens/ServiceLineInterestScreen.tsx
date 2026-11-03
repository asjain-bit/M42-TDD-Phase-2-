'use client'

/**
 * ServiceLineInterestScreen — Screen
 * Service line needs for the Internal Interest Team, with a toggle between New request (raise a
 * requirement, see similar earlier requests once typing pauses, and after submitting the vendors
 * M42 already knows) and All requests (every requirement, with the signed-in person's tagged).
 * Used in: HomePage (Internal Interest Team)
 */

import React, { useEffect, useMemo, useState } from 'react'
import { ClipboardList, Send } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Skeleton } from '@/components/atoms/Skeleton'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { Textarea } from '@/components/atoms/Textarea'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { FocusAreaSelect } from '@/components/molecules/FocusAreaSelect'
import { InterestDrawer } from '@/components/organisms/InterestDrawer'
import { RecommendedVendors } from '@/components/organisms/RecommendedVendors'
import { ServiceLineAllInterestsScreen } from '@/components/screens/ServiceLineAllInterestsScreen'
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
  /** The signed-in person: the owner of what they submit, and of the rows tagged Yours */
  userName: string
}

/** How long typing has to pause before similar requests are looked up */
const MATCH_DELAY_MS = 800

type Mode = 'new' | 'all'

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
  userName,
}) => {
  const [mode, setMode] = useState<Mode>('new')
  return (
    <div className="flex flex-col gap-6 w-full text-text-primary">
      <div className="flex items-center justify-end">
        <div
          role="radiogroup"
          aria-label="Service line needs view"
          className="inline-flex items-center rounded-lg border border-border-default bg-bg-surface-1 p-0.5"
        >
          {(
            [
              { id: 'new', label: 'New request' },
              { id: 'all', label: `All requests · ${interests.length}` },
            ] as const
          ).map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={mode === o.id}
              onClick={() => setMode(o.id)}
              className={`h-8 px-3.5 rounded-md text-sm font-medium whitespace-nowrap cursor-pointer transition ${
                mode === o.id
                  ? 'bg-bg-default text-text-primary shadow-xs border border-border-default'
                  : 'text-text-secondary hover:text-text-primary border border-transparent'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      {/* Both stay mounted, so a half-written request survives a look at All requests */}
      <div hidden={mode !== 'new'}>
        <NewRequest interests={interests} requests={requests} onSubmit={onSubmit} />
      </div>
      <div hidden={mode !== 'all'}>
        <ServiceLineAllInterestsScreen
          interests={interests}
          requests={requests}
          userName={userName}
        />
      </div>
    </div>
  )
}

const NewRequest: React.FC<Omit<ServiceLineInterestScreenProps, 'userName'>> = ({
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

  // Earlier requests that look like this one, most similar first. They are looked up once
  // typing pauses; until then the panel shows placeholder rows.
  const [settled, setSettled] = useState<ServiceLineDraft>(EMPTY)
  const typed = Boolean(
    draft.serviceLine.trim() ||
    draft.title.trim() ||
    draft.problem.trim() ||
    draft.outcome.trim() ||
    draft.focusAreas.length
  )
  const matching = typed && draft !== settled
  useEffect(() => {
    const t = setTimeout(() => setSettled(draft), MATCH_DELAY_MS)
    return () => clearTimeout(t)
  }, [draft])
  const similar = useMemo(
    () =>
      interests
        .map((interest) => ({ interest, ...compareInterest(settled, interest) }))
        .filter((m) => m.level !== null)
        .sort((a, b) => b.matches.length - a.matches.length),
    [settled, interests]
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
    setSettled(EMPTY)
    setShowErrors(false)
    setSubmitted(null)
  }

  if (submitted) {
    return (
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 animate-in fade-in duration-200">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold text-text-primary">Request submitted</h1>
            <p className="text-sm text-text-tertiary">
              {submitted.code} · {submitted.draft.title} · sent to the Partnership Admin and
              Director
            </p>
          </div>
          <Button variant="outline" size="md" onClick={reset}>
            New request
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
            Submit request
          </Button>
        </div>
      </section>

      {/* Right: earlier submissions that look like this one */}
      <aside
        aria-labelledby="sl-similar-heading"
        className="rounded-2xl border border-border-default bg-bg-default shadow-xs flex flex-col lg:sticky lg:top-20"
      >
        <div
          className={`flex flex-col gap-1 px-5 pt-5 ${similar.length > 0 || matching ? 'pb-3' : 'pb-5'}`}
        >
          <div className="flex items-center gap-2">
            <ClipboardList
              className="w-4 h-4 text-text-secondary"
              strokeWidth={2}
              aria-hidden="true"
            />
            <h2 id="sl-similar-heading" className="text-sm font-semibold text-text-primary">
              Similar earlier requests
            </h2>
          </div>
          <p className="text-xs text-text-secondary">
            Earlier requests like yours show here as you type. You can still submit.
          </p>
        </div>
        {matching ? (
          <ul
            aria-label="Looking for similar requests"
            aria-busy="true"
            className="flex flex-col divide-y divide-border-subtle border-t border-border-subtle"
          >
            {[0, 1, 2].map((n) => (
              <li key={n} className="px-5 py-3 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-3.5 w-3/5" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-3 w-2/5" />
                <Skeleton className="h-3 w-1/2" />
              </li>
            ))}
          </ul>
        ) : (
          similar.length > 0 && (
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
          )
        )}
      </aside>

      {viewing && (
        <InterestDrawer interest={viewing} requests={requests} onClose={() => setViewing(null)} />
      )}

      {confirming && (
        <ConfirmDialog
          title="Submit your request?"
          description={
            <>
              Your requirement will be sent to the Partnership Admin and Director.
              {similar[0]?.level === 'Very similar' &&
                ` It is very similar to ${similar[0].interest.code}.`}
            </>
          }
          cancelLabel="Review again"
          confirmLabel="Submit request"
          icon={Send}
          onConfirm={confirm}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  )
}
