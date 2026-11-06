'use client'

/**
 * DiscoveryCallStage — Organism
 * The call between the NDA and Value & Due Diligence, held on Teams or elsewhere. The Director
 * uploads the transcripts and the agent writes a meeting summary (a file with a document
 * preview), then proceeds (or skips), which hands the case to the sponsor. Everyone else waits
 * and can read what was added.
 * Used in: PartnershipDetail
 */

import React, { useEffect, useMemo, useState } from 'react'
import { FileText, Film, Mic, Sparkles, X } from 'lucide-react'
import { Checkbox } from '@/components/atoms/Checkbox'
import { Skeleton } from '@/components/atoms/Skeleton'
import { DocumentFileCard } from '@/components/molecules/DocumentFileCard'
import { FilePicker } from '@/components/molecules/FilePicker'
import { StageFooter } from '@/components/molecules/StageFooter'
import { DocumentViewer } from '@/components/organisms/DocumentViewer'
import type { CaseFile, MeetingSummary } from '@/types/partnership.types'
import type { DiscoveryCallStageProps } from './DiscoveryCallStage.types'

const ACCEPT = '.vtt,.txt,.doc,.docx,.pdf'
const MAX_MB = 20
/** How long the agent takes to write the summary */
const SUMMARY_MS = 2000

/** 340 KB, 1.2 MB */
export const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`

const extensionOf = (name: string) => name.slice(name.lastIndexOf('.') + 1).toUpperCase()

/** A small tile with the file type, e.g. VTT */
const TypeTile: React.FC<{ name: string }> = ({ name }) => (
  <span
    aria-hidden="true"
    className="w-9 h-9 shrink-0 rounded-lg border border-border-default bg-bg-surface-1 text-[10px] font-semibold text-text-secondary flex items-center justify-center"
  >
    {extensionOf(name)}
  </span>
)

export const FileRow: React.FC<{ name: string; meta: string; onRemove?: () => void }> = ({
  name,
  meta,
  onRemove,
}) => (
  <li className="flex items-center gap-3 px-4 py-3">
    <TypeTile name={name} />
    <div className="flex flex-col min-w-0 flex-1">
      <span className="text-sm font-medium text-text-primary truncate">{name}</span>
      <span className="text-xs text-text-tertiary">{meta}</span>
    </div>
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${name}`}
        className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-bg-hover cursor-pointer transition"
      >
        <X className="w-4 h-4" strokeWidth={2} />
      </button>
    )}
  </li>
)

