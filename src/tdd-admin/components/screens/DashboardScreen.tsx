'use client'

import React, { useState, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users,
  RefreshCw,
  Folder,
  Info,
  Check,
  X,
  Bell,
  MoreVertical,
} from 'lucide-react'
import { StatusChip } from '@/tdd-admin/components/atoms/StatusChip'
import { SearchBar } from '@/tdd-admin/components/molecules/SearchBar'
import { FilterMenu } from '@/tdd-admin/components/molecules/FilterMenu'
import {
  AssessmentDetailScreen,
  AssessmentDetailData,
  AssessmentStatus,
  MeetingLogEntry,
} from './AssessmentDetailScreen'

// An earlier round already conducted for the same case
interface PastRound {
  id: string
  questionnaire: string
  round: string
  status: AssessmentStatus
  score: string
  createdDate: string
}

// Someone who is not on the invite list asking to join a scheduled call
interface JoinRequest {
  id: string
  name: string
  email: string
  requestedAt: string
  decision?: 'approved' | 'rejected'
}

interface AssessmentRow {
  id: string
  caseId: string
  vendorId: string
  vendor: string
  questionnaire: string
  round: string
  status: AssessmentStatus
  score: string
  createdDate: string
  meetingDateTime?: string
  meetingLog?: MeetingLogEntry[]
  pastRounds?: PastRound[]
  joinRequests?: JoinRequest[]
}

const STATUS_LABELS: Record<AssessmentStatus, string> = {
  awaiting_evidence: 'Awaiting evidence',
  ready: 'Ready',
  cancelled: 'Cancelled',
  scheduled: 'Scheduled',
  finalised: 'Finalised',
  completed: 'Completed',
}

const getStatusChipStatus = (status: AssessmentStatus) =>
  status === 'awaiting_evidence'
    ? 'warning'
    : status === 'ready'
      ? 'info'
      : status === 'cancelled'
        ? 'error'
        : status === 'scheduled'
          ? 'info'
          : status === 'finalised'
            ? 'finalised'
            : 'success'

// Long questionnaire / round names are shortened to two words in the table
const truncateToTwoWords = (text: string) => {
  const words = text.split(/\s+/).filter(Boolean)
  return words.length > 2 ? `${words.slice(0, 2).join(' ')}…` : text
}

/** A partnership request from the other profile views, matched to an assessment by case ID */
export interface LinkedPartnershipCase {
  requestCode: string
  companyName: string
  vendorId?: string
  /** At Value & Due Diligence and waiting for the TDD Admin to complete the assessments */
  awaitingTddAdmin?: boolean
  /** At Value & Due Diligence, where the TDD assessments run */
  atValueStage?: boolean
}

export interface DashboardScreenProps {
  /** Partnership requests the assessments are matched to; their vendor details are shown */
  partnershipCases?: LinkedPartnershipCase[]
  /** Opens the partnership request behind an assessment (view only) */
  onViewPartnershipRequest?: (assessment: {
    caseId: string
    vendor: string
    vendorId: string
  }) => void
  /** Every assessment round for the case is done: the TDD report can be generated */
  onCompleteAssessments?: (caseId: string) => void
}

/**
 * Shows each assessment with the same vendor name and Vendor ID as its partnership request, and
 * adds an assessment for a request that has reached Value & Due Diligence without one
 */
const alignWithCases = (rows: AssessmentRow[], cases: LinkedPartnershipCase[]) => {
  const aligned = rows.map((row) => {
    const match = cases.find((c) => c.requestCode === row.caseId)
    return match
      ? { ...row, vendor: match.companyName, vendorId: match.vendorId ?? row.vendorId }
      : row
  })
  const added: AssessmentRow[] = cases
    .filter((c) => c.atValueStage && !rows.some((row) => row.caseId === c.requestCode))
    .map((c) => ({
      id: `case-${c.requestCode}`,
      caseId: c.requestCode,
      vendorId: c.vendorId ?? '-',
      vendor: c.companyName,
      questionnaire: 'Technical Questionnaire',
      round: 'Round 1',
      status: 'awaiting_evidence',
      score: '-',
      createdDate: new Date().toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    }))
  return [...added, ...aligned]
}

