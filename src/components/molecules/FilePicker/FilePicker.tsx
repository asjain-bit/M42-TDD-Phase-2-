'use client'

/**
 * FilePicker — Molecule
 * Dashed drop area with a Browse button. Files are handed over by name only (prototype).
 * Used in: NdaStage, DiscoveryCallStage, ValueDueDiligenceStage
 */

import React, { useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'
import type { FilePickerProps } from './FilePicker.types'

const extensionOf = (name: string) => `.${name.split('.').pop()?.toLowerCase() ?? ''}`

export const FilePicker: React.FC<FilePickerProps> = ({
  label,
  hint,
  accept,
  onPick,
  onPickFiles,
  maxSizeMb,
  multiple = false,
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const allowed = accept.split(',').map((a) => a.trim().toLowerCase())

  const take = (list: FileList | File[]) => {
    const files = Array.from(list)
    const typed = files.filter((f) => allowed.includes(extensionOf(f.name)))
    const ok = maxSizeMb ? typed.filter((f) => f.size <= maxSizeMb * 1024 * 1024) : typed
    setError(
      typed.length < files.length
        ? `Only ${allowed.join(', ')} files can be added here.`
        : ok.length < typed.length
          ? `Each file can be up to ${maxSizeMb} MB.`
          : ''
    )
    if (ok.length === 0) return
    onPick?.(ok.map((f) => f.name))
    onPickFiles?.(ok)
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`.trim()}>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          take(e.dataTransfer.files)
        }}
        className={`rounded-xl border border-dashed px-5 py-6 flex flex-col items-center gap-2 text-center transition ${
          dragging ? 'border-[#36c0c9] bg-[#f0fdfa]' : 'border-[#cbd5e1] bg-white'
        }`}
      >
        <UploadCloud className="w-5 h-5 text-[#36c0c9]" aria-hidden="true" />
        <span className="text-sm font-semibold text-[#0d212c]">{label}</span>
        {hint && <span className="text-xs text-[#64748b]">{hint}</span>}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="h-9 px-4 rounded-lg border border-[#cbd5e1] bg-white text-sm font-semibold text-[#0d212c] hover:bg-slate-50 cursor-pointer transition"
        >
          Browse files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          aria-label={label}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) take(e.target.files)
            e.target.value = ''
          }}
        />
      </div>
      {error && (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
