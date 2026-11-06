'use client'

/**
 * ServiceLineInterestScreen — Screen
 * Internal interests for the Internal Interest Team, in two tabs: New interest (raise a
 * requirement, see similar earlier requests once typing pauses, and after submitting the vendors
 * M42 already knows) and All interests (every requirement, with the signed-in person's tagged).
 * Used in: HomePage (Internal Interest Team, Sponsor and Strategy Team)
 */

import React, { useEffect, useMemo, useState } from 'react'
import { Building2, ClipboardList, Send } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Skeleton } from '@/components/atoms/Skeleton'
import { Input } from '@/components/atoms/Input'
import { Select } from '@/components/atoms/Select'
import { Textarea } from '@/components/atoms/Textarea'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { FocusAreaSelect } from '@/components/molecules/FocusAreaSelect'
import { Toast } from '@/components/molecules/Toast'
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
  'serviceLine' | 'title' | 'problem' | 'focusAreas' | 'outcome' | 'urgency' | 'suggestedVendors'
>

export interface ServiceLineInterestScreenProps {
  interests: ServiceLineInterest[]
  /** Every partnership request, whatever its status, to recommend vendors from */
  requests: PartnershipRequest[]
  /** Saves the interest and returns its new code */
  onSubmit: (draft: ServiceLineDraft) => string
  /** The signed-in person, who owns what they submit (the page records it) */
  userName: string
  /** Replaces the All interests tab, e.g. the Strategy Team's table with decisions */
  allTab?: React.ReactNode
  /** The submitter's interest is approved straight away instead of going to Strategy */
  selfApproved?: boolean
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
  allTab,
  selfApproved,
}) => {
  const [mode, setMode] = useState<Mode>('new')
  // After a submit: All interests, with the new interest's drawer open, and a short toast
  const [focusCode, setFocusCode] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])
  const submitted = (code: string) => {
    setToast(`Interest submitted · ${code}`)
    setFocusCode(code)
    setMode('all')
  }
  return (
    <div className="flex flex-col gap-6 w-full text-text-primary">
      {toast && (
        <Toast
          title={toast}
          variant="success"
          onClose={() => setToast(null)}
          className="fixed top-5 right-5 z-[60] animate-in slide-in-from-top-4 duration-200"
        />
      )}
      {/* Underline tabs, as on the case page: left-aligned under the page title */}
      <div
        role="tablist"
        aria-label="Internal interests"
        className="flex items-center gap-8 border-b border-border-default"
      >
        {(
          [
            { id: 'new', label: 'New interest' },
            { id: 'all', label: `All interests (${interests.length})` },
          ] as const
        ).map((o) => (
          <button
            key={o.id}
            type="button"
            role="tab"
            id={`interests-tab-${o.id}`}
            aria-selected={mode === o.id}
            aria-controls={`interests-panel-${o.id}`}
            onClick={() => setMode(o.id)}
            className={`-mb-px pb-3.5 text-sm whitespace-nowrap border-b-2 cursor-pointer transition ${
              mode === o.id
                ? 'text-[var(--app-accent)] font-semibold border-[var(--app-accent)]'
                : 'text-text-secondary font-medium hover:text-text-primary border-transparent'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {/* Both stay mounted, so a half-written interest survives a look at All interests */}
      <div
        role="tabpanel"
        id="interests-panel-new"
        aria-labelledby="interests-tab-new"
        hidden={mode !== 'new'}
      >
        <NewRequest
          interests={interests}
          requests={requests}
          onSubmit={onSubmit}
          onSubmitted={submitted}
          selfApproved={selfApproved}
        />
      </div>
      <div
        role="tabpanel"
        id="interests-panel-all"
        aria-labelledby="interests-tab-all"
        hidden={mode !== 'all'}
      >
        {allTab ?? (
          <ServiceLineAllInterestsScreen
            interests={interests}
            requests={requests}
            focusCode={focusCode}
          />
        )}
      </div>
    </div>
  )
}

const NewRequest: React.FC<
  Omit<ServiceLineInterestScreenProps, 'userName'> & {
    /** The interest has been saved with this code; the form is already cleared */
    onSubmitted: (code: string) => void
    selfApproved?: boolean
  }
> = ({ interests, requests, onSubmit, onSubmitted, selfApproved }) => {
  const [draft, setDraft] = useState<ServiceLineDraft>(EMPTY)
  const [showErrors, setShowErrors] = useState(false)
  const [confirming, setConfirming] = useState(false)
  // Vendors ticked "Suggest to team", by request code
  const [picked, setPicked] = useState<string[]>([])

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

  // Vendors M42 already knows that may meet it, live as the interest is typed
  const matches = useMemo(
    () => (typed ? matchVendors(settled, requests) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settled, requests]
  )
  // Only vendors still in the list count as suggested
  const suggested = matches.filter((m) => picked.includes(m.request.requestCode))
  const togglePick = (code: string) =>
    setPicked((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]))

  const handleSubmit = () => {
    if (incomplete) {
      setShowErrors(true)
      return
    }
    setConfirming(true)
  }

  const confirm = () => {
    const code = onSubmit({
      ...draft,
      suggestedVendors: suggested.map((m) => m.request.requestCode),
    })
    setConfirming(false)
    // Clear the form for the next one
    setDraft(EMPTY)
    setSettled(EMPTY)
    setPicked([])
    setShowErrors(false)
    onSubmitted(code)
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

      {/* Right: similar earlier requests and the vendors M42 already knows, live while typing.
          Sticky 16px below the app's sticky header bar (57px), so it never slides under it. */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-[73px] lg:max-h-[calc(100vh-89px)] lg:overflow-y-auto overscroll-contain">
        <aside
          aria-labelledby="sl-similar-heading"
          className="rounded-2xl border border-border-default bg-bg-default shadow-xs flex flex-col"
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

        <section
          aria-labelledby="sl-vendors-heading"
          className="rounded-2xl border border-border-default bg-bg-default shadow-xs flex flex-col gap-3 p-5"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Building2
                className="w-4 h-4 text-text-secondary"
                strokeWidth={2}
                aria-hidden="true"
              />
              <h2 id="sl-vendors-heading" className="text-sm font-semibold text-text-primary">
                Vendors M42 already knows
              </h2>
            </div>
            <p className="text-xs text-text-secondary">
              Known vendors that may fit. Tick to suggest them.
            </p>
          </div>
          {matching ? (
            <ul aria-label="Looking for vendors" aria-busy="true" className="flex flex-col gap-3">
              {[0, 1, 2].map((n) => (
                <li key={n} className="flex items-start gap-3">
                  <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                  <div className="flex-1 flex flex-col gap-2">
                    <Skeleton className="h-3.5 w-3/5" />
                    <Skeleton className="h-2 w-28" />
                    <Skeleton className="h-3 w-4/5" />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <RecommendedVendors
              matches={matches}
              hideHeader
              compact
              selected={picked}
              onToggle={togglePick}
              emptyText={null}
            />
          )}
        </section>
      </div>

      {viewing && (
        <InterestDrawer interest={viewing} requests={requests} onClose={() => setViewing(null)} />
      )}

      {confirming && (
        <ConfirmDialog
          title="Submit your interest?"
          description={
            <>
              {selfApproved
                ? 'It will be approved straight away and shared with the Partnership Admin and Director'
                : 'It will be sent to Strategy for review'}
              {suggested.length > 0 &&
                `, with ${suggested.length} suggested ${
                  suggested.length === 1 ? 'vendor' : 'vendors'
                } (${suggested.map((m) => m.request.companyName).join(', ')})`}
              .
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
