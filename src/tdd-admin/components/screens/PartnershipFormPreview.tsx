'use client'

import React, { useEffect, useState } from 'react'
import { ChevronDown, Sparkles, X } from 'lucide-react'
import { CountrySelect } from '@/components/molecules/CountrySelect'
import { FocusAreaSelect } from '@/components/molecules/FocusAreaSelect'
import { Check } from 'lucide-react'
import { STATUS_LABELS, lockPageScroll } from './PartnershipFormParts'
import type {
  CompanyField,
  CompanyFieldKey,
  FormQuestion,
  FormVersion,
} from './partnershipForm.data'

// Same look as the vendor web form (VendorWebForm)
const FIELD =
  'w-full rounded-lg border border-[#d6dee6] bg-white text-sm text-[#0d212c] placeholder:text-[#9aa8b5] shadow-2xs transition focus:outline-none hover:border-[#bcc7d3] focus:border-[#a3b1c2] focus:ring-0'

const PLACEHOLDERS: Record<CompanyFieldKey, string> = {
  vendorId: 'e.g. VND-012',
  vendorName: 'Enter your full name',
  jobTitle: 'e.g. Chief Executive Officer',
  companyName: 'Enter your company name',
  phone: '+971 50 123 4567',
  email: 'name@company.com',
  yearFounded: 'e.g. 2018',
  website: 'https://www.company.com',
  country: 'e.g. United Arab Emirates',
}

const INPUT_TYPES: Partial<Record<CompanyFieldKey, string>> = {
  phone: 'tel',
  email: 'email',
  website: 'url',
}

/** Past this many options a multi-select becomes a dropdown list, like the Focus Area question */
const CHECKBOX_LIMIT = 6

