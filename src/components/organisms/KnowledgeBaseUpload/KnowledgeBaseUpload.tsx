'use client'

/**
 * KnowledgeBaseUpload — Organism
 * The Strategy Team's "Prepare Pre-read Summary" screen: an upload area whose Browse files opens
 * the Add supporting documents popup, the documents added so far, and Generate Summary.
 * Used in: PartnershipDetail
 */

import React, { useState } from 'react'
import { FileUp, Info, X } from 'lucide-react'
import { AddDocumentsModal } from '@/components/organisms/AddDocumentsModal'
import {
  fileTypeLabel,
  formatFileSize,
} from '@/components/organisms/AddDocumentsModal/AddDocumentsModal'
import { FileTypeIcon } from './FileTypeIcon'
import type { KnowledgeBaseUploadProps } from './KnowledgeBaseUpload.types'

export const KnowledgeBaseUpload: React.FC<KnowledgeBaseUploadProps> = ({
  files,
  onFilesChange,
  onGenerate,
  onCancel,
  className = '',
}) => {
  const [adding, setAdding] = useState(false)

  return (
    <div className={`flex flex-col gap-6 w-full ${className}`.trim()}>
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-[#0d212c]">Prepare Pre-read Summary</h2>
        <p className="text-sm text-[#64748b] leading-relaxed">
          These documents are in the knowledge base now. Remove any you do not need, or upload more
          to help the agent generate the pre-read summary.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-white px-6 py-14 flex flex-col items-center gap-3 text-center">
        <span className="w-14 h-14 rounded-full bg-[#e6fffa] text-[#00a8b0] flex items-center justify-center">
          <FileUp className="w-7 h-7" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1">
          <span className="text-base font-semibold text-[#0d212c]">
            Upload supporting documents
          </span>
          <span className="text-sm text-[#64748b]">
            Add roadmap, portfolio, strategy, or policy documents to help generate the pre-read
            summary.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="h-12 px-8 rounded-lg border border-[#00a8b0] bg-white text-sm font-semibold text-[#008a8a] hover:bg-[#f0fdfa] cursor-pointer transition"
        >
          Browse files
        </button>
        <span className="text-xs text-[#64748b]">PDF, DOCX, XLSX · Max 20 MB per file</span>
      </div>

      {files.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-[#0d212c]">
            Knowledge base documents{' '}
            <span className="font-normal text-[#64748b]">({files.length})</span>
          </h3>
          <ul
            aria-label="Knowledge base documents"
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3"
          >
            {files.map((f) => (
              <li
                key={f.name}
                className="flex items-center gap-3 px-3 py-3 rounded-xl border border-[#e2e8f0] bg-white"
              >
                <span className="w-11 h-11 rounded-lg border border-[#e2e8f0] flex items-center justify-center shrink-0">
                  <FileTypeIcon name={f.name} className="w-6 h-6" />
                </span>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold text-[#0d212c] truncate" title={f.name}>
                    {f.name}
                  </span>
                  <span className="text-xs text-[#64748b]">
                    {fileTypeLabel(f.name)} · {formatFileSize(f.size)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onFilesChange(files.filter((x) => x.name !== f.name))}
                  aria-label={`Remove ${f.name}`}
                  className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer transition shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-3 px-1 py-2 text-sm text-[#475569]">
        <Info className="w-5 h-5 shrink-0 text-slate-400" aria-hidden="true" />
        <span>
          Only the documents selected here will be used. The agent will analyse the uploaded
          documents to generate the pre-read summary.
        </span>
      </div>

      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="h-12 px-8 rounded-lg border border-[#e2e8f0] bg-white text-sm font-semibold text-[#0d212c] hover:bg-slate-50 cursor-pointer transition"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={onGenerate}
          className="h-12 px-8 rounded-lg bg-[#00a8b0] hover:bg-[#009199] text-sm font-semibold text-white shadow-xs cursor-pointer transition"
        >
          Generate Summary
        </button>
      </div>

      {adding && (
        <AddDocumentsModal
          onClose={() => setAdding(false)}
          onAdd={(picked) => {
            const fresh = picked.filter((p) => !files.some((f) => f.name === p.name))
            onFilesChange([...files, ...fresh])
            setAdding(false)
          }}
        />
      )}
    </div>
  )
}
