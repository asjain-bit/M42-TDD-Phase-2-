'use client'

import React, { useState } from 'react'
import {
  Layers,
  Clock,
  FileSignature,
  GitFork,
  Inbox,
  ClipboardList,
  CheckCircle2,
  FlaskConical,
  Briefcase,
  NotebookPen,
} from 'lucide-react'
import { SearchBar } from '@/components/molecules/SearchBar'
import { AppDialog } from '@/components/molecules/AppDialog'
import { Button } from '@/components/atoms/Button'
import { Select } from '@/components/atoms/Select'
import { StageChip } from '@/components/molecules/StageChip'
import { Pagination } from '@/components/molecules/Pagination'
import { TableFilterMenu } from '@/components/molecules/TableFilterMenu'
import {
  DISPLAY_STATUSES,
  getDisplayStatus,
  type DisplayStatus,
  type StatusRole,
} from '@/lib/caseStatus'
import { StatusChip } from '@/components/atoms/StatusChip'
import { PartnershipDetail } from '@/components/organisms/PartnershipDetail'
import { CaseNotes } from '@/components/organisms/CaseNotes'
import {
  type PartnershipRequest,
  type SlaStatus,
  INITIAL_PARTNERSHIP_REQUESTS,
} from '@/types/partnership.types'
import {
  appendAudit,
  applyCaseAction,
  buildSplitCases,
  buildTestCase,
  nextCaseCode,
  getStageLabel,
  getStageProgress,
  WORKFLOW_STAGES,
  holdRequest,
  proceedRequest,
  rejectRequest,
  resumeRequest,
  routeRequest,
  sendReview,
  submitReview,
  type AdminRouting,
  type AuditInput,
  type CaseAction,
} from '@/lib/caseActions'
import {
  adminKpis,
  directorKpis,
  internalInterestKpis,
  sponsorKpis,
  strategyLeadKpis,
} from '@/lib/roleKpis'
import { type UserProfile } from './LoginScreen'

export interface DashboardScreenProps {
  userProfile?: UserProfile
  /** Shared cases. When omitted the screen keeps its own copy of the seed data. */
  requests?: PartnershipRequest[]
  onRequestsChange?: React.Dispatch<React.SetStateAction<PartnershipRequest[]>>
}

/** Prototype stand-in for the Strategy Team's answer once a request is sent to them */
const SIMULATED_STRATEGY_RESPONSE = {
  documents: ['M42_Roadmap_Register.xlsx', 'News_Trends_Agent_KB_Extract.docx'],
  finalDecision: 'Proceed' as const,
  finalDecisionNote:
    'Proceed on the condition that the vendor commits to UAE data hosting and registers a local entity.',
  submittedAt: 'Just now',
}

const CASE_ACTION_TOASTS: Partial<Record<CaseAction['type'], string>> = {
  closeCase: 'The case has been closed.',
  assignSponsors: 'Sponsors assigned. Strategic Alignment is next.',
  uploadNda: 'Signed NDA uploaded. The alignment pack has been generated.',
  proceedToValue: 'Moved on to Value & Due Diligence.',
  confirmValueCall: 'Value assessment call confirmed.',
  businessCase: 'Business case uploaded.',
  valueDecision: 'Your decision has been recorded.',
  generateTdd: 'The TDD report has been generated.',
  finalSponsor: 'Your answer has been recorded.',
  addNote: 'Note added.',
  editInternalAnswer: 'Answer updated. Your original answer is kept on record.',
  sponsorInterest: 'Your sponsor interest has been sent to the Director.',
  platformCall: 'Call ended. The meeting summary has been added to the notes.',
}

const PAGE_SIZE = 7

const STAGE_OPTIONS = [
  { value: 'all', label: 'All stages' },
  ...WORKFLOW_STAGES.map((v) => ({ value: v, label: v })),
]
const SLA_OPTIONS = [
  { value: 'all', label: 'All SLA statuses' },
  { value: 'On track', label: 'On track' },
  { value: 'At risk', label: 'At risk' },
  { value: 'Breached', label: 'Breached' },
]
const SORT_OPTIONS = [
  { value: 'default', label: 'Default order' },
  { value: 'newest', label: 'Newest submitted' },
  { value: 'oldest', label: 'Oldest submitted' },
  { value: 'company', label: 'Company A to Z' },
  { value: 'days', label: 'Most days in stage' },
]

