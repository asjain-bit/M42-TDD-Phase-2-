'use client'

/**
 * NdaStage — Organism
 * The NDA stage fills the page height with the action bar fixed at the bottom. The Director sees
 * the template as a file card (Preview opens the document viewer), acknowledges the vendor's
 * signature and uploads the signed copy. After that, everyone sees the signed NDA as a file card
 * with its versions; Proceed opens the Discovery Call stage, which needs the signed NDA
 * (hasSignedNda). The alignment pack is not shown here.
 * Used in: PartnershipDetail
 */

import React, { useEffect, useId, useRef, useState } from 'react'
import { AlertCircle, ChevronDown, Download, Eye, Upload, X } from 'lucide-react'
import { NdaExecutionForm } from '@/components/organisms/NdaExecutionForm'
import { UploadSignedNdaModal } from '@/components/organisms/UploadSignedNdaModal'
import { Button } from '@/components/atoms/Button'
import { Checkbox } from '@/components/atoms/Checkbox'
import { StageFooter } from '@/components/molecules/StageFooter'
import type { NdaStageProps } from './NdaStage.types'

export const NDA_TEMPLATE_URL = '/ADHDS-NDA-Execution-Form-v1.0.docx'
const NDA_TEMPLATE_NAME = 'ADHDS-NDA-Execution-Form-v1.0.docx'
const NDA_TEMPLATE_SIZE = '188 KB'
/** A4 is 210 x 297 mm */
const A4_RATIO = 297 / 210

/** A tiny page with text lines, standing in for the document's first page */
const PageThumbnail: React.FC = () => (
  <span
    aria-hidden="true"
    className="w-10 h-[52px] shrink-0 rounded-[3px] border border-border-default bg-bg-default shadow-xs px-1.5 py-2 flex flex-col gap-1"
  >
    <span className="h-1 w-3/4 rounded-full bg-border-strong" />
    {[0, 1, 2, 3, 4].map((i) => (
      <span key={i} className="h-0.5 w-full rounded-full bg-border-default" />
    ))}
    <span className="h-0.5 w-2/3 rounded-full bg-border-default" />
  </span>
)

/** One NDA version as a file: thumbnail, name, what it is, and Preview */
const NdaFileCard: React.FC<{ fileName: string; meta: string; onPreview: () => void }> = ({
  fileName,
  meta,
  onPreview,
}) => (
  <div className="flex items-center gap-4 rounded-xl border border-border-default bg-bg-default px-4 py-3">
    <PageThumbnail />
    <div className="flex flex-col min-w-0 flex-1">
      <span className="text-sm font-medium text-text-primary truncate">{fileName}</span>
      <span className="text-xs text-text-tertiary">{meta}</span>
    </div>
    <Button variant="outline" size="sm" onClick={onPreview} className="gap-1.5 shrink-0">
      <Eye className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
      Preview
    </Button>
  </div>
)

/** Version 2 · signed copy · Zaid Al Ali, 20 Oct 2026, or the template's line for version 1 */
const versionMeta = (v: {
  version: number
  signed: boolean
  uploadedBy: string
  uploadedOn: string
}) =>
  v.signed
    ? `Version ${v.version} · signed copy · ${v.uploadedBy}, ${v.uploadedOn}`
    : `Version ${v.version} · unsigned template · ${NDA_TEMPLATE_SIZE}`

/**
 * Document viewer for the NDA template: the form on white A4 pages over a grey background,
 * scrolling only inside the viewer, with the current page and a download.
 */
