'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Send,
  Sparkles,
} from 'lucide-react'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { FocusAreaSelect } from '@/components/molecules/FocusAreaSelect'
import { runVendorFormCheck, type VendorFormSuggestion } from '@/lib/vendorFormCheck'
import {
  DEVELOPMENT_APPROACH_OPTIONS,
  EMPTY_VENDOR_FORM,
  POPULATION_OPTIONS,
  SAMPLE_VENDOR_FORM,
  isFormEmpty,
  missingVendorFields,
  type VendorFormValues,
  isVendorIdValid,
} from '@/types/vendorForm'

export interface VendorWebFormProps {
  /** Receives the finished form and returns the case ID created for it */
  onSubmitCase: (values: VendorFormValues) => string
  onSignOut?: () => void
}

const FIELD =
  'w-full rounded-lg border border-[#d6dee6] bg-white text-sm text-[#0d212c] placeholder:text-[#9aa8b5] shadow-2xs transition focus:outline-none hover:border-[#bcc7d3] focus:border-[#a3b1c2] focus:ring-0'
const FIELD_ERROR = 'border-red-300'

interface QuestionConfig {
  field: keyof VendorFormValues
  label: string
  helper: string
  placeholder: string
  rows: number
  required: boolean
}

const CHECK_STEPS = [
  'Reading your answers',
  'Looking for vague or missing detail',
  'Preparing suggestions',
]

const QUESTIONS: Record<string, QuestionConfig> = {
  stageAndExperience: {
    field: 'stageAndExperience',
    label: "How would you describe your company's stage of maturity and experience?",
    helper:
      "Company's growth journey and regional experience. Include relevant milestones such as product launches, market entries or partnerships in UAE or other healthcare systems.",
    placeholder: 'Describe your journey, regional experience and key milestones...',
    rows: 4,
    required: true,
  },
  proposal: {
    field: 'proposal',
    label: 'Briefly describe your proposal of collaboration.',
    helper: 'Details about the product, platform or service you are submitting for consideration.',
    placeholder: 'What are you proposing, and what would M42 do with you?',
    rows: 4,
    required: true,
  },
  maturityAndRegulatory: {
    field: 'maturityAndRegulatory',
    label:
      'What is the current maturity level of your solution and have you secured any regulatory approvals or certifications (if applicable)?',
    helper:
      "Briefly describe the solution's current stage of maturity, any deployments to date and regulatory clearances obtained (e.g. CE, FDA, DoH Abu Dhabi).",
    placeholder: 'Maturity, deployments to date and clearances obtained...',
    rows: 3,
    required: true,
  },
  relevantApprovals: {
    field: 'relevantApprovals',
    label:
      'Please list any relevant approvals (e.g. CE, FDA, ISO, UAE MOHAP, DOH) or state "Not applicable."',
    helper: '',
    placeholder: 'e.g. CE Mark, FDA cleared, ISO 13485',
    rows: 2,
    required: true,
  },
  novelty: {
    field: 'novelty',
    label: 'How novel or differentiated is your solution compared to others in the market?',
    helper:
      'Assess the innovation potential, uniqueness and whether the solution brings new intellectual property or care modules to M42.',
    placeholder: 'What sets it apart from alternatives?',
    rows: 4,
    required: true,
  },
  resources: {
    field: 'resources',
    label: 'What specific resources, input, or partnerships are you seeking from M42?',
    helper:
      'Outline the type of support expected, such as data, access, clinical collaboration, technical integration, funding or pilot sites.',
    placeholder: 'The support you expect from M42...',
    rows: 3,
    required: true,
  },
}

