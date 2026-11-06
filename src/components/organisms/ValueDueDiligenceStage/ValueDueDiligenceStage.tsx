'use client'

/**
 * ValueDueDiligenceStage — Organism
 * Stage 5: the value assessment call (confirmed by the sponsor), the business case upload, the
 * sponsor's Proceed or Reject decision, the TDD report (generated once the TDD Admin completes the
 * assessments, opened in the document viewer), and the sponsor's final
 * answer on whether to sponsor the partnership.
 * Used in: PartnershipDetail
 */

import React, { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, FileClock, FileText, Sparkles, X } from 'lucide-react'
import { Checkbox } from '@/components/atoms/Checkbox'
import { Skeleton } from '@/components/atoms/Skeleton'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { FilePicker } from '@/components/molecules/FilePicker'
import { TddReport } from '@/components/organisms/TddReport'
import { DocumentFileCard } from '@/components/molecules/DocumentFileCard'
import { DocumentViewer } from '@/components/organisms/DocumentViewer'
import {
  FileRow,
  SummaryDocument,
  formatSize,
  summaryText,
} from '@/components/organisms/DiscoveryCallStage'
import { StageFooter } from '@/components/molecules/StageFooter'
import { StrategyDecisionModal } from '@/components/organisms/StrategyDecisionModal'
import type { ValueDueDiligenceStageProps } from './ValueDueDiligenceStage.types'

