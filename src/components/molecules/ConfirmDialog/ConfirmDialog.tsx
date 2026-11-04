'use client'

/**
 * ConfirmDialog — Molecule
 * Centered confirmation popup: icon, title, short explanation and two equal buttons.
 * One design for every "are you sure" moment in the app.
 * Used in: PartnershipDetail, VendorWebForm
 */

import React, { useEffect, useId } from 'react'
import { Send, X } from 'lucide-react'
import type { ConfirmDialogProps } from './ConfirmDialog.types'

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  icon: Icon = Send,
  children,
  confirmDisabled = false,
  hideCancel = false,
  danger = false,
  onConfirm,
  onCancel,
}) => {
  const titleId = useId()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-[60] bg-[#0d212c]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto px-6 sm:px-8 pt-10 pb-7 shadow-2xl flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close dialog"
          className="absolute top-5 right-5 text-[#94a3b8] hover:text-[#0d212c] p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            danger ? 'bg-red-50 text-red-600' : 'bg-[#ecf8f9] text-[#36c0c9]'
          }`}
        >
          <Icon className="w-7 h-7" />
        </div>

        <div className="flex flex-col gap-2">
          <h3 id={titleId} className="text-2xl font-semibold tracking-tight text-[#0d212c]">
            {title}
          </h3>
          <div className="text-sm text-[#64748b] leading-relaxed">{description}</div>
        </div>

        {children && <div className="w-full text-left">{children}</div>}

        <div className={`grid gap-3 w-full pt-2 ${hideCancel ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {!hideCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="h-12 rounded-lg border border-[#e2e8f0] bg-white text-sm font-semibold text-[#0d212c] hover:bg-slate-50 transition cursor-pointer"
            >
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            disabled={confirmDisabled}
            onClick={onConfirm}
            className={`h-12 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-lg transition cursor-pointer ${
              danger
                ? 'bg-red-600 hover:bg-red-700 shadow-red-600/25'
                : 'bg-[#36c0c9] hover:bg-[#2fb0b9] shadow-[#36c0c9]/25'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