const Field: React.FC<{
  id: string
  label: string
  helper?: string
  required?: boolean
  error?: boolean
  suggestion?: VendorFormSuggestion
  children: React.ReactNode
}> = ({ id, label, helper, required, error, suggestion, children }) => (
  <div id={`field-${id}`} className="flex flex-col gap-1.5 scroll-mt-24">
    <label htmlFor={id} className="text-xs font-semibold text-[#0d212c] leading-snug">
      {label}
      {required && <span className="text-red-500 font-semibold"> *</span>}
    </label>
    {helper && <p className="text-[11px] text-[#64748b] leading-relaxed">{helper}</p>}
    {children}
    {error && (
      <span className="text-[11px] text-red-600 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" aria-hidden="true" />
        This field is required
      </span>
    )}
    {suggestion && (
      <div
        role="note"
        className="rounded-lg border border-[#bae6fd] bg-[#f0f9ff] px-3.5 py-3 flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-200"
      >
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-[#0369a1] shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-[#0c4a6e] leading-relaxed">{suggestion.message}</p>
        </div>
      </div>
    )}
  </div>
)

export const VendorWebForm: React.FC<VendorWebFormProps> = ({ onSubmitCase, onSignOut }) => {
  const [values, setValues] = useState<VendorFormValues>(EMPTY_VENDOR_FORM)
  const [showErrors, setShowErrors] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [suggestions, setSuggestions] = useState<VendorFormSuggestion[] | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [caseId, setCaseId] = useState<string | null>(null)
  const [checkStep, setCheckStep] = useState(0)
  const [hasRunCheck, setHasRunCheck] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const set = <K extends keyof VendorFormValues>(field: K, value: VendorFormValues[K]) =>
    setValues((prev) => ({ ...prev, [field]: value }))

  const missing = useMemo(() => missingVendorFields(values), [values])
  // Light format check on the optional Vendor ID: shown once it has been left or on submit
  const [vendorIdTouched, setVendorIdTouched] = useState(false)
  const vendorIdInvalid = !isVendorIdValid(values.vendorId)
  const showVendorIdError = vendorIdInvalid && (vendorIdTouched || showErrors)
  const isMissing = (field: keyof VendorFormValues) => showErrors && missing.includes(field)

  // While the check runs, there are no Ignore buttons and no Run AI check button, only Submit
  const openSuggestions = isChecking ? [] : (suggestions ?? [])
  const suggestionFor = (field: keyof VendorFormValues) =>
    openSuggestions.find((s) => s.field === field)

  // The AI check needs every required answer, and can be run once per session
  const checkDisabled = missing.length > 0 || hasRunCheck || isChecking
  const checkTip = hasRunCheck
    ? 'You have already used your AI check. It can be run once per session.'
    : missing.length > 0
      ? 'Complete all required fields to run the AI check. It can be run once per session.'
      : 'Runs once per session, so finish your answers first.'

  const handleRunCheck = () => {
    setHasRunCheck(true)
    setCheckStep(0)
    setIsChecking(true)
  }

  // The check takes a moment: three steps tick off, then the suggestions appear
  useEffect(() => {
    if (!isChecking) return
    if (checkStep >= CHECK_STEPS.length) {
      const done = setTimeout(() => {
        setSuggestions(runVendorFormCheck(values))
        setIsChecking(false)
      }, 500)
      return () => clearTimeout(done)
    }
    const next = setTimeout(() => setCheckStep((n) => n + 1), 650)
    return () => clearTimeout(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChecking, checkStep])

  // First click into an empty form fills it with what a vendor would typically enter
  const handleFocusCapture = (e: React.FocusEvent<HTMLElement>) => {
    const target = e.target as HTMLElement
    if (!target.matches('input, textarea, select, button#focusAreas')) return
    if (isFormEmpty(values)) setValues(SAMPLE_VENDOR_FORM)
  }

  const handleSubmit = () => {
    if (vendorIdInvalid && missing.length === 0) {
      setShowErrors(true)
      const el = document.getElementById('field-vendorId')
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }
    if (missing.length > 0) {
      setShowErrors(true)
      const el = document.getElementById(`field-${missing[0]}`)
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }
    setConfirming(true)
  }

  const handleConfirm = () => {
    setConfirming(false)
    setCaseId(onSubmitCase(values))
  }

  const reset = () => {
    setValues(EMPTY_VENDOR_FORM)
    setShowErrors(false)
    setSuggestions(null)
    setCaseId(null)
  }

  const textField = (
    field: 'name' | 'jobTitle' | 'company' | 'phone' | 'email' | 'yearFounded',
    label: string,
    opts: { required?: boolean; type?: string; placeholder?: string } = {}
  ) => (
    <Field id={field} label={label} required={opts.required} error={isMissing(field)}>
      <input
        id={field}
        type={opts.type ?? 'text'}
        value={values[field]}
        onChange={(e) => set(field, e.target.value)}
        placeholder={opts.placeholder}
        className={`${FIELD} h-10 px-3 ${isMissing(field) ? FIELD_ERROR : ''}`}
      />
    </Field>
  )

  const question = (key: keyof typeof QUESTIONS) => {
    const q = QUESTIONS[key]
    const field = q.field as 'stageAndExperience'
    return (
      <Field
        id={q.field}
        label={q.label}
        helper={q.helper}
        required={q.required}
        error={isMissing(q.field)}
        suggestion={suggestionFor(q.field)}
      >
        <textarea
          id={q.field}
          rows={q.rows}
          value={values[field]}
          onChange={(e) => set(field, e.target.value)}
          placeholder={q.placeholder}
          className={`${FIELD} p-3 leading-relaxed resize-none ${
            isMissing(q.field) ? FIELD_ERROR : ''
          }`}
        />
      </Field>
    )
  }

  const header = (
    <header className="w-full bg-white border-b border-[#e2e8f0] px-6 lg:px-10 py-3.5 flex items-center justify-between shrink-0 z-30">
      <div className="flex items-center gap-3">
        <img src="/dark-logo.png" alt="M42 logo" className="h-7 w-auto object-contain" />
        <span className="text-sm font-semibold text-[#0d212c]">Partnership request</span>
      </div>
    </header>
  )

  if (caseId) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-[#0d212c] font-sans antialiased flex flex-col">
        {header}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#e2e8f0] shadow-xs p-8 flex flex-col items-center text-center gap-5 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#10b981] flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-semibold">Request submitted</h1>
              <p className="text-sm text-[#64748b] leading-relaxed">
                Thank you. M42 will review your partnership request and get in touch.
              </p>
            </div>
            <div className="w-full rounded-xl bg-[#f0fdfa] border border-[#ccfbf1] py-4 flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wider text-[#64748b]">
                Your case ID
              </span>
              <span className="text-3xl font-semibold tracking-tight text-[#0f766e]">{caseId}</span>
            </div>
            <p className="text-xs text-[#64748b]">Keep this ID to follow up on your request.</p>
            <button
              type="button"
              onClick={reset}
              className="text-sm font-medium text-[#008a8a] hover:text-[#006e6e] hover:underline cursor-pointer"
            >
              Submit another request
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="h-dvh flex flex-col overflow-hidden bg-[#f8fafc] text-[#0d212c] font-sans antialiased">
      {header}

      <div className="relative flex-1 min-h-0 overflow-y-auto">
        <main
          onFocusCapture={handleFocusCapture}
          className="w-full max-w-[1400px] mx-auto px-6 lg:px-10 py-8 flex flex-col gap-6"
        >
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex flex-col gap-1.5 max-w-3xl">
              <h1 className="text-2xl font-semibold tracking-tight">Partnership request form</h1>
              <p className="text-sm text-[#64748b] leading-relaxed">
                Tell us about your company and solution. You can run an AI check to review your
                responses and get suggestions before you submit, to make them more complete and
                accurate.
              </p>
            </div>
            <div className="relative group shrink-0">
              <button
                type="button"
                onClick={handleRunCheck}
                disabled={checkDisabled}
                aria-describedby="run-check-tip"
                className="h-11 px-5 rounded-xl bg-[#e6f7f8] hover:bg-[#d5f0f2] text-sm font-semibold text-[#0f766e] disabled:opacity-60 disabled:hover:bg-[#e6f7f8] disabled:cursor-not-allowed cursor-pointer transition flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#36c0c9]" aria-hidden="true" />
                Run AI check
              </button>
              <div
                id="run-check-tip"
                role="tooltip"
                className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity absolute right-0 top-full mt-2 z-40 w-64 bg-[#0d212c] text-white text-[11px] font-medium leading-relaxed px-3 py-2 rounded-xl shadow-xl"
              >
                {checkTip}
              </div>
            </div>
          </div>

          {suggestions && (
            <div
              role="status"
              className={`rounded-lg border px-4 py-3.5 flex items-start gap-3 animate-in fade-in duration-300 ${
                openSuggestions.length > 0
                  ? 'bg-[#f0f9ff] border-[#bae6fd]'
                  : 'bg-emerald-50 border-emerald-200'
              }`}
            >
              {openSuggestions.length > 0 ? (
                <Sparkles className="w-5 h-5 text-[#0369a1] shrink-0" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-[#10b981] shrink-0" aria-hidden="true" />
              )}
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">
                  {openSuggestions.length > 0
                    ? `AI check found ${openSuggestions.length} ${
                        openSuggestions.length === 1 ? 'suggestion' : 'suggestions'
                      }`
                    : 'AI check found nothing to improve'}
                </span>
                <span className="text-xs text-[#475569] leading-relaxed">
                  {openSuggestions.length > 0
                    ? 'Update an answer or ignore the suggestion. You can still submit as it is.'
                    : 'Your answers look clear and complete.'}
                </span>
              </div>
            </div>
          )}

          {/* Company information */}
          <section className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs p-6 sm:p-8 flex flex-col gap-6">
            <h2 className="text-base font-semibold">Company Information</h2>
            <div className="flex flex-col gap-5">
              <div id="field-vendorId" className="flex flex-col gap-1.5 scroll-mt-24">
                <label
                  htmlFor="vendorId"
                  className="text-xs font-semibold text-text-primary leading-snug"
                >
                  Vendor ID (if a request was raised before)
                </label>
                <p id="vendorId-help" className="text-[11px] text-text-secondary leading-relaxed">
                  Leave empty if this is your first request.
                </p>
                <input
                  id="vendorId"
                  type="text"
                  value={values.vendorId}
                  onChange={(e) => set('vendorId', e.target.value)}
                  onBlur={() => setVendorIdTouched(true)}
                  placeholder="e.g. VND-012"
                  aria-invalid={showVendorIdError || undefined}
                  aria-describedby={
                    showVendorIdError ? 'vendorId-help vendorId-error' : 'vendorId-help'
                  }
                  className={`${FIELD} h-10 px-3 ${showVendorIdError ? FIELD_ERROR : ''}`}
                />
                {showVendorIdError && (
                  <span
                    id="vendorId-error"
                    className="text-[11px] text-text-error flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" aria-hidden="true" />
                    Use the format VND-123.
                  </span>
                )}
              </div>
              {textField('name', 'Vendor Name', {
                required: true,
                placeholder: 'Enter your full name',
              })}
              {textField('jobTitle', 'Job Title', {
                required: true,
                placeholder: 'e.g. Chief Executive Officer',
              })}
              {textField('company', 'Company Name', {
                required: true,
                placeholder: 'Enter your company name',
              })}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5">
                {textField('phone', 'Phone Number', {
                  type: 'tel',
                  placeholder: '+971 50 123 4567',
                })}
                {textField('email', 'Email Address', {
                  required: true,
                  type: 'email',
                  placeholder: 'name@company.com',
                })}
                {textField('yearFounded', 'Year Company Was Founded', {
                  required: true,
                  placeholder: 'e.g. 2018',
                })}
              </div>
            </div>
          </section>

          {/* Key assessment areas */}
          <section className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs p-6 sm:p-8 flex flex-col gap-7">
            <h2 className="text-base font-semibold">Key Assessment Areas</h2>

            {question('stageAndExperience')}
            {question('proposal')}

            <Field
              id="focusAreas"
              label="Which Focus Area does your solution address?"
              helper="Select the primary area your solution addresses. These focus areas align with M42 transformation and innovation priorities. Select all that apply."
              required
              error={isMissing('focusAreas')}
              suggestion={suggestionFor('focusAreas')}
            >
              <FocusAreaSelect
                id="focusAreas"
                value={values.focusAreas}
                onChange={(next) => set('focusAreas', next)}
                error={isMissing('focusAreas')}
              />
            </Field>

            {question('maturityAndRegulatory')}
            {question('relevantApprovals')}
            {question('novelty')}

            <Field
              id="developmentApproach"
              label="If applicable, was the solution developed entirely by your team or in collaboration with external partners?"
              helper="Understand whether the solution was developed internally, co-developed with partners or built using third-party technologies or platforms. Indicate the primary development approach."
            >
              <div className="relative">
                <select
                  id="developmentApproach"
                  value={values.developmentApproach}
                  onChange={(e) => set('developmentApproach', e.target.value)}
                  className={`${FIELD} h-10 appearance-none pl-3 pr-10 cursor-pointer`}
                >
                  <option value="">Select an option</option>
                  {DEVELOPMENT_APPROACH_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                />
              </div>
            </Field>

            {question('resources')}

            <Field
              id="populations"
              label="If applicable, which patient populations, clinical areas, or operational workflows will be impacted?"
              helper="Identify who or what will be directly affected by your solution (patients, clinical teams, care pathways or administrative workflows) to help assess relevance and scope."
              suggestion={suggestionFor('populations')}
            >
              <div
                id="populations"
                role="group"
                aria-label="Patient populations"
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
              >
                {POPULATION_OPTIONS.map((pop) => {
                  const checked = values.populations.includes(pop)
                  return (
                    <label
                      key={pop}
                      className="px-3.5 py-2.5 rounded-lg border border-[#d6dee6] bg-white flex items-center gap-2.5 text-sm cursor-pointer hover:border-[#bcc7d3]"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          set(
                            'populations',
                            checked
                              ? values.populations.filter((p) => p !== pop)
                              : [...values.populations, pop]
                          )
                        }
                        className="peer sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition peer-focus-visible:ring-2 peer-focus-visible:ring-[#36c0c9]/40 ${
                          checked
                            ? 'bg-[#36c0c9] border-[#36c0c9] text-white'
                            : 'bg-white border-slate-300'
                        }`}
                      >
                        {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </span>
                      {pop}
                    </label>
                  )
                })}
              </div>
            </Field>
          </section>
        </main>
      </div>

      <footer className="shrink-0 bg-white border-t border-[#e2e8f0] shadow-[0_-4px_12px_rgba(15,23,42,0.04)]">
        <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-10 py-3.5 flex items-center justify-between gap-3 flex-wrap">
          {showErrors && missing.length > 0 && (
            <div
              role="alert"
              className="order-last w-full sm:order-none sm:w-auto sm:flex-1 text-xs font-medium text-red-700 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              Please fill in the required fields marked with *.
            </div>
          )}
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCancelling(true)}
              className="h-11 px-6 rounded-xl border border-[#cbd5e1] bg-white hover:bg-slate-50 text-sm font-semibold text-[#0d212c] cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={missing.length > 0}
              onClick={handleSubmit}
              className="h-11 px-6 rounded-xl bg-[#36c0c9] hover:bg-[#2fb0b9] text-white text-sm font-semibold shadow-xs cursor-pointer transition disabled:opacity-50 disabled:hover:bg-[#36c0c9] disabled:cursor-not-allowed"
            >
              Submit request
            </button>
          </div>
        </div>
      </footer>

      {isChecking && (
        <div className="fixed inset-0 z-50 bg-[#0d212c]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            role="status"
            aria-live="polite"
            className="bg-white rounded-3xl max-w-sm w-full px-8 pt-9 pb-8 shadow-2xl flex flex-col items-center text-center gap-5 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-[#36c0c9]/20 animate-ping" />
              <div className="relative w-14 h-14 rounded-2xl bg-[#ecf8f9] text-[#36c0c9] flex items-center justify-center">
                <Sparkles className="w-7 h-7" aria-hidden="true" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-semibold tracking-tight text-[#0d212c]">
                Running AI check
              </h3>
              <p className="text-sm text-[#64748b]">
                Looking at your answers the way a reviewer would.
              </p>
            </div>
            <ul className="w-full flex flex-col gap-2.5 text-left">
              {CHECK_STEPS.map((label, i) => {
                const state = checkStep > i ? 'done' : checkStep === i ? 'active' : 'pending'
                return (
                  <li
                    key={label}
                    data-state={state}
                    className={`flex items-center gap-3 text-sm transition-opacity duration-300 ${
                      state === 'pending' ? 'opacity-40' : ''
                    }`}
                  >
                    <span className="w-5 h-5 flex items-center justify-center shrink-0">
                      {state === 'done' ? (
                        <Check
                          className="w-4 h-4 text-[#10b981] stroke-[3] animate-in zoom-in-50 duration-300"
                          aria-hidden="true"
                        />
                      ) : state === 'active' ? (
                        <Loader2
                          className="w-4 h-4 animate-spin text-[#36c0c9]"
                          aria-hidden="true"
                        />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-[#cbd5e1]" aria-hidden="true" />
                      )}
                    </span>
                    <span className="text-[#0d212c]">{label}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}

      {cancelling && (
        <ConfirmDialog
          danger
          icon={AlertCircle}
          title="Cancel this request?"
          description="You will lose the information you have filled in. Are you sure you want to cancel and exit?"
          cancelLabel="Keep editing"
          confirmLabel="Yes, cancel"
          onConfirm={() => {
            setCancelling(false)
            if (onSignOut) onSignOut()
            else reset()
          }}
          onCancel={() => setCancelling(false)}
        />
      )}

      {confirming && (
        <ConfirmDialog
          title="Submit your request?"
          description={
            <>
              Your answers will be sent to M42 for review. You will not be able to edit them after
              submitting.
              {openSuggestions.length > 0 &&
                ` ${openSuggestions.length} AI ${
                  openSuggestions.length === 1 ? 'suggestion is' : 'suggestions are'
                } still open.`}
            </>
          }
          cancelLabel="Review again"
          confirmLabel="Submit request"
          icon={Send}
          onConfirm={handleConfirm}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  )
}
