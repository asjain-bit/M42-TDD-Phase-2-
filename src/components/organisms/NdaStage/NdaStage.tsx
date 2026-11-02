'use client'

/**
 * NdaStage — Organism
 * The NDA stage fills the page height: the content scrolls inside it and the action bar stays
 * fixed at the bottom. The Director sees the NDA template (download in the title row,
 * vendor-signed acknowledgement, then the required upload of the signed copy), then the signed
 * NDA with its versions,
 * then the alignment pack. Everyone else never sees the template: they open on the alignment
 * pack, and Back shows the signed NDA. Next moves on to the Discovery Call stage, which needs the
 * signed NDA (hasSignedNda).
 * Used in: PartnershipDetail
 */

import React, { useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  Download,
  FileText,
  Film,
  Mic,
  Upload,
} from 'lucide-react'
import { AlignmentPack } from '@/components/organisms/AlignmentPack'
import { NdaExecutionForm } from '@/components/organisms/NdaExecutionForm'
import { ThinkingMode } from '@/components/organisms/ThinkingMode'
import { UploadSignedNdaModal } from '@/components/organisms/UploadSignedNdaModal'
import { Checkbox } from '@/components/atoms/Checkbox'
import { StageFooter } from '@/components/molecules/StageFooter'
import type { CaseFile } from '@/types/partnership.types'
import type { NdaStageProps } from './NdaStage.types'

export const NDA_TEMPLATE_URL = '/ADHDS-NDA-Execution-Form-v1.0.docx'

const PACK_MESSAGES = [
  'Collecting the brief and the Director decision',
  'Summarising the Internal Interest responses',
  'Adding the Strategy assessment',
  'Listing the open questions',
]

type View = 'template' | 'signed' | 'generating' | 'pack'

const FileList: React.FC<{ label: string; files: CaseFile[]; icon: React.ReactNode }> = ({
  label,
  files,
  icon,
}) =>
  files.length === 0 ? null : (
    <ul
      aria-label={label}
      className="rounded-xl border border-[#e2e8f0] divide-y divide-[#f1f5f9] bg-white"
    >
      {files.map((f) => (
        <li key={f.name} className="flex items-center gap-3 px-4 py-3">
          {icon}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-[#0d212c] truncate">{f.name}</span>
            <span className="text-xs text-[#64748b]">
              {f.uploadedBy} · {f.uploadedOn}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )

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

const BackLink: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#008a8a] hover:text-[#006e6e] cursor-pointer transition self-start"
  >
    <ArrowLeft className="w-4 h-4" aria-hidden="true" />
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
  const [view, setView] = useState<View>(signed ? 'pack' : 'template')
  const [packSeen, setPackSeen] = useState(signed)
  const [acknowledged, setAcknowledged] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pickedVersion, setPickedVersion] = useState<number | null>(null)
  const shown = versions.find((v) => v.version === pickedVersion) ?? latest
  const discovery = { notes: [], transcripts: [], recordings: [], ...request.discovery }
  const hasContext =
    discovery.notes.length + discovery.transcripts.length + discovery.recordings.length > 0

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

  const current: View = signed ? (view === 'template' ? 'signed' : view) : 'template'

  const contextLists = (
    <div className="flex flex-col gap-4">
      <FileList
        label="Meeting notes"
        files={discovery.notes}
        icon={<FileText className="w-5 h-5 text-[#2563eb]" aria-hidden="true" />}
      />
      <FileList
        label="Transcripts"
        files={discovery.transcripts}
        icon={<Mic className="w-5 h-5 text-[#7c3aed]" aria-hidden="true" />}
      />
      <FileList
        label="Recordings"
        files={discovery.recordings}
        icon={<Film className="w-5 h-5 text-[#ea580c]" aria-hidden="true" />}
      />
    </div>
  )

  return (
    <div className={`flex flex-col gap-4 w-full h-full min-h-0 ${className}`.trim()}>
      <div
        className={`items-center justify-between gap-3 flex-wrap shrink-0 ${
          current === 'generating' ? 'hidden' : 'flex'
        }`}
      >
        <h2 className="text-xl font-semibold text-[#0d212c]">NDA</h2>
        {current === 'template' && (
          <a
            href={NDA_TEMPLATE_URL}
            download
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#008a8a] hover:text-[#006e6e] transition"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Download
          </a>
        )}
      </div>

      {current === 'template' && (
        <>
          <div
            tabIndex={0}
            aria-label="NDA execution form"
            className="relative flex-1 min-h-0 overflow-y-auto rounded-2xl border border-[#e2e8f0] bg-white p-5 sm:p-6"
          >
            <NdaExecutionForm request={request} />
          </div>
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
          <p className="text-sm text-[#64748b] shrink-0 -mt-2">
            The signed NDA has been uploaded. You can review the document below.
          </p>
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
          <div
            tabIndex={0}
            aria-label="Signed NDA document"
            className="relative flex-1 min-h-0 overflow-y-auto rounded-2xl border border-[#e2e8f0] bg-white p-5 sm:p-6 flex flex-col gap-5"
          >
            <div className="flex items-center gap-3 rounded-xl border border-[#e2e8f0] bg-slate-50/60 px-4 py-3">
              <FileText className="w-5 h-5 text-red-500 shrink-0" aria-hidden="true" />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-[#0d212c] truncate">
                  {shown.fileName}
                </span>
                <span className="text-xs text-[#64748b]">
                  Version {shown.version} · {shown.uploadedBy}, {shown.uploadedOn}
                </span>
              </div>
            </div>
            <NdaExecutionForm
              request={request}
              signedOn={shown.signed ? shown.uploadedOn : undefined}
            />
          </div>
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
            <PrimaryButton onClick={() => setView(!packSeen && isDirector ? 'generating' : 'pack')}>
              Proceed
            </PrimaryButton>
          </StageFooter>
        </>
      )}

      {current === 'generating' && (
        <div className="relative flex-1 min-h-0 overflow-y-auto">
          <ThinkingMode
            inline
            eyebrow="GENERATING"
            description="The agent is bringing everything known about this case together into the alignment pack."
            messages={PACK_MESSAGES}
            stepMs={900}
            onComplete={() => {
              setPackSeen(true)
              setView('pack')
            }}
          />
        </div>
      )}

      {current === 'pack' && (
        <>
          <BackLink onClick={() => setView('signed')}>Back to signed NDA</BackLink>
          <div className="relative flex-1 min-h-0 overflow-y-auto pr-1">
            <AlignmentPack
              request={request}
              extraSection={
                hasContext
                  ? {
                      id: 'context',
                      label: 'Meeting Notes, Transcripts and Recordings',
                      content: contextLists,
                    }
                  : undefined
              }
            />
          </div>
          <StageFooter compact>
            <span className="text-xs text-[#64748b]">Next opens the discovery call stage.</span>
            <PrimaryButton onClick={onNext}>Next</PrimaryButton>
          </StageFooter>
        </>
      )}

      {uploading && (
        <UploadSignedNdaModal
          nextVersion={versions.length === 0 ? 2 : versions.length + 1}
          onClose={() => setUploading(false)}
          onUpload={(fileName) => {
            onAction({ type: 'uploadNda', fileName })
            setUploading(false)
            setPickedVersion(null)
            setView('signed')
          }}
        />
      )}
    </div>
  )
}