const NdaDocumentViewer: React.FC<{
  request: NdaStageProps['request']
  /** The version's file name, shown in the header and used for the download */
  fileName: string
  /** Set for a signed copy: the form shows as signed */
  signedOn?: string
  onClose: () => void
}> = ({ request, fileName, signedOn, onClose }) => {
  const titleId = useId()
  const scrollRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [pages, setPages] = useState({ current: 1, total: 1, height: 0 })

  // Page x of y, from the sheet's height in A4 pages and how far it has been scrolled
  const measure = () => {
    const sheet = sheetRef.current
    const scroller = scrollRef.current
    if (!sheet || !scroller) return
    const pageHeight = sheet.offsetWidth * A4_RATIO
    const content = sheet.firstElementChild as HTMLElement | null
    const contentHeight = (content?.offsetHeight ?? sheet.scrollHeight) + 96
    const total = Math.max(1, Math.ceil(contentHeight / pageHeight))
    const middle = scroller.scrollTop + scroller.clientHeight / 2 - sheet.offsetTop
    const current = Math.min(total, Math.max(1, Math.floor(middle / pageHeight) + 1))
    setPages({ current, total, height: pageHeight })
  }

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    measure()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', measure)
      opener?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-bg-overlay" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative w-full max-w-4xl h-full max-h-[92vh] flex flex-col rounded-xl overflow-hidden border border-border-default bg-bg-modal shadow-2xl outline-none"
      >
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-border-subtle shrink-0">
          <div className="flex flex-col min-w-0">
            <h3 id={titleId} className="text-sm font-semibold text-text-primary truncate">
              {fileName}
            </h3>
            <span className="text-xs text-text-tertiary" aria-live="polite">
              Page {pages.current} of {pages.total}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Prototype: there is no real signed file, so the template is saved under its name */}
            <a
              href={NDA_TEMPLATE_URL}
              download={fileName}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-default text-xs font-medium text-text-primary hover:bg-bg-hover transition"
            >
              <Download className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
              Download
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-hover cursor-pointer transition"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
        </div>
        <div
          ref={scrollRef}
          onScroll={measure}
          tabIndex={0}
          aria-label="NDA execution form"
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain bg-bg-surface-3 px-4 sm:px-10 py-8 outline-none"
        >
          {/* One white sheet, a whole number of A4 pages tall, with dashed page breaks */}
          <div
            ref={sheetRef}
            className="relative mx-auto w-full max-w-[794px] bg-bg-default shadow-md px-8 sm:px-14 py-12"
            style={{ minHeight: pages.height ? pages.total * pages.height : undefined }}
          >
            <NdaExecutionForm request={request} signedOn={signedOn} />
            {pages.height > 0 &&
              Array.from({ length: pages.total - 1 }, (_, i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  style={{ top: (i + 1) * pages.height }}
                  className="absolute left-0 right-0 border-t border-dashed border-border-strong"
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}

type View = 'template' | 'signed'

const PrimaryButton: React.FC<{
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}> = ({ onClick, disabled, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="h-10 px-5 rounded-lg bg-[#00a8b0] hover:bg-[#009199] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-sm font-semibold text-white shadow-xs cursor-pointer transition flex items-center gap-2"
  >
    {children}
  </button>
)

export const NdaStage: React.FC<NdaStageProps> = ({
  request,
  role,
  onAction,
  onNext,
  gateError,
  className = '',
}) => {
  const isDirector = role === 'director'
  const versions = request.nda?.versions ?? []
  const signed = versions.some((v) => v.signed)
  const latest = versions[versions.length - 1]
  const [acknowledged, setAcknowledged] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [pickedVersion, setPickedVersion] = useState<number | null>(null)
  const shown = versions.find((v) => v.version === pickedVersion) ?? latest

  // Nobody but the Director sees the template: others wait until it has been signed
  if (!signed && !isDirector) {
    return (
      <div className={`flex flex-col gap-4 w-full ${className}`.trim()}>
        <h2 className="text-xl font-semibold text-[#0d212c]">NDA</h2>
        <p className="text-sm text-[#64748b]">
          Waiting for the Director to upload the signed NDA. It will show here with the alignment
          pack.
        </p>
      </div>
    )
  }

  // Once the signed copy is in, the stage shows it; Proceed goes straight to the Discovery Call
  const current: View = signed ? 'signed' : 'template'

  return (
    <div className={`flex flex-col gap-4 w-full h-full min-h-0 ${className}`.trim()}>
      <h2 className="text-xl font-semibold text-[#0d212c] shrink-0">NDA</h2>

      {current === 'template' && (
        <>
          {/* The template as a file; Preview opens it in the document viewer */}
          <NdaFileCard
            fileName={NDA_TEMPLATE_NAME}
            meta={`Version 1 · unsigned template · ${NDA_TEMPLATE_SIZE}`}
            onPreview={() => setPreviewing(true)}
          />
          <div className="flex-1" aria-hidden="true" />
          <StageFooter compact>
            <div className="flex flex-col gap-2 min-w-0">
              <div className="flex flex-col gap-0.5">
                <span id="signed-nda-label" className="text-sm font-semibold text-text-primary">
                  Signed NDA <span className="text-text-error">*</span>
                </span>
                <span id="signed-nda-help" className="text-xs text-text-secondary">
                  Required to continue to the Discovery Call.
                </span>
              </div>
              <Checkbox
                checked={acknowledged}
                onChange={setAcknowledged}
                label="I acknowledge that the document has been signed by the vendor"
              />
              {gateError && (
                <span
                  role="alert"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-text-error"
                >
                  <AlertCircle className="w-3.5 h-3.5" strokeWidth={2} aria-hidden="true" />
                  {gateError}
                </span>
              )}
            </div>
            <PrimaryButton disabled={!acknowledged} onClick={() => setUploading(true)}>
              <Upload className="w-4 h-4" aria-hidden="true" />
              Upload signed NDA
            </PrimaryButton>
          </StageFooter>
        </>
      )}

      {current === 'signed' && shown && (
        <>
          <div className="flex items-center gap-3 shrink-0">
            <h3 className="text-base font-semibold text-[#0d212c]">
              {shown.signed ? 'Signed NDA' : 'Unsigned template'}
            </h3>
            <div className="relative">
              <select
                aria-label="NDA version"
                value={shown.version}
                onChange={(e) => setPickedVersion(Number(e.target.value))}
                className="h-8 appearance-none pl-3 pr-8 rounded-lg border border-[#e2e8f0] bg-white text-xs font-medium text-[#0d212c] hover:border-[#bcc7d3] focus:outline-none focus:border-[#a3b1c2] cursor-pointer"
              >
                {[...versions].reverse().map((v) => (
                  <option key={v.version} value={v.version}>
                    v{v.version}
                    {v.version === latest.version ? ' (current)' : ''} ·{' '}
                    {v.signed ? 'signed copy' : 'unsigned template'}
                  </option>
                ))}
              </select>
              <ChevronDown
                aria-hidden="true"
                className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              />
            </div>
          </div>
          {/* The selected version as a file; Preview opens it in the document viewer */}
          <NdaFileCard
            fileName={shown.signed ? shown.fileName : NDA_TEMPLATE_NAME}
            meta={versionMeta(shown)}
            onPreview={() => setPreviewing(true)}
          />
          <div className="flex-1" aria-hidden="true" />
          <StageFooter compact>
            {isDirector ? (
              <Checkbox
                checked
                disabled
                onChange={() => undefined}
                label="I acknowledge that the document has been signed by the vendor"
              />
            ) : (
              <span />
            )}
            <PrimaryButton onClick={onNext}>Proceed</PrimaryButton>
          </StageFooter>
        </>
      )}

      {previewing && (
        <NdaDocumentViewer
          request={request}
          fileName={current === 'signed' && shown?.signed ? shown.fileName : NDA_TEMPLATE_NAME}
          signedOn={current === 'signed' && shown?.signed ? shown.uploadedOn : undefined}
          onClose={() => setPreviewing(false)}
        />
      )}

      {uploading && (
        <UploadSignedNdaModal
          nextVersion={versions.length === 0 ? 2 : versions.length + 1}
          onClose={() => setUploading(false)}
          onUpload={(fileName) => {
            onAction({ type: 'uploadNda', fileName })
            setUploading(false)
            setPickedVersion(null)
          }}
        />
      )}
    </div>
  )
}