const SLA_TEXT_COLOR: Record<SlaStatus, string> = {
  'On track': 'text-[#16a34a]',
  'At risk': 'text-[#d97706]',
  Breached: 'text-[#dc2626]',
}

/** Two lines of the solution description, with the full text in a tooltip */
const DescriptionCell: React.FC<{ text: string }> = ({ text }) => {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const show = (el: HTMLElement) => {
    const r = el.getBoundingClientRect()
    setPos({ left: Math.min(r.left, window.innerWidth - 320), top: r.bottom + 6 })
  }
  return (
    <>
      <p
        tabIndex={0}
        aria-label={text}
        onMouseEnter={(e) => show(e.currentTarget)}
        onMouseLeave={() => setPos(null)}
        onFocus={(e) => show(e.currentTarget)}
        onBlur={() => setPos(null)}
        className="text-xs font-normal text-[#0d212c] leading-relaxed line-clamp-2 min-w-[9rem] max-w-[220px] outline-none"
      >
        {text}
      </p>
      {pos && (
        <div
          role="tooltip"
          style={{ left: pos.left, top: pos.top }}
          className="fixed z-50 w-80 bg-[#0d212c] text-white text-[11px] font-medium leading-relaxed px-3 py-2 rounded-xl shadow-xl pointer-events-none animate-in fade-in duration-150"
        >
          {text}
        </div>
      )}
    </>
  )
}

