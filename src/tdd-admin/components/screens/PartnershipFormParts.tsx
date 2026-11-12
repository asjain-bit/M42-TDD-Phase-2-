'use client'

import React, { useEffect, useId } from 'react'
import { Check, Info, X } from 'lucide-react'
import type { VersionStatus } from './partnershipForm.data'

interface SwitchProps {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  disabled?: boolean
  title?: string
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  title,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    title={title}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative w-10 h-6 rounded-full shrink-0 transition-colors cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#36c0c9]/40 border-0 ${
      checked ? 'bg-[#36c0c9]' : 'bg-[#cbd5e1]'
    } ${disabled ? 'opacity-50' : ''}`}
  >
    <span
      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
        checked ? 'translate-x-4' : ''
      }`}
    />
  </button>
)

interface CheckboxProps {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  /** Accessible name, when the visible label is not specific enough */
  ariaLabel?: string
  disabled?: boolean
  hint?: React.ReactNode
  /** Shown in a tooltip when hovering or focusing the checkbox */
  tooltip?: string
  /** Weight of the label; medium by default, one step lighter than the form's headings */
  labelClassName?: string
}

/** Checkbox styled like the vendor form's checkboxes */
export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  ariaLabel,
  disabled = false,
  hint,
  labelClassName = 'font-medium',
  tooltip,
}) => (
  <label
    className={`group/cb relative inline-flex items-start gap-2.5 text-xs text-[#0d212c] ${
      disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
    }`}
  >
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.checked)}
      className="peer sr-only"
    />
    <span
      aria-hidden="true"
      className={`w-[18px] h-[18px] mt-px rounded-md border flex items-center justify-center shrink-0 transition peer-focus-visible:ring-2 peer-focus-visible:ring-[#36c0c9]/40 ${
        checked ? 'bg-[#36c0c9] border-[#36c0c9] text-white' : 'bg-white border-slate-300'
      }`}
    >
      {checked && <Check className="w-3 h-3 stroke-[3]" />}
    </span>
    <span className="flex flex-col gap-0.5">
      <span className={labelClassName}>{label}</span>
      {hint && <span className="text-[11px] font-normal text-[#64748b]">{hint}</span>}
    </span>
    {tooltip && (
      <span
        role="tooltip"
        className="pointer-events-none opacity-0 group-hover/cb:opacity-100 peer-focus-visible:opacity-100 transition-opacity absolute left-0 top-full mt-1.5 z-30 w-max max-w-56 px-2.5 py-1.5 bg-[#0d212c] text-white text-[11px] font-medium leading-relaxed rounded-lg shadow-xl"
      >
        {tooltip}
      </span>
    )}
  </label>
)

const STATUS_STYLES: Record<VersionStatus, string> = {
  live: 'bg-[#dcfce7] text-[#15803d]',
  draft: 'bg-[#fef3c7] text-[#b45309]',
  archived: 'bg-[#f1f5f9] text-[#64748b]',
}

export const STATUS_LABELS: Record<VersionStatus, string> = {
  live: 'Live',
  draft: 'Draft',
  archived: 'Archived',
}

export const VersionStatusChip: React.FC<{ status: VersionStatus }> = ({ status }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${STATUS_STYLES[status]}`}
  >
    {STATUS_LABELS[status]}
  </span>
)

/** Stops the page behind an open dialog from scrolling; returns the undo */
export const lockPageScroll = () => {
  const { body, documentElement } = document
  const previous = [body.style.overflow, documentElement.style.overflow]
  body.style.overflow = 'hidden'
  documentElement.style.overflow = 'hidden'
  return () => {
    body.style.overflow = previous[0]
    documentElement.style.overflow = previous[1]
  }
}

interface ModalProps {
  title: string
  description?: React.ReactNode
  onClose: () => void
  children: React.ReactNode
  footer: React.ReactNode
  /** Widest the dialog can be */
  maxWidth?: string
  /** Shown in a tooltip behind an info icon next to the title */
  info?: string
}

/** Dialog with a fixed header and footer; the body scrolls. Escape and the backdrop close it. */
export const Modal: React.FC<ModalProps> = ({
  title,
  description,
  onClose,
  children,
  footer,
  maxWidth = 'max-w-lg',
  info,
}) => {
  const titleId = useId()

  // The page behind the dialog must not scroll
  useEffect(() => lockPageScroll(), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#0d212c]/40 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative w-full ${maxWidth} max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150`}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h3 id={titleId} className="text-base font-bold text-[#0d212c]">
                {title}
              </h3>
              {info && (
                <span className="relative group inline-flex">
                  <button
                    type="button"
                    aria-label={`About ${title.toLowerCase()}`}
                    className="text-[#94a3b8] hover:text-[#0d212c] transition cursor-pointer bg-transparent border-0 p-0 inline-flex"
                  >
                    <Info className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <span
                    role="tooltip"
                    className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity absolute left-0 top-full mt-2 z-30 w-64 p-2.5 bg-[#0d212c] text-white text-[11px] font-medium leading-relaxed rounded-xl shadow-xl"
                  >
                    {info}
                  </span>
                </span>
              )}
            </div>
            {description && <p className="text-xs text-[#64748b] leading-relaxed">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 -mr-2 -mt-1 rounded-lg flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0d212c] transition cursor-pointer bg-transparent border-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 pb-5 overflow-y-auto flex flex-col gap-5">{children}</div>
        <div className="px-6 py-4 flex items-center justify-end gap-3 bg-[#f8fafc] rounded-b-2xl">
          {footer}
        </div>
      </div>
    </div>
  )
}

export const FIELD_CLASS =
  'w-full px-3.5 py-2.5 rounded-md border border-[#e2e8f0] bg-white text-sm text-[#0d212c] outline-none transition placeholder:text-[#94a3b8] hover:border-[#cbd5e1] focus:border-[#36c0c9] disabled:bg-[#f8fafc] disabled:text-[#64748b] disabled:cursor-not-allowed'

export const SECONDARY_BUTTON =
  'h-10 px-4 rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] text-xs font-semibold text-[#0d212c] inline-flex items-center justify-center gap-2 transition cursor-pointer shadow-xs'

export const PRIMARY_BUTTON =
  'h-10 px-4 rounded-lg bg-[#0d212c] hover:bg-[#122e3d] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition cursor-pointer border-0 shadow-xs'

/** The light primary button: Publish and saving a question */
export const LIGHT_PRIMARY_BUTTON =
  'h-10 px-4 rounded-lg bg-[#36c0c9] hover:bg-[#2badb6] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition cursor-pointer border-0 shadow-xs'

/** Text and icon in the light primary colour, with no fill and no stroke */
export const TERTIARY_BUTTON =
  'h-10 px-2 rounded-lg bg-transparent hover:bg-transparent text-[#36c0c9] hover:text-[#2badb6] text-xs font-semibold inline-flex items-center justify-center gap-2 transition cursor-pointer border-0'

/** The radio mark: a filled light primary circle with a white dot when chosen, an empty ring when not */
export const RadioMark: React.FC<{ checked: boolean }> = ({ checked }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 20 20"
    className="w-5 h-5 mt-px shrink-0 transition peer-focus-visible:ring-2"
  >
    {checked ? (
      <>
        <circle cx="10" cy="10" r="10" fill="#36c0c9" />
        <circle cx="10" cy="10" r="4" fill="#ffffff" />
      </>
    ) : (
      <circle cx="10" cy="10" r="9" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
    )}
  </svg>
)