const Section: React.FC<{
  title: string
  subtitle?: string
  /** A status chip, shown on the right of the title */
  badge?: React.ReactNode
  children: React.ReactNode
}> = ({ title, subtitle, badge, children }) => (
  <section className="flex flex-col gap-4">
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-[#0d212c]">{title}</h3>
        {subtitle && <p className="text-xs text-[#64748b]">{subtitle}</p>}
      </div>
      {badge}
    </div>
    {children}
  </section>
)

/** How long the agent takes to write the summary */
const SUMMARY_MS = 2000

/** Cases whose TDD report has already been shown being generated, so it plays once each */
const reportsShown = new Set<string>()

const Chip: React.FC<{ tone: 'good' | 'bad'; children: React.ReactNode }> = ({
  tone,
  children,
}) => (
  <span
    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
      tone === 'good'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
        : 'border-red-200 bg-red-50 text-red-700'
    }`}
  >
    {children}
  </span>
)

export const ValueDueDiligenceStage: React.FC<ValueDueDiligenceStageProps> = ({
  request,
  role,
  onAction,
  className = '',
}) => {
  const isSponsor = role === 'sponsor'
  const value = request.value ?? {}
  const decision = value.decision
  const final = value.finalDecision
  const [modal, setModal] = useState<'proceed' | 'reject' | null>(null)
  const [confirmFinal, setConfirmFinal] = useState<'yes' | 'no' | null>(null)
  // The TDD report open in the document viewer
  const [viewingReport, setViewingReport] = useState(false)

  const needsDecision = Boolean(value.businessCase) && !decision

  // The business case and any notes picked but not saved yet; the summary step saves them
  const [picked, setPicked] = useState<File[]>([])
  const [writing, setWriting] = useState(false)
  const [previewingSummary, setPreviewingSummary] = useState(false)
  const addFiles = (files: File[]) =>
    setPicked((prev) => [
      ...prev,
      ...files.filter((f) => !prev.some((p) => p.name === f.name && p.size === f.size)),
    ])
  // The first file is the business case; any others are meeting notes or transcripts
  const [pickedCase, ...pickedNotes] = picked
  useEffect(() => {
    if (!writing || !pickedCase) return
    const t = setTimeout(() => {
      onAction({
        type: 'businessCase',
        name: pickedCase.name,
        files: pickedNotes.map((f) => ({ name: f.name, size: formatSize(f.size) })),
      })
      setPicked([])
      setWriting(false)
    }, SUMMARY_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writing])

  // The TDD report is written once when it is first opened, with the same subtle animation
  const [generatingReport, setGeneratingReport] = useState(
    () => Boolean(value.tddGeneratedOn) && !reportsShown.has(request.requestCode)
  )
  const reportReady = Boolean(value.tddGeneratedOn) && !generatingReport
  useEffect(() => {
    if (!value.tddGeneratedOn || reportsShown.has(request.requestCode)) return
    setGeneratingReport(true)
    const t = setTimeout(() => {
      reportsShown.add(request.requestCode)
      setGeneratingReport(false)
    }, SUMMARY_MS)
    return () => clearTimeout(t)
  }, [value.tddGeneratedOn, request.requestCode])

  const summary = value.summary
  const summaryMeta = summary
    ? `Value assessment summary · from the business case${
        summary.transcriptCount > 0
          ? ` and ${summary.transcriptCount} ${summary.transcriptCount === 1 ? 'note' : 'notes'}`
          : ''
      } · generated ${summary.generatedOn}`
    : ''
  const downloadHref = useMemo(
    () =>
      summary
        ? `data:text/plain;charset=utf-8,${encodeURIComponent(
            summaryText(`Value assessment summary · ${request.companyName}`, summary.content)
          )}`
        : '',
    [summary, request.companyName]
  )

  return (
    <div className={`flex flex-col gap-10 w-full ${className}`.trim()}>
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-[#0d212c]">Value & Due Diligence</h2>
        <p className="text-xs text-[#64748b]">
          The value assessment call and business case come first. If the sponsor proceeds, the
          technical due diligence report is filled in and the sponsor gives a final answer.
        </p>
      </div>

      <Section
        title="Value assessment call"
        badge={
          value.callConfirmedOn && (
            <Chip tone="good">
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              Value assessment call completed on {value.callConfirmedOn}
            </Chip>
          )
        }
      >
        {value.callConfirmedOn ? null : isSponsor ? (
          <Checkbox
            checked={false}
            onChange={() => onAction({ type: 'confirmValueCall' })}
            label="I acknowledge that the value assessment call has been completed"
          />
        ) : (
          <span className="text-xs text-[#64748b]">Waiting for the lead sponsor.</span>
        )}
      </Section>

      {value.callConfirmedOn && (
        <Section title="Business case">
          {value.businessCase ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 rounded-xl border border-[#e2e8f0] bg-white px-4 py-3">
                <FileText className="w-5 h-5 text-[#2563eb] shrink-0" aria-hidden="true" />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-[#0d212c] truncate">
                    {value.businessCase.name}
                  </span>
                  <span className="text-xs text-[#64748b]">
                    {value.businessCase.uploadedBy} · {value.businessCase.uploadedOn}
                  </span>
                </div>
              </div>
              {(value.transcripts ?? []).length > 0 && (
                <ul
                  aria-label="Meeting notes and transcripts"
                  className="rounded-xl border border-border-default divide-y divide-[#d3dbe4] bg-bg-default"
                >
                  {(value.transcripts ?? []).map((f) => (
                    <FileRow
                      key={f.name}
                      name={f.name}
                      meta={[f.size, `${f.uploadedBy} · ${f.uploadedOn}`]
                        .filter(Boolean)
                        .join(' · ')}
                    />
                  ))}
                </ul>
              )}
              {summary && (
                <DocumentFileCard
                  fileName={summary.fileName}
                  meta={summaryMeta}
                  onPreview={() => setPreviewingSummary(true)}
                />
              )}
            </div>
          ) : writing ? (
            <section
              role="status"
              aria-label="Writing the value assessment summary"
              className="rounded-xl border border-border-default bg-bg-default px-4 py-4 flex flex-col gap-3"
            >
              <div className="flex items-center gap-2">
                <Sparkles
                  className="w-4 h-4 text-[var(--app-accent)]"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span className="text-sm font-semibold text-text-primary">
                  Writing the value assessment summary…
                </span>
              </div>
              <p className="text-xs text-text-tertiary">
                Reading the business case · Pulling out key points · Listing next steps
              </p>
              <div className="flex items-center gap-4">
                <Skeleton className="w-10 h-[52px] rounded-[3px] shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            </section>
          ) : isSponsor ? (
            <div className="flex flex-col gap-4">
              {picked.length > 0 && (
                <ul
                  aria-label="Files to upload"
                  className="rounded-xl border border-border-default divide-y divide-[#d3dbe4] bg-bg-default"
                >
                  {picked.map((f, i) => (
                    <FileRow
                      key={`${f.name}-${f.size}`}
                      name={f.name}
                      meta={`${i === 0 ? 'Business case' : 'Meeting notes or transcript'} · ${formatSize(f.size)}`}
                      onRemove={() => setPicked((prev) => prev.filter((p) => p !== f))}
                    />
                  ))}
                </ul>
              )}
              <FilePicker
                label={
                  picked.length > 0
                    ? 'Add more files'
                    : 'Upload business case, meeting notes or transcript'
                }
                hint="The first file is the business case. PDF, Word, PowerPoint, Excel, VTT or TXT · up to 20 MB each"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.vtt,.txt"
                maxSizeMb={20}
                multiple
                onPickFiles={addFiles}
              />
            </div>
          ) : (
            <span className="text-xs text-[#64748b]">Waiting for the lead sponsor.</span>
          )}
        </Section>
      )}

      {value.businessCase && (
        <Section
          title="Sponsor decision"
          badge={
            decision && (
              <Chip tone={decision.status === 'proceeded' ? 'good' : 'bad'}>
                {decision.status === 'proceeded' ? 'Proceeded' : 'Rejected'} on {decision.date}
              </Chip>
            )
          }
        >
          {decision ? (
            decision.reason ? (
              <p className="text-sm text-[#475569] leading-relaxed">{decision.reason}</p>
            ) : null
          ) : (
            <span className="text-xs text-[#64748b]">
              {isSponsor
                ? 'Review the business case, then proceed or reject.'
                : 'Waiting for the lead sponsor to decide.'}
            </span>
          )}
        </Section>
      )}

      {decision?.status === 'proceeded' && (
        <Section
          title="Technical due diligence"
          badge={
            reportReady && (
              <Chip tone="good">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                TDD report generated on {value.tddGeneratedOn}
              </Chip>
            )
          }
        >
          {generatingReport ? (
            <section
              role="status"
              aria-label="Generating the TDD report"
              className="rounded-xl border border-border-default bg-bg-default px-4 py-4 flex flex-col gap-3"
            >
              <div className="flex items-center gap-2">
                <Sparkles
                  className="w-4 h-4 text-[var(--app-accent)]"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span className="text-sm font-semibold text-text-primary">
                  Generating the TDD report…
                </span>
              </div>
              <p className="text-xs text-text-tertiary">
                Reading the assessment rounds · Pulling out findings · Writing the report
              </p>
              <div className="flex items-center gap-4">
                <Skeleton className="w-10 h-[52px] rounded-[3px] shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            </section>
          ) : value.tddGeneratedOn ? (
            // The report as a file; View opens it in the document viewer, like the NDA
            <DocumentFileCard
              fileName={`TDD_Report_${request.requestCode}.pdf`}
              meta={`PDF · Generated by the agent on ${value.tddGeneratedOn}`}
              onPreview={() => setViewingReport(true)}
            />
          ) : (
            // The report waits until the TDD Admin has completed every assessment round
            <div className="rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-5 py-8 flex flex-col items-center text-center gap-2">
              <FileClock className="w-6 h-6 text-[#94a3b8]" aria-hidden="true" />
              <span className="text-sm font-semibold text-[#0d212c]">
                The TDD report is not ready yet
              </span>
              <span className="text-xs text-[#64748b] max-w-md leading-relaxed">
                It is generated once the TDD Admin marks all technical due diligence assessment
                rounds for this case as completed. The report will appear here.
              </span>
            </div>
          )}
          {viewingReport && reportReady && (
            <DocumentViewer
              fileName={`TDD_Report_${request.requestCode}.pdf`}
              contentLabel="Technical due diligence report"
              onClose={() => setViewingReport(false)}
            >
              <header className="flex flex-col gap-1 pb-1 mb-6">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#64748b]">
                  Technical due diligence report
                </span>
                <h4 className="text-xl font-semibold text-[#0d212c]">{request.companyName}</h4>
                <span className="text-xs text-[#64748b]">
                  Case {request.requestCode} · {value.tddGeneratedOn}
                </span>
              </header>
              <TddReport request={request} />
            </DocumentViewer>
          )}
        </Section>
      )}

      {reportReady && (
        <Section
          title="Sponsorship"
          badge={
            final && (
              <Chip tone={final.status === 'sponsored' ? 'good' : 'bad'}>
                {final.status === 'sponsored' ? 'Sponsored' : 'Declined'} on {final.date}
              </Chip>
            )
          }
        >
          {final ? null : (
            <span className="text-xs text-[#64748b]">
              {isSponsor
                ? 'Review the report, then say whether you will sponsor this partnership.'
                : 'Waiting for the sponsor to answer.'}
            </span>
          )}
        </Section>
      )}

      {isSponsor && value.callConfirmedOn && !value.businessCase && !writing && (
        <StageFooter>
          <span className="text-sm text-[#475569]">
            {pickedCase
              ? 'Ready to generate the value assessment summary.'
              : 'Upload the business case to generate the summary.'}
          </span>
          <button
            type="button"
            disabled={!pickedCase}
            onClick={() => setWriting(true)}
            className="h-10 px-5 rounded-lg bg-[#36c0c9] hover:bg-[#2fb0b9] disabled:bg-slate-300 disabled:cursor-not-allowed text-sm font-semibold text-white shadow-xs cursor-pointer transition inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
            Generate summary
          </button>
        </StageFooter>
      )}

      {previewingSummary && summary && (
        <DocumentViewer
          fileName={summary.fileName}
          downloadHref={downloadHref}
          downloadName={summary.fileName.replace(/\.pdf$/, '.txt')}
          contentLabel="Value assessment summary"
          onClose={() => setPreviewingSummary(false)}
        >
          <SummaryDocument
            title={`Value assessment summary · ${request.companyName}`}
            meta={`${request.requestCode} · ${summaryMeta}`}
            content={summary.content}
          />
        </DocumentViewer>
      )}

      {isSponsor && needsDecision && (
        <StageFooter>
          <span className="text-sm text-[#475569]">
            Review the business case, then record your decision.
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setModal('reject')}
              className="h-10 px-5 rounded-lg border border-red-500 bg-white text-sm font-semibold text-red-600 hover:bg-red-50 cursor-pointer transition flex items-center gap-1.5"
            >
              <X className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
              Reject
            </button>
            <button
              type="button"
              onClick={() => setModal('proceed')}
              className="h-10 px-5 rounded-lg bg-[#36c0c9] hover:bg-[#2fb0b9] text-sm font-semibold text-white shadow-xs cursor-pointer transition flex items-center gap-1.5"
            >
              Proceed
            </button>
          </div>
        </StageFooter>
      )}

      {isSponsor && reportReady && !final && (
        <StageFooter>
          <span className="text-sm text-[#475569]">Do you want to sponsor this partnership?</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setConfirmFinal('no')}
              className="h-10 px-5 rounded-lg border border-red-500 bg-white text-sm font-semibold text-red-600 hover:bg-red-50 cursor-pointer transition"
            >
              No, do not sponsor
            </button>
            <button
              type="button"
              onClick={() => setConfirmFinal('yes')}
              className="h-10 px-5 rounded-lg bg-[#36c0c9] hover:bg-[#2fb0b9] text-sm font-semibold text-white shadow-xs cursor-pointer transition"
            >
              Yes, sponsor
            </button>
          </div>
        </StageFooter>
      )}

      {confirmFinal && (
        <ConfirmDialog
          danger={confirmFinal === 'no'}
          title={confirmFinal === 'yes' ? 'Sponsor this partnership?' : 'Do not sponsor?'}
          description={
            confirmFinal === 'yes'
              ? 'You will own this partnership and it moves to Completed.'
              : 'The case will be closed. You will not be able to change this.'
          }
          confirmLabel={confirmFinal === 'yes' ? 'Yes, sponsor' : 'Yes, do not sponsor'}
          cancelLabel="Go back"
          icon={confirmFinal === 'yes' ? CheckCircle2 : AlertCircle}
          onCancel={() => setConfirmFinal(null)}
          onConfirm={() => {
            onAction({ type: 'finalSponsor', sponsor: confirmFinal === 'yes' })
            setConfirmFinal(null)
          }}
        />
      )}

      {modal && (
        <StrategyDecisionModal
          mode={modal}
          onClose={() => setModal(null)}
          onConfirm={(reason) => {
            onAction({
              type: 'valueDecision',
              status: modal === 'proceed' ? 'proceeded' : 'rejected',
              reason,
            })
            setModal(null)
          }}
        />
      )}
    </div>
  )
}