/** Icons of the four role KPI cards, in order */
const KPI_ICONS_OPERATIONS = [
  <Layers key="a" className="w-5 h-5 text-[#0284c7] stroke-[2]" />,
  <Clock key="b" className="w-5 h-5 text-[#d97706] stroke-[2]" />,
  <FileSignature key="c" className="w-5 h-5 text-[#6366f1] stroke-[2]" />,
  <GitFork key="d" className="w-5 h-5 text-[#ef4444] stroke-[2]" />,
]
const KPI_ICONS = [
  <Briefcase key="a" className="w-5 h-5 text-[#0284c7] stroke-[2]" />,
  <ClipboardList key="b" className="w-5 h-5 text-[#d97706] stroke-[2]" />,
  <CheckCircle2 key="c" className="w-5 h-5 text-[#16a34a] stroke-[2]" />,
  <GitFork key="d" className="w-5 h-5 text-[#ef4444] stroke-[2]" />,
]

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  userProfile,
  requests: sharedRequests,
  onRequestsChange,
}) => {
  const isInternalTeam =
    userProfile?.id === 'evaluator' || userProfile?.roleTitle === 'Internal Interest Team'
  const isStrategyTeam =
    userProfile?.id === 'strategy-fit' || userProfile?.roleTitle === 'Strategy Team'
  const isNonDirector = isInternalTeam || isStrategyTeam
  const isAdmin = userProfile?.id === 'partnership-admin'
  const isSponsor = userProfile?.id === 'sponsor' || userProfile?.roleTitle === 'Sponsor'
  const [localRequests, setLocalRequests] = useState<PartnershipRequest[]>(
    INITIAL_PARTNERSHIP_REQUESTS
  )
  const requests = sharedRequests ?? localRequests
  const setRequests = onRequestsChange ?? setLocalRequests
  const statusRole: StatusRole = isAdmin
    ? 'admin'
    : isSponsor
      ? 'sponsor'
      : isInternalTeam
        ? 'internal'
        : isStrategyTeam
          ? 'strategy'
          : 'director'
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all')
  const [stageFilter, setStageFilter] = useState('all')
  const [slaFilter, setSlaFilter] = useState('all')
  const [sortBy, setSortBy] = useState('default')
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedRequest = requests.find((r) => r.id === selectedId) ?? null
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  // The case whose notes panel is open over the table
  // Prototype navigation only: the Director creates a case that starts at a chosen stage
  const [testCaseOpen, setTestCaseOpen] = useState(false)
  const [testStage, setTestStage] = useState<(typeof WORKFLOW_STAGES)[number]>(WORKFLOW_STAGES[0])
  const createTestCase = () => {
    const testCase = buildTestCase(nextCaseCode(requests), testStage)
    setRequests((prev) => [testCase, ...prev])
    setTestCaseOpen(false)
    setSelectedId(testCase.id)
  }

  // The case whose notes popover is open, and the Notes icon it points at
  const [openNotes, setOpenNotes] = useState<{ id: string; anchor: HTMLElement } | null>(null)
  const notesRequest = requests.find((r) => r.id === openNotes?.id) ?? null
  // Every column plus Notes
  const columnCount = isNonDirector ? 10 : isAdmin ? 11 : 10

  // StatusChip colours for the five statuses
  const getStatusCategory = (status: DisplayStatus) =>
    ({
      Pending: 'warning',
      'In Progress': 'info',
      Completed: 'success',
      Closed: 'error',
      RFI: 'neutral',
    })[status] as 'warning' | 'info' | 'success' | 'neutral' | 'error'

  const notify = (message: string) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const updateRequest = (requestId: string, fn: (r: PartnershipRequest) => PartnershipRequest) =>
    setRequests((prev) => prev.map((r) => (r.id === requestId ? fn(r) : r)))

  // Director approves the brief
  const handleProceed = (requestId: string, reason: string) => {
    updateRequest(requestId, (r) => proceedRequest(r, reason))
    notify('Partnership request has been approved to proceed to the next stage.')
  }

  // Director rejects the request
  const handleReject = (requestId: string, reason: string) => {
    updateRequest(requestId, (r) => rejectRequest(r, reason))
    notify('Partnership request has been rejected.')
  }

  // Director asks the vendor for more information
  const handleRequestInfo = (
    requestId: string,
    email: { to: string; subject: string; body: string }
  ) => {
    updateRequest(requestId, (r) => holdRequest(r, email))
    notify(
      'Information request sent. The case is marked Information Requested until the vendor replies.'
    )
  }

  const handleResume = (requestId: string) => {
    updateRequest(requestId, resumeRequest)
    notify('Vendor information received. The case is back with the Director.')
  }

  // Something worth recording happened in the case view
  const handleLog = (requestId: string, event: AuditInput) =>
    updateRequest(requestId, (r) => appendAudit(r, event))

  // Director sends a review request to a team
  const handleSendReview: React.ComponentProps<typeof PartnershipDetail>['onSendReview'] = (
    requestId,
    team,
    payload
  ) => {
    updateRequest(requestId, (r) => {
      const sent = sendReview(r, team, payload)
      // Prototype: the Strategy Team's approval, with its conditions, shows up straight away
      return team === 'strategy'
        ? submitReview(sent, 'strategy', { response: SIMULATED_STRATEGY_RESPONSE })
        : sent
    })
    notify(
      team === 'internal'
        ? 'Request sent to the Internal Interest team. Waiting for their approval.'
        : 'Request sent to the Strategy Team. The Strategy Team has approved with conditions.'
    )
  }

  // A reviewing team submits, which counts as that stage's approval
  const handleSubmitReview: React.ComponentProps<typeof PartnershipDetail>['onSubmitReview'] = (
    requestId,
    team,
    payload
  ) => updateRequest(requestId, (r) => submitReview(r, team, payload))

  // Internal Interest outcome, sponsors, NDA, discovery, value and TDD
  const handleCaseAction = (requestId: string, action: CaseAction) => {
    setRequests((prev) => {
      const next = prev.map((r) => (r.id === requestId ? applyCaseAction(r, action) : r))
      const parent = next.find((r) => r.id === requestId)
      // Several sponsors: every co-sponsor gets a duplicate case, once
      if (
        action.type === 'assignSponsors' &&
        parent &&
        !prev.some((r) => r.splitFrom === requestId)
      ) {
        return [...next, ...buildSplitCases(parent)]
      }
      return next
    })
    const company = requests.find((r) => r.id === requestId)?.companyName ?? 'the partner'
    const message =
      action.type === 'closeWithEmail'
        ? `Email sent to ${company}. The request is closed.`
        : action.type === 'rejectWithEmail'
          ? `Email sent to ${company}. The request is rejected.`
          : CASE_ACTION_TOASTS[action.type]
    if (message) notify(message)
  }

  const handleAddNote = (requestId: string, html: string) =>
    handleCaseAction(requestId, {
      type: 'addNote',
      html,
      author: {
        name: userProfile?.name ?? 'Zaid Al Ali',
        role: userProfile?.designation ?? 'Director',
      },
    })

  // Partnership Admin routes the case
  const handleRoute = (requestId: string, routing: AdminRouting) => {
    updateRequest(requestId, (r) => routeRequest(r, routing))
    notify(
      routing.action === 'reject'
        ? 'Case has been rejected.'
        : routing.type === 'Partnership'
          ? 'Case sent to the Director.'
          : `Case routed to ${routing.type}. It is no longer in the Director's list.`
    )
  }

  const isDirectorRole = !isNonDirector && !isAdmin && !isSponsor

  // Filter requests
  // Directors and reviewers only see cases the Partnership Admin has sent on; the admin sees all
  // Reviewers only see cases the Director has sent to their team.
  const scopedRequests = isAdmin
    ? requests
    : requests.filter(
        (r) =>
          r.queue === 'director' &&
          (!isInternalTeam || r.sent?.internal) &&
          (!isStrategyTeam || r.sent?.strategy) &&
          (!isSponsor || Boolean(r.sponsors))
      )

  const statusOf = (r: PartnershipRequest) => getDisplayStatus(r, statusRole)

  const matchingRequests = scopedRequests.filter((req) => {
    // Exited cases are hidden from the internal and strategy teams
    if (isNonDirector && req.status === 'Exited') return false
    if (selectedStatusFilter !== 'all' && statusOf(req) !== selectedStatusFilter) return false
    if (stageFilter !== 'all' && getStageLabel(req) !== stageFilter) return false
    if (slaFilter !== 'all' && req.slaStatus !== slaFilter) return false

    if (!searchTerm.trim()) return true
    const q = searchTerm.toLowerCase()
    return (
      req.requestCode.toLowerCase().includes(q) ||
      (req.vendorId ?? '').toLowerCase().includes(q) ||
      req.companyName.toLowerCase().includes(q) ||
      (!isNonDirector && req.vendorName.toLowerCase().includes(q)) ||
      req.solution.toLowerCase().includes(q) ||
      req.focusArea.toLowerCase().includes(q) ||
      req.solutionMaturity.toLowerCase().includes(q)
    )
  })

  const time = (r: PartnershipRequest) => Date.parse(r.submittedOn) || 0
  const sortedRequests = [...matchingRequests].sort((a, b) => {
    if (sortBy === 'newest') return time(b) - time(a)
    if (sortBy === 'oldest') return time(a) - time(b)
    if (sortBy === 'company') return a.companyName.localeCompare(b.companyName)
    if (sortBy === 'days') return b.daysInStage - a.daysInStage
    return 0
  })
  const pageCount = Math.max(1, Math.ceil(sortedRequests.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const filteredRequests = sortedRequests.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const visibleRequestsForCount = isNonDirector
    ? scopedRequests.filter((r) => r.status !== 'Exited')
    : scopedRequests

  // Status chips with live counts
  const filterOptions = [
    { key: 'all', label: 'All requests', count: visibleRequestsForCount.length },
    ...DISPLAY_STATUSES.map((status) => ({
      key: status,
      label: status,
      count: visibleRequestsForCount.filter((r) => statusOf(r) === status).length,
    })),
  ]

  const activeFilterCount =
    [stageFilter, slaFilter].filter((v) => v !== 'all').length + (sortBy !== 'default' ? 1 : 0)
  const clearFilters = () => {
    setStageFilter('all')
    setSlaFilter('all')
    setSortBy('default')
    setPage(1)
  }

  // Detailed view rendering
  if (selectedRequest) {
    return (
      <div className="flex flex-col gap-6 w-full text-[#0d212c]">
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl bg-white border border-[#e2e8f0] text-xs sm:text-sm font-medium text-[#0d212c] flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-200">
            <div className="w-6 h-6 rounded-lg bg-[#e6fffa] text-[#0f766e] flex items-center justify-center border border-[#ccfbf1] shrink-0">
              <CheckCircle2 className="w-4 h-4 text-[#36c0c9]" />
            </div>
            <span>{toastMessage}</span>
          </div>
        )}
        <PartnershipDetail
          request={selectedRequest}
          allRequests={requests}
          onBack={() => setSelectedId(null)}
          onProceed={handleProceed}
          onReject={handleReject}
          onRequestInfo={handleRequestInfo}
          onResume={handleResume}
          onRoute={handleRoute}
          onLog={handleLog}
          onSendReview={handleSendReview}
          onSubmitReview={handleSubmitReview}
          onCaseAction={handleCaseAction}
          userProfile={userProfile}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full text-[#0d212c]">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl bg-white border border-[#e2e8f0] text-xs sm:text-sm font-medium text-[#0d212c] flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-200">
          <div className="w-6 h-6 rounded-lg bg-[#e6fffa] text-[#0f766e] flex items-center justify-center border border-[#ccfbf1] shrink-0">
            <CheckCircle2 className="w-4 h-4 text-[#36c0c9]" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 4 KPI Cards — Exact same design as director flow, role-tailored metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <>
          {(isInternalTeam
            ? internalInterestKpis(scopedRequests)
            : isStrategyTeam
              ? strategyLeadKpis(scopedRequests)
              : isSponsor
                ? sponsorKpis(scopedRequests)
                : isAdmin
                  ? adminKpis(scopedRequests)
                  : directorKpis(scopedRequests)
          ).map((card, i) => (
            <div
              key={card.title}
              className="bg-white/90 backdrop-blur-xs p-4 sm:p-5 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#94a3b8] uppercase tracking-[0.06em]">
                  {card.title}
                </span>
                <div className="flex items-center justify-center shrink-0">
                  {(isAdmin || isDirectorRole ? KPI_ICONS_OPERATIONS : KPI_ICONS)[i]}
                </div>
              </div>
              <div className="text-4xl font-medium text-[#0d212c] leading-none my-1">
                {card.value}
              </div>
              <div className="h-[1px] bg-slate-100 w-full" />
              <div className="text-xs font-medium text-[#64748b]">{card.caption}</div>
            </div>
          ))}
        </>
      </div>

      {/* Title */}
      <div className="pt-2">
        <h2 className="text-xl font-semibold text-[#0d212c]">Partnership Requests</h2>
      </div>

      {/* Filter Status Chips on the left & Search Bar on the right without search button */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {filterOptions.map((chip) => {
            const isSelected = selectedStatusFilter === chip.key
            return (
              <button
                key={chip.key}
                onClick={() => {
                  setSelectedStatusFilter(chip.key)
                  setPage(1)
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#36c0c9] text-white font-semibold shadow-xs'
                    : 'bg-white text-[#64748b] border border-[#e2e8f0] hover:bg-[#f8fafc]'
                }`}
              >
                <span>{chip.label}</span>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-[#f1f5f9] text-[#64748b]'
                  }`}
                >
                  {chip.count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto shrink-0">
          {statusRole === 'director' && (
            <Button
              variant="outline"
              size="md"
              onClick={() => setTestCaseOpen(true)}
              title="Prototype navigation only"
              className="gap-1.5 whitespace-nowrap"
            >
              <FlaskConical className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
              Add test case
            </Button>
          )}
          <div className="w-full sm:w-72">
            <SearchBar
              value={searchTerm}
              onChange={(val) => {
                setSearchTerm(val)
                setPage(1)
              }}
              placeholder="Search partnership requests..."
              showButton={false}
            />
          </div>
          {/* Filter always sits at the far right */}
          <TableFilterMenu
            stage={stageFilter}
            stageOptions={STAGE_OPTIONS}
            sla={slaFilter}
            slaOptions={isNonDirector ? undefined : SLA_OPTIONS}
            sort={sortBy}
            sortOptions={SORT_OPTIONS}
            onStageChange={(v) => {
              setStageFilter(v)
              setPage(1)
            }}
            onSlaChange={(v) => {
              setSlaFilter(v)
              setPage(1)
            }}
            onSortChange={(v) => {
              setSortBy(v)
              setPage(1)
            }}
            activeCount={activeFilterCount}
            onClear={clearFilters}
          />
        </div>
      </div>

      {/* Prototype navigation only: a new case that starts at the chosen stage */}
      <AppDialog
        isOpen={testCaseOpen}
        title="Add test case"
        description="Prototype navigation only. Earlier stages are filled with sample data."
        onClose={() => setTestCaseOpen(false)}
        actions={
          <>
            <Button variant="outline" size="md" onClick={() => setTestCaseOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={createTestCase}>
              Create
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="test-case-stage" className="text-xs font-semibold text-text-secondary">
            Start at stage
          </label>
          <Select
            id="test-case-stage"
            value={testStage}
            onChange={(e) => setTestStage(e.target.value as (typeof WORKFLOW_STAGES)[number])}
            options={WORKFLOW_STAGES.map((st) => ({ value: st, label: st }))}
          />
        </div>
      </AppDialog>

      {/* Case notes panel, docked over the table */}
      {notesRequest && (
        <CaseNotes
          // A new row's icon moves the popover: a fresh one opens, pointing at that icon
          key={notesRequest.id}
          request={notesRequest}
          status={statusOf(notesRequest)}
          onAddNote={(html) => handleAddNote(notesRequest.id, html)}
          onClose={() => setOpenNotes(null)}
          anchor={openNotes?.anchor}
        />
      )}

      {/* Partnership Requests Table — Referred by column removed from table per instruction */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs overflow-hidden w-full flex flex-col">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] text-[11px] font-medium uppercase tracking-wider">
                <th className="py-4 px-4 whitespace-nowrap">Case ID</th>
                <th className="py-4 px-4 whitespace-nowrap">Vendor ID</th>
                {isNonDirector ? (
                  <>
                    <th className="py-4 px-4">Company name</th>
                    <th className="py-4 px-4">Focus Area</th>
                    <th className="py-4 px-4">Solution Maturity</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4">Stage</th>
                    <th className="py-4 px-4">Deadline</th>
                    <th className="py-4 px-4">Submitted Date</th>
                  </>
                ) : (
                  <>
                    <th className="py-4 px-4">Company</th>
                    <th className="py-4 px-4">Solution description</th>
                    <th className="py-4 px-4">Status</th>
                    {isAdmin && <th className="py-4 px-4">Type</th>}
                    <th className="py-4 px-4">Stage</th>
                    <th className="py-4 px-4">Days in stage</th>
                    <th className="py-4 px-4">Owner</th>
                    <th className="py-4 px-4">SLA status</th>
                  </>
                )}
                <th className="py-4 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]/60">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="py-16 text-center text-[#64748b]">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                        <Inbox className="w-6 h-6 stroke-[1.5]" />
                      </div>
                      <h4 className="font-medium text-xs text-[#0d212c]">
                        No partnership requests found
                      </h4>
                      <p className="text-xs text-[#64748b] leading-relaxed">
                        No requests match your current search or filter criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <React.Fragment key={req.id}>
                    <tr
                      onClick={() => setSelectedId(req.id)}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                    >
                      <td className="py-4.5 px-4 text-xs font-medium text-[#64748b] whitespace-nowrap">
                        {req.requestCode}
                      </td>
                      <td className="py-4.5 px-4 text-xs font-medium text-[#64748b] whitespace-nowrap">
                        {req.vendorId ?? '-'}
                      </td>

                      <td className="py-4.5 px-4 text-xs font-medium text-[#0d212c] group-hover:text-[#36c0c9]">
                        {req.companyName}
                      </td>

                      {isNonDirector ? (
                        <>
                          <td className="py-4.5 px-4 text-xs font-normal text-[#64748b]">
                            <div className="flex flex-wrap gap-1.5 max-w-xs">
                              {(req.assessmentAreas?.focusAreas &&
                              req.assessmentAreas.focusAreas.length > 0
                                ? req.assessmentAreas.focusAreas
                                : req.tags && req.tags.length > 0
                                  ? req.tags
                                  : [req.focusArea]
                              ).map((area, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-normal whitespace-nowrap"
                                >
                                  {area}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="py-4.5 px-4 text-xs font-normal text-[#64748b]">
                            {req.solutionMaturity}
                          </td>

                          <td className="py-4.5 px-4 text-xs font-normal">
                            <StatusChip
                              label={statusOf(req)}
                              status={getStatusCategory(statusOf(req))}
                              dot={false}
                            />
                          </td>

                          <td className="py-4.5 px-4 min-w-[11rem]">
                            <StageChip progress={getStageProgress(req)} />
                          </td>

                          <td className="py-4.5 px-4 text-xs font-normal text-[#64748b] whitespace-nowrap">
                            {req.deadline || req.submittedOn}
                          </td>

                          <td className="py-4.5 px-4 text-xs font-normal text-[#64748b] whitespace-nowrap">
                            {req.submittedOn}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-4.5 px-4">
                            <DescriptionCell
                              text={
                                req.assessmentAreas?.productPlatformServiceDetails || req.solution
                              }
                            />
                          </td>

                          <td className="py-4.5 px-4 text-xs font-normal">
                            <StatusChip
                              label={statusOf(req)}
                              status={getStatusCategory(statusOf(req))}
                              dot={false}
                            />
                          </td>

                          {isAdmin && (
                            <td className="py-4.5 px-4 text-xs font-normal text-[#0d212c] whitespace-nowrap">
                              {req.caseType ? (
                                <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs">
                                  {req.caseType}
                                </span>
                              ) : (
                                <span className="text-[#94a3b8]">Unassigned</span>
                              )}
                            </td>
                          )}

                          <td className="py-4.5 px-4 min-w-[11rem]">
                            <StageChip progress={getStageProgress(req)} />
                          </td>

                          <td className="py-4.5 px-4 text-xs font-normal text-[#64748b] whitespace-nowrap">
                            {req.daysInStage} {req.daysInStage === 1 ? 'day' : 'days'}
                          </td>

                          <td className="py-4.5 px-4 text-xs font-normal text-[#0d212c] whitespace-nowrap">
                            {req.owner}
                          </td>

                          <td
                            className={`py-4.5 px-4 text-xs font-medium whitespace-nowrap ${SLA_TEXT_COLOR[req.slaStatus]}`}
                          >
                            {req.slaStatus}
                          </td>
                        </>
                      )}

                      <td className="py-4.5 px-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Clicking the open icon again is handled by the popover, which closes
                            if (openNotes?.id === req.id) return
                            setOpenNotes({ id: req.id, anchor: e.currentTarget })
                          }}
                          aria-label={`Open notes for ${req.companyName}${
                            req.notes?.length ? ` (${req.notes.length} notes)` : ''
                          }`}
                          aria-haspopup="dialog"
                          aria-expanded={openNotes?.id === req.id}
                          title="Open notes"
                          className={`relative w-8 h-8 rounded-lg inline-flex items-center justify-center border cursor-pointer transition ${
                            openNotes?.id === req.id
                              ? 'border-border-strong bg-bg-hover text-text-primary'
                              : 'border-border-default text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                          }`}
                        >
                          <NotebookPen className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                          {/* Teal dot: this case has notes */}
                          {Boolean(req.notes?.length) && (
                            <span
                              aria-hidden="true"
                              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[var(--app-accent)] ring-2 ring-bg-default"
                            />
                          )}
                        </button>
                      </td>
                    </tr>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={currentPage}
          pageSize={PAGE_SIZE}
          total={sortedRequests.length}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
