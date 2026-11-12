'use client'

/**
 * NdaStage — Organism
 * The NDA stage fills the page height with the action bar fixed at the bottom. The Director sees
 * the template as a file card (Preview opens the document viewer), acknowledges the vendor's
 * signature and uploads the signed copy. After that, everyone sees the signed NDA as a file card
 * with its versions; Proceed opens the Discovery Call stage, which needs the signed NDA
 * (hasSignedNda). The alignment pack sits under the signed NDA as a second file: it is generated
 * when the signed copy is uploaded, and Preview opens it.
 * Used in: PartnershipDetail
 */

import React, { useState } from 'react'
import { AlertCircle, ChevronDown, Upload } from 'lucide-react'
import { DocumentFileCard } from '@/components/molecules/DocumentFileCard'
import { AlignmentPack } from '@/components/organisms/AlignmentPack'
import { DocumentViewer } from '@/components/organisms/DocumentViewer'
import { NdaExecutionForm } from '@/components/organisms/NdaExecutionForm'
import { ThinkingMode } from '@/components/organisms/ThinkingMode'
import { UploadSignedNdaModal } from '@/components/organisms/UploadSignedNdaModal'
import { Checkbox } from '@/components/atoms/Checkbox'
import { StageFooter } from '@/components/molecules/StageFooter'
import type { NdaStageProps } from './NdaStage.types'

export const NDA_TEMPLATE_URL = '/ADHDS-NDA-Execution-Form-v1.0.docx'
const NDA_TEMPLATE_NAME = 'ADHDS-NDA-Execution-Form-v1.0.docx'
const NDA_TEMPLATE_SIZE = '188 KB'

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

const PACK_NAME = 'Alignment-Pack.pdf'
const PACK_MESSAGES = [
  'Collecting the brief and the Director decision',
  'Summarising the Internal Interest responses',
  'Adding the Strategy assessment',
  'Listing the open questions',
]

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
  // The agent builds the pack right after the Director uploads the signed copy
  const [packGenerating, setPackGenerating] = useState(false)
  const [packOpen, setPackOpen] = useState(false)
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
          <DocumentFileCard
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
          <DocumentFileCard
            fileName={shown.signed ? shown.fileName : NDA_TEMPLATE_NAME}
            meta={versionMeta(shown)}
            onPreview={() => setPreviewing(true)}
          />
          {packGenerating ? (
            <ThinkingMode
              inline
              eyebrow="GENERATING"
              description="The agent is bringing everything known about this case together into the alignment pack."
              messages={PACK_MESSAGES}
              stepMs={900}
              onComplete={() => setPackGenerating(false)}
            />
          ) : (
            request.alignmentPackOn && (
              <DocumentFileCard
                fileName={PACK_NAME}
                meta={`Alignment pack · generated ${request.alignmentPackOn}`}
                onPreview={() => setPackOpen(true)}
              />
            )
          )}
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
            <PrimaryButton disabled={packGenerating} onClick={onNext}>
              Proceed
            </PrimaryButton>
          </StageFooter>
        </>
      )}

      {packOpen && (
        <DocumentViewer
          fileName={PACK_NAME}
          contentLabel="Alignment pack"
          onClose={() => setPackOpen(false)}
        >
          <AlignmentPack request={request} />
        </DocumentViewer>
      )}

      {previewing && (
        <DocumentViewer
          fileName={current === 'signed' && shown?.signed ? shown.fileName : NDA_TEMPLATE_NAME}
          // Prototype: there is no real signed file, so the template is saved under its name
          downloadHref={NDA_TEMPLATE_URL}
          downloadName={current === 'signed' && shown?.signed ? shown.fileName : NDA_TEMPLATE_NAME}
          contentLabel="NDA execution form"
          onClose={() => setPreviewing(false)}
        >
          <NdaExecutionForm
            request={request}
            signedOn={current === 'signed' && shown?.signed ? shown.uploadedOn : undefined}
          />
        </DocumentViewer>
      )}

      {uploading && (
        <UploadSignedNdaModal
          nextVersion={versions.length === 0 ? 2 : versions.length + 1}
          onClose={() => setUploading(false)}
          onUpload={(fileName) => {
            onAction({ type: 'uploadNda', fileName })
            setUploading(false)
            setPickedVersion(null)
            setPackGenerating(isDirector)
          }}
        />
      )}
    </div>
  )
}