const Field: React.FC<{
  id: string
  label: string
  helper?: string
  required?: boolean
  children: React.ReactNode
}> = ({ id, label, helper, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-xs font-semibold text-[#0d212c] leading-snug">
      {label}
      {required && <span className="text-red-500 font-semibold"> *</span>}
    </label>
    {helper && <p className="text-[11px] text-[#64748b] leading-relaxed">{helper}</p>}
    {children}
  </div>
)

interface PartnershipFormPreviewProps {
  version: FormVersion
  onClose: () => void
}

/** The form as vendors see it, in the vendor web form's layout. Nothing typed here is saved. */
export const PartnershipFormPreview: React.FC<PartnershipFormPreviewProps> = ({
  version,
  onClose,
}) => {
  const [multi, setMulti] = useState<Record<string, string[]>>({})
  const [country, setCountry] = useState('')

  useEffect(() => lockPageScroll(), [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const shown = (key: CompanyFieldKey) =>
    version.companyFields.find((f) => f.key === key && f.visible)
  const textField = (field: CompanyField | undefined) =>
    field &&
    (field.key === 'country' ? (
      <Field
        key={field.key}
        id={`pv-${field.key}`}
        label={field.label}
        helper={field.helper}
        required={field.required}
      >
        <CountrySelect id={`pv-${field.key}`} value={country} onChange={setCountry} />
      </Field>
    ) : (
      <Field
        key={field.key}
        id={`pv-${field.key}`}
        label={field.label}
        helper={field.helper}
        required={field.required}
      >
        <input
          id={`pv-${field.key}`}
          type={INPUT_TYPES[field.key] ?? 'text'}
          placeholder={PLACEHOLDERS[field.key]}
          className={`${FIELD} h-10 px-3`}
        />
      </Field>
    ))
  const row = (['phone', 'email', 'yearFounded'] as const).map((key) => shown(key))
  const lastRow = (['website', 'country'] as const).map((key) => shown(key))

  const question = (q: FormQuestion) => {
    const id = `pv-${q.id}`
    return (
      <Field key={q.id} id={id} label={q.label} helper={q.helper} required={q.required}>
        {q.type === 'long' && (
          <textarea
            id={id}
            rows={4}
            placeholder={q.placeholder}
            className={`${FIELD} p-3 leading-relaxed resize-none`}
          />
        )}
        {q.type === 'short' && (
          <input id={id} type="text" placeholder={q.placeholder} className={`${FIELD} h-10 px-3`} />
        )}
        {q.type === 'dropdown' && (
          <div className="relative">
            <select id={id} className={`${FIELD} h-10 appearance-none pl-3 pr-10 cursor-pointer`}>
              <option value="">Select an option</option>
              {q.options.map((o) => (
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
        )}
        {q.type === 'multi' && q.options.length > CHECKBOX_LIMIT && (
          <FocusAreaSelect
            id={id}
            value={multi[q.id] ?? []}
            onChange={(next) => setMulti((prev) => ({ ...prev, [q.id]: next }))}
            options={q.options}
            placeholder="Select options"
            listLabel={q.label}
          />
        )}
        {q.type === 'multi' && q.options.length <= CHECKBOX_LIMIT && (
          <div
            id={id}
            role="group"
            aria-label={q.label}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            {q.options.map((option) => {
              const checked = (multi[q.id] ?? []).includes(option)
              return (
                <label
                  key={option}
                  className="px-3.5 py-2.5 rounded-lg border border-[#d6dee6] bg-white flex items-center gap-2.5 text-sm cursor-pointer hover:border-[#bcc7d3]"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setMulti((prev) => ({
                        ...prev,
                        [q.id]: checked
                          ? (prev[q.id] ?? []).filter((o) => o !== option)
                          : [...(prev[q.id] ?? []), option],
                      }))
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
                  {option}
                </label>
              )
            })}
          </div>
        )}
      </Field>
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Vendor form preview"
      className="fixed inset-0 z-[70] h-dvh flex flex-col overflow-hidden bg-[#f8fafc] text-[#0d212c] font-sans antialiased"
    >
      <div className="shrink-0 bg-[#0d212c] text-white px-6 lg:px-10 py-2.5 flex items-center justify-between gap-4">
        <span className="text-xs font-medium">
          Previewing Version {version.number} ({STATUS_LABELS[version.status]}). Nothing you enter
          here is saved.
        </span>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-[#36c0c9] transition cursor-pointer bg-transparent border-0"
        >
          <X className="w-4 h-4" />
          Close preview
        </button>
      </div>

      <header className="w-full bg-white border-b border-[#e2e8f0] px-6 lg:px-10 py-3.5 flex items-center shrink-0">
        <div className="flex items-center gap-3">
          <img src="/dark-logo.png" alt="M42 logo" className="h-7 w-auto object-contain" />
          <span className="text-sm font-semibold">Partnership request</span>
        </div>
      </header>

      <div className="relative flex-1 min-h-0 overflow-y-auto">
        <main className="w-full max-w-[1400px] mx-auto px-6 lg:px-10 py-8 flex flex-col gap-6">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex flex-col gap-1.5 max-w-3xl">
              <h1 className="text-2xl font-semibold tracking-tight">Partnership request form</h1>
              <p className="text-sm text-[#64748b] leading-relaxed">
                Tell us about your company and solution. You can run an AI check to review your
                responses and get suggestions before you submit, to make them more complete and
                accurate.
              </p>
            </div>
            <button
              type="button"
              disabled
              className="h-11 px-5 rounded-lg bg-[#e6f7f8] text-sm font-semibold text-[#0f766e] opacity-60 cursor-not-allowed flex items-center gap-2 shrink-0"
            >
              <Sparkles className="w-4 h-4 text-[#36c0c9]" aria-hidden="true" />
              Run AI check
            </button>
          </div>

          <section className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs p-6 sm:p-8 flex flex-col gap-6">
            <h2 className="text-base font-semibold">Company Information</h2>
            <div className="flex flex-col gap-5">
              {textField(shown('vendorId'))}
              {textField(shown('vendorName'))}
              {textField(shown('jobTitle'))}
              {textField(shown('companyName'))}
              {row.some(Boolean) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-5">
                  {row.map((field) => textField(field))}
                </div>
              )}
              {lastRow.some(Boolean) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                  {lastRow.map((field) => textField(field))}
                </div>
              )}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs p-6 sm:p-8 flex flex-col gap-7">
            <h2 className="text-base font-semibold">Key Assessment Areas</h2>
            {version.questions.length === 0 && (
              <p className="text-xs text-[#64748b]">This version has no assessment questions.</p>
            )}
            {version.questions.map(question)}
          </section>
        </main>
      </div>

      <footer className="shrink-0 bg-white border-t border-[#e2e8f0] shadow-[0_-4px_12px_rgba(15,23,42,0.04)]">
        <div className="w-full max-w-[1400px] mx-auto px-6 lg:px-10 py-3.5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-6 rounded-lg border border-[#cbd5e1] bg-white hover:bg-slate-50 text-sm font-semibold cursor-pointer transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled
            title="Submitting is switched off in the preview"
            className="h-11 px-6 rounded-lg bg-[#36c0c9] text-white text-sm font-semibold opacity-50 cursor-not-allowed"
          >
            Submit request
          </button>
        </div>
      </footer>
    </div>
  )
}
