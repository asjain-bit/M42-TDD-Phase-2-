'use client'

import React, { useState, useEffect } from 'react'
import {
  Send,
  Calendar,
  Users,
  PhoneCall,
  CheckCircle2,
  Eye,
  Download,
  Play,
  Pause,
  Copy,
  Check,
  Paperclip,
  Upload,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Clock,
  User,
  Bot,
  Mail,
  FileText,
  MessageSquare,
  XCircle,
  AlertTriangle,
  X,
  Pencil,
  Search,
} from 'lucide-react'
import { StatusChip } from '@/tdd-admin/components/atoms/StatusChip'

export type AssessmentStatus =
  'awaiting_evidence' | 'completed' | 'scheduled' | 'cancelled' | 'finalised' | 'ready'

export interface MeetingLogEntry {
  id: string
  type: 'rescheduled' | 'cancelled'
  timestamp: string
  actor: string
  details: string
  reason: string
}

export interface AssessmentDetailData {
  id: string
  caseId: string
  vendor: string
  questionnaire: string
  round: string
  status: AssessmentStatus
  score: string
  createdDate: string
  meetingDateTime?: string
  meetingLog?: MeetingLogEntry[]
}

interface AssessmentDetailScreenProps {
  assessment: AssessmentDetailData
  onBack: () => void
  onStatusChange?: (newStatus: 'ready' | 'finalised' | 'completed' | 'cancelled') => void
  onMeetingChange?: (update: { meetingDateTime: string; meetingLog: MeetingLogEntry[] }) => void
}

type ConfidenceLevel = 'High confidence' | 'Medium confidence' | 'Low confidence'

const CONFIDENCE_OPTIONS: { level: ConfidenceLevel; description: string }[] = [
  { level: 'High confidence', description: 'Strong evidence supports the answer.' },
  { level: 'Medium confidence', description: 'Partial evidence or some uncertainty exists.' },
  {
    level: 'Low confidence',
    description: 'Insufficient evidence or significant uncertainty exists.',
  },
]

const CONFIDENCE_REASON_MAX = 300

interface ConfidenceChange {
  id: string
  questionId: number
  from: ConfidenceLevel
  to: ConfidenceLevel
  reason: string
  changedBy: string
  date: string
}

interface AttachedFile {
  name: string
  size: string
  type: string
  date: string
}

interface QuestionComment {
  id: string
  text: string
  author: string
  reviewer: string
  date: string
}

const CURRENT_USER = 'Zaid Al Ali'

// Formats a date as "27 Oct 2026, 06:29 PM"
const formatTimestamp = (date: Date) =>
  `${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`

const DEFAULT_MEETING_RECIPIENTS = ['zaid.alali@m42.ae', 'audit@facility.ae', 'sam.ai@m42.ae']
const MAX_MEETING_RECIPIENTS = 5

// Converts a 24h "HH:MM" time input value into "hh:mm AM/PM"
const formatTimeInput = (value: string) => {
  const [h, m] = value.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
}

const REVIEWER_NAMES = [
  'Sarah Al Nuaimi',
  'Dr. Tariq Al Mansoori',
  'Marcus Vance',
  'Fatima Al Hosani',
  'Alex Rivera',
  'Zaid Al Ali',
]

interface AuditTrailEvent {
  id: string
  title: string
  category: 'System' | 'Admin' | 'AI Agent' | 'Vendor' | 'Reviewer'
  timestamp: string
  actor: string
  details: string
  icon: React.ElementType
  confidence?: 'High confidence' | 'Medium confidence' | 'Low confidence'
}

