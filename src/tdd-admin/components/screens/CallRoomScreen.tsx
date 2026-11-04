'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  Mic,
  MicOff,
  MonitorUp,
  MessageSquare,
  DoorOpen,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  Fingerprint,
  Building2,
  Info,
  X,
  Calendar,
  Clock,
  Check,
  Download,
  FileSearch,
  ShieldAlert,
} from 'lucide-react'
import { VendorDispatchData } from './ConfigureVendorCallScreen'
import type { QuestionItem } from './QuestionnaireDetailScreen'
import { DISPATCH_QUESTIONNAIRES } from './dispatchQuestionnaires'

type CallRoomState = 'join' | 'waiting' | 'left' | 'finalised'

interface TranscriptEntry {
  speaker: 'Sam' | 'Vendor'
  text: string
  time: string
}

interface CallRoomScreenProps {
  vendor: VendorDispatchData
  caseId?: string
  questions?: QuestionItem[]
  onBack: () => void
  onExitToVendors?: () => void
  userName?: string
  timing?: 'now' | 'later'
  scheduleDate?: string
  formattedTimeRange?: string
  initialRole?: 'admin' | 'vendor'
  initialFlowStep?: 'select_role' | 'admin_join' | 'vendor_input' | 'vendor_otp'
  hideChangeRole?: boolean
}

// Seconds the agent spends on each question in the simulated call
const QUESTION_STEP_SECONDS = 20
const QUESTION_ALERT_DELAY_SECONDS = 3
// Vendor emails already on the call invite list (test email for the demo)
const VENDOR_INVITED_EMAILS = ['zaidm42@gmail.com']

// Sample questionnaire transcript
const sampleTranscript: TranscriptEntry[] = [
  {
    speaker: 'Sam',
    time: '11:32 AM',
    text: "Welcome. I'm Sam, your AI assessor. Before we begin, I want to confirm you have consented to this session being recorded and transcribed.",
  },
  {
    speaker: 'Vendor',
    time: '11:32 AM',
    text: 'Yes, we confirm and consent to the recording.',
  },
  {
    speaker: 'Sam',
    time: '11:33 AM',
    text: "Thank you. Let's begin with Section 1: Data Protection & Privacy.",
  },
  {
    speaker: 'Sam',
    time: '11:33 AM',
    text: 'Does your organisation maintain a formal data classification policy that categorises data based on sensitivity level — for example, public, internal, confidential, or restricted?',
  },
  {
    speaker: 'Vendor',
    time: '11:35 AM',
    text: 'Yes, we have a formal data classification policy. All data is categorised into four tiers: Public, Internal Use, Confidential, and Restricted. The policy is reviewed annually and enforced through our DLP tooling.',
  },
  {
    speaker: 'Sam',
    time: '11:36 AM',
    text: 'Can you describe how your organisation ensures data subject rights requests — such as access, erasure, or portability — are handled within the regulatory timeframes set by applicable data protection laws?',
  },
]

