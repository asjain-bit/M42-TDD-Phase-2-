'use client'

/**
 * UploadSignedNdaModal — Organism
 * Popup for the signed NDA: drag and drop or browse, one PDF or Word file up to 20 MB, shown
 * with its size before it is uploaded. The upload becomes the next version of the NDA.
 * Used in: NdaStage
 */

import React, { useEffect, useId, useRef, useState } from 'react'
import { FileText, FileUp, X } from 'lucide-react'
import type { UploadSignedNdaModalProps } from './UploadSignedNdaModal.types'

const ALLOWED = ['pdf', 'doc', 'docx']
const MAX_BYTES = 20 * 1024 * 1024

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`

export const UploadSignedNdaModal: React.FC<UploadSignedNdaModalProps> = ({
  nextVersion,
  onUpload,
  onClose,
}) => {
  const [file, setFile] = useState<{ name: string; size: number } | null>(null)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const titleId = useId()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const take = (list: FileList | File[]) => {
    const picked = Array.from(list)[0]
    if (!picked) return
    const ext = picked.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED.includes(ext)) {
      setError('Only PDF or Word files can be uploaded.')
      return
    }
    if (picked.size > MAX_BYTES) {
      setError('The file is larger than 20 MB.')
      return
    }
    setError('')
    setFile({ name: picked.name, size: picked.size })
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0d212c]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4 shrink-0">
          <div>
            <h3 id={titleId} className="text-lg font-semibold text-[#0d212c]">
              Upload signed NDA
            </h3>
            <p className="text-xs text-[#64748b] mt-1">
              Upload the fully executed NDA signed by the vendor
              {nextVersion > 1
                ? ` to replace the current copy (it becomes version ${nextVersion})`
                : ''}
              . It is required to continue to the Discovery Call.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close upload"
            className="text-[#94a3b8] hover:text-[#0d212c] p-1 rounded-lg hover:bg-slate-100 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4 flex flex-col gap-3">
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
            className={`rounded-xl border border-dashed px-5 py-7 flex flex-col items-center gap-3 text-center transition ${
              dragging ? 'border-[#36c0c9] bg-[#f0fdfa]' : 'border-[#cbd5e1] bg-white'
            }`}
          >
            <span className="w-11 h-11 rounded-full bg-[#e6fffa] text-[#36c0c9] flex items-center justify-center">
              <FileUp className="w-5 h-5" aria-hidden="true" />
            </span>
            <span className="text-sm text-[#0d212c]">
              Drag and drop the signed document here, or{' '}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-[#0369a1] hover:underline cursor-pointer"
              >
                browse files
              </button>
            </span>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="h-9 px-5 rounded-lg border border-[#36c0c9] bg-white text-sm font-semibold text-[#0f766e] hover:bg-[#f0fdfa] cursor-pointer transition"
            >
              Browse files
            </button>
            <span className="text-xs text-[#64748b]">PDF · DOCX · Max 20 MB</span>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              aria-label="Signed NDA file"
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

          {file && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#e2e8f0] bg-white">
              <FileText className="w-6 h-6 text-red-500 shrink-0" aria-hidden="true" />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium text-[#0d212c] truncate">{file.name}</span>
                <span className="text-xs text-[#64748b]">{formatSize(file.size)}</span>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                aria-label={`Remove ${file.name}`}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#f1f5f9] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-lg border border-[#e2e8f0] bg-white text-sm font-semibold text-[#0d212c] hover:bg-slate-50 cursor-pointer transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!file}
            onClick={() => file && onUpload(file.name)}
            className="h-10 px-5 rounded-lg bg-[#00a8b0] hover:bg-[#009199] disabled:bg-slate-300 disabled:cursor-not-allowed text-sm font-semibold text-white transition cursor-pointer"
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  )
}