export const AssessmentDetailScreen: React.FC<AssessmentDetailScreenProps> = ({
  assessment,
  onBack,
  onStatusChange,
  onMeetingChange,
}) => {
  const [activeTab, setActiveTab] = useState<'assessment' | 'audit_trail'>('assessment')
  const [showAnswerKey, setShowAnswerKey] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState('1')
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<AssessmentStatus>(assessment.status)

  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [questionComments, setQuestionComments] = useState<Record<number, QuestionComment>>(() => {
    const initialComments: Record<number, QuestionComment> = {}
    if (assessment.status === 'finalised') {
      initialComments[3] = {
        id: `comment-3-${assessment.id}`,
        text: 'Stage 2 certification audit confirmed and ISO/IEC 27001 certificate verified.',
        author: 'Zaid Al Ali',
        reviewer: 'Dr. Tariq Al Mansoori',
        date: assessment.createdDate || '15 Aug 2026, 09:10 AM',
      }
      initialComments[6] = {
        id: `comment-6-${assessment.id}`,
        text: 'Recent SOC 2 Type II report and executive penetration test summary reviewed and verified.',
        author: 'Zaid Al Ali',
        reviewer: 'Sarah Al Nuaimi',
        date: assessment.createdDate || '15 Aug 2026, 09:10 AM',
      }
      initialComments[7] = {
        id: `comment-7-${assessment.id}`,
        text: 'UAE cloud tenant data residency documentation validated with hosting provider.',
        author: 'Zaid Al Ali',
        reviewer: 'Marcus Vance',
        date: assessment.createdDate || '15 Aug 2026, 09:10 AM',
      }
    }
    return initialComments
  })

  useEffect(() => {
    if (assessment.status === 'finalised') {
      setQuestionComments((prev) => {
        if (Object.keys(prev).length > 0) return prev
        return {
          3: {
            id: `comment-3-${assessment.id}`,
            text: 'Stage 2 certification audit confirmed and ISO/IEC 27001 certificate verified.',
            author: 'Zaid Al Ali',
            reviewer: 'Dr. Tariq Al Mansoori',
            date: assessment.createdDate || '15 Aug 2026, 09:10 AM',
          },
          6: {
            id: `comment-6-${assessment.id}`,
            text: 'Recent SOC 2 Type II report and executive penetration test summary reviewed and verified.',
            author: 'Zaid Al Ali',
            reviewer: 'Sarah Al Nuaimi',
            date: assessment.createdDate || '15 Aug 2026, 09:10 AM',
          },
          7: {
            id: `comment-7-${assessment.id}`,
            text: 'UAE cloud tenant data residency documentation validated with hosting provider.',
            author: 'Zaid Al Ali',
            reviewer: 'Marcus Vance',
            date: assessment.createdDate || '15 Aug 2026, 09:10 AM',
          },
        }
      })
    }
  }, [assessment.id, assessment.status, assessment.createdDate])

  const [openCommentInput, setOpenCommentInput] = useState<Record<number, boolean>>({})

  // Reviewer confidence changes (newest first); the reason is fed back to train the agent
  const [confidenceChanges, setConfidenceChanges] = useState<ConfidenceChange[]>([])
  const [confidenceEditQuestionId, setConfidenceEditQuestionId] = useState<number | null>(null)
  const [newConfidence, setNewConfidence] = useState<ConfidenceLevel | null>(null)
  const [confidenceReason, setConfidenceReason] = useState('')
  const [commentTexts, setCommentTexts] = useState<Record<number, string>>({})
  const [questionFiles, setQuestionFiles] = useState<Record<number, AttachedFile[]>>({
    3: [
      {
        name: 'ISO_27001_Readiness_Report_2026.pdf',
        size: '1.4 MB',
        type: 'PDF',
        date: '25 Aug 2026',
      },
    ],
  })

  // Sample Meeting URL for Dispatch Call
  const meetingUrl = 'https://meet.m42.ae/call/vendor-audit-9823'

  // Scheduled and cancelled assessments never reached the assessment call
  const isCancelled = currentStatus === 'cancelled'
  const isScheduled = currentStatus === 'scheduled' || isCancelled

  // Scheduled meeting management (cancel / reschedule)
  const [meetingDateTime, setMeetingDateTime] = useState(
    assessment.meetingDateTime ?? assessment.createdDate
  )
  const [meetingLog, setMeetingLog] = useState<MeetingLogEntry[]>(assessment.meetingLog ?? [])
  const cancelEntry = meetingLog.find((entry) => entry.type === 'cancelled')
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleStart, setRescheduleStart] = useState('')
  const [rescheduleEnd, setRescheduleEnd] = useState('')
  const [rescheduleRecipients, setRescheduleRecipients] = useState<string[]>(
    DEFAULT_MEETING_RECIPIENTS
  )
  const [recipientInput, setRecipientInput] = useState('')
  const [recipientError, setRecipientError] = useState<string | null>(null)
  const [rescheduleReason, setRescheduleReason] = useState('')

  const isRescheduleTimeValid =
    Boolean(rescheduleStart && rescheduleEnd) && rescheduleEnd > rescheduleStart
  const isRescheduleValid =
    Boolean(rescheduleDate) && isRescheduleTimeValid && rescheduleRecipients.length > 0

  // Email Vendor: reviewer picks questions to send to the vendor for follow-up
  const [showEmailVendorModal, setShowEmailVendorModal] = useState(false)
  const [emailQuestionSearch, setEmailQuestionSearch] = useState('')
  const [emailConfidenceFilter, setEmailConfidenceFilter] = useState<ConfidenceLevel | null>(null)
  const [emailSelectedQuestions, setEmailSelectedQuestions] = useState<number[]>([])
  // Reason per question, shared with the vendor along with the follow-up
  const [emailQuestionReasons, setEmailQuestionReasons] = useState<Record<number, string>>({})

  const openEmailVendorModal = () => {
    setEmailQuestionSearch('')
    setEmailConfidenceFilter(null)
    setEmailSelectedQuestions([])
    setEmailQuestionReasons({})
    setShowEmailVendorModal(true)
  }

  // Keep the page behind the Email Vendor popup from scrolling
  useEffect(() => {
    if (!showEmailVendorModal) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [showEmailVendorModal])

  const showTimedToast = (message: string) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const updateMeeting = (dateTime: string, entry: MeetingLogEntry) => {
    const updatedLog = [entry, ...meetingLog]
    setMeetingDateTime(dateTime)
    setMeetingLog(updatedLog)
    onMeetingChange?.({ meetingDateTime: dateTime, meetingLog: updatedLog })
  }

  const handleConfirmCancel = () => {
    const reason = cancelReason.trim()
    if (!reason) return
    updateMeeting(meetingDateTime, {
      id: `meeting-cancelled-${Date.now()}`,
      type: 'cancelled',
      timestamp: formatTimestamp(new Date()),
      actor: CURRENT_USER,
      details: `Cancelled the assessment meeting scheduled for ${meetingDateTime}.`,
      reason,
    })
    setCurrentStatus('cancelled')
    onStatusChange?.('cancelled')
    setShowCancelModal(false)
    setCancelReason('')
    showTimedToast('Meeting cancelled successfully')
  }

  const openRescheduleModal = () => {
    setRescheduleDate('')
    setRescheduleStart('')
    setRescheduleEnd('')
    setRescheduleRecipients(DEFAULT_MEETING_RECIPIENTS)
    setRecipientInput('')
    setRecipientError(null)
    setRescheduleReason('')
    setShowRescheduleModal(true)
  }

  const handleAddRecipient = () => {
    const email = recipientInput.trim()
    if (!email) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setRecipientError('Please enter a valid email address.')
      return
    }
    if (rescheduleRecipients.includes(email)) {
      setRecipientError('This recipient has already been added.')
      return
    }
    if (rescheduleRecipients.length >= MAX_MEETING_RECIPIENTS) {
      setRecipientError(`Maximum ${MAX_MEETING_RECIPIENTS} recipients can be added.`)
      return
    }
    setRescheduleRecipients((prev) => [...prev, email])
    setRecipientInput('')
    setRecipientError(null)
  }

  const handleConfirmReschedule = () => {
    if (!isRescheduleValid) return
    const formattedDate = new Date(`${rescheduleDate}T00:00:00`).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    const newDateTime = `${formattedDate}, ${formatTimeInput(rescheduleStart)} - ${formatTimeInput(rescheduleEnd)}`
    updateMeeting(newDateTime, {
      id: `meeting-rescheduled-${Date.now()}`,
      type: 'rescheduled',
      timestamp: formatTimestamp(new Date()),
      actor: CURRENT_USER,
      details: `Rescheduled the assessment meeting from ${meetingDateTime} to ${newDateTime}. Invitation sent to ${rescheduleRecipients.join(', ')}.`,
      reason: rescheduleReason.trim(),
    })
    setShowRescheduleModal(false)
    showTimedToast(`Meeting rescheduled to ${newDateTime}`)
  }

  // Dynamic status list based on questionnaire progress and current status
  const lifecycleSteps = [
    { title: 'Call dispatched', actor: 'Admin User', time: '1 Sept, 10:30 AM', status: 'DONE' },
    {
      title: 'Meeting Scheduled',
      actor: 'System Scheduler',
      time: '1 Sept, 01:14 PM',
      status: 'DONE',
      hasMeetingUrl: true,
    },
    {
      title: 'Participants joined',
      actor: 'Presight AI',
      time: isScheduled ? 'Pending' : '1 Sept, 01:15 PM',
      status: isScheduled ? 'AWAITING' : 'DONE',
    },
    {
      title: 'Assessment call',
      actor: 'Voice Agent Sam',
      time: isScheduled ? 'Pending' : '1 Sept, 01:19 PM',
      status: isScheduled ? 'AWAITING' : 'DONE',
    },
    {
      title: 'Call ended',
      actor: 'Voice Agent Sam',
      time: isScheduled ? 'Pending' : '1 Sept, 01:19 PM',
      status: isScheduled ? 'AWAITING' : 'DONE',
    },
    {
      title: 'Transcript composed',
      actor: 'NLP Pipeline',
      time: isScheduled ? 'Pending' : '1 Sept, 01:20 PM',
      status: isScheduled ? 'AWAITING' : 'DONE',
    },
    {
      title: 'Scoring',
      actor: 'Evaluation Subagent',
      time: isScheduled ? 'Pending' : '1 Sept, 01:22 PM',
      status: isScheduled ? 'AWAITING' : 'DONE',
    },
    {
      title: 'Report ready',
      actor: 'Audit Engine',
      time: isScheduled ? 'Pending' : '1 Sept, 01:25 PM',
      status: isScheduled ? 'AWAITING' : 'DONE',
    },
    {
      title: 'Finalized',
      actor: 'Admin User',
      time:
        !isScheduled && (currentStatus === 'completed' || currentStatus === 'finalised')
          ? '1 Sept, 02:05 PM'
          : 'Pending',
      status:
        !isScheduled && (currentStatus === 'completed' || currentStatus === 'finalised')
          ? 'DONE'
          : 'AWAITING',
    },
  ]

  // Reviewer comments are logged in the audit trail with reviewer name and time
  const reviewerCommentEvents: AuditTrailEvent[] = Object.entries(questionComments).map(
    ([questionId, comment]) => ({
      id: `aud-${comment.id}`,
      title: `Reviewer Comment Added (Question ${questionId})`,
      category: 'Reviewer',
      timestamp: comment.date,
      actor: comment.reviewer,
      details: comment.text,
      icon: MessageSquare,
    })
  )

  const confidenceChangeEvents: AuditTrailEvent[] = confidenceChanges.map((change) => ({
    id: change.id,
    title: `Confidence Score Updated (Question ${change.questionId})`,
    category: 'Admin',
    timestamp: change.date,
    actor: change.changedBy,
    details: `Changed from ${change.from} to ${change.to}. Reason: ${change.reason}`,
    icon: Pencil,
  }))

  // Requirement 2: Audit Trail Timeline Data
  const auditEvents: AuditTrailEvent[] = [
    ...confidenceChangeEvents,
    ...reviewerCommentEvents,
    {
      id: 'aud-8',
      title: 'Assessment Finalized & Status Updated',
      category: 'Admin',
      timestamp: '1 Sept 2026, 02:05 PM',
      actor: 'Admin User (M42 Compliance)',
      details:
        'Reviewed evidence submissions, verified ADX public registry proof, and marked assessment status as Ready.',
      icon: ShieldCheck,
      confidence: 'High confidence',
    },
    {
      id: 'aud-7',
      title: 'Evidence Document Uploaded',
      category: 'Vendor',
      timestamp: '25 Aug 2026, 02:15 PM',
      actor: 'Presight AI Security Team',
      details: 'Uploaded ISO_27001_Readiness_Report_2026.pdf (1.4 MB) as evidence for Question 3.',
      icon: FileCheck,
      confidence: 'High confidence',
    },
    {
      id: 'aud-6',
      title: 'Automated Registry & Research Verification',
      category: 'AI Agent',
      timestamp: '1 Sept 2026, 01:22 PM',
      actor: 'M42 Research Subagent',
      details:
        'Matched ADX ticker PRESIGHT against official Abu Dhabi Securities Exchange public registry (4/4 sources verified).',
      icon: Bot,
      confidence: 'High confidence',
    },
    {
      id: 'aud-5',
      title: 'Interview Audio & Transcript Captured',
      category: 'AI Agent',
      timestamp: '1 Sept 2026, 01:19 PM',
      actor: 'Voice Agent Sam',
      details:
        'Recorded 3:47 audio interview session and generated text transcript with 7/7 questions evaluated.',
      icon: PhoneCall,
      confidence: 'High confidence',
    },
    {
      id: 'aud-4',
      title: 'Assessment Call Connected',
      category: 'Vendor',
      timestamp: '1 Sept 2026, 01:15 PM',
      actor: 'Presight AI Representative & AI Agent Sam',
      details: 'Participants joined audio call room session #9823.',
      icon: Users,
      confidence: 'Medium confidence',
    },
    {
      id: 'aud-3',
      title: 'Meeting Link & Session Token Generated',
      category: 'System',
      timestamp: '1 Sept 2026, 01:14 PM',
      actor: 'M42 System Scheduler',
      details:
        'Created meeting URL (https://meet.m42.ae/call/vendor-audit-9823) with secure 256-bit access token.',
      icon: Calendar,
      confidence: 'High confidence',
    },
    {
      id: 'aud-2',
      title: 'Email Dispatch Notification Sent',
      category: 'System',
      timestamp: '1 Sept 2026, 01:15 PM',
      actor: 'M42 Dispatcher',
      details: 'Dispatched automated call invitation email to recipient@presight.ai.',
      icon: Mail,
      confidence: 'High confidence',
    },
    {
      id: 'aud-1',
      title: 'Assessment Created & Dispatched',
      category: 'Admin',
      timestamp: '1 Sept 2026, 10:30 AM',
      actor: 'Admin User (M42 Compliance)',
      details:
        'Created Round 1 assessment for Presight AI using Technical Questionnaire compliance template.',
      icon: Send,
      confidence: 'High confidence',
    },
  ]

  const meetingLogEvents: AuditTrailEvent[] = meetingLog.map((entry) => ({
    id: entry.id,
    title: entry.type === 'cancelled' ? 'Meeting Cancelled' : 'Meeting Rescheduled',
    category: 'Admin',
    timestamp: entry.timestamp,
    actor: entry.actor,
    details: entry.reason ? `${entry.details} Reason: ${entry.reason}` : entry.details,
    icon: entry.type === 'cancelled' ? XCircle : Calendar,
  }))

  // Scheduled and cancelled assessments only log events up to the meeting being scheduled,
  // followed by any reschedule or cancellation
  const PRE_CALL_EVENT_IDS = ['aud-3', 'aud-2', 'aud-1']
  const displayedAuditEvents = isScheduled
    ? [...meetingLogEvents, ...auditEvents.filter((event) => PRE_CALL_EVENT_IDS.includes(event.id))]
    : auditEvents

  const handleCopyMeetingUrl = () => {
    navigator.clipboard.writeText(meetingUrl)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  const handleFileUpload = (questionId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const newFile: AttachedFile = {
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
      date: 'Today',
    }

    setQuestionFiles((prev) => ({
      ...prev,
      [questionId]: [...(prev[questionId] || []), newFile],
    }))

    setToastMessage(`Attached ${file.name} to Question ${questionId}`)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleAddComment = (questionId: number) => {
    const text = (commentTexts[questionId] || '').trim()
    if (!text || text.length > 500) return

    // Only 1 comment can be added for low confidence
    if (questionComments[questionId]) return

    const randomName = REVIEWER_NAMES[Math.floor(Math.random() * REVIEWER_NAMES.length)]
    const now = new Date()
    const formattedDate = now.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    const formattedTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
    const formattedTimestamp = `${formattedDate}, ${formattedTime}`

    const newComment: QuestionComment = {
      id: `comment-${questionId}-${Date.now()}`,
      text,
      author: 'Zaid Al Ali',
      reviewer: randomName,
      date: formattedTimestamp,
    }

    setQuestionComments((prev) => ({
      ...prev,
      [questionId]: newComment,
    }))

    setCommentTexts((prev) => ({ ...prev, [questionId]: '' }))
    setOpenCommentInput((prev) => ({ ...prev, [questionId]: false }))

    setToastMessage(`Comment added and reviewed by ${randomName}`)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const baseQuestions = [
    {
      id: 1,
      category: 'Corporate',
      question:
        'State the city and country of your headquarters and any stock exchange you are listed on.',
      confidence: 'High confidence',
      confidenceType: 'success' as const,
      confidenceTooltip:
        'High confidence: Official Abu Dhabi Securities Exchange public registry matched.',
      answer:
        'Presight AI Holding PLC is headquartered in Abu Dhabi, United Arab Emirates, and is listed on the Abu Dhabi Securities Exchange (ADX) under the ticker PRESIGHT.',
      whyScore: 'Scored on the quality of the answer.',
      answerNotes:
        'The answer explicitly names the HQ city (Abu Dhabi), country (United Arab Emirates), and the exchange (Abu Dhabi Securities Exchange) as required by the cue.',
      requiresEvidence: false,
      research: {
        text: 'Presight AI Holding PLC is headquartered in Abu Dhabi, United Arab Emirates, and is listed on the Abu Dhabi Securities Exchange (ADX) under the ticker PRESIGHT.',
        status: 'PASS',
        links: [
          'Presight AI Holding PLC Stock Quote (Abu Dhabi ...',
          '(PRESIGHT.AD) | Stock Price & Latest News',
          'Presight AI now listed on the Abu Dhabi Securities Exchange',
          'PRESIGHT Stock Price and Chart',
        ],
      },
    },
    {
      id: 2,
      category: 'Security',
      question: 'Describe how you encrypt customer data at rest and in transit.',
      confidence: 'High confidence',
      confidenceType: 'success' as const,
      confidenceTooltip:
        'High confidence: Explicit technical match for AES-256 and TLS 1.2+ encryption standards.',
      answer:
        'Customer data is encrypted at rest with AES-256 and in transit with TLS 1.2 or higher, with managed key rotation.',
      whyScore: 'Scored on the quality of the answer.',
      answerNotes:
        'The answer explicitly names AES-256 for data at rest and TLS 1.2 or higher for data in transit, fully meeting the cue requirements.',
      requiresEvidence: false,
    },
    {
      id: 3,
      category: 'Security',
      question: 'Provide your current ISO/IEC 27001 certificate.',
      confidence: 'Low confidence',
      confidenceType: 'warning' as const,
      confidenceTooltip:
        'Low confidence: Stage 1 review uploaded; full Stage 2 certificate pending verification.',
      answer:
        'The uploaded document states completion of Stage 1 readiness review for ISO/IEC 27001 with Stage 2 certification audit scheduled. Later the certificate was uploaded and received successfully.',
      whyScore: 'No valid, authentic document was provided initially, so this scores low.',
      answerNotes:
        'The answer confirms that a certificate was uploaded and received successfully, but initially only mentions completion of Stage 1 readiness review.',
      requiresEvidence: true,
    },
    {
      id: 4,
      category: 'Security',
      question:
        'Describe your identity and access management controls (SSO, MFA, least privilege).',
      confidence: 'Medium confidence',
      confidenceType: 'warning' as const,
      confidenceTooltip:
        'Medium confidence: Partial response; role-based access described without enforced MFA details.',
      answer: '(not answered)',
      whyScore: 'Scored on the quality of the answer.',
      answerNotes:
        'The answer addresses role-based least-privilege access and access controls but fails to explicitly mention SSO or enforced MFA.',
      requiresEvidence: false,
    },
    {
      id: 5,
      category: 'Resilience',
      question:
        'Describe your incident-response process and typical time to notify affected customers.',
      confidence: 'Medium confidence',
      confidenceType: 'warning' as const,
      confidenceTooltip:
        'Medium confidence: Document confirms IR framework without stated customer SLA window.',
      answer: '(not answered)',
      whyScore: 'Scored on the quality of the answer.',
      answerNotes:
        'The answer confirms the existence of a documented incident-response process but fails to provide a stated notification window.',
      requiresEvidence: false,
    },
    {
      id: 6,
      category: 'Assurance',
      question: 'Provide your most recent penetration test summary or SOC 2 Type II report.',
      confidence: 'Low confidence',
      confidenceType: 'warning' as const,
      confidenceTooltip:
        'Low confidence: Missing mandatory penetration test summary or SOC 2 report attachment.',
      answer: '(not answered)',
      whyScore: 'No valid, authentic document was provided, so this scores low.',
      answerNotes:
        'The answer is empty and does not provide any information about a recent pen-test summary or SOC 2 Type II report.',
      requiresEvidence: true,
    },
    {
      id: 7,
      category: 'Data',
      question: 'Where is customer data stored, and can data residency be restricted to a region?',
      confidence: 'Low confidence',
      confidenceType: 'warning' as const,
      confidenceTooltip: 'Low confidence: Missing UAE cloud tenant data residency proof.',
      answer: '(not answered)',
      whyScore: 'Scored on the quality of the answer.',
      answerNotes:
        'Response lacks specific cloud tenant location proof for UAE residency restrictions.',
      requiresEvidence: true,
    },
  ]

  // A reviewer's confidence change replaces the agent's score everywhere it is used
  const questions = baseQuestions.map((q) => {
    const latestChange = confidenceChanges.find((change) => change.questionId === q.id)
    if (!latestChange) return q
    return {
      ...q,
      confidence: latestChange.to,
      confidenceType:
        latestChange.to === 'High confidence' ? ('success' as const) : ('warning' as const),
      confidenceTooltip: `${latestChange.to}: Updated by ${latestChange.changedBy}. Reason: ${latestChange.reason}`,
    }
  })

  const emailVendorQuestions = questions.filter((q) => {
    const term = emailQuestionSearch.trim().toLowerCase()
    const matchesSearch =
      !term ||
      q.question.toLowerCase().includes(term) ||
      q.category.toLowerCase().includes(term) ||
      String(q.id) === term
    const matchesConfidence =
      !emailConfidenceFilter ||
      (q.answer !== '(not answered)' && q.confidence === emailConfidenceFilter)
    return matchesSearch && matchesConfidence
  })
  const allEmailQuestionsSelected =
    emailVendorQuestions.length > 0 &&
    emailVendorQuestions.every((q) => emailSelectedQuestions.includes(q.id))

  const toggleEmailQuestion = (questionId: number) =>
    setEmailSelectedQuestions((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId]
    )

  const toggleAllEmailQuestions = () => {
    const visibleIds = emailVendorQuestions.map((q) => q.id)
    setEmailSelectedQuestions((prev) =>
      allEmailQuestionsSelected
        ? prev.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...prev, ...visibleIds]))
    )
  }

  const handleSendVendorEmail = () => {
    const count = emailSelectedQuestions.length
    setShowEmailVendorModal(false)
    showTimedToast(`Emailed ${count} question${count === 1 ? '' : 's'} to ${assessment.vendor}`)
  }

  // After the TDD round the agent suggests a follow-up privacy assessment: PIA when personal
  // information is processed, DPIA for high-risk solutions
  const showPrivacySuggestion =
    currentStatus === 'awaiting_evidence' ||
    currentStatus === 'completed' ||
    currentStatus === 'finalised'
  const privacySuggestion =
    Number(assessment.caseId.replace(/\D/g, '')) % 2 === 0
      ? { label: 'DPIA', reason: 'the solution is assessed as high-risk' }
      : { label: 'PIA', reason: 'the solution processes personal information' }

  // Confidence can be changed for answered questions once the call has produced results
  const canEditConfidence = currentStatus === 'awaiting_evidence' || currentStatus === 'completed'
  const confidenceEditQuestion = questions.find((q) => q.id === confidenceEditQuestionId)

  const openConfidenceEditor = (questionId: number) => {
    setConfidenceEditQuestionId(questionId)
    setNewConfidence(null)
    setConfidenceReason('')
  }

  const handleConfirmConfidenceChange = () => {
    const reason = confidenceReason.trim()
    if (!confidenceEditQuestion || !newConfidence || !reason) return
    if (newConfidence === confidenceEditQuestion.confidence) return
    setConfidenceChanges((prev) => [
      {
        id: `confidence-${confidenceEditQuestion.id}-${Date.now()}`,
        questionId: confidenceEditQuestion.id,
        from: confidenceEditQuestion.confidence as ConfidenceLevel,
        to: newConfidence,
        reason,
        changedBy: CURRENT_USER,
        date: formatTimestamp(new Date()),
      },
      ...prev,
    ])
    setConfidenceEditQuestionId(null)
    showTimedToast(`Question ${confidenceEditQuestion.id} confidence updated to ${newConfidence}`)
  }

  // Only answered questions are scored, so unanswered ones never need a reviewer comment
  const lowConfidenceQuestions = questions.filter(
    (q) => q.confidence === 'Low confidence' && q.answer !== '(not answered)'
  )
  const allLowConfidenceCommentsAdded =
    lowConfidenceQuestions.length === 0 ||
    lowConfidenceQuestions.every((q) => Boolean(questionComments[q.id]?.text?.trim()))

  const handleFinalize = () => {
    if (!allLowConfidenceCommentsAdded) return
    setCurrentStatus('finalised')
    if (onStatusChange) {
      onStatusChange('finalised')
    }
    setToastMessage('Assessment finalized! Status updated to Finalised.')
    setTimeout(() => setToastMessage(null), 3500)
  }

  return (
    <div className="bg-[#f8fafc] text-[#0d212c] p-4 font-sans w-full">
      {/* Toast Notification */}
      {/* Toast Notification — subtle light semantic styling */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#f0fdf4] text-[#15803d] text-xs font-semibold px-4 py-3 rounded-xl shadow-md border border-[#bbf7d0] flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
          <span>{toastMessage}</span>
        </div>
      )}{' '}
      {/* Email Vendor Modal */}
      {showEmailVendorModal && (
        <div className="fixed inset-0 z-50 bg-[#0d212c]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full h-[85vh] shadow-2xl border border-[#e2e8f0] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="mx-8 pt-7 pb-5 flex items-start justify-between gap-4 border-b border-[#e2e8f0]">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-extrabold text-[#0d212c]">Email Vendor</h3>
                <span className="text-xs text-[#64748b] leading-relaxed">
                  The selected questions will trigger agent to send a follow up email to vendor to
                  provide the answers and required attachments of the same.
                </span>
              </div>
              <button
                onClick={() => setShowEmailVendorModal(false)}
                className="p-1 rounded-lg text-[#64748b] hover:text-[#0d212c] hover:bg-slate-50 transition cursor-pointer bg-transparent border-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-8 pt-5 pb-2 flex flex-col gap-3">
              <span className="text-sm font-extrabold text-[#0d212c]">Questions</span>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {[null, ...CONFIDENCE_OPTIONS.map(({ level }) => level)].map((level) => {
                    const isActive = emailConfidenceFilter === level
                    return (
                      <button
                        key={level ?? 'all'}
                        type="button"
                        onClick={() => setEmailConfidenceFilter(level)}
                        aria-pressed={isActive}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                          isActive
                            ? 'bg-[#36c0c9] border-[#36c0c9] text-white'
                            : 'bg-white border-[#e2e8f0] text-[#64748b] hover:border-[#cbd5e1] hover:text-[#0d212c]'
                        }`}
                      >
                        {level ? level.replace(' confidence', '') : 'All'}
                      </button>
                    )
                  })}
                  <span className="w-px h-5 bg-[#e2e8f0] mx-2" aria-hidden="true" />
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={allEmailQuestionsSelected}
                    onClick={toggleAllEmailQuestions}
                    disabled={emailVendorQuestions.length === 0}
                    className="inline-flex items-center gap-2 bg-transparent border-0 p-0 text-xs font-bold text-[#0d212c] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span
                      className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-all border ${
                        allEmailQuestionsSelected
                          ? 'bg-[#36c0c9] border-[#36c0c9]'
                          : 'bg-white border-[#cbd5e1]'
                      }`}
                    >
                      {allEmailQuestionsSelected && (
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      )}
                    </span>
                    Select all
                  </button>
                </div>
                <div className="relative w-56 shrink-0">
                  <Search className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={emailQuestionSearch}
                    onChange={(e) => setEmailQuestionSearch(e.target.value)}
                    placeholder="Search questions..."
                    aria-label="Search questions"
                    className="w-full pl-10 pr-4 py-1.5 rounded-xl border border-[#cbd5e1] text-xs font-medium text-[#0d212c] outline-none focus:border-[#94a3b8] bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-8 divide-y divide-[#e2e8f0]/80">
              {emailVendorQuestions.length === 0 ? (
                <p className="py-8 text-center text-xs text-[#64748b]">
                  No questions match your search.
                </p>
              ) : (
                emailVendorQuestions.map((q) => {
                  const isSelected = emailSelectedQuestions.includes(q.id)
                  const evidenceFiles = questionFiles[q.id] || []
                  const isLowConfidenceAnswer =
                    q.answer !== '(not answered)' && q.confidence === 'Low confidence'
                  const comment = questionComments[q.id]
                  return (
                    <label key={q.id} className="flex items-start gap-3 py-5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleEmailQuestion(q.id)}
                        className="sr-only"
                      />
                      <div
                        className={`mt-0.5 w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-all border ${
                          isSelected ? 'bg-[#36c0c9] border-[#36c0c9]' : 'bg-white border-[#cbd5e1]'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-2.5">
                        <div className="flex items-start justify-between gap-4">
                          <span className="text-xs font-bold text-[#0d212c] leading-snug">
                            {q.id}. [{q.category}] {q.question}
                          </span>
                          {q.answer !== '(not answered)' && (
                            <StatusChip
                              label={q.confidence}
                              status={q.confidenceType}
                              dot={false}
                              className="shrink-0"
                            />
                          )}
                        </div>
                        <p className="text-xs text-[#0d212c] leading-relaxed">
                          <strong>Answer:</strong> {q.answer}
                        </p>
                        {q.research && (
                          <div className="p-3 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] text-[11px] flex items-start justify-between gap-3">
                            <span className="text-[#0d212c] leading-relaxed">
                              <strong>Research:</strong> {q.research.text}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-[#12b76a] text-white font-bold text-[10px] shrink-0">
                              {q.research.status}
                            </span>
                          </div>
                        )}
                        {evidenceFiles.length > 0 && (
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[11px] font-bold text-[#0d212c]">
                              Evidence uploaded
                            </span>
                            {evidenceFiles.map((file) => (
                              <div
                                key={file.name}
                                className="flex items-center gap-2 text-[11px] text-[#64748b]"
                              >
                                <Paperclip className="w-3.5 h-3.5 text-[#0d7280] shrink-0" />
                                <span className="font-semibold text-[#0d212c] truncate">
                                  {file.name}
                                </span>
                                <span className="shrink-0">
                                  {file.size} · {file.date}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {isLowConfidenceAnswer && (
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-bold text-[#0d212c]">Comment</span>
                            {comment ? (
                              <p className="text-[11px] text-[#64748b] leading-relaxed">
                                {comment.text}
                                <span className="text-[#94a3b8]">
                                  {' '}
                                  · {comment.author}, {comment.date}
                                </span>
                              </p>
                            ) : (
                              <p className="text-[11px] text-[#94a3b8] italic">
                                No comment added yet.
                              </p>
                            )}
                          </div>
                        )}
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-bold text-[#0d212c]">Reason</span>
                          <textarea
                            rows={2}
                            value={emailQuestionReasons[q.id] || ''}
                            onChange={(e) =>
                              setEmailQuestionReasons((prev) => ({
                                ...prev,
                                [q.id]: e.target.value,
                              }))
                            }
                            placeholder="Add a reason for the vendor..."
                            className="w-full px-3 py-2 rounded-xl border border-[#cbd5e1] text-[11px] font-medium text-[#0d212c] outline-none focus:border-[#94a3b8] bg-white resize-none cursor-text"
                          />
                        </div>
                      </div>
                    </label>
                  )
                })
              )}
            </div>

            <div className="mx-8 py-4 flex items-center justify-between gap-3">
              <span className="text-xs text-[#64748b] font-medium">
                {emailSelectedQuestions.length} selected
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowEmailVendorModal(false)}
                  className="px-5 py-2.5 rounded-lg border border-[#e2e8f0] bg-white text-xs font-bold text-[#0d212c] hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendVendorEmail}
                  disabled={emailSelectedQuestions.length === 0}
                  className="px-5 py-2.5 rounded-lg bg-[#36c0c9] hover:bg-[#2badb6] text-white text-xs font-bold transition cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Cancel Meeting Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-[#0d212c]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-[#e2e8f0] flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowCancelModal(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-[#0d212c] transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#fef2f2] border border-[#fecaca] flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-[#dc2626]" />
              </div>
              <h3 className="text-lg font-extrabold text-[#0d212c]">Cancel meeting</h3>
              <p className="text-xs text-[#64748b]">Are you sure you want to cancel the meeting?</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cancel-reason" className="text-xs font-bold text-[#0d212c]">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                placeholder="Describe the reason for cancelling this meeting..."
                className="w-full px-4 py-3 rounded-xl border border-[#cbd5e1] text-xs font-medium text-[#0d212c] outline-none focus:border-[#94a3b8] bg-white resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="py-3 rounded-lg border border-[#e2e8f0] bg-white text-xs font-bold text-[#0d212c] hover:bg-slate-50 transition cursor-pointer"
              >
                Keep Assessment
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={!cancelReason.trim()}
                className="py-3 rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold transition cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Reschedule Meeting Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 bg-[#0d212c]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-7 shadow-2xl border border-[#e2e8f0] flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowRescheduleModal(false)}
              className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-[#0d212c] transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ddf7f9] border border-[#36c0c9]/30 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#0d7280]" />
              </div>
              <h3 className="text-lg font-extrabold text-[#0d212c]">Reschedule meeting</h3>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="reschedule-date" className="text-xs font-bold text-[#0d212c]">
                New date <span className="text-red-500">*</span>
              </label>
              <input
                id="reschedule-date"
                type="date"
                value={rescheduleDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#cbd5e1] text-xs font-medium text-[#0d212c] outline-none focus:border-[#94a3b8] bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reschedule-start" className="text-xs font-bold text-[#0d212c]">
                  Start time <span className="text-red-500">*</span>
                </label>
                <input
                  id="reschedule-start"
                  type="time"
                  value={rescheduleStart}
                  onChange={(e) => setRescheduleStart(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#cbd5e1] text-xs font-medium text-[#0d212c] outline-none focus:border-[#94a3b8] bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reschedule-end" className="text-xs font-bold text-[#0d212c]">
                  End time <span className="text-red-500">*</span>
                </label>
                <input
                  id="reschedule-end"
                  type="time"
                  value={rescheduleEnd}
                  onChange={(e) => setRescheduleEnd(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#cbd5e1] text-xs font-medium text-[#0d212c] outline-none focus:border-[#94a3b8] bg-white"
                />
              </div>
            </div>
            {rescheduleStart && rescheduleEnd && !isRescheduleTimeValid && (
              <p className="text-[11px] text-red-500 font-medium -mt-2">
                End time must be after start time.
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="reschedule-recipients" className="text-xs font-bold text-[#0d212c]">
                Recipients <span className="text-red-500">*</span>
              </label>
              <input
                id="reschedule-recipients"
                type="email"
                value={recipientInput}
                disabled={rescheduleRecipients.length >= MAX_MEETING_RECIPIENTS}
                onChange={(e) => {
                  setRecipientInput(e.target.value)
                  setRecipientError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddRecipient()
                  }
                }}
                placeholder="Enter email and press Enter..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#cbd5e1] text-xs font-medium text-[#0d212c] outline-none focus:border-[#94a3b8] bg-white disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
              <div className="flex items-center justify-between text-[11px] text-[#64748b]">
                <span>Maximum {MAX_MEETING_RECIPIENTS} recipients can be added</span>
                <span>
                  {rescheduleRecipients.length}/{MAX_MEETING_RECIPIENTS}
                </span>
              </div>
              {recipientError && (
                <p className="text-[11px] text-red-500 font-medium">{recipientError}</p>
              )}
              {rescheduleRecipients.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {rescheduleRecipients.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1.5 bg-[#f1f5f9] border border-[#e2e8f0] text-[#0d212c] text-xs font-semibold px-3 py-1 rounded-full"
                    >
                      {email}
                      <button
                        onClick={() =>
                          setRescheduleRecipients((prev) => prev.filter((r) => r !== email))
                        }
                        className="text-slate-400 hover:text-[#0d212c] transition cursor-pointer"
                        aria-label={`Remove ${email}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="reschedule-reason" className="text-xs font-bold text-[#0d212c]">
                Reason
              </label>
              <input
                id="reschedule-reason"
                type="text"
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                placeholder="e.g. Schedule conflict requested by facility (optional)"
                className="w-full px-4 py-2.5 rounded-xl border border-[#cbd5e1] text-xs font-medium text-[#0d212c] outline-none focus:border-[#94a3b8] bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="py-3 rounded-lg border border-[#e2e8f0] bg-white text-xs font-bold text-[#0d212c] hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReschedule}
                disabled={!isRescheduleValid}
                className="py-3 rounded-lg bg-[#36c0c9] hover:bg-[#2badb6] text-white text-xs font-bold transition cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Breadcrumb Menu (Moved outside of Header Card) */}
      <div className="w-full pb-1 text-xs font-medium flex items-center gap-1.5 text-[#64748b]">
        <button onClick={onBack} className="hover:text-[#0d7280] cursor-pointer">
          M42 admin
        </button>
        <span>/</span>
        <button onClick={onBack} className="hover:text-[#0d7280] cursor-pointer">
          Dashboard
        </button>
        <span>/</span>
        <span className="text-[#36c0c9] font-bold">Assessment details</span>
      </div>
      {/* Header Container Card — Very light shade of light primary color with minimal stroke */}
      <div className="w-full pt-3">
        <div className="bg-[#ddf7f9]/20 rounded-3xl border border-[#36c0c9]/30 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-3">
            {/* Main Title & Subtitle */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">
                Case ID: <span className="text-[#0d212c]">{assessment.caseId}</span>
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#0d212c]">
                {assessment.vendor}
              </h1>
              <h2 className="text-xs font-bold text-[#64748b]">{assessment.questionnaire}</h2>
            </div>

            {/* Status Chips Row */}
            <div className="flex items-center gap-2.5 flex-wrap mt-0.5">
              <StatusChip
                label={
                  currentStatus === 'completed'
                    ? 'Completed'
                    : currentStatus === 'ready'
                      ? 'Ready'
                      : currentStatus === 'cancelled'
                        ? 'Cancelled'
                        : currentStatus === 'scheduled'
                          ? 'Scheduled'
                          : currentStatus === 'finalised'
                            ? 'Finalised'
                            : 'Awaiting evidence'
                }
                status={
                  currentStatus === 'completed'
                    ? 'success'
                    : currentStatus === 'ready'
                      ? 'info'
                      : currentStatus === 'cancelled'
                        ? 'error'
                        : currentStatus === 'scheduled'
                          ? 'info'
                          : currentStatus === 'finalised'
                            ? 'finalised'
                            : 'warning'
                }
                dot={false}
              />
              <span className="text-[#36c0c9]/30 font-bold">|</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#e0f2fe] text-[#0369a1] text-xs font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>Round 1</span>
              </span>
              {!isScheduled && (
                <>
                  <span className="text-[#36c0c9]/30 font-bold">|</span>
                  {(() => {
                    const scoreLower = (assessment.score || '').toLowerCase()
                    const isHighScore =
                      scoreLower.includes('high') ||
                      currentStatus === 'completed' ||
                      currentStatus === 'finalised'
                    const isLowScore = scoreLower.includes('low')
                    const confidenceLevel = isHighScore ? 'High' : isLowScore ? 'Low' : 'Medium'
                    const chipStatus = isHighScore ? 'success' : isLowScore ? 'warning' : 'warning'

                    return (
                      <StatusChip
                        label={`Overall confidence: ${confidenceLevel}`}
                        status={chipStatus}
                        dot={false}
                      />
                    )
                  })()}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Main Content Area */}
      <div className="w-full mt-6 flex flex-col gap-6">
        {/* Navigation Tabs Bar — Grey horizontal line spans ONLY both tabs */}
        <div className="flex items-center justify-between pb-0">
          <div className="flex items-center gap-8 border-b border-[#e2e8f0]">
            <button
              onClick={() => setActiveTab('assessment')}
              className={`pb-3.5 text-sm font-bold flex items-center gap-2.5 transition cursor-pointer border-b-2 -mb-px ${
                activeTab === 'assessment'
                  ? 'border-[#36c0c9] text-[#36c0c9]'
                  : 'border-transparent text-[#64748b] hover:text-[#0d212c]'
              }`}
            >
              <FileText
                className={`w-4.5 h-4.5 ${activeTab === 'assessment' ? 'text-[#36c0c9]' : 'text-[#64748b]'}`}
              />
              <span>Assessment</span>
            </button>
            <button
              onClick={() => setActiveTab('audit_trail')}
              className={`pb-3.5 text-sm font-bold flex items-center gap-2.5 transition cursor-pointer border-b-2 -mb-px ${
                activeTab === 'audit_trail'
                  ? 'border-[#36c0c9] text-[#36c0c9]'
                  : 'border-transparent text-[#64748b] hover:text-[#0d212c]'
              }`}
            >
              <Clock
                className={`w-4.5 h-4.5 ${activeTab === 'audit_trail' ? 'text-[#36c0c9]' : 'text-[#64748b]'}`}
              />
              <span>Audit trail</span>
            </button>
          </div>

          <div className="flex items-center gap-3 pb-3">
            {!isScheduled && (
              <button
                onClick={() => alert(`Downloading PDF report for ${assessment.vendor}...`)}
                className="px-4 py-2 rounded-lg border border-[#cbd5e1] hover:border-[#94a3b8] hover:bg-slate-50 text-[#0d212c] bg-white font-bold text-xs flex items-center gap-2 shadow-2xs cursor-pointer transition"
              >
                <Download className="w-4 h-4 text-[#0d212c]" />
                <span>Download PDF</span>
              </button>
            )}
            {!isScheduled && (
              <button
                onClick={handleFinalize}
                disabled={currentStatus === 'finalised' || !allLowConfidenceCommentsAdded}
                title={
                  currentStatus === 'finalised'
                    ? 'Assessment is finalised'
                    : !allLowConfidenceCommentsAdded
                      ? 'Please add comments to all low confidence questions before finalizing'
                      : undefined
                }
                className={`text-white font-bold text-xs px-5 py-2 rounded-lg transition border-0 shadow-2xs ${
                  currentStatus === 'finalised' || !allLowConfidenceCommentsAdded
                    ? 'bg-[#0d212c] opacity-40 cursor-not-allowed'
                    : 'bg-[#0d212c] hover:bg-[#122e3d] cursor-pointer'
                }`}
              >
                {currentStatus === 'finalised' ? 'Finalised' : 'Finalize'}
              </button>
            )}
          </div>
        </div>

        {/* Audit Trail Tab View */}
        {activeTab === 'audit_trail' ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#0d212c]">Assessment Audit Trail</h3>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Complete chronological activity log capturing all system events, AI agent
                  interactions, and admin actions.
                </p>
              </div>
              <span className="text-xs font-semibold text-[#0f766e] bg-[#ddf7f9] px-3 py-1 rounded-full">
                {displayedAuditEvents.length} events logged
              </span>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#e2e8f0] shadow-xs">
              <div className="relative pl-2 flex flex-col gap-8">
                {displayedAuditEvents.map((event, idx) => {
                  const EventIcon = event.icon
                  const isLast = idx === displayedAuditEvents.length - 1
                  return (
                    <div key={event.id} className="relative pl-8 flex flex-col gap-1.5">
                      {/* Vertical connecting line (only rendered if not the last event) */}
                      {!isLast && (
                        <div className="absolute left-[13px] top-7 bottom-0 w-0.5 bg-[#e2e8f0] translate-y-1" />
                      )}

                      {/* Timeline Node Icon Circle (100% Primary Light Color Fill, No Stroke, White Icon) */}
                      <div className="absolute left-0 top-0.5 w-7 h-7 rounded-full bg-[#36c0c9] flex items-center justify-center text-white shadow-2xs z-10">
                        <EventIcon className="w-3.5 h-3.5 text-white" />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <h4 className="font-extrabold text-sm text-[#0d212c]">{event.title}</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              event.category === 'Admin'
                                ? 'bg-purple-100 text-purple-800'
                                : event.category === 'AI Agent'
                                  ? 'bg-[#ddf7f9] text-[#0f766e]'
                                  : event.category === 'Vendor'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {event.category}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-[#64748b] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {event.timestamp}
                        </span>
                      </div>

                      {/* Confidence chip placed BELOW the title (ONLY for Admin, AI Agent, Vendor - NOT System) */}
                      {event.category !== 'System' && event.confidence && (
                        <div className="flex items-center mt-0.5">
                          <StatusChip
                            label={event.confidence}
                            status={
                              event.confidence.startsWith('High')
                                ? 'success'
                                : event.confidence.startsWith('Low')
                                  ? 'warning'
                                  : 'warning'
                            }
                            dot={false}
                          />
                        </div>
                      )}

                      <p className="text-xs text-[#0d212c] leading-relaxed mt-0.5">
                        {event.details}
                      </p>

                      <div className="text-[11px] text-[#64748b] font-medium flex items-center gap-1.5 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>
                          Actor:{' '}
                          <strong className="text-[#0d212c] font-semibold">{event.actor}</strong>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Meeting summary: cancel / reschedule for scheduled assessments */}
            {isScheduled && (
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-bold text-[#0d212c]">Meeting summary</h3>
                <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-[#0d212c]">
                      {isCancelled ? 'Meeting Cancelled' : 'Scheduled Session Details'}
                    </span>
                    <span className="text-xs text-[#64748b]">
                      Scheduled Date &amp; Time:{' '}
                      <strong
                        className={`font-bold ${isCancelled ? 'text-[#64748b] line-through' : 'text-[#0d212c]'}`}
                      >
                        {meetingDateTime}
                      </strong>
                    </span>
                    {cancelEntry && (
                      <span className="text-xs text-[#64748b]">
                        Cancelled by {cancelEntry.actor} on {cancelEntry.timestamp}. Reason:{' '}
                        <span className="text-[#0d212c]">{cancelEntry.reason}</span>
                      </span>
                    )}
                  </div>
                  {!isCancelled && (
                    <div className="flex items-center gap-6 shrink-0">
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="flex items-center gap-1.5 text-xs font-bold text-[#e11d48] hover:text-[#be123c] transition cursor-pointer bg-transparent border-0"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Cancel meeting</span>
                      </button>
                      <button
                        onClick={openRescheduleModal}
                        className="flex items-center gap-1.5 text-xs font-bold text-[#36c0c9] hover:text-[#2badb6] transition cursor-pointer bg-transparent border-0"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Reschedule meeting</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Section 1: Assessment lifecycle (Previous Card Theme with horizontal scroll for all 9 steps) */}
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-bold text-[#0d212c]">Assessment lifecycle</h3>
              <div className="w-full overflow-x-auto pb-3.5 pt-1 flex items-center gap-3 subtle-scrollbar group/lifecycle">
                {lifecycleSteps.map((step, idx) => {
                  const isAwaiting = step.status === 'AWAITING'

                  return (
                    <React.Fragment key={step.title}>
                      <div className="p-4 rounded-2xl bg-white shadow-xs border border-[#e2e8f0]/60 flex flex-col justify-start gap-2 h-[145px] w-[210px] shrink-0 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4
                            className="font-bold text-[#0d212c] text-sm truncate"
                            title={step.title}
                          >
                            {step.title}
                          </h4>
                          {isAwaiting ? (
                            <Clock className="w-4.5 h-4.5 text-[#b45309] shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-4.5 h-4.5 text-white fill-[#137333] shrink-0" />
                          )}
                        </div>

                        <div className="flex flex-col gap-0.5">
                          <p className="text-[11px] text-[#64748b]">{step.actor}</p>
                          <p className="text-[10px] text-[#64748b] font-medium">{step.time}</p>
                        </div>

                        {step.hasMeetingUrl && (
                          <div className="mt-auto pt-1.5 border-t border-[#e2e8f0] flex items-center justify-between gap-1 text-[11px]">
                            <span
                              className="text-[#36c0c9] font-medium truncate"
                              title={meetingUrl}
                            >
                              {meetingUrl.replace('https://', '')}
                            </span>
                            <button
                              onClick={handleCopyMeetingUrl}
                              className="p-1 text-[#64748b] hover:text-[#0d212c] transition cursor-pointer shrink-0 rounded hover:bg-slate-200/60"
                              title="Copy meeting URL"
                            >
                              {copiedUrl ? (
                                <Check className="w-3.5 h-3.5 text-[#137333]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {idx < lifecycleSteps.length - 1 && (
                        <div className="flex items-center justify-center shrink-0 px-1">
                          <ArrowRight className="w-5 h-5 text-[#36c0c9] stroke-[2.5]" />
                        </div>
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            </div>

            {/* Section 2: Agent confidence evaluation */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#0d212c]">Agent confidence evaluation</h3>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-xs">
                {isScheduled ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#0d212c]">Evaluation Pending</span>
                        <span className="text-[11px] text-[#64748b]">
                          Confidence evaluation and score analytics will be generated automatically
                          after the assessment meeting completes.
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#e2e8f0]">
                    {/* Column 1: ANSWERS */}
                    <div className="py-3 md:py-0 md:pr-6 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-[#64748b] tracking-wider flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" />
                          ANSWERS
                        </span>
                        <StatusChip label="Medium confidence" status="warning" dot={false} />
                      </div>
                      <div className="text-base font-extrabold text-[#0d212c] mt-0.5">
                        7/7 answered
                      </div>
                    </div>

                    {/* Column 2: DOCUMENTS */}
                    <div className="py-3 md:py-0 md:px-6 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-[#64748b] tracking-wider flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          DOCUMENTS
                        </span>
                        <StatusChip label="Low confidence" status="warning" dot={false} />
                      </div>
                      <div className="text-base font-extrabold text-[#0d212c] mt-0.5">
                        7 files uploaded
                      </div>
                    </div>

                    {/* Column 3: RESEARCH */}
                    <div className="py-3 md:py-0 md:pl-6 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-[#64748b] tracking-wider flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5" />
                          EVALUATION
                        </span>
                        <StatusChip label="High confidence" status="success" dot={false} />
                      </div>
                      <div className="text-base font-extrabold text-[#0d212c] mt-0.5">
                        4/4 sources verified
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Interview audio */}
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-bold text-[#0d212c]">Interview audio</h3>
              <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col gap-3">
                {isScheduled ? (
                  <div className="p-4 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#0d212c]">No Audio Recording</span>
                      <span className="text-[11px] text-[#64748b]">
                        Meeting has not started yet. Audio recording will be available after the
                        assessment call.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center gap-4">
                    <button
                      onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                      className="w-10 h-10 rounded-lg bg-[#0d212c] text-white flex items-center justify-center shadow-xs shrink-0 hover:bg-[#08171f] transition cursor-pointer"
                    >
                      {isPlayingAudio ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4 ml-0.5" />
                      )}
                    </button>

                    <div className="flex-1 flex flex-col gap-1">
                      <div className="h-2 w-full bg-[#e2e8f0] rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-[#36c0c9] ${isPlayingAudio ? 'w-1/3 transition-all duration-1000' : 'w-0'}`}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-[#64748b]">
                        <span>0:00</span>
                        <span>3:47</span>
                      </div>
                    </div>

                    {/* Playback speed dropdown */}
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={playbackSpeed}
                        onChange={(e) => setPlaybackSpeed(e.target.value)}
                        className="px-2.5 py-1.5 rounded-xl border border-[#cbd5e1] bg-white text-xs font-bold text-[#0d212c] outline-none cursor-pointer"
                        title="Playback speed"
                      >
                        <option value="0.75">0.75x</option>
                        <option value="1">1.0x</option>
                        <option value="1.25">1.25x</option>
                        <option value="1.5">1.5x</option>
                        <option value="2">2.0x</option>
                      </select>

                      <button
                        onClick={() => alert('Downloading interview audio...')}
                        className="p-2 rounded-lg border border-[#cbd5e1] hover:border-[#94a3b8] hover:bg-slate-100 text-[#0d212c] bg-white transition cursor-pointer flex items-center justify-center"
                        title="Download interview audio"
                        aria-label="Download interview audio"
                      >
                        <Download className="w-4 h-4 text-[#64748b]" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 4: Summary */}
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-bold text-[#0d212c]">Summary</h3>
              <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-xs">
                <p className="text-xs text-[#64748b] leading-relaxed">
                  {isScheduled
                    ? 'No summary generated yet. The meeting has not been started.'
                    : 'Overall evaluation across 7 questions; 2 mandatory evidence items outstanding.'}
                </p>
                {showPrivacySuggestion && (
                  <div className="mt-4 pt-4 border-t border-[#e2e8f0] flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-[#0d212c]">
                      Agent suggests a {privacySuggestion.label}
                    </span>
                    <span className="text-[11px] text-[#64748b]">
                      Recommended as the next step after the TDD round because{' '}
                      {privacySuggestion.reason}.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Section 5: Questions */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0d212c]">Questions</h3>
                {!isScheduled && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowAnswerKey(!showAnswerKey)}
                      className="px-2 py-2 text-xs font-bold text-[#36c0c9] hover:text-[#2baab3] bg-transparent border-0 transition cursor-pointer"
                    >
                      {showAnswerKey ? 'Hide answer key' : 'Show answer key'}
                    </button>
                    {currentStatus !== 'finalised' && (
                      <div className="relative group">
                        <button
                          onClick={openEmailVendorModal}
                          className="px-4 py-2 rounded-lg text-xs font-bold border border-[#36c0c9]/30 bg-[#ddf7f9] hover:bg-[#c9f1f4] text-[#0d7280] transition cursor-pointer"
                        >
                          Email Vendor
                        </button>
                        <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute right-0 bottom-full mb-2 z-40 w-60 bg-[#0d212c] text-white text-xs p-3 rounded-xl shadow-xl border border-white/10 text-left leading-relaxed font-normal">
                          Opens a modal to select the questions for following up on the vendor.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-xs">
                <div className="divide-y divide-[#e2e8f0]/80">
                  {questions.map((q) => {
                    const isLowConfidence = !isScheduled && q.confidence === 'Low confidence'
                    const attachmentsForQuestion = questionFiles[q.id] || []
                    const canUpload =
                      !isScheduled &&
                      currentStatus !== 'completed' &&
                      currentStatus !== 'finalised' &&
                      isLowConfidence
                    const shouldShowAttachmentSection =
                      !isScheduled && (attachmentsForQuestion.length > 0 || isLowConfidence)
                    const commentText = commentTexts[q.id] || ''
                    const commentLength = commentText.length
                    const isCommentLimitReached = commentLength >= 500

                    return (
                      <div key={q.id} className="py-5 first:pt-0 last:pb-0 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-4">
                          <h4 className="font-bold text-[#0d212c] text-sm">
                            {q.id}. [{q.category}] {q.question}
                          </h4>

                          {/* Confidence is only scored for questions that have an answer */}
                          {!isScheduled && q.answer !== '(not answered)' && (
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <div className="relative group">
                                {canEditConfidence && q.answer !== '(not answered)' ? (
                                  <button
                                    onClick={() => openConfidenceEditor(q.id)}
                                    className="relative cursor-pointer bg-transparent border-0 p-0"
                                    aria-label={`Edit confidence for question ${q.id}`}
                                  >
                                    <StatusChip
                                      label={q.confidence}
                                      status={q.confidenceType}
                                      dot={false}
                                      className="pr-7"
                                    />
                                    <Pencil
                                      className={`w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 ${
                                        q.confidenceType === 'success'
                                          ? 'text-[#137333]'
                                          : 'text-[#b06000]'
                                      }`}
                                    />
                                  </button>
                                ) : (
                                  <div className="cursor-default">
                                    <StatusChip
                                      label={q.confidence}
                                      status={q.confidenceType}
                                      dot={false}
                                    />
                                  </div>
                                )}
                                {confidenceEditQuestionId !== q.id && (
                                  <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute right-0 top-7 z-30 w-64 bg-[#0d212c] text-white text-xs p-3 rounded-xl shadow-xl border border-white/10">
                                    {q.confidenceTooltip}
                                  </div>
                                )}

                                {/* Edit confidence popover, anchored below the chip */}
                                {confidenceEditQuestionId === q.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-30"
                                      onClick={() => setConfidenceEditQuestionId(null)}
                                    />
                                    <div className="absolute right-0 top-full mt-3 z-40 w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-[#e2e8f0] shadow-xl p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
                                      <div className="absolute -top-1.5 right-10 w-3 h-3 bg-white border-l border-t border-[#e2e8f0] rotate-45" />
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                          <Pencil className="w-4.5 h-4.5 text-[#0d212c]" />
                                          <h4 className="text-sm font-extrabold text-[#0d212c]">
                                            Edit confidence
                                          </h4>
                                        </div>
                                        <button
                                          onClick={() => setConfidenceEditQuestionId(null)}
                                          className="p-1 rounded-lg text-[#0d212c] hover:bg-slate-50 transition cursor-pointer bg-transparent border-0"
                                          aria-label="Close"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>

                                      <div className="flex flex-col gap-2" role="radiogroup">
                                        {CONFIDENCE_OPTIONS.map(({ level, description }) => {
                                          const isCurrent = level === q.confidence
                                          const isSelected = level === newConfidence
                                          return (
                                            <button
                                              key={level}
                                              role="radio"
                                              aria-checked={isSelected}
                                              disabled={isCurrent}
                                              onClick={() => setNewConfidence(level)}
                                              className={`w-full text-left flex items-start gap-3 p-3.5 rounded-xl border transition ${
                                                isCurrent
                                                  ? 'bg-[#f1f5f9] border-[#f1f5f9] cursor-not-allowed'
                                                  : isSelected
                                                    ? 'bg-white border-[#36c0c9] cursor-pointer'
                                                    : 'bg-white border-[#e2e8f0] hover:border-[#cbd5e1] cursor-pointer'
                                              }`}
                                            >
                                              <span
                                                className={`mt-0.5 w-4.5 h-4.5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                                                  isSelected
                                                    ? 'border-[#0f7f8c]'
                                                    : isCurrent
                                                      ? 'border-[#cbd5e1]'
                                                      : 'border-[#94a3b8]'
                                                }`}
                                              >
                                                {isSelected && (
                                                  <span className="w-2 h-2 rounded-full bg-[#0f7f8c]" />
                                                )}
                                              </span>
                                              <span className="flex flex-col gap-0.5">
                                                <span
                                                  className={`text-xs font-bold ${isCurrent ? 'text-[#94a3b8]' : 'text-[#0d212c]'}`}
                                                >
                                                  {level}
                                                </span>
                                                <span
                                                  className={`text-[11px] ${isCurrent ? 'text-[#cbd5e1]' : 'text-[#64748b]'}`}
                                                >
                                                  {description}
                                                </span>
                                              </span>
                                            </button>
                                          )
                                        })}
                                      </div>

                                      <div className="flex flex-col gap-1.5">
                                        <label
                                          htmlFor={`confidence-reason-${q.id}`}
                                          className="text-xs font-bold text-[#0d212c]"
                                        >
                                          Reason <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                          <textarea
                                            id={`confidence-reason-${q.id}`}
                                            value={confidenceReason}
                                            onChange={(e) => setConfidenceReason(e.target.value)}
                                            maxLength={CONFIDENCE_REASON_MAX}
                                            rows={3}
                                            placeholder="Enter the reason for changing the confidence"
                                            className="w-full px-3.5 pt-3 pb-6 rounded-xl border border-[#cbd5e1] text-xs font-medium text-[#0d212c] outline-none focus:border-[#94a3b8] bg-white resize-none"
                                          />
                                          <span className="absolute right-3 bottom-2.5 text-[10px] text-[#64748b]">
                                            {confidenceReason.length}/{CONFIDENCE_REASON_MAX}
                                          </span>
                                        </div>
                                        <span className="flex items-start gap-1.5 text-[11px] text-[#64748b]">
                                          <Bot className="w-3.5 h-3.5 shrink-0 mt-px" />
                                          This reason is shared with the agent as feedback to
                                          improve future confidence scoring.
                                        </span>
                                      </div>

                                      <div className="flex justify-end gap-2.5">
                                        <button
                                          onClick={() => setConfidenceEditQuestionId(null)}
                                          className="px-6 py-2.5 rounded-lg border border-[#e2e8f0] bg-white text-xs font-bold text-[#0d212c] hover:bg-slate-50 transition cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={handleConfirmConfidenceChange}
                                          disabled={!newConfidence || !confidenceReason.trim()}
                                          className="px-9 py-2.5 rounded-lg bg-[#36c0c9] hover:bg-[#2badb6] text-white text-xs font-bold transition cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          Save
                                        </button>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-start justify-between gap-6">
                          <div className="text-xs text-[#0d212c] leading-relaxed min-w-0 flex-1">
                            <strong>Answer:</strong>{' '}
                            <span className={isScheduled ? 'text-[#64748b] italic' : ''}>
                              {isScheduled
                                ? 'Meeting not started yet. Question will be answered during the assessment call.'
                                : q.answer}
                            </span>
                          </div>
                          {!isScheduled &&
                            (() => {
                              const latestChange = confidenceChanges.find(
                                (change) => change.questionId === q.id
                              )
                              if (!latestChange) return null
                              return (
                                <span className="text-[11px] text-[#94a3b8] whitespace-nowrap shrink-0 leading-relaxed">
                                  Confidence edited by {latestChange.changedBy} ·{' '}
                                  {latestChange.date}
                                </span>
                              )
                            })()}
                        </div>

                        {!isScheduled && showAnswerKey && (
                          <>
                            <div className="text-xs text-[#64748b]">
                              <strong>Why this score:</strong> {q.whyScore}
                            </div>

                            <div className="text-xs text-[#64748b]">
                              <strong>Answer notes:</strong> {q.answerNotes}
                            </div>
                          </>
                        )}

                        {!isScheduled && q.research && (
                          <div className="p-3.5 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] text-xs flex flex-col gap-1.5 mt-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-[#0d212c]">
                                Research: {q.research.text}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-[#12b76a] text-white font-bold text-[10px]">
                                {q.research.status}
                              </span>
                            </div>

                            <div className="flex flex-col gap-1 text-[#0f766e]">
                              {q.research.links.map((link) => (
                                <a
                                  key={link}
                                  href="#"
                                  className="hover:underline truncate text-[11px]"
                                >
                                  {link}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {shouldShowAttachmentSection && (
                          <div className="mt-3 p-4 sm:p-5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            {/* Attachments (if available) */}
                            {attachmentsForQuestion.length > 0 && (
                              <div className="flex flex-col gap-2.5 min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0d212c]">
                                  <Paperclip className="w-4 h-4 text-[#0d7280]" />
                                  <span>Attachments ({attachmentsForQuestion.length})</span>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                  {attachmentsForQuestion.map((file, idx) => (
                                    <div
                                      key={idx}
                                      className="p-3 rounded-xl border border-[#e2e8f0] bg-white inline-flex items-center justify-between gap-4 text-xs w-full sm:w-auto min-w-[300px] shadow-2xs"
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="px-2.5 py-1 rounded-lg bg-[#eff6ff] text-[#2563eb] font-bold text-[10px] shrink-0">
                                          {file.type}
                                        </div>
                                        <div className="min-w-0">
                                          <h5 className="font-bold text-xs text-[#0d212c] truncate">
                                            {file.name}
                                          </h5>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <span className="px-2 py-0.5 rounded-full bg-[#ddf7f9] text-[#0d7280] text-[10px] font-bold whitespace-nowrap shrink-0">
                                              Manually added
                                            </span>
                                            <span
                                              className="w-px h-3 bg-[#cbd5e1] shrink-0"
                                              aria-hidden="true"
                                            />
                                            <span className="text-[10px] text-[#64748b] whitespace-nowrap">
                                              {file.size} • {file.date}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          onClick={() => alert(`Viewing ${file.name}...`)}
                                          className="p-1 text-[#64748b] hover:text-[#0d212c] cursor-pointer"
                                          title="View file"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => alert(`Downloading ${file.name}...`)}
                                          className="p-1 text-[#64748b] hover:text-[#0d212c] cursor-pointer"
                                          title="Download file"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Upload Evidence button when attachments already exist */}
                            {attachmentsForQuestion.length > 0 && canUpload && (
                              <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#0d7280] text-[#0d7280] hover:bg-[#f0fdfa] font-bold text-xs cursor-pointer transition shadow-2xs shrink-0 self-start lg:self-center">
                                <Upload className="w-3.5 h-3.5 text-[#0d7280]" />
                                <span>Upload evidence</span>
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => handleFileUpload(q.id, e)}
                                />
                              </label>
                            )}

                            {/* Evidence Section (Shown when no evidence is uploaded yet) */}
                            {attachmentsForQuestion.length === 0 && (
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-1">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0d212c] mb-1">
                                    <ShieldCheck className="w-4 h-4 text-[#0d7280]" />
                                    <span>Evidence</span>
                                  </div>
                                  <span className="text-xs font-bold text-[#0d212c]">
                                    No evidence uploaded yet
                                  </span>
                                  <span className="text-[11px] text-[#64748b]">
                                    Upload supporting evidence for this answer.
                                  </span>
                                </div>

                                {canUpload && (
                                  <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#0d7280] text-[#0d7280] hover:bg-[#f0fdfa] font-bold text-xs cursor-pointer transition shadow-2xs shrink-0 self-start sm:self-center">
                                    <Upload className="w-3.5 h-3.5 text-[#0d7280]" />
                                    <span>Upload evidence</span>
                                    <input
                                      type="file"
                                      className="hidden"
                                      onChange={(e) => handleFileUpload(q.id, e)}
                                    />
                                  </label>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Reviewer Comment Section (answered Low confidence questions; an added comment stays visible after the confidence changes) */}
                        {q.answer !== '(not answered)' &&
                          (isLowConfidence ||
                            (!isScheduled && Boolean(questionComments[q.id]))) && (
                            <div className="mt-1 flex flex-col gap-2">
                              {/* If comment has already been added */}
                              {questionComments[q.id] ? (
                                <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex flex-col gap-2">
                                  {/* Top: Name of the person who added the comment */}
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-[#0d7280]/10 text-[#0d7280] flex items-center justify-center text-[10px] font-bold shrink-0">
                                        {questionComments[q.id].author.charAt(0)}
                                      </div>
                                      <span className="text-xs font-bold text-[#0d212c]">
                                        {questionComments[q.id].author}
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-[#94a3b8]">
                                      {questionComments[q.id].date}
                                    </span>
                                  </div>

                                  {/* Middle: Comment text */}
                                  <p className="text-xs text-[#0d212c] pl-8 whitespace-pre-wrap leading-relaxed">
                                    {questionComments[q.id].text}
                                  </p>

                                  {/* Bottom: Reviewed by user name */}
                                  <div className="pt-2 pl-8 border-t border-[#e2e8f0]/60 flex items-center gap-1.5 text-xs text-[#64748b]">
                                    <span>Reviewed by:</span>
                                    <span className="font-semibold text-[#0d212c]">
                                      {questionComments[q.id].reviewer}
                                    </span>
                                  </div>
                                </div>
                              ) : currentStatus !== 'finalised' ? (
                                /* If no comment added yet, give the option to add only 1 comment */
                                <div>
                                  {!openCommentInput[q.id] ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setOpenCommentInput((prev) => ({ ...prev, [q.id]: true }))
                                      }
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#cbd5e1] bg-white text-xs font-semibold text-[#0d212c] shadow-2xs cursor-pointer"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                      <span>Add comment</span>
                                    </button>
                                  ) : (
                                    <div className="p-3.5 rounded-xl bg-white border border-[#cbd5e1] shadow-2xs flex flex-col gap-2.5">
                                      <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-[#0d212c] flex items-center gap-1.5">
                                          <MessageSquare className="w-3.5 h-3.5 text-[#0d7280]" />
                                          <span>Add Comment</span>
                                        </label>
                                        <span className="text-[11px] text-[#64748b]">
                                          1 comment allowed for low confidence
                                        </span>
                                      </div>
                                      <div className="relative">
                                        <textarea
                                          value={commentText}
                                          onChange={(e) =>
                                            setCommentTexts((prev) => ({
                                              ...prev,
                                              [q.id]: e.target.value.slice(0, 500),
                                            }))
                                          }
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' && isCommentLimitReached) {
                                              e.preventDefault()
                                            }
                                          }}
                                          maxLength={500}
                                          placeholder="Write your review comment here..."
                                          rows={2}
                                          className={`w-full p-2.5 pb-6 rounded-xl border text-xs text-[#0d212c] outline-none resize-none transition ${
                                            isCommentLimitReached
                                              ? 'border-red-400 bg-red-50/20 focus:border-red-500'
                                              : 'border-[#e2e8f0] bg-[#f8fafc] focus:border-[#cbd5e1]'
                                          }`}
                                        />
                                        <span
                                          className={`absolute bottom-2 right-2.5 text-[11px] pointer-events-none select-none ${
                                            isCommentLimitReached
                                              ? 'text-red-500 font-semibold'
                                              : 'text-[#64748b]'
                                          }`}
                                        >
                                          {commentLength}/500 character
                                        </span>
                                      </div>
                                      {isCommentLimitReached && (
                                        <p className="text-[11px] text-red-500 font-medium animate-in fade-in duration-150">
                                          Maximum limit of 500 characters reached
                                        </p>
                                      )}
                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenCommentInput((prev) => ({
                                              ...prev,
                                              [q.id]: false,
                                            }))
                                            setCommentTexts((prev) => ({ ...prev, [q.id]: '' }))
                                          }}
                                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#64748b] hover:text-[#0d212c] cursor-pointer"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleAddComment(q.id)}
                                          disabled={!commentText.trim() || commentLength > 500}
                                          className="px-3.5 py-1.5 rounded-lg bg-[#0d212c] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold cursor-pointer border-0 shadow-2xs"
                                        >
                                          Add comment
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
