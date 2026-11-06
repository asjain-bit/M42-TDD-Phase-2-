'use client'

import React, { useState, useMemo } from 'react'
import {
  Check,
  ChevronDown,
  Clock,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Volume2,
  Play,
  Pause,
  Copy,
  SlidersHorizontal,
  ChevronUp,
  X,
  AlertTriangle,
  ExternalLink,
  FileText,
  Search,
} from 'lucide-react'
import { Button } from '@/tdd-admin/components/atoms/Button'
import { Checkbox } from '@/tdd-admin/components/atoms/Checkbox'
import { CountryFlag } from '@/tdd-admin/components/atoms/CountryFlag'
import { CallRoomScreen } from './CallRoomScreen'
import { DISPATCH_QUESTIONNAIRES, getDispatchQuestions } from './dispatchQuestionnaires'

export interface VendorDispatchData {
  id: string
  caseId: string
  name: string
  sublabel: string
  domain: string
  country: string
  flag: string
  email: string
  recipients?: string[]
  // Round labels already used by earlier assessments of this case
  usedRoundLabels?: string[]
}

interface ConfigureVendorCallScreenProps {
  vendor: VendorDispatchData
  onBack: () => void
  onComplete?: () => void
}

export const ConfigureVendorCallScreen: React.FC<ConfigureVendorCallScreenProps> = ({
  vendor,
  onBack,
  onComplete: _onComplete,
}) => {
  // Calls are dispatched against the vendor's case ID
  const caseId = vendor.caseId
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [hasCompletedStep2, setHasCompletedStep2] = useState(false)
  const [isDispatched, setIsDispatched] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [showCallRoom, setShowCallRoom] = useState(false)
  const [callRoomStep, setCallRoomStep] = useState<'admin_join' | 'select_role'>('admin_join')
  const [hideChangeRole, setHideChangeRole] = useState(false)

  // Step 1 states (empty by default)
  const [selectedQuestionnaires, setSelectedQuestionnaires] = useState<string[]>([])
  // Questions left out of the assessment, per questionnaire (all questions are included by default)
  const [excludedQuestions, setExcludedQuestions] = useState<Record<string, number[]>>({})
  const [showQuestionnaireMenu, setShowQuestionnaireMenu] = useState(false)
  const [showQuestionPreview, setShowQuestionPreview] = useState(false)
  const [previewExcluded, setPreviewExcluded] = useState<Record<string, number[]>>({})
  const [previewSearch, setPreviewSearch] = useState('')
  const selectedQuestionnaire = selectedQuestionnaires.join(', ')
  const [roundLabel, setRoundLabel] = useState('')

  // Estimated duration is auto-populated and non-editable
  const estimatedDuration = '60-120 minutes'

  // Recipients tag state with email validation (pre-filled from vendor recipients)
  const [recipientInput, setRecipientInput] = useState('')
  const [recipients, setRecipients] = useState<string[]>(
    vendor.recipients && vendor.recipients.length > 0
      ? vendor.recipients
      : vendor.email
        ? [vendor.email]
        : []
  )
  const [recipientError, setRecipientError] = useState<string | null>(null)

  // Step 2 states (Configure Agent)
  const [selectedVoice, setSelectedVoice] = useState('Marin')
  const [showAllVoices, setShowAllVoices] = useState(false)
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const [timing, setTiming] = useState<'now' | 'later'>('now')
  const todayStr = new Date().toISOString().split('T')[0]
  const [scheduleDate, setScheduleDate] = useState(todayStr)
  const [startTime, setStartTime] = useState('10:30 AM')
  const [endTime, setEndTime] = useState('12:30 PM')

  // Primary Timezone: GST (UTC+4)
  const [timezone, setTimezone] = useState('GST - Gulf Standard Time (UTC+4)')

  // Advanced settings state
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(true)
  const [nudgeWaitSeconds, setNudgeWaitSeconds] = useState('30')

  const questionnaireOptions = DISPATCH_QUESTIONNAIRES.map((q) => q.title)

  const totalQuestionCount = selectedQuestionnaires.reduce(
    (sum, title) => sum + getDispatchQuestions(title).length,
    0
  )
  const includedQuestions = selectedQuestionnaires.flatMap((title) =>
    getDispatchQuestions(title).filter((q) => !(excludedQuestions[title] ?? []).includes(q.id))
  )

  const toggleQuestionnaire = (title: string) => {
    if (selectedQuestionnaires.includes(title)) {
      setSelectedQuestionnaires((prev) => prev.filter((t) => t !== title))
      setExcludedQuestions((prev) => {
        const next = { ...prev }
        delete next[title]
        return next
      })
    } else {
      setSelectedQuestionnaires((prev) => [...prev, title])
    }
  }

  const openQuestionPreview = () => {
    setPreviewExcluded(excludedQuestions)
    setPreviewSearch('')
    setShowQuestionnaireMenu(false)
    setShowQuestionPreview(true)
  }

  const previewTotal = totalQuestionCount
  const previewExcludedCount = selectedQuestionnaires.reduce(
    (sum, title) => sum + (previewExcluded[title] ?? []).length,
    0
  )
  const previewIncludedCount = previewTotal - previewExcludedCount

  const togglePreviewQuestion = (title: string, id: number) => {
    setPreviewExcluded((prev) => {
      const current = prev[title] ?? []
      return {
        ...prev,
        [title]: current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
      }
    })
  }

  const toggleAllPreviewQuestions = () => {
    if (previewExcludedCount === 0) {
      setPreviewExcluded(
        Object.fromEntries(
          selectedQuestionnaires.map((title) => [
            title,
            getDispatchQuestions(title).map((q) => q.id),
          ])
        )
      )
    } else {
      setPreviewExcluded({})
    }
  }

  const handleSaveQuestionPreview = () => {
    setExcludedQuestions(previewExcluded)
    setShowQuestionPreview(false)
  }

  // Requirement 6: Full text "Marin Agent recommended" chip used without truncation
  const primaryVoiceOptions = [
    {
      id: 'Marin',
      label: 'Marin',
      recommended: true,
      desc: 'Warm and steady. Keeps vendor teams at ease.',
    },
    {
      id: 'Ash',
      label: 'Ash',
      recommended: false,
      desc: 'Crisp and direct. Suits fast-moving walkthroughs.',
    },
    {
      id: 'Coral',
      label: 'Coral',
      recommended: false,
      desc: 'Bright and encouraging. Ideal for onboarding.',
    },
  ]

  const extraVoiceOptions = [
    { id: 'Alloy', label: 'Alloy', desc: 'Neutral and balanced tone.' },
    { id: 'Nova', label: 'Nova', desc: 'Professional healthcare specialist voice.' },
    { id: 'Onyx', label: 'Onyx', desc: 'Authoritative audit tone.' },
    { id: 'Echo', label: 'Echo', desc: 'Calm and deliberate voice.' },
    { id: 'Fable', label: 'Fable', desc: 'Friendly technical interviewer.' },
    { id: 'Shimmer', label: 'Shimmer', desc: 'Clear and energetic speaker.' },
    { id: 'Breeze', label: 'Breeze', desc: 'Soft and reassuring auditor.' },
  ]

  // 15-minute interval time slot options
  const timeSlots = [
    '08:00 AM',
    '08:15 AM',
    '08:30 AM',
    '08:45 AM',
    '09:00 AM',
    '09:15 AM',
    '09:30 AM',
    '09:45 AM',
    '10:00 AM',
    '10:15 AM',
    '10:30 AM',
    '10:45 AM',
    '11:00 AM',
    '11:15 AM',
    '11:30 AM',
    '11:45 AM',
    '12:00 PM',
    '12:15 PM',
    '12:30 PM',
    '12:45 PM',
    '01:00 PM',
    '01:15 PM',
    '01:30 PM',
    '01:45 PM',
    '02:00 PM',
    '02:15 PM',
    '02:30 PM',
    '02:45 PM',
    '03:00 PM',
    '03:15 PM',
    '03:30 PM',
    '03:45 PM',
    '04:00 PM',
    '04:15 PM',
    '04:30 PM',
    '04:45 PM',
    '05:00 PM',
    '05:15 PM',
    '05:30 PM',
    '05:45 PM',
    '06:00 PM',
    '06:15 PM',
    '06:30 PM',
    '06:45 PM',
    '07:00 PM',
    '07:15 PM',
    '07:30 PM',
    '07:45 PM',
    '08:00 PM',
  ]

  const callJoinLink =
    'https://tech-due-diligence.delphiprojects.app/call/E0exXCogAvq0Owdr3qbYhU0vt1CQdBuIFIJN18D6wZM'

  // Convert time string (12h AM/PM or 24h HH:MM) to minutes from midnight
  const timeToMinutes = (timeStr: string): number => {
    if (!timeStr) return -1
    const match12 = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (match12) {
      let hours = parseInt(match12[1], 10)
      const minutes = parseInt(match12[2], 10)
      const period = match12[3].toUpperCase()
      if (period === 'PM' && hours < 12) hours += 12
      if (period === 'AM' && hours === 12) hours = 0
      return hours * 60 + minutes
    }
    const match24 = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/)
    if (match24) {
      const hours = parseInt(match24[1], 10)
      const minutes = parseInt(match24[2], 10)
      return hours * 60 + minutes
    }
    return -1
  }

  // Handle Start Time changes: revalidate End Time & clear if now invalid
  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart)
    if (!newStart) {
      setEndTime('')
      return
    }
    if (endTime) {
      const startM = timeToMinutes(newStart)
      const endM = timeToMinutes(endTime)
      if (startM < 0 || endM <= startM) {
        setEndTime('')
      }
    }
  }

  // A case cannot have two rounds with the same label
  const isDuplicateRoundLabel =
    roundLabel.trim() !== '' &&
    (vendor.usedRoundLabels ?? []).some(
      (label) => label.trim().toLowerCase() === roundLabel.trim().toLowerCase()
    )

  // Step 1 Validation: Questionnaire, Round Label, at least 1 Recipient, and max 5 Recipients
  const isStep1Valid =
    selectedQuestionnaires.length > 0 &&
    includedQuestions.length > 0 &&
    roundLabel.trim() !== '' &&
    !isDuplicateRoundLabel &&
    recipients.length > 0 &&
    recipients.length <= 5

  // Email validation on Enter key press
  const handleKeyDownRecipient = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const trimmed = recipientInput.trim().replace(/,/g, '')
      if (!trimmed) return

      if (recipients.length >= 5) {
        setRecipientError('Maximum 5 recipients can be added.')
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmed)) {
        setRecipientError('Please enter a valid email address.')
        return
      }

      if (recipients.includes(trimmed)) {
        setRecipientError('This recipient has already been added.')
        return
      }

      setRecipients([...recipients, trimmed])
      setRecipientInput('')
      setRecipientError(null)
    }
  }

  const handleRemoveRecipient = (emailToRemove: string) => {
    setRecipients(recipients.filter((r) => r !== emailToRemove))
  }

  // Voice Audio Play Simulation
  const togglePlayVoice = (voiceId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (playingVoiceId === voiceId) {
      setPlayingVoiceId(null)
    } else {
      setPlayingVoiceId(voiceId)
      setTimeout(() => {
        setPlayingVoiceId(null)
      }, 3000)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(callJoinLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  // Time validation helper
  const isTimeInvalid =
    timing === 'later' &&
    Boolean(startTime) &&
    Boolean(endTime) &&
    timeToMinutes(endTime) <= timeToMinutes(startTime)

  // Step 2 Validation: Voice selected and, if scheduled later, date and valid start/end times selected
  const isStep2Valid =
    selectedVoice.trim() !== '' &&
    (timing === 'now' ||
      (Boolean(scheduleDate) && Boolean(startTime) && Boolean(endTime) && !isTimeInvalid))

  // Step 3 is unlocked strictly after Step 1 is valid, Step 2 is valid, and Step 2 has been submitted/visited
  const isStep3Unlocked = isStep1Valid && isStep2Valid && (currentStep === 3 || hasCompletedStep2)

  // Calculate duration between Start and End Time
  const durationText = useMemo(() => {
    if (!startTime || !endTime) return null
    const startM = timeToMinutes(startTime)
    const endM = timeToMinutes(endTime)
    if (startM < 0 || endM < 0 || endM <= startM) return null
    const diff = endM - startM
    const hrs = Math.floor(diff / 60)
    const mins = diff % 60
    if (hrs === 0) return `${mins} mins`
    if (mins === 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`
    return `${hrs} hr${hrs > 1 ? 's' : ''} ${mins} mins`
  }, [startTime, endTime])

  // Format meeting time range string for Call Summary & Dispatched Screen
  const formattedTimeRange = useMemo(() => {
    if (timing === 'now') {
      const now = new Date()
      // Real dynamic time currently in Dubai (Asia/Dubai)
      const startDubaiStr = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Dubai',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
      const endNow = new Date(now.getTime() + 60 * 60 * 1000)
      const endDubaiStr = endNow.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Dubai',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
      return `${startDubaiStr} - ${endDubaiStr} GST`
    }
    if (!startTime || !endTime) return 'Time not set'
    return `${startTime} - ${endTime} GST`
  }, [timing, startTime, endTime])

  // SCREEN 3: Call Room View
  if (showCallRoom) {
    return (
      <CallRoomScreen
        vendor={vendor}
        caseId={caseId}
        questions={includedQuestions}
        onBack={() => setShowCallRoom(false)}
        onExitToVendors={onBack}
        timing={timing}
        scheduleDate={scheduleDate}
        formattedTimeRange={formattedTimeRange}
        initialRole={callRoomStep === 'admin_join' ? 'admin' : 'vendor'}
        initialFlowStep={callRoomStep}
        hideChangeRole={hideChangeRole}
      />
    )
  }

  // SCREEN 2: Assessment Dispatched View
  if (isDispatched) {
    return (
      <div className="bg-[#f8fafc] text-[#0d212c] p-4 font-sans w-full flex flex-col items-center">
        <div className="w-full pb-2 text-xs font-semibold flex items-center gap-1.5 text-[#64748b]">
          <button
            onClick={onBack}
            className="hover:text-[#36c0c9] cursor-pointer flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Vendors</span>
          </button>
          <span>/</span>
          <span>{vendor.name}</span>
          <span>/</span>
          <span className="text-[#36c0c9] font-bold">Call scheduled</span>
        </div>

        <div className="w-full max-w-2xl px-6 mt-8 flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#ddf7f9] text-[#36c0c9] flex items-center justify-center shrink-0">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>

            <div className="flex flex-col">
              <h1 className="text-2xl font-extrabold tracking-tight text-[#0d212c]">
                Call scheduled
              </h1>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-[#e2e8f0] shadow-xs flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-[#64748b] uppercase tracking-wider">
                  JOIN LINK
                </span>
                <span className="text-[11px] text-[#64748b]">
                  The call is open now. Share the link and join.
                </span>
              </div>

              <div className="relative flex items-center w-full">
                <input
                  type="text"
                  readOnly
                  value={callJoinLink}
                  className="w-full pl-4 pr-11 py-3 rounded-md bg-[#f8fafc] border border-[#e2e8f0] font-mono text-xs text-[#0d212c] outline-none select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="absolute right-3 p-1.5 rounded-lg text-slate-400 hover:text-[#0d212c] hover:bg-[#e2e8f0] transition cursor-pointer"
                  title="Copy join link"
                >
                  {copiedLink ? (
                    <Check className="w-4 h-4 text-[#137333]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="mt-2 relative group w-full">
                <button
                  id="open-call-room-btn"
                  disabled={timing === 'later'}
                  onClick={() => {
                    if (timing !== 'later') {
                      setCallRoomStep('admin_join')
                      setHideChangeRole(true)
                      setShowCallRoom(true)
                    }
                  }}
                  className={`w-full font-bold text-xs py-3.5 px-6 rounded-lg transition border-0 ${
                    timing === 'later'
                      ? 'bg-[#0d212c]/40 text-white/70 cursor-not-allowed shadow-none'
                      : 'bg-[#0d212c] hover:bg-[#122e3d] text-white cursor-pointer shadow-xs'
                  }`}
                >
                  Open call room
                </button>
                {timing === 'later' && (
                  <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute left-1/2 -translate-x-1/2 -top-12 z-50 w-80 bg-[#0d212c] text-white text-xs p-2.5 rounded-xl shadow-xl border border-white/10 text-center leading-relaxed font-normal">
                    This meeting is scheduled for a specific time ({formattedTimeRange}). You will
                    be able to join the call at that time.
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-b border-[#e2e8f0]/80 py-4 grid grid-cols-3 gap-y-4 gap-x-6 text-xs">
              <div>
                <span className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider block mb-1">
                  CASE ID
                </span>
                <span className="font-bold text-[#0d212c]">{caseId}</span>
              </div>

              <div>
                <span className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider block mb-1">
                  ROUND
                </span>
                <span className="font-bold text-[#0d212c]">{roundLabel || 'Round 1'}</span>
              </div>

              <div>
                <span className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider block mb-1">
                  QUESTIONNAIRE
                </span>
                <span className="font-bold text-[#0d212c]">{selectedQuestionnaire}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider">
                WHAT HAPPENS NEXT
              </span>

              <div className="flex flex-col gap-3 text-xs text-[#0d212c]">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full border border-[#cbd5e1] bg-[#f8fafc] text-[#64748b] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <p className="leading-relaxed text-[#64748b]">
                    Share the link with the vendor team. No account needed, they join with their
                    name.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full border border-[#cbd5e1] bg-[#f8fafc] text-[#64748b] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <p className="leading-relaxed text-[#64748b]">
                    Open the link yourself. You enter the room as the M42 moderator.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full border border-[#cbd5e1] bg-[#f8fafc] text-[#64748b] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <p className="leading-relaxed text-[#64748b]">
                    Press Start assessment once everyone is in. Agent runs the questionnaire from
                    there.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 mt-6">
            <button
              onClick={onBack}
              className="text-xs font-bold text-[#36c0c9] hover:text-[#2badb6] transition cursor-pointer bg-transparent border-0"
            >
              Schedule another call
            </button>

            {/* View vendor's call room flow button outside of card below Schedule another call */}
            <div className="w-full max-w-md flex flex-col items-center gap-1.5 pt-4 border-t border-[#e2e8f0]">
              <button
                id="dispatched-view-vendor-flow-btn"
                onClick={() => {
                  setCallRoomStep('select_role')
                  setHideChangeRole(false)
                  setShowCallRoom(true)
                }}
                className="w-full bg-[#f8fafc] hover:bg-[#ddf7f9]/50 text-[#0d7280] font-bold text-xs py-2.5 px-4 rounded-lg transition cursor-pointer border border-[#36c0c9]/40 flex items-center justify-center gap-1.5 shadow-2xs"
              >
                View vendor&apos;s call room flow
              </button>
              <p className="text-[11px] text-[#64748b] text-center font-normal">
                This is a placeholder for showcasing the vendor&apos;s flow.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#f8fafc] text-[#0d212c] p-4 font-sans w-full">
      {/* Breadcrumb Header */}
      <div className="w-full pb-2 text-xs font-semibold flex items-center gap-1.5 text-[#64748b]">
        <button
          onClick={onBack}
          className="hover:text-[#36c0c9] cursor-pointer flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Vendors</span>
        </button>
        <span>/</span>
        <button onClick={onBack} className="hover:text-[#36c0c9] cursor-pointer">
          {vendor.name}
        </button>
        <span>/</span>
        <span className="text-[#36c0c9] font-bold">New call</span>
      </div>

      {/* Main Page Title Header */}
      <div className="w-full py-3 flex flex-col gap-1">
        <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight text-[#0d212c]">
          Assessment call - {caseId}
        </h1>
        <p className="text-xs text-[#64748b]">
          Set up the session, configure Agent, then review before launch.
        </p>
      </div>

      {/* TOP FULL WIDTH HORIZONTAL STEP INDICATORS BAR */}
      <div className="w-full mt-4">
        <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col gap-3">
          <span className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider">
            CALL SETUP STAGES
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 Indicator */}
            <div
              className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center gap-3 ${
                currentStep === 1
                  ? 'border-[#36c0c9] bg-[#ddf7f9]/20'
                  : currentStep > 1
                    ? 'border-[#e2e8f0] bg-[#f8fafc]'
                    : 'border-[#e2e8f0] bg-white'
              }`}
              onClick={() => setCurrentStep(1)}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  currentStep === 1
                    ? 'bg-[#36c0c9] text-white'
                    : currentStep > 1
                      ? 'bg-[#137333] text-white'
                      : 'bg-[#e2e8f0] text-[#64748b]'
                }`}
              >
                {currentStep > 1 ? <Check className="w-4 h-4" /> : '01'}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#0d212c]">01 Setup</span>
                <span className="text-[11px] text-[#64748b]">Session details</span>
              </div>
            </div>

            {/* Step 2 Indicator */}
            <button
              disabled={!isStep1Valid}
              onClick={() => isStep1Valid && setCurrentStep(2)}
              className={`p-3.5 rounded-md border transition flex items-center gap-3 text-left w-full ${
                currentStep === 2
                  ? 'border-[#36c0c9] bg-[#ddf7f9]/20'
                  : currentStep > 2 || hasCompletedStep2
                    ? 'border-[#e2e8f0] bg-[#f8fafc] cursor-pointer'
                    : isStep1Valid
                      ? 'border-[#e2e8f0] bg-white cursor-pointer hover:border-[#cbd5e1]'
                      : 'border-[#e2e8f0] bg-slate-50 opacity-40 cursor-not-allowed'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  currentStep === 2
                    ? 'bg-[#36c0c9] text-white'
                    : currentStep > 2 || hasCompletedStep2
                      ? 'bg-[#137333] text-white'
                      : 'bg-[#e2e8f0] text-[#64748b]'
                }`}
              >
                {currentStep > 2 || hasCompletedStep2 ? <Check className="w-4 h-4" /> : '02'}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#0d212c]">02 Configure Agent</span>
                <span className="text-[11px] text-[#64748b]">Agent voice & timing</span>
              </div>
            </button>

            {/* Step 3 Indicator */}
            <button
              disabled={!isStep3Unlocked}
              onClick={() => isStep3Unlocked && setCurrentStep(3)}
              className={`p-3.5 rounded-md border transition flex items-center gap-3 text-left w-full ${
                currentStep === 3
                  ? 'border-[#36c0c9] bg-[#ddf7f9]/20'
                  : isStep3Unlocked
                    ? 'border-[#e2e8f0] bg-white cursor-pointer hover:border-[#cbd5e1]'
                    : 'border-[#e2e8f0] bg-slate-50 opacity-40 cursor-not-allowed'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  currentStep === 3 ? 'bg-[#36c0c9] text-white' : 'bg-[#e2e8f0] text-[#64748b]'
                }`}
              >
                03
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#0d212c]">03 Review & launch</span>
                <span className="text-[11px] text-[#64748b]">Confirm and start</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout Grid */}
      <div
        className={`w-full mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 ${
          currentStep === 3 ? 'items-stretch' : 'items-start'
        }`}
      >
        {/* Left Column: STEP CONTENT (8 cols) */}
        <div
          className={`lg:col-span-8 flex flex-col gap-6 ${currentStep === 3 ? 'h-full' : 'h-auto'}`}
        >
          {currentStep === 1 && (
            <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={onBack}
                  className="p-1 rounded-lg hover:bg-[#f1f5f9] transition text-[#0d212c] cursor-pointer"
                  title="Back to vendors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-base font-extrabold text-[#0d212c]">Session setup</h2>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    Choose the session type, questionnaire, and duration.
                  </p>
                </div>
              </div>

              {/* CALL TYPE */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider">
                  CALL TYPE <span className="text-red-500 font-bold">*</span>
                </span>
                <div className="p-4 rounded-2xl border border-[#e2e8f0] bg-white flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-[#0d212c] shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-[#0d212c]">Assessment round</span>
                      <span className="text-[11px] text-[#64748b] mt-0.5">
                        Structured due-diligence interview using an approved questionnaire.
                      </span>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-[#36c0c9] shrink-0 mt-0.5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                    <circle cx="12" cy="12" r="5" />
                  </svg>
                </div>
              </div>

              {/* QUESTIONNAIRE MULTI-SELECT DROPDOWN */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider">
                    QUESTIONNAIRE <span className="text-red-500 font-bold">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={openQuestionPreview}
                    disabled={selectedQuestionnaires.length === 0}
                    className="flex items-center gap-1 text-xs font-bold text-[#36c0c9] hover:text-[#2badb6] transition cursor-pointer bg-transparent border-0 disabled:text-[#cbd5e1] disabled:cursor-not-allowed"
                  >
                    Open preview
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowQuestionnaireMenu((open) => !open)}
                    aria-haspopup="listbox"
                    aria-expanded={showQuestionnaireMenu}
                    className="w-full pl-4 pr-10 py-3 rounded-md border border-[#e2e8f0] bg-white text-xs font-semibold text-left flex items-center gap-2.5 cursor-pointer outline-none"
                  >
                    <FileText className="w-4 h-4 text-[#64748b] shrink-0" />
                    <span
                      className={`truncate ${selectedQuestionnaires.length > 0 ? 'text-[#0d212c]' : 'text-[#94a3b8]'}`}
                    >
                      {selectedQuestionnaires.length > 0
                        ? selectedQuestionnaire
                        : 'Select questionnaire...'}
                    </span>
                  </button>
                  {showQuestionnaireMenu ? (
                    <ChevronUp className="w-4 h-4 text-[#64748b] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#64748b] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}

                  {showQuestionnaireMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-20"
                        onClick={() => setShowQuestionnaireMenu(false)}
                      />
                      <div
                        role="listbox"
                        aria-multiselectable="true"
                        className="absolute left-0 right-0 top-full mt-2 z-30 bg-white rounded-2xl border border-[#e2e8f0] shadow-lg p-2 flex flex-col gap-1 max-h-72 overflow-y-auto"
                      >
                        {questionnaireOptions.map((opt) => {
                          const isSelected = selectedQuestionnaires.includes(opt)
                          return (
                            <button
                              key={opt}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => toggleQuestionnaire(opt)}
                              className="w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-lg border border-transparent bg-white hover:bg-[#f8fafc] text-left transition cursor-pointer"
                            >
                              <span className="flex items-center gap-3 min-w-0">
                                <span
                                  className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition ${
                                    isSelected
                                      ? 'bg-[#36c0c9] border-[#36c0c9]'
                                      : 'bg-white border-[#cbd5e1]'
                                  }`}
                                >
                                  {isSelected && (
                                    <Check className="w-3 h-3 text-white stroke-[3]" />
                                  )}
                                </span>
                                <span className="text-xs font-semibold text-[#0d212c] truncate">
                                  {opt}
                                </span>
                              </span>
                              <span className="shrink-0 px-2.5 py-1 rounded-full bg-[#f1f5f9] text-[11px] font-semibold text-[#64748b]">
                                {getDispatchQuestions(opt).length} questions
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </>
                  )}
                </div>
                {selectedQuestionnaires.length > 0 && (
                  <span className="text-[11px] text-[#64748b] pl-1">
                    {includedQuestions.length} of {totalQuestionCount} questions included
                  </span>
                )}
              </div>

              {/* Requirement 5: ESTIMATED DURATION field with Note below */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider">
                  ESTIMATED DURATION <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="relative flex items-center w-full">
                  <input
                    type="text"
                    readOnly
                    value={estimatedDuration}
                    className="w-full pl-10 pr-4 py-2.5 rounded-md border border-[#e2e8f0] bg-slate-50 text-xs font-semibold text-[#0d212c] outline-none cursor-not-allowed select-none"
                  />
                  <Clock className="w-4 h-4 text-[#36c0c9] absolute left-3.5 pointer-events-none" />
                </div>
                <p className="text-[11px] text-[#64748b] mt-1 leading-relaxed">
                  <strong>Note:</strong> This is the estimated duration based on the number of
                  questions. The minimum time is 135 minutes and the maximum time is 205 minutes an
                  agent will take to complete the assessment.
                </p>
              </div>

              {/* ROUND LABEL */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider">
                  ROUND LABEL <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={roundLabel}
                  onChange={(e) => setRoundLabel(e.target.value)}
                  placeholder="e.g. Round 1"
                  aria-invalid={isDuplicateRoundLabel}
                  className={`w-full px-4 py-2.5 rounded-md border text-xs text-[#0d212c] outline-none transition ${
                    isDuplicateRoundLabel
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-[#e2e8f0] focus:border-[#cbd5e1]'
                  }`}
                />
                {isDuplicateRoundLabel && (
                  <span className="text-xs font-medium text-red-600 animate-in fade-in duration-150">
                    &ldquo;{roundLabel.trim()}&rdquo; has already been used for an earlier round of
                    this case. Round names should be different.
                  </span>
                )}
              </div>

              {/* RECIPIENTS */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider">
                  RECIPIENTS <span className="text-red-500">*</span>
                </label>

                <input
                  type="email"
                  value={recipientInput}
                  disabled={recipients.length >= 5}
                  onChange={(e) => {
                    setRecipientInput(e.target.value)
                    if (recipientError) setRecipientError(null)
                  }}
                  onKeyDown={handleKeyDownRecipient}
                  placeholder={
                    recipients.length >= 5
                      ? 'Maximum 5 recipients reached'
                      : 'Enter email address and press Enter...'
                  }
                  className={`w-full px-4 py-2.5 rounded-md border text-xs text-[#0d212c] outline-none transition disabled:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed ${
                    recipientError
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-[#e2e8f0] focus:border-[#cbd5e1]'
                  }`}
                />

                <div
                  className={`flex items-center justify-between text-[11px] ${
                    recipients.length > 5 ? 'text-red-600 font-bold' : 'text-[#64748b]'
                  }`}
                >
                  <span>Maximum 5 recipients can be added</span>
                  <span>{recipients.length}/5</span>
                </div>

                {recipients.length > 5 && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 font-semibold flex items-center gap-2 mt-1 animate-in fade-in duration-150">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>
                      Maximum 5 recipients allowed. Please remove {recipients.length - 5}{' '}
                      recipient(s) to continue.
                    </span>
                  </div>
                )}

                {recipientError && (
                  <span className="text-xs font-medium text-red-600 animate-in fade-in duration-150">
                    {recipientError}
                  </span>
                )}

                {recipients.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {recipients.map((rec) => (
                      <span
                        key={rec}
                        className="inline-flex items-center gap-1.5 bg-[#f1f5f9] text-[#0d212c] text-xs font-semibold px-3 py-1.5 rounded-full border border-[#cbd5e1]"
                      >
                        <span>{rec}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRecipient(rec)}
                          className="p-0.5 hover:bg-slate-200 rounded-full text-slate-500 hover:text-red-600 transition cursor-pointer border-0"
                          title="Remove recipient"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between border-t border-[#e2e8f0] pt-4">
                <button
                  onClick={onBack}
                  className="text-xs font-semibold text-[#64748b] hover:text-[#0d212c] cursor-pointer bg-transparent border-0"
                >
                  Cancel
                </button>
                <button
                  disabled={!isStep1Valid}
                  onClick={() => isStep1Valid && setCurrentStep(2)}
                  className="bg-[#0d212c] hover:bg-[#122e3d] text-white font-bold text-xs px-6 py-3 rounded-lg transition cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed border-0"
                >
                  <span>Continue to configure Agent</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="p-1 rounded-lg hover:bg-[#f1f5f9] transition text-[#0d212c] cursor-pointer bg-transparent border-0"
                  title="Back to setup"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-base font-extrabold text-[#0d212c]">Configure Agent</h2>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    Choose Agent voice and when the session should begin.
                  </p>
                </div>
              </div>

              {/* AGENT VOICE */}
              <div className="flex flex-col gap-3">
                <span className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider">
                  AGENT VOICE
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {primaryVoiceOptions.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVoice(v.id)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col gap-1.5 ${
                        selectedVoice === v.id
                          ? 'border-[#36c0c9] bg-[#ddf7f9]/20'
                          : 'border-[#e2e8f0] bg-white hover:border-[#cbd5e1]'
                      }`}
                    >
                      {/* Requirement 6: Recommended chip */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                          <h4 className="font-bold text-xs text-[#0d212c] shrink-0">{v.label}</h4>
                          {v.recommended && (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[#ddf7f9] text-[#0f766e] whitespace-nowrap shrink-0">
                              Recommended
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => togglePlayVoice(v.id, e)}
                          className={`p-1.5 rounded-lg transition cursor-pointer shrink-0 border-0 ${
                            playingVoiceId === v.id
                              ? 'bg-[#36c0c9] text-white shadow-xs'
                              : 'bg-[#f1f5f9] text-[#0d212c] hover:bg-[#e2e8f0]'
                          }`}
                          title={`Listen to ${v.label}'s voice`}
                        >
                          {playingVoiceId === v.id ? (
                            <Pause className="w-3.5 h-3.5 animate-pulse" />
                          ) : (
                            <Play className="w-3.5 h-3.5 ml-0.5" />
                          )}
                        </button>
                      </div>

                      <p className="text-[10px] text-[#64748b] leading-tight">{v.desc}</p>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowAllVoices(!showAllVoices)}
                  className="text-xs font-bold text-[#36c0c9] hover:underline text-left cursor-pointer pt-1 bg-transparent border-0"
                >
                  {showAllVoices ? 'Hide extra voices' : 'View all 10 voices'}
                </button>

                {showAllVoices && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
                    {extraVoiceOptions.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedVoice(ev.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between gap-2 ${
                          selectedVoice === ev.id
                            ? 'bg-[#ddf7f9]/30 border-[#36c0c9] text-[#0d212c] font-bold'
                            : 'bg-white border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Volume2 className="w-3.5 h-3.5 text-[#36c0c9]" />
                          <span>{ev.label}</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => togglePlayVoice(ev.id, e)}
                          className="p-1 rounded-lg bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0d212c] transition cursor-pointer border-0"
                        >
                          {playingVoiceId === ev.id ? (
                            <Pause className="w-3.5 h-3.5 text-[#36c0c9]" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* WHEN */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider">
                  WHEN
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setTiming('now')}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col gap-1 ${
                      timing === 'now'
                        ? 'border-[#36c0c9] bg-[#ddf7f9]/20'
                        : 'border-[#e2e8f0] bg-white'
                    }`}
                  >
                    <span className="font-bold text-xs text-[#0d212c]">Start now</span>
                    <span className="text-[10px] text-[#64748b]">
                      Open the call room as soon as setup is complete.
                    </span>
                  </div>

                  <div
                    onClick={() => setTiming('later')}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col gap-1 ${
                      timing === 'later'
                        ? 'border-[#36c0c9] bg-[#ddf7f9]/20'
                        : 'border-[#e2e8f0] bg-white'
                    }`}
                  >
                    <span className="font-bold text-xs text-[#0d212c]">Schedule for later</span>
                    <span className="text-[10px] text-[#64748b]">
                      Choose a date and time for this session.
                    </span>
                  </div>
                </div>

                {/* Requirement 7: Start & End time fields note below inputs */}
                {timing === 'later' && (
                  <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex flex-col gap-3 mt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#0d212c] mb-1">
                          Meeting date
                        </label>
                        <input
                          type="date"
                          value={scheduleDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-md border border-[#e2e8f0] bg-white text-xs text-[#0d212c] outline-none focus:border-[#cbd5e1]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#0d212c] mb-1">
                          Start time
                        </label>
                        <select
                          value={startTime}
                          onChange={(e) => handleStartTimeChange(e.target.value)}
                          className="w-full px-3 py-2 rounded-md border border-[#e2e8f0] bg-white text-xs text-[#0d212c] outline-none focus:border-[#cbd5e1] cursor-pointer font-medium"
                        >
                          <option value="">Select start time</option>
                          {timeSlots.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#0d212c] mb-1">
                          End time
                        </label>
                        <select
                          disabled={!startTime}
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className={`w-full px-3 py-2 rounded-md border bg-white text-xs outline-none focus:border-[#cbd5e1] transition ${
                            !startTime
                              ? 'opacity-40 cursor-not-allowed bg-slate-50 border-[#e2e8f0] text-[#94a3b8]'
                              : isTimeInvalid
                                ? 'border-red-500 text-red-700 font-semibold cursor-pointer'
                                : 'border-[#e2e8f0] text-[#0d212c] cursor-pointer font-medium'
                          }`}
                        >
                          <option value="">
                            {!startTime ? 'Select start time first' : 'Select end time'}
                          </option>
                          {timeSlots
                            .filter(
                              (t) => !startTime || timeToMinutes(t) > timeToMinutes(startTime)
                            )
                            .map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                        </select>
                        {isTimeInvalid && (
                          <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1 mt-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>End time must be after the start time.</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {durationText && (
                      <div className="flex items-center gap-1.5 text-xs text-[#0d7280] font-bold bg-[#ddf7f9] px-3 py-1.5 rounded-full self-start border border-[#b2ecf2]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Calculated duration: {durationText}</span>
                      </div>
                    )}

                    <p className="text-[11px] text-[#64748b] leading-relaxed">
                      <strong>Note:</strong> The assessment begins when the user selects “Start
                      Assessment” within the meeting. At this point, the system records the start
                      time and begins tracking the elapsed duration. Completion is expected to take
                      60–120 minutes and the total time is measured between the recorded start time
                      and end time, including any pauses.
                    </p>

                    {isTimeInvalid && (
                      <p className="text-[11px] font-semibold text-red-600">
                        End time must be after the start time.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* TIMEZONE */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider">
                  TIMEZONE
                </span>
                <div className="relative">
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-md border border-[#e2e8f0] bg-white text-xs text-[#0d212c] appearance-none outline-none focus:border-[#cbd5e1]"
                  >
                    <option value="GST - Gulf Standard Time (UTC+4)">
                      GST - Gulf Standard Time (UTC+4)
                    </option>
                    <option value="Asia/Riyadh - GMT+3:00">Asia/Riyadh - GMT+3:00</option>
                    <option value="Asia/Calcutta - GMT+5:30">Asia/Calcutta - GMT+5:30</option>
                    <option value="UTC - GMT+0:00">UTC - GMT+0:00</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#64748b] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* ADVANCED SETTINGS */}
              <div className="border border-[#e2e8f0] rounded-2xl bg-white overflow-hidden shadow-xs">
                <div
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-[#f8fafc] transition"
                >
                  <div className="flex items-center gap-3">
                    <SlidersHorizontal className="w-4 h-4 text-[#64748b]" />
                    <div className="flex flex-col">
                      <span className="font-bold text-xs text-[#0d212c]">Advanced settings</span>
                      <span className="text-[11px] text-[#64748b]">
                        Document reminders and room behaviour
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-[#64748b]">
                    <span>{nudgeWaitSeconds}s reminder</span>
                    <ChevronUp
                      className={`w-4 h-4 transition-transform ${showAdvancedSettings ? '' : 'rotate-180'}`}
                    />
                  </div>
                </div>

                {showAdvancedSettings && (
                  <div className="p-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex flex-col gap-2">
                    <label className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider">
                      UPLOAD WAIT BEFORE NUDGE (SECONDS)
                    </label>
                    <input
                      type="number"
                      value={nudgeWaitSeconds}
                      onChange={(e) => setNudgeWaitSeconds(e.target.value)}
                      className="w-full px-4 py-2 rounded-md border border-[#e2e8f0] bg-white text-xs font-bold text-[#0d212c] outline-none focus:border-[#cbd5e1]"
                    />
                    <p className="text-[11px] text-[#64748b] mt-0.5">
                      How long Agent waits after asking for a document before nudging the room.
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between border-t border-[#e2e8f0] pt-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-semibold text-[#64748b] hover:text-[#0d212c] cursor-pointer bg-transparent border-0"
                >
                  Back to setup
                </button>
                <button
                  disabled={!isStep2Valid}
                  onClick={() => {
                    if (isStep2Valid) {
                      setHasCompletedStep2(true)
                      setCurrentStep(3)
                    }
                  }}
                  className="bg-[#0d212c] hover:bg-[#122e3d] text-white font-bold text-xs px-6 py-3 rounded-lg transition cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed border-0"
                >
                  <span>Continue to review</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col justify-between gap-6 h-full">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="p-1 rounded-lg hover:bg-[#f1f5f9] transition text-[#0d212c] cursor-pointer bg-transparent border-0"
                    title="Back to voice config"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h2 className="text-base font-extrabold text-[#0d212c]">Review & launch</h2>
                    <p className="text-xs text-[#64748b] mt-0.5">
                      Confirm configuration and initiate automated vendor assessment call.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-[#e2e8f0]/80 flex flex-col text-xs">
                  <div className="py-3 flex justify-between">
                    <span className="text-[#64748b]">Case ID:</span>
                    <span className="font-bold text-[#0d212c]">{caseId}</span>
                  </div>
                  <div className="py-3 flex justify-between">
                    <span className="text-[#64748b]">Target vendor:</span>
                    <span className="font-bold text-[#0d212c]">{vendor.name}</span>
                  </div>
                  {recipients.length > 0 && (
                    <div className="py-3 flex items-start justify-between gap-3">
                      <span className="text-[#64748b] shrink-0 pt-0.5">Recipients:</span>
                      <div className="flex flex-wrap items-center gap-1.5 justify-end">
                        {recipients.map((recEmail, idx) => (
                          <span
                            key={idx}
                            className="inline-block bg-[#f1f5f9] text-[#0d212c] font-medium px-2 py-0.5 rounded-md text-[11px] border border-[#e2e8f0] truncate max-w-[180px]"
                            title={recEmail}
                          >
                            {recEmail}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="py-3 flex justify-between">
                    <span className="text-[#64748b]">Selected questionnaire:</span>
                    <span className="font-bold text-[#0d212c]">{selectedQuestionnaire}</span>
                  </div>
                  <div className="py-3 flex justify-between">
                    <span className="text-[#64748b]">Agent Voice:</span>
                    <span className="font-bold text-[#0d212c]">{selectedVoice}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#e2e8f0] pt-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="text-xs font-semibold text-[#64748b] hover:text-[#0d212c] cursor-pointer bg-transparent border-0"
                >
                  Back to voice config
                </button>
                <Button
                  onClick={() => setIsDispatched(true)}
                  className="bg-[#0d212c] hover:bg-[#122e3d] text-white font-bold text-xs px-6 py-3 rounded-lg cursor-pointer"
                >
                  Launch assessment call
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: CALL SUMMARY BOX */}
        <div
          className={`lg:col-span-4 flex flex-col gap-6 ${currentStep === 3 ? 'h-full' : 'h-auto'}`}
        >
          <div
            className={`bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col gap-4 text-xs ${
              currentStep === 3 ? 'h-full justify-between' : 'h-auto justify-start'
            }`}
          >
            <span className="font-bold text-[#0d212c]">Call summary</span>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]">
              <div className="w-9 h-9 rounded-xl bg-[#ddf7f9] text-[#36c0c9] font-bold flex items-center justify-center shrink-0">
                {vendor.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-[#0d212c] truncate">{vendor.name}</span>
                <span className="text-[11px] text-[#64748b] truncate flex items-center gap-1.5 mt-0.5">
                  <CountryFlag country={vendor.country} />
                  <span>{vendor.country}</span>
                  <span>•</span>
                  <span>{vendor.domain}</span>
                </span>
              </div>
            </div>

            {/* Requirement 8: Replace Timezone field with START & END TIME (10:30 AM - 12:30 PM GST) */}
            <div className="divide-y divide-[#e2e8f0]/60 flex flex-col">
              <div className="py-2.5 flex justify-between">
                <span className="text-[#64748b]">CASE ID</span>
                <span className="font-bold text-[#0d212c]">{caseId}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#64748b]">CALL TYPE</span>
                <span className="font-bold text-[#0d212c]">Assessment round</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#64748b]">QUESTIONS</span>
                <span className="font-bold text-[#0d212c]">
                  {selectedQuestionnaires.length > 0 ? includedQuestions.length : '-'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between gap-2">
                <span className="text-[#64748b] shrink-0">MEETING TIME</span>
                <span className="font-bold text-[#0d212c] text-right truncate">
                  {formattedTimeRange}
                </span>
              </div>
            </div>

            <div className="border-t border-[#e2e8f0] pt-3 flex flex-col gap-2">
              <div className="flex justify-between text-[11px]">
                <span className="font-bold text-[#64748b]">READINESS</span>
                <span className="font-bold text-[#0d212c]">
                  {isStep1Valid
                    ? currentStep === 3
                      ? '3 of 3 complete'
                      : `${currentStep} of 3 complete`
                    : '0 of 3 complete'}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span>Setup</span>
                  <span className={isStep1Valid ? 'text-[#137333] font-bold' : 'text-[#64748b]'}>
                    {isStep1Valid ? 'Complete' : 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Configure Agent</span>
                  <span className={currentStep > 2 ? 'text-[#137333] font-bold' : 'text-[#64748b]'}>
                    {currentStep > 2 ? 'Complete' : 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Review & launch</span>
                  <span className="text-[#64748b]">Pending</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Questionnaire preview: choose which questions are included in the assessment */}
      {showQuestionPreview && (
        <div className="fixed inset-0 z-50 bg-[#0d212c]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-8 pt-7 pb-5 flex items-start justify-between gap-4">
              <h3 className="text-xl font-extrabold text-[#0d212c]">
                {selectedQuestionnaires.length === 1
                  ? selectedQuestionnaires[0]
                  : `${selectedQuestionnaires.length} questionnaires selected`}
              </h3>
              <button
                onClick={() => setShowQuestionPreview(false)}
                className="p-1 rounded-lg text-[#64748b] hover:text-[#0d212c] hover:bg-slate-50 transition cursor-pointer bg-transparent border-0"
                aria-label="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-8 pb-5 flex flex-col gap-4 border-b border-[#e2e8f0]">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-extrabold text-[#0d212c]">Questions</span>
                <div className="relative w-full max-w-xs">
                  <Search className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                    placeholder="Search questions..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-md border border-[#e2e8f0] text-xs text-[#0d212c] outline-none focus:border-[#cbd5e1]"
                  />
                </div>
              </div>
              <Checkbox
                label="Select all questions during assessment"
                checked={previewExcludedCount === 0}
                onChange={toggleAllPreviewQuestions}
              />
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 bg-[#f8fafc] flex flex-col gap-6">
              {(() => {
                const search = previewSearch.trim().toLowerCase()
                const groups = selectedQuestionnaires
                  .map((title) => ({
                    title,
                    questions: getDispatchQuestions(title)
                      .map((q, idx) => ({ ...q, number: idx + 1 }))
                      .filter(
                        (q) =>
                          !search ||
                          q.question.toLowerCase().includes(search) ||
                          q.responseCue.toLowerCase().includes(search)
                      ),
                  }))
                  .filter((group) => group.questions.length > 0)

                if (groups.length === 0) {
                  return (
                    <p className="text-xs text-[#64748b] text-center py-10">
                      No questions match your search.
                    </p>
                  )
                }

                return groups.map((group) => (
                  <div key={group.title} className="flex flex-col gap-4">
                    {selectedQuestionnaires.length > 1 && (
                      <span className="text-[11px] font-extrabold text-[#64748b] uppercase tracking-wider">
                        {group.title}
                      </span>
                    )}
                    {group.questions.map((q) => {
                      const isIncluded = !(previewExcluded[group.title] ?? []).includes(q.id)
                      return (
                        <div
                          key={`${group.title}-${q.id}`}
                          className="bg-white p-6 rounded-2xl border border-[#e2e8f0] flex flex-col gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isIncluded}
                              onChange={() => togglePreviewQuestion(group.title, q.id)}
                              aria-label={`Include question ${q.number}`}
                            />
                            <span className="text-sm font-extrabold text-[#0d212c] tracking-tight">
                              Question {q.number}
                            </span>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-extrabold text-[#64748b] uppercase tracking-wider">
                              QUESTION{' '}
                              {q.requiredQuestion && (
                                <span className="text-red-500 font-bold">*</span>
                              )}
                            </label>
                            <div className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] bg-slate-50/50 text-xs font-medium text-[#0d212c]">
                              {q.question}
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-extrabold text-[#64748b] uppercase tracking-wider">
                              RESPONSE CUE{' '}
                              {q.requiredQuestion && (
                                <span className="text-red-500 font-bold">*</span>
                              )}
                            </label>
                            <div className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] bg-slate-50/50 text-xs font-medium text-[#0d212c] leading-relaxed">
                              {q.responseCue}
                            </div>
                          </div>

                          <div className="flex items-center gap-6 pt-2">
                            <Checkbox
                              label="Research needed"
                              checked={q.researchNeeded}
                              disabled
                              readOnly
                            />
                            <Checkbox
                              label="Attachment required"
                              checked={q.attachmentRequired}
                              disabled
                              readOnly
                            />
                            <Checkbox
                              label="Required Question"
                              checked={!!q.requiredQuestion}
                              disabled
                              readOnly
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))
              })()}
            </div>

            <div className="px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-[#64748b] flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  Included in Assessment:{' '}
                  <strong className="text-[#0d212c]">
                    {previewIncludedCount} / {previewTotal} questions
                  </strong>
                </span>
                <span className="text-[#cbd5e1]">|</span>
                <span>
                  Estimated Duration:{' '}
                  <strong className="text-[#0d212c]">{estimatedDuration}</strong>
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setShowQuestionPreview(false)}
                  className="px-6 py-2.5 rounded-lg border border-[#e2e8f0] bg-white text-xs font-bold text-[#0d212c] hover:bg-slate-50 transition cursor-pointer"
                >
                  Close preview
                </button>
                <button
                  onClick={handleSaveQuestionPreview}
                  disabled={previewIncludedCount === 0}
                  className="px-8 py-2.5 rounded-lg bg-[#36c0c9] hover:bg-[#2badb6] text-white text-xs font-bold transition cursor-pointer border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
