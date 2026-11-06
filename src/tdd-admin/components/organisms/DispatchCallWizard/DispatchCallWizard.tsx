/**
 * DispatchCallWizard — Organism
 * Multi-step wizard to configure vendor assessment call, select questionnaire, configure Sam AI voice, and launch.
 * Implements Snapshots 2, 3, 4, and 5 specifications.
 */

'use client'

import React, { useState } from 'react'
import { Check, ChevronDown, Clock, ShieldCheck, ArrowRight, Volume2 } from 'lucide-react'
import { Button } from '@/tdd-admin/components/atoms/Button'
import { CountryFlag } from '@/tdd-admin/components/atoms/CountryFlag'

export interface VendorDispatchData {
  id: string
  name: string
  sublabel: string
  domain: string
  country: string
  flag: string
  email?: string
  recipients?: string[]
}

interface DispatchCallWizardProps {
  vendor: VendorDispatchData
  onClose: () => void
  onComplete: () => void
}

export const DispatchCallWizard: React.FC<DispatchCallWizardProps> = ({
  vendor,
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)

  // Step 1 states
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState('Technical Questionnaire')
  const [roundLabel, setRoundLabel] = useState('Round 1')

  // Step 2 states (Configure Agent)
  const [selectedVoice, setSelectedVoice] = useState('Marin')
  const [showAllVoices, setShowAllVoices] = useState(false)
  const [timing, setTiming] = useState<'now' | 'later'>('now')
  const [timezone, setTimezone] = useState('Asia/Calcutta - GMT+5:30')

  const questionnaireOptions = [
    'Technical Questionnaire',
    'Data Protection & Privacy',
    'Presight Technical & Compliance',
    'Information Security & Compliance',
  ]

  const voiceOptions = [
    {
      id: 'Marin',
      label: 'Marin',
      recommended: true,
      desc: 'Warm and steady. Keeps vendor teams at ease through long sessions.',
    },
    {
      id: 'Ash',
      label: 'Ash',
      recommended: false,
      desc: 'Crisp and direct. Suits fast-moving technical walkthroughs.',
    },
    {
      id: 'Coral',
      label: 'Coral',
      recommended: false,
      desc: 'Bright and encouraging. A good fit for first onboarding sessions.',
    },
  ]

  const extraVoices = ['Alloy', 'Ballad', 'Cedar', 'Echo', 'Sage', 'Shimmer', 'Verse']

  return (
    <div className="fixed inset-0 z-50 bg-[#0d212c]/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#f8fafc] w-full max-w-5xl rounded-3xl border border-[#e2e8f0] shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Header Bar */}
        <div className="bg-white px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[#64748b]">
              Vendors / {vendor.name} / New call
            </span>
            <h1 className="text-xl font-extrabold text-[#0d212c]">Configure vendor call</h1>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9] cursor-pointer"
          >
            Cancel
          </button>
        </div>

        {/* Wizard Main Container */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: CALL SETUP STEPS (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col gap-4">
              <span className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider">
                CALL SETUP
              </span>

              <div className="flex flex-col gap-4">
                {/* Step 1 Indicator */}
                <div
                  className={`flex items-start gap-3 cursor-pointer ${
                    currentStep === 1 ? 'opacity-100' : 'opacity-70'
                  }`}
                  onClick={() => setCurrentStep(1)}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      currentStep === 1
                        ? 'bg-[#36c0c9] text-[#0d212c]'
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
                <div
                  className={`flex items-start gap-3 cursor-pointer ${
                    currentStep === 2 ? 'opacity-100' : 'opacity-70'
                  }`}
                  onClick={() => setCurrentStep(2)}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      currentStep === 2
                        ? 'bg-[#36c0c9] text-[#0d212c]'
                        : currentStep > 2
                          ? 'bg-[#137333] text-white'
                          : 'bg-[#e2e8f0] text-[#64748b]'
                    }`}
                  >
                    {currentStep > 2 ? <Check className="w-4 h-4" /> : '02'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#0d212c]">02 Configure Sam</span>
                    <span className="text-[11px] text-[#64748b]">Sam&apos;s voice & timing</span>
                  </div>
                </div>

                {/* Step 3 Indicator */}
                <div
                  className={`flex items-start gap-3 cursor-pointer ${
                    currentStep === 3 ? 'opacity-100' : 'opacity-70'
                  }`}
                  onClick={() => setCurrentStep(3)}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      currentStep === 3
                        ? 'bg-[#36c0c9] text-[#0d212c]'
                        : 'bg-[#e2e8f0] text-[#64748b]'
                    }`}
                  >
                    03
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#0d212c]">03 Review & launch</span>
                    <span className="text-[11px] text-[#64748b]">Confirm and start</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] text-xs text-[#64748b]">
              <span className="font-bold text-[#0d212c] block mb-1">Need help?</span>
              <a href="#" className="text-[#36c0c9] hover:underline font-semibold">
                View scheduling guide →
              </a>
            </div>
          </div>

          {/* Middle Column: STEP CONTENT (6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            {currentStep === 1 && (
              <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col gap-6">
                <div>
                  <h2 className="text-base font-extrabold text-[#0d212c]">Session setup</h2>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    Choose the session type and source material.
                  </p>
                </div>

                {/* CALL TYPE: Assessment Round Only (Onboarding removed per user instructions) */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider">
                    CALL TYPE
                  </span>
                  <div className="p-4 rounded-2xl border-2 border-[#36c0c9] bg-[#ddf7f9]/20 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-[#36c0c9] shrink-0 mt-0.5" />
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-[#0d212c]">Assessment round</span>
                        <span className="text-[11px] text-[#64748b] mt-0.5">
                          Structured due-diligence interview using an approved questionnaire.
                        </span>
                      </div>
                    </div>
                    <div className="w-4 h-4 rounded-full border-4 border-[#36c0c9] bg-white shrink-0 mt-0.5" />
                  </div>
                </div>

                {/* QUESTIONNAIRE SELECT DROPDOWN (Options from Snapshot 3) */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider">
                    QUESTIONNAIRE
                  </span>
                  <div className="relative">
                    <select
                      value={selectedQuestionnaire}
                      onChange={(e) => setSelectedQuestionnaire(e.target.value)}
                      className="w-full px-4 py-3 rounded-md border border-[#e2e8f0] bg-white text-xs font-semibold text-[#0d212c] appearance-none outline-none focus:border-[#36c0c9]"
                    >
                      {questionnaireOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#64748b] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <span className="text-[11px] text-[#64748b] pl-1">62 questions</span>
                </div>

                {/* Estimated duration box */}
                <div className="p-3.5 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[#64748b]">
                    <Clock className="w-4 h-4 text-[#36c0c9]" />
                    <span>Estimated duration</span>
                  </div>
                  <span className="font-extrabold text-[#0d212c]">135–205 min</span>
                </div>

                {/* ROUND LABEL */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider">
                    ROUND LABEL
                  </span>
                  <input
                    type="text"
                    value={roundLabel}
                    onChange={(e) => setRoundLabel(e.target.value)}
                    placeholder="e.g. Round 1"
                    className="w-full px-4 py-2.5 rounded-md border border-[#e2e8f0] text-xs text-[#0d212c] outline-none focus:border-[#36c0c9]"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between border-t border-[#e2e8f0] pt-4">
                  <button
                    onClick={onClose}
                    className="text-xs font-semibold text-[#64748b] hover:text-[#0d212c]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#0d212c] font-bold text-xs px-5 py-2.5 rounded-lg transition cursor-pointer flex items-center gap-2"
                  >
                    <span>Continue to configure Sam</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col gap-6">
                <div>
                  <h2 className="text-base font-extrabold text-[#0d212c]">Configure Sam</h2>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    Choose Sam&apos;s voice and when the session should begin.
                  </p>
                </div>

                {/* SAM'S VOICE */}
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-extrabold text-[#64748b] uppercase tracking-wider">
                    SAM&apos;S VOICE
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {voiceOptions.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVoice(v.id)}
                        className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between gap-3 ${
                          selectedVoice === v.id
                            ? 'border-[#36c0c9] bg-[#ddf7f9]/20'
                            : 'border-[#e2e8f0] bg-white hover:border-[#cbd5e1]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="w-8 h-8 rounded-full bg-[#ddf7f9] text-[#36c0c9] flex items-center justify-center">
                            <Volume2 className="w-4 h-4" />
                          </div>
                          {v.recommended && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#ddf7f9] text-[#0f766e]">
                              RECOMMENDED
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="font-bold text-xs text-[#0d212c]">{v.label}</h4>
                          <p className="text-[10px] text-[#64748b] mt-1 line-clamp-2">{v.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* View all 10 voices button (Snapshot 5 feature) */}
                  <button
                    type="button"
                    onClick={() => setShowAllVoices(!showAllVoices)}
                    className="text-xs font-bold text-[#36c0c9] hover:underline text-left cursor-pointer"
                  >
                    {showAllVoices ? 'Hide extra voices' : 'View all 10 voices'}
                  </button>

                  {showAllVoices && (
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
                      {extraVoices.map((ev) => (
                        <button
                          key={ev}
                          type="button"
                          onClick={() => setSelectedVoice(ev)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                            selectedVoice === ev
                              ? 'bg-[#e2e8f0] border-[#0d212c] text-[#0d212c]'
                              : 'bg-white border-[#e2e8f0] text-[#64748b] hover:bg-[#f1f5f9]'
                          }`}
                        >
                          {ev}
                        </button>
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
                      className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col gap-1 ${
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
                      className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col gap-1 ${
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
                      className="w-full px-4 py-2.5 rounded-md border border-[#e2e8f0] bg-white text-xs text-[#0d212c] appearance-none outline-none focus:border-[#36c0c9]"
                    >
                      <option value="Asia/Calcutta - GMT+5:30">Asia/Calcutta - GMT+5:30</option>
                      <option value="Asia/Dubai - GMT+4:00">Asia/Dubai - GMT+4:00</option>
                      <option value="UTC - GMT+0:00">UTC - GMT+0:00</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#64748b] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between border-t border-[#e2e8f0] pt-4">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-xs font-semibold text-[#64748b] hover:text-[#0d212c]"
                  >
                    Back to setup
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#0d212c] font-bold text-xs px-5 py-2.5 rounded-lg transition cursor-pointer flex items-center gap-2"
                  >
                    <span>Continue to review</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="bg-white p-6 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col gap-6">
                <div>
                  <h2 className="text-base font-extrabold text-[#0d212c]">Review & launch</h2>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    Confirm configuration and initiate automated vendor assessment call.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex flex-col gap-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Target vendor:</span>
                    <span className="font-bold text-[#0d212c]">{vendor.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Selected questionnaire:</span>
                    <span className="font-bold text-[#0d212c]">{selectedQuestionnaire}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">AI Voice:</span>
                    <span className="font-bold text-[#0d212c]">{selectedVoice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748b]">Round:</span>
                    <span className="font-bold text-[#0d212c]">{roundLabel}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#e2e8f0] pt-4">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="text-xs font-semibold text-[#64748b] hover:text-[#0d212c]"
                  >
                    Back to voice config
                  </button>
                  <Button
                    onClick={onComplete}
                    className="bg-[#e2e8f0] hover:bg-[#cbd5e1] text-[#0d212c] font-bold text-xs px-6 py-2.5 rounded-lg cursor-pointer"
                  >
                    Launch assessment call
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: CALL SUMMARY BOX (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-xs flex flex-col gap-4 text-xs">
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

              <div className="divide-y divide-[#e2e8f0]/60 flex flex-col">
                <div className="py-2 flex justify-between">
                  <span className="text-[#64748b]">CALL TYPE</span>
                  <span className="font-bold text-[#0d212c]">Assessment round</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[#64748b]">SOURCE</span>
                  <span className="font-bold text-[#0d212c] truncate max-w-[140px]">
                    {selectedQuestionnaire}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[#64748b]">QUESTIONS</span>
                  <span className="font-bold text-[#0d212c]">62</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[#64748b]">VOICE</span>
                  <span className="font-bold text-[#0d212c]">{selectedVoice}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[#64748b]">TIMING</span>
                  <span className="font-bold text-[#0d212c]">
                    {timing === 'now' ? 'Start now' : 'Scheduled'}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-[#64748b]">TIMEZONE</span>
                  <span className="font-bold text-[#0d212c] truncate max-w-[140px]">
                    {timezone}
                  </span>
                </div>
              </div>

              {/* READINESS PROGRESS */}
              <div className="border-t border-[#e2e8f0] pt-3 flex flex-col gap-2">
                <div className="flex justify-between text-[11px]">
                  <span className="font-bold text-[#64748b]">READINESS</span>
                  <span className="font-bold text-[#0d212c]">{currentStep - 1} of 3 complete</span>
                </div>
                <div className="flex flex-col gap-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span>Setup</span>
                    <span
                      className={currentStep > 1 ? 'text-[#137333] font-bold' : 'text-[#64748b]'}
                    >
                      {currentStep > 1 ? 'Complete' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Configure Sam</span>
                    <span
                      className={currentStep > 2 ? 'text-[#137333] font-bold' : 'text-[#64748b]'}
                    >
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
      </div>
    </div>
  )
}
