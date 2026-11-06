'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Info } from 'lucide-react'

interface VendorAccessGateProps {
  vendorName: string
  caseId: string
  onVerified: (vendor: { name: string; email: string }) => void
}

// Recipient list for the follow-up email. The test email is for the prototype only.
const RECIPIENT_EMAILS = ['zaidm42@gmail.com']
const DEMO_OTP = '1234'
const OTP_LENGTH = 4
const RESEND_SECONDS = 60

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const FIELD =
  'w-full px-3.5 py-2.5 rounded-md border bg-[#f8fafc] text-xs text-[#0d212c] outline-none transition placeholder:text-[#94a3b8]'

const PROTOTYPE_TIP = 'pointer-events-none opacity-0 group-hover:opacity-100'

export const VendorAccessGate: React.FC<VendorAccessGateProps> = ({
  vendorName,
  caseId,
  onVerified,
}) => {
  const [step, setStep] = useState<'details' | 'otp'>('details')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [otpError, setOtpError] = useState('')
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (step !== 'otp' || resendTimer <= 0) return
    const t = setInterval(() => setResendTimer((s) => Math.max(s - 1, 0)), 1000)
    return () => clearInterval(t)
  }, [step, resendTimer])

  const sendOtp = () => {
    const value = email.trim().toLowerCase()
    if (!EMAIL_PATTERN.test(value)) {
      setEmailError('Please enter a valid email ID.')
      return
    }
    if (!RECIPIENT_EMAILS.includes(value)) {
      setEmailError(
        'This email ID is not added to the recipient list, so you cannot access the evidence form. Please enter a valid email ID.'
      )
      return
    }
    setDigits(Array(OTP_LENGTH).fill(''))
    setOtpError('')
    setResendTimer(RESEND_SECONDS)
    setStep('otp')
  }

  const verifyOtp = () => {
    if (digits.join('') !== DEMO_OTP) {
      setOtpError('Invalid OTP entered. Please try again.')
      return
    }
    onVerified({ name: name.trim(), email: email.trim() })
  }

  const changeDigit = (index: number, raw: string) => {
    const digit = raw.replace(/[^0-9]/g, '').slice(-1)
    setDigits((prev) => prev.map((d, i) => (i === index ? digit : d)))
    if (otpError) setOtpError('')
    if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus()
  }

  const digitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) otpRefs.current[index - 1]?.focus()
  }

  const canSend = name.trim() !== '' && email.trim() !== ''

  return (
    <div className="fixed inset-0 z-[9999] bg-[#f8fafc] flex flex-col items-center justify-center p-6 overflow-hidden">
      <div className="absolute top-8 left-8 sm:top-10 sm:left-12 z-20">
        <img src="/dark-logo.png" alt="M42" className="h-8 w-auto object-contain" />
      </div>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-[#ddf7f9]/25 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#e0f2fe]/20 blur-3xl" />
      </div>

      {step === 'details' ? (
        <div className="relative w-full max-w-[420px]">
          <div className="mb-6 text-center flex flex-col items-center gap-1">
            <h1 className="text-2xl font-extrabold text-[#0d212c] leading-tight">{vendorName}</h1>
            <p className="text-xs text-[#64748b] font-medium">Vendor Identity Verification</p>
            <span className="text-[11px] font-bold text-[#36c0c9]">Case ID: {caseId}</span>
          </div>

          <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-xl p-7 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="vendor-gate-name" className="text-xs font-bold text-[#0d212c]">
                Vendor Name <span className="text-red-500">*</span>
              </label>
              <input
                id="vendor-gate-name"
                type="text"
                placeholder="Enter vendor name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`${FIELD} border-[#e2e8f0] focus:border-[#36c0c9]`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <label htmlFor="vendor-gate-email" className="text-xs font-bold text-[#0d212c]">
                  Vendor Email ID <span className="text-red-500">*</span>
                </label>
                <div className="relative group cursor-pointer">
                  <Info className="w-3.5 h-3.5 text-[#64748b] hover:text-[#0d212c] transition" />
                  <div
                    className={`${PROTOTYPE_TIP} transition-opacity duration-200 absolute left-1/2 -translate-x-1/2 bottom-6 z-50 w-64 bg-[#0d212c] text-white text-xs p-3 rounded-xl shadow-xl border border-white/10 text-left leading-relaxed font-normal`}
                  >
                    A 4-digit OTP will be sent to your email for verification.
                  </div>
                </div>
                <div className="relative group ml-auto">
                  <span className="text-[10px] text-[#94a3b8] font-normal cursor-help">
                    Test email: {RECIPIENT_EMAILS[0]}
                  </span>
                  <div
                    className={`${PROTOTYPE_TIP} transition-opacity duration-200 absolute right-0 bottom-full mb-2 z-50 w-64 bg-[#0d212c] text-white text-[11px] p-2.5 rounded-xl shadow-xl border border-white/10 text-center leading-tight font-normal`}
                  >
                    This test email ID is added for testing purposes only, do not include it in the
                    final prototype.
                  </div>
                </div>
              </div>
              <input
                id="vendor-gate-email"
                type="email"
                placeholder="e.g. contact@vendor.com"
                value={email}
                aria-invalid={emailError ? true : undefined}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (emailError) setEmailError('')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canSend) sendOtp()
                }}
                className={`${FIELD} ${
                  emailError
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-[#e2e8f0] focus:border-[#36c0c9]'
                }`}
              />
              {emailError && (
                <p
                  role="alert"
                  className="flex items-start gap-1.5 text-[11px] text-red-500 font-medium leading-snug animate-in fade-in duration-150"
                >
                  <Info className="w-3.5 h-3.5 shrink-0 mt-px" />
                  {emailError}
                </p>
              )}
            </div>

            <button
              id="vendor-gate-send-otp"
              disabled={!canSend}
              onClick={sendOtp}
              className="w-full bg-[#36c0c9] hover:bg-[#2badb6] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm py-3 rounded-lg transition cursor-pointer border-0 shadow-md mt-1"
            >
              Send OTP
            </button>
          </div>
        </div>
      ) : (
        <div className="relative w-full max-w-[420px]">
          <div className="mb-6 text-center flex flex-col items-center gap-1">
            <h1 className="text-2xl font-extrabold text-[#0d212c] leading-tight">Enter OTP Code</h1>
            <p className="text-xs text-[#64748b] font-medium">
              OTP sent to <span className="font-semibold text-[#0d212c]">{email}</span>
              <span className="inline-block mx-1.5 text-gray-300">•</span>
              <span className="text-[#0d7280] font-semibold">Valid for 5 minutes</span>
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-xl p-7 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0d212c]">4-Digit Verification Code</span>
              <span className="text-[10px] text-[#0d7280] font-extrabold bg-[#ddf7f9] px-2 py-0.5 rounded-md border border-[#36c0c9]/30">
                Demo OTP: {DEMO_OTP}
              </span>
            </div>

            <div className="flex items-center justify-center gap-3 my-2">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    otpRefs.current[index] = el
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  aria-label={`OTP digit ${index + 1}`}
                  value={digit}
                  onChange={(e) => changeDigit(index, e.target.value)}
                  onKeyDown={(e) => digitKeyDown(index, e)}
                  className={`w-12 h-14 rounded-md border text-center text-xl font-extrabold text-[#0d212c] outline-none transition ${
                    otpError
                      ? 'border-red-500 bg-red-50/50 focus:border-red-600'
                      : 'border-[#e2e8f0] bg-[#f8fafc] focus:border-[#36c0c9]'
                  }`}
                />
              ))}
            </div>

            {otpError && (
              <p className="text-xs text-red-600 font-semibold text-center animate-in fade-in duration-150">
                {otpError}
              </p>
            )}

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
                    setDigits(Array(OTP_LENGTH).fill(''))
                    setOtpError('')
                    setResendTimer(RESEND_SECONDS)
                  }}
                  className="font-bold text-[#36c0c9] hover:text-[#2badb6] transition cursor-pointer bg-transparent border-0 p-0 underline"
                >
                  Resend OTP
                </button>
              )}
            </div>

            <p className="text-[11px] text-[#64748b] leading-relaxed text-center">
              Enter the 4-digit code to verify your identity and open the follow-up questions.{' '}
              <span className="font-semibold text-[#0d212c]">
                Note: This OTP is valid for 5 minutes only.
              </span>
            </p>

            <button
              id="vendor-gate-verify-otp"
              onClick={verifyOtp}
              className="w-full bg-[#36c0c9] hover:bg-[#2badb6] text-white font-bold text-sm py-3 rounded-lg transition cursor-pointer border-0 shadow-md"
            >
              Verify &amp; Continue
            </button>

            <button
              onClick={() => setStep('details')}
              className="inline-flex items-center justify-center gap-1.5 text-xs text-[#94a3b8] hover:text-[#0d212c] transition cursor-pointer bg-transparent border-0 mt-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to vendor details
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