/** Earlier meeting notes or recordings on the case, read-only */
const FileList: React.FC<{ label: string; files: CaseFile[]; icon: React.ReactNode }> = ({
  label,
  files,
  icon,
}) =>
  files.length === 0 ? null : (
    <ul
      aria-label={label}
      className="rounded-xl border border-border-default divide-y divide-[#d3dbe4] bg-bg-default"
    >
      {files.map((f) => (
        <li key={f.name} className="flex items-center gap-3 px-4 py-3">
          {icon}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-text-primary truncate">{f.name}</span>
            <span className="text-xs text-text-tertiary">
              {f.uploadedBy} · {f.uploadedOn}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )

type SectionKey = 'keyPoints' | 'vendorCommitments' | 'openQuestions' | 'risks' | 'nextSteps'

const SECTIONS: [SectionKey, string][] = [
  ['keyPoints', 'Key points'],
  ['vendorCommitments', 'Vendor commitments'],
  ['openQuestions', 'Open questions'],
  ['risks', 'Risks'],
  ['nextSteps', 'Next steps'],
]

/** The summary as it reads in the document viewer */
export const SummaryDocument: React.FC<{
  title: string
  meta: string
  content: MeetingSummary
}> = ({ title, meta, content }) => (
  <article className="flex flex-col gap-6 text-text-primary">
    <header className="flex flex-col gap-1 pb-4">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-xs text-text-tertiary">{meta}</p>
    </header>
    {SECTIONS.map(([key, label]) =>
      content[key].length === 0 ? null : (
        <section key={key} className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
            {label}
          </h2>
          <ul className="flex flex-col gap-1.5 list-disc pl-5 text-sm leading-relaxed">
            {content[key].map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )
    )}
  </article>
)

/** A plain-text copy of the summary, for Download (the prototype has no real PDF) */
export const summaryText = (title: string, content: MeetingSummary) =>
  [
    title,
    '',
    ...SECTIONS.flatMap(([key, label]) =>
      content[key].length ? [label, ...content[key].map((i) => `- ${i}`), ''] : []
    ),
  ].join('\n')

const PrimaryButton: React.FC<{
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}> = ({ onClick, disabled, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="h-10 px-5 rounded-lg bg-action-primary-bg-default hover:bg-action-primary-bg-hover disabled:bg-bg-disabled disabled:text-text-disabled disabled:cursor-not-allowed text-sm font-semibold text-action-primary-text shadow-xs cursor-pointer transition inline-flex items-center gap-2"
  >
    {children}
  </button>
)

const SecondaryButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    className="h-10 px-5 rounded-lg border border-border-strong bg-bg-default text-sm font-semibold text-text-primary hover:bg-bg-hover cursor-pointer transition"
  >
    {children}
  </button>
)

export const DiscoveryCallStage: React.FC<DiscoveryCallStageProps> = ({
  request,
  role,
  onAction,
  onNext,
  className = '',
}) => {
  const isDirector = role === 'director'
  const proceeded = Boolean(request.discovery?.proceededOn)
  const discovery = { notes: [], transcripts: [], recordings: [], ...request.discovery }
  const transcripts = discovery.transcripts ?? []
  const summary = discovery.summary
  const canAdd = isDirector && !proceeded

  // Transcripts picked but not saved yet; the summary step saves them with the summary
  const [picked, setPicked] = useState<File[]>([])
  // The Director confirms the call took place before anything can be uploaded
  const [callConfirmed, setCallConfirmed] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)
  const [writing, setWriting] = useState(false)
  const needsAcknowledgement =
    canAdd && !acknowledged && !summary && transcripts.length === 0 && !writing
  const [previewing, setPreviewing] = useState(false)

  const addFiles = (files: File[]) =>
    setPicked((prev) => [
      ...prev,
      ...files.filter((f) => !prev.some((p) => p.name === f.name && p.size === f.size)),
    ])

  useEffect(() => {
    if (!writing) return
    const t = setTimeout(() => {
      onAction({
        type: 'discoverySummary',
        files: picked.map((f) => ({ name: f.name, size: formatSize(f.size) })),
      })
      setPicked([])
      setWriting(false)
    }, SUMMARY_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writing])

  const proceed = () => {
    onAction({ type: 'proceedToValue' })
    onNext()
  }

  const summaryMeta = summary
    ? `Meeting summary · from ${summary.transcriptCount} ${
        summary.transcriptCount === 1 ? 'transcript' : 'transcripts'
      } · generated ${summary.generatedOn}`
    : ''
  const downloadHref = useMemo(
    () =>
      summary
        ? `data:text/plain;charset=utf-8,${encodeURIComponent(
            summaryText(`Discovery call summary · ${request.companyName}`, summary.content)
          )}`
        : '',
    [summary, request.companyName]
  )

  const n = picked.length
  const plural = (count: number) => (count === 1 ? 'transcript' : 'transcripts')

  return (
    <div className={`flex flex-col gap-4 w-full h-full min-h-0 ${className}`.trim()}>
      <div className="flex flex-col gap-1 shrink-0">
        <h2 className="text-xl font-semibold text-text-primary">Discovery Call</h2>
        <p className="text-sm text-text-secondary">
          {canAdd
            ? needsAcknowledgement
              ? 'Hold the call on Teams or elsewhere, then confirm it has been completed to upload the transcripts.'
              : 'Upload the transcripts from the call. The agent writes a summary.'
            : proceeded
              ? 'The Director has handed this case to the sponsor.'
              : 'Waiting for the Director to hold the discovery call and hand this case on.'}
        </p>
      </div>

      <div className="relative flex-1 min-h-0 overflow-y-auto flex flex-col gap-5 pr-1">
        {/* The agent's summary, as a file */}
        {summary && (
          <DocumentFileCard
            fileName={summary.fileName}
            meta={summaryMeta}
            onPreview={() => setPreviewing(true)}
          />
        )}

        {writing && (
          <section
            role="status"
            aria-label="Writing the meeting summary"
            className="rounded-xl border border-border-default bg-bg-default px-4 py-4 flex flex-col gap-3"
          >
            <div className="flex items-center gap-2">
              <Sparkles
                className="w-4 h-4 text-[var(--app-accent)]"
                strokeWidth={2}
                aria-hidden="true"
              />
              <span className="text-sm font-semibold text-text-primary">
                Writing the meeting summary…
              </span>
            </div>
            <p className="text-xs text-text-tertiary">
              Reading {n} {plural(n)} · Pulling out key points · Listing next steps
            </p>
            <div className="flex items-center gap-4">
              <Skeleton className="w-10 h-[52px] rounded-[3px] shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-3.5 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          </section>
        )}

        {/* Picking the transcripts, before the summary is written */}
        {canAdd && !needsAcknowledgement && !summary && !writing && (
          <section aria-labelledby="transcripts-heading" className="flex flex-col gap-3">
            <h3 id="transcripts-heading" className="text-sm font-semibold text-text-primary">
              Transcripts · {n}
            </h3>
            {n > 0 && (
              <ul
                aria-label="Transcripts to upload"
                className="rounded-xl border border-border-default divide-y divide-[#d3dbe4] bg-bg-default"
              >
                {picked.map((f) => (
                  <FileRow
                    key={`${f.name}-${f.size}`}
                    name={f.name}
                    meta={formatSize(f.size)}
                    onRemove={() => setPicked((prev) => prev.filter((p) => p !== f))}
                  />
                ))}
              </ul>
            )}
            <FilePicker
              label={n > 0 ? 'Add more transcripts' : 'Upload transcripts'}
              hint={`VTT, TXT, DOC, DOCX or PDF · up to ${MAX_MB} MB each`}
              accept={ACCEPT}
              maxSizeMb={MAX_MB}
              multiple
              onPickFiles={addFiles}
            />
          </section>
        )}

        {/* The transcripts saved with the summary */}
        {transcripts.length > 0 && (
          <section aria-labelledby="saved-transcripts-heading" className="flex flex-col gap-3">
            <h3 id="saved-transcripts-heading" className="text-sm font-semibold text-text-primary">
              Transcripts · {transcripts.length}
            </h3>
            <ul
              aria-label="Transcripts"
              className="rounded-xl border border-border-default divide-y divide-[#d3dbe4] bg-bg-default"
            >
              {transcripts.map((f) => (
                <FileRow
                  key={f.name}
                  name={f.name}
                  meta={[f.size, `${f.uploadedBy} · ${f.uploadedOn}`].filter(Boolean).join(' · ')}
                />
              ))}
            </ul>
          </section>
        )}

        {!needsAcknowledgement && (
          <>
            <FileList
              label="Meeting notes"
              files={discovery.notes}
              icon={<FileText className="w-5 h-5 text-text-secondary" aria-hidden="true" />}
            />
            <FileList
              label="Recordings"
              files={discovery.recordings}
              icon={<Film className="w-5 h-5 text-text-secondary" aria-hidden="true" />}
            />
          </>
        )}
        {!canAdd && !summary && transcripts.length === 0 && (
          <p className="text-sm text-text-tertiary flex items-center gap-2">
            <Mic className="w-4 h-4" aria-hidden="true" />
            Nothing has been added from the call.
          </p>
        )}
      </div>

      <StageFooter compact>
        {needsAcknowledgement ? (
          <>
            <div className="flex flex-col gap-2 min-w-0">
              <Checkbox
                checked={callConfirmed}
                onChange={setCallConfirmed}
                label="I acknowledge that the discovery call has been completed"
              />
            </div>
            <PrimaryButton disabled={!callConfirmed} onClick={() => setAcknowledged(true)}>
              Continue
            </PrimaryButton>
          </>
        ) : canAdd && !summary ? (
          <>
            <span className="text-sm text-text-secondary">
              {n} {plural(n)} ready.
            </span>
            <div className="flex items-center gap-3">
              <SecondaryButton onClick={proceed}>Skip</SecondaryButton>
              <PrimaryButton onClick={() => setWriting(true)} disabled={writing}>
                <Sparkles className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                Generate summary
              </PrimaryButton>
            </div>
          </>
        ) : canAdd ? (
          <>
            <span />
            <PrimaryButton onClick={proceed}>Proceed</PrimaryButton>
          </>
        ) : (
          <>
            <span />
            <PrimaryButton onClick={onNext} disabled={!proceeded}>
              Next
            </PrimaryButton>
          </>
        )}
      </StageFooter>

      {previewing && summary && (
        <DocumentViewer
          fileName={summary.fileName}
          downloadHref={downloadHref}
          downloadName={summary.fileName.replace(/\.pdf$/, '.txt')}
          contentLabel="Meeting summary"
          onClose={() => setPreviewing(false)}
        >
          <SummaryDocument
            title={`Discovery call summary · ${request.companyName}`}
            meta={`${request.requestCode} · ${summaryMeta}`}
            content={summary.content}
          />
        </DocumentViewer>
      )}
    </div>
  )
}