export const CallRoomScreen: React.FC<CallRoomScreenProps> = ({
  vendor,
  caseId,
  questions = DISPATCH_QUESTIONNAIRES[0].questions,
  onBack,
  onExitToVendors,
  userName = 'Zaid Al Ali',
  timing = 'now',
  scheduleDate,
  formattedTimeRange,
  initialRole = 'admin',
  initialFlowStep = 'admin_join',
  hideChangeRole = false,
}) => {
  const [roomState, setRoomState] = useState<CallRoomState>('join')
  const [yourName, setYourName] = useState(userName)
  const [isMuted, setIsMuted] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [pulseActive, setPulseActive] = useState(true)
  const [wavePhase, setWavePhase] = useState(0)

  // Assessment lifecycle
  const [assessmentStarted, setAssessmentStarted] = useState(false)
  const [agentOnHold, setAgentOnHold] = useState(false)

  // Leave confirmation popup
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  // End & Finalise confirmation popup
  const [showFinaliseConfirm, setShowFinaliseConfirm] = useState(false)

  // Live timer (starts when assessment starts)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Local device file upload state & ref
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<
    { id: string; name: string; size: string; type: string; sender: string; time: string }[]
  >([
    {
      id: 'sample-doc-1',
      name: 'SOC2_Type_II_Compliance_Report_2026.pdf',
      size: '2.4 MB',
      type: 'PDF',
      sender: 'Presight AI',
      time: '11:34 AM',
    },
  ])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileSizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const newDoc = {
      id: `uploaded-${file.name.replace(/[^a-zA-Z0-9]/g, '')}-${file.size}`,
      name: file.name,
      size: fileSizeStr,
      type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
      sender:
        userRole === 'admin'
          ? yourName.trim() || 'M42 Admin'
          : vendorNameInput.trim() || vendor.name,
      time: nowStr,
    }

    setUploadedFiles((prev) => [...prev, newDoc])
    setShowTranscript(true)
    // reset input value so re-uploading same file works
    e.target.value = ''
  }

  // Meeting started state (defaults to true if timing === 'now')
  const [isMeetingStarted, setIsMeetingStarted] = useState<boolean>(timing !== 'later')

  useEffect(() => {
    if (!assessmentStarted) return
    const t = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [assessmentStarted])

  // Question the agent is currently asking; it pauses while the agent is on hold
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  useEffect(() => {
    if (!assessmentStarted || agentOnHold) return
    const t = setInterval(
      () => setCurrentQuestionIndex((i) => Math.min(i + 1, questions.length - 1)),
      QUESTION_STEP_SECONDS * 1000
    )
    return () => clearInterval(t)
  }, [assessmentStarted, agentOnHold, questions.length])

  // Prototype: a few seconds into each question the agent raises an alert on it
  const [alertQuestionIndex, setAlertQuestionIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!assessmentStarted || agentOnHold) return
    const t = setTimeout(
      () => setAlertQuestionIndex(currentQuestionIndex),
      QUESTION_ALERT_DELAY_SECONDS * 1000
    )
    return () => clearTimeout(t)
  }, [assessmentStarted, agentOnHold, currentQuestionIndex])

  // Only the running question and the next one are shown
  const visibleQuestions = questions
    .slice(currentQuestionIndex, currentQuestionIndex + 2)
    .map((q, offset) => ({
      ...q,
      number: currentQuestionIndex + offset + 1,
      isCurrent: offset === 0,
    }))

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, '0')
    const ss = (s % 60).toString().padStart(2, '0')
    return `${m}:${ss}`
  }

  // Waveform animation
  useEffect(() => {
    if (roomState !== 'waiting') return
    const interval = setInterval(() => {
      setPulseActive((p) => !p)
      setWavePhase((prev) => (prev + 1) % 5)
    }, 700)
    return () => clearInterval(interval)
  }, [roomState])

  const now = new Date()
  const formattedDate = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  const waveBars = [2, 4, 7, 10, 7, 4, 2]

  // Admin initials (current user = admin = M42)
  const adminInitial = yourName.trim() ? yourName.trim()[0].toUpperCase() : 'A'
  // Vendor display name
  const vendorShortName = vendor.name.split(' ').slice(0, 2).join(' ')

  const handleStartAssessment = () => {
    setAssessmentStarted(true)
    setShowTranscript(true)
  }

  const handleHoldToggle = () => {
    if (!assessmentStarted) return
    setAgentOnHold((prev) => !prev)
  }

  const [userRole, setUserRole] = useState<'admin' | 'vendor'>(initialRole)
  const [vendorFlowStep, setVendorFlowStep] = useState<
    'select_role' | 'admin_join' | 'vendor_input' | 'vendor_otp'
  >(initialFlowStep)
  const [adminConsent, setAdminConsent] = useState(false)
  const [vendorConsent, setVendorConsent] = useState(false)
  const [vendorNameInput, setVendorNameInput] = useState('')
  const [vendorEmailInput, setVendorEmailInput] = useState('')
  // Email the vendor already sent a join request for (uninvited emails only)
  const [joinRequestSentFor, setJoinRequestSentFor] = useState<string | null>(null)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', ''])
  const [otpError, setOtpError] = useState('')
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Resend OTP 60-second countdown state
  const [resendTimer, setResendTimer] = useState<number>(60)

  // Countdown timer for Resend OTP (60s)
  useEffect(() => {
    if (vendorFlowStep !== 'vendor_otp') return
    if (resendTimer <= 0) return

    const timer = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [vendorFlowStep, resendTimer])

  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/[^0-9]/g, '').slice(-1)
    const newDigits = [...otpDigits]
    newDigits[index] = digit
    setOtpDigits(newDigits)
    if (otpError) setOtpError('')
    if (digit && index < 3) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  // ─── JOIN SCREEN ──────────────────────────────────────────────────────────────
  if (roomState === 'join') {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#f8fafc] flex flex-col items-center justify-center p-6 overflow-hidden">
        {/* M42 Logo positioned on top left side */}
        <div className="absolute top-8 left-8 sm:top-10 sm:left-12 z-20">
          <Image src="/dark-logo.png" alt="M42" width={84} height={32} className="object-contain" />
        </div>

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-[#ddf7f9]/25 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#e0f2fe]/20 blur-3xl" />
        </div>

        {/* STEP 1: SELECT LOGIN ROLE (SSO vs VENDOR) */}
        {vendorFlowStep === 'select_role' && (
          <div className="relative w-full max-w-[440px]">
            <div className="mb-6 text-center flex flex-col items-center gap-1">
              <span className="text-[10px] font-extrabold tracking-[0.18em] text-[#64748b] uppercase">
                Assessment Call Access
              </span>
              <h1 className="text-2xl font-extrabold text-[#0d212c] leading-tight">
                {vendor.name}
              </h1>
              <p className="text-xs text-[#64748b] font-medium">
                Select your role to enter the call room
              </p>
              {caseId && (
                <span className="text-[11px] font-bold text-[#36c0c9]">Case ID: {caseId}</span>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-xl p-7 flex flex-col gap-4">
              {/* Meeting Details Section */}
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold tracking-wider text-[#64748b] uppercase">
                    Meeting Details
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                      isMeetingStarted
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isMeetingStarted ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                      }`}
                    />
                    {isMeetingStarted ? 'Meeting Started' : 'Scheduled / Not Started'}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 text-xs text-[#0d212c] pt-1 border-t border-[#e2e8f0]/60">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#64748b] shrink-0" />
                    <span className="font-semibold text-[#0d212c]">
                      {scheduleDate || formattedDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#64748b] shrink-0" />
                    <span className="font-semibold text-[#0d212c]">
                      {formattedTimeRange || `${formattedTime} (GST)`}
                    </span>
                  </div>
                </div>

                {!isMeetingStarted && (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] p-2.5 rounded-xl flex items-center justify-between gap-2 mt-1 leading-normal">
                    <span>
                      Meeting has not started yet. Sign in options will unlock once the meeting time
                      begins.
                    </span>
                    <div className="relative group shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsMeetingStarted(true)}
                        className="text-[10px] font-bold text-amber-900 underline hover:text-amber-950 cursor-pointer bg-transparent border-0"
                      >
                        Start Now
                      </button>
                      <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute right-0 bottom-full mb-2 z-50 w-64 bg-[#0d212c] text-white text-[11px] p-2.5 rounded-xl shadow-xl border border-white/10 text-center leading-tight font-normal">
                        This is added for prototype navigation purposes, do not include in final
                        designs.
                      </div>
                    </div>
                  </div>
                )}
                {isMeetingStarted && (
                  <div className="relative group flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsMeetingStarted(false)}
                      className="text-[10px] text-[#64748b] hover:text-[#0d212c] underline cursor-pointer bg-transparent border-0"
                    >
                      Reset to Not Started
                    </button>
                    <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute right-0 bottom-full mb-2 z-50 w-64 bg-[#0d212c] text-white text-[11px] p-2.5 rounded-xl shadow-xl border border-white/10 text-center leading-tight font-normal">
                      This is added for prototype navigation purposes, do not include in final
                      designs.
                    </div>
                  </div>
                )}
              </div>

              <span className="text-xs font-bold text-[#0d212c] mt-1">
                How would you like to sign in?
              </span>

              {/* Login via SSO Button — disabled if meeting is not started */}
              <button
                disabled={!isMeetingStarted}
                onClick={() => {
                  if (!isMeetingStarted) return
                  setUserRole('admin')
                  setYourName(userName || 'Zaid Al Ali')
                  setVendorFlowStep('admin_join')
                }}
                className={`w-full flex items-start gap-3 bg-white border border-[#e2e8f0] rounded-2xl px-4 py-3.5 text-left shadow-2xs transition-all group ${
                  !isMeetingStarted
                    ? 'opacity-40 cursor-not-allowed grayscale-[20%]'
                    : 'hover:shadow-md hover:border-[#36c0c9]/50 cursor-pointer'
                }`}
              >
                <div className="mt-0.5 bg-gray-50 p-2 rounded-xl group-hover:bg-[#36c0c9]/10 transition-colors">
                  <Fingerprint className="w-5 h-5 text-gray-500 group-hover:text-[#36c0c9] transition-colors" />
                </div>
                <div className="mt-0.5">
                  <div className="font-semibold text-sm text-[#0d212c] group-hover:text-[#36c0c9] transition-colors">
                    Sign in with SSO
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Authenticate via your enterprise network
                  </div>
                </div>
              </button>

              {/* Login as a Vendor Button — disabled if meeting is not started */}
              <button
                disabled={!isMeetingStarted}
                onClick={() => {
                  if (!isMeetingStarted) return
                  setUserRole('vendor')
                  setVendorNameInput('')
                  setVendorEmailInput('')
                  setVendorFlowStep('vendor_input')
                }}
                className={`w-full flex items-start gap-3 bg-white border border-[#e2e8f0] rounded-2xl px-4 py-3.5 text-left shadow-2xs transition-all group ${
                  !isMeetingStarted
                    ? 'opacity-40 cursor-not-allowed grayscale-[20%]'
                    : 'hover:shadow-md hover:border-[#36c0c9]/50 cursor-pointer'
                }`}
              >
                <div className="mt-0.5 bg-gray-50 p-2 rounded-xl group-hover:bg-[#36c0c9]/10 transition-colors">
                  <Building2 className="w-5 h-5 text-gray-500 group-hover:text-[#36c0c9] transition-colors" />
                </div>
                <div className="mt-0.5">
                  <div className="font-semibold text-sm text-[#0d212c] group-hover:text-[#36c0c9] transition-colors">
                    Join as a Vendor
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Verify via email OTP to join assessment call
                  </div>
                </div>
              </button>

              <div className="relative group flex justify-center w-full mt-2">
                <button
                  onClick={onBack}
                  className="text-xs text-center text-[#94a3b8] hover:text-[#0d212c] transition cursor-pointer bg-transparent border-0"
                >
                  ← Back to call details
                </button>
                <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 w-64 bg-[#0d212c] text-white text-[11px] p-2.5 rounded-xl shadow-xl border border-white/10 text-center leading-tight font-normal">
                  This is added for prototype navigation purposes, do not include in final designs.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2A: ADMIN JOIN SCREEN */}
        {vendorFlowStep === 'admin_join' && (
          <div className="relative w-full max-w-[420px]">
            <div className="mb-6 text-center flex flex-col items-center gap-1">
              <span className="text-[10px] font-extrabold tracking-[0.18em] text-[#64748b] uppercase">
                Assessment Call · Admin Mode
              </span>
              <h1 className="text-2xl font-extrabold text-[#0d212c] leading-tight">
                {vendor.name}
              </h1>
              <p className="text-xs text-[#64748b] font-medium">{vendor.sublabel}</p>
              {caseId && (
                <span className="text-[11px] font-bold text-[#36c0c9]">Case ID: {caseId}</span>
              )}
            </div>

            <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-xl p-7 flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#36c0c9] animate-pulse inline-block" />
                <span className="text-xs font-semibold text-[#0d212c]">
                  {formattedDate}, <span className="text-[#36c0c9]">{formattedTime}</span>{' '}
                  <span className="text-[#94a3b8] font-normal">(your local time)</span>
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#0d212c]">Your name</label>
                <input
                  id="callroom-name-input"
                  type="text"
                  placeholder="e.g. Zaid Al Ali"
                  value={yourName}
                  onChange={(e) => setYourName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && yourName.trim() && adminConsent)
                      setRoomState('waiting')
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-xs text-[#0d212c] outline-none focus:border-[#36c0c9] transition"
                />
              </div>

              {/* AI Disclosure */}
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 flex flex-col gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0d212c]">
                  AI DISCLOSURE
                </span>
                <p className="text-xs text-[#64748b] leading-relaxed">
                  I am an AI agent — not a human. I am conducting this structured vendor
                  due-diligence assessment on behalf of M42/Malaffi across the relevant domain
                  teams. This call is recorded and transcribed for assessment purposes. No audio and
                  transcript is recorded while the agent is on hold. By joining you consent to
                  recording. AI voice processing is performed by Microsoft Azure outside the UAE as
                  the EU/Sweden are recognised as adequate.
                </p>
              </div>

              {/* Single Consent Checkbox */}
              <div
                onClick={() => setAdminConsent((prev) => !prev)}
                className="flex items-start gap-2.5 cursor-pointer select-none group"
              >
                <div
                  className={`mt-0.5 w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-all border ${
                    adminConsent
                      ? 'bg-[#36c0c9] border-[#36c0c9] shadow-2xs'
                      : 'bg-white border-[#cbd5e1] group-hover:border-[#94a3b8]'
                  }`}
                >
                  {adminConsent && <Check className="w-3 h-3 text-white stroke-[3]" />}
                </div>
                <span className="text-xs text-[#0d212c] font-normal leading-snug">
                  I acknowledge I am speaking with an AI agent conducting this assessment on behalf
                  of M42/Malaffi
                </span>
              </div>

              <button
                id="callroom-join-btn"
                disabled={!yourName.trim() || !adminConsent}
                onClick={() => setRoomState('waiting')}
                className="w-full bg-[#36c0c9] hover:bg-[#2badb6] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm py-3 rounded-lg transition cursor-pointer border-0 shadow-md"
              >
                Open Call Room
              </button>

              {hideChangeRole ? (
                <button
                  onClick={onBack}
                  className="text-xs text-center text-[#94a3b8] hover:text-[#0d212c] transition cursor-pointer bg-transparent border-0 mt-1"
                >
                  ← Back to call details
                </button>
              ) : (
                <button
                  onClick={() => setVendorFlowStep('select_role')}
                  className="text-xs text-center text-[#94a3b8] hover:text-[#0d212c] transition cursor-pointer bg-transparent border-0 mt-1"
                >
                  ← Back to Login Options
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 2B: VENDOR DETAILS SCREEN (Name & Email mandatory, Info icon on email field) */}
        {vendorFlowStep === 'vendor_input' &&
          (() => {
            const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vendorEmailInput.trim())
            const isFormValid = vendorNameInput.trim() !== '' && isEmailValid
            // Emails outside the invite list trigger a join request to the admin
            const isUninvitedEmail =
              isEmailValid && !VENDOR_INVITED_EMAILS.includes(vendorEmailInput.trim().toLowerCase())
            // Shown only once the vendor has acknowledged the AI disclosure
            const needsJoinRequest =
              isUninvitedEmail &&
              vendorConsent &&
              joinRequestSentFor !== vendorEmailInput.trim().toLowerCase()

            return (
              <div className="relative w-full max-w-[420px]">
                <div className="mb-6 text-center flex flex-col items-center gap-1">
                  <h1 className="text-2xl font-extrabold text-[#0d212c] leading-tight">
                    {vendor.name}
                  </h1>
                  <p className="text-xs text-[#64748b] font-medium">Vendor Identity Verification</p>
                  {caseId && (
                    <span className="text-[11px] font-bold text-[#36c0c9]">Case ID: {caseId}</span>
                  )}
                </div>

                <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-xl p-7 flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-[#0d212c]">
                      Vendor Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter vendor name..."
                      value={vendorNameInput}
                      onChange={(e) => setVendorNameInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] text-xs text-[#0d212c] outline-none focus:border-[#36c0c9] transition"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs font-bold text-[#0d212c]">
                        Vendor Email ID <span className="text-red-500">*</span>
                      </label>
                      {/* Info Icon — no bg, grey color */}
                      <div className="relative group cursor-pointer">
                        <Info className="w-3.5 h-3.5 text-[#64748b] hover:text-[#0d212c] transition" />
                        <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute left-1/2 -translate-x-1/2 bottom-6 z-50 w-64 bg-[#0d212c] text-white text-xs p-3 rounded-xl shadow-xl border border-white/10 text-left leading-relaxed font-normal">
                          A 4-digit OTP will be sent to your email for verification.
                        </div>
                      </div>
                      <span className="ml-auto text-[10px] text-[#94a3b8] font-normal">
                        Test email: {VENDOR_INVITED_EMAILS[0]}
                      </span>
                    </div>

                    <input
                      type="email"
                      placeholder="e.g. contact@vendor.com"
                      value={vendorEmailInput}
                      onChange={(e) => setVendorEmailInput(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-[#f8fafc] text-xs text-[#0d212c] outline-none transition ${
                        vendorEmailInput.trim() !== '' && !isEmailValid
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-[#e2e8f0] focus:border-[#36c0c9]'
                      }`}
                    />
                    {vendorEmailInput.trim() !== '' && !isEmailValid && (
                      <p className="text-[11px] text-red-500 font-medium animate-in fade-in duration-150">
                        Please enter a valid email address.
                      </p>
                    )}
                    {isUninvitedEmail && vendorConsent && (
                      <p className="flex items-start gap-1.5 text-[11px] text-red-500 font-medium leading-snug animate-in fade-in duration-150">
                        <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
                        This recipient has not been added to the list, so we have sent a request to
                        the admin. You will be able to join the call once the admin accepts your
                        request.
                      </p>
                    )}
                  </div>

                  {/* AI Disclosure */}
                  <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 flex flex-col gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0d212c]">
                      AI DISCLOSURE
                    </span>
                    <p className="text-xs text-[#64748b] leading-relaxed">
                      I am an AI agent — not a human. I am conducting this structured vendor
                      due-diligence assessment on behalf of M42/Malaffi across the relevant domain
                      teams. This call is recorded and transcribed for assessment purposes. No audio
                      and transcript is recorded while the agent is on hold. By joining you consent
                      to recording. AI voice processing is performed by Microsoft Azure outside the
                      UAE as the EU/Sweden are recognised as adequate.
                    </p>
                  </div>

                  {/* Single Consent Checkbox */}
                  <div
                    onClick={() => setVendorConsent((prev) => !prev)}
                    className="flex items-start gap-2.5 cursor-pointer select-none group"
                  >
                    <div
                      className={`mt-0.5 w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-all border ${
                        vendorConsent
                          ? 'bg-[#36c0c9] border-[#36c0c9] shadow-2xs'
                          : 'bg-white border-[#cbd5e1] group-hover:border-[#94a3b8]'
                      }`}
                    >
                      {vendorConsent && <Check className="w-3 h-3 text-white stroke-[3]" />}
                    </div>
                    <span className="text-xs text-[#0d212c] font-normal leading-snug">
                      I acknowledge I am speaking with an AI agent conducting this assessment on
                      behalf of M42/Malaffi
                    </span>
                  </div>

                  <button
                    id="vendor-send-otp-btn"
                    disabled={!isFormValid || !vendorConsent}
                    onClick={() => {
                      // Uninvited emails first send a join request to the admin
                      if (needsJoinRequest) {
                        setJoinRequestSentFor(vendorEmailInput.trim().toLowerCase())
                        return
                      }
                      setOtpDigits(['', '', '', ''])
                      setOtpError('')
                      setResendTimer(60)
                      setVendorFlowStep('vendor_otp')
                    }}
                    className="w-full bg-[#36c0c9] hover:bg-[#2badb6] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm py-3 rounded-lg transition cursor-pointer border-0 shadow-md mt-1"
                  >
                    {needsJoinRequest ? 'Send join request' : 'Send OTP'}
                  </button>

                  <button
                    onClick={() => setVendorFlowStep('select_role')}
                    className="text-xs text-center text-[#94a3b8] hover:text-[#0d212c] transition cursor-pointer bg-transparent border-0"
                  >
                    ← Back to Login Options
                  </button>
                </div>
              </div>
            )
          })()}

        {/* STEP 2C: 4-BLOCK OTP VERIFICATION SCREEN (Clean Header, 4 Blocks, Error State) */}
        {vendorFlowStep === 'vendor_otp' && (
          <div className="relative w-full max-w-[420px]">
            <div className="mb-6 text-center flex flex-col items-center gap-1">
              <h1 className="text-2xl font-extrabold text-[#0d212c] leading-tight">
                Enter OTP Code
              </h1>
              <p className="text-xs text-[#64748b] font-medium">
                OTP sent to <span className="font-semibold text-[#0d212c]">{vendorEmailInput}</span>
                <span className="inline-block mx-1.5 text-gray-300">•</span>
                <span className="text-[#0d7280] font-semibold">Valid for 5 minutes</span>
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-xl p-7 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#0d212c]">
                  4-Digit Verification Code
                </label>
                <span className="text-[10px] text-[#0d7280] font-extrabold bg-[#ddf7f9] px-2 py-0.5 rounded-md border border-[#36c0c9]/30">
                  Demo OTP: 1234
                </span>
              </div>

              {/* 4 Separate Digit Input Blocks */}
              <div className="flex items-center justify-center gap-3 my-2">
                {[0, 1, 2, 3].map((index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      otpRefs.current[index] = el
                    }}
                    type="text"
                    maxLength={1}
                    value={otpDigits[index] || ''}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className={`w-12 h-14 rounded-xl border text-center text-xl font-extrabold text-[#0d212c] outline-none transition ${
                      otpError
                        ? 'border-red-500 bg-red-50/50 focus:border-red-600'
                        : 'border-[#e2e8f0] bg-[#f8fafc] focus:border-[#36c0c9]'
                    }`}
                  />
                ))}
              </div>

              {/* Error Message display */}
              {otpError && (
                <p className="text-xs text-red-600 font-semibold text-center animate-in fade-in duration-150">
                  {otpError}
                </p>
              )}

              {/* Don't get the code? Resend OTP with 60-second countdown */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-[#64748b] my-0.5">
                <span>Don&apos;t get the code?</span>
                {resendTimer > 0 ? (
                  <span className="font-semibold text-[#94a3b8] cursor-not-allowed">
                    Resend OTP ({resendTimer}s)
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setOtpDigits(['', '', '', ''])
                      setOtpError('')
                      setResendTimer(60)
                    }}
                    className="font-bold text-[#36c0c9] hover:text-[#2badb6] transition cursor-pointer bg-transparent border-0 p-0 underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <p className="text-[11px] text-[#64748b] leading-relaxed text-center">
                Enter the 4-digit code to complete verification and enter the assessment call room.{' '}
                <span className="font-semibold text-[#0d212c]">
                  Note: This OTP is valid for 5 minutes only.
                </span>
              </p>

              <button
                id="vendor-verify-otp-btn"
                onClick={() => {
                  const code = otpDigits.join('')
                  if (code.length < 4 || code !== '1234') {
                    setOtpError('Invalid OTP entered. Please try again.')
                    return
                  }
                  setYourName(vendorNameInput.trim() || vendor.name)
                  setUserRole('vendor')
                  setRoomState('waiting')
                }}
                className="w-full bg-[#36c0c9] hover:bg-[#2badb6] text-white font-bold text-sm py-3 rounded-lg transition cursor-pointer border-0 shadow-md"
              >
                Verify &amp; Enter Call Room
              </button>

              <button
                onClick={() => setVendorFlowStep('vendor_input')}
                className="text-xs text-center text-[#94a3b8] hover:text-[#0d212c] transition cursor-pointer bg-transparent border-0 mt-1"
              >
                ← Back to call details
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── FINALISED SCREEN ─────────────────────────────────────────────────────────
  if (roomState === 'finalised') {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#f8fafc] flex flex-col items-center justify-center p-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-[#ddf7f9]/20 blur-3xl" />
        </div>

        <div className="relative bg-white rounded-3xl border border-[#e2e8f0] shadow-xl p-8 max-w-md w-full flex flex-col gap-5">
          <div className="flex flex-col items-center text-center gap-3">
            <Image
              src="/dark-logo.png"
              alt="M42"
              width={72}
              height={28}
              className="object-contain"
            />
            <div className="w-12 h-12 rounded-full bg-[#ddf7f9] flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-[#0d7280]" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-extrabold text-[#0d212c]">Assessment finalised</h2>
              <p className="text-xs text-[#64748b] leading-relaxed">
                The call has ended for all participants. The transcript and audit log have been
                saved.
              </p>
            </div>
          </div>

          {/* Transcript preview */}
          <div className="bg-[#f8fafc] rounded-2xl border border-[#e2e8f0] p-4 flex flex-col gap-3 max-h-[260px] overflow-y-auto">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748b]">
              Call Transcript
            </span>
            {sampleTranscript.map((entry, idx) => (
              <div key={idx} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-extrabold ${entry.speaker === 'Sam' ? 'text-[#0d7280]' : 'text-[#0d212c]'}`}
                  >
                    {entry.speaker}
                  </span>
                  <span className="text-[9px] text-[#94a3b8]">{entry.time}</span>
                </div>
                <p className="text-xs text-[#0d212c] leading-relaxed">{entry.text}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {userRole === 'admin' && (
              <>
                <button
                  id="callroom-download-transcript-btn"
                  onClick={() => alert('Downloading transcript...')}
                  className="w-full bg-[#0d212c] hover:bg-[#122e3d] text-white font-bold text-xs py-3 rounded-lg transition cursor-pointer border-0 flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Download transcript
                </button>

                <button
                  onClick={() => {
                    if (onExitToVendors) onExitToVendors()
                    else onBack()
                  }}
                  className="w-full bg-transparent hover:bg-slate-100 text-[#64748b] hover:text-[#0d212c] font-semibold text-xs py-2.5 rounded-lg transition cursor-pointer border-0"
                >
                  Back to vendors
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── LEFT CALL SCREEN ─────────────────────────────────────────────────────────
  if (roomState === 'left') {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#f8fafc] flex flex-col items-center justify-center p-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-[#ddf7f9]/20 blur-3xl" />
        </div>

        <div className="relative bg-white rounded-3xl border border-[#e2e8f0] shadow-xl p-10 max-w-sm w-full flex flex-col items-center gap-6 text-center">
          <Image src="/dark-logo.png" alt="M42" width={72} height={28} className="object-contain" />
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-extrabold text-[#0d212c]">You have left the meeting</h2>
            <p className="text-xs text-[#64748b] leading-relaxed">
              Do you want to rejoin the assessment session?
            </p>
          </div>

          <div className="w-full flex flex-col gap-2.5 mt-2">
            {/* Rejoin call — primary dark color (#0d212c) with white text */}
            <button
              id="callroom-rejoin-btn"
              onClick={() => {
                setShowLeaveConfirm(false)
                if (userRole === 'vendor') {
                  setVendorNameInput('')
                  setVendorEmailInput('')
                  setOtpDigits(['', '', '', ''])
                  setOtpError('')
                  setVendorFlowStep('vendor_input')
                  setRoomState('join')
                } else {
                  setRoomState('waiting')
                }
              }}
              className="w-full bg-[#0d212c] hover:bg-[#122e3d] text-white border-0 font-bold text-xs py-3 rounded-lg transition cursor-pointer shadow-xs"
            >
              Rejoin call
            </button>

            {/* Back to vendors — only shown for Admin users */}
            {userRole === 'admin' && (
              <button
                onClick={() => {
                  if (onExitToVendors) {
                    onExitToVendors()
                  } else {
                    onBack()
                  }
                }}
                className="w-full bg-transparent hover:bg-slate-100 text-[#64748b] hover:text-[#0d212c] font-semibold text-xs py-2.5 rounded-lg transition cursor-pointer border-0"
              >
                Back to vendors
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── IN-CALL ROOM ─────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[9999] bg-[#f8fafc] flex flex-col overflow-hidden">
      {/* Leave Confirmation Popup */}
      {showLeaveConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#0d212c]/40 backdrop-blur-xs"
            onClick={() => setShowLeaveConfirm(false)}
          />
          <div className="relative bg-white rounded-3xl border border-[#e2e8f0] shadow-2xl p-8 sm:p-10 max-w-lg w-full flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-150 min-h-[220px] justify-center z-10">
            <button
              type="button"
              onClick={() => setShowLeaveConfirm(false)}
              className="absolute top-5 right-5 text-[#94a3b8] hover:text-[#0d212c] transition cursor-pointer border-0 bg-transparent p-0"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100 shadow-2xs">
              <DoorOpen className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-extrabold text-[#0d212c]">Leave the call?</h3>
              <p className="text-xs text-[#64748b] leading-relaxed max-w-md">
                You will leave the active audio room session. You can rejoin with the same link
                while the call is live.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full mt-2">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0d212c] font-bold text-xs py-3 rounded-lg transition cursor-pointer border-0"
              >
                Stay in call
              </button>
              <button
                onClick={() => {
                  setShowLeaveConfirm(false)
                  setRoomState('left')
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-3 rounded-lg transition cursor-pointer border-0 shadow-2xs"
              >
                Leave call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End & Finalise Confirmation Popup */}
      {showFinaliseConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#0d212c]/40 backdrop-blur-xs"
            onClick={() => setShowFinaliseConfirm(false)}
          />
          <div className="relative bg-white rounded-3xl border border-[#e2e8f0] shadow-2xl p-8 sm:p-10 max-w-lg w-full flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-150 min-h-[240px] justify-center z-10">
            <button
              type="button"
              onClick={() => setShowFinaliseConfirm(false)}
              className="absolute top-5 right-5 text-[#94a3b8] hover:text-[#0d212c] transition cursor-pointer border-0 bg-transparent p-0"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-[#ddf7f9] text-[#0d7280] flex items-center justify-center border border-[#b2ecf2] shadow-2xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-extrabold text-[#0d212c]">End & Finalise Assessment?</h3>
              <p className="text-xs text-[#64748b] leading-relaxed max-w-md">
                This will end the live call for all participants and mark the assessment as
                complete. The audit log and call transcript will be saved. This action cannot be
                undone.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full mt-2">
              <button
                onClick={() => setShowFinaliseConfirm(false)}
                className="flex-1 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0d212c] font-bold text-xs py-3 rounded-lg transition cursor-pointer border-0"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowFinaliseConfirm(false)
                  setRoomState('finalised')
                }}
                className="flex-1 bg-[#0d212c] hover:bg-[#122e3d] text-white font-bold text-xs py-3 rounded-lg transition cursor-pointer border-0 shadow-2xs"
              >
                End & Finalise
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOP BAR ──────────────────────────────────────────────────────────────── */}
      <div className="h-[52px] bg-white border-b border-[#e2e8f0] flex items-center justify-between px-5 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <Image src="/dark-logo.png" alt="M42" width={56} height={22} className="object-contain" />
          <div className="w-px h-5 bg-[#e2e8f0]" />
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-bold text-[#0d212c] truncate max-w-[220px]">
              {vendor.name}
            </span>
            <span className="text-[10px] text-[#64748b] truncate max-w-[220px]">
              {caseId ? `${caseId} · ${vendor.sublabel}` : vendor.sublabel}
            </span>
          </div>
        </div>

        {assessmentStarted ? (
          <span className="inline-flex items-center gap-2 bg-[#dcfce7] text-[#15803d] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wide border border-[#bbf7d0]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse inline-block" />
            Live · {formatElapsed(elapsedSeconds)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 bg-[#fef3c7] text-[#92400e] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wide border border-[#fde68a]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse inline-block" />
            Waiting to start
          </span>
        )}
      </div>

      {/* ── MAIN BODY ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 relative">
        {/* ── STAGE ──────────────────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col min-h-0 relative bg-[#f8fafc]">
          {/* Background blob */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/3 left-1/3 w-80 h-80 rounded-full bg-[#ddf7f9]/20 blur-3xl" />
          </div>

          {/* ── CENTER STAGE ─────────────────────────────────────────────────────── */}
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center-safe gap-5 px-4 sm:px-8 py-4 relative z-0">
            {/* AI Assessor Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div
                  className={`absolute inset-0 rounded-full border-2 border-[#36c0c9]/25 transition-all duration-700 ${pulseActive ? 'scale-[1.18] opacity-100' : 'scale-100 opacity-0'}`}
                />
                <div
                  className={`absolute inset-0 rounded-full border border-[#36c0c9]/15 transition-all duration-700 delay-200 ${pulseActive ? 'scale-[1.35] opacity-100' : 'scale-105 opacity-0'}`}
                />
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#ddf7f9] to-[#b2eff4] border-2 border-[#36c0c9]/40 flex flex-col items-center justify-center gap-1.5 relative z-10 shadow-md">
                  <div className="flex items-end gap-[2.5px] h-5">
                    {waveBars.map((baseH, i) => (
                      <div
                        key={i}
                        className="w-[3px] rounded-full bg-[#36c0c9] transition-all duration-300"
                        style={{
                          height: `${(baseH + ((wavePhase + i) % 5) * 1.5) * (agentOnHold ? 0.6 : 1.5)}px`,
                          transitionDelay: `${i * 60}ms`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[8px] font-extrabold text-[#0ea5e9] tracking-widest uppercase">
                    AI Assessor
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-sm font-extrabold text-[#0d212c]">Sam</span>
                <span className="text-xs text-[#64748b]">
                  {agentOnHold
                    ? 'Sam is on hold'
                    : assessmentStarted
                      ? 'Sam is listening'
                      : 'Sam is here, waiting for M42 to start the assessment'}
                </span>
              </div>
            </div>

            {/* Question progress: current question and the upcoming one */}
            {userRole === 'admin' && assessmentStarted && visibleQuestions.length > 0 && (
              <div className="w-full max-w-xl flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {visibleQuestions.map((q) => (
                  <div
                    key={q.id}
                    className={`bg-white rounded-2xl border px-5 py-4 flex items-center gap-4 shadow-2xs transition ${
                      q.isCurrent ? 'border-[#36c0c9]/50' : 'border-[#e2e8f0]'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#e6f7f8] text-[#36c0c9] text-sm font-bold flex items-center justify-center shrink-0">
                      {q.number}
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                      <span className="text-sm font-bold text-[#0d212c]">{q.question}</span>
                      {q.responseCue && (
                        <div className="relative group/cue">
                          <p className="text-xs text-[#64748b] leading-relaxed line-clamp-2">
                            <span className="font-semibold text-[#0d212c]">Response cue:</span>{' '}
                            {q.responseCue}
                          </p>
                          <div className="pointer-events-none opacity-0 group-hover/cue:opacity-100 transition-opacity duration-200 absolute left-0 right-0 top-full mt-1 z-30 bg-[#0d212c] text-white text-xs p-3 rounded-xl shadow-xl border border-white/10 leading-relaxed font-normal">
                            {q.responseCue}
                          </div>
                        </div>
                      )}
                      {q.isCurrent &&
                        alertQuestionIndex === currentQuestionIndex &&
                        (currentQuestionIndex % 2 === 0 ? (
                          <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#b06000] animate-in fade-in duration-300">
                            <FileSearch className="w-3.5 h-3.5 shrink-0" />
                            Background research: the vendor&apos;s claim could not be verified from
                            public sources
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#d92d20] animate-in fade-in duration-300">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                            Guardrail violation: personal data shared by the vendor was redacted
                          </span>
                        ))}
                    </div>
                    <span
                      className={`shrink-0 px-3 py-1 rounded-full border text-[11px] font-semibold ${
                        q.isCurrent
                          ? 'bg-[#f0fbfc] border-[#bdeaee] text-[#0f7f8c]'
                          : 'bg-white border-[#e2e8f0] text-[#64748b]'
                      }`}
                    >
                      {q.isCurrent ? 'In progress' : 'Up next'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* START ASSESSMENT CTA — only before assessment starts */}
            {!assessmentStarted && (
              <button
                id="callroom-start-assessment-btn"
                onClick={handleStartAssessment}
                className="bg-[#36c0c9] hover:bg-[#2badb6] text-white font-bold text-sm px-8 py-3 rounded-lg transition cursor-pointer border-0 shadow-md flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <PlayCircle className="w-4 h-4" />
                Start Assessment
              </button>
            )}
          </div>

          {/* ── PARTICIPANT TILES — bottom-right, Teams style Light Theme ────────────────────── */}
          <div className="order-first shrink-0 self-center max-w-full overflow-x-auto relative z-10 flex flex-row gap-2.5 px-4 pt-4 pb-1">
            {/* Participant 1: Alex */}
            <div className="w-32 h-[124px] shrink-0 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm flex flex-col items-center justify-center gap-1 relative overflow-hidden p-2">
              <div className="w-9 h-9 rounded-full bg-[#f1f5f9] border border-[#cbd5e1] flex items-center justify-center text-[#0d212c] font-bold text-sm shadow-2xs">
                A
              </div>
              <span className="text-[10px] font-bold text-[#0d212c] truncate max-w-[110px] px-1 text-center">
                Alex Smith
              </span>
              <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-1.5 py-0.5">
                <Mic className="w-2.5 h-2.5 text-[#64748b]" strokeWidth={1} />
                <span className="text-[8px] font-semibold text-[#64748b]">Vendor</span>
              </div>
            </div>

            {/* Participant 2: Sarah */}
            <div className="w-32 h-[124px] shrink-0 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm flex flex-col items-center justify-center gap-1 relative overflow-hidden p-2">
              <div className="w-9 h-9 rounded-full bg-[#f1f5f9] border border-[#cbd5e1] flex items-center justify-center text-[#0d212c] font-bold text-sm shadow-2xs">
                S
              </div>
              <span className="text-[10px] font-bold text-[#0d212c] truncate max-w-[110px] px-1 text-center">
                Sarah Jones
              </span>
              <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-1.5 py-0.5">
                <Mic className="w-2.5 h-2.5 text-[#64748b]" strokeWidth={1} />
                <span className="text-[8px] font-semibold text-[#64748b]">Vendor</span>
              </div>
            </div>

            {/* Participant 3: Michael */}
            <div className="w-32 h-[124px] shrink-0 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm flex flex-col items-center justify-center gap-1 relative overflow-hidden p-2">
              <div className="w-9 h-9 rounded-full bg-[#36c0c9] text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                M
              </div>
              <span className="text-[10px] font-bold text-[#0d212c] truncate max-w-[110px] px-1 text-center">
                Michael Chen
              </span>
              <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md px-1.5 py-0.5 border bg-[#f1f5f9] border-[#e2e8f0] text-[#64748b]">
                <Mic className="w-2.5 h-2.5 text-[#64748b]" strokeWidth={1} />
                <span className="text-[8px] font-semibold">M42</span>
              </div>
            </div>

            {/* Participant 4: Emma */}
            <div className="w-32 h-[124px] shrink-0 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm flex flex-col items-center justify-center gap-1 relative overflow-hidden p-2">
              <div className="w-9 h-9 rounded-full bg-[#36c0c9] text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                E
              </div>
              <span className="text-[10px] font-bold text-[#0d212c] truncate max-w-[110px] px-1 text-center">
                Emma Wilson
              </span>
              <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md px-1.5 py-0.5 border bg-[#f1f5f9] border-[#e2e8f0] text-[#64748b]">
                <Mic className="w-2.5 h-2.5 text-[#64748b]" strokeWidth={1} />
                <span className="text-[8px] font-semibold">M42</span>
              </div>
            </div>

            {/* Participant 5: Vendor */}
            <div className="w-32 h-[124px] shrink-0 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm flex flex-col items-center justify-center gap-1 relative overflow-hidden p-2">
              <div className="w-9 h-9 rounded-full bg-[#f1f5f9] border border-[#cbd5e1] flex items-center justify-center text-[#0d212c] font-bold text-sm shadow-2xs">
                {vendorShortName ? vendorShortName[0].toUpperCase() : 'V'}
              </div>
              <span className="text-[10px] font-bold text-[#0d212c] truncate max-w-[110px] px-1 text-center">
                {vendorShortName}
              </span>
              <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-[#f1f5f9] border border-[#e2e8f0] rounded-md px-1.5 py-0.5">
                <Mic className="w-2.5 h-2.5 text-[#64748b]" strokeWidth={1} />
                <span className="text-[8px] font-semibold text-[#64748b]">Vendor</span>
              </div>
            </div>

            {/* Participant 6: Admin */}
            <div className="w-32 h-[124px] shrink-0 rounded-2xl bg-white border border-[#e2e8f0] shadow-sm flex flex-col items-center justify-center gap-1 relative overflow-hidden p-2">
              <div className="w-9 h-9 rounded-full bg-[#36c0c9] text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                {adminInitial}
              </div>
              <span className="text-[10px] font-bold text-[#0d212c] truncate max-w-[110px] px-1 text-center">
                {yourName.trim() || 'Admin'}{' '}
                <span className="text-[#36c0c9] font-extrabold">(you)</span>
              </span>
              {/* Mic badge */}
              <div
                className={`absolute bottom-2 left-2 flex items-center gap-1 rounded-md px-1.5 py-0.5 border ${
                  isMuted
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-[#f1f5f9] border-[#e2e8f0] text-[#64748b]'
                }`}
              >
                {isMuted ? (
                  <MicOff className="w-2.5 h-2.5 text-red-600" strokeWidth={1} />
                ) : (
                  <Mic className="w-2.5 h-2.5 text-[#64748b]" strokeWidth={1} />
                )}
                <span className="text-[8px] font-semibold">M42</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── LIVE TRANSCRIPT PANEL ─────────── */}
        {assessmentStarted && (
          <div
            className={`absolute top-0 right-0 bottom-0 w-[300px] border-l border-[#e2e8f0] bg-white flex flex-col shrink-0 min-h-0 z-20 transition-transform duration-500 ease-in-out ${
              showTranscript
                ? 'translate-x-0 pointer-events-auto animate-in slide-in-from-right'
                : 'translate-x-full pointer-events-none'
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#e2e8f0] shrink-0">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0d212c]">
                Live Transcript
              </span>
              <div className="flex items-center gap-2">
                <button className="text-[10px] font-semibold text-[#64748b] hover:text-[#0d212c] transition cursor-pointer bg-transparent border-0">
                  Copy
                </button>
                <button
                  onClick={() => setShowTranscript(false)}
                  className="text-[10px] font-semibold text-[#64748b] hover:text-[#0d212c] transition cursor-pointer bg-transparent border-0"
                >
                  Hide
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 min-h-0">
              {sampleTranscript.map((entry, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-extrabold ${entry.speaker === 'Sam' ? 'text-[#36c0c9]' : 'text-[#0d212c]'}`}
                    >
                      {entry.speaker === 'Sam' ? 'Sam (AI)' : yourName.trim() || 'Vendor'}
                    </span>
                    <span className="text-[9px] text-[#94a3b8]">{entry.time}</span>
                  </div>
                  <p className="text-[11px] text-[#475569] leading-relaxed">{entry.text}</p>
                </div>
              ))}

              {/* Uploaded Documents List in Chat Room */}
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-3 rounded-2xl bg-[#ddf7f9]/20 border border-[#36c0c9]/40 flex flex-col gap-2 shadow-2xs animate-in fade-in zoom-in-95 duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-[#0d212c] truncate">
                      {file.sender}
                    </span>
                    <span className="text-[9px] text-[#94a3b8] shrink-0">{file.time}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2.5 bg-white p-2.5 rounded-xl border border-[#e2e8f0]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#ddf7f9] text-[#36c0c9] flex items-center justify-center shrink-0 font-extrabold text-[10px]">
                        {file.type}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span
                          className="text-xs font-bold text-[#0d212c] truncate"
                          title={file.name}
                        >
                          {file.name}
                        </span>
                        <span className="text-[10px] text-[#64748b]">{file.size}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const element = document.createElement('a')
                          const fileBlob = new Blob([`Sample content for ${file.name}`], {
                            type: 'text/plain',
                          })
                          element.href = URL.createObjectURL(fileBlob)
                          element.download = file.name
                          document.body.appendChild(element)
                          element.click()
                          document.body.removeChild(element)
                        }}
                        title={`Download ${file.name}`}
                        className="p-1 rounded text-[#64748b] border-0 bg-transparent cursor-pointer flex items-center justify-center shrink-0 outline-none focus:outline-none active:bg-transparent"
                      >
                        <Download className="w-3.5 h-3.5 fill-none stroke-current" />
                      </button>
                      <div className="w-5 h-5 rounded-full bg-[#137333]/10 text-[#137333] flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-[#137333]" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Live typing dots */}
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold text-[#36c0c9]">Sam (AI)</span>
                  <span className="text-[9px] text-[#94a3b8]">now</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[#36c0c9] animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM TOOLBAR ───────────────────────────────────────────────────────── */}
      <div className="bg-white border-t border-[#e2e8f0] flex items-center justify-center gap-3 shrink-0 shadow-sm px-6 py-3">
        {/* Mute — always active */}
        <div className="flex flex-col items-center gap-0.5">
          <button
            id="callroom-mute-btn"
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute' : 'Mute'}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition cursor-pointer border-0 shadow-sm ${isMuted ? 'bg-[#ddf7f9] text-[#36c0c9] hover:bg-[#b2eff4]' : 'bg-[#f1f5f9] text-[#334155] hover:bg-[#e2e8f0]'}`}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <span className="text-[9px] text-[#94a3b8] font-medium">
            {isMuted ? 'Unmute' : 'Mute'}
          </span>
        </div>

        {/* Upload — disabled until assessment starts */}
        <div className="flex flex-col items-center gap-0.5 relative group">
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
          <button
            id="callroom-upload-btn"
            disabled={!assessmentStarted}
            onClick={() => assessmentStarted && fileInputRef.current?.click()}
            title={assessmentStarted ? 'Upload document' : 'Available after assessment starts'}
            className={`w-10 h-10 rounded-full flex items-center justify-center border-0 shadow-sm transition ${assessmentStarted ? 'bg-[#f1f5f9] text-[#334155] hover:bg-[#e2e8f0] cursor-pointer' : 'bg-[#f1f5f9] text-[#cbd5e1] cursor-not-allowed opacity-50'}`}
          >
            <MonitorUp className="w-4 h-4" />
          </button>
          <span className="text-[9px] text-[#94a3b8] font-medium">Upload</span>
          {!assessmentStarted && (
            <div className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#0d212c] text-white text-[10px] font-medium px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
              Start assessment to upload
            </div>
          )}
        </div>

        {/* Transcript toggle — disabled until assessment starts */}
        <div className="flex flex-col items-center gap-0.5 relative group">
          <button
            id="callroom-transcript-btn"
            onClick={() => assessmentStarted && setShowTranscript(!showTranscript)}
            disabled={!assessmentStarted}
            title={assessmentStarted ? 'Toggle transcript' : 'Available after assessment starts'}
            className={`w-10 h-10 rounded-full flex items-center justify-center border-0 shadow-sm transition ${!assessmentStarted ? 'bg-[#f1f5f9] text-[#cbd5e1] cursor-not-allowed opacity-50' : showTranscript ? 'bg-[#36c0c9] text-white hover:bg-[#2badb6] cursor-pointer' : 'bg-[#f1f5f9] text-[#334155] hover:bg-[#e2e8f0] cursor-pointer'}`}
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <span className="text-[9px] text-[#94a3b8] font-medium">Transcript</span>
          {!assessmentStarted && (
            <div className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#0d212c] text-white text-[10px] font-medium px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
              Start assessment first
            </div>
          )}
        </div>

        {/* Hold Agent — disabled until assessment starts */}
        <div className="flex flex-col items-center gap-0.5 relative group/hold">
          <div className="relative">
            <button
              id="callroom-hold-btn"
              onClick={handleHoldToggle}
              disabled={!assessmentStarted}
              title={agentOnHold ? 'Resume Sam' : 'Hold Agent'}
              className={`w-10 h-10 rounded-full flex items-center justify-center border-0 shadow-sm transition ${!assessmentStarted ? 'bg-[#f1f5f9] text-[#cbd5e1] cursor-not-allowed opacity-50' : agentOnHold ? 'bg-[#ddf7f9] text-[#36c0c9] hover:bg-[#b2eff4] cursor-pointer' : 'bg-[#f1f5f9] text-[#334155] hover:bg-[#e2e8f0] cursor-pointer'}`}
            >
              {agentOnHold ? (
                <PlayCircle className="w-4 h-4" />
              ) : (
                <PauseCircle className="w-4 h-4" />
              )}
            </button>

            {/* Hold active — persistent white tooltip above button */}
            {agentOnHold && (
              <div className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 bg-white border border-[#e2e8f0] shadow-xl rounded-xl px-3.5 py-2.5 w-56 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse inline-block" />
                  <p className="text-xs font-extrabold text-[#0d212c]">Resume Sam</p>
                </div>
                <p className="text-[10px] text-[#64748b] leading-relaxed">
                  Sam is paused and stopped from speaking. Press to resume.
                </p>
                {/* Tooltip arrow */}
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-white border-r border-b border-[#e2e8f0] rotate-45" />
              </div>
            )}

            {/* Disabled tooltip */}
            {!assessmentStarted && (
              <div className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#0d212c] text-white text-[10px] font-medium px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover/hold:opacity-100 transition-opacity duration-150 z-50">
                Start assessment first
              </div>
            )}
          </div>
          <span className="text-[9px] text-[#94a3b8] font-medium">
            {agentOnHold ? 'Resume Sam' : 'Hold Agent'}
          </span>
        </div>

        {/* End & Finalise — only visible for admin role */}
        {userRole === 'admin' && (
          <>
            {/* Divider */}
            <div className="w-px h-8 bg-[#e2e8f0] mx-1" />

            <div className="flex flex-col items-center gap-0.5 relative group">
              <div className="relative">
                <button
                  id="callroom-finalise-btn"
                  onClick={() => assessmentStarted && setShowFinaliseConfirm(true)}
                  disabled={!assessmentStarted}
                  title={
                    assessmentStarted
                      ? 'End and finalise assessment'
                      : 'Available after assessment starts'
                  }
                  className={`h-10 px-4 rounded-full flex items-center justify-center gap-1.5 transition border-0 font-bold text-xs shadow-sm ${
                    assessmentStarted
                      ? 'bg-[#ddf7f9] hover:bg-[#b2eff4] text-[#0d7280] border border-[#36c0c9]/30 cursor-pointer'
                      : 'bg-[#f1f5f9] text-[#cbd5e1] cursor-not-allowed opacity-50'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>End &amp; Finalise</span>
                </button>

                {/* Tooltip */}
                <div className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#0d212c] text-white text-[10px] font-medium px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                  {!assessmentStarted ? 'Start assessment first' : 'End and finalise assessment'}
                </div>
              </div>
              <span className="text-[9px] text-[#94a3b8] font-medium">Finalise</span>
            </div>
          </>
        )}

        {/* Leave — no tooltip, visible to vendor too */}
        <div className="flex flex-col items-center gap-0.5">
          <button
            id="callroom-leave-btn"
            onClick={() => setShowLeaveConfirm(true)}
            title="Leave call"
            className="h-10 px-4 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-1.5 transition cursor-pointer border-0 shadow-md font-bold text-xs"
          >
            <DoorOpen className="w-3.5 h-3.5" />
            <span>Leave</span>
          </button>
          <span className="text-[9px] text-[#94a3b8] font-medium">Leave</span>
        </div>
      </div>

      {/* Recording notice */}
      {assessmentStarted && (
        <div className="bg-white border-t border-[#e2e8f0] flex items-center justify-center py-1 shrink-0">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#94a3b8]">
            Recording and transcription in progress
          </span>
        </div>
      )}
    </div>
  )
}