/** Only the fields alignWithCases changes, to tell whether anything moved */
const alignmentKey = (rows: AssessmentRow[]) =>
  rows.map((r) => `${r.id}|${r.vendor}|${r.vendorId}`).join('/')

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  partnershipCases = [],
  onViewPartnershipRequest,
  onCompleteAssessments,
}) => {
  // Assessment waiting for the "Mark assessment as completed" confirmation
  const [completingRowId, setCompletingRowId] = useState<string | null>(null)
  // Scheduled calls whose join requests are expanded in the notifications
  const [expandedJoinRows, setExpandedJoinRows] = useState<Record<string, boolean>>({})
  // Row whose actions menu is open, placed under its button (the table scrolls, so it is fixed)
  const [menu, setMenu] = useState<{ rowId: string; top: number; right: number } | null>(null)
  const menuRowId = menu?.rowId ?? null
  const setMenuRowId = (id: null) => setMenu(id)
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentDetailData | null>(null)
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [assessmentFilters, setAssessmentFilters] = useState<Record<string, string>>({})
  // Cases whose earlier rounds are expanded in the table
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  // Notification overlay listing join requests across all cases
  const [showNotifications, setShowNotifications] = useState(false)

  // Show 8 rows per page consistently across all tables
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 8

  // Varied rounds data and created date with time & AM/PM
  const [assessments, setAssessments] = useState<AssessmentRow[]>(() =>
    alignWithCases(
      [
        {
          id: 'ast-1',
          caseId: 'PR-126',
          vendorId: 'VND-1026',
          vendor: 'Presight AI | See the Future Today',
          questionnaire: 'Technical Questionnaire',
          round: 'Round 1',
          status: 'awaiting_evidence',
          score: 'Medium',
          createdDate: '1 Sept 2026, 10:30 AM',
        },
        {
          id: 'ast-2',
          caseId: 'PR-125',
          vendorId: 'VND-1025',
          vendor: 'Directus Inc.',
          questionnaire: 'Data Protection & Privacy',
          round: 'Round 2',
          status: 'completed',
          score: 'High',
          createdDate: '28 Aug 2026, 02:15 PM',
          pastRounds: [
            {
              id: 'ast-2-r1',
              questionnaire: 'Data Protection & Privacy',
              round: 'Round 1',
              status: 'finalised',
              score: 'Medium',
              createdDate: '06 Aug 2026, 10:00 AM',
            },
          ],
        },
        {
          id: 'ast-3',
          caseId: 'PR-124',
          vendorId: 'VND-1024',
          vendor: 'Pango Group LLC',
          questionnaire: 'Information Security & Compliance',
          round: 'Initial Review',
          status: 'completed',
          score: 'High',
          createdDate: '24 Aug 2026, 11:45 AM',
        },
        {
          id: 'ast-4',
          caseId: 'PR-123',
          vendorId: 'VND-1023',
          vendor: 'Apex Systems Advisory',
          questionnaire: 'Technical Questionnaire',
          round: 'Stage 2 Audit',
          status: 'scheduled',
          score: '-',
          createdDate: '20 Aug 2026, 04:20 PM',
          joinRequests: [
            {
              id: 'jr-1',
              name: 'Omar Haddad',
              email: 'omar.haddad@apexsystems.com',
              requestedAt: '20 Aug 2026, 05:02 PM',
            },
            {
              id: 'jr-2',
              name: 'Priya Menon',
              email: 'priya.menon@apexsystems.com',
              requestedAt: '20 Aug 2026, 05:10 PM',
            },
            {
              id: 'jr-3',
              name: 'Daniel Brooks',
              email: 'd.brooks@gmail.com',
              requestedAt: '20 Aug 2026, 05:18 PM',
            },
          ],
        },
        {
          id: 'ast-5',
          caseId: 'PR-122',
          vendorId: 'VND-1022',
          vendor: 'Delphi AI Technologies',
          questionnaire: 'SOC 2 Type II Vendor Risk Assessment',
          round: 'Round 1 - Technical',
          status: 'finalised',
          score: 'High',
          createdDate: '15 Aug 2026, 09:10 AM',
        },
        {
          id: 'ast-6',
          caseId: 'PR-121',
          vendorId: 'VND-1021',
          vendor: 'BioHealth Analytics',
          questionnaire: 'HIPAA & Healthcare Data Compliance',
          round: 'Follow-up Audit',
          status: 'awaiting_evidence',
          score: 'Low',
          createdDate: '12 Aug 2026, 03:45 PM',
          pastRounds: [
            {
              id: 'ast-6-r1',
              questionnaire: 'HIPAA & Healthcare Data Compliance',
              round: 'Round 1',
              status: 'finalised',
              score: 'Low',
              createdDate: '22 Jul 2026, 11:30 AM',
            },
          ],
        },
        {
          id: 'ast-7',
          caseId: 'PR-120',
          vendorId: 'VND-1020',
          vendor: 'CloudScale AI Systems',
          questionnaire: 'Third-Party Software Supply Chain Security',
          round: 'Round 3',
          status: 'completed',
          score: 'High',
          createdDate: '10 Aug 2026, 01:25 PM',
          pastRounds: [
            {
              id: 'ast-7-r2',
              questionnaire: 'Third-Party Software Supply Chain Security',
              round: 'Round 2',
              status: 'finalised',
              score: 'Medium',
              createdDate: '27 Jul 2026, 03:10 PM',
            },
            {
              id: 'ast-7-r1',
              questionnaire: 'Third-Party Software Supply Chain Security',
              round: 'Round 1',
              status: 'finalised',
              score: 'Low',
              createdDate: '09 Jul 2026, 10:40 AM',
            },
          ],
        },
        {
          id: 'ast-8',
          caseId: 'PR-119',
          vendorId: 'VND-1019',
          vendor: 'CyberGuard Solutions',
          questionnaire: 'ISO 27001 ISMS Security Checklist',
          round: 'Annual Re-evaluation',
          status: 'completed',
          score: 'High',
          createdDate: '08 Aug 2026, 11:10 AM',
        },
        {
          id: 'ast-9',
          caseId: 'PR-118',
          vendorId: 'VND-1018',
          vendor: 'HealthCloud Telemetry',
          questionnaire: 'Cloud Infrastructure Audit Questionnaire',
          round: 'Stage 1 Discovery',
          status: 'finalised',
          score: 'High',
          createdDate: '05 Aug 2026, 05:50 PM',
        },
        {
          id: 'ast-10',
          caseId: 'PR-117',
          vendorId: 'VND-1017',
          vendor: 'PharmaTech Analytics',
          questionnaire: 'Clinical AI Safety & Ethics Questionnaire',
          round: 'Pre-onboarding',
          status: 'scheduled',
          score: '-',
          createdDate: '01 Aug 2026, 09:30 AM',
          joinRequests: [
            {
              id: 'jr-4',
              name: 'Hana Yusuf',
              email: 'hana.yusuf@pharmatech.ai',
              requestedAt: '01 Aug 2026, 10:05 AM',
            },
            {
              id: 'jr-5',
              name: 'Liam Carter',
              email: 'liam.carter@pharmatech.ai',
              requestedAt: '01 Aug 2026, 10:12 AM',
            },
          ],
        },
        {
          id: 'ast-11',
          caseId: 'PR-116',
          vendorId: 'VND-1016',
          vendor: 'MedSec Audit Co',
          questionnaire: 'UAE DOH Health Data Residency Compliance',
          round: 'Round 2 - Compliance',
          status: 'awaiting_evidence',
          score: 'Low',
          createdDate: '28 Jul 2026, 04:15 PM',
          pastRounds: [
            {
              id: 'ast-11-r1',
              questionnaire: 'UAE DOH Health Data Residency Compliance',
              round: 'Round 1 - Compliance',
              status: 'finalised',
              score: 'Low',
              createdDate: '07 Jul 2026, 09:15 AM',
            },
          ],
        },
        {
          id: 'ast-12',
          caseId: 'PR-115',
          vendorId: 'VND-1015',
          vendor: 'Global Diagnostics IT',
          questionnaire: 'Business Continuity & Disaster Recovery Audit',
          round: 'Final Review',
          status: 'finalised',
          score: 'High',
          createdDate: '25 Jul 2026, 02:00 PM',
        },
      ],
      partnershipCases
    )
  )

  // Requests change in the other profile views (new cases, names): keep the assessments in step
  React.useEffect(() => {
    setAssessments((prev) => {
      const next = alignWithCases(prev, partnershipCases)
      return alignmentKey(next) === alignmentKey(prev) ? prev : next
    })
  }, [partnershipCases])

  // KPI Card data calculations
  const completedAssessments = assessments.filter((a) => a.status === 'completed').length
  const finalizedAssessments = assessments.filter((a) => a.status === 'finalised').length

  // Filter chips click options
  const filterOptions = [
    { key: 'all', label: 'All assessments', count: assessments.length },
    {
      key: 'awaiting_evidence',
      label: 'Awaiting evidence',
      count: assessments.filter((a) => a.status === 'awaiting_evidence').length,
    },
    { key: 'completed', label: 'Completed', count: completedAssessments },
    { key: 'finalised', label: 'Finalised', count: finalizedAssessments },
    {
      key: 'scheduled',
      label: 'Scheduled',
      count: assessments.filter((a) => a.status === 'scheduled').length,
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      count: assessments.filter((a) => a.status === 'cancelled').length,
    },
  ]

  const handleFilterClick = (key: string) => {
    setSelectedStatusFilter(key)
    setCurrentPage(1)
  }

  const handleSearchChange = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1)
  }

  // Filtered dataset
  const filteredAssessments = useMemo(() => {
    const matching = assessments.filter((item) => {
      const matchesStatus = selectedStatusFilter === 'all' || item.status === selectedStatusFilter
      const matchesSearch =
        item.caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vendorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.questionnaire.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.round.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilters =
        (!assessmentFilters.vendor || item.vendor === assessmentFilters.vendor) &&
        (!assessmentFilters.confidence || item.score === assessmentFilters.confidence) &&
        (!assessmentFilters.questionnaire || item.questionnaire === assessmentFilters.questionnaire)
      return matchesStatus && matchesSearch && matchesFilters
    })
    // Assessments whose request is waiting on the TDD Admin come first
    const waiting = (row: AssessmentRow) =>
      partnershipCases.some((c) => c.requestCode === row.caseId && c.awaitingTddAdmin) &&
      ['awaiting_evidence', 'completed', 'finalised'].includes(row.status)
    return [...matching.filter(waiting), ...matching.filter((row) => !waiting(row))]
  }, [assessments, selectedStatusFilter, searchTerm, assessmentFilters, partnershipCases])

  // Filter options are built from the assessments currently listed
  const assessmentFilterFields = useMemo(() => {
    const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b))
    return [
      { key: 'vendor', label: 'Vendor name', options: unique(assessments.map((a) => a.vendor)) },
      { key: 'confidence', label: 'Confidence', options: ['High', 'Medium', 'Low'] },
      {
        key: 'questionnaire',
        label: 'Questionnaire',
        options: unique(assessments.map((a) => a.questionnaire)),
      },
    ]
  }, [assessments])

  // Pending join requests across every case, for the notification overlay
  const pendingJoinRequests = assessments.flatMap((row) =>
    (row.joinRequests ?? []).filter((r) => !r.decision).map((request) => ({ row, request }))
  )
  // Scheduled calls with join requests, each listing everyone who asked to join
  const joinRequestRows = assessments.filter((row) => row.joinRequests?.length)

  const decideJoinRequest = (rowId: string, requestId: string, decision: 'approved' | 'rejected') =>
    setAssessments((prev) =>
      prev.map((a) =>
        a.id === rowId
          ? {
              ...a,
              joinRequests: a.joinRequests?.map((r) =>
                r.id === requestId ? { ...r, decision } : r
              ),
            }
          : a
      )
    )

  const openAssessment = (row: AssessmentRow, round?: PastRound) => {
    const source = round ? { ...row, ...round } : row
    setSelectedAssessment({
      ...source,
      score: source.score === 'High' ? '94.0' : source.score === 'Medium' ? '72.0' : '0.0',
    })
  }

  // Pagination math (8 items per page)
  const totalPages = Math.ceil(filteredAssessments.length / ITEMS_PER_PAGE) || 1
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedAssessments = filteredAssessments.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handleUpdateStatus = (
    id: string,
    newStatus: 'ready' | 'finalised' | 'completed' | 'cancelled'
  ) => {
    setAssessments((prev) => prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)))
    if (selectedAssessment && selectedAssessment.id === id) {
      setSelectedAssessment((prev) => (prev ? { ...prev, status: newStatus } : null))
    }
  }

  // Keeps reschedule / cancellation details when navigating back to the dashboard
  const handleMeetingChange = (
    id: string,
    update: { meetingDateTime: string; meetingLog: MeetingLogEntry[] }
  ) => {
    setAssessments((prev) => prev.map((a) => (a.id === id ? { ...a, ...update } : a)))
  }

  const completingRow = assessments.find((a) => a.id === completingRowId)

  if (selectedAssessment) {
    return (
      <AssessmentDetailScreen
        assessment={selectedAssessment}
        onBack={() => setSelectedAssessment(null)}
        onStatusChange={(newStatus) => handleUpdateStatus(selectedAssessment.id, newStatus)}
        onMeetingChange={(update) => handleMeetingChange(selectedAssessment.id, update)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full p-4 text-[#0d212c]">
      {/* Breadcrumb Menu */}
      <div className="text-xs font-semibold text-[#64748b] flex items-center gap-1.5">
        <span>M42 admin</span>
        <span>/</span>
        <span className="text-[#36c0c9] font-bold">Dashboard</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* KPI Card 1: Total Vendors */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Users className="w-5 h-5 text-[#0d212c] shrink-0" />
              <h3 className="font-bold text-xs sm:text-sm text-[#0d212c] truncate">
                Total Vendors
              </h3>
            </div>
            <div className="text-2xl font-extrabold text-[#36c0c9] shrink-0">12</div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-[#e2e8f0] pt-3 border-t border-[#e2e8f0]">
            <div className="flex flex-col gap-0.5 pr-2">
              <span className="text-lg font-bold text-[#0d212c]">7</span>
              <span className="text-[11px] text-[#64748b] font-medium">High confidence</span>
            </div>
            <div className="flex flex-col gap-0.5 px-3">
              <span className="text-lg font-bold text-[#0d212c]">2</span>
              <span className="text-[11px] text-[#64748b] font-medium">Medium confidence</span>
            </div>
            <div className="flex flex-col gap-0.5 pl-3">
              <span className="text-lg font-bold text-[#0d212c]">3</span>
              <span className="text-[11px] text-[#64748b] font-medium">Low confidence</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-1 text-[11px] text-[#64748b]">
            <Info className="w-3.5 h-3.5 text-[#36c0c9] shrink-0" />
            <span>Breakdown by Overall Assessment Score</span>
          </div>
        </div>

        {/* KPI Card 2: Average Rounds per Vendor */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <RefreshCw className="w-5 h-5 text-[#0d212c] shrink-0" />
              <h3 className="font-bold text-xs sm:text-sm text-[#0d212c] truncate">
                Average Rounds per Vendor
              </h3>
            </div>
            <div className="text-2xl font-extrabold text-[#36c0c9] shrink-0">2</div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-[#e2e8f0] pt-3 border-t border-[#e2e8f0]">
            <div className="flex flex-col gap-0.5 pr-2">
              <span className="text-lg font-bold text-[#0d212c]">8</span>
              <span className="text-[11px] text-[#64748b] font-medium">1 Round</span>
            </div>
            <div className="flex flex-col gap-0.5 px-3">
              <span className="text-lg font-bold text-[#0d212c]">3</span>
              <span className="text-[11px] text-[#64748b] font-medium">2 Rounds</span>
            </div>
            <div className="flex flex-col gap-0.5 pl-3">
              <span className="text-lg font-bold text-[#0d212c]">1</span>
              <span className="text-[11px] text-[#64748b] font-medium">3+ Rounds</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-1 text-[11px] text-[#64748b]">
            <Info className="w-3.5 h-3.5 text-[#36c0c9] shrink-0" />
            <span>Breakdown by Assessment Rounds</span>
          </div>
        </div>

        {/* KPI Card 3: Evidence backlog by age */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Folder className="w-5 h-5 text-[#0d212c] shrink-0" />
              <h3 className="font-bold text-xs sm:text-sm text-[#0d212c] truncate">
                Evidence backlog by age
              </h3>
            </div>
            <div className="text-2xl font-extrabold text-[#36c0c9] shrink-0">75</div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-[#e2e8f0] pt-3 border-t border-[#e2e8f0]">
            <div className="flex flex-col gap-0.5 pr-2">
              <span className="text-lg font-bold text-[#0d212c]">33</span>
              <span className="text-[11px] text-[#64748b] font-medium">0–14 days</span>
            </div>
            <div className="flex flex-col gap-0.5 px-3">
              <span className="text-lg font-bold text-[#0d212c]">8</span>
              <span className="text-[11px] text-[#64748b] font-medium">15–30 days</span>
            </div>
            <div className="flex flex-col gap-0.5 pl-3">
              <span className="text-lg font-bold text-[#0d212c]">34</span>
              <span className="text-[11px] text-[#64748b] font-medium">Over 30 days</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-1 text-[11px] text-[#64748b]">
            <Info className="w-3.5 h-3.5 text-[#36c0c9] shrink-0" />
            <span>Breakdown by Ageing Bucket for Awaiting Evidence status</span>
          </div>
        </div>
      </div>

      {/* Assessments Title & Search Bar Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <h2 className="text-xl font-extrabold text-[#0d212c]">Assessments</h2>
        <div className="flex items-stretch gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-80 shrink-0">
            <SearchBar
              placeholder="Search vendor name, questionnaire..."
              onSearch={handleSearchChange}
            />
          </div>
          <FilterMenu
            fields={assessmentFilterFields}
            values={assessmentFilters}
            onChange={(values) => {
              setAssessmentFilters(values)
              setCurrentPage(1)
            }}
          />
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowNotifications((o) => !o)}
              aria-expanded={showNotifications}
              aria-label="Join request notifications"
              title="Join requests"
              className={`relative h-10 w-10 inline-flex items-center justify-center rounded-full border bg-white shadow-xs transition cursor-pointer ${
                showNotifications ? 'border-[#cbd5e1]' : 'border-[#e2e8f0] hover:border-[#cbd5e1]'
              }`}
            >
              <Bell className="w-4 h-4 text-[#64748b]" />
              {pendingJoinRequests.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-4.5 h-4.5 px-1 rounded-full bg-[#dc2626] text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingJoinRequests.length}
                </span>
              )}
            </button>

            {/* Overlay listing every pending join request */}
            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowNotifications(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 top-full mt-2 z-40 w-[400px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-[#e2e8f0] shadow-xl flex flex-col animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 pt-4 pb-3 border-b border-[#e2e8f0] flex items-center justify-between">
                    <span className="text-sm font-bold text-[#0d212c]">Join requests</span>
                    <span className="text-[11px] font-semibold text-[#64748b]">
                      {pendingJoinRequests.length} pending
                    </span>
                  </div>
                  <div className="max-h-[420px] overflow-y-auto divide-y divide-[#e2e8f0]/80">
                    {joinRequestRows.length === 0 ? (
                      <p className="py-8 text-center text-xs text-[#64748b]">
                        No join requests right now.
                      </p>
                    ) : (
                      joinRequestRows.map((row) => {
                        const pending = row.joinRequests!.filter((r) => !r.decision).length
                        const open = expandedJoinRows[row.id] ?? pending > 0
                        return (
                          <div key={row.id} className="flex flex-col">
                            {/* The scheduled call: vendor, IDs and round; opens the people list */}
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedJoinRows((prev) => ({ ...prev, [row.id]: !open }))
                              }
                              aria-expanded={open}
                              className="w-full text-left flex items-start gap-3 px-4 py-3 bg-transparent border-0 hover:bg-[#f8fafc] transition cursor-pointer"
                            >
                              <div className="min-w-0 flex-1 flex flex-col gap-1">
                                <span
                                  className="text-xs font-bold text-[#0d212c] truncate"
                                  title={row.vendor}
                                >
                                  {row.vendor}
                                </span>
                                <span className="flex items-center gap-2 text-[11px] text-[#64748b] flex-wrap">
                                  <span>
                                    Case ID:{' '}
                                    <span className="font-semibold text-[#0d212c]">
                                      {row.caseId}
                                    </span>
                                  </span>
                                  <span className="w-px h-3 bg-[#cbd5e1]" aria-hidden="true" />
                                  <span>
                                    Vendor ID:{' '}
                                    <span className="font-semibold text-[#0d212c]">
                                      {row.vendorId}
                                    </span>
                                  </span>
                                  <span className="w-px h-3 bg-[#cbd5e1]" aria-hidden="true" />
                                  <span>{row.round}</span>
                                </span>
                                <span className="text-[10px] text-[#94a3b8]">
                                  {row.joinRequests!.length}{' '}
                                  {row.joinRequests!.length === 1 ? 'request' : 'requests'}
                                  {pending > 0 ? ` · ${pending} pending` : ''}
                                </span>
                              </div>
                              <ChevronDown
                                className={`w-4 h-4 mt-0.5 text-[#64748b] shrink-0 transition-transform duration-200 ${
                                  open ? 'rotate-180' : ''
                                }`}
                                aria-hidden="true"
                              />
                            </button>
                            {open && (
                              <ul
                                aria-label={`Join requests for ${row.caseId}`}
                                className="px-4 pb-3 flex flex-col divide-y divide-[#f1f5f9]"
                              >
                                {row.joinRequests!.map((request) => (
                                  <li key={request.id} className="flex items-center gap-3 py-2.5">
                                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                      <span className="text-xs font-bold text-[#0d212c] truncate">
                                        {request.name}
                                      </span>
                                      <span className="text-[11px] text-[#64748b] truncate">
                                        {request.email}
                                      </span>
                                      <span className="text-[10px] text-[#94a3b8]">
                                        Requested {request.requestedAt}
                                      </span>
                                    </div>
                                    {request.decision ? (
                                      <StatusChip
                                        label={
                                          request.decision === 'approved' ? 'Approved' : 'Rejected'
                                        }
                                        status={
                                          request.decision === 'approved' ? 'success' : 'error'
                                        }
                                        dot={false}
                                      />
                                    ) : (
                                      <div className="flex items-center gap-2 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            decideJoinRequest(row.id, request.id, 'rejected')
                                          }
                                          aria-label={`Reject ${request.name}`}
                                          title="Reject"
                                          className="w-8 h-8 rounded-lg border border-[#fecaca] bg-[#fef2f2] text-[#dc2626] hover:bg-[#fee2e2] inline-flex items-center justify-center transition cursor-pointer"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            decideJoinRequest(row.id, request.id, 'approved')
                                          }
                                          aria-label={`Approve ${request.name}`}
                                          title="Approve"
                                          className="w-8 h-8 rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] text-[#16a34a] hover:bg-[#dcfce7] inline-flex items-center justify-center transition cursor-pointer"
                                        >
                                          <Check className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filter Chips (below Title & Search Bar row) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterOptions.map((chip) => {
          const isSelected = selectedStatusFilter === chip.key
          return (
            <button
              key={chip.key}
              onClick={() => handleFilterClick(chip.key)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? 'bg-[#36c0c9] text-white font-bold shadow-xs'
                  : 'bg-white text-[#64748b] border border-[#e2e8f0] hover:bg-[#f8fafc]'
              }`}
            >
              <span>{chip.label}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/25 text-white' : 'bg-[#f1f5f9] text-[#64748b]'
                }`}
              >
                {chip.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Vendor Assessments Directory Table */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-xs overflow-hidden w-full flex flex-col">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[#64748b] text-xs font-bold">
                <th className="py-3.5 px-4 whitespace-nowrap">Case ID</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Vendor ID</th>
                <th className="py-3.5 px-4">Vendor</th>
                <th className="py-3.5 px-4">Questionnaire</th>
                <th className="py-3.5 px-4">Round</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Confidence Level</th>
                <th className="py-3.5 px-4">Created date</th>
                <th className="py-3.5 px-4 w-12">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]/60">
              {paginatedAssessments.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#64748b] text-sm">
                    No assessments matching search criteria.
                  </td>
                </tr>
              ) : (
                paginatedAssessments.map((row) => {
                  const hasPastRounds = Boolean(row.pastRounds?.length)
                  const isExpanded = hasPastRounds && Boolean(expandedRows[row.id])
                  return (
                    <React.Fragment key={row.id}>
                      <tr
                        onClick={() => openAssessment(row)}
                        className="hover:bg-[#f8fafc] transition cursor-pointer group"
                      >
                        <td className="py-3.5 px-4 font-bold text-xs text-[#0d212c] whitespace-nowrap">
                          {row.caseId}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-xs text-[#0d212c] whitespace-nowrap">
                          {row.vendorId}
                        </td>
                        <td
                          className="py-3.5 px-4 font-semibold text-xs text-[#0d212c] group-hover:text-[#36c0c9] truncate"
                          title={row.vendor}
                        >
                          {row.vendor}
                        </td>
                        <td
                          className="py-3.5 px-4 text-xs text-[#0d212c] whitespace-nowrap"
                          title={row.questionnaire}
                        >
                          {truncateToTwoWords(row.questionnaire)}
                        </td>
                        <td
                          className="py-3.5 px-4 text-[#64748b] text-xs font-medium whitespace-nowrap"
                          title={row.round}
                        >
                          {truncateToTwoWords(row.round)}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusChip
                            label={STATUS_LABELS[row.status]}
                            status={getStatusChipStatus(row.status)}
                            dot={false}
                          />
                        </td>
                        <td className="py-3.5 px-4">
                          {row.score === '-' ? (
                            <span className="text-[#64748b] font-[#64748b] text-xs pl-2.5">-</span>
                          ) : (
                            <StatusChip
                              label={row.score}
                              status={row.score === 'High' ? 'success' : 'warning'}
                              dot={false}
                            />
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-[#64748b] text-xs font-medium">
                          {row.createdDate}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="relative inline-flex">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                const r = e.currentTarget.getBoundingClientRect()
                                setMenu((open) =>
                                  open?.rowId === row.id
                                    ? null
                                    : {
                                        rowId: row.id,
                                        top: r.bottom + 4,
                                        right: window.innerWidth - r.right,
                                      }
                                )
                              }}
                              aria-haspopup="menu"
                              aria-expanded={menuRowId === row.id}
                              aria-label={`More actions for ${row.caseId}`}
                              className="w-8 h-8 rounded-lg border-0 bg-transparent p-0 text-[#64748b] hover:text-[#0d212c] hover:bg-[#f1f5f9] inline-flex items-center justify-center transition cursor-pointer"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {menuRowId === row.id && (
                              <>
                                {/* Clicking anywhere else closes the menu */}
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setMenuRowId(null)
                                  }}
                                />
                                <div
                                  role="menu"
                                  style={{ top: menu?.top, right: menu?.right }}
                                  className="fixed z-50 w-48 bg-white border border-[#e2e8f0] rounded-xl shadow-xl p-1 animate-in fade-in duration-100"
                                >
                                  {(() => {
                                    const linkedCase = partnershipCases.find(
                                      (c) => c.requestCode === row.caseId
                                    )
                                    const canComplete = [
                                      'awaiting_evidence',
                                      'completed',
                                      'finalised',
                                    ].includes(row.status)
                                    const completeEnabled = Boolean(
                                      linkedCase?.awaitingTddAdmin && onCompleteAssessments
                                    )
                                    const itemClass =
                                      'w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-[#0d212c] hover:bg-[#f1f5f9] disabled:text-[#94a3b8] disabled:hover:bg-transparent disabled:cursor-not-allowed transition cursor-pointer border-0 bg-transparent'
                                    return (
                                      <>
                                        <button
                                          type="button"
                                          role="menuitem"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setMenuRowId(null)
                                            onViewPartnershipRequest?.({
                                              caseId: row.caseId,
                                              vendor: row.vendor,
                                              vendorId: row.vendorId,
                                            })
                                          }}
                                          className={itemClass}
                                        >
                                          View partnership request details
                                        </button>
                                        {hasPastRounds && (
                                          <button
                                            type="button"
                                            role="menuitem"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setMenuRowId(null)
                                              setExpandedRows((prev) => ({
                                                ...prev,
                                                [row.id]: !prev[row.id],
                                              }))
                                            }}
                                            className={itemClass}
                                          >
                                            {isExpanded
                                              ? 'Hide earlier assessment rounds'
                                              : 'View all assessment rounds'}
                                          </button>
                                        )}
                                        {canComplete && (
                                          <button
                                            type="button"
                                            role="menuitem"
                                            disabled={!completeEnabled}
                                            title={
                                              completeEnabled
                                                ? undefined
                                                : 'Available once the partnership request is at Value & Due Diligence and waiting for the TDD assessments'
                                            }
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setMenuRowId(null)
                                              setCompletingRowId(row.id)
                                            }}
                                            className={`${itemClass} !text-[#15803d] hover:!bg-[#f0fdf4] disabled:!text-[#86b99a] disabled:hover:!bg-transparent`}
                                          >
                                            Mark assessment complete
                                          </button>
                                        )}
                                      </>
                                    )
                                  })()}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Earlier rounds conducted for this case, newest first */}
                      {isExpanded &&
                        row.pastRounds?.map((round) => (
                          <tr
                            key={round.id}
                            onClick={() => openAssessment(row, round)}
                            className="bg-[#f8fafc]/70 hover:bg-[#f1f5f9] transition cursor-pointer animate-in fade-in duration-150"
                          >
                            <td className="py-3 px-4 text-xs text-[#64748b] whitespace-nowrap">
                              {row.caseId}
                            </td>
                            <td className="py-3 px-4 text-xs text-[#64748b] whitespace-nowrap">
                              {row.vendorId}
                            </td>
                            <td
                              className="py-3 px-4 font-semibold text-xs text-[#0d212c] truncate"
                              title={row.vendor}
                            >
                              {row.vendor}
                            </td>
                            <td
                              className="py-3 px-4 text-xs text-[#0d212c] whitespace-nowrap"
                              title={round.questionnaire}
                            >
                              {truncateToTwoWords(round.questionnaire)}
                            </td>
                            <td
                              className="py-3 px-4 text-[#64748b] text-xs font-medium whitespace-nowrap"
                              title={round.round}
                            >
                              {truncateToTwoWords(round.round)}
                            </td>
                            <td className="py-3 px-4">
                              <StatusChip
                                label={STATUS_LABELS[round.status]}
                                status={getStatusChipStatus(round.status)}
                                dot={false}
                              />
                            </td>
                            <td className="py-3 px-4">
                              <StatusChip
                                label={round.score}
                                status={round.score === 'High' ? 'success' : 'warning'}
                                dot={false}
                              />
                            </td>
                            <td className="py-3 px-4 text-[#64748b] text-xs font-medium">
                              {round.createdDate}
                            </td>
                            <td />
                          </tr>
                        ))}
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 6 Items per page Pagination Footer (Requirement 1) */}
        {filteredAssessments.length > 0 && (
          <div className="flex items-[#64748b] justify-between px-4 py-3 border-t border-[#e2e8f0] bg-[#f8fafc]">
            <div className="text-xs text-[#64748b] font-medium">
              Showing page <span className="font-semibold text-[#0d212c]">{currentPage}</span> of{' '}
              <span className="font-semibold text-[#0d212c]">{totalPages}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-[#cbd5e1] text-xs font-semibold text-[#0d212c] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer flex items-center justify-center"
                title="Previous page"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-[#36c0c9] text-white'
                        : 'text-[#64748b] hover:bg-slate-200/60'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-[#cbd5e1] text-xs font-semibold text-[#0d212c] bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition cursor-pointer flex items-center justify-center"
                title="Next page"
                aria-label="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm that every TDD assessment round is done for the case */}
      {completingRow && (
        <div className="fixed inset-0 z-50 bg-[#0d212c]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="complete-assessment-title"
            className="relative bg-white rounded-3xl max-w-md w-full p-7 shadow-2xl border border-[#e2e8f0] flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150"
          >
            <button
              onClick={() => setCompletingRowId(null)}
              className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-[#0d212c] transition cursor-pointer bg-transparent border-0"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex flex-col gap-2 pr-6">
              <h3 id="complete-assessment-title" className="text-lg font-bold text-[#0d212c]">
                Mark assessment as completed?
              </h3>
              <p className="text-xs text-[#64748b] leading-relaxed">
                You are confirming that every technical due diligence assessment round for{' '}
                <span className="font-semibold text-[#0d212c]">{completingRow.vendor}</span> (
                {completingRow.caseId}) is complete. The agent will generate the TDD report from
                these rounds, and the request moves on to the sponsor&apos;s final decision.
              </p>
              {completingRow.status !== 'finalised' && (
                <p className="text-xs text-[#64748b] leading-relaxed">
                  The assessment status will change to Finalised.
                </p>
              )}
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCompletingRowId(null)}
                className="px-5 py-2.5 rounded-lg border border-[#e2e8f0] bg-white text-xs font-bold text-[#0d212c] hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (completingRow.status !== 'finalised') {
                    handleUpdateStatus(completingRow.id, 'finalised')
                  }
                  onCompleteAssessments?.(completingRow.caseId)
                  setCompletingRowId(null)
                }}
                className="px-5 py-2.5 rounded-lg bg-[#36c0c9] hover:bg-[#2badb6] text-white text-xs font-bold transition cursor-pointer border-0"
              >
                Mark as completed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
